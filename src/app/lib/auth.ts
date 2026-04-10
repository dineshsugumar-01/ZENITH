export type UserRole = "company" | "vendor";
export type VerificationStatus = "pending" | "pending_bank" | "verified" | "rejected";
import { dataService, setDemoMode } from "./data";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  companyName: string;
  gstNumber: string;
  phone: string;
  verificationStatus: VerificationStatus;
  isBankVerified: boolean;
  createdAt: string;
}

export interface VendorDetails extends User {
  contactPerson: string;
  category: string;
  address: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  beneficiaryName: string;
}

export interface CompanyDetails extends User {
  cinNumber: string;
  directorName: string;
  address: string;
  gstCertificate: string;
  companyRegistration: string;
}

// ─── GST WHITELIST ──────────────────────────────────────────
// Valid mock GST numbers for registration. Only these are accepted.
export const GST_WHITELIST: Record<string, { companyName: string; state: string }> = {
  "27AABCU9603R1ZM": { companyName: "Acme Manufacturing", state: "Maharashtra" },
  "29ABCDE1234F1Z5": { companyName: "AlloyIndia Pvt Ltd", state: "Karnataka" },
  "33ABCDE1234F1Z8": { companyName: "SteelTech Industries", state: "Tamil Nadu" },
  "07AAACI1681G1Z9": { companyName: "Infosys Technologies", state: "Delhi" },
  "24AADCB2230M1ZL": { companyName: "Birla Corporation", state: "Gujarat" },
  "36AABCT1332L1ZH": { companyName: "Tata Chemicals", state: "Telangana" },
  "29AABCI7345P1ZF": { companyName: "ITC Limited", state: "Karnataka" },
  "27AAACR5055K1Z3": { companyName: "Reliance Industries", state: "Maharashtra" },
  "22BBXYZ1234F1Z8": { companyName: "Global Build Corp", state: "Chhattisgarh" },
  "11AABBC1234F1Z8": { companyName: "Nexus Manufacturing", state: "Bihar" },
  "44BBXYZ1234F1Z8": { companyName: "ChemPrime Solutions", state: "Gujarat" },
  "55AABBC1234F1Z8": { companyName: "LogiTech Packaging", state: "Telangana" },
};

// ─── GST FORMAT VALIDATOR ───────────────────────────────────
export function isValidGSTFormat(gst: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst.toUpperCase());
}

export function isGSTInWhitelist(gst: string): boolean {
  return gst.toUpperCase() in GST_WHITELIST;
}

// ─── DUAL STORAGE for user sessions ──────────────────────────
// Real users → localStorage (permanent)
// Demo users → sessionStorage (temp, per-tab)

const REAL_USER_KEY = "zenith_current_user";
const REAL_USERS_KEY = "zenith_users";
const DEMO_USER_KEY = "zenith_demo_current_user";
const DEMO_USERS_KEY = "zenith_demo_users";
const API_BASE_URL = "http://localhost:8001";

let _isDemoSession = false;

function getUserStorage(): Storage {
  return _isDemoSession ? sessionStorage : localStorage;
}
function getCurrentUserKey(): string {
  return _isDemoSession ? DEMO_USER_KEY : REAL_USER_KEY;
}
function getUsersKey(): string {
  return _isDemoSession ? DEMO_USERS_KEY : REAL_USERS_KEY;
}

function getCurrentUser(): User | null {
  const data = getUserStorage().getItem(getCurrentUserKey());
  return data ? JSON.parse(data) : null;
}

function setCurrentUser(user: User | null): void {
  if (user) {
    getUserStorage().setItem(getCurrentUserKey(), JSON.stringify(user));
  } else {
    getUserStorage().removeItem(getCurrentUserKey());
    getUserStorage().removeItem("zenith_access_token");
  }
}

function getAllUsers(): User[] {
  const data = getUserStorage().getItem(getUsersKey());
  return data ? JSON.parse(data) : [];
}

function saveUser(user: User): void {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx === -1) users.push(user);
  else users[idx] = user;
  getUserStorage().setItem(getUsersKey(), JSON.stringify(users));
}

