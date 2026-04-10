import { useState, useEffect, useRef } from "react";
import { Bell, Search, Settings, UserCircle, LogOut, Shield, MapPin, CreditCard, Activity, Link as LinkIcon, Download, Zap, CheckCircle, Network, FileText, Package, Users, DollarSign, X, Server } from "lucide-react";
import { Link } from "react-router";
import { Input } from "./ui/input";
import { useStockSimulator } from "../lib/stockSimulator";
import { authService } from "../lib/auth";
import { dataService, Notification } from "../lib/data";

interface NavbarProps {
  title: string;
  type: "company" | "vendor";
}

const NOTIF_ICONS: Record<string, any> = {
  rfq_published: { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  quote_submitted: { icon: Activity, color: "text-blue-400", bg: "bg-blue-500/20" },
  connection_request: { icon: Network, color: "text-purple-400", bg: "bg-purple-500/20" },
  connection_approved: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  negotiation: { icon: Activity, color: "text-orange-400", bg: "bg-orange-500/20" },
  stock_alert: { icon: Zap, color: "text-red-400", bg: "bg-red-500/20" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Navbar({ title, type }: NavbarProps) {
  const { isConnected, connectServer } = useStockSimulator();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const user = authService.getCurrentUser();

  useEffect(() => {
    if (user) {
      const ns = dataService.getNotificationsForUser(user.id);
      setNotifications(ns);
    }
    // Refresh every 15 seconds for live updates
    const interval = setInterval(() => {
      if (user) setNotifications(dataService.getNotificationsForUser(user.id));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    if (user) {
      dataService.markAllNotificationsRead(user.id);
      setNotifications(dataService.getNotificationsForUser(user.id));
    }
  };

  const handleNotifClick = (n: Notification) => {
    dataService.markNotificationRead(n.id);
    setNotifications(dataService.getNotificationsForUser(user?.id || ""));
    if (n.linkTo) window.location.href = n.linkTo;
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/";
  };

  // Search logic
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const q = query.toLowerCase();
    const data = dataService.getData();
    const results: any[] = [];

    // Search RFQs
    data.rfqs.forEach(rfq => {
      if (rfq.title.toLowerCase().includes(q) || rfq.id.toLowerCase().includes(q) || rfq.description.toLowerCase().includes(q)) {
        results.push({ type: "RFQ", icon: FileText, label: rfq.title, sub: `${rfq.status} • ${rfq.items.length} items`, link: type === "company" ? "/company/rfq" : "/vendor/rfqs", color: "text-blue-400", bg: "bg-blue-500/10" });
      }
    });

    // Search Vendors
    data.vendors.forEach(v => {
      if (v.companyName.toLowerCase().includes(q) || v.email.toLowerCase().includes(q) || v.category.toLowerCase().includes(q)) {
        results.push({ type: "Vendor", icon: Users, label: v.companyName, sub: `${v.category} • ${v.email}`, link: "/company/vendors", color: "text-emerald-400", bg: "bg-emerald-500/10" });
      }
    });

    // Search Orders
    data.orders.forEach(o => {
      if (o.id.toLowerCase().includes(q)) {
        results.push({ type: "Order", icon: Package, label: `Order ${o.id.slice(-8).toUpperCase()}`, sub: `₹${o.amount.toLocaleString()} • ${o.status}`, link: type === "company" ? "/company/orders" : "/vendor/orders", color: "text-purple-400", bg: "bg-purple-500/10" });
      }
    });

    // Search Quotes
    data.quotes.forEach(qt => {
      if (qt.id.toLowerCase().includes(q) || qt.terms.toLowerCase().includes(q)) {
        results.push({ type: "Quote", icon: DollarSign, label: `Quote ${qt.id.slice(-8).toUpperCase()}`, sub: `₹${qt.amount.toLocaleString()} • ${qt.status}`, link: type === "company" ? "/company/quotes" : "/vendor/quotes", color: "text-amber-400", bg: "bg-amber-500/10" });
      }
    });

    // Search Payments
    data.payments.forEach(p => {
      if (p.id.toLowerCase().includes(q) || p.transactionId.toLowerCase().includes(q)) {
        results.push({ type: "Payment", icon: CreditCard, label: `Payment ${p.id.slice(-8).toUpperCase()}`, sub: `₹${p.amount.toLocaleString()} • ${p.status}`, link: type === "company" ? "/company/finance" : "/vendor/payments", color: "text-cyan-400", bg: "bg-cyan-500/10" });
      }
    });

    setSearchResults(results.slice(0, 8));
    setShowSearch(true);
  };

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h1 className="text-foreground font-semibold text-lg">{title}</h1>

        {type === "company" && (
          <div className="ml-4 flex items-center">
            {isConnected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Stock Server Linked
              </div>
            ) : (
              <button
                onClick={connectServer}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 transition-colors rounded-full text-xs font-medium text-white shadow-lg shadow-indigo-500/20"
              >
                <LinkIcon className="w-3 h-3" /> Connect ERP / Stock Server
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-64 md:w-80" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            placeholder="Search RFQs, vendors, orders..."
            className="pl-10 h-9 bg-accent/50 border-transparent focus:border-primary/50 pr-8"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => { if (searchQuery.trim()) setShowSearch(true); setShowNotifications(false); setShowSettings(false); setShowProfile(false); }}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setSearchResults([]); setShowSearch(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent">
              <X className="w-3.5 h-3.5 text-muted" />
            </button>
          )}

          {showSearch && (
            <div className="absolute left-0 right-0 mt-2 bg-card border border-border shadow-2xl rounded-xl overflow-hidden" style={{ zIndex: 60 }}>
              {searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Search className="w-8 h-8 mx-auto mb-2 text-muted opacity-40" />
                  <p className="text-sm text-secondary">No results for "{searchQuery}"</p>
                  <p className="text-xs text-muted mt-1">Try searching by name, ID, or category</p>
                </div>
              ) : (
                <>
                  <div className="px-3 py-2 border-b border-border text-xs text-secondary">
                    {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
                  </div>
                  {searchResults.map((r, i) => {
                    const Icon = r.icon;
                    return (
                      <a
                        key={i}
                        href={r.link}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors cursor-pointer border-b border-border/50 last:border-0"
                      >
                        <div className={`w-8 h-8 rounded-lg ${r.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${r.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{r.label}</p>
                          <p className="text-xs text-secondary truncate">{r.sub}</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-accent rounded text-muted font-medium flex-shrink-0">{r.type}</span>
                      </a>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); setShowProfile(false); }}
            className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-accent text-foreground' : 'hover:bg-accent text-secondary'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-destructive text-white text-[10px] rounded-full flex items-center justify-center px-0.5 border-2 border-card">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-card border border-border shadow-xl rounded-xl overflow-hidden py-2" style={{ zIndex: 50 }}>
              <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                <h3 className="font-semibold text-sm">Notifications {unreadCount > 0 && <span className="ml-2 bg-destructive text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}</h3>
                {unreadCount > 0 && <span className="text-xs text-primary cursor-pointer hover:underline" onClick={handleMarkAllRead}>Mark all read</span>}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-secondary text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 15).map((n) => {
                    const cfg = NOTIF_ICONS[n.type] || NOTIF_ICONS.rfq_published;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`px-4 py-3 hover:bg-accent cursor-pointer flex gap-3 border-l-2 ${!n.read ? "border-primary bg-primary/5" : "border-transparent"}`}
                      >
                        <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-foreground"}`}>{n.title}</p>
                          <p className="text-xs text-secondary mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-muted mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); setShowProfile(false); }}
            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-accent text-foreground' : 'hover:bg-accent text-secondary'}`}
          >
            <Settings className="w-5 h-5" />
          </button>

          {showSettings && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border shadow-xl rounded-xl py-2" style={{ zIndex: 50 }}>
              <div className="px-4 py-2 text-xs font-semibold text-secondary uppercase tracking-wider">Settings</div>
              
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-secondary"/>
                    <span className="text-sm text-foreground">Security & 2FA</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full">Active</span>
                </div>
                <p className="text-xs text-muted ml-6">Two-factor authentication is enabled for your account.</p>
              </div>

              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-secondary"/>
                    <span className="text-sm text-foreground">Notifications</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {notifications.filter(n => !n.read).length} unread
                  </span>
                </div>
                <p className="text-xs text-muted ml-6">Email and in-app alerts for RFQs, quotes, and stock changes.</p>
              </div>

              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-secondary"/>
                  <span className="text-sm text-foreground">Billing & Plans</span>
                </div>
                <p className="text-xs text-muted ml-6 mt-1">Current Plan: <strong className="text-foreground">Enterprise</strong></p>
              </div>

              {!authService.isDemo() && user?.role === "company" && (
                <div className="px-4 py-3 border-b border-border">
                  <Link to="/company/stock-settings" className="flex items-center gap-2 text-sm text-foreground hover:text-primary">
                    <Server className="w-4 h-4 text-secondary"/>
                    Stock Server Settings
                  </Link>
                  <p className="text-xs text-muted ml-6 mt-1">Configure your internal FastAPI connection.</p>
                </div>
              )}

              <div className="px-4 py-3 border-b border-border">
                <button
                  onClick={() => {
                    const data = dataService.getData();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = "zenith_report.json"; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                >
                  <Download className="w-4 h-4 text-secondary"/>
                  Download Data Report
                </button>
              </div>

              {authService.isDemo() && (
                <div className="px-4 pt-2 pb-1 mt-1">
                  <button
                    onClick={() => { dataService.clearAllData(); window.location.reload(); }}
                    className="w-full text-left text-xs text-destructive hover:underline"
                  >
                    Reset All Data (demo)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowSettings(false); }}
            className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all ${showProfile ? 'border-primary bg-accent' : 'border-border hover:border-secondary'}`}
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground truncate max-w-[100px]">{user?.companyName || user?.email || "Admin"}</span>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border shadow-xl rounded-xl py-2" style={{ zIndex: 50 }}>
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{user?.companyName || "Administrator"}</p>
                    <p className="text-xs text-secondary">{user?.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs py-0.5 px-2 bg-primary/10 text-primary rounded-full">
                    {user?.role === "company" ? "Company Account" : "Vendor Account"}
                  </span>
                  {user?.verificationStatus === "verified" ? (
                    <span className="text-xs py-0.5 px-2 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-xs py-0.5 px-2 bg-amber-500/10 text-amber-500 rounded-full">Pending</span>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 space-y-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary">User ID</span>
                  <span className="text-xs text-foreground font-mono">{user?.id?.slice(0, 16) || "N/A"}</span>
                </div>
                {user?.gstNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary">GST Number</span>
                    <span className="text-xs text-foreground font-mono">{user.gstNumber}</span>
                  </div>
                )}
                {user?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary">Phone</span>
                    <span className="text-xs text-foreground">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary">Joined</span>
                  <span className="text-xs text-foreground">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>

              <div className="py-1">
                {!authService.isDemo() && user?.role === "company" && (
                  <Link to="/company/stock-settings" className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent flex items-center gap-2">
                    <Server className="w-4 h-4 text-secondary"/>
                    Stock Server Settings
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"><LogOut className="w-4 h-4"/>Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
