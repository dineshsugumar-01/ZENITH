from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_active_vendor, get_current_active_company
from app.models.user import User, VendorConnection
from app.models.procurement import RFQ, RFQItem, Quote
from app.schemas.procurement import VendorConnectionRequest, VendorConnectionResponse, RFQCreate, QuoteCreate
from sqlalchemy import func
import datetime

router = APIRouter()

@router.post("/connections/request", response_model=VendorConnectionResponse)
def request_connection(
    req: VendorConnectionRequest, 
    db: Session = Depends(get_db),
    current_vendor: User = Depends(get_current_active_vendor)
):
    """Vendor requests to join a company's network"""
    # Check if already requested
    existing = db.query(VendorConnection).filter(
        VendorConnection.vendor_id == current_vendor.id,
        VendorConnection.company_id == req.company_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Connection already requested")
        
    connection = VendorConnection(
        vendor_id=current_vendor.id,
        company_id=req.company_id,
        status="pending"
    )
    
    # Normally ML analysis triggers here or via background task
    db.add(connection)
    db.commit()
    db.refresh(connection)
    return connection

@router.post("/rfq", status_code=201)
def create_rfq(
    rfq_in: RFQCreate,
    db: Session = Depends(get_db),
    current_company: User = Depends(get_current_active_company)
):
    """Company creates an RFQ"""
    db_rfq = RFQ(
        company_id=current_company.id,
        title=rfq_in.title,
        description=rfq_in.description,
        deadline=rfq_in.deadline,
        status="open"
    )
    db.add(db_rfq)
    db.commit()
    db.refresh(db_rfq)
    
    for item in rfq_in.items:
        db_item = RFQItem(
            rfq_id=db_rfq.id,
            itemName=item.itemName,
            quantity=item.quantity,
            unit=item.unit,
            specifications=item.specifications
        )
        db.add(db_item)
        
    db.commit()
    return db_rfq

@router.post("/quotes", status_code=201)
def submit_quote(
    quote_in: QuoteCreate,
    db: Session = Depends(get_db),
    current_vendor: User = Depends(get_current_active_vendor)
):
    """Vendor submits a quote for an RFQ"""
    # Check if they are connected/eligible to quote (Simplified for now)
    db_quote = Quote(
        rfq_id=quote_in.rfq_id,
        vendor_id=current_vendor.id,
        amount=quote_in.amount,
        terms=quote_in.terms,
        deliveryDays=quote_in.deliveryDays,
    )
    # ML Analysis triggers here
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)
    return db_quote

@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_company: User = Depends(get_current_active_company)
):
    """Aggregation endpoint mirroring the frontend structure for Recharts."""
    
    # Simple aggregates
    active_rfqs = db.query(RFQ).filter(RFQ.company_id == current_company.id, RFQ.status == "open").count()
    verified_vendors = db.query(VendorConnection).filter(VendorConnection.company_id == current_company.id, VendorConnection.status == "approved").count()
    
    # Get all RFQs for current company to find associated quotes
    company_rfqs = db.query(RFQ).filter(RFQ.company_id == current_company.id).all()
    rfq_ids = [r.id for r in company_rfqs]
    pending_quotes = db.query(Quote).filter(Quote.rfq_id.in_(rfq_ids)).count() if rfq_ids else 0
    total_spend = db.query(func.sum(Quote.amount)).filter(Quote.rfq_id.in_(rfq_ids)).scalar() or 0

    # Dynamic Spend Trend (Simulated Group-by Month for demo)
    # If production, use extract(month from rfq.created_at)
    spendData = [
        {"month": "Jan", "amount": 0},
        {"month": "Feb", "amount": 0},
        {"month": "Mar", "amount": 0},
        {"month": "Apr", "amount": total_spend}, # Put all active spend in current month for visibility
    ]

    # Category Breakdown
    categoryData = [
        {"name": "Verified Vendors", "value": verified_vendors, "color": "#4F46E5"},
        {"name": "Pending Approvals", "value": db.query(VendorConnection).filter(VendorConnection.company_id == current_company.id, VendorConnection.status == "pending").count(), "color": "#16A34A"},
    ]

    # Dynamically grab AI insights from Quotes that have vulnerabilities
    aiInsights = []
    risky_quotes = db.query(Quote).filter(Quote.ml_vulnerability_score > 40).limit(3).all()
    for q in risky_quotes:
        aiInsights.append({
            "title": "Vendor Quote Anomaly",
            "description": q.ml_analysis_summary or f"High vulnerable ML score: {q.ml_vulnerability_score}",
            "impact": "Review Needed",
            "type": "warning"
        })

    return {
        "stats": {
            "totalSpend": total_spend,
            "activeRFQs": active_rfqs,
            "verifiedVendors": verified_vendors,
            "pendingQuotes": pending_quotes
        },
        "spendData": spendData,
        "categoryData": categoryData,
        "aiInsights": aiInsights,
        "recentRFQs": [{"id": str(r.id), "title": r.title, "status": r.status, "deadline": str(r.deadline)} for r in company_rfqs[:5]]
    }