// ─── BOOT: detect if current session is demo ────────────────
// On page load, check if there's a demo user in sessionStorage.
// If yes, activate demo mode. Otherwise default to real mode.
function initStorageMode(): void {
  const demoUser = sessionStorage.getItem(DEMO_USER_KEY);
  if (demoUser) {
    _isDemoSession = true;
    setDemoMode(true);
  } else {
    _isDemoSession = false;
    setDemoMode(false);
  }
}
initStorageMode();

export const authService = {
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string; needsBankVerification?: boolean }> => {
    // Real login → switch to localStorage mode
    _isDemoSession = false;
    setDemoMode(false);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const err = await response.json();
        return { success: false, error: err.detail || "Invalid credentials. Please register first." };
      }

      const user = await response.json();
      
      const loggedUser: User = {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        companyName: user.companyName,
        gstNumber: user.gstNumber,
        phone: user.phone || "",
        verificationStatus: "verified",
        isBankVerified: true,
        createdAt: user.createdAt
      };
      
      setCurrentUser(loggedUser);
      return { success: true, user: loggedUser };
    } catch (error) {
      return { success: false, error: "Database server at 8001 is not running. Please start it and try again." };
    }
  },

  registerVendor: async (data: any): Promise<{ success: boolean; error?: string }> => {
    // Real registration → localStorage mode
    _isDemoSession = false;
    setDemoMode(false);

    // Validate GST
    const gst = (data.gstNumber || "").toUpperCase();
    if (!isValidGSTFormat(gst)) {
      return { success: false, error: "Invalid GST format. GST must be 15 characters (e.g., 29ABCDE1234F1Z5)." };
    }
    if (!isGSTInWhitelist(gst)) {
      return { success: false, error: "GST number not found in our verification database. Please use a valid, registered GST number." };
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password || "password123", // fallback for UI without pass field
          role: "vendor",
          company_name: data.companyName,
          gst_number: gst,
          phone: data.phone,
          details: {
            contactPerson: data.contactPerson,
            category: data.category,
            address: data.address,
            bankAccountNumber: data.bankAccountNumber,
            bankIfsc: data.bankIfsc,
            bankName: data.bankName
          }
        })
      });

      if (!resp.ok) {
        const err = await resp.json();
        return { success: false, error: err.detail || "Registration failed on server." };
      }

      const result = await resp.json();
      const newVendor: User = {
        id: result.id,
        email: data.email,
        role: "vendor",
        companyName: data.companyName,
        gstNumber: gst,
        phone: data.phone,
        verificationStatus: "pending",
        isBankVerified: false,
        createdAt: new Date().toISOString()
      };

      setCurrentUser(newVendor);
      return { success: true };
    } catch (error) {
       return { success: false, error: "Database server at 8001 error. Ensure it is running." };
    }
  },

  registerCompany: async (data: any): Promise<{ success: boolean; error?: string }> => {
    // Real registration → localStorage mode
    _isDemoSession = false;
    setDemoMode(false);

    // Validate GST
    const gst = (data.gstNumber || "").toUpperCase();
    if (!isValidGSTFormat(gst)) {
      return { success: false, error: "Invalid GST format. GST must be 15 characters (e.g., 27AABCU9603R1ZM)." };
    }
    if (!isGSTInWhitelist(gst)) {
      return { success: false, error: "GST number not found in our verification database. Please use a valid, registered GST number." };
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password || "password123",
          role: "company",
          company_name: data.companyName,
          gst_number: gst,
          phone: data.phone,
          details: {
            cinNumber: data.cinNumber,
            directorName: data.directorName,
            address: data.address
          }
        })
      });

      if (!resp.ok) {
        const err = await resp.json();
        return { success: false, error: err.detail || "Registration failed on server." };
      }

      const result = await resp.json();
      const newCompany: User = {
        id: result.id,
        email: data.email,
        role: "company",
        companyName: data.companyName,
        gstNumber: gst,
        phone: data.phone,
        verificationStatus: "verified",
        isBankVerified: true,
        createdAt: new Date().toISOString()
      };

      setCurrentUser(newCompany);
      return { success: true };
    } catch (error) {
       return { success: false, error: "Database server at 8001 error." };
    }
  },

  verifyBankPennyDrop: async (utrNumber: string): Promise<{ success: boolean; error?: string }> => {
    return { success: true };
  },

  verifyCompany: async (): Promise<{ success: boolean; error?: string }> => {
    return { success: true };
  },

  getCurrentUser: (): User | null => {
    return getCurrentUser();
  },

  logout: (): void => {
    if (_isDemoSession) {
      // Wipe demo session completely
      sessionStorage.removeItem(DEMO_USER_KEY);
      sessionStorage.removeItem(DEMO_USERS_KEY);
      sessionStorage.removeItem("zenith_demo_data");
    }
    setCurrentUser(null);
    _isDemoSession = false;
    setDemoMode(false);
  },

  isAuthenticated: (): boolean => {
    return getCurrentUser() !== null;
  },

  isDemo: (): boolean => {
    return _isDemoSession;
  },

  getAllCompanies: (): User[] => {
    return getAllUsers().filter(u => u.role === "company");
  },

  requiresVerification: (): boolean => {
    const user = getCurrentUser();
    if (!user) return false;
    return user.verificationStatus === "pending" || 
           user.verificationStatus === "pending_bank" ||
           (user.role === "vendor" && !user.isBankVerified);
  },

  demoLogin: async (role: "company" | "vendor"): Promise<{ success: boolean; user?: User }> => {
      // Switch to demo (sessionStorage) mode
      _isDemoSession = true;
      setDemoMode(true);

      const demoCompany: User = {
        id: "demo_company_001", email: "admin@acme.com", role: "company", companyName: "Acme Manufacturing",
        gstNumber: "27AABCU9603R1ZM", phone: "+91 98765 43210", verificationStatus: "verified", isBankVerified: true,
        createdAt: new Date().toISOString()
      };
      
      const demoVendor: User = {
        id: "demo_vendor_001", email: "vendor@alloy.com", role: "vendor", companyName: "AlloyIndia Pvt Ltd",
        gstNumber: "29ABCDE1234F1Z5", phone: "+91 98765 43210", verificationStatus: "verified", isBankVerified: true,
        createdAt: new Date().toISOString()
      };

      // Wipe old demo data & seed fresh mock environment
      dataService.clearAllData();
      dataService.seedDemoData(demoVendor.id, demoCompany.id);

      // Save all demo users into the demo user registry
      const allDemoUsers: User[] = [
        demoCompany,
        demoVendor,
        { id: "comp_123", email: "sales@steeltech.in", role: "company", companyName: "SteelTech Industries", gstNumber: "33ABCDE1234F1Z8", phone: "+91 88888 88888", verificationStatus: "verified", isBankVerified: true, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
        { id: "comp_201", email: "procurement@globalbuild.com", role: "company", companyName: "Global Build Corp", gstNumber: "22BBXYZ1234F1Z8", phone: "+91 99999 77777", verificationStatus: "verified", isBankVerified: true, createdAt: new Date(Date.now() - 40 * 86400000).toISOString() },
        { id: "comp_202", email: "contact@nexusmanufacturing.com", role: "company", companyName: "Nexus Manufacturing", gstNumber: "11AABBC1234F1Z8", phone: "+91 99999 66666", verificationStatus: "verified", isBankVerified: true, createdAt: new Date(Date.now() - 50 * 86400000).toISOString() },
        { id: "vend_301", email: "sales@chemprime.in", role: "vendor", companyName: "ChemPrime Solutions", gstNumber: "44BBXYZ1234F1Z8", phone: "+91 99999 55555", verificationStatus: "verified", isBankVerified: true, createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
        { id: "vend_302", email: "hello@logitechpack.com", role: "vendor", companyName: "LogiTech Packaging", gstNumber: "55AABBC1234F1Z8", phone: "+91 99999 44444", verificationStatus: "verified", isBankVerified: true, createdAt: new Date(Date.now() - 70 * 86400000).toISOString() },
      ];
      allDemoUsers.forEach(u => saveUser(u));

      if (role === "company") {
        setCurrentUser(demoCompany);
        return { success: true, user: demoCompany };
      } else {
        setCurrentUser(demoVendor);
        return { success: true, user: demoVendor };
      }
  },
};
