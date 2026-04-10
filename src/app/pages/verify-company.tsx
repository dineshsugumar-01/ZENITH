import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Building2, ArrowLeft, Sparkles, CheckCircle, AlertCircle, Loader2, XCircle, MapPin, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { authService } from "../lib/auth";
import { verifyGST, validateGSTOffline, type GSTVerificationResult } from "../lib/gstVerify";

export function CompanyVerificationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [gstResult, setGstResult] = useState<GSTVerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  const user = authService.getCurrentUser();

  // Auto-verify GST on load if user has one
  useEffect(() => {
    if (user?.gstNumber && user.gstNumber.length === 15) {
      const quick = validateGSTOffline(user.gstNumber);
      setGstResult(quick);
    }
  }, []);

  const handleGSTVerify = async () => {
    if (!user?.gstNumber) return;
    setVerifying(true);
    try {
      const result = await verifyGST(user.gstNumber);
      setGstResult(result);
    } catch {
      setGstResult(validateGSTOffline(user?.gstNumber || ""));
    }
    setVerifying(false);
  };

  const handleProceed = async () => {
    setLoading(true);
    const result = await authService.verifyCompany();
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate("/company/dashboard");
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-[#EEF2FF] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Company Verified!</h2>
          <p className="text-secondary mb-6">
            Your company has been successfully verified. Redirecting to dashboard...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <button onClick={() => navigate("/login")} className="flex items-center gap-2 text-indigo-200 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span>Logout</span>
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
              Company Verification
            </h2>
            <p className="text-indigo-100 text-lg leading-relaxed">
              We verify your GST number with real-time checksum validation and state code mapping.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">GST Checksum Validation</h3>
              <p className="text-indigo-100 text-sm">
                Real Luhn algorithm verifies the check digit of your GSTIN
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">State Code Mapping</h3>
              <p className="text-indigo-100 text-sm">
                Verifies registration state from first 2 digits of GSTIN
              </p>
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Right Panel - Verification */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Verification Status</h2>
            <p className="text-secondary">GST & company identity verification</p>
          </div>

          <Card className="p-6 mb-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Company Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Company Name</span>
                <span className="text-foreground font-medium">{user?.companyName || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">GST Number</span>
                <span className="text-foreground font-mono font-medium">{user?.gstNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Email</span>
                <span className="text-foreground font-medium">{user?.email || "N/A"}</span>
              </div>
            </div>
          </Card>

          {/* GST Verification Panel */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">GST Verification</h3>
              <Button size="sm" variant="secondary" onClick={handleGSTVerify} disabled={verifying || !user?.gstNumber}>
                {verifying ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Verifying...</> : "Verify GST"}
              </Button>
            </div>

            {gstResult ? (
              <div className="space-y-3">
                {/* Status Badge */}
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                  gstResult.valid 
                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" 
                    : "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20"
                }`}>
                  {gstResult.valid ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${gstResult.valid ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                      {gstResult.valid ? "Valid GSTIN" : "Invalid GSTIN"}
                    </p>
                    <p className="text-xs text-secondary">{gstResult.message}</p>
                  </div>
                </div>

                {/* Details Grid */}
                {gstResult.formatValid && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-accent rounded-lg">
                      <p className="text-muted mb-0.5">Format</p>
                      <p className="font-medium text-foreground flex items-center gap-1">
                        {gstResult.formatValid ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                        {gstResult.formatValid ? "Valid" : "Invalid"}
                      </p>
                    </div>
                    <div className="p-2 bg-accent rounded-lg">
                      <p className="text-muted mb-0.5">Checksum</p>
                      <p className="font-medium text-foreground flex items-center gap-1">
                        {gstResult.checksumValid ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                        {gstResult.checksumValid ? "Passed" : "Failed"}
                      </p>
                    </div>
                    <div className="p-2 bg-accent rounded-lg">
                      <p className="text-muted mb-0.5">State</p>
                      <p className="font-medium text-foreground">{gstResult.stateName || "N/A"}</p>
                    </div>
                    <div className="p-2 bg-accent rounded-lg">
                      <p className="text-muted mb-0.5">Entity Type</p>
                      <p className="font-medium text-foreground">{gstResult.entityTypeDesc || "N/A"}</p>
                    </div>
                    <div className="p-2 bg-accent rounded-lg">
                      <p className="text-muted mb-0.5">PAN</p>
                      <p className="font-medium text-foreground font-mono">{gstResult.panNumber || "N/A"}</p>
                    </div>
                    <div className="p-2 bg-accent rounded-lg">
                      <p className="text-muted mb-0.5">Source</p>
                      <p className="font-medium text-foreground capitalize">{gstResult.source}</p>
                    </div>
                    {gstResult.businessName && (
                      <div className="p-2 bg-accent rounded-lg col-span-2">
                        <p className="text-muted mb-0.5">Business Name (from portal)</p>
                        <p className="font-medium text-foreground">{gstResult.businessName}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-4 text-sm text-secondary bg-accent rounded-lg">
                <Sparkles className="w-5 h-5 mx-auto mb-2 text-primary" />
                Click "Verify GST" to run real-time checksum and state validation
              </div>
            )}
          </Card>

          {/* Proceed Button */}
          <div className="border-t border-border pt-6">
            <Button 
              onClick={handleProceed} 
              className="w-full" 
              size="lg" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Proceed to Dashboard"
              )}
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            GST verification uses real checksum algorithm. When the backend is running, 
            it also attempts online lookup from government records.
          </p>
        </div>
      </div>
    </div>
  );
}
