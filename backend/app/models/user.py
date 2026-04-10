from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False) # 'company' or 'vendor'
    phone = Column(String)
    
    # company-specific base
    companyName = Column(String)
    gstNumber = Column(String, unique=True, index=True)
    
    verificationStatus = Column(String, default="pending")
    isBankVerified = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    # relationships
    vendor_details = relationship("VendorDetails", back_populates="user", uselist=False)
    company_details = relationship("CompanyDetails", back_populates="user", uselist=False)

class VendorDetails(Base):
    __tablename__ = "vendor_details"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    
    contactPerson = Column(String)
    category = Column(String)
    address = Column(String)
    bankAccountNumber = Column(String)
    bankIfsc = Column(String)
    bankName = Column(String)
    beneficiaryName = Column(String)
    
    user = relationship("User", back_populates="vendor_details")
    
class CompanyDetails(Base):
    __tablename__ = "company_details"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    
    cinNumber = Column(String)
    directorName = Column(String)
    address = Column(String)
    has_active_subscription = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="company_details")

class VendorConnection(Base):
    """Tracks connection requests from a Vendor to a Company"""
    __tablename__ = "vendor_connections"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    vendor_id = Column(String, ForeignKey("users.id"))
    company_id = Column(String, ForeignKey("users.id"))
    status = Column(String, default="pending") # pending, accepted, rejected
    ml_risk_score = Column(Float, nullable=True)
    ml_analysis_summary = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
