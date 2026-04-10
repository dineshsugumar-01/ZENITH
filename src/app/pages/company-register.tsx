import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, ArrowLeft, Sparkles, Check, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { authService } from "../lib/auth";

export function CompanyRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    companyName: "",
    gstNumber: "",
    cinNumber: "",
    directorName: "",
    phone: "",
    email: "",
    password: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authService.registerCompany(formData);
    setLoading(false);

    if (result.success) {
      navigate("/verify-company");
    } else {
      setError(result.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <button onClick={() => navigate("/login")} className="flex items-center gap-2 text-indigo-200 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-white">ZENITH</h1>
          </div>
          
          <div className="max-w-md">
            <h2 className="text-4xl font-semibold text-white mb-4">
              Register Your Company
            </h2>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Create your company account to start managing procurement efficiently.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">GST Verified</h3>
              <p className="text-indigo-100 text-sm">
                Your business GST details will be automatically verified
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Document Verification</h3>
              <p className="text-indigo-100 text-sm">
                Submit company documents for verification
              </p>
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Company Registration</h2>
            <p className="text-secondary">Register your company to start creating RFQs</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  AI Document Processing
                </h3>
                <p className="text-xs text-secondary mb-3">
                  Upload your GST certificate or company registration for automatic verification
                </p>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    className="flex-1"
                  />
                  <Button type="button" size="sm">
                    Upload
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Company Name *
                </label>
                <Input
                  name="companyName"
                  placeholder="Acme Manufacturing Pvt Ltd"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  GST Number *
                </label>
                <Input
                  name="gstNumber"
                  placeholder="27AABCU9603R1ZM"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  CIN Number *
                </label>
                <Input
                  name="cinNumber"
                  placeholder="U29100MH2023PTC123456"
                  value={formData.cinNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Phone Number *
                </label>
                <Input
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Director Name *
                </label>
                <Input
                  name="directorName"
                  placeholder="John Doe"
                  value={formData.directorName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email Address *
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="admin@acme.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password *
              </label>
              <Input
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Registered Address *
              </label>
              <Input
                name="address"
                placeholder="123 Industrial Area, Mumbai, Maharashtra"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Document Upload</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    GST Certificate
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    className="cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Company Registration (ROC)
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <p className="mt-3 text-xs text-muted">
                Documents will be verified within 24-48 hours. You can still browse the platform while verification is pending.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" size="lg" disabled={loading}>
                {loading ? "Registering..." : "Complete Registration"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/login")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
