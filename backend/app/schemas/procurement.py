from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VendorConnectionRequest(BaseModel):
    company_id: str

class VendorConnectionResponse(BaseModel):
    id: str
    vendor_id: str
    company_id: str
    status: str
    ml_risk_score: Optional[float]
    ml_analysis_summary: Optional[str]

    class Config:
        from_attributes = True

class RFQItemBase(BaseModel):
    itemName: str
    quantity: int
    unit: str
    specifications: str

class RFQCreate(BaseModel):
    title: str
    description: str
    deadline: datetime
    items: List[RFQItemBase]

class QuoteCreate(BaseModel):
    rfq_id: str
    amount: float
    terms: str
    deliveryDays: int
