"""
Medicine Management REST API Endpoints
Provides CRUD operations for medicine catalog, drug interactions, and search functionality
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging

from app.api.deps.database import get_db
from app.api.deps.auth import get_current_active_user, require_admin, require_staff
from app.core.exceptions import (
    MedicineNotFoundError,
    ValidationError,
    BusinessRuleError,
    DuplicateError
)
from app.models.user import User
from app.services.medicine_service import MedicineService
from app.schemas.medicine import (
    MedicineCreate,
    MedicineUpdate,
    MedicineResponse,
    MedicineListResponse,
    MedicineSearchParams,
    DrugInteractionRequest,
    DrugInteractionResponse,
    MedicineStatistics,
    MedicineBulkOperation,
    MedicineBulkResponse,
    MedicineImport,
    MedicineRecommendation
)

logger = logging.getLogger(__name__)

router = APIRouter()
medicine_service = MedicineService()


@router.post("/", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
async def create_medicine(
    medicine_data: MedicineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new medicine in the catalog.
    
    **Admin access required.**
    """
    try:
        # Set tenant_id from current user for multi-tenancy
        medicine_data.tenant_id = current_user.tenant_id

        medicine = medicine_service.create_medicine(
            db=db,
            medicine_data=medicine_data,
            created_by=current_user.id
        )
        logger.info(f"Medicine created: {medicine.name} by user {current_user.id}")
        return medicine
        
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
        logger.error(f"Error creating medicine: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create medicine"
        )


