"""
Test cases for User Service
Tests user CRUD operations, search functionality, and user management
Module: User Service
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.user_service import UserService
from app.schemas.user import UserUpdate, UserFilters


class TestUserService:
    """Test class for user service"""
    
    def test_create_user_success(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test successful user creation"""
        user = user_service.create_user(db_session, sample_user_data)
        
        assert user is not None
        assert user.email == sample_user_data["email"]
        assert user.first_name == sample_user_data["first_name"]
        assert user.last_name == sample_user_data["last_name"]
        assert user.role == sample_user_data["role"]
        assert user.is_active == sample_user_data["is_active"]
        assert user.id is not None
        assert user.created_at is not None
        assert user.updated_at is not None
    
    def test_get_user_by_id_success(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test getting user by ID"""
        # Create user first
        created_user = user_service.create_user(db_session, sample_user_data)
        
        # Get user by ID
        retrieved_user = user_service.get_user_by_id(db_session, created_user.id)
        
        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.email == created_user.email
        assert retrieved_user.first_name == created_user.first_name
    
    def test_get_user_by_id_not_found(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test getting user by non-existent ID"""
        import uuid
        non_existent_id = uuid.uuid4()
        
        retrieved_user = user_service.get_user_by_id(db_session, non_existent_id)
        assert retrieved_user is None
    
    def test_get_user_by_id_inactive_user(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test getting inactive user by ID returns None"""
        # Create inactive user
        sample_user_data["is_active"] = False
        created_user = user_service.create_user(db_session, sample_user_data)
        
        # Try to get inactive user
        retrieved_user = user_service.get_user_by_id(db_session, created_user.id)
        assert retrieved_user is None
    
    def test_get_user_by_email_success(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test getting user by email"""
        # Create user first
        created_user = user_service.create_user(db_session, sample_user_data)
        
        # Get user by email
        retrieved_user = user_service.get_user_by_email(db_session, created_user.email)
        
        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.email == created_user.email
    
    def test_get_user_by_email_not_found(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test getting user by non-existent email"""
        retrieved_user = user_service.get_user_by_email(db_session, "nonexistent@example.com")
        assert retrieved_user is None
    
    def test_get_user_by_keycloak_id_success(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test getting user by Keycloak ID"""
        # Add Keycloak ID to user data
        sample_user_data["keycloak_id"] = "test-keycloak-123"
        created_user = user_service.create_user(db_session, sample_user_data)
        
        # Get user by Keycloak ID
        retrieved_user = user_service.get_user_by_keycloak_id(db_session, "test-keycloak-123")
        
        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.keycloak_id == "test-keycloak-123"
    
    def test_update_user_success(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test successful user update"""
        # Create user first
        created_user = user_service.create_user(db_session, sample_user_data)
        original_updated_at = created_user.updated_at
        
        # Update user
        update_data = UserUpdate(
            first_name="Updated",
            last_name="Name",
            email="updated@example.com"
        )
        
        updated_user = user_service.update_user(db_session, created_user.id, update_data)
        
        assert updated_user is not None
        assert updated_user.id == created_user.id
        assert updated_user.first_name == "Updated"
        assert updated_user.last_name == "Name"
        assert updated_user.email == "updated@example.com"
        assert updated_user.role == created_user.role  # Should remain unchanged
        assert updated_user.updated_at > original_updated_at
    
    def test_update_user_partial_update(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test partial user update"""
        # Create user first
        created_user = user_service.create_user(db_session, sample_user_data)
        
        # Update only first name
        update_data = UserUpdate(first_name="PartialUpdate")
        
        updated_user = user_service.update_user(db_session, created_user.id, update_data)
        
        assert updated_user is not None
        assert updated_user.first_name == "PartialUpdate"
        assert updated_user.last_name == created_user.last_name  # Should remain unchanged
        assert updated_user.email == created_user.email  # Should remain unchanged
    
    def test_update_user_not_found(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test updating non-existent user"""
        import uuid
        non_existent_id = uuid.uuid4()
        
        update_data = UserUpdate(first_name="Updated")
        updated_user = user_service.update_user(db_session, non_existent_id, update_data)
        
        assert updated_user is None
    
    def test_update_last_login(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test updating last login timestamp"""
        # Create user first
        created_user = user_service.create_user(db_session, sample_user_data)
        assert created_user.last_login is None
        
        # Update last login
        user_service.update_last_login(db_session, created_user.id)
        
        # Refresh user from database
        db_session.refresh(created_user)
        
        assert created_user.last_login is not None
        assert isinstance(created_user.last_login, datetime)
    
    def test_deactivate_user_success(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test successful user deactivation"""
        # Create active user
        created_user = user_service.create_user(db_session, sample_user_data)
        assert created_user.is_active is True
        
        # Deactivate user
        success = user_service.deactivate_user(db_session, created_user.id)
        
        assert success is True
        
        # Verify user is deactivated
        db_session.refresh(created_user)
        assert created_user.is_active is False
    
    def test_deactivate_user_not_found(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test deactivating non-existent user"""
        import uuid
        non_existent_id = uuid.uuid4()
        
        success = user_service.deactivate_user(db_session, non_existent_id)
        assert success is False
    
    def test_activate_user_success(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test successful user activation"""
        # Create inactive user
        sample_user_data["is_active"] = False
        created_user = user_service.create_user(db_session, sample_user_data)
        assert created_user.is_active is False
        
        # Activate user
        success = user_service.activate_user(db_session, created_user.id)
        
        assert success is True
        
        # Verify user is activated
        db_session.refresh(created_user)
        assert created_user.is_active is True
    
    def test_activate_user_not_found(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test activating non-existent user"""
        import uuid
        non_existent_id = uuid.uuid4()
        
        success = user_service.activate_user(db_session, non_existent_id)
        assert success is False
    
    def test_get_users_list_basic(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test getting basic users list"""
        # Create multiple users
        users_data = [
            {
                "email": f"user{i}@example.com",
                "hashed_password": "hashed_password",
                "first_name": f"User{i}",
                "last_name": "Test",
                "role": "doctor" if i % 2 == 0 else "nurse",
                "is_active": True
            }
            for i in range(5)
        ]
        
        for user_data in users_data:
            user_service.create_user(db_session, user_data)
        
        # Get users list
        filters = UserFilters(page=1, limit=10)
        users, total = user_service.get_users_list(db_session, filters)
        
        assert len(users) == 5
        assert total == 5
        assert all(user.is_active for user in users)
    
    def test_get_users_list_with_role_filter(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test getting users list with role filter"""
        # Create users with different roles
        doctor_data = {
            "email": "doctor@example.com",
            "hashed_password": "hashed_password",
            "first_name": "Doctor",
            "last_name": "Test",
            "role": "doctor",
            "is_active": True
        }
        user_service.create_user(db_session, doctor_data)
        
        nurse_data = {
            "email": "nurse@example.com",
            "hashed_password": "hashed_password",
            "first_name": "Nurse",
            "last_name": "Test",
            "role": "nurse",
            "is_active": True
        }
        user_service.create_user(db_session, nurse_data)
        
        # Filter by doctor role
        filters = UserFilters(role="doctor", page=1, limit=10)
        users, total = user_service.get_users_list(db_session, filters)
        
        assert total >= 1
        assert all(user.role == "doctor" for user in users)
    
    def test_get_users_list_with_search_filter(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test getting users list with search filter"""
        # Create users with searchable names
        john_data = {
            "email": "john.doe@example.com",
            "hashed_password": "hashed_password",
            "first_name": "John",
            "last_name": "Doe",
            "role": "doctor",
            "is_active": True
        }
        user_service.create_user(db_session, john_data)
        
        jane_data = {
            "email": "jane.smith@example.com",
            "hashed_password": "hashed_password",
            "first_name": "Jane",
            "last_name": "Smith",
            "role": "nurse",
            "is_active": True
        }
        user_service.create_user(db_session, jane_data)
        
        # Search for "John"
        filters = UserFilters(search="John", page=1, limit=10)
        users, total = user_service.get_users_list(db_session, filters)
        
        assert total >= 1
        assert any("John" in user.first_name for user in users)
    
    def test_get_users_list_with_pagination(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test users list pagination"""
        # Create multiple users
        for i in range(15):
            user_data = {
                "email": f"page{i}@example.com",
                "hashed_password": "hashed_password",
                "first_name": f"Page{i}",
                "last_name": "Test",
                "role": "doctor",
                "is_active": True
            }
            user_service.create_user(db_session, user_data)
        
        # Get first page (limit 10)
        filters = UserFilters(page=1, limit=10)
        page1_users, total = user_service.get_users_list(db_session, filters)
        
        assert len(page1_users) == 10
        assert total == 15
        
        # Get second page
        filters = UserFilters(page=2, limit=10)
        page2_users, total = user_service.get_users_list(db_session, filters)
        
        assert len(page2_users) == 5
        assert total == 15
        
        # Ensure no overlap between pages
        page1_ids = {user.id for user in page1_users}
        page2_ids = {user.id for user in page2_users}
        assert len(page1_ids & page2_ids) == 0
    
    def test_get_users_by_role(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test getting users by specific role"""
        # Create users with different roles
        for role in ["doctor", "nurse", "admin"]:
            user_data = {
                "email": f"{role}@example.com",
                "hashed_password": "hashed_password",
                "first_name": role.title(),
                "last_name": "Test",
                "role": role,
                "is_active": True
            }
            user_service.create_user(db_session, user_data)
        
        # Get doctors only
        doctors = user_service.get_users_by_role(db_session, "doctor")
        
        assert len(doctors) >= 1
        assert all(user.role == "doctor" for user in doctors)
        assert all(user.is_active for user in doctors)
    
    def test_search_users(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test user search functionality"""
        # Create searchable users
        users_data = [
            {
                "email": "john.doe@example.com",
                "hashed_password": "hashed_password",
                "first_name": "John",
                "last_name": "Doe",
                "role": "doctor",
                "is_active": True
            },
            {
                "email": "jane.doe@example.com",
                "hashed_password": "hashed_password",
                "first_name": "Jane",
                "last_name": "Doe",
                "role": "nurse",
                "is_active": True
            },
            {
                "email": "bob.smith@example.com",
                "hashed_password": "hashed_password",
                "first_name": "Bob",
                "last_name": "Smith",
                "role": "admin",
                "is_active": True
            }
        ]
        
        for user_data in users_data:
            user_service.create_user(db_session, user_data)
        
        # Search by first name
        results = user_service.search_users(db_session, "John", limit=10)
        assert len(results) >= 1
        assert any("John" in user.first_name for user in results)
        
        # Search by last name
        results = user_service.search_users(db_session, "Doe", limit=10)
        assert len(results) >= 2
        assert all("Doe" in user.last_name for user in results)
        
        # Search by email
        results = user_service.search_users(db_session, "jane.doe", limit=10)
        assert len(results) >= 1
        assert any("jane.doe" in user.email for user in results)
    
    def test_get_user_statistics(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test getting user statistics"""
        # Create users with different roles and statuses
        users_data = [
            ("doctor1@example.com", "doctor", True),
            ("doctor2@example.com", "doctor", True),
            ("nurse1@example.com", "nurse", True),
            ("admin1@example.com", "admin", True),
            ("inactive@example.com", "doctor", False)
        ]
        
        for email, role, is_active in users_data:
            user_data = {
                "email": email,
                "hashed_password": "hashed_password",
                "first_name": "Test",
                "last_name": "User",
                "role": role,
                "is_active": is_active
            }
            user_service.create_user(db_session, user_data)
        
        # Get statistics
        stats = user_service.get_user_statistics(db_session)
        
        assert "total_users" in stats
        assert "role_counts" in stats
        assert "recent_registrations" in stats
        assert "active_users" in stats
        
        assert stats["total_users"] >= 4  # Only active users
        assert stats["role_counts"]["doctor"] >= 2
        assert stats["role_counts"]["nurse"] >= 1
        assert stats["role_counts"]["admin"] >= 1
        assert stats["recent_registrations"] >= 4
    
    def test_change_user_password(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test changing user password"""
        # Create user
        created_user = user_service.create_user(db_session, sample_user_data)
        original_password = created_user.hashed_password
        
        # Change password
        new_hashed_password = "new_hashed_password_here"
        success = user_service.change_user_password(db_session, created_user.id, new_hashed_password)
        
        assert success is True
        
        # Verify password changed
        db_session.refresh(created_user)
        assert created_user.hashed_password == new_hashed_password
        assert created_user.hashed_password != original_password
    
    def test_change_user_password_not_found(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test changing password for non-existent user"""
        import uuid
        non_existent_id = uuid.uuid4()
        
        success = user_service.change_user_password(db_session, non_existent_id, "new_password")
        assert success is False
    
    def test_validate_user_email_unique_success(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test email uniqueness validation - unique email"""
        # Test with completely new email
        is_unique = user_service.validate_user_email_unique(db_session, "unique@example.com")
        assert is_unique is True
    
    def test_validate_user_email_unique_duplicate(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test email uniqueness validation - duplicate email"""
        # Create user first
        created_user = user_service.create_user(db_session, sample_user_data)
        
        # Test with existing email
        is_unique = user_service.validate_user_email_unique(db_session, created_user.email)
        assert is_unique is False
    
    def test_validate_user_email_unique_exclude_self(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test email uniqueness validation - excluding self"""
        # Create user first
        created_user = user_service.create_user(db_session, sample_user_data)
        
        # Test with existing email but excluding the user themselves
        is_unique = user_service.validate_user_email_unique(
            db_session, 
            created_user.email, 
            exclude_user_id=created_user.id
        )
        assert is_unique is True
    
    def test_get_user_permissions(
        self, 
        user_service: UserService,
        db_session: Session,
        sample_user_data: dict
    ):
        """Test getting user permissions"""
        # Create user
        created_user = user_service.create_user(db_session, sample_user_data)
        
        # Get permissions
        permissions = user_service.get_user_permissions(db_session, created_user.id)
        
        assert isinstance(permissions, list)
        assert len(permissions) > 0
        
        # Should include doctor permissions
        assert any("read:patients" in perm for perm in permissions)
    
    def test_get_user_permissions_nonexistent_user(
        self, 
        user_service: UserService,
        db_session: Session
    ):
        """Test getting permissions for non-existent user"""
        import uuid
        non_existent_id = uuid.uuid4()
        
        permissions = user_service.get_user_permissions(db_session, non_existent_id)
        assert permissions == []