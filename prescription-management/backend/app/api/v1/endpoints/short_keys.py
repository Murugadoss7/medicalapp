"""
Short Key Management REST API Endpoints
Provides CRUD operations for short keys and quick prescription creation
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging

from app.api.deps.database import get_db
from app.api.deps.auth import get_current_active_user, require_admin, require_staff
from app.core.exceptions import (
    NotFoundError,
    ValidationError,
    BusinessRuleError,
    DuplicateError
)
from app.models.user import User
from app.services.short_key_service import ShortKeyService
from app.schemas.short_key import (
    ShortKeyCreate,
    ShortKeyUpdate,
    ShortKeyResponse,
    ShortKeyListResponse,
    ShortKeySearchParams,
    ShortKeyMedicineCreate,
    ShortKeyMedicineUpdate,
    ShortKeyMedicineResponse,
    ShortKeyUsageResponse,
    ShortKeyStatistics,
    ShortKeyBulkOperation,
    ShortKeyBulkResponse,
    ShortKeyValidationRequest,
    ShortKeyValidationResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()
short_key_service = ShortKeyService()


@router.post("/", response_model=ShortKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_short_key(
    short_key_data: ShortKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Create a new short key for quick prescription creation.
    
    **Staff access required.**
    """
    try:
        short_key = short_key_service.create_short_key(
            db=db,
            short_key_data=short_key_data,
            created_by=current_user.id
        )
        logger.info(f"Short key created: {short_key.code} by user {current_user.id}")
        return short_key
        
    except DuplicateError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating short key: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create short key"
        )


