import { authService, User } from "./auth";

// ─── DUAL STORAGE ENGINE ────────────────────────────────────
// Real users  → localStorage  (permanent, survives tab/browser close)
// Demo users  → sessionStorage (temp, wiped on tab close, isolated)
// They use DIFFERENT keys so data never leaks between modes.

const REAL_STORAGE_KEY = "zenith_real_data";
const DEMO_STORAGE_KEY = "zenith_demo_data";

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface Vendor {
  id: string;
  userId: string;
  companyName: string;
  gstNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  address: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  beneficiaryName: string;
  isBankVerified: boolean;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface RFQItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  specifications: string;
}

export interface RFQ {
  id: string;
  companyId: string;
  title: string;
  description: string;
  deadline: string;
  status: "draft" | "open" | "quoted" | "awarded" | "closed";
  items: RFQItem[];
  createdAt: string;
}

export interface Quote {
  id: string;
  rfqId: string;
  vendorId: string;
  amount: number;
  terms: string;
  deliveryDays: number;
  status: "submitted" | "under_review" | "accepted" | "rejected";
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  quoteId: string;
  rfqId: string;
  companyId: string;
  vendorId: string;
  amount: number;
  status: "created" | "confirmed" | "shipped" | "delivered" | "completed";
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  companyId: string;
  vendorId: string;
  amount: number;
  status: "pending" | "processed" | "completed";
  transactionId: string;
  createdAt: string;
}

export interface VendorConnection {
  id: string;
  vendorId: string;
  companyId: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  approvedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "rfq_published" | "quote_submitted" | "connection_request" | "connection_approved" | "stock_alert" | "negotiation" | "other";
  title: string;
  message: string;
  read: boolean;
  linkTo?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  unitPrice: number;
  supplierId: string;
  lastUpdated: string;
}

interface DataStore {
  vendors: Vendor[];
  rfqs: RFQ[];
  quotes: Quote[];
  orders: PurchaseOrder[];
  payments: Payment[];
  inventory: InventoryItem[];
  connections: VendorConnection[];
  notifications: Notification[];
}

// ─── STORAGE MODE ───────────────────────────────────────────
// This flag is set by authService on login/demoLogin.
// It determines which storage backend + key to use for ALL data operations.

let _isDemoMode = false;

export function setDemoMode(isDemo: boolean): void {
  _isDemoMode = isDemo;
}

export function isDemoMode(): boolean {
  return _isDemoMode;
}

function getStorage(): Storage {
  return _isDemoMode ? sessionStorage : localStorage;
}

function getStorageKey(): string {
  return _isDemoMode ? DEMO_STORAGE_KEY : REAL_STORAGE_KEY;
}

function generateId(): string {
  return "id_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function getData(): DataStore {
  const raw = getStorage().getItem(getStorageKey());
  if (raw) {
    const parsed = JSON.parse(raw);
    parsed.vendors = parsed.vendors || [];
    parsed.rfqs = parsed.rfqs || [];
    parsed.quotes = parsed.quotes || [];
    parsed.orders = parsed.orders || [];
    parsed.payments = parsed.payments || [];
    parsed.inventory = parsed.inventory || [];
    parsed.connections = parsed.connections || [];
    parsed.notifications = parsed.notifications || [];
    return parsed;
  }
  return initializeDefaultData();
}

function saveData(data: DataStore): void {
  getStorage().setItem(getStorageKey(), JSON.stringify(data));
}

function initializeDefaultData(): DataStore {
  const defaultData: DataStore = {
    vendors: [],
    rfqs: [],
    quotes: [],
    orders: [],
    payments: [],
    inventory: [],
    connections: [],
    notifications: [],
  };
  saveData(defaultData);
  return defaultData;
}

