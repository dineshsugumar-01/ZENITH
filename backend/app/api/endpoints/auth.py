from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.user import User, CompanyDetails, VendorDetails
from app.schemas.user import UserCreate, Token, UserResponse
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

def simulate_gst_verification(gst_number: str, company_name: str):
    """
    Simulates a 3rd Party GST Validation API.
    In real production, this hits an external service (like Razorpay GST API).
    Here, any GST starting with '00' is considered invalid.
    """
    if gst_number.startswith("00"):
        return False, "Invalid GST Number"
    return True, "Valid"

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    
    # Check if user exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
        
    gst_exists = db.query(User).filter(User.gstNumber == user_in.gstNumber).first()
    if gst_exists:
        raise HTTPException(status_code=400, detail="GST number is already registered")

    # 1. Real GST Simulator Call
    is_valid_gst, gst_msg = simulate_gst_verification(user_in.gstNumber, user_in.companyName)
    if not is_valid_gst:
        raise HTTPException(status_code=400, detail=f"GST Verification Failed: {gst_msg}")

    # Create Core User
    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        phone=user_in.phone,
        companyName=user_in.companyName,
        gstNumber=user_in.gstNumber,
        # Auto-verifying the company upon GST validation success
        verificationStatus="verified" if user_in.role == "company" else "pending_bank"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create Role Details
    if user_in.role == "company":
        db_company = CompanyDetails(
            user_id=db_user.id,
            cinNumber=user_in.cinNumber,
            directorName=user_in.directorName,
            address=user_in.address,
        )
        db.add(db_company)
    elif user_in.role == "vendor":
        db_vendor = VendorDetails(
            user_id=db_user.id,
            contactPerson=user_in.contactPerson,
            category=user_in.category,
            address=user_in.address,
            bankAccountNumber=user_in.bankAccountNumber,
            bankIfsc=user_in.bankIfsc,
            bankName=user_in.bankName,
        )
        db.add(db_vendor)
        
    db.commit()
    return db_user

@router.post("/login", response_model=Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        user.id, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
