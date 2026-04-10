import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, ArrowLeft, Sparkles, Check, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { authService } from "../lib/auth";

const categories = [
  "Raw Materials",
  "Electronics",
  "Machinery",
  "Office Supplies",
  "Packaging",
  "Chemicals",
  "IT Services",
  "Logistics",
  "Other",
];

export function VendorRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"details" | "bank">("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    companyName: "",
    gstNumber: "",
    contactPerson: "",
    phone: "",
    email: "",
    password: "",
    category: "",
    address: "",
    bankAccountNumber: "",
    bankIfsc: "",
    bankName: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authService.registerVendor(formData);
    setLoading(false);

    if (result.success) {
      navigate("/verify-bank");
    } else {
      setError(result.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#10B981] p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <button onClick={() => navigate("/login")} className="flex items-center gap-2 text-white/80 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#10B981]" />
            </div>
            <h1 className="text-2xl font-semibold text-white">ZENITH</h1>
          </div>
          
          <div className="max-w-md">
            <h2 className="text-4xl font-semibold text-white mb-4">
              Join as a Vendor
            </h2>
            <p className="text-emerald-100 text-lg leading-relaxed">
              Register your business to start receiving RFQs and submitting quotes.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Secure Banking</h3>
              <p className="text-emerald-100 text-sm">
                Securely link your business bank account for payments
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">GST Verified</h3>
              <p className="text-emerald-100 text-sm">
                Your GST details will be verified for authenticity
              </p>
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Vendor Registration</h2>
            <p className="text-secondary">Complete your profile to start transacting</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmitDetails} className="space-y-6">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Company Name *
                </label>
                <Input
                  name="companyName"
                  placeholder="AlloyIndia Pvt Ltd"
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
                  placeholder="29ABCDE1234F1Z5"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Contact Person *
                </label>
                <Input
                  name="contactPerson"
                  placeholder="Rajesh Kumar"
                  value={formData.contactPerson}
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
                  Email Address *
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="contact@alloyindia.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Category *
                </label>
                <select
                  name="category"
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Business Address *
                </label>
                <Input
                  name="address"
                  placeholder="123 Industrial Area, Chennai"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Financial Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Bank Account Number *
                  </label>
                  <Input
                    name="bankAccountNumber"
                    placeholder="1234567890"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    IFSC Code *
                  </label>
                  <Input
                    name="bankIfsc"
                    placeholder="HDFC0001234"
                    value={formData.bankIfsc}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Bank Name *
                </label>
                <Input
                  name="bankName"
                  placeholder="HDFC Bank"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                />
              </div>

              <p className="mt-3 text-xs text-muted">
                Your banking details will be securely verified to enable seamless transactions.
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
