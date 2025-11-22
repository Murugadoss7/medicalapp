"""
Test cases for Authentication Service
Tests JWT token management, password hashing, and role-based permissions
Module: Authentication Service
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.schemas.auth import LoginRequest, RegisterRequest


class TestAuthenticationService:
    """Test class for authentication service"""
    
    def test_password_hashing_and_verification(self, auth_service: AuthService):
        """Test password hashing and verification"""
        password = "testpassword123"
        
        # Test hashing
        hashed = auth_service.hash_password(password)
        assert hashed != password
        assert len(hashed) > 0
        
        # Test verification with correct password
        assert auth_service.verify_password(password, hashed) is True
        
        # Test verification with wrong password
        assert auth_service.verify_password("wrongpassword", hashed) is False
    
    def test_password_hashing_different_results(self, auth_service: AuthService):
        """Test that hashing same password gives different results (salt)"""
        password = "testpassword123"
        
        hash1 = auth_service.hash_password(password)
        hash2 = auth_service.hash_password(password)
        
        # Hashes should be different due to salt
        assert hash1 != hash2
        
        # But both should verify correctly
        assert auth_service.verify_password(password, hash1) is True
        assert auth_service.verify_password(password, hash2) is True
    
    def test_create_access_token(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test access token creation"""
        # Create user
        user_data = {
            "email": "token.test@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Token",
            "last_name": "Test",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Create token
        token = auth_service.create_access_token(user)
        
        assert token
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Verify token
        payload = auth_service.verify_token(token)
        assert payload is not None
        assert payload["user_id"] == str(user.id)
        assert payload["email"] == user.email
        assert payload["role"] == user.role
        assert payload["type"] == "access"
        assert "permissions" in payload
    
    def test_create_refresh_token(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test refresh token creation"""
        # Create user
        user_data = {
            "email": "refresh.test@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Refresh",
            "last_name": "Test",
            "role": "admin",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Create refresh token
        token = auth_service.create_refresh_token(user)
        
        assert token
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Verify token
        payload = auth_service.verify_token(token)
        assert payload is not None
        assert payload["user_id"] == str(user.id)
        assert payload["email"] == user.email
        assert payload["type"] == "refresh"
        # Refresh tokens don't have permissions
        assert "permissions" not in payload
    
    def test_verify_invalid_token(self, auth_service: AuthService):
        """Test verifying invalid tokens"""
        # Test completely invalid token
        assert auth_service.verify_token("invalid_token") is None
        
        # Test empty token
        assert auth_service.verify_token("") is None
        
        # Test malformed JWT
        assert auth_service.verify_token("header.payload.signature") is None
    
    def test_token_expiration(self, auth_service: AuthService):
        """Test token expiration handling"""
        import jwt
        from datetime import datetime, timedelta
        
        # Create expired token manually
        expired_payload = {
            "sub": "test-user-id",
            "user_id": "test-user-id",
            "email": "test@example.com",
            "exp": datetime.utcnow() - timedelta(hours=1),  # Expired 1 hour ago
            "type": "access"
        }
        
        expired_token = jwt.encode(
            expired_payload, 
            auth_service.secret_key, 
            algorithm=auth_service.algorithm
        )
        
        # Verify should return None for expired token
        assert auth_service.verify_token(expired_token) is None
    
    def test_role_permissions_mapping(self, auth_service: AuthService):
        """Test role-based permissions mapping"""
        # Test all defined roles
        roles_and_permissions = [
            ("super_admin", ["admin:all", "read:all", "write:all", "delete:all"]),
            ("admin", ["read:users", "write:users", "admin:system"]),
            ("doctor", ["read:patients", "write:prescriptions"]),
            ("nurse", ["read:patients", "read:appointments"]),
            ("receptionist", ["read:patients", "write:appointments"]),
            ("patient", ["read:own_data", "read:own_prescriptions"])
        ]
        
        for role, expected_permissions in roles_and_permissions:
            permissions = auth_service.get_role_permissions(role)
            assert isinstance(permissions, list)
            assert len(permissions) > 0
            
            # Check that expected permissions are present
            for expected_perm in expected_permissions:
                if expected_perm in permissions:
                    assert True
                    break
            else:
                # At least some expected permissions should be present
                common_perms = set(permissions) & set(expected_permissions)
                assert len(common_perms) > 0, f"No expected permissions found for role {role}"
    
    def test_permission_checking(self, auth_service: AuthService):
        """Test permission checking logic"""
        # Test super admin has all permissions
        assert auth_service.check_permission("super_admin", "any:permission") is True
        assert auth_service.check_permission("super_admin", "read:patients") is True
        
        # Test doctor permissions
        assert auth_service.check_permission("doctor", "read:patients") is True
        assert auth_service.check_permission("doctor", "write:prescriptions") is True
        assert auth_service.check_permission("doctor", "admin:system") is False
        
        # Test patient permissions
        assert auth_service.check_permission("patient", "read:own_data") is True
        assert auth_service.check_permission("patient", "write:prescriptions") is False
        
        # Test invalid role
        assert auth_service.check_permission("invalid_role", "read:patients") is False
    
    def test_authenticate_user_success(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test successful user authentication"""
        password = "testpassword123"
        
        # Create user
        user_data = {
            "email": "auth.test@example.com",
            "hashed_password": auth_service.hash_password(password),
            "first_name": "Auth",
            "last_name": "Test",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Test authentication
        authenticated_user = auth_service.authenticate_user(
            db_session, 
            "auth.test@example.com", 
            password
        )
        
        assert authenticated_user is not None
        assert authenticated_user.id == user.id
        assert authenticated_user.email == user.email
    
    def test_authenticate_user_wrong_password(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test authentication with wrong password"""
        # Create user
        user_data = {
            "email": "wrongpass.test@example.com",
            "hashed_password": auth_service.hash_password("correctpassword"),
            "first_name": "WrongPass",
            "last_name": "Test",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Test authentication with wrong password
        authenticated_user = auth_service.authenticate_user(
            db_session, 
            "wrongpass.test@example.com", 
            "wrongpassword"
        )
        
        assert authenticated_user is None
    
    def test_authenticate_user_nonexistent_email(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test authentication with non-existent email"""
        authenticated_user = auth_service.authenticate_user(
            db_session, 
            "nonexistent@example.com", 
            "anypassword"
        )
        
        assert authenticated_user is None
    
    def test_authenticate_user_inactive(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test authentication with inactive user"""
        password = "testpassword123"
        
        # Create inactive user
        user_data = {
            "email": "inactive.auth@example.com",
            "hashed_password": auth_service.hash_password(password),
            "first_name": "Inactive",
            "last_name": "Auth",
            "role": "doctor",
            "is_active": False  # Inactive
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Test authentication
        authenticated_user = auth_service.authenticate_user(
            db_session, 
            "inactive.auth@example.com", 
            password
        )
        
        assert authenticated_user is None
    
    @pytest.mark.asyncio
    async def test_login_success(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test successful login flow"""
        password = "testpassword123"
        
        # Create user
        user_data = {
            "email": "login.flow@example.com",
            "hashed_password": auth_service.hash_password(password),
            "first_name": "Login",
            "last_name": "Flow",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Test login
        login_request = LoginRequest(
            email="login.flow@example.com",
            password=password
        )
        
        login_response = await auth_service.login(db_session, login_request)
        
        assert login_response is not None
        assert login_response.user.email == user.email
        assert login_response.user.role == user.role
        assert login_response.tokens.access_token
        assert login_response.tokens.refresh_token
        assert len(login_response.permissions) > 0
    
    @pytest.mark.asyncio
    async def test_login_failure(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test login failure"""
        login_request = LoginRequest(
            email="nonexistent@example.com",
            password="wrongpassword"
        )
        
        login_response = await auth_service.login(db_session, login_request)
        
        assert login_response is None
    
    def test_refresh_access_token_success(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test successful token refresh"""
        # Create user
        user_data = {
            "email": "refresh.success@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Refresh",
            "last_name": "Success",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Create refresh token
        refresh_token = auth_service.create_refresh_token(user)
        
        # Test token refresh
        new_tokens = auth_service.refresh_access_token(refresh_token, db_session)
        
        assert new_tokens is not None
        assert new_tokens.access_token
        assert new_tokens.refresh_token
        assert new_tokens.token_type == "bearer"
        assert new_tokens.expires_in > 0
    
    def test_refresh_access_token_invalid_token(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test token refresh with invalid refresh token"""
        new_tokens = auth_service.refresh_access_token("invalid_token", db_session)
        assert new_tokens is None
    
    def test_refresh_access_token_access_token_used(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test token refresh using access token instead of refresh token"""
        # Create user
        user_data = {
            "email": "refresh.wrong@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Refresh",
            "last_name": "Wrong",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Create access token (not refresh token)
        access_token = auth_service.create_access_token(user)
        
        # Try to refresh using access token
        new_tokens = auth_service.refresh_access_token(access_token, db_session)
        assert new_tokens is None
    
    def test_get_current_user_success(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test getting current user from valid token"""
        # Create user
        user_data = {
            "email": "current.user@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Current",
            "last_name": "User",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Create token
        access_token = auth_service.create_access_token(user)
        
        # Get current user
        current_user = auth_service.get_current_user(db_session, access_token)
        
        assert current_user is not None
        assert current_user.id == user.id
        assert current_user.email == user.email
        assert current_user.is_active is True
    
    def test_get_current_user_invalid_token(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test getting current user with invalid token"""
        current_user = auth_service.get_current_user(db_session, "invalid_token")
        assert current_user is None
    
    def test_get_current_user_inactive_user(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test getting current user when user is inactive"""
        # Create user
        user_data = {
            "email": "inactive.current@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Inactive",
            "last_name": "Current",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Create token while user is active
        access_token = auth_service.create_access_token(user)
        
        # Deactivate user
        user_service.deactivate_user(db_session, user.id)
        
        # Try to get current user with token from when user was active
        current_user = auth_service.get_current_user(db_session, access_token)
        assert current_user is None
    
    def test_generate_password_reset_token(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test password reset token generation"""
        # Create user
        user_data = {
            "email": "reset.token@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Reset",
            "last_name": "Token",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Generate reset token
        reset_token = auth_service.generate_password_reset_token(user)
        
        assert reset_token
        assert isinstance(reset_token, str)
        
        # Verify reset token
        email = auth_service.verify_password_reset_token(reset_token)
        assert email == user.email
    
    def test_verify_invalid_password_reset_token(self, auth_service: AuthService):
        """Test verifying invalid password reset token"""
        email = auth_service.verify_password_reset_token("invalid_token")
        assert email is None
    
    def test_reset_password_success(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test successful password reset"""
        old_password = "oldpassword123"
        new_password = "newpassword123"
        
        # Create user
        user_data = {
            "email": "reset.pass@example.com",
            "hashed_password": auth_service.hash_password(old_password),
            "first_name": "Reset",
            "last_name": "Pass",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Reset password
        success = auth_service.reset_password(db_session, user.email, new_password)
        assert success is True
        
        # Verify old password no longer works
        auth_user = auth_service.authenticate_user(db_session, user.email, old_password)
        assert auth_user is None
        
        # Verify new password works
        auth_user = auth_service.authenticate_user(db_session, user.email, new_password)
        assert auth_user is not None
        assert auth_user.id == user.id
    
    def test_reset_password_nonexistent_user(
        self, 
        auth_service: AuthService,
        db_session: Session
    ):
        """Test password reset for non-existent user"""
        success = auth_service.reset_password(
            db_session, 
            "nonexistent@example.com", 
            "newpassword123"
        )
        assert success is False