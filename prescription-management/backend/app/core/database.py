"""
Database configuration and setup
Based on Entity_Relationship_Diagram.md specifications
"""

from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator
import redis
from contextlib import contextmanager

from app.core.config import settings, DATABASE_CONFIG, REDIS_CONFIG

# Database Engine with connection pooling
engine = create_engine(
    str(settings.DATABASE_URL),
    echo=DATABASE_CONFIG["echo"],
    pool_size=DATABASE_CONFIG["pool_size"],
    max_overflow=DATABASE_CONFIG["max_overflow"],
    pool_timeout=DATABASE_CONFIG["pool_timeout"],
    pool_recycle=DATABASE_CONFIG["pool_recycle"],
    poolclass=QueuePool,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models (following ERD structure)
Base = declarative_base()

# Metadata for ERD-compliant schema generation
metadata = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s"
    }
)

# Redis connection for caching
redis_client = redis.Redis(
    host=REDIS_CONFIG["host"],
    port=REDIS_CONFIG["port"],
    password=REDIS_CONFIG["password"],
    decode_responses=REDIS_CONFIG["decode_responses"],
    health_check_interval=REDIS_CONFIG["health_check_interval"],
)


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI
    Ensures proper session cleanup following HIPAA audit requirements
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


@contextmanager
def get_db_context():
    """
    Context manager for database sessions
    Used for background tasks and services
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database with ERD schema
    Creates all tables based on ERD specifications
    """
    # Import all models to register them with Base.metadata
    from app.models import (
        user, patient, doctor, medicine, short_key,
        appointment, prescription, audit_log, dental
    )
    # TODO: Import other models as they are implemented
    # referral, patient_visit, allergy, medical_history
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database initialized with ERD schema")


def check_db_connection() -> bool:
    """
    Check database connection health
    """
    try:
        from sqlalchemy import text
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def check_redis_connection() -> bool:
    """
    Check Redis connection health
    """
    try:
        redis_client.ping()
        return True
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return False


class DatabaseManager:
    """
    Database manager for handling ERD-compliant operations
    """
    
    def __init__(self):
        self.engine = engine
        self.session_factory = SessionLocal
        self.redis = redis_client
    
    def create_session(self) -> Session:
        """Create a new database session"""
        return self.session_factory()
    
    def health_check(self) -> dict:
        """Comprehensive health check"""
        return {
            "database": check_db_connection(),
            "redis": check_redis_connection(),
            "pool_size": engine.pool.size(),
            "checked_out_connections": engine.pool.checkedout(),
        }
    
    def get_connection_info(self) -> dict:
        """Get database connection information"""
        return {
            "url": str(settings.DATABASE_URL).replace(settings.DATABASE_PASSWORD, "***"),
            "pool_size": engine.pool.size(),
            "max_overflow": engine.pool._max_overflow,
            "checked_out": engine.pool.checkedout(),
        }


# Global database manager instance
db_manager = DatabaseManager()


# Cache utilities for ERD entities
class CacheKeys:
    """
    Cache key patterns following ERD entity structure
    """
    # Patient cache keys (using composite key pattern)
    PATIENT_BY_COMPOSITE = "patient:mobile:{mobile}:name:{first_name}"
    PATIENT_FAMILY = "patient:family:{mobile_number}"
    PATIENT_HISTORY = "patient:history:{mobile}:{first_name}"
    
    # Medicine cache keys
    MEDICINE_SEARCH = "medicine:search:{query}"
    MEDICINE_BY_ID = "medicine:id:{medicine_id}"
    SHORT_KEYS = "short_keys:doctor:{doctor_id}"
    
    # Prescription cache keys
    PRESCRIPTION_BY_ID = "prescription:{prescription_id}"
    PRESCRIPTIONS_BY_PATIENT = "prescriptions:patient:{mobile}:{first_name}"
    
    # Doctor cache keys
    DOCTOR_BY_ID = "doctor:{doctor_id}"
    DOCTOR_SCHEDULE = "doctor:schedule:{doctor_id}:{date}"
    
    # Appointment cache keys
    APPOINTMENTS_BY_DOCTOR = "appointments:doctor:{doctor_id}:{date}"
    APPOINTMENTS_BY_PATIENT = "appointments:patient:{mobile}:{first_name}"


class CacheManager:
    """
    Cache manager for ERD entities
    """
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.default_ttl = 300  # 5 minutes
    
    def get(self, key: str) -> any:
        """Get value from cache"""
        try:
            return self.redis.get(key)
        except Exception:
            return None
    
    def set(self, key: str, value: any, ttl: int = None) -> bool:
        """Set value in cache"""
        try:
            return self.redis.setex(
                key, 
                ttl or self.default_ttl, 
                value
            )
        except Exception:
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            return self.redis.delete(key)
        except Exception:
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete keys matching pattern"""
        try:
            keys = self.redis.keys(pattern)
            if keys:
                return self.redis.delete(*keys)
            return 0
        except Exception:
            return 0
    
    def patient_cache_key(self, mobile: str, first_name: str) -> str:
        """Generate patient cache key using composite key"""
        return CacheKeys.PATIENT_BY_COMPOSITE.format(
            mobile=mobile, 
            first_name=first_name
        )
    
    def family_cache_key(self, mobile_number: str) -> str:
        """Generate family cache key"""
        return CacheKeys.PATIENT_FAMILY.format(mobile_number=mobile_number)
    
    def invalidate_patient_cache(self, mobile: str, first_name: str = None):
        """Invalidate all patient-related cache"""
        if first_name:
            # Invalidate specific patient
            self.delete(self.patient_cache_key(mobile, first_name))
        
        # Invalidate family cache
        self.delete(self.family_cache_key(mobile))
        
        # Invalidate related caches
        self.delete_pattern(f"prescriptions:patient:{mobile}:*")
        self.delete_pattern(f"appointments:patient:{mobile}:*")


# Global cache manager instance
cache_manager = CacheManager(redis_client)