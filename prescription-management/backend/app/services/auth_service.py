"""
Authentication Service
Handles JWT tokens, password verification, and role-based permissions
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.doctor import Doctor
from app.schemas.auth import LoginRequest, TokenResponse, LoginResponse, RegisterRequest
from app.schemas.user import UserResponse
from app.services.user_service import UserService


class AuthService:
    """Authentication service with JWT and role management"""
    
    def __init__(self):
        self.user_service = UserService()
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM
        self.access_token_expire_minutes = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    
    # Password Management
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    
    # JWT Token Management
    def create_access_token(self, user: User) -> str:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        payload = {
            "sub": str(user.id),
            "user_id": str(user.id),
            "email": user.email,
            "role": user.role,
            "permissions": self.get_role_permissions(user.role),
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, user: User) -> str:
        """Create JWT refresh token"""
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        
        payload = {
            "sub": str(user.id),
            "user_id": str(user.id),
            "email": user.email,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except (jwt.PyJWTError, jwt.InvalidTokenError):
            return None
    
    def refresh_access_token(self, refresh_token: str, db: Session) -> Optional[TokenResponse]:
        """Create new access token from refresh token"""
        payload = self.verify_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None
        
        user = self.user_service.get_user_by_id(db, UUID(payload["user_id"]))
        if not user or not user.is_active:
            return None
        
        # Create new tokens
        access_token = self.create_access_token(user)
        new_refresh_token = self.create_refresh_token(user)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=self.access_token_expire_minutes * 60
        )
    
    # Role-Based Permissions
    def get_role_permissions(self, role: str) -> List[str]:
        """Get permissions for a specific role"""
        role_permissions = {
            "super_admin": [
                "admin:all", "read:all", "write:all", "delete:all"
            ],
            "admin": [
                "read:users", "write:users", "read:doctors", "write:doctors",
                "read:patients", "write:patients", "read:appointments", "write:appointments",
                "read:prescriptions", "write:prescriptions", "read:medicines", "write:medicines",
                "read:reports", "admin:system"
            ],
            "doctor": [
                "read:patients", "write:patients", "read:appointments", "write:appointments",
                "read:prescriptions", "write:prescriptions", "read:medicines",
                "read:short_keys", "write:short_keys", "read:medical_history",
                "write:medical_history", "read:own_profile", "write:own_profile"
            ],
            "nurse": [
                "read:patients", "read:appointments", "write:appointments",
                "read:prescriptions", "read:medicines", "read:medical_history"
            ],
            "receptionist": [
                "read:patients", "write:patients", "read:appointments", "write:appointments",
                "read:doctors", "read:medicines"
            ],
            "patient": [
                "read:own_data", "read:family_data", "write:own_appointments",
                "read:own_prescriptions", "read:own_medical_history"
            ]
        }
        
        return role_permissions.get(role, [])
    
    def check_permission(self, user_role: str, required_permission: str) -> bool:
        """Check if user role has required permission"""
        user_permissions = self.get_role_permissions(user_role)
        
        # Super admin has all permissions
        if "admin:all" in user_permissions:
            return True
        
        # Check exact permission
        if required_permission in user_permissions:
            return True
        
        # Check wildcard permissions
        permission_parts = required_permission.split(":")
        if len(permission_parts) == 2:
            wildcard_permission = f"{permission_parts[0]}:all"
            if wildcard_permission in user_permissions:
                return True
        
        return False
    
    # Authentication Methods
    async def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = self.user_service.get_user_by_email(db, email)
        if not user:
            return None
        
        if not user.is_active:
            return None
        
        if not self.verify_password(password, user.hashed_password):
            return None
        
        # Update last login
        self.user_service.update_last_login(db, user.id)
        
        return user
    
    async def login(self, db: Session, login_request: LoginRequest) -> Optional[LoginResponse]:
        """Login user and return tokens"""
        user = await self.authenticate_user(db, login_request.email, login_request.password)
        if not user:
            return None
        
        # Create tokens
        access_token = self.create_access_token(user)
        refresh_token = self.create_refresh_token(user)
        
        tokens = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=self.access_token_expire_minutes * 60
        )
        
        # Get doctor specialization and ID if user is a doctor
        specialization = None
        doctor_id = None
        if user.role == 'doctor':
            from app.models.doctor import Doctor
            print(f"[DEBUG LOGIN] Looking for doctor with user_id: {user.id}")
            doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
            if doctor:
                specialization = doctor.specialization
                doctor_id = doctor.id
                print(f"[DEBUG LOGIN] Found doctor_id: {doctor_id}, is_active: {doctor.is_active}")
            else:
                print(f"[DEBUG LOGIN] No doctor record found for user_id: {user.id}")

        # Convert user to response schema
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            keycloak_id=user.keycloak_id,
            is_active=user.is_active,
            last_login=user.last_login_at,
            created_at=user.created_at,
            updated_at=user.updated_at,
            full_name=user.get_full_name(),
            permissions=self.get_role_permissions(user.role),
            specialization=specialization,
            doctor_id=doctor_id
        )
        
        return LoginResponse(
            user=user_response,
            tokens=tokens,
            permissions=self.get_role_permissions(user.role)
        )
    
    async def register(self, db: Session, register_request: RegisterRequest) -> Optional[User]:
        """Register new user with transaction support"""
        # Check if user already exists
        existing_user = self.user_service.get_user_by_email(db, register_request.email)
        if existing_user:
            raise ValueError("User with this email already exists")

        # Hash password
        hashed_password = self.hash_password(register_request.password)

        # Use transaction to ensure atomicity
        try:
            # Create user
            user_data = {
                "email": register_request.email,
                "hashed_password": hashed_password,
                "first_name": register_request.first_name,
                "last_name": register_request.last_name,
                "role": register_request.role,
                "keycloak_id": getattr(register_request, "keycloak_id", None),  # Optional for now
                "is_active": True
            }

            # Don't auto-commit - we'll commit after doctor profile is created
            user = self.user_service.create_user(db, user_data, auto_commit=False)

            # If user is a doctor, create doctor profile with all provided details
            if register_request.role == "doctor" and register_request.license_number:
                from app.services.doctor_service import DoctorService
                from app.schemas.doctor import DoctorCreate

                doctor_service = DoctorService()

                doctor_data = DoctorCreate(
                    user_id=user.id,
                    license_number=register_request.license_number,
                    specialization=register_request.specialization or "General Practice",
                    qualification=register_request.qualification,
                    experience_years=register_request.experience_years,
                    clinic_address=register_request.clinic_address,
                    phone=register_request.phone,
                    consultation_fee=register_request.consultation_fee,
                    consultation_duration=register_request.consultation_duration or 30,
                    availability_schedule=register_request.availability_schedule
                )

                # Don't auto-commit - we'll commit after all operations succeed
                doctor_service.create_doctor(db, doctor_data, auto_commit=False)

            # Commit the transaction only if everything succeeds
            db.commit()
            db.refresh(user)

            return user

        except Exception as e:
            # Rollback the transaction if anything fails
            db.rollback()
            # Re-raise the exception to be handled by the endpoint
            raise
    
    def get_current_user(self, db: Session, token: str) -> Optional[User]:
        """Get current user from JWT token"""
        payload = self.verify_token(token)
        if not payload:
            return None
        
        user_id = payload.get("user_id")
        if not user_id:
            return None
        
        user = self.user_service.get_user_by_id(db, UUID(user_id))
        if not user or not user.is_active:
            return None
        
        return user
    
    # Keycloak Integration (placeholder for future implementation)
    async def authenticate_with_keycloak(self, keycloak_token: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with Keycloak token"""
        # TODO: Implement Keycloak token verification
        # This would verify the token with Keycloak server
        # and return user information
        pass
    
    async def sync_user_with_keycloak(self, db: Session, keycloak_user_data: Dict[str, Any]) -> User:
        """Sync user data with Keycloak"""
        # TODO: Implement user synchronization with Keycloak
        # This would create or update user based on Keycloak data
        pass
    
    # Password Reset (placeholder for future implementation)
    def generate_password_reset_token(self, user: User) -> str:
        """Generate password reset token"""
        expire = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
        
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "exp": expire,
            "type": "password_reset"
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_password_reset_token(self, token: str) -> Optional[str]:
        """Verify password reset token and return user email"""
        payload = self.verify_token(token)
        if not payload or payload.get("type") != "password_reset":
            return None
        
        return payload.get("email")
    
    def reset_password(self, db: Session, email: str, new_password: str) -> bool:
        """Reset user password"""
        user = self.user_service.get_user_by_email(db, email)
        if not user:
            return False
        
        hashed_password = self.hash_password(new_password)
        user.hashed_password = hashed_password
        db.commit()
        
        return True