import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { authService } from "../lib/auth";

export function LoginPage() {
  const [activeTab, setActiveTab] = useState<"company" | "vendor">("company");
  const [showRegistration, setShowRegistration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authService.login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.needsBankVerification) {
        navigate("/verify-bank");
      } else if (result.user?.role === "company") {
        navigate("/company/dashboard");
      } else {
        navigate("/vendor/dashboard");
      }
    } else {
      setError(result.error || "Login failed");
    }
  };

  const handleDemoLogin = async (role: "company" | "vendor") => {
    setLoading(true);
    const result = await authService.demoLogin(role);
    setLoading(false);

    if (result.success) {
      if (role === "company") {
        navigate("/company/dashboard");
      } else {
        navigate("/vendor/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-white">ZENITH</h1>
          </div>
          
          <div className="max-w-md">
            <h2 className="text-4xl font-semibold text-white mb-4">
              AI-Powered Procurement ERP
            </h2>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Streamline your procurement workflow with intelligent vendor management, 
              automated quote processing, and real-time insights.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">AI-Driven Insights</h3>
              <p className="text-indigo-100 text-sm">
                Get intelligent recommendations for vendor selection and pricing optimization
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Seamless Workflow</h3>
              <p className="text-indigo-100 text-sm">
                From RFQ to PO, manage your entire procurement lifecycle in one platform
              </p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome back</h2>
            <p className="text-secondary">Sign in to your account to continue</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-accent rounded-lg">
            <button
              onClick={() => setActiveTab("company")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "company"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-secondary hover:text-foreground"
              }`}
            >
              Company Login
            </button>
            <button
              onClick={() => setActiveTab("vendor")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "vendor"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-secondary hover:text-foreground"
              }`}
            >
              Vendor Login
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                placeholder={activeTab === "company" ? "admin@company.com" : "vendor@company.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border" />
                <span className="text-sm text-secondary">Remember me</span>
              </label>
              <button type="button" className="text-sm text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Registration Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-secondary">
              {activeTab === "company" ? (
                <>
                  New company?{" "}
                  <button
                    onClick={() => navigate("/register/company")}
                    className="text-primary hover:underline font-medium"
                  >
                    Register here
                  </button>
                </>
              ) : (
                <>
                  New vendor?{" "}
                  <button
                    onClick={() => navigate("/register/vendor")}
                    className="text-primary hover:underline font-medium"
                  >
                    Register here
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Demo Login */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-800 dark:text-amber-400 font-medium mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Frontend UI Demo Mode
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                Demo accounts provide a temporary sandbox preview. <strong className="font-semibold">All real persistent data, backend AI APIs, live inventory servers, and real GST verification require a registered account using the standard login above.</strong>
              </p>
            </div>
            
            <p className="text-xs text-center text-muted mb-3">Quick Preview (Sandbox Data Only)</p>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1 text-xs"
                onClick={() => handleDemoLogin("company")}
                disabled={loading}
              >
                Demo Company
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1 text-xs"
                onClick={() => handleDemoLogin("vendor")}
                disabled={loading}
              >
                Demo Vendor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