@router.get("/", response_model=MedicineListResponse)
async def list_medicines(
    query: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Drug category filter"),
    manufacturer: Optional[str] = Query(None, description="Manufacturer filter"),
    requires_prescription: Optional[bool] = Query(None, description="Prescription requirement"),
    dosage_form: Optional[str] = Query(None, description="Dosage form filter"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    is_active: Optional[bool] = Query(True, description="Active status filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    sort_by: Optional[str] = Query("name", description="Sort field"),
    sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get paginated list of medicines with filtering and search.
    
    **Staff access required.**
    """
    try:
        search_params = MedicineSearchParams(
            query=query,
            category=category,
            manufacturer=manufacturer,
            requires_prescription=requires_prescription,
            dosage_form=dosage_form,
            min_price=min_price,
            max_price=max_price,
            is_active=is_active,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        medicines, total_count = medicine_service.search_medicines(db, search_params)
        
        total_pages = (total_count + page_size - 1) // page_size
        
        return MedicineListResponse(
            medicines=medicines,
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
        logger.error(f"Error listing medicines: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve medicines"
        )


@router.get("/{medicine_id}", response_model=MedicineResponse)
async def get_medicine(
    medicine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get medicine details by ID.
    
    **Staff access required.**
    """
    try:
        medicine = medicine_service.get_medicine_by_id(db, medicine_id)
        if not medicine:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medicine not found: {medicine_id}"
            )
        
        return medicine
        
    except Exception as e:
        logger.error(f"Error retrieving medicine {medicine_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve medicine"
        )


@router.put("/{medicine_id}", response_model=MedicineResponse)
async def update_medicine(
    medicine_id: UUID,
    medicine_data: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update medicine information.
    
    **Admin access required.**
    """
    try:
        medicine = medicine_service.update_medicine(db, medicine_id, medicine_data)
        if not medicine:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medicine not found: {medicine_id}"
            )
        
        logger.info(f"Medicine updated: {medicine.name} by user {current_user.id}")
        return medicine
        
    except MedicineNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine not found: {medicine_id}"
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
        logger.error(f"Error updating medicine {medicine_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update medicine"
        )


@router.delete("/{medicine_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_medicine(
    medicine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Deactivate medicine (soft delete).
    
    **Admin access required.**
    """
    try:
        success = medicine_service.deactivate_medicine(db, medicine_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medicine not found: {medicine_id}"
            )
        
        logger.info(f"Medicine deactivated: {medicine_id} by user {current_user.id}")
        
    except MedicineNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine not found: {medicine_id}"
        )
    except Exception as e:
        logger.error(f"Error deactivating medicine {medicine_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate medicine"
        )


@router.put("/{medicine_id}/reactivate", response_model=MedicineResponse)
async def reactivate_medicine(
    medicine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Reactivate a deactivated medicine.
    
    **Admin access required.**
    """
    try:
        medicine = medicine_service.reactivate_medicine(db, medicine_id)
        if not medicine:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inactive medicine not found: {medicine_id}"
            )
        
        logger.info(f"Medicine reactivated: {medicine.name} by user {current_user.id}")
        return medicine
        
    except MedicineNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inactive medicine not found: {medicine_id}"
        )
    except DuplicateError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error reactivating medicine {medicine_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reactivate medicine"
        )


@router.get("/search/simple", response_model=List[MedicineResponse])
async def simple_medicine_search(
    query: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Simple medicine search for autocomplete functionality.
    
    **Staff access required.**
    """
    try:
        medicines = medicine_service.search_medicines_simple(db, query, limit)
        return medicines
        
    except Exception as e:
        logger.error(f"Error in simple medicine search: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search medicines"
        )


@router.post("/interactions", response_model=DrugInteractionResponse)
async def check_drug_interactions(
    interaction_request: DrugInteractionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Check for drug interactions between medicines.
    
    **Staff access required.**
    """
    try:
        interactions = medicine_service.check_drug_interactions(
            db, interaction_request.medicine_ids
        )
        
        # Get medicine details
        medicines = []
        for medicine_id in interaction_request.medicine_ids:
            medicine = medicine_service.get_medicine_by_id(db, medicine_id)
            if medicine:
                medicines.append(medicine)
        
        return DrugInteractionResponse(
            has_interactions=len(interactions) > 0,
            interactions=interactions,
            checked_medicines=medicines
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error checking drug interactions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check drug interactions"
        )


@router.get("/categories/{category}", response_model=List[MedicineResponse])
async def get_medicines_by_category(
    category: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get medicines by drug category.
    
    **Staff access required.**
    """
    try:
        medicines = medicine_service.get_medicines_by_category(db, category)
        return medicines
        
    except Exception as e:
        logger.error(f"Error retrieving medicines by category {category}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve medicines by category"
        )


@router.get("/manufacturers/{manufacturer}", response_model=List[MedicineResponse])
async def get_medicines_by_manufacturer(
    manufacturer: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get medicines by manufacturer.
    
    **Staff access required.**
    """
    try:
        medicines = medicine_service.get_medicines_by_manufacturer(db, manufacturer)
        return medicines
        
    except Exception as e:
        logger.error(f"Error retrieving medicines by manufacturer {manufacturer}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve medicines by manufacturer"
        )


@router.get("/statistics/overview", response_model=MedicineStatistics)
async def get_medicine_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get medicine catalog statistics.
    
    **Admin access required.**
    """
    try:
        stats = medicine_service.get_medicine_statistics(db)
        return MedicineStatistics(**stats)
        
    except Exception as e:
        logger.error(f"Error retrieving medicine statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


@router.get("/popular", response_model=List[MedicineResponse])
async def get_popular_medicines(
    limit: int = Query(10, ge=1, le=50, description="Number of results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get most popular medicines.
    
    **Staff access required.**
    """
    try:
        medicines = medicine_service.get_popular_medicines(db, limit)
        return medicines
        
    except Exception as e:
        logger.error(f"Error retrieving popular medicines: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve popular medicines"
        )


@router.post("/bulk", response_model=MedicineBulkResponse)
async def bulk_medicine_operations(
    operation_request: MedicineBulkOperation,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Perform bulk operations on medicines.
    
    **Admin access required.**
    """
    try:
        result = medicine_service.bulk_update_medicines(
            db, operation_request.medicine_ids, operation_request.operation
        )
        
        logger.info(f"Bulk operation {operation_request.operation} performed by user {current_user.id}: {result['successful']}/{result['total_requested']} successful")
        
        return MedicineBulkResponse(**result)
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in bulk medicine operation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform bulk operation"
        )


@router.post("/import", response_model=Dict[str, Any])
async def import_medicines(
    import_request: MedicineImport,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Import medicines from external data.
    
    **Admin access required.**
    """
    try:
        result = medicine_service.import_medicines(
            db=db,
            medicines_data=import_request.medicines,
            created_by=current_user.id,
            overwrite=import_request.overwrite_existing
        )
        
        logger.info(f"Medicine import performed by user {current_user.id}: {result['successful']}/{result['total']} successful")
        
        return result
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error importing medicines: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to import medicines"
        )


@router.get("/recommendations/{condition}", response_model=MedicineRecommendation)
async def get_medicine_recommendations(
    condition: str,
    limit: int = Query(5, ge=1, le=20, description="Number of recommendations"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get medicine recommendations for a medical condition.
    
    **Staff access required.**
    """
    try:
        recommended_medicines = medicine_service.get_medicine_recommendations(
            db, condition, limit
        )
        
        return MedicineRecommendation(
            condition=condition,
            recommended_medicines=recommended_medicines,
            alternatives=[],
            warnings=[
                "These are algorithmic recommendations based on drug categories and composition.",
                "Always consult with a healthcare professional before prescribing.",
                "Consider patient allergies, contraindications, and drug interactions."
            ]
        )
        
    except Exception as e:
        logger.error(f"Error getting medicine recommendations for {condition}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recommendations"
        )


@router.get("/contraindications/{condition}", response_model=List[MedicineResponse])
async def get_contraindicated_medicines(
    condition: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get medicines contraindicated for a specific condition.
    
    **Staff access required.**
    """
    try:
        medicines = medicine_service.get_contraindicated_medicines(db, condition)
        return medicines
        
    except Exception as e:
        logger.error(f"Error retrieving contraindicated medicines for {condition}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve contraindicated medicines"
        )