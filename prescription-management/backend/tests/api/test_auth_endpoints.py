"""
Test cases for Authentication API endpoints
Tests all authentication functionality including login, registration, token management
Module: Authentication API
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.auth_service import AuthService
from app.services.user_service import UserService


class TestAuthenticationEndpoints:
    """Test class for authentication API endpoints"""
    
    def test_health_check(self, client: TestClient):
        """Test server health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        assert "version" in data
    
    def test_api_root(self, client: TestClient):
        """Test API root endpoint"""
        response = client.get("/api/v1/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "endpoints" in data
    
    def test_user_registration_success(
        self, 
        client: TestClient, 
        sample_register_data: dict,
        db_session: Session
    ):
        """Test successful user registration"""
        response = client.post("/api/v1/auth/register", json=sample_register_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == sample_register_data["email"]
        assert data["first_name"] == sample_register_data["first_name"]
        assert data["last_name"] == sample_register_data["last_name"]
        assert data["role"] == sample_register_data["role"]
        assert data["is_active"] is True
        assert "id" in data
        assert "permissions" in data
    
    def test_user_registration_duplicate_email(
        self, 
        client: TestClient, 
        sample_register_data: dict,
        db_session: Session
    ):
        """Test registration with duplicate email"""
        # First registration should succeed
        response1 = client.post("/api/v1/auth/register", json=sample_register_data)
        assert response1.status_code == 200
        
        # Second registration with same email should fail
        response2 = client.post("/api/v1/auth/register", json=sample_register_data)
        assert response2.status_code == 400
        data = response2.json()
        assert "already exists" in data["detail"].lower()
    
    def test_user_registration_invalid_data(self, client: TestClient):
        """Test registration with invalid data"""
        invalid_data = {
            "email": "invalid_email",
            "password": "123",  # Too short
            "confirm_password": "456",  # Doesn't match
            "first_name": "",  # Empty
            "last_name": "Doctor",
            "role": "invalid_role"  # Invalid role
        }
        
        response = client.post("/api/v1/auth/register", json=invalid_data)
        assert response.status_code == 422  # Validation error
    
    def test_user_registration_doctor_without_license(self, client: TestClient):
        """Test doctor registration without license number"""
        doctor_data = {
            "email": "doctor.nolicence@example.com",
            "password": "testpassword123",
            "confirm_password": "testpassword123",
            "first_name": "No",
            "last_name": "License",
            "role": "doctor"
            # Missing license_number
        }
        
        response = client.post("/api/v1/auth/register", json=doctor_data)
        assert response.status_code == 422  # Validation error
    
    def test_user_login_success(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test successful user login"""
        # First, create a user
        user_data = {
            "email": "login.test@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Login",
            "last_name": "Test",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Now test login
        login_data = {
            "email": "login.test@example.com",
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "user" in data
        assert "tokens" in data
        assert "permissions" in data
        
        # Check user data
        assert data["user"]["email"] == login_data["email"]
        assert data["user"]["role"] == "doctor"
        
        # Check tokens
        assert data["tokens"]["access_token"]
        assert data["tokens"]["refresh_token"]
        assert data["tokens"]["token_type"] == "bearer"
        assert data["tokens"]["expires_in"] > 0
        
        # Check permissions
        assert isinstance(data["permissions"], list)
        assert len(data["permissions"]) > 0
    
    def test_user_login_invalid_credentials(self, client: TestClient):
        """Test login with invalid credentials"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401
        data = response.json()
        assert "incorrect" in data["detail"].lower()
    
    def test_user_login_inactive_user(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test login with inactive user"""
        # Create inactive user
        user_data = {
            "email": "inactive.user@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Inactive",
            "last_name": "User",
            "role": "doctor",
            "is_active": False
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Try to login
        login_data = {
            "email": "inactive.user@example.com",
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401
    
    def test_protected_endpoint_without_token(self, client: TestClient):
        """Test accessing protected endpoint without token"""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401
    
    def test_protected_endpoint_with_invalid_token(self, client: TestClient):
        """Test accessing protected endpoint with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401
    
    def test_protected_endpoint_with_valid_token(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test accessing protected endpoint with valid token"""
        # Create user and get token
        user_data = {
            "email": "protected.test@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Protected",
            "last_name": "Test",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Generate token
        access_token = auth_service.create_access_token(user)
        
        # Test protected endpoint
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user.email
        assert data["role"] == user.role
        assert "permissions" in data
    
    def test_token_refresh_success(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test successful token refresh"""
        # Create user and get refresh token
        user_data = {
            "email": "refresh.test@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Refresh",
            "last_name": "Test",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Generate refresh token
        refresh_token = auth_service.create_refresh_token(user)
        
        # Test token refresh
        refresh_data = {"refresh_token": refresh_token}
        response = client.post("/api/v1/auth/refresh", json=refresh_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"]
        assert data["refresh_token"]
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0
    
    def test_token_refresh_invalid_token(self, client: TestClient):
        """Test token refresh with invalid token"""
        refresh_data = {"refresh_token": "invalid_refresh_token"}
        response = client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == 401
    
    def test_get_user_permissions(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test getting user permissions"""
        # Create user and get token
        user_data = {
            "email": "permissions.test@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Permissions",
            "last_name": "Test",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Generate token
        access_token = auth_service.create_access_token(user)
        
        # Test permissions endpoint
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.get("/api/v1/auth/permissions", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "doctor"
        assert "user_id" in data
        assert isinstance(data["permissions"], list)
        assert len(data["permissions"]) > 0
        
        # Verify doctor permissions
        doctor_permissions = data["permissions"]
        assert "read:patients" in doctor_permissions
        assert "write:prescriptions" in doctor_permissions
    
    def test_validate_token_endpoint(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test token validation endpoint"""
        # Create user and get token
        user_data = {
            "email": "validate.test@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Validate",
            "last_name": "Test",
            "role": "admin",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Generate token
        access_token = auth_service.create_access_token(user)
        
        # Test validation endpoint
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.get("/api/v1/auth/validate-token", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["email"] == user.email
        assert data["role"] == user.role
        assert data["is_active"] is True
    
    def test_logout_endpoint(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test logout endpoint"""
        # Create user and get tokens
        user_data = {
            "email": "logout.test@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Logout",
            "last_name": "Test",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Generate tokens
        access_token = auth_service.create_access_token(user)
        refresh_token = auth_service.create_refresh_token(user)
        
        # Test logout
        headers = {"Authorization": f"Bearer {access_token}"}
        logout_data = {"refresh_token": refresh_token}
        response = client.post("/api/v1/auth/logout", headers=headers, json=logout_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "logged out" in data["message"].lower()
    
    def test_change_password_success(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test successful password change"""
        # Create user
        current_password = "currentpassword123"
        user_data = {
            "email": "change.password@example.com",
            "hashed_password": auth_service.hash_password(current_password),
            "first_name": "Change",
            "last_name": "Password",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Generate token
        access_token = auth_service.create_access_token(user)
        
        # Test password change
        headers = {"Authorization": f"Bearer {access_token}"}
        password_data = {
            "current_password": current_password,
            "new_password": "newpassword123",
            "confirm_password": "newpassword123"
        }
        
        response = client.post("/api/v1/auth/change-password", headers=headers, json=password_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "changed successfully" in data["message"].lower()
    
    def test_change_password_wrong_current_password(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test password change with wrong current password"""
        # Create user
        current_password = "currentpassword123"
        user_data = {
            "email": "wrong.current@example.com",
            "hashed_password": auth_service.hash_password(current_password),
            "first_name": "Wrong",
            "last_name": "Current",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Generate token
        access_token = auth_service.create_access_token(user)
        
        # Test password change with wrong current password
        headers = {"Authorization": f"Bearer {access_token}"}
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123"
        }
        
        response = client.post("/api/v1/auth/change-password", headers=headers, json=password_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "incorrect" in data["detail"].lower()
    
    def test_password_reset_request(self, client: TestClient):
        """Test password reset request"""
        reset_data = {"email": "reset.test@example.com"}
        response = client.post("/api/v1/auth/request-password-reset", json=reset_data)
        
        # Should always return 200 for security (don't reveal if email exists)
        assert response.status_code == 200
        data = response.json()
        assert "sent" in data["message"].lower() or "email" in data["message"].lower()
    
    def test_keycloak_endpoints_not_implemented(self, client: TestClient):
        """Test that Keycloak endpoints return not implemented"""
        # Test Keycloak login
        response1 = client.post("/api/v1/auth/keycloak/login")
        assert response1.status_code == 501
        
        # Test Keycloak sync
        response2 = client.post("/api/v1/auth/keycloak/sync")
        assert response2.status_code == 501