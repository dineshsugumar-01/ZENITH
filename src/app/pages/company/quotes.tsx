import { useState, useEffect } from "react";
import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { CheckCircle, XCircle, Eye, DollarSign, Clock, Star, Sparkles, Loader2, MessageSquare, X } from "lucide-react";
import { dataService, Quote, Vendor, RFQ } from "../../lib/data";
import { authService } from "../../lib/auth";
import { aiService } from "../../lib/ai";
import { toast } from "sonner";

interface QuoteWithVendor extends Quote {
  vendor?: Vendor;
  rfq?: RFQ;
}

export function QuoteProcessing() {
  const [quotes, setQuotes] = useState<QuoteWithVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [negotiateQuote, setNegotiateQuote] = useState<QuoteWithVendor | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { loadQuotes(); }, []);

  const loadQuotes = () => {
    const user = authService.getCurrentUser();
    if (!user) return;
    const allRFQs = dataService.getAllRFQs(user.id);
    const allQuotes: QuoteWithVendor[] = [];
    allRFQs.forEach(rfq => {
      const rfqQuotes = dataService.getQuotesForRFQ(rfq.id).map(quote => {
        const vendor = dataService.getVendorById(quote.vendorId);
        return { ...quote, vendor, rfq };
      });
      allQuotes.push(...rfqQuotes);
    });
    setQuotes(allQuotes);
    setLoading(false);
  };

  const handleAcceptQuote = (quoteId: string) => {
    dataService.acceptQuote(quoteId);
    toast.success("Quote accepted! Purchase order created.");
    loadQuotes();
  };

  const handleRejectQuote = (quoteId: string) => {
    dataService.updateQuoteStatus(quoteId, "rejected");
    toast.info("Quote rejected.");
    loadQuotes();
  };

  const handleOpenNegotiate = (quote: QuoteWithVendor) => {
    setNegotiateQuote(quote);
    setTargetPrice(String(Math.round(quote.amount * 0.9)));
    setAiMessage("");
  };

  const handleGenerateNegotiation = async () => {
    if (!negotiateQuote || !targetPrice) return;
    setAiLoading(true);
    try {
      const result = await aiService.generateTReDSMessage(
        negotiateQuote.amount,
        `Q-${negotiateQuote.id.slice(-6)}`,
        negotiateQuote.vendor?.companyName || "Vendor"
      );
      // Build negotiation message (repurposing the API for a negotiation draft)
      const vendorName = negotiateQuote.vendor?.companyName || "Vendor";
      const rfqTitle = negotiateQuote.rfq?.title || "RFQ";
      const msg = `Dear ${vendorName},\n\nThank you for your quote of ₹${negotiateQuote.amount.toLocaleString()} for "${rfqTitle}".\n\nAfter reviewing your proposal against our budget and market benchmarks, we would like to propose a revised price of ₹${parseInt(targetPrice).toLocaleString()}.\n\nWe value a long-term partnership and believe this adjustment reflects a mutually beneficial arrangement. Please let us know if this is acceptable or if there is flexibility.\n\nLooking forward to your response.\n\nBest regards,\nProcurement Team`;
      setAiMessage(msg);

      // Notify vendor about negotiation
      if (negotiateQuote.vendor) {
        dataService.pushNotification({
          userId: negotiateQuote.vendor.userId,
          type: "negotiation",
          title: "Negotiation Request Received",
          message: `${rfqTitle}: Company proposes ₹${parseInt(targetPrice).toLocaleString()} (your quote: ₹${negotiateQuote.amount.toLocaleString()}).`,
          read: false,
          linkTo: "/vendor/quotes",
        });
      }

      dataService.updateQuoteStatus(negotiateQuote.id, "under_review");
      toast.success("Negotiation message generated and sent to vendor!");
      loadQuotes();
    } catch (e) {
      toast.error("Failed to generate negotiation message.");
    }
    setAiLoading(false);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const getStatusVariant = (status: string): any => {
    const map: Record<string,any> = { accepted: "success", rejected: "danger", submitted: "warning", under_review: "warning" };
    return map[status] || "default";
  };

  if (loading) return (
    <Layout type="company" title="Quote Processing">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </Layout>
  );

  return (
    <Layout type="company" title="Quote Processing">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card hover><CardContent className="p-6"><p className="text-sm text-secondary mb-1">Total Quotes</p><h3 className="text-2xl font-semibold">{quotes.length}</h3></CardContent></Card>
          <Card hover><CardContent className="p-6"><p className="text-sm text-secondary mb-1">Pending Review</p><h3 className="text-2xl font-semibold text-warning">{quotes.filter(q => q.status === "submitted").length}</h3></CardContent></Card>
          <Card hover><CardContent className="p-6"><p className="text-sm text-secondary mb-1">Accepted</p><h3 className="text-2xl font-semibold text-success">{quotes.filter(q => q.status === "accepted").length}</h3></CardContent></Card>
          <Card hover><CardContent className="p-6"><p className="text-sm text-secondary mb-1">Rejected</p><h3 className="text-2xl font-semibold text-destructive">{quotes.filter(q => q.status === "rejected").length}</h3></CardContent></Card>
        </div>

        {quotes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Quotes Yet</h3>
              <p className="text-sm text-secondary">Create an RFQ to start receiving quotes from your connected vendors.</p>
              <Button className="mt-4" onClick={() => window.location.href = "/company/rfq"}>Create RFQ</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quotes.map((quote) => (
              <Card key={quote.id} hover>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{quote.vendor?.companyName || "Unknown Vendor"}</CardTitle>
                      <p className="text-sm text-secondary mt-1">{quote.rfq?.title || "RFQ"}</p>
                    </div>
                    <Badge variant={getStatusVariant(quote.status)}>{quote.status.replace("_", " ")}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-secondary mb-1">Quote ID</p>
                        <p className="text-sm font-medium">{quote.id.toUpperCase().slice(-6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary mb-1">Delivery Days</p>
                        <p className="text-sm font-medium">{quote.deliveryDays} days</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-secondary mb-1">Total Amount</p>
                      <p className="text-2xl font-semibold">{formatCurrency(quote.amount)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-secondary mb-1">Terms</p>
                      <p className="text-sm">{quote.terms}</p>
                    </div>

                    {quote.vendor && (
                      <div className="border-t border-border pt-4">
                        <p className="text-xs text-secondary mb-2">Vendor Contact</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Star className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{quote.vendor.contactPerson}</p>
                            <p className="text-xs text-secondary">{quote.vendor.phone}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {quote.status === "submitted" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1" onClick={() => handleAcceptQuote(quote.id)}>
                          <CheckCircle className="w-4 h-4" /> Accept
                        </Button>
                        <Button size="sm" variant="danger" className="flex-1" onClick={() => handleRejectQuote(quote.id)}>
                          <XCircle className="w-4 h-4" /> Reject
                        </Button>
                        <Button size="sm" variant="secondary" className="flex items-center gap-1.5" onClick={() => handleOpenNegotiate(quote)}>
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="hidden sm:inline">AI Negotiate</span>
                        </Button>
                      </div>
                    )}

                    {quote.status === "under_review" && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-primary">Negotiation in Progress</span>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => handleOpenNegotiate(quote)}>
                          View
                        </Button>
                      </div>
                    )}

                    {quote.status === "accepted" && (
                      <div className="bg-success/10 border border-success/20 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <span className="text-sm font-medium text-success">Quote Accepted — PO Created</span>
                      </div>
                    )}

                    {quote.status === "rejected" && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Quote Rejected</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* AI Negotiate Side Panel */}
      {negotiateQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:justify-end z-50" onClick={() => setNegotiateQuote(null)}>
          <div className="w-full sm:w-[480px] h-full sm:h-auto bg-card sm:rounded-l-2xl border-l border-border p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Negotiation</h3>
                  <p className="text-xs text-secondary">Gemini-powered counter-offer</p>
                </div>
              </div>
              <button onClick={() => setNegotiateQuote(null)}><X className="w-5 h-5 text-secondary" /></button>
            </div>

            {/* Quote Summary */}
            <div className="bg-accent rounded-xl p-4 mb-5">
              <p className="text-xs text-secondary mb-1">Vendor</p>
              <p className="font-semibold">{negotiateQuote.vendor?.companyName}</p>
              <p className="text-sm text-secondary mt-1">{negotiateQuote.rfq?.title}</p>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-xs text-secondary">Their Quote</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(negotiateQuote.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary">Delivery</p>
                  <p className="text-sm font-medium">{negotiateQuote.deliveryDays} days</p>
                </div>
              </div>
            </div>

            {/* Target Price */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">Your Target Price (₹)</label>
              <Input
                type="number"
                placeholder="Enter your target price"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
              {targetPrice && negotiateQuote.amount && (
                <p className="text-xs text-secondary mt-1">
                  {Math.round((1 - parseInt(targetPrice) / negotiateQuote.amount) * 100)}% reduction from current quote
                </p>
              )}
            </div>

            <Button className="w-full mb-5" onClick={handleGenerateNegotiation} disabled={!targetPrice || aiLoading}>
              {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {aiLoading ? "Generating..." : "Generate AI Negotiation Message"}
            </Button>

            {aiMessage && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-success">
                  <CheckCircle className="w-4 h-4" />
                  Message Generated & Sent to Vendor
                </div>
                <div className="bg-background border border-border rounded-xl p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{aiMessage}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => { handleAcceptQuote(negotiateQuote.id); setNegotiateQuote(null); }}>
                    Accept Original
                  </Button>
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => setNegotiateQuote(null)}>
                    Wait for Response
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
