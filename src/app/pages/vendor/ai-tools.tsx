import { useState } from "react";
import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { 
  Wallet, 
  Link, 
  Loader2, 
  CheckCircle,
  MessageSquare,
  ArrowRight,
  Bot
} from "lucide-react";
import { aiService } from "../../lib/ai";

const ZEROQ_SYSTEM_PROMPT = `You are ZeroQ — an intelligent procurement decision agent.

Your role is to help companies identify the best vendors based on:
* Location proximity
* Stock availability
* Pricing
* Delivery performance
* Reliability metrics

━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━
You operate inside an AI-powered Procurement ERP system.
Entities:
* Company (buyer)
* Vendors (suppliers)
* RFQs (requests)
* Quotes (responses)
* Inventory (stock data)

You have access to:
* Vendor database
* Company location
* Vendor locations (lat, lng)
* Inventory data (availableQty, lastUpdated)
* Vendor performance metrics (rating, onTimeRate, complianceRate)

━━━━━━━━━━━━━━━━━━━━━━━
OBJECTIVE
━━━━━━━━━━━━━━━━━━━━━━━
Given a company request, you must:
1. Identify relevant vendors
2. Filter vendors based on:
   * Distance from company
   * Stock availability
3. Rank vendors using:
   * Price competitiveness
   * Delivery speed
   * Reliability
4. Return a clear recommendation

━━━━━━━━━━━━━━━━━━━━━━━
LOGIC RULES
━━━━━━━━━━━━━━━━━━━━━━━
1. DISTANCE CALCULATION
* Use vendor and company lat/lng
* Prefer vendors within 50 km
* Penalize vendors beyond 100 km

2. STOCK VALIDATION
* Only prioritize vendors with sufficient stock
* If stock is unknown:
  * Estimate using past supply capacity
  * Mark as "Uncertain Availability"

3. SCORING PRIORITY
* Price (40%)
* Delivery Time (25%)
* Reliability (20%)
* Distance (15%)

4. RISK DETECTION
   Flag vendor if:
* Price is abnormally low/high
* Low compliance rate (<70%)
* Poor delivery performance (<60%)

━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━
Always respond in structured format:
1. BEST VENDOR:
* Name:
* Distance:
* Price:
* Delivery:
* Stock Status:
* Score:

2. TOP 3 VENDORS (ranked)

3. AI INSIGHT:
   Explain WHY the best vendor was selected

4. WARNINGS (if any):
* Risk flags
* Stock issues

━━━━━━━━━━━━━━━━━━━━━━━
TONE
━━━━━━━━━━━━━━━━━━━━━━━
* Clear
* Professional
* Decision-focused
* No unnecessary explanation

━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE QUERY
━━━━━━━━━━━━━━━━━━━━━━━
User: "Find vendors for 500 units of Steel Rods near Chennai"
Expected behavior:
* Filter vendors by category
* Calculate distance
* Check stock
* Rank vendors
* Return best option with reasoning

━━━━━━━━━━━━━━━━━━━━━━━
Your goal is NOT to list vendors.
Your goal is to make a procurement decision.
---
if any thing not clear just say you don't know`;

export function VendorAITools() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-");
  const [geminiQuery, setGeminiQuery] = useState("");

  const handleGeminiSolve = async () => {
    if (!geminiQuery) return;
    setLoading("gemini");
    const result = await aiService.solveQuery(geminiQuery, ZEROQ_SYSTEM_PROMPT);
    setResults({ ...results, "gemini": result.data?.response });
    setLoading(null);
  };

  const handleTReDS = async () => {
    if (!invoiceAmount) return;
    setLoading("treds");
    const result = await aiService.generateTReDSMessage(
      parseInt(invoiceAmount), 
      invoiceNumber, 
      "AlloyIndia Pvt Ltd"
    );
    setResults({ ...results, "treds": result.data });
    setLoading(null);
  };

  const handleSmartContract = async () => {
    setLoading("smart");
    const result = await aiService.generateSmartContract(
      "PO-2026-001", 
      parseInt(invoiceAmount) || 250000, 
      "0x1234...abcd"
    );
    setResults({ ...results, "smart": result.data });
    setLoading(null);
  };

  return (
    <Layout type="vendor" title="AI Business Tools">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Custom ZeroQ Query Solver */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>AI Query Solver</CardTitle>
                  <p className="text-xs text-secondary">Fine-tuned ZeroQ responses</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-secondary">
                Submit complex procurement scenarios to evaluate ZeroQ's advanced decision-ranking logic.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-secondary mb-1 block">Your Procurement Query</label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={geminiQuery}
                    onChange={(e) => setGeminiQuery(e.target.value)}
                    placeholder="E.g., Find vendors for 500 units of Steel Rods near Chennai"
                  />
                </div>
                <Button onClick={handleGeminiSolve} disabled={!geminiQuery || loading === "gemini"} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  {loading === "gemini" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
                  Solve with ZeroQ
                </Button>
              </div>
              {results["gemini"] && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Agent Response Complete</span>
                  </div>
                  <div className="text-sm text-foreground bg-white dark:bg-card p-3 rounded border border-border">
                    <p className="whitespace-pre-wrap">{results["gemini"]}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* TReDS-Linked Cash */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#D97706]" />
                </div>
                <div>
                  <CardTitle>TReDS-Linked Cash</CardTitle>
                  <p className="text-xs text-secondary">Instant Liquidity</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-secondary">
                Get 98% of your invoice cash within 24 hours via invoice discounting.
              </p>
              <div className="space-y-2">
                <Input 
                  placeholder="Invoice Amount (₹)" 
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                />
                <Input 
                  placeholder="Invoice Number" 
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
                <Button onClick={handleTReDS} disabled={!invoiceAmount || loading === "treds"} className="w-full">
                  {loading === "treds" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
                  Get Instant Cash Offer
                </Button>
              </div>
              {results["treds"] && (
                <div className="p-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#D97706]" />
                    <span className="text-sm font-medium text-[#D97706]">Cash Offer Available!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-secondary">Original Amount</p>
                      <p className="font-medium">₹{results["treds"].original_invoice?.amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Discount</p>
                      <p className="font-medium text-red-600">-₹{results["treds"].treds_offer?.discount_amount?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <p className="text-xs text-secondary">You Receive (24 hrs)</p>
                    <p className="text-lg font-bold text-[#059669]">₹{results["treds"].treds_offer?.net_payable?.toLocaleString()}</p>
                  </div>
                  <Button size="sm" className="w-full" variant="secondary">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send WhatsApp Message
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ONDC & e-Rupee Mesh */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                  <Link className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>ONDC & e-Rupee Mesh</CardTitle>
                  <p className="text-xs text-secondary">Programmable Payment Automation</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-secondary">
                Get paid the second you deliver using programmable digital money (e-Rupee).
              </p>
              <div className="flex gap-2">
                <Button onClick={handleSmartContract} disabled={loading === "smart"} className="flex-1">
                  {loading === "smart" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link className="w-4 h-4 mr-2" />}
                  Generate Smart Contract
                </Button>
              </div>
              {results["smart"] && (
                <div className="p-4 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Smart Contract Deployed</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-secondary">Contract ID</p>
                      <p className="font-mono text-xs">{results["smart"].contract_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Amount Locked</p>
                      <p className="font-medium">₹{results["smart"].amount_locked?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium mb-2">Trigger Logic:</p>
                    <div className="bg-white rounded p-3 font-mono text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{results["smart"].pseudocode}</pre>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {results["smart"].benefits?.map((benefit: string, i: number) => (
                      <Badge key={i} variant="success" className="text-xs">
                        ✓ {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
}
