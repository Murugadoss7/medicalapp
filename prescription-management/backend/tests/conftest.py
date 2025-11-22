"""
Pytest configuration and shared fixtures
Provides common test setup and utilities
"""

import pytest
import asyncio
from typing import Generator, Dict, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, get_db
from app.services.auth_service import AuthService
from app.services.user_service import UserService

# Import all models to ensure they are registered with Base.metadata
import app.models  # This imports all models


# Test database configuration
TEST_DATABASE_URL = "sqlite:///./test_prescription_management.db"

engine = create_engine(
    TEST_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)


def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def setup_test_db():
    """Setup test database"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(setup_test_db):
    """Database session fixture"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Test client fixture"""
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_service():
    """Authentication service fixture"""
    return AuthService()


@pytest.fixture
def user_service():
    """User service fixture"""
    return UserService()


@pytest.fixture
def sample_user_data() -> Dict[str, Any]:
    """Sample user data for testing"""
    return {
        "email": "test.doctor@example.com",
        "hashed_password": "hashed_password_here",
        "first_name": "Test",
        "last_name": "Doctor",
        "role": "doctor",
        "is_active": True
    }


@pytest.fixture
def sample_register_data() -> Dict[str, Any]:
    """Sample registration data for testing"""
    return {
        "email": "new.doctor@example.com",
        "password": "testpassword123",
        "confirm_password": "testpassword123",
        "first_name": "New",
        "last_name": "Doctor",
        "role": "doctor",
        "license_number": "TEST123456",
        "specialization": "General Medicine"
    }


@pytest.fixture
def sample_login_data() -> Dict[str, Any]:
    """Sample login data for testing"""
    return {
        "email": "test.doctor@example.com",
        "password": "testpassword123"
    }


@pytest.fixture
def admin_user_data() -> Dict[str, Any]:
    """Sample admin user data for testing"""
    return {
        "email": "admin@example.com",
        "hashed_password": "hashed_admin_password",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin",
        "is_active": True
    }


@pytest.fixture
def patient_user_data() -> Dict[str, Any]:
    """Sample patient user data for testing"""
    return {
        "email": "patient@example.com", 
        "hashed_password": "hashed_patient_password",
        "first_name": "Test",
        "last_name": "Patient",
        "role": "patient",
        "is_active": True
    }


@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for test session"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# Test data cleanup helper
@pytest.fixture(autouse=True)
def cleanup_test_data(db_session):
    """Automatically clean up test data after each test"""
    yield
    # Cleanup logic can be added here if needed