from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.models.user import generate_uuid

class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("users.id"))
    title = Column(String)
    description = Column(Text)
    deadline = Column(DateTime)
    status = Column(String, default="open") # draft, open, quoted, awarded, closed
    createdAt = Column(DateTime, default=datetime.utcnow)

    items = relationship("RFQItem", back_populates="rfq", cascade="all, delete")
    quotes = relationship("Quote", back_populates="rfq")

class RFQItem(Base):
    __tablename__ = "rfq_items"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    rfq_id = Column(String, ForeignKey("rfqs.id"))
    itemName = Column(String)
    quantity = Column(Integer)
    unit = Column(String)
    specifications = Column(Text)
    
    rfq = relationship("RFQ", back_populates="items")

class Quote(Base):
    __tablename__ = "quotes"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    rfq_id = Column(String, ForeignKey("rfqs.id"))
    vendor_id = Column(String, ForeignKey("users.id"))
    
    amount = Column(Float)
    terms = Column(Text)
    deliveryDays = Column(Integer)
    status = Column(String, default="submitted") # submitted, under_review, accepted, rejected
    
    # ML Analysis Fields
    ml_vulnerability_score = Column(Float, nullable=True)
    ml_analysis_summary = Column(Text, nullable=True)
    
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    rfq = relationship("RFQ", back_populates="quotes")
    
class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    quote_id = Column(String, ForeignKey("quotes.id"))
    rfq_id = Column(String, ForeignKey("rfqs.id"))
    company_id = Column(String, ForeignKey("users.id"))
    vendor_id = Column(String, ForeignKey("users.id"))
    
    amount = Column(Float)
    status = Column(String, default="created") # created, confirmed, shipped, delivered, completed
    createdAt = Column(DateTime, default=datetime.utcnow)
