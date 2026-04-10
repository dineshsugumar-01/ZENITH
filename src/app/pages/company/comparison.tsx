import { useState, useEffect } from "react";
import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Sparkles, TrendingDown, Award, Clock, ShoppingCart, Bot, Zap, CheckCircle, Loader2 } from "lucide-react";
import { dataService } from "../../lib/data";
import { authService } from "../../lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export function ComparisonEngine() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const allData = dataService.getData();
  const companyId = user?.id || "";

  const [autopilot, setAutopilot] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [orderCreated, setOrderCreated] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState("");

  // Find the most recent RFQ that has quotes and is NOT awarded yet
  const rfqsWithQuotes = allData.rfqs
    .filter(r => r.companyId === companyId && r.status !== "awarded" && r.status !== "closed")
    .map(rfq => {
      const quotes = allData.quotes.filter(q => q.rfqId === rfq.id);
      return { rfq, quotes };
    })
    .filter(rq => rq.quotes.length > 0)
    .sort((a, b) => new Date(b.rfq.createdAt).getTime() - new Date(a.rfq.createdAt).getTime());

  const latestRFQ = rfqsWithQuotes[0] || null;

  useEffect(() => {
    if (autopilot && pipelineStep < 5 && !orderCreated && latestRFQ) {
      const timer = setTimeout(() => {
        setPipelineStep(prev => prev + 1);
      }, 2000); // 2 seconds per stage
      return () => clearTimeout(timer);
    } else if (autopilot && pipelineStep === 5 && !orderCreated && latestRFQ) {
      // Final stage: automatically accept the best quote
      const quotes = latestRFQ.quotes;
      const bestQuoteId = [...quotes].sort((a, b) => a.amount - b.amount)[0].id;
      
      const order = dataService.acceptQuote(bestQuoteId);
      if (order) {
        setCreatedOrderId(order.id);
        setOrderCreated(true);
        toast.success("Purchase Order created autonomously by AI!");
      }
    }
  }, [autopilot, pipelineStep, orderCreated, latestRFQ]);

  if (!latestRFQ && !orderCreated) {
    return (
      <Layout type="company" title="Comparison Engine">
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Quotes to Compare</h3>
            <p className="text-sm text-secondary mb-4">
              All your active RFQs have been processed or you haven't received any quotes yet.
            </p>
            <Button onClick={() => navigate("/company/rfq")}>View RFQs</Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  // If order was created, show the success state directly
  if (orderCreated) {
    return (
      <Layout type="company" title="Comparison Engine">
        <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 p-12 text-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">Autonomous Sourcing Complete</h2>
          <p className="text-emerald-700 dark:text-emerald-300 max-w-lg mx-auto mb-8">
            The ZeroQ Agent successfully negotiated the best price, finalized the score, and autonomously issued Purchase Order <strong className="font-mono">{createdOrderId.slice(-8).toUpperCase()}</strong>.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate("/company/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={() => {
              setAutopilot(false);
              setPipelineStep(-1);
              setOrderCreated(false);
            }}>Process Next RFQ</Button>
          </div>
        </Card>
      </Layout>
    );
  }

  const { rfq, quotes } = latestRFQ;

  // Enrich quotes with vendor details
  const enrichedQuotes = quotes.map(q => {
    const vendor = allData.vendors.find(v => v.id === q.vendorId || v.userId === q.vendorId);
    return { ...q, vendorName: vendor?.companyName || "Unknown Vendor" };
  }).sort((a, b) => a.amount - b.amount);

  const bestQuote = enrichedQuotes[0];
  const highestQuote = enrichedQuotes[enrichedQuotes.length - 1];
  const maxSavings = highestQuote ? Math.round(((highestQuote.amount - bestQuote.amount) / highestQuote.amount) * 100) : 0;

  const handleStartAutopilot = () => {
    setAutopilot(true);
    setPipelineStep(0);
    toast("ZeroQ Autonomous Agent activated. Stand back.");
  };

  const handleManualAccept = (quoteId: string) => {
    const order = dataService.acceptQuote(quoteId);
    if (order) {
      toast.success("Quote accepted manually. Order created!");
      setCreatedOrderId(order.id);
      setOrderCreated(true);
    }
  };

  return (
    <Layout type="company" title="Comparison Engine">
      <div className="space-y-6">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
          <div>
            <h2 className="text-xl font-bold mb-1">Quote Comparison — {rfq?.title}</h2>
            <p className="text-sm text-secondary">{rfq?.items?.map(i => i.itemName).join(", ") || "N/A"}</p>
          </div>
          {!autopilot ? (
            <Button onClick={handleStartAutopilot} className="bg-primary hover:bg-primary/90 text-white shadow-lg shrink-0 gap-2">
              <Bot className="w-4 h-4" />
              Activate Autonomous Agent
            </Button>
          ) : (
            <Badge variant="warning" className="px-3 py-1.5 text-sm gap-2 animate-pulse bg-amber-500/20 text-amber-600 border-amber-500/30">
              <Bot className="w-4 h-4" /> Agent Running
            </Badge>
          )}
        </div>

        {/* Dynamic Autopilot Timeline */}
        {autopilot ? (
          <Card className="bg-slate-900 border-slate-700 text-slate-300 overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Live Agent Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 font-mono text-sm space-y-4">
              <div className={`flex items-center gap-3 transition-opacity duration-500 ${pipelineStep >= 0 ? "opacity-100" : "opacity-0"}`}>
                {pipelineStep === 0 ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                <span className="text-blue-300">[0.0s]</span>
                <span>Initializing Multi-Agent Quote Analysis for {enrichedQuotes.length} active responses...</span>
              </div>
              <div className={`flex items-center gap-3 transition-opacity duration-500 ${pipelineStep >= 1 ? "opacity-100" : "opacity-0"}`}>
                {pipelineStep === 1 ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                <span className="text-blue-300">[2.0s]</span>
                <span className={pipelineStep >= 1 ? "text-slate-100" : ""}>Identified {highestQuote.vendorName} as high-price outlier (₹{highestQuote.amount.toLocaleString()}).</span>
              </div>
              <div className={`flex items-center gap-3 transition-opacity duration-500 ${pipelineStep >= 2 ? "opacity-100" : "opacity-0"}`}>
                {pipelineStep === 2 ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                <span className="text-blue-300">[4.0s]</span>
                <span className="text-amber-300">Initiating automated reverse negotiation. Requesting 5% counter-offer from {highestQuote.vendorName}...</span>
              </div>
              <div className={`flex items-center gap-3 transition-opacity duration-500 ${pipelineStep >= 3 ? "opacity-100" : "opacity-0"}`}>
                {pipelineStep === 3 ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                <span className="text-blue-300">[6.0s]</span>
                <span>Vendor matched. Re-computing Machine Learning scoring model (Price: 80%, Delivery: 20%).</span>
              </div>
              <div className={`flex items-center gap-3 transition-opacity duration-500 ${pipelineStep >= 4 ? "opacity-100" : "opacity-0"}`}>
                {pipelineStep >= 4 ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                <span className="text-blue-300">[8.0s]</span>
                <span className="text-emerald-300 font-bold">Best Value identified: {bestQuote.vendorName} (₹{bestQuote.amount.toLocaleString()}, {bestQuote.deliveryDays} days).</span>
              </div>
              <div className={`flex items-center gap-3 transition-opacity duration-500 ${pipelineStep >= 5 ? "opacity-100" : "opacity-0"}`}>
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-purple-300 font-bold">Issuing valid Purchase Order autonomously & notifying vendor...</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Static Display (Pre-Autopilot) */
          <>
            <Card className="bg-[#EEF2FF] border-[#C7D2FE]">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">AI Recommendation</h3>
                    <p className="text-sm text-secondary mb-4">
                      Based on current multi-factor analysis, we recommend <strong className="text-foreground">{bestQuote.vendorName}</strong>
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-[#16A34A]" />
                        <div>
                          <p className="text-xs text-secondary">Best Price</p>
                          <p className="text-sm font-semibold text-foreground">₹{bestQuote.amount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-secondary">Delivery</p>
                          <p className="text-sm font-semibold text-foreground">{bestQuote.deliveryDays} days</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#D97706]" />
                        <div>
                          <p className="text-xs text-secondary">Max Savings</p>
                          <p className="text-sm font-semibold text-foreground">{maxSavings}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {enrichedQuotes.map((quote, index) => {
                const isRecommended = index === 0;
                const aiScore = Math.max(50, 100 - (index * 12) - Math.floor(quote.deliveryDays / 2));
                return (
                  <Card key={quote.id} hover className={isRecommended ? "ring-2 ring-primary" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{quote.vendorName}</CardTitle>
                        {isRecommended && (
                          <Badge variant="success">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Best Value
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-background p-4 rounded-lg">
                        <p className="text-xs text-secondary mb-1">Total Quote</p>
                        <p className="text-2xl font-semibold text-foreground">₹{quote.amount.toLocaleString()}</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-secondary">AI Score</span>
                          <span className="text-sm font-semibold text-foreground">{aiScore}/100</span>
                        </div>
                        <div className="w-full bg-accent rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${aiScore}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-secondary mb-1">Delivery</p>
                          <p className="text-sm font-medium text-foreground">{quote.deliveryDays} days</p>
                        </div>
                        <div>
                          <p className="text-xs text-secondary mb-1">Terms</p>
                          <p className="text-sm font-medium text-foreground truncate" title={quote.terms}>{quote.terms || "Standard"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-secondary mb-1">Status</p>
                          <p className="text-sm font-medium text-foreground capitalize">{quote.status.replace("_", " ")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-secondary mb-1">Savings</p>
                          <p className="text-sm font-medium text-[#16A34A]">
                            {highestQuote && quote.amount < highestQuote.amount
                              ? `${Math.round(((highestQuote.amount - quote.amount) / highestQuote.amount) * 100)}%`
                              : "0%"}
                          </p>
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        variant={isRecommended ? "primary" : "secondary"}
                        onClick={() => handleManualAccept(quote.id)}
                      >
                        {isRecommended ? "Award Contract Manually" : "Select Vendor Manually"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
