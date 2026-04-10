"""
Zenith Stock Server — A standalone FastAPI microservice
that serves as each company's warehouse ERP stock endpoint.

Run separately: uvicorn stock_server:app --port 8001 --reload
Companies connect to this after login for live inventory data.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import uuid
import sqlite3
import hashlib
import json

app = FastAPI(
    title="Zenith Stock Server",
    description="Warehouse ERP Stock Microservice — Companies connect here for live inventory",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-Memory Stock DB (per company) ───────────────────────
# In production this would be backed by PostgreSQL/Redis

class StockItem(BaseModel):
    id: str
    item_name: str
    quantity: float
    unit: str
    reorder_level: float
    unit_price: float
    category: str = "General"
    last_updated: str = ""

class StockUpdate(BaseModel):
    itemName: str
    quantity: float
    unit: str
    reorder_level: float = 50.0
    unit_price: float = 0.0
    category: str = "General"

class BulkUpdate(BaseModel):
    updates: List[StockUpdate]

class ConsumeRequest(BaseModel):
    item_id: str
    quantity: float

# ─── DATABASE INITIALIZATION ────────────────────────────────
DB_PATH = "zenith_erp.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Users table with unique constraints
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            company_name TEXT NOT NULL,
            gst_number TEXT UNIQUE NOT NULL,
            phone TEXT,
            created_at TEXT NOT NULL,
            details_json TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Pydantic models for Auth
class RegisterRequest(BaseModel):
    id: Optional[str] = None
    email: str
    password: str
    role: str
    company_name: str
    gst_number: str
    phone: Optional[str] = ""
    details: Optional[Dict] = {}

class LoginRequest(BaseModel):
    email: str
    password: str

# Company stock databases


def get_company_stock(company_id: str) -> List[dict]:
    """Get or initialize stock for a company."""
    if company_id not in company_stocks:
        company_stocks[company_id] = []
    return company_stocks[company_id]


def add_stock_log(company_id: str, message: str, log_type: str = "info"):
    if company_id not in stock_logs:
        stock_logs[company_id] = []
    stock_logs[company_id].append({
        "id": str(uuid.uuid4())[:8],
        "timestamp": datetime.now().isoformat(),
        "message": message,
        "type": log_type,
    })
    # Keep only last 100 logs
    stock_logs[company_id] = stock_logs[company_id][-100:]


# ─── Endpoints ───────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "online", "service": "Zenith Stock & Auth Server", "version": "1.1.0"}


@app.post("/auth/register")
def register(req: RegisterRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Hash password
    hashed_pw = hashlib.sha256(req.password.encode()).hexdigest()
    user_id = req.id or f"u_{uuid.uuid4().hex[:8]}"
    created_at = datetime.now().isoformat()
    details_str = json.dumps(req.details)

    try:
        cursor.execute('''
            INSERT INTO users (id, email, password, role, company_name, gst_number, phone, created_at, details_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, req.email, hashed_pw, req.role, req.company_name, req.gst_number, req.phone, created_at, details_str))
        conn.commit()
        return {"message": "User registered successfully", "id": user_id}
    except sqlite3.IntegrityError as e:
        if "email" in str(e).lower():
            raise HTTPException(status_code=400, detail="Account with this email already exists.")
        if "gst_number" in str(e).lower():
            raise HTTPException(status_code=400, detail="This GST number is already registered.")
        raise HTTPException(status_code=400, detail="Registration failed: Data integrity error.")
    finally:
        conn.close()

@app.post("/auth/login")
def login(req: LoginRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    hashed_pw = hashlib.sha256(req.password.encode()).hexdigest()
    
    cursor.execute('SELECT * FROM users WHERE email = ? AND password = ?', (req.email, hashed_pw))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    # Map row to user object
    return {
        "id": user[0],
        "email": user[1],
        "role": user[3],
        "companyName": user[4],
        "gstNumber": user[5],
        "phone": user[6],
        "createdAt": user[7],
        "details": json.loads(user[8]) if user[8] else {}
    }


@app.get("/health")
def health():
    return {"status": "healthy", "companies_connected": len(company_stocks)}


@app.get("/stock/{company_id}")
def get_stock(company_id: str):
    """Get all stock items for a company."""
    items = get_company_stock(company_id)
    
    # Compute alerts
    alerts = []
    for item in items:
        if item["quantity"] <= 0:
            alerts.append({"item": item["item_name"], "level": "out_of_stock", "quantity": 0})
        elif item["quantity"] <= item["reorder_level"] / 2:
            alerts.append({"item": item["item_name"], "level": "critical", "quantity": item["quantity"]})
        elif item["quantity"] <= item["reorder_level"]:
            alerts.append({"item": item["item_name"], "level": "low", "quantity": item["quantity"]})
    
    
    # Format according to requested schema
    updates = []
    for item in items:
        updates.append({
            "itemName": item["item_name"],
            "quantity": item["quantity"],
            "unit": item["unit"]
        })
    
    return {
        "company_id": company_id,
        "total_items": len(items),
        "alerts": alerts,
        "updates": updates,
        "items": items,
    }


@app.post("/stock/{company_id}/add")
def add_stock_item(company_id: str, item: StockUpdate):
    """Add a new stock item or update existing."""
    items = get_company_stock(company_id)
    
    # Check if item already exists
    existing = next((i for i in items if i["item_name"].lower() == item.itemName.lower()), None)
    if existing:
        existing["quantity"] += item.quantity
        existing["unit_price"] = item.unit_price
        existing["reorder_level"] = item.reorder_level
        existing["last_updated"] = datetime.now().isoformat()
        add_stock_log(company_id, f"Updated {item.itemName}: +{item.quantity} {item.unit}", "success")
        return {"message": "Stock updated", "item": existing}
    
    new_item = {
        "id": f"stk_{uuid.uuid4().hex[:8]}",
        "item_name": item.itemName,
        "quantity": item.quantity,
        "unit": item.unit,
        "reorder_level": item.reorder_level,
        "unit_price": item.unit_price,
        "category": item.category,
        "last_updated": datetime.now().isoformat(),
    }
    items.append(new_item)
    add_stock_log(company_id, f"Added new item: {item.itemName} ({item.quantity} {item.unit})", "success")
    return {"message": "Stock item added", "item": new_item}


@app.post("/stock/{company_id}/consume")
def consume_stock(company_id: str, req: ConsumeRequest):
    """Consume/deplete stock (simulates warehouse usage)."""
    items = get_company_stock(company_id)
    item = next((i for i in items if i["id"] == req.item_id), None)
    
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    if item["quantity"] < req.quantity:
        raise HTTPException(status_code=400, detail=f"Insufficient stock. Available: {item['quantity']}")
    
    item["quantity"] -= req.quantity
    item["last_updated"] = datetime.now().isoformat()
    
    level = "info"
    if item["quantity"] <= item["reorder_level"] / 2:
        level = "critical"
    elif item["quantity"] <= item["reorder_level"]:
        level = "warning"
    
    add_stock_log(company_id, f"Consumed {req.quantity} {item['unit']} of {item['item_name']}. Remaining: {item['quantity']}", level)
    
    return {
        "message": "Stock consumed",
        "item": item,
        "alert": level if level != "info" else None,
    }


@app.post("/stock/{company_id}/bulk-update")
def bulk_update(company_id: str, bulk: BulkUpdate):
    """Bulk upload stock items (for initial warehouse sync)."""
    count = 0
    for item in bulk.updates:
        add_stock_item(company_id, item)
        count += 1
    add_stock_log(company_id, f"Bulk synced {count} items from warehouse.", "success")
    return {"message": f"Synced {count} items", "total": len(get_company_stock(company_id))}


@app.get("/stock/{company_id}/logs")
def get_logs(company_id: str, limit: int = 50):
    """Get stock event logs."""
    logs = stock_logs.get(company_id, [])
    return {"logs": logs[-limit:]}


@app.delete("/stock/{company_id}/reset")
def reset_stock(company_id: str):
    """Reset all stock for a company."""
    company_stocks[company_id] = []
    stock_logs[company_id] = []
    return {"message": "Stock reset successfully"}
