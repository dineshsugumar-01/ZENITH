import { useState, useEffect } from "react";
import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Calendar, Building2, Send, Search, Network, CheckCircle, Clock } from "lucide-react";
import { dataService, RFQ, VendorConnection, Quote } from "../../lib/data";
import { authService, User } from "../../lib/auth";
import { toast } from "sonner";

export function VendorRFQs() {
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myConnections, setMyConnections] = useState<VendorConnection[]>([]);
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"rfqs" | "discover">("rfqs");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [vendorQuotes, setVendorQuotes] = useState<Quote[]>([]);
  const [quoteForm, setQuoteForm] = useState({ amount: 0, deliveryDays: 7, terms: "30 days net", conditions: "" });

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const openRFQs = dataService.getVendorRFQs(user.id);
      setRFQs(openRFQs);
      const conns = dataService.getConnectionsForVendor(user.id);
      setMyConnections(conns);
      const companies = authService.getAllCompanies();
      setAllVendors(companies);
      
      const vendor = dataService.getVendorByUserId(user.id);
      if (vendor) {
        setVendorQuotes(dataService.getQuotesForVendor(vendor.id));
      }
    }
    setLoading(false);
  }, []);


  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedRFQ) return;
    const vendor = dataService.getVendorByUserId(currentUser.id);
    if (!vendor) {
      toast.error("Vendor profile not found. Please complete registration.");
      return;
    }
    dataService.submitQuote({
      rfqId: selectedRFQ.id,
      vendorId: vendor.id,
      amount: quoteForm.amount,
      terms: quoteForm.terms + (quoteForm.conditions ? ` | ${quoteForm.conditions}` : ""),
      deliveryDays: quoteForm.deliveryDays,
      status: "submitted",
    });
    toast.success("Quote submitted successfully!");
    setShowQuoteModal(false);
    setQuoteForm({ amount: 0, deliveryDays: 7, terms: "30 days net", conditions: "" });
    if (currentUser) {
      const openRFQs = dataService.getVendorRFQs(currentUser.id);
      setRFQs(openRFQs);
      if (vendor) {
        setVendorQuotes(dataService.getQuotesForVendor(vendor.id));
      }
    }
  };

  const handleRequestConnection = (companyId: string) => {
    if (!currentUser) return;
    const result = dataService.requestConnection(currentUser.id, companyId);
    if (result) {
      toast.success("Connection request sent! Waiting for company approval.");
      const conns = dataService.getConnectionsForVendor(currentUser.id);
      setMyConnections(conns);
    } else {
      toast.info("You already have a pending request with this company.");
    }
  };

  const getConnectionStatus = (companyId: string) =>
    myConnections.find(c => c.companyId === companyId)?.status;

  const filteredRFQs = rfqs.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.items && r.items.some(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase())))
  ).sort((a, b) => {
    if (sortBy === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    if (sortBy === "deadline") return new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime();
    if (sortBy === "items") return (b.items?.length || 0) - (a.items?.length || 0);
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const myQuotesCount = vendorQuotes.length;

  if (loading) {
    return (
      <Layout type="vendor" title="RFQs">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout type="vendor" title="RFQs">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Available RFQs</p>
              <h3 className="text-2xl font-semibold">{rfqs.length}</h3>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">My Quotes</p>
              <h3 className="text-2xl font-semibold">{myQuotesCount}</h3>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Connected Companies</p>
              <h3 className="text-2xl font-semibold">{myConnections.filter(c => c.status === "approved").length}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Search & Actions Header */}
        <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm mb-4">
          <div className="relative w-80 shrink-0">
            <Search className="w-4 h-4 text-secondary absolute left-3 top-3" />
            <Input 
              placeholder="Search RFQs by item, title..." 
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <select
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:border-transparent h-[40px] ml-4"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest RFQs</option>
            <option value="oldest">Oldest RFQs</option>
            <option value="deadline">Deadline (Soonest first)</option>
            <option value="items">Items (Most to Least)</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-accent rounded-lg p-1 w-fit">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "rfqs" ? "bg-card shadow text-foreground" : "text-secondary hover:text-foreground"}`}
            onClick={() => setActiveTab("rfqs")}
          >
            Available RFQs ({filteredRFQs.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "discover" ? "bg-card shadow text-foreground" : "text-secondary hover:text-foreground"}`}
            onClick={() => setActiveTab("discover")}
          >
            Discover Companies
          </button>
        </div>

        {/* RFQs Tab */}
        {activeTab === "rfqs" && (
          <>
            {filteredRFQs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
                  <h3 className="text-lg font-medium mb-2">No RFQs found</h3>
                  <p className="text-sm text-secondary mb-4">
                    Connect with more companies or try adjusting your search to view active opportunities.
                  </p>
                  <Button variant="secondary" onClick={() => setActiveTab("discover")}>
                    <Network className="w-4 h-4" /> Discover Companies
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredRFQs.map((rfq) => (
                  <Card key={rfq.id} hover>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">{rfq.title}</h3>
                            <Badge variant="warning">Open</Badge>
                          </div>
                          <p className="text-sm text-secondary">{rfq.description}</p>
                        </div>
                        {vendorQuotes.find(q => q.rfqId === rfq.id) ? (
                          <Button disabled variant="secondary">
                            <CheckCircle className="w-4 h-4" /> Quote Submitted
                          </Button>
                        ) : (
                          <Button onClick={() => { setSelectedRFQ(rfq); setShowQuoteModal(true); }}>
                            <Send className="w-4 h-4" /> Submit Quote
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 p-4 bg-background rounded-lg border border-border mb-4">
                        <div>
                          <p className="text-xs text-secondary mb-1">RFQ ID</p>
                          <p className="text-sm font-mono font-medium">{rfq.id.slice(-8).toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-secondary mb-1">Response Deadline</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-secondary" />
                            <p className="text-sm font-medium">{rfq.deadline}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-secondary mb-1">Items</p>
                          <p className="text-sm font-medium">{rfq.items?.length || 0} items</p>
                        </div>
                      </div>

                      {rfq.items && rfq.items.length > 0 && (
                        <div className="border border-border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-accent">
                              <tr>
                                <th className="text-left py-2 px-3 text-xs font-medium">Item</th>
                                <th className="text-left py-2 px-3 text-xs font-medium">Quantity</th>
                                <th className="text-left py-2 px-3 text-xs font-medium">Unit</th>
                                <th className="text-left py-2 px-3 text-xs font-medium">Specifications</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rfq.items.map((item, idx) => (
                                <tr key={idx} className="border-t border-border">
                                  <td className="py-2 px-3 font-medium">{item.itemName}</td>
                                  <td className="py-2 px-3">{item.quantity}</td>
                                  <td className="py-2 px-3">{item.unit}</td>
                                  <td className="py-2 px-3 text-secondary">{item.specifications || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Discover Tab */}
        {activeTab === "discover" && (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-secondary">
              <strong className="text-foreground">How it works:</strong> Send a connection request to a company. Once approved, you'll see all their open RFQs and receive real-time notifications when they post new demands.
            </div>

            {allVendors.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-secondary">No registered companies found yet.</p>
                </CardContent>
              </Card>
            ) : (
              allVendors.map((company: any) => {
                const status = getConnectionStatus(company.id);
                return (
                  <Card key={company.id} hover>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-lg">
                          {company.companyName?.charAt(0) || company.email?.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="font-semibold">{company.companyName || company.email}</p>
                          <p className="text-sm text-secondary">{company.city || "India"}</p>
                        </div>
                      </div>
                      <div>
                        {status === "approved" ? (
                          <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>
                        ) : status === "pending" ? (
                          <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
                        ) : (
                          <Button size="sm" onClick={() => handleRequestConnection(company.id)}>
                            <Network className="w-4 h-4" /> Request Connection
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Quote Modal */}
      {showQuoteModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQuoteModal(false)}>
          <Card className="w-full max-w-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Submit Quote</h2>
                <p className="text-sm text-secondary mt-1">{selectedRFQ.title}</p>
              </div>
              <button onClick={() => setShowQuoteModal(false)} className="text-secondary hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSubmitQuote} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Total Amount (₹) *</label>
                <Input type="number" placeholder="Enter total amount" value={quoteForm.amount || ""} onChange={(e) => setQuoteForm({...quoteForm, amount: parseInt(e.target.value) || 0})} required min="1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Delivery Days *</label>
                  <Input type="number" placeholder="7" value={quoteForm.deliveryDays} onChange={(e) => setQuoteForm({...quoteForm, deliveryDays: parseInt(e.target.value)})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Payment Terms</label>
                  <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={quoteForm.terms} onChange={(e) => setQuoteForm({...quoteForm, terms: e.target.value})}>
                    <option>30 days net</option>
                    <option>15 days net</option>
                    <option>Advance payment</option>
                    <option>Upon delivery</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Terms & Conditions</label>
                <textarea className="flex min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Warranties, certifications, special conditions..." value={quoteForm.conditions} onChange={(e) => setQuoteForm({...quoteForm, conditions: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-[#10B981] hover:bg-[#059669]">Submit Quote</Button>
                <Button type="button" variant="secondary" onClick={() => setShowQuoteModal(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Layout>
  );
}
