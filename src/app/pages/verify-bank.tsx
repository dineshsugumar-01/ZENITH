import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, ArrowLeft, Sparkles, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { authService } from "../lib/auth";

export function VendorBankVerificationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");

  const user = authService.getCurrentUser();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authService.verifyBankPennyDrop(utrNumber);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate("/vendor/dashboard");
      }, 2000);
    } else {
      setError(result.error || "Verification failed");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[#059669]" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Bank Verified!</h2>
          <p className="text-secondary mb-6">
            Your bank account has been successfully verified. Redirecting to dashboard...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#10B981] p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <button onClick={() => navigate("/login")} className="flex items-center gap-2 text-white/80 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span>Logout</span>
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
              Bank Verification
            </h2>
            <p className="text-emerald-100 text-lg leading-relaxed">
              Complete the secure bank verification to confirm your account details.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">How it works</h3>
              <p className="text-emerald-100 text-sm">
                We initiate a secure ping to your registered bank account. Please confirm the authorization to complete verification.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Secure & Instant</h3>
              <p className="text-emerald-100 text-sm">
                Your account details are verified instantly through our secure automated system
              </p>
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Right Panel - Verification Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Bank Verification</h2>
            <p className="text-secondary">Complete account verification</p>
          </div>

          <Card className="p-6 mb-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Your Bank Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Account Number</span>
                <span className="text-foreground font-medium">****{user?.phone?.slice(-4) || "1234"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">IFSC Code</span>
                <span className="text-foreground font-medium">HDFC0******</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Bank Name</span>
                <span className="text-foreground font-medium">HDFC Bank</span>
              </div>
            </div>
          </Card>

          <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Verification Initiated
                </h3>
                <p className="text-xs text-secondary mb-2">
                  We have initiated a secure verification ping to your account. This may take 1-2 minutes.
                </p>
                <p className="text-xs text-secondary">
                  Please check your bank notifications and enter the Verification ID or UTR below.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                UTR / Transaction ID *
              </label>
              <Input
                placeholder="Enter UTR number (e.g., SBIN123456789012345)"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                required
              />
              <p className="mt-2 text-xs text-muted">
                You can find this in your bank app/website transaction history
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Complete Registration"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Having trouble? Contact support for assistance
          </p>
        </div>
      </div>
    </div>
  );
}
