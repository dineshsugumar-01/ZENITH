import { createBrowserRouter, Navigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { LoginPage } from "./pages/login";
import { VendorRegisterPage } from "./pages/vendor-register";
import { CompanyRegisterPage } from "./pages/company-register";
import { VendorBankVerificationPage } from "./pages/verify-bank";
import { CompanyVerificationPage } from "./pages/verify-company";
import { CompanyDashboard } from "./pages/company/dashboard";
import { VendorDirectory } from "./pages/company/vendors";
import { RFQManagement } from "./pages/company/rfq";
import { QuoteProcessing } from "./pages/company/quotes";
import { ComparisonEngine } from "./pages/company/comparison";
import { PurchaseOrders } from "./pages/company/orders";
import { Inventory } from "./pages/company/inventory";
import { Finance } from "./pages/company/finance";
import { ProcurementHealth } from "./pages/company/health";
import { CompanyAITools } from "./pages/company/ai-tools";
import { StockSettings } from "./pages/company/stock-settings";
import { VendorDashboard } from "./pages/vendor/dashboard";
import { VendorRFQs } from "./pages/vendor/rfqs";
import { VendorQuotes } from "./pages/vendor/quotes";
import { VendorOrders } from "./pages/vendor/orders";
import { VendorPayments } from "./pages/vendor/payments";
import { VendorAITools } from "./pages/vendor/ai-tools";
import { authService } from "./lib/auth";

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: "company" | "vendor" }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "vendor" && user.verificationStatus === "pending_bank") {
    return <Navigate to="/verify-bank" replace />;
  }

  if (user.role === "company" && user.verificationStatus === "pending") {
    return <Navigate to="/verify-company" replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = authService.getCurrentUser();

  if (user) {
    if (user.role === "company" && user.verificationStatus === "verified") {
      return <Navigate to="/company/dashboard" replace />;
    } else if (user.role === "vendor" && user.verificationStatus === "verified") {
      return <Navigate to="/vendor/dashboard" replace />;
    } else if (user.role === "vendor" && user.verificationStatus === "pending_bank") {
      return <Navigate to="/verify-bank" replace />;
    } else if (user.role === "company" && user.verificationStatus === "pending") {
      return <Navigate to="/verify-company" replace />;
    }
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/register/vendor",
    element: (
      <PublicOnlyRoute>
        <VendorRegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/register/company",
    element: (
      <PublicOnlyRoute>
        <CompanyRegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/verify-bank",
    element: <VendorBankVerificationPage />,
  },
  {
    path: "/verify-company",
    element: <CompanyVerificationPage />,
  },
  {
    path: "/company/dashboard",
    element: (
      <ProtectedRoute requiredRole="company">
        <CompanyDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/company/vendors",
    element: (
      <ProtectedRoute requiredRole="company">
        <VendorDirectory />
      </ProtectedRoute>
    ),
  },
  {
    path: "/company/rfq",
    element: (
      <ProtectedRoute requiredRole="company">
        <RFQManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/company/quotes",
    element: (
      <ProtectedRoute requiredRole="company">
        <QuoteProcessing />
      </ProtectedRoute>
    ),
  },
  {
    path: "/company/comparison",
    element: (
      <ProtectedRoute requiredRole="company">
        <ComparisonEngine />
      </ProtectedRoute>
    ),
  },
  {
    path: "/company/orders",
    element: (
      <ProtectedRoute requiredRole="company">
        <PurchaseOrders />
      </ProtectedRoute>
    ),
  },
  {
    path: "/company/inventory",
    element: (
      <ProtectedRoute requiredRole="company">
        <Inventory />
      </ProtectedRoute>
    ),
  },
  {
    path: "/company/finance",
    element: (
      <ProtectedRoute requiredRole="company">
        <Finance />
      </ProtectedRoute>
    ),
  },
  {
    path: "/company/health",
    element: (
      <ProtectedRoute requiredRole="company">
        <ProcurementHealth />
      </ProtectedRoute>
    ),
  },
  {
    path: "/company/ai-tools",
    element: (
      <ProtectedRoute requiredRole="company">
        <CompanyAITools />
      </ProtectedRoute>
    ),
  },
  {
    path: "/company/stock-settings",
    element: (
      <ProtectedRoute requiredRole="company">
        <StockSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/vendor/dashboard",
    element: (
      <ProtectedRoute requiredRole="vendor">
        <VendorDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/vendor/rfqs",
    element: (
      <ProtectedRoute requiredRole="vendor">
        <VendorRFQs />
      </ProtectedRoute>
    ),
  },
  {
    path: "/vendor/quotes",
    element: (
      <ProtectedRoute requiredRole="vendor">
        <VendorQuotes />
      </ProtectedRoute>
    ),
  },
  {
    path: "/vendor/orders",
    element: (
      <ProtectedRoute requiredRole="vendor">
        <VendorOrders />
      </ProtectedRoute>
    ),
  },
  {
    path: "/vendor/payments",
    element: (
      <ProtectedRoute requiredRole="vendor">
        <VendorPayments />
      </ProtectedRoute>
    ),
  },
  {
    path: "/vendor/ai-tools",
    element: (
      <ProtectedRoute requiredRole="vendor">
        <VendorAITools />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
