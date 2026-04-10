from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str # company or vendor
    phone: str
    companyName: str
    gstNumber: str
    
    # Vendor specific
    contactPerson: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    bankAccountNumber: Optional[str] = None
    bankIfsc: Optional[str] = None
    bankName: Optional[str] = None

    # Company specific
    cinNumber: Optional[str] = None
    directorName: Optional[str] = None
    
class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: str
    companyName: str
    verificationStatus: str
    isBankVerified: bool

    class Config:
        from_attributes = True
