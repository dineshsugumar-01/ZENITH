import { useState } from "react";
import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { 
  Shield, 
  TrendingUp, 
  Leaf, 
  Building2, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  FileText,
  Search,
  Database
} from "lucide-react";
import { aiService } from "../../lib/ai";
import { dataService } from "../../lib/data";
import { authService } from "../../lib/auth";

export function CompanyAITools() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  
  const [selectedVendor, setSelectedVendor] = useState("");
  const [materialName, setMaterialName] = useState("");
  
  const vendors = dataService.getAllVendors();

  const handle43BH = async () => {
    if (!selectedVendor) return;
    setLoading("43bh");
    const vendor = vendors.find(v => v.id === selectedVendor);
    const result = await aiService.analyze43BH(selectedVendor, 250000, "2026-04-01");
    setResults({ ...results, "43bh": result.data });
    setLoading(null);
  };

  const handleSupplyChain = async () => {
    if (!materialName) return;
    setLoading("supply");
    const result = await aiService.analyzeSupplyChainRisk(materialName);
    setResults({ ...results, "supply": result.data });
    setLoading(null);
  };

  const handleESG = async () => {
    if (!selectedVendor) return;
    setLoading("esg");
    const result = await aiService.analyzeESG(selectedVendor);
    setResults({ ...results, "esg": result.data });
    setLoading(null);
  };

  const handleStartupVerify = async () => {
    if (!selectedVendor) return;
    const vendor = vendors.find(v => v.id === selectedVendor);
    if (!vendor) return;
    setLoading("startup");
    const result = await aiService.verifyStartupIndia(vendor.companyName);
    setResults({ ...results, "startup": result.data });
    setLoading(null);
  };

  return (
    <Layout type="company" title="AI Compliance Tools">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 43B(h) Profit Shield */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DCFCE7] rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div>
                  <CardTitle>43B(h) Profit-Shield</CardTitle>
                  <p className="text-xs text-secondary">MSME Tax Compliance</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-secondary">
                Legal Safety: If you pay an MSME late, you lose 30% tax deduction. This feature protects your bottom line.
              </p>
              <div className="space-y-2">
                <select 
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.companyName}</option>
                  ))}
                </select>
                <Button onClick={handle43BH} disabled={!selectedVendor || loading === "43bh"} className="w-full">
                  {loading === "43bh" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  Analyze Compliance
                </Button>
              </div>
              {results["43bh"] && (
                <div className="p-4 bg-[#DCFCE7] border border-[#86EFAC] rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                    <span className="text-sm font-medium text-[#16A34A]">{results["43bh"].compliance_status}</span>
                  </div>
                  <p className="text-sm"><strong>Deadline:</strong> {results["43bh"].deadline}</p>
                  <p className="text-sm"><strong>Tax at Risk:</strong> {results["43bh"].tax_at_risk}</p>
                  <p className="text-xs text-secondary">{results["43bh"].recommendation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Anticipatory Sourcing Agent */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#D97706]" />
                </div>
                <div>
                  <CardTitle>Anticipatory Sourcing</CardTitle>
                  <p className="text-xs text-secondary">Supply Chain Risk Prediction</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-secondary">
                Predicts price hikes or stock-outs before they happen so production doesn't stop.
              </p>
              <div className="space-y-2">
                <Input 
                  placeholder="Enter material name (e.g., Steel, Copper)" 
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                />
                <Button onClick={handleSupplyChain} disabled={!materialName || loading === "supply"} className="w-full">
                  {loading === "supply" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                  Analyze Risk
                </Button>
              </div>
              {results["supply"] && (
                <div className={`p-4 border rounded-lg ${results["supply"].risk_level === "High" ? "bg-red-50 border-red-200" : "bg-[#DCFCE7] border-[#86EFAC]"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className={`w-4 h-4 ${results["supply"].risk_level === "High" ? "text-red-500" : "text-[#16A34A]"}`} />
                    <span className="text-sm font-medium">{results["supply"].risk_level} Risk</span>
                  </div>
                  <p className="text-sm mb-2">{results["supply"].reason}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={results["supply"].suggested_action === "Buy Now" ? "danger" : "warning"}>
                      {results["supply"].suggested_action}
                    </Badge>
                    <Badge variant="secondary">Price: {results["supply"].price_trend}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* BRSR Green Auditor */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DCFCE7] rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div>
                  <CardTitle>BRSR Green Auditor</CardTitle>
                  <p className="text-xs text-secondary">ESG Compliance Reporting</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-secondary">
                SEBI mandates ESG reporting. Automate your BRSR compliance for the top 1000 firms.
              </p>
              <div className="space-y-2">
                <select 
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.companyName}</option>
                  ))}
                </select>
                <Button onClick={handleESG} disabled={!selectedVendor || loading === "esg"} className="w-full">
                  {loading === "esg" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Leaf className="w-4 h-4 mr-2" />}
                  Generate ESG Report
                </Button>
              </div>
              {results["esg"] && (
                <div className="p-4 bg-[#DCFCE7] border border-[#86EFAC] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">BRSR Score</span>
                    <Badge variant="success">{results["esg"].brsr_score}/100</Badge>
                  </div>
                  <p className="text-sm"><strong>Carbon Footprint:</strong> {results["esg"].esg_metrics.carbon_footprint.value} tonnes CO2/year</p>
                  <p className="text-sm"><strong>Energy Efficiency:</strong> {results["esg"].esg_metrics.energy_efficiency.value} kWh/unit</p>
                  <p className="text-xs text-secondary">{results["esg"].compliance_status}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DPI/Startup India Bridge */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>DPI/Startup India Bridge</CardTitle>
                  <p className="text-xs text-secondary">Startup Verification</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-secondary">
                Verify Govt-recognized startups to fulfill "Make in India" quotas.
              </p>
              <div className="space-y-2">
                <select 
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.companyName}</option>
                  ))}
                </select>
                <Button onClick={handleStartupVerify} disabled={!selectedVendor || loading === "startup"} className="w-full">
                  {loading === "startup" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Building2 className="w-4 h-4 mr-2" />}
                  Verify Startup Status
                </Button>
              </div>
              {results["startup"] && (
                <div className="p-4 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    {results["startup"].is_verified ? (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                    <span className="text-sm font-medium">
                      {results["startup"].is_verified ? "Verified Startup" : "Not Verified"}
                    </span>
                  </div>
                  {results["startup"].dpiit_no && (
                    <p className="text-sm"><strong>DPIIT No:</strong> {results["startup"].dpiit_no}</p>
                  )}
                  <p className="text-sm"><strong>Trust Score:</strong> {results["startup"].trust_score}/100</p>
                  {results["startup"].make_in_india_benefits?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Make in India Benefits:</p>
                      <ul className="text-xs text-secondary list-disc pl-4">
                        {results["startup"].make_in_india_benefits.map((b: string, i: number) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