@router.get("/popular", response_model=List[ShortKeyResponse])
async def get_popular_short_keys(
    limit: int = Query(10, ge=1, le=50, description="Number of results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get most popular short keys by usage count.
    
    **Staff access required.**
    """
    try:
        short_keys = short_key_service.get_popular_short_keys(db, current_user.id, limit)
        return short_keys
        
    except Exception as e:
        logger.error(f"Error retrieving popular short keys: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve popular short keys"
        )


@router.get("/statistics/overview", response_model=ShortKeyStatistics)
async def get_short_key_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get short key statistics.
    
    **Staff access required.**
    """
    try:
        stats = short_key_service.get_short_key_statistics(db, current_user.id)
        return ShortKeyStatistics(**stats)
        
    except Exception as e:
        logger.error(f"Error retrieving short key statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


@router.get("/", response_model=ShortKeyListResponse)
async def list_short_keys(
    query: Optional[str] = Query(None, description="Search query"),
    created_by: Optional[UUID] = Query(None, description="Filter by creator"),
    is_global: Optional[bool] = Query(None, description="Filter by global status"),
    include_personal: bool = Query(True, description="Include personal short keys"),
    include_global: bool = Query(True, description="Include global short keys"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    sort_by: Optional[str] = Query("code", description="Sort field"),
    sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get paginated list of short keys with filtering and search.
    
    **Staff access required.**
    """
    try:
        search_params = ShortKeySearchParams(
            query=query,
            created_by=created_by,
            is_global=is_global,
            include_personal=include_personal,
            include_global=include_global,
            is_active=is_active,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        short_keys, total_count = short_key_service.search_short_keys(
            db, search_params, current_user.id
        )
        
        total_pages = (total_count + page_size - 1) // page_size
        
        return ShortKeyListResponse(
            short_keys=short_keys,
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error listing short keys: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve short keys"
        )


@router.get("/{short_key_id}", response_model=ShortKeyResponse)
async def get_short_key(
    short_key_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get short key details by ID.
    
    **Staff access required.**
    """
    try:
        short_key = short_key_service.get_short_key_by_id(db, short_key_id, current_user.id)
        if not short_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Short key not found: {short_key_id}"
            )
        
        return short_key
        
    except Exception as e:
        logger.error(f"Error retrieving short key {short_key_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve short key"
        )


@router.get("/code/{code}", response_model=ShortKeyResponse)
async def get_short_key_by_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get short key details by code.

    **Staff access required.**
    """
    try:
        short_key = short_key_service.get_short_key_by_code(db, code, current_user.id)
        if not short_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Short key not found: {code}"
            )

        return short_key

    except HTTPException:
        # Re-raise HTTP exceptions (like 404) without wrapping them
        raise
    except Exception as e:
        logger.error(f"Error retrieving short key {code}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve short key"
        )


@router.put("/{short_key_id}", response_model=ShortKeyResponse)
async def update_short_key(
    short_key_id: UUID,
    short_key_data: ShortKeyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update short key information.
    
    **Staff access required. Only creator can update.**
    """
    try:
        short_key = short_key_service.update_short_key(
            db, short_key_id, short_key_data, current_user.id
        )
        if not short_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Short key not found: {short_key_id}"
            )
        
        logger.info(f"Short key updated: {short_key.code} by user {current_user.id}")
        return short_key
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Short key not found: {short_key_id}"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating short key {short_key_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update short key"
        )


@router.delete("/{short_key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_short_key(
    short_key_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Deactivate short key (soft delete).
    
    **Staff access required. Only creator can deactivate.**
    """
    try:
        success = short_key_service.deactivate_short_key(db, short_key_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Short key not found: {short_key_id}"
            )
        
        logger.info(f"Short key deactivated: {short_key_id} by user {current_user.id}")
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Short key not found: {short_key_id}"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error deactivating short key {short_key_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate short key"
        )


@router.put("/{short_key_id}/reactivate", response_model=ShortKeyResponse)
async def reactivate_short_key(
    short_key_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Reactivate a deactivated short key.
    
    **Staff access required. Only creator can reactivate.**
    """
    try:
        short_key = short_key_service.reactivate_short_key(db, short_key_id, current_user.id)
        if not short_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inactive short key not found: {short_key_id}"
            )
        
        logger.info(f"Short key reactivated: {short_key.code} by user {current_user.id}")
        return short_key
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inactive short key not found: {short_key_id}"
        )
    except DuplicateError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error reactivating short key {short_key_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reactivate short key"
        )


@router.post("/{short_key_id}/medicines", response_model=ShortKeyMedicineResponse)
async def add_medicine_to_short_key(
    short_key_id: UUID,
    medicine_data: ShortKeyMedicineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Add medicine to short key.
    
    **Staff access required. Only creator can modify.**
    """
    try:
        short_key_medicine = short_key_service.add_medicine_to_short_key(
            db, short_key_id, medicine_data, current_user.id
        )
        
        logger.info(f"Medicine added to short key {short_key_id} by user {current_user.id}")
        return short_key_medicine
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except DuplicateError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error adding medicine to short key {short_key_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add medicine to short key"
        )


@router.put("/{short_key_id}/medicines/{medicine_id}", response_model=ShortKeyMedicineResponse)
async def update_short_key_medicine(
    short_key_id: UUID,
    medicine_id: UUID,
    medicine_data: ShortKeyMedicineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update medicine settings in short key.
    
    **Staff access required. Only creator can modify.**
    """
    try:
        short_key_medicine = short_key_service.update_short_key_medicine(
            db, short_key_id, medicine_id, medicine_data, current_user.id
        )
        
        if not short_key_medicine:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medicine not found in short key"
            )
        
        logger.info(f"Medicine updated in short key {short_key_id} by user {current_user.id}")
        return short_key_medicine
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating medicine in short key {short_key_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update medicine in short key"
        )


@router.delete("/{short_key_id}/medicines/{medicine_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_medicine_from_short_key(
    short_key_id: UUID,
    medicine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Remove medicine from short key.
    
    **Staff access required. Only creator can modify.**
    """
    try:
        success = short_key_service.remove_medicine_from_short_key(
            db, short_key_id, medicine_id, current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medicine not found in short key"
            )
        
        logger.info(f"Medicine removed from short key {short_key_id} by user {current_user.id}")
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error removing medicine from short key {short_key_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove medicine from short key"
        )


@router.post("/use/{code}", response_model=ShortKeyUsageResponse)
async def use_short_key(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Use short key to generate prescription items (track usage).
    
    **Staff access required.**
    """
    try:
        short_key = short_key_service.use_short_key_by_code(db, code, current_user.id)
        
        if not short_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Short key not found: {code}"
            )
        
        # Generate prescription items from short key medicines
        prescription_items = []
        for sk_medicine in short_key.medicines:
            prescription_items.append({
                "medicine_id": str(sk_medicine.medicine_id),
                "medicine_name": sk_medicine.medicine.name if sk_medicine.medicine else "Unknown",
                "dosage": sk_medicine.default_dosage,
                "frequency": sk_medicine.default_frequency,
                "duration": sk_medicine.default_duration,
                "instructions": sk_medicine.default_instructions,
                "sequence_order": sk_medicine.sequence_order
            })
        
        logger.info(f"Short key used: {code} by user {current_user.id}")
        
        return ShortKeyUsageResponse(
            short_key=short_key,
            prescription_items=prescription_items
        )
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error using short key {code}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to use short key"
        )


@router.post("/bulk", response_model=ShortKeyBulkResponse)
async def bulk_short_key_operations(
    operation_request: ShortKeyBulkOperation,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Perform bulk operations on short keys.
    
    **Staff access required.**
    """
    try:
        result = short_key_service.bulk_update_short_keys(
            db, operation_request.short_key_ids, operation_request.operation, current_user.id
        )
        
        logger.info(f"Bulk operation {operation_request.operation} performed by user {current_user.id}: {result['successful']}/{result['total_requested']} successful")
        
        return ShortKeyBulkResponse(**result)
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in bulk short key operation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform bulk operation"
        )


@router.post("/validate", response_model=ShortKeyValidationResponse)
async def validate_short_key_code(
    validation_request: ShortKeyValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Validate short key code uniqueness.
    
    **Staff access required.**
    """
    try:
        is_valid = short_key_service.validate_code_unique(
            db, validation_request.code, validation_request.exclude_id
        )
        
        errors = []
        suggestions = []
        
        if not is_valid:
            errors.append(f"Short key code '{validation_request.code}' already exists")
            suggestions.append(f"{validation_request.code}1")
            suggestions.append(f"{validation_request.code}2")
            suggestions.append(f"{validation_request.code}V2")
        
        return ShortKeyValidationResponse(
            is_valid=is_valid,
            code=validation_request.code,
            errors=errors,
            suggestions=suggestions
        )
        
    except Exception as e:
        logger.error(f"Error validating short key code: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate short key code"
        )