export const dataService = {
  initialize: () => {
    getData();
  },

  getData: () => getData(),

  getAllVendors: (): Vendor[] => {
    return getData().vendors;
  },

  getVendorById: (id: string): Vendor | undefined => {
    return getData().vendors.find(v => v.id === id);
  },

  addVendor: (vendor: Omit<Vendor, "id" | "createdAt">): Vendor => {
    const data = getData();
    const newVendor: Vendor = {
      ...vendor,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    data.vendors.push(newVendor);
    saveData(data);
    return newVendor;
  },

  updateVendor: (id: string, updates: Partial<Vendor>): Vendor | undefined => {
    const data = getData();
    const index = data.vendors.findIndex(v => v.id === id);
    if (index === -1) return undefined;
    data.vendors[index] = { ...data.vendors[index], ...updates };
    saveData(data);
    return data.vendors[index];
  },

  verifyVendor: (id: string): Vendor | undefined => {
    return dataService.updateVendor(id, { 
      verificationStatus: "verified",
      isBankVerified: true 
    });
  },

  getAllRFQs: (companyId?: string): RFQ[] => {
    const data = getData();
    if (companyId) {
      return data.rfqs.filter(r => r.companyId === companyId);
    }
    return data.rfqs;
  },

  getRFQById: (id: string): RFQ | undefined => {
    return getData().rfqs.find(r => r.id === id);
  },

  createRFQ: (rfq: Omit<RFQ, "id" | "createdAt">): RFQ => {
    const data = getData();
    const newRFQ: RFQ = {
      ...rfq,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    data.rfqs.push(newRFQ);
    saveData(data);
    return newRFQ;
  },

  updateRFQ: (id: string, updates: Partial<RFQ>): RFQ | undefined => {
    const data = getData();
    const index = data.rfqs.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    data.rfqs[index] = { ...data.rfqs[index], ...updates };
    saveData(data);
    return data.rfqs[index];
  },

  getQuotesForRFQ: (rfqId: string): Quote[] => {
    return getData().quotes.filter(q => q.rfqId === rfqId);
  },

  getQuotesForVendor: (vendorId: string): Quote[] => {
    return getData().quotes.filter(q => q.vendorId === vendorId);
  },

  submitQuote: (quote: Omit<Quote, "id" | "createdAt">): Quote => {
    const data = getData();
    const newQuote: Quote = {
      ...quote,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    data.quotes.push(newQuote);
    saveData(data);
    return newQuote;
  },

  updateQuoteStatus: (id: string, status: Quote["status"]): Quote | undefined => {
    const data = getData();
    const index = data.quotes.findIndex(q => q.id === id);
    if (index === -1) return undefined;
    data.quotes[index] = { ...data.quotes[index], status };
    saveData(data);
    return data.quotes[index];
  },

  acceptQuote: (quoteId: string): PurchaseOrder | undefined => {
    const data = getData();
    const quote = data.quotes.find(q => q.id === quoteId);
    if (!quote) return undefined;

    const rfq = data.rfqs.find(r => r.id === quote.rfqId);
    if (!rfq) return undefined;

    quote.status = "accepted";
    rfq.status = "awarded";
    const newOrder: PurchaseOrder = {
      id: generateId(), quoteId: quote.id, rfqId: quote.rfqId,
      companyId: rfq.companyId, vendorId: quote.vendorId,
      amount: quote.amount, status: "created", createdAt: new Date().toISOString(),
    };
    data.orders.push(newOrder);
    saveData(data);
    return newOrder;
  },

  // ─── ORDERS ───────────────────────────────────────────────
  getOrdersForCompany: (companyId: string): PurchaseOrder[] =>
    getData().orders.filter(o => o.companyId === companyId),

  getOrdersForVendor: (vendorId: string): PurchaseOrder[] =>
    getData().orders.filter(o => o.vendorId === vendorId),

  updateOrderStatus: (id: string, status: PurchaseOrder["status"]): PurchaseOrder | undefined => {
    const data = getData();
    const index = data.orders.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    data.orders[index] = { ...data.orders[index], status };
    saveData(data);
    return data.orders[index];
  },

  // ─── PAYMENTS ─────────────────────────────────────────────
  getPaymentsForVendor: (vendorId: string): Payment[] =>
    getData().payments.filter(p => p.vendorId === vendorId),

  getPaymentsForCompany: (companyId: string): Payment[] =>
    getData().payments.filter(p => p.companyId === companyId),

  createPayment: (payment: Omit<Payment, "id" | "createdAt">): Payment => {
    const data = getData();
    const newPayment: Payment = { ...payment, id: generateId(), createdAt: new Date().toISOString() };
    data.payments.push(newPayment);
    saveData(data);
    return newPayment;
  },

  // ─── NOTIFICATIONS ────────────────────────────────────────
  getNotificationsForUser: (userId: string): Notification[] =>
    getData().notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  markNotificationRead: (id: string): void => {
    const data = getData();
    const n = data.notifications.find(n => n.id === id);
    if (n) { n.read = true; saveData(data); }
  },

  markAllNotificationsRead: (userId: string): void => {
    const data = getData();
    data.notifications.filter(n => n.userId === userId).forEach(n => n.read = true);
    saveData(data);
  },

  pushNotification: (notification: Omit<Notification, "id" | "createdAt">): void => {
    const data = getData();
    data.notifications.push({ ...notification, id: generateId(), createdAt: new Date().toISOString() });
    saveData(data);
  },

  // ─── INVENTORY ────────────────────────────────────────────
  getInventory: (companyId: string): InventoryItem[] =>
    getData().inventory.filter(i => i.companyId === companyId),

  addInventoryItem: (item: Omit<InventoryItem, "id" | "lastUpdated">): InventoryItem => {
    const data = getData();
    const newItem: InventoryItem = { ...item, id: generateId(), lastUpdated: new Date().toISOString() };
    data.inventory.push(newItem);
    saveData(data);
    return newItem;
  },

  updateInventoryItem: (id: string, updates: Partial<InventoryItem>): InventoryItem | undefined => {
    const data = getData();
    const index = data.inventory.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    data.inventory[index] = { ...data.inventory[index], ...updates, lastUpdated: new Date().toISOString() };
    saveData(data);
    return data.inventory[index];
  },

  // ─── DASHBOARD AGGREGATES ─────────────────────────────────
  getDashboardStats: (companyId: string) => {
    const data = getData();
    const orders = data.orders.filter(o => o.companyId === companyId);
    const payments = data.payments.filter(p => p.companyId === companyId);
    const rfqs = data.rfqs.filter(r => r.companyId === companyId);
    const quotes = data.quotes.filter(q => {
      const rfq = data.rfqs.find(r => r.id === q.rfqId);
      return rfq && rfq.companyId === companyId;
    });

    const totalSpend = orders.reduce((sum, o) => sum + o.amount, 0);
    const pendingPayments = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
    const activeRFQs = rfqs.filter(r => r.status === "open" || r.status === "quoted").length;
    const verifiedVendors = data.connections.filter(c => c.companyId === companyId && c.status === "approved").length;
    const pendingQuotes = quotes.filter(q => q.status === "submitted").length;

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const spendByMonth: Record<string, number> = {};
    orders.forEach(o => {
      const m = monthNames[new Date(o.createdAt).getMonth()];
      spendByMonth[m] = (spendByMonth[m] || 0) + o.amount;
    });
    const spendData = monthNames.filter(m => spendByMonth[m]).map(m => ({ month: m, amount: spendByMonth[m] }));

    const colors = ["#4F46E5","#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4"];
    const categorySpend: Record<string, number> = {};
    dataService.getApprovedVendorsForCompany(companyId).forEach(v => {
      categorySpend[v.category] = (categorySpend[v.category] || 0) + 1;
    });
    const categoryData = Object.entries(categorySpend).map(([name, value], i) => ({
      name, value, color: colors[i % colors.length]
    }));

    return { totalSpend, pendingPayments, activeRFQs, verifiedVendors, pendingQuotes,
      totalOrders: orders.length, completedOrders: orders.filter(o => o.status === "completed").length,
      spendData, categoryData };
  },

  getVendorDashboardStats: (vendorUserId: string) => {
    const data = getData();
    const vendor = data.vendors.find(v => v.userId === vendorUserId);
    const vendorId = vendor?.id || vendorUserId;
    const orders = data.orders.filter(o => o.vendorId === vendorId);
    const payments = data.payments.filter(p => p.vendorId === vendorId);
    const quotes = data.quotes.filter(q => q.vendorId === vendorId);
    const rfqs = dataService.getVendorRFQs(vendorUserId);

    const totalRevenue = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
    const submittedQuotes = quotes.filter(q => q.status === "submitted").length;
    const acceptedQuotes = quotes.filter(q => q.status === "accepted").length;

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const revenueByMonth: Record<string, number> = {};
    payments.filter(p => p.status === "completed").forEach(p => {
      const m = monthNames[new Date(p.createdAt).getMonth()];
      revenueByMonth[m] = (revenueByMonth[m] || 0) + p.amount;
    });
    const revenueData = monthNames.filter(m => revenueByMonth[m]).map(m => ({ month: m, revenue: revenueByMonth[m] }));

    return { totalRevenue, pendingPayments, activeOrders: orders.filter(o => o.status !== "completed").length,
      openRFQs: rfqs.length, submittedQuotes, acceptedQuotes, totalOrders: orders.length, revenueData };
  },

  getRFQWithQuotes: (rfqId: string) => {
    const data = getData();
    const rfq = data.rfqs.find(r => r.id === rfqId);
    if (!rfq) return null;
    const quotes = data.quotes.filter(q => q.rfqId === rfqId).map(quote => ({
      ...quote, vendor: data.vendors.find(v => v.id === quote.vendorId)
    }));
    return { rfq, quotes };
  },

  getVendorByUserId: (userId: string): Vendor | undefined => {
    return getData().vendors.find(v => v.userId === userId);
  },

  getConnectionsForCompany: (companyId: string): VendorConnection[] => {
    return getData().connections.filter(c => c.companyId === companyId);
  },

  getConnectionsForVendor: (vendorUserId: string): VendorConnection[] => {
    const vendor = dataService.getVendorByUserId(vendorUserId);
    if (!vendor) return [];
    return getData().connections.filter(c => c.vendorId === vendor.userId);
  },

  getApprovedVendorsForCompany: (companyId: string): Vendor[] => {
    const data = getData();
    const approvedConns = data.connections.filter(c => c.companyId === companyId && c.status === "approved");
    const vendorUserIds = approvedConns.map(c => c.vendorId);
    return data.vendors.filter(v => vendorUserIds.includes(v.userId));
  },

  requestConnection: (vendorUserId: string, companyId: string): VendorConnection | null => {
    const data = getData();
    const existing = data.connections.find(c => c.vendorId === vendorUserId && c.companyId === companyId);
    if (existing) return null; 
    
    const newConn: VendorConnection = {
      id: generateId(),
      vendorId: vendorUserId,
      companyId,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };
    data.connections.push(newConn);
    
    const vendor = data.vendors.find(v => v.userId === vendorUserId);
    dataService.pushNotification({
       userId: companyId,
       type: "connection_request",
       title: "New Vendor Request",
       message: `${vendor?.companyName || "A vendor"} has requested to connect with your company.`,
       read: false,
       linkTo: "/company/vendors",
    });

    saveData(data);
    return newConn;
  },

  respondToConnection: (connId: string, status: "approved" | "rejected"): void => {
    const data = getData();
    const conn = data.connections.find(c => c.id === connId);
    if (conn) {
      conn.status = status;
      if (status === "approved") {
         conn.approvedAt = new Date().toISOString();
         dataService.pushNotification({
           userId: conn.vendorId,
           type: "connection_approved",
           title: "Connection Approved!",
           message: `Your connection request was approved. You can now submit quotes.`,
           read: false,
           linkTo: "/vendor/rfqs",
         });
      }
      saveData(data);
    }
  },

  getVendorRFQs: (vendorUserId: string): RFQ[] => {
    const data = getData();
    const approvedConns = data.connections.filter(c => c.vendorId === vendorUserId && c.status === "approved");
    const connectedCompanyIds = approvedConns.map(c => c.companyId);
    return data.rfqs.filter(r => connectedCompanyIds.includes(r.companyId) && (r.status === "open" || r.status === "quoted"));
  },

  clearAllData: () => {
    getStorage().removeItem(getStorageKey());
    initializeDefaultData();
  },

  // ─── DEMO-ONLY: Seed rich mock data ───────────────────────
  seedDemoData: (vendorUserId: string, companyUserId: string) => {
    const data = initializeDefaultData(); // fresh empty slate in sessionStorage

    // Vendors
    data.vendors.push({
      id: vendorUserId, userId: vendorUserId, companyName: "AlloyIndia Pvt Ltd", gstNumber: "29ABCDE1234F1Z5", contactPerson: "Demo Vendor", phone: "+91 98765 43210", email: "vendor@alloy.com", category: "Raw Materials", address: "Chennai, Tamil Nadu", bankAccountNumber: "0000000000", bankIfsc: "HDFC0001234", bankName: "HDFC", beneficiaryName: "AlloyIndia Pvt Ltd", isBankVerified: true, verificationStatus: "verified", createdAt: new Date().toISOString()
    });
    data.vendors.push({
      id: "comp_123", userId: "comp_123", companyName: "SteelTech Industries", gstNumber: "33ABCDE1234F1Z8", contactPerson: "Rajesh Kumar", phone: "+91 88888 88888", email: "sales@steeltech.in", category: "Raw Materials", address: "Pune, Maharashtra", bankAccountNumber: "0000000000", bankIfsc: "ICIC0001234", bankName: "ICICI", beneficiaryName: "SteelTech", isBankVerified: true, verificationStatus: "verified", createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
    });
    data.vendors.push({
      id: "vend_301", userId: "vend_301", companyName: "ChemPrime Solutions", gstNumber: "44BBXYZ1234F1Z8", contactPerson: "Amit Patel", phone: "+91 99999 55555", email: "sales@chemprime.in", category: "Chemicals", address: "Ahmedabad, Gujarat", bankAccountNumber: "0000000000", bankIfsc: "HDFC0001234", bankName: "HDFC", beneficiaryName: "ChemPrime", isBankVerified: true, verificationStatus: "verified", createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
    });
    data.vendors.push({
      id: "vend_302", userId: "vend_302", companyName: "LogiTech Packaging", gstNumber: "55AABBC1234F1Z8", contactPerson: "Meera Reddy", phone: "+91 99999 44444", email: "hello@logitechpack.com", category: "Packaging", address: "Hyderabad, Telangana", bankAccountNumber: "0000000000", bankIfsc: "HDFC0001234", bankName: "HDFC", beneficiaryName: "LogiTech", isBankVerified: true, verificationStatus: "verified", createdAt: new Date(Date.now() - 70 * 86400000).toISOString()
    });

    // Connections
    data.connections.push({ id: "conn_1", companyId: companyUserId, vendorId: vendorUserId, status: "approved", requestedAt: new Date(Date.now() - 60 * 86400000).toISOString() });
    data.connections.push({ id: "conn_2", companyId: "comp_201", vendorId: vendorUserId, status: "approved", requestedAt: new Date(Date.now() - 40 * 86400000).toISOString() });
    data.connections.push({ id: "conn_3", companyId: "comp_202", vendorId: vendorUserId, status: "pending", requestedAt: new Date(Date.now() - 10 * 86400000).toISOString() });
    data.connections.push({ id: "conn_4", companyId: companyUserId, vendorId: "vend_301", status: "approved", requestedAt: new Date(Date.now() - 25 * 86400000).toISOString() });

    // RFQs
    const rfq1Id = "rfq_1";
    data.rfqs.push({
      id: rfq1Id, companyId: companyUserId, title: "Quarterly Steel Procurement", description: "Require high-grade industrial steel for automotive chassis production.", deadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], status: "open", createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      items: [{ id: "item_1", itemName: "High Carbon Steel Sheets", quantity: 500, unit: "tonnes", specifications: "Grade: ASTM A36" }]
    });
    data.rfqs.push({
      id: "rfq_2", companyId: "comp_201", title: "Bulk Chemical Solvents", description: "Need industrial grade solvents for cleaning.", deadline: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0], status: "open", createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      items: [{ id: "item_3", itemName: "Acetone Industrial", quantity: 1000, unit: "liters", specifications: "Purity 99%" }]
    });
    data.rfqs.push({
      id: "rfq_3", companyId: "comp_202", title: "Monthly Packaging Materials", description: "Cardboard boxes and bubble wrap for dispatch.", deadline: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0], status: "open", createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      items: [{ id: "item_4", itemName: "Corrugated Boxes", quantity: 5000, unit: "pieces", specifications: "Double wall 12x12x12" }]
    });

    // Quotes
    const quote1Id = "quote_1";
    data.quotes.push({ id: quote1Id, rfqId: rfq1Id, vendorId: vendorUserId, amount: 4200000, terms: "60% advance, 40% on delivery", deliveryDays: 14, status: "accepted", createdAt: new Date(Date.now() - 1 * 86400000).toISOString() });
    data.quotes.push({ id: "quote_dummy", rfqId: rfq1Id, vendorId: "comp_123", amount: 4400000, terms: "50% advance", deliveryDays: 20, status: "rejected", createdAt: new Date(Date.now() - 1.5 * 86400000).toISOString() });
    data.quotes.push({ id: "quote_2", rfqId: "rfq_2", vendorId: "vend_301", amount: 150000, terms: "100% advance", deliveryDays: 7, status: "submitted", createdAt: new Date(Date.now() - 1 * 86400000).toISOString() });

    // Orders
    data.orders.push({ id: "ord_1", quoteId: quote1Id, rfqId: rfq1Id, companyId: companyUserId, vendorId: vendorUserId, status: "created", amount: 4200000, createdAt: new Date().toISOString() });

    // Payments (6 months of mock revenue for graphs)
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      data.payments.push({
        id: `pay_mock_${i}`, orderId: `old_ord_${i}`, companyId: companyUserId, vendorId: vendorUserId,
        amount: Math.floor(Math.random() * 2000000) + 1000000,
        status: i > 0 ? "completed" : "pending",
        transactionId: `txn_${i}`,
        createdAt: d.toISOString()
      });
    }

    saveData(data);
  }
};
