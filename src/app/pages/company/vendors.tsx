import { useState, useEffect } from "react";
import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Plus, Filter, MapPin, Phone, Mail, Check, X, AlertCircle, UserPlus, Clock, Users, Network } from "lucide-react";
import { dataService, Vendor, VendorConnection } from "../../lib/data";
import { authService } from "../../lib/auth";
import { toast } from "sonner";

const categories = [
  "Raw Materials", "Electronics", "Machinery", "Office Supplies",
  "Packaging", "Chemicals", "IT Services", "Logistics", "Other",
];

export function VendorDirectory() {
  const [companyId, setCompanyId] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [connections, setConnections] = useState<VendorConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"network" | "requests">("network");
  const [newVendor, setNewVendor] = useState({
    companyName: "", gstNumber: "", contactPerson: "",
    phone: "", email: "", category: "", address: "",
    bankAccountNumber: "", bankIfsc: "", bankName: "",
  });

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCompanyId(user.id);
      loadData(user.id);
    }
  }, []);

  const loadData = (cId: string) => {
    const approved = dataService.getApprovedVendorsForCompany(cId);
    setVendors(approved);
    const conns = dataService.getConnectionsForCompany(cId);
    setConnections(conns);
    setLoading(false);
  };

  const pendingRequests = connections.filter(c => c.status === "pending");

  const filteredVendors = vendors.filter(v =>
    (filterCategory === "All" || v.category === filterCategory) &&
    (v.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.address.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
    if (sortBy === "name_asc") return a.companyName.localeCompare(b.companyName);
    if (sortBy === "name_desc") return b.companyName.localeCompare(a.companyName);
    if (sortBy === "location") return a.address.localeCompare(b.address);
    if (sortBy === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.addVendor({
      ...newVendor,
      userId: `manual_${Date.now()}`,
      beneficiaryName: newVendor.companyName,
      isBankVerified: false,
      verificationStatus: "pending",
    });
    // Auto-approve connection for manually added vendors
    const v = dataService.getAllVendors().at(-1);
    if (v && companyId) {
      const conn = dataService.requestConnection(v.userId, companyId);
      if (conn) dataService.respondToConnection(conn.id, "approved");
    }
    toast.success("Vendor added and connected to your network!");
    setShowAddModal(false);
    setNewVendor({ companyName: "", gstNumber: "", contactPerson: "", phone: "", email: "", category: "", address: "", bankAccountNumber: "", bankIfsc: "", bankName: "" });
    loadData(companyId);
  };

  const handleApproveConnection = (connId: string, vendorUserId: string) => {
    dataService.respondToConnection(connId, "approved");
    toast.success("Vendor connection approved!");
    loadData(companyId);
  };

  const handleRejectConnection = (connId: string) => {
    dataService.respondToConnection(connId, "rejected");
    toast.info("Connection request rejected.");
    loadData(companyId);
  };

  const getVendorForConnection = (conn: VendorConnection): Vendor | undefined =>
    dataService.getAllVendors().find(v => v.userId === conn.vendorId);

  if (loading) {
    return (
      <Layout type="company" title="Vendor Directory">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout type="company" title="Vendor Directory">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search vendors..."
              className="w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:border-transparent h-[40px]"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:border-transparent h-[40px]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="location">Location (A-Z)</option>
            </select>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4" />
            Add Vendor Manually
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-secondary">Connected Vendors</p>
                <h3 className="text-2xl font-semibold">{vendors.length}</h3>
              </div>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-secondary">Pending Requests</p>
                <h3 className="text-2xl font-semibold text-warning">{pendingRequests.length}</h3>
              </div>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <Network className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-secondary">Total Connections</p>
                <h3 className="text-2xl font-semibold">{connections.length}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-accent rounded-lg p-1 w-fit">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "network" ? "bg-card shadow text-foreground" : "text-secondary hover:text-foreground"}`}
            onClick={() => setActiveTab("network")}
          >
            My Network ({vendors.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${activeTab === "requests" ? "bg-card shadow text-foreground" : "text-secondary hover:text-foreground"}`}
            onClick={() => setActiveTab("requests")}
          >
            Connection Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-destructive text-white text-xs rounded-full px-1.5 py-0.5">{pendingRequests.length}</span>
            )}
          </button>
        </div>

        {/* Network Tab */}
        {activeTab === "network" && (
          <Card>
            <CardContent className="p-6">
              {filteredVendors.length === 0 ? (
                <div className="text-center py-16">
                  <Network className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No vendors in your network yet</h3>
                  <p className="text-sm text-secondary mb-4">
                    Add vendors manually or wait for vendors to send connection requests.
                  </p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4" /> Add Your First Vendor
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase">Vendor</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase">Category</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase">Location</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase">Contact</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase">Status</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVendors.map((vendor) => (
                        <tr key={vendor.id} className="border-b border-border hover:bg-accent transition-colors">
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium text-foreground">{vendor.companyName}</p>
                            <p className="text-xs text-muted">{vendor.contactPerson}</p>
                          </td>
                          <td className="py-3 px-4"><Badge variant="secondary">{vendor.category}</Badge></td>
                          <td className="py-3 px-4 text-sm text-secondary">{vendor.address}</td>
                          <td className="py-3 px-4 text-sm text-secondary">{vendor.phone || vendor.email}</td>
                          <td className="py-3 px-4">
                            <Badge variant="success">Connected</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedVendor(vendor)}>View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-secondary">No pending connection requests.</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((conn) => {
                const v = getVendorForConnection(conn);
                return (
                  <Card key={conn.id} className="border-warning/30">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-primary">
                          {v?.companyName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{v?.companyName || "Unknown Vendor"}</p>
                          <p className="text-sm text-secondary">{v?.category} · {v?.address}</p>
                          <p className="text-xs text-muted mt-0.5">Requested {new Date(conn.requestedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveConnection(conn.id, conn.vendorId)}>
                          <Check className="w-4 h-4" /> Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleRejectConnection(conn.id)}>
                          <X className="w-4 h-4" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedVendor(null)}>
          <Card className="w-full max-w-2xl bg-card max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selectedVendor.companyName}</h2>
                <p className="text-sm text-secondary mt-1">{selectedVendor.category}</p>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="text-secondary hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                    <div>
                      <p className="text-xs text-secondary mb-1">Location</p>
                      <p className="text-sm text-foreground">{selectedVendor.address || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-secondary mt-0.5" />
                    <div>
                      <p className="text-xs text-secondary mb-1">Email</p>
                      <p className="text-sm text-foreground">{selectedVendor.email || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-secondary mt-0.5" />
                    <div>
                      <p className="text-xs text-secondary mb-1">Phone</p>
                      <p className="text-sm text-foreground">{selectedVendor.phone || "N/A"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-secondary mb-1">Contact Person</p>
                    <p className="text-sm font-medium">{selectedVendor.contactPerson || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary mb-1">GST Number</p>
                    <p className="text-sm font-mono">{selectedVendor.gstNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary mb-1">Bank</p>
                    <p className="text-sm">{selectedVendor.bankName || "Not provided"}</p>
                    {selectedVendor.bankAccountNumber && <p className="text-xs text-muted">A/C: ****{selectedVendor.bankAccountNumber.slice(-4)}</p>}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex-1" onClick={() => window.location.href = "/company/rfq"}>Create RFQ</Button>
                <Button variant="secondary" onClick={() => setSelectedVendor(null)}>Close</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <Card className="w-full max-w-2xl bg-card max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Add Vendor Manually</h2>
                <p className="text-sm text-secondary mt-1">This vendor will be directly added to your network.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-secondary hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleAddVendor} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Company Name *</label>
                  <Input placeholder="Enter vendor name" value={newVendor.companyName} onChange={(e) => setNewVendor({...newVendor, companyName: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">GST Number</label>
                  <Input placeholder="29ABCDE1234F1Z5" value={newVendor.gstNumber} onChange={(e) => setNewVendor({...newVendor, gstNumber: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Contact Person</label>
                  <Input placeholder="Contact name" value={newVendor.contactPerson} onChange={(e) => setNewVendor({...newVendor, contactPerson: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                  <Input placeholder="+91 98765 43210" value={newVendor.phone} onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <Input type="email" placeholder="vendor@company.com" value={newVendor.email} onChange={(e) => setNewVendor({...newVendor, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Category *</label>
                  <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newVendor.category} onChange={(e) => setNewVendor({...newVendor, category: e.target.value})} required>
                    <option value="">Select category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Address / Location *</label>
                <Input placeholder="City, State" value={newVendor.address} onChange={(e) => setNewVendor({...newVendor, address: e.target.value})} required />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">Add to Network</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Layout>
  );
}
