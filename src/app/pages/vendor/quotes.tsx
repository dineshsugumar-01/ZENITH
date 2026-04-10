import { Layout } from "../../components/layout";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useState } from "react";
import { dataService } from "../../lib/data";
import { authService } from "../../lib/auth";
import { Copy, FileText, CheckCircle, Clock, Search } from "lucide-react";

export function VendorQuotes() {
  const user = authService.getCurrentUser();
  const allData = dataService.getData();
  
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  
  // Real quotes for this vendor
  const myQuotes = allData.quotes.filter(q => q.vendorId === user?.id);
  
  const totalQuotes = myQuotes.length;
  const pendingQuotes = myQuotes.filter(q => q.status === "submitted" || q.status === "under_review").length;
  const acceptedQuotes = myQuotes.filter(q => q.status === "accepted").length;
  const winRate = totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(1) + "%" : "0%";

  // Helper to map UI row
  const tableRows = myQuotes.map(quote => {
    const rfq = allData.rfqs.find(r => r.id === quote.rfqId);
    const company = authService.getAllCompanies().find(c => c.id === rfq?.companyId) || allData.vendors.find(v => v.userId === rfq?.companyId);
    const relatedOrder = allData.orders.find(o => o.quoteId === quote.id);
    
    return {
      ...quote,
      rfqTitle: rfq ? rfq.title : quote.rfqId,
      companyName: company?.companyName || "Unknown Company",
      itemStr: rfq && rfq.items.length > 0 ? rfq.items[0].itemName + (rfq.items.length > 1 ? ` +${rfq.items.length - 1} more` : "") : "N/A",
      orderId: relatedOrder?.id
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Layout type="vendor" title="My Quotes">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Total Quotes</p>
              <h3 className="text-2xl font-semibold text-foreground">{totalQuotes}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Pending</p>
              <h3 className="text-2xl font-semibold text-foreground">{pendingQuotes}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Accepted</p>
              <h3 className="text-2xl font-semibold text-foreground">{acceptedQuotes}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Win Rate</p>
              <h3 className="text-2xl font-semibold text-foreground">{winRate}</h3>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Quote ID</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">RFQ</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Company</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Item</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Submitted</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Latest Update</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-secondary">
                        No quotes submitted yet. Start bidding on RFQs!
                      </td>
                    </tr>
                  )}
                  {tableRows.map((row) => (
                    <tr key={row.id} className="border-b border-border hover:bg-accent transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-[#059669]">{row.id}</td>
                      <td className="py-3 px-4 text-sm text-secondary">{row.rfqTitle}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{row.companyName}</td>
                      <td className="py-3 px-4 text-sm text-secondary">{row.itemStr}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">₹{row.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted">{row.deliveryDays} Days Delivery</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary">{new Date(row.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={row.status === "accepted" ? "success" : row.status === "rejected" ? "danger" : "warning"}
                        >
                          {row.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary">
                        {row.status === "accepted" && row.orderId ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">PO Issued: {row.orderId.slice(-8).toUpperCase()}</span>
                        ) : row.status === "under_review" ? (
                          <span className="text-amber-600 dark:text-amber-400">ZeroQ Agent Analyzing</span>
                        ) : (
                          "Awaiting Review"
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedQuote(row)}>View Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modern Overlay Modal for Quote Details */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-accent/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Quote Details</h2>
              </div>
              <button 
                onClick={() => setSelectedQuote(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-secondary mb-1">Quote Reference</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-foreground text-lg">{selectedQuote.id.slice(-8).toUpperCase()}</p>
                    <button className="text-muted hover:text-primary transition-colors" title="Copy ID">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-secondary mb-1">Amount</p>
                  <p className="text-xl font-bold text-[#059669]">₹{selectedQuote.amount.toLocaleString()}</p>
                </div>
              </div>

              {/* Company & RFQ */}
              <div className="grid grid-cols-2 gap-4 bg-accent/50 p-4 rounded-lg border border-border">
                <div>
                  <p className="text-xs text-secondary mb-1">BUYER COMPANY</p>
                  <p className="font-medium text-sm text-foreground">{selectedQuote.companyName}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">RFQ TITLE</p>
                  <p className="font-medium text-sm text-foreground">{selectedQuote.rfqTitle}</p>
                </div>
              </div>

              {/* Status & Negotiation Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">Status Timeline</h3>
                
                <div className="space-y-4 pl-2">
                  <div className="flex gap-3 relative">
                    <div className="w-px h-full bg-border absolute left-2 top-6"></div>
                    <div className="w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 z-10 mt-1 shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Quote Submitted</p>
                      <p className="text-xs text-secondary">{new Date(selectedQuote.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 relative">
                    <div className="w-px h-full bg-border absolute left-2 top-6"></div>
                    <div className={`w-4 h-4 rounded-full ring-4 z-10 mt-1 shrink-0 ${
                      selectedQuote.status === 'submitted' ? 'bg-slate-300 dark:bg-slate-600 ring-slate-500/20' : 'bg-primary ring-primary/20'
                    }`}></div>
                    <div>
                      <p className={`text-sm font-medium ${selectedQuote.status === 'submitted' ? 'text-secondary' : 'text-foreground'}`}>ZeroQ Agent Review</p>
                      <p className="text-xs text-secondary">
                        {selectedQuote.status === 'submitted' ? 'Awaiting AI analysis...' : 'Evaluated against competing vendors by ZeroQ Agent.'}
                      </p>
                    </div>
                  </div>

                  {selectedQuote.status === 'accepted' && (
                    <div className="flex gap-3 relative">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 z-10 mt-1 shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Quote Accepted — PO Generated</p>
                        <p className="text-xs text-secondary mt-1">
                          The buyer accepted this quote. Purchase Order <strong className="font-mono text-foreground">{selectedQuote.orderId?.slice(-8).toUpperCase() || "N/A"}</strong> was autonomously generated.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedQuote.status === 'rejected' && (
                    <div className="flex gap-3 relative">
                      <div className="w-4 h-4 rounded-full bg-red-500 ring-4 ring-red-500/20 z-10 mt-1 shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-red-600">Quote Rejected</p>
                        <p className="text-xs text-secondary mt-1">The buyer selected an alternative vendor.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-accent/30 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedQuote(null)}>Close Window</Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
