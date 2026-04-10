"""
Zenith GST Verification Service

Provides real GST number validation:
1. Format validation (regex + checksum)
2. State code verification (maps to Indian states)
3. Scrape attempt from official portal via proxy  
4. Structured data extraction

This runs as part of the main backend or can be called standalone.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import re
import httpx
from typing import Optional

router = APIRouter(prefix="/api/gst", tags=["GST Verification"])

# ─── GST State Code Map ─────────────────────────────────────

STATE_CODES = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
    "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
    "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
    "16": "Tripura", "17": "Meghalaya", "18": "Assam",
    "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
    "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "25": "Daman & Diu", "26": "Dadra & Nagar Haveli",
    "27": "Maharashtra", "29": "Karnataka", "30": "Goa",
    "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
    "34": "Puducherry", "35": "Andaman & Nicobar Islands",
    "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh",
}

# ─── PAN Entity Types ────────────────────────────────────────

PAN_ENTITY_TYPES = {
    "A": "Association of Persons (AOP)",
    "B": "Body of Individuals (BOI)",
    "C": "Company",
    "F": "Firm / LLP",
    "G": "Government",
    "H": "Hindu Undivided Family (HUF)",
    "J": "Artificial Juridical Person",
    "L": "Local Authority",
    "P": "Individual / Proprietorship",
    "T": "Trust",
}

# ─── Checksum Validator ──────────────────────────────────────

def validate_gstin_checksum(gstin: str) -> bool:
    """Validate the GSTIN checksum digit (15th character) using Luhn-like algo."""
    if len(gstin) != 15:
        return False
    
    charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    factor = 1
    total = 0
    
    for i in range(14):
        code_point = charset.index(gstin[i].upper())
        digit = code_point * factor
        
        if digit >= 36:
            digit = (digit // 36) + (digit % 36)
        
        total += digit
        factor = 2 if factor == 1 else 1
    
    remainder = total % 36
    check_char = charset[(36 - remainder) % 36]
    
    return check_char == gstin[14].upper()


# ─── Core Verification ──────────────────────────────────────

class GSTVerifyRequest(BaseModel):
    gstin: str

class GSTVerifyResponse(BaseModel):
    valid: bool
    gstin: str
    format_valid: bool
    checksum_valid: bool
    state_code: Optional[str] = None
    state_name: Optional[str] = None
    pan_number: Optional[str] = None
    entity_type: Optional[str] = None
    entity_type_desc: Optional[str] = None
    business_name: Optional[str] = None
    registration_date: Optional[str] = None
    status: Optional[str] = None
    address: Optional[str] = None
    source: str = "offline"
    message: str = ""


@router.post("/verify", response_model=GSTVerifyResponse)
async def verify_gst(request: GSTVerifyRequest):
    """
    Verify a GSTIN number with:
    1. Regex format validation
    2. Checksum verification
    3. State code + PAN extraction
    4. Online lookup attempt via public proxy
    """
    gstin = request.gstin.strip().upper()
    
    # Step 1: Format validation
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    format_valid = bool(re.match(pattern, gstin))
    
    if not format_valid:
        return GSTVerifyResponse(
            valid=False,
            gstin=gstin,
            format_valid=False,
            checksum_valid=False,
            message="Invalid GSTIN format. Must be 15 characters: 2-digit state code + 10-char PAN + 1 entity code + Z + 1 check digit"
        )
    
    # Step 2: Checksum
    checksum_valid = validate_gstin_checksum(gstin)
    
    # Step 3: Extract components
    state_code = gstin[:2]
    pan = gstin[2:12]
    entity_code = gstin[12]
    state_name = STATE_CODES.get(state_code, "Unknown State")
    entity_char = pan[3]  # 4th char of PAN
    entity_type_desc = PAN_ENTITY_TYPES.get(entity_char, "Unknown")
    
    # Step 4: Try online lookup
    business_name = None
    registration_date = None
    gst_status = None
    address = None
    source = "offline"
    
    try:
        # Try scraping from a public GST search proxy
        async with httpx.AsyncClient(timeout=8.0) as client:
            # Method 1: Try allorigins proxy to fetch from GST portal search
            search_url = f"https://services.gst.gov.in/services/searchtp"
            proxy_url = f"https://api.allorigins.win/get?url={search_url}"
            
            # Alternative: try a direct public GSTIN API
            alt_url = f"https://api.allorigins.win/get?url=https://razorpay.com/gst-number-search/{gstin}"
            resp = await client.get(alt_url)
            
            if resp.status_code == 200:
                data = resp.json()
                content = data.get("contents", "")
                
                # Try to extract business name from the page
                import html
                if content:
                    # Search for business name patterns
                    name_patterns = [
                        r'Legal Name[^>]*>([^<]+)',
                        r'Trade Name[^>]*>([^<]+)',
                        r'"legalName"\s*:\s*"([^"]+)"',
                        r'"tradeName"\s*:\s*"([^"]+)"',
                        r'business-name[^>]*>([^<]+)',
                    ]
                    for pat in name_patterns:
                        match = re.search(pat, content, re.IGNORECASE)
                        if match:
                            name = html.unescape(match.group(1)).strip()
                            if name and len(name) > 2 and name != gstin:
                                business_name = name
                                source = "online"
                                break
                    
                    # Try to extract status
                    status_patterns = [
                        r'"status"\s*:\s*"([^"]+)"',
                        r'Status[^>]*>(Active|Cancelled|Suspended)',
                    ]
                    for pat in status_patterns:
                        match = re.search(pat, content, re.IGNORECASE)
                        if match:
                            gst_status = match.group(1).strip()
                            break
                    
                    # Try registration date
                    date_patterns = [
                        r'"registrationDate"\s*:\s*"([^"]+)"',
                        r'Registration Date[^>]*>([0-9/\-]+)',
                    ]
                    for pat in date_patterns:
                        match = re.search(pat, content, re.IGNORECASE)
                        if match:
                            registration_date = match.group(1).strip()
                            break
    except Exception as e:
        # Online lookup failed, fall back to offline validation
        pass
    
    is_valid = format_valid and checksum_valid
    
    return GSTVerifyResponse(
        valid=is_valid,
        gstin=gstin,
        format_valid=format_valid,
        checksum_valid=checksum_valid,
        state_code=state_code,
        state_name=state_name,
        pan_number=pan,
        entity_type=entity_char,
        entity_type_desc=entity_type_desc,
        business_name=business_name,
        registration_date=registration_date,
        status=gst_status or ("Valid Structure" if is_valid else "Invalid"),
        address=address,
        source=source,
        message="GSTIN structure is valid" + (" and verified online" if source == "online" else " (offline verification)") if is_valid else "GSTIN checksum validation failed"
    )


@router.get("/validate/{gstin}")
async def quick_validate(gstin: str):
    """Quick validation endpoint — just checks format + checksum."""
    gstin = gstin.strip().upper()
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    format_ok = bool(re.match(pattern, gstin))
    checksum_ok = validate_gstin_checksum(gstin) if format_ok else False
    state = STATE_CODES.get(gstin[:2], "Unknown") if format_ok else None
    
    return {
        "gstin": gstin,
        "valid": format_ok and checksum_ok,
        "format_valid": format_ok,
        "checksum_valid": checksum_ok,
        "state": state,
    }
