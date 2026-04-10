import { useState, useEffect } from "react";
import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Plus, Calendar, Users, Eye } from "lucide-react";
import { dataService, RFQ, RFQItem } from "../../lib/data";
import { authService } from "../../lib/auth";
import { toast } from "sonner";

export function RFQManagement() {
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newRFQ, setNewRFQ] = useState({
    title: "",
    description: "",
    deadline: "",
    items: [{ itemName: "", quantity: 1, unit: "kg", specifications: "" }],
  });

  useEffect(() => {
    loadRFQs();
  }, []);

  const loadRFQs = () => {
    const user = authService.getCurrentUser();
    if (user) {
      const userRFQs = dataService.getAllRFQs(user.id);
      setRFQs(userRFQs);
      setLoading(false);
    }
  };

  const filteredRFQs = rfqs.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRFQ = (e: React.FormEvent) => {
    e.preventDefault();
    const user = authService.getCurrentUser();
    if (!user) return;

    dataService.createRFQ({
      companyId: user.id,
      title: newRFQ.title,
      description: newRFQ.description,
      deadline: newRFQ.deadline,
      status: "open",
      items: newRFQ.items,
    });

    toast.success("RFQ created successfully");
    setShowCreateModal(false);
    setNewRFQ({
      title: "",
      description: "",
      deadline: "",
      items: [{ itemName: "", quantity: 1, unit: "kg", specifications: "" }],
    });
    window.location.reload();
  };

  const addItem = () => {
    setNewRFQ({
      ...newRFQ,
      items: [...newRFQ.items, { itemName: "", quantity: 1, unit: "kg", specifications: "" }],
    });
  };

  const updateItem = (index: number, field: keyof RFQItem, value: string | number) => {
    const updatedItems = [...newRFQ.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewRFQ({ ...newRFQ, items: updatedItems });
  };

  const removeItem = (index: number) => {
    if (newRFQ.items.length > 1) {
      setNewRFQ({
        ...newRFQ,
        items: newRFQ.items.filter((_, i) => i !== index),
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "open":
        return "success";
      case "quoted":
        return "warning";
      case "awarded":
        return "success";
      case "closed":
        return "secondary";
      case "draft":
        return "secondary";
      default:
        return "default";
    }
  };

  const getQuoteCount = (rfqId: string) => {
    return dataService.getQuotesForRFQ(rfqId).length;
  };

  if (loading) {
    return (
      <Layout type="company" title="RFQ Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const totalRFQs = rfqs.length;
  const activeRFQs = rfqs.filter(r => r.status === "open").length;
  const quotedRFQs = rfqs.filter(r => r.status === "quoted").length;
  const closedRFQs = rfqs.filter(r => r.status === "closed").length;

  return (
    <Layout type="company" title="RFQ Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Input 
              placeholder="Search RFQs..." 
              className="w-80" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Create RFQ
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Total RFQs</p>
              <h3 className="text-2xl font-semibold text-foreground">{totalRFQs}</h3>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Active</p>
              <h3 className="text-2xl font-semibold text-foreground">{activeRFQs}</h3>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Awaiting Quotes</p>
              <h3 className="text-2xl font-semibold text-foreground">{quotedRFQs}</h3>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Closed</p>
              <h3 className="text-2xl font-semibold text-foreground">{closedRFQs}</h3>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">RFQ ID</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Title</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Items</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Quotes</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Deadline</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRFQs.map((rfq) => (
                    <tr key={rfq.id} className="border-b border-border hover:bg-accent transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-primary">{rfq.id.toUpperCase().slice(-8)}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{rfq.title}</td>
                      <td className="py-3 px-4 text-sm text-secondary">{rfq.items?.length || 0} items</td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-foreground">{getQuoteCount(rfq.id)} quotes</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-secondary" />
                          <span className="text-sm text-secondary">{rfq.deadline}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusVariant(rfq.status)}>{rfq.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedRFQ(rfq)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create RFQ Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <Card className="w-full max-w-2xl bg-card max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Create New RFQ</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-secondary hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleCreateRFQ} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">RFQ Title *</label>
                <Input 
                  placeholder="e.g., Steel Rods (20mm)" 
                  value={newRFQ.title}
                  onChange={(e) => setNewRFQ({...newRFQ, title: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  placeholder="Describe your requirements..."
                  value={newRFQ.description}
                  onChange={(e) => setNewRFQ({...newRFQ, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Response Deadline *</label>
                <Input 
                  type="date" 
                  value={newRFQ.deadline}
                  onChange={(e) => setNewRFQ({...newRFQ, deadline: e.target.value})}
                  required
                />
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-foreground">Items</h3>
                  <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                    <Plus className="w-4 h-4" /> Add Item
                  </Button>
                </div>
                
                {newRFQ.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2 items-end">
                    <div>
                      <label className="block text-xs text-secondary mb-1">Item Name</label>
                      <Input 
                        placeholder="Item name" 
                        value={item.itemName}
                        onChange={(e) => updateItem(index, "itemName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Quantity</label>
                      <Input 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                        min={1}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Unit</label>
                      <Input 
                        placeholder="kg/pcs" 
                        value={item.unit}
                        onChange={(e) => updateItem(index, "unit", e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex gap-1">
                      <Input 
                        placeholder="Specs" 
                        value={item.specifications}
                        onChange={(e) => updateItem(index, "specifications", e.target.value)}
                      />
                      {newRFQ.items.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>✕</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">Create RFQ</Button>
                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* View RFQ Modal */}
      {selectedRFQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRFQ(null)}>
          <Card className="w-full max-w-2xl bg-card max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{selectedRFQ.title}</h2>
                <p className="text-sm text-secondary mt-1">RFQ: {selectedRFQ.id.toUpperCase().slice(-8)}</p>
              </div>
              <button onClick={() => setSelectedRFQ(null)} className="text-secondary hover:text-foreground">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-secondary mb-1">Status</p>
                  <Badge variant={getStatusVariant(selectedRFQ.status)}>{selectedRFQ.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Deadline</p>
                  <p className="text-sm text-foreground">{selectedRFQ.deadline}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-secondary mb-1">Description</p>
                <p className="text-sm text-foreground">{selectedRFQ.description || "No description provided"}</p>
              </div>

              <div>
                <p className="text-xs text-secondary mb-2">Items</p>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-accent">
                      <tr>
                        <th className="text-left py-2 px-3 text-xs font-medium">Item</th>
                        <th className="text-left py-2 px-3 text-xs font-medium">Qty</th>
                        <th className="text-left py-2 px-3 text-xs font-medium">Unit</th>
                        <th className="text-left py-2 px-3 text-xs font-medium">Specs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRFQ.items?.map((item, idx) => (
                        <tr key={idx} className="border-t border-border">
                          <td className="py-2 px-3">{item.itemName}</td>
                          <td className="py-2 px-3">{item.quantity}</td>
                          <td className="py-2 px-3">{item.unit}</td>
                          <td className="py-2 px-3 text-secondary">{item.specifications}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-xs text-secondary mb-2">Quotes Received ({getQuoteCount(selectedRFQ.id)})</p>
                <Button variant="secondary" className="w-full" onClick={() => {
                  setSelectedRFQ(null);
                  window.location.href = "/company/quotes";
                }}>
                  View Quotes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
