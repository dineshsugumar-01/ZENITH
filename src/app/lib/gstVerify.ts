/**
 * Zenith GST Verification Service (Frontend)
 * 
 * Performs real GST validation:
 * 1. Client-side format + checksum validation (instant, works offline)
 * 2. Server-side deep verification via backend API (when available)
 * 3. Falls back to client-only validation if backend is unreachable
 */

// Indian state codes
const STATE_CODES: Record<string, string> = {
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
};

const PAN_ENTITY_TYPES: Record<string, string> = {
  "A": "Association of Persons",
  "B": "Body of Individuals",
  "C": "Company",
  "F": "Firm / LLP",
  "G": "Government",
  "H": "Hindu Undivided Family",
  "J": "Artificial Juridical Person",
  "L": "Local Authority",
  "P": "Individual / Proprietorship",
  "T": "Trust",
};

export interface GSTVerificationResult {
  valid: boolean;
  gstin: string;
  formatValid: boolean;
  checksumValid: boolean;
  stateCode?: string;
  stateName?: string;
  panNumber?: string;
  entityType?: string;
  entityTypeDesc?: string;
  businessName?: string;
  registrationDate?: string;
  status?: string;
  source: "client" | "server" | "online";
  message: string;
}

/**
 * Validate GSTIN checksum (Luhn-like algorithm for GST)
 */
function validateChecksum(gstin: string): boolean {
  if (gstin.length !== 15) return false;

  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let factor = 1;
  let total = 0;

  for (let i = 0; i < 14; i++) {
    const codePoint = charset.indexOf(gstin[i].toUpperCase());
    if (codePoint === -1) return false;
    let digit = codePoint * factor;
    if (digit >= 36) {
      digit = Math.floor(digit / 36) + (digit % 36);
    }
    total += digit;
    factor = factor === 1 ? 2 : 1;
  }

  const remainder = total % 36;
  const checkChar = charset[(36 - remainder) % 36];
  return checkChar === gstin[14].toUpperCase();
}

/**
 * Client-side GST validation (works offline, instant)
 */
export function validateGSTOffline(gstin: string): GSTVerificationResult {
  const gst = gstin.trim().toUpperCase();

  // Format check
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const formatValid = pattern.test(gst);

  if (!formatValid) {
    return {
      valid: false,
      gstin: gst,
      formatValid: false,
      checksumValid: false,
      source: "client",
      message: "Invalid format. GSTIN must be 15 characters: 2-digit state + 10-char PAN + entity code + Z + check digit",
    };
  }

  const checksumValid = validateChecksum(gst);
  const stateCode = gst.slice(0, 2);
  const pan = gst.slice(2, 12);
  const entityChar = pan[3];
  const stateName = STATE_CODES[stateCode] || "Unknown State";
  const entityTypeDesc = PAN_ENTITY_TYPES[entityChar] || "Unknown";

  return {
    valid: formatValid && checksumValid,
    gstin: gst,
    formatValid,
    checksumValid,
    stateCode,
    stateName,
    panNumber: pan,
    entityType: entityChar,
    entityTypeDesc,
    source: "client",
    status: checksumValid ? "Valid Structure" : "Invalid Checksum",
    message: checksumValid
      ? `Valid GSTIN from ${stateName} (${entityTypeDesc})`
      : "Checksum verification failed. Please check the number.",
  };
}

/**
 * Full GST verification (tries backend API first, falls back to client)
 */
export async function verifyGST(gstin: string): Promise<GSTVerificationResult> {
  // Always do client-side first for instant feedback
  const clientResult = validateGSTOffline(gstin);

  if (!clientResult.formatValid) {
    return clientResult;
  }

  // Try backend API for deeper verification
  try {
    const response = await fetch("http://localhost:8000/api/gst/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gstin: gstin.trim().toUpperCase() }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        valid: data.valid,
        gstin: data.gstin,
        formatValid: data.format_valid,
        checksumValid: data.checksum_valid,
        stateCode: data.state_code,
        stateName: data.state_name,
        panNumber: data.pan_number,
        entityType: data.entity_type,
        entityTypeDesc: data.entity_type_desc,
        businessName: data.business_name,
        registrationDate: data.registration_date,
        status: data.status,
        source: data.source === "online" ? "online" : "server",
        message: data.message,
      };
    }
  } catch {
    // Backend not available, use client-side result
  }

  return clientResult;
}

export { STATE_CODES, PAN_ENTITY_TYPES };
