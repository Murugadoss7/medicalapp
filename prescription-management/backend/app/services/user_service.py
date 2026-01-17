"""
User Service
Handles user management operations
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserFilters


class UserService:
    """User management service"""
    
    def create_user(self, db: Session, user_data: Dict[str, Any], auto_commit: bool = True) -> User:
        """
        Create a new user

        Args:
            db: Database session
            user_data: User data dictionary
            auto_commit: Whether to automatically commit the transaction (default: True)
                        Set to False when using external transaction management

        Returns:
            Created user object
        """
        user = User(**user_data)
        db.add(user)

        if auto_commit:
            db.commit()
            # Don't refresh after commit - RLS blocks it
        else:
            db.flush()  # Flush to get the ID without committing

        return user
    
    def get_user_by_id(self, db: Session, user_id: UUID) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(
            User.id == user_id,
            User.is_active == True
        ).first()
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(
            User.email == email,
            User.is_active == True
        ).first()
    
    def get_user_by_keycloak_id(self, db: Session, keycloak_id: str) -> Optional[User]:
        """Get user by Keycloak ID"""
        return db.query(User).filter(
            User.keycloak_id == keycloak_id,
            User.is_active == True
        ).first()
    
    def update_user(self, db: Session, user_id: UUID, user_update: UserUpdate) -> Optional[User]:
        """Update user"""
        user = self.get_user_by_id(db, user_id)
        if not user:
            return None
        
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        db.commit()
        # Don't refresh after commit - RLS blocks it
        return user
    
    def update_last_login(self, db: Session, user_id: UUID) -> None:
        """Update user's last login timestamp"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.last_login_at = datetime.utcnow().isoformat()
            db.commit()
    
    def deactivate_user(self, db: Session, user_id: UUID) -> bool:
        """Deactivate user (soft delete)"""
        user = self.get_user_by_id(db, user_id)
        if not user:
            return False
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        db.commit()
        return True
    
    def activate_user(self, db: Session, user_id: UUID) -> bool:
        """Activate user"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        user.is_active = True
        user.updated_at = datetime.utcnow()
        db.commit()
        return True
    
    def get_users_list(
        self, 
        db: Session, 
        filters: UserFilters
    ) -> tuple[List[User], int]:
        """Get paginated list of users with filters"""
        query = db.query(User)
        
        # Apply filters
        if filters.role:
            query = query.filter(User.role == filters.role)
        
        if filters.is_active is not None:
            query = query.filter(User.is_active == filters.is_active)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )
        
        if filters.created_after:
            query = query.filter(User.created_at >= filters.created_after)
        
        if filters.created_before:
            query = query.filter(User.created_at <= filters.created_before)
        
        # Get total count
        total = query.count()
        
        # Apply sorting
        if filters.sort_by == "created_at":
            sort_column = User.created_at
        elif filters.sort_by == "updated_at":
            sort_column = User.updated_at
        elif filters.sort_by == "email":
            sort_column = User.email
        elif filters.sort_by == "first_name":
            sort_column = User.first_name
        elif filters.sort_by == "last_name":
            sort_column = User.last_name
        elif filters.sort_by == "role":
            sort_column = User.role
        else:
            sort_column = User.created_at
        
        if filters.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        offset = (filters.page - 1) * filters.limit
        users = query.offset(offset).limit(filters.limit).all()
        
        return users, total
    
    def get_users_by_role(self, db: Session, role: str) -> List[User]:
        """Get all users with specific role"""
        return db.query(User).filter(
            User.role == role,
            User.is_active == True
        ).all()
    
    def search_users(self, db: Session, query: str, limit: int = 10) -> List[User]:
        """Search users by name or email"""
        search_term = f"%{query}%"
        return db.query(User).filter(
            and_(
                User.is_active == True,
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )
        ).limit(limit).all()
    
    def get_user_statistics(self, db: Session) -> Dict[str, Any]:
        """Get user statistics"""
        total_users = db.query(User).filter(User.is_active == True).count()
        
        # Count by role
        role_counts = {}
        roles = ["super_admin", "admin", "doctor", "nurse", "receptionist", "patient"]
        for role in roles:
            count = db.query(User).filter(
                User.role == role,
                User.is_active == True
            ).count()
            role_counts[role] = count
        
        # Recent registrations (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_registrations = db.query(User).filter(
            User.created_at >= thirty_days_ago,
            User.is_active == True
        ).count()
        
        # Active users (logged in last 30 days)
        active_users = db.query(User).filter(
            User.last_login_at >= thirty_days_ago.isoformat(),
            User.is_active == True
        ).count()
        
        return {
            "total_users": total_users,
            "role_counts": role_counts,
            "recent_registrations": recent_registrations,
            "active_users": active_users
        }
    
    def change_user_password(self, db: Session, user_id: UUID, new_hashed_password: str) -> bool:
        """Change user password"""
        user = self.get_user_by_id(db, user_id)
        if not user:
            return False
        
        user.hashed_password = new_hashed_password
        user.updated_at = datetime.utcnow()
        db.commit()
        return True
    
    def validate_user_email_unique(self, db: Session, email: str, exclude_user_id: UUID = None) -> bool:
        """Validate that email is unique"""
        query = db.query(User).filter(User.email == email)
        
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)
        
        return query.first() is None
    
    def get_user_permissions(self, db: Session, user_id: UUID) -> List[str]:
        """Get user permissions based on role"""
        user = self.get_user_by_id(db, user_id)
        if not user:
            return []
        
        # Import here to avoid circular import
        from app.services.auth_service import AuthService
        auth_service = AuthService()
        return auth_service.get_role_permissions(user.role)