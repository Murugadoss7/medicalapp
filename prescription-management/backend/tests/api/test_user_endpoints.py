"""
Test cases for User Management API endpoints
Tests user CRUD operations, role management, and user administration
Module: User Management API
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.auth_service import AuthService
from app.services.user_service import UserService


class TestUserManagementEndpoints:
    """Test class for user management API endpoints"""
    
    def test_get_my_profile(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test getting current user's profile"""
        # Create user
        user_data = {
            "email": "profile.test@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Profile",
            "last_name": "Test",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Generate token
        access_token = auth_service.create_access_token(user)
        
        # Test profile endpoint
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.get("/api/v1/users/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user.email
        assert data["first_name"] == user.first_name
        assert data["last_name"] == user.last_name
        assert data["role"] == user.role
        assert data["full_name"] == f"{user.first_name} {user.last_name}"
        assert "permissions" in data
    
    def test_update_my_profile_success(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test successful profile update"""
        # Create user
        user_data = {
            "email": "update.profile@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Update",
            "last_name": "Profile",
            "role": "doctor",
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Generate token
        access_token = auth_service.create_access_token(user)
        
        # Test profile update
        headers = {"Authorization": f"Bearer {access_token}"}
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "email": "updated.profile@example.com"
        }
        
        response = client.put("/api/v1/users/me", headers=headers, json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Updated"
        assert data["last_name"] == "Name"
        assert data["email"] == "updated.profile@example.com"
        assert data["full_name"] == "Updated Name"
    
    def test_update_profile_duplicate_email(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test profile update with duplicate email"""
        user_service = UserService()
        
        # Create first user
        user1_data = {
            "email": "user1@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "User",
            "last_name": "One",
            "role": "doctor",
            "is_active": True
        }
        user1 = user_service.create_user(db_session, user1_data)
        
        # Create second user
        user2_data = {
            "email": "user2@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "User",
            "last_name": "Two",
            "role": "doctor",
            "is_active": True
        }
        user2 = user_service.create_user(db_session, user2_data)
        
        # Generate token for user2
        access_token = auth_service.create_access_token(user2)
        
        # Try to update user2's email to user1's email
        headers = {"Authorization": f"Bearer {access_token}"}
        update_data = {"email": "user1@example.com"}
        
        response = client.put("/api/v1/users/me", headers=headers, json=update_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "already exists" in data["detail"].lower()
    
    def test_get_users_list_admin_required(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test that getting users list requires admin role"""
        # Create non-admin user
        user_data = {
            "email": "nonadmin@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Non",
            "last_name": "Admin",
            "role": "doctor",  # Not admin
            "is_active": True
        }
        
        user_service = UserService()
        user = user_service.create_user(db_session, user_data)
        
        # Generate token
        access_token = auth_service.create_access_token(user)
        
        # Try to access users list
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.get("/api/v1/users/", headers=headers)
        
        assert response.status_code == 403  # Forbidden
    
    def test_get_users_list_admin_success(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test successful users list retrieval by admin"""
        user_service = UserService()
        
        # Create admin user
        admin_data = {
            "email": "admin@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "is_active": True
        }
        admin = user_service.create_user(db_session, admin_data)
        
        # Create some regular users
        for i in range(3):
            user_data = {
                "email": f"user{i}@example.com",
                "hashed_password": auth_service.hash_password("testpassword123"),
                "first_name": f"User{i}",
                "last_name": "Test",
                "role": "doctor",
                "is_active": True
            }
            user_service.create_user(db_session, user_data)
        
        # Generate admin token
        access_token = auth_service.create_access_token(admin)
        
        # Test users list
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.get("/api/v1/users/", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "has_more" in data
        assert len(data["users"]) >= 4  # Admin + 3 users
    
    def test_get_users_list_with_filters(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test users list with filters"""
        user_service = UserService()
        
        # Create admin user
        admin_data = {
            "email": "filter.admin@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Filter",
            "last_name": "Admin",
            "role": "admin",
            "is_active": True
        }
        admin = user_service.create_user(db_session, admin_data)
        
        # Create users with different roles
        doctor_data = {
            "email": "filter.doctor@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Filter",
            "last_name": "Doctor",
            "role": "doctor",
            "is_active": True
        }
        user_service.create_user(db_session, doctor_data)
        
        nurse_data = {
            "email": "filter.nurse@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Filter",
            "last_name": "Nurse",
            "role": "nurse",
            "is_active": True
        }
        user_service.create_user(db_session, nurse_data)
        
        # Generate admin token
        access_token = auth_service.create_access_token(admin)
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Test role filter
        response = client.get("/api/v1/users/?role=doctor", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len([u for u in data["users"] if u["role"] == "doctor"]) >= 1
        
        # Test search filter
        response = client.get("/api/v1/users/?search=Filter", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["users"]) >= 3  # All have "Filter" in name
        
        # Test active filter
        response = client.get("/api/v1/users/?is_active=true", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert all(u["is_active"] for u in data["users"])
    
    def test_get_user_by_id_admin_required(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test that getting user by ID requires admin role"""
        user_service = UserService()
        
        # Create users
        target_user_data = {
            "email": "target@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Target",
            "last_name": "User",
            "role": "doctor",
            "is_active": True
        }
        target_user = user_service.create_user(db_session, target_user_data)
        
        non_admin_data = {
            "email": "nonadmin2@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Non",
            "last_name": "Admin2",
            "role": "nurse",
            "is_active": True
        }
        non_admin = user_service.create_user(db_session, non_admin_data)
        
        # Generate non-admin token
        access_token = auth_service.create_access_token(non_admin)
        
        # Try to get user by ID
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.get(f"/api/v1/users/{target_user.id}", headers=headers)
        
        assert response.status_code == 403  # Forbidden
    
    def test_get_user_by_id_success(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test successful user retrieval by ID"""
        user_service = UserService()
        
        # Create admin
        admin_data = {
            "email": "getbyid.admin@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "GetById",
            "last_name": "Admin",
            "role": "admin",
            "is_active": True
        }
        admin = user_service.create_user(db_session, admin_data)
        
        # Create target user
        target_data = {
            "email": "getbyid.target@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "GetById",
            "last_name": "Target",
            "role": "doctor",
            "is_active": True
        }
        target_user = user_service.create_user(db_session, target_data)
        
        # Generate admin token
        access_token = auth_service.create_access_token(admin)
        
        # Test get user by ID
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.get(f"/api/v1/users/{target_user.id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(target_user.id)
        assert data["email"] == target_user.email
        assert data["first_name"] == target_user.first_name
        assert data["role"] == target_user.role
    
    def test_update_user_by_id_admin_required(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test that updating user by ID requires admin role"""
        user_service = UserService()
        
        # Create users
        target_user_data = {
            "email": "updatetarget@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Update",
            "last_name": "Target",
            "role": "doctor",
            "is_active": True
        }
        target_user = user_service.create_user(db_session, target_user_data)
        
        non_admin_data = {
            "email": "nonadmin3@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Non",
            "last_name": "Admin3",
            "role": "doctor",
            "is_active": True
        }
        non_admin = user_service.create_user(db_session, non_admin_data)
        
        # Generate non-admin token
        access_token = auth_service.create_access_token(non_admin)
        
        # Try to update user
        headers = {"Authorization": f"Bearer {access_token}"}
        update_data = {"first_name": "Updated"}
        response = client.put(f"/api/v1/users/{target_user.id}", headers=headers, json=update_data)
        
        assert response.status_code == 403  # Forbidden
    
    def test_update_user_by_id_success(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test successful user update by admin"""
        user_service = UserService()
        
        # Create admin
        admin_data = {
            "email": "update.admin@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Update",
            "last_name": "Admin",
            "role": "admin",
            "is_active": True
        }
        admin = user_service.create_user(db_session, admin_data)
        
        # Create target user
        target_data = {
            "email": "update.target@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Update",
            "last_name": "Target",
            "role": "doctor",
            "is_active": True
        }
        target_user = user_service.create_user(db_session, target_data)
        
        # Generate admin token
        access_token = auth_service.create_access_token(admin)
        
        # Test user update
        headers = {"Authorization": f"Bearer {access_token}"}
        update_data = {
            "first_name": "Updated",
            "role": "nurse",
            "is_active": False
        }
        response = client.put(f"/api/v1/users/{target_user.id}", headers=headers, json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Updated"
        assert data["role"] == "nurse"
        assert data["is_active"] is False
    
    def test_deactivate_user_admin_required(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test that deactivating user requires admin role"""
        user_service = UserService()
        
        # Create users
        target_user_data = {
            "email": "deactivate.target@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Deactivate",
            "last_name": "Target",
            "role": "doctor",
            "is_active": True
        }
        target_user = user_service.create_user(db_session, target_user_data)
        
        non_admin_data = {
            "email": "nonadmin4@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Non",
            "last_name": "Admin4",
            "role": "doctor",
            "is_active": True
        }
        non_admin = user_service.create_user(db_session, non_admin_data)
        
        # Generate non-admin token
        access_token = auth_service.create_access_token(non_admin)
        
        # Try to deactivate user
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.delete(f"/api/v1/users/{target_user.id}", headers=headers)
        
        assert response.status_code == 403  # Forbidden
    
    def test_deactivate_user_success(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test successful user deactivation by admin"""
        user_service = UserService()
        
        # Create admin
        admin_data = {
            "email": "deactivate.admin@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Deactivate",
            "last_name": "Admin",
            "role": "admin",
            "is_active": True
        }
        admin = user_service.create_user(db_session, admin_data)
        
        # Create target user
        target_data = {
            "email": "deactivate.user@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Deactivate",
            "last_name": "User",
            "role": "doctor",
            "is_active": True
        }
        target_user = user_service.create_user(db_session, target_data)
        
        # Generate admin token
        access_token = auth_service.create_access_token(admin)
        
        # Test user deactivation
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.delete(f"/api/v1/users/{target_user.id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "deactivated successfully" in data["message"].lower()
    
    def test_admin_cannot_deactivate_self(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test that admin cannot deactivate their own account"""
        user_service = UserService()
        
        # Create admin
        admin_data = {
            "email": "selfdeactivate.admin@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "SelfDeactivate",
            "last_name": "Admin",
            "role": "admin",
            "is_active": True
        }
        admin = user_service.create_user(db_session, admin_data)
        
        # Generate admin token
        access_token = auth_service.create_access_token(admin)
        
        # Try to deactivate own account
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.delete(f"/api/v1/users/{admin.id}", headers=headers)
        
        assert response.status_code == 400
        data = response.json()
        assert "cannot deactivate your own" in data["detail"].lower()
    
    def test_search_users_by_query(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test user search functionality"""
        user_service = UserService()
        
        # Create admin
        admin_data = {
            "email": "search.admin@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Search",
            "last_name": "Admin",
            "role": "admin",
            "is_active": True
        }
        admin = user_service.create_user(db_session, admin_data)
        
        # Create searchable users
        users_data = [
            {
                "email": "john.doe@example.com",
                "hashed_password": auth_service.hash_password("testpassword123"),
                "first_name": "John",
                "last_name": "Doe",
                "role": "doctor",
                "is_active": True
            },
            {
                "email": "jane.smith@example.com",
                "hashed_password": auth_service.hash_password("testpassword123"),
                "first_name": "Jane",
                "last_name": "Smith",
                "role": "nurse",
                "is_active": True
            }
        ]
        
        for user_data in users_data:
            user_service.create_user(db_session, user_data)
        
        # Generate admin token
        access_token = auth_service.create_access_token(admin)
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Test search by name
        response = client.get("/api/v1/users/search/query?q=John", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any("John" in user["first_name"] for user in data)
        
        # Test search by email
        response = client.get("/api/v1/users/search/query?q=jane.smith", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any("jane.smith" in user["email"] for user in data)
    
    def test_get_role_permissions(
        self, 
        client: TestClient, 
        db_session: Session,
        auth_service: AuthService
    ):
        """Test getting role permissions list"""
        user_service = UserService()
        
        # Create admin
        admin_data = {
            "email": "roles.admin@example.com",
            "hashed_password": auth_service.hash_password("testpassword123"),
            "first_name": "Roles",
            "last_name": "Admin",
            "role": "admin",
            "is_active": True
        }
        admin = user_service.create_user(db_session, admin_data)
        
        # Generate admin token
        access_token = auth_service.create_access_token(admin)
        
        # Test role permissions endpoint
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.get("/api/v1/users/roles/permissions/list", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 6  # Number of roles defined
        
        # Check that all roles are present
        roles = [item["role"] for item in data]
        expected_roles = ["super_admin", "admin", "doctor", "nurse", "receptionist", "patient"]
        for role in expected_roles:
            assert role in roles
        
        # Check structure
        for role_data in data:
            assert "role" in role_data
            assert "permissions" in role_data
            assert "description" in role_data
            assert isinstance(role_data["permissions"], list)