from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.api.endpoints import auth, procurement, ai, gst

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Zenith Procurement ERP API",
    description="FastAPI Backend for Zenith ML and Procurement Platform",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(procurement.router, prefix="/api/v1/procurement", tags=["procurement"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(gst.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Zenith API"}
