import { Link, useLocation, useNavigate } from "react-router";
import { cn } from "../lib/utils";
import { authService } from "../lib/auth";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  GitCompare,
  ShoppingCart,
  Package,
  Wallet,
  Activity,
  Building2,
  ClipboardList,
  DollarSign,
  LogOut,
  Sparkles,
  Server,
} from "lucide-react";

interface SidebarProps {
  type: "company" | "vendor";
}

const companyNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/company/dashboard" },
  { icon: Users, label: "Vendor Directory", path: "/company/vendors" },
  { icon: FileText, label: "RFQ Management", path: "/company/rfq" },
  { icon: MessageSquare, label: "Quote Processing", path: "/company/quotes" },
  { icon: GitCompare, label: "Comparison Engine", path: "/company/comparison" },
  { icon: ShoppingCart, label: "Purchase Orders", path: "/company/orders" },
  { icon: Package, label: "Inventory", path: "/company/inventory" },
  { icon: Wallet, label: "Finance", path: "/company/finance" },
  { icon: Activity, label: "Procurement Health", path: "/company/health" },
  { icon: Sparkles, label: "AI Tools", path: "/company/ai-tools" },
];

const vendorNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/vendor/dashboard" },
  { icon: ClipboardList, label: "RFQs", path: "/vendor/rfqs" },
  { icon: MessageSquare, label: "My Quotes", path: "/vendor/quotes" },
  { icon: ShoppingCart, label: "Orders", path: "/vendor/orders" },
  { icon: DollarSign, label: "Payments", path: "/vendor/payments" },
  { icon: Sparkles, label: "AI Tools", path: "/vendor/ai-tools" },
];

export function Sidebar({ type }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const navItems = type === "company" ? companyNavItems : vendorNavItems;
  const primaryColor = type === "company" ? "bg-primary" : "bg-[#10B981]";

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", primaryColor)}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">ZENITH</h1>
            <p className="text-xs text-muted uppercase tracking-wide">
              {type === "company" ? "Company Portal" : "Vendor Portal"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150",
                isActive
                  ? type === "company"
                    ? "bg-[#EEF2FF] text-primary"
                    : "bg-[#D1FAE5] text-[#059669]"
                  : "text-secondary hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold", primaryColor)}>
            {user ? getInitials(user.companyName) : type === "company" ? "AC" : "VU"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.companyName || (type === "company" ? "Admin User" : "Vendor User")}
            </p>
            <p className="text-xs text-muted truncate">
              {user?.email || (type === "company" ? "admin@acme.com" : "vendor@alloy.com")}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-destructive hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
