import { useState, useEffect } from "react";
import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Download, QrCode, Package, Truck, CheckCircle, Clock } from "lucide-react";
import { dataService, PurchaseOrder, RFQ, Vendor } from "../../lib/data";
import { authService } from "../../lib/auth";

interface OrderWithDetails extends PurchaseOrder {
  rfq?: RFQ;
  vendor?: Vendor;
}

export function PurchaseOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    const user = authService.getCurrentUser();
    if (!user) return;

    const allOrders = dataService.getOrdersForCompany(user.id).map(order => {
      const rfq = dataService.getRFQById(order.rfqId);
      const vendor = dataService.getVendorById(order.vendorId);
      return { ...order, rfq, vendor };
    });

    setOrders(allOrders);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "delivered":
        return "success";
      case "shipped":
        return "warning";
      case "confirmed":
        return "warning";
      case "created":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "delivered":
        return <Truck className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "confirmed":
        return <Clock className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    dataService.updateOrderStatus(orderId, newStatus as PurchaseOrder["status"]);
    window.location.reload();
  };

  if (loading) {
    return (
      <Layout type="company" title="Purchase Orders">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const totalOrders = orders.length;
  const inTransit = orders.filter(o => o.status === "shipped").length;
  const delivered = orders.filter(o => o.status === "delivered" || o.status === "completed").length;
  const totalValue = orders.reduce((sum, o) => sum + o.amount, 0);

  return (
    <Layout type="company" title="Purchase Orders">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Total POs</p>
              <h3 className="text-2xl font-semibold text-foreground">{totalOrders}</h3>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">In Transit</p>
              <h3 className="text-2xl font-semibold text-foreground">{inTransit}</h3>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Delivered</p>
              <h3 className="text-2xl font-semibold text-foreground">{delivered}</h3>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Total Value</p>
              <h3 className="text-2xl font-semibold text-foreground">{formatCurrency(totalValue)}</h3>
            </CardContent>
          </Card>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Purchase Orders</h3>
              <p className="text-sm text-secondary">Accept a quote to create a purchase order</p>
              <Button className="mt-4" onClick={() => window.location.href = "/company/quotes"}>
                View Quotes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">PO Number</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Vendor</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">RFQ</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Order Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-border hover:bg-accent transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-primary">{order.id.toUpperCase().slice(-6)}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{order.vendor?.companyName || "N/A"}</td>
                        <td className="py-3 px-4 text-sm text-secondary">{order.rfq?.title || "N/A"}</td>
                        <td className="py-3 px-4 text-sm text-secondary">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground">{formatCurrency(order.amount)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* PO Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <Card className="w-full max-w-3xl bg-card max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 space-y-6">
              <div className="flex items-start justify-between border-b border-border pb-6">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground mb-1">Purchase Order</h1>
                  <p className="text-sm text-secondary">{selectedOrder.id.toUpperCase().slice(-6)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary"><Download className="w-4 h-4" /> PDF</Button>
                  <button onClick={() => setSelectedOrder(null)} className="text-secondary hover:text-foreground">✕</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Buyer</h3>
                  <p className="text-sm font-medium text-foreground">Acme Manufacturing Ltd</p>
                  <p className="text-xs text-secondary mt-1">Plot 123, Industrial Area<br />Mumbai, Maharashtra 400001</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Vendor</h3>
                  <p className="text-sm font-medium text-foreground">{selectedOrder.vendor?.companyName || "N/A"}</p>
                  <p className="text-xs text-secondary mt-1">{selectedOrder.vendor?.address || ""}</p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-xs font-semibold text-secondary uppercase">Item</th>
                      <th className="text-center py-2 text-xs font-semibold text-secondary uppercase">Qty</th>
                      <th className="text-right py-2 text-xs font-semibold text-secondary uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3 text-sm text-foreground">{selectedOrder.rfq?.title || "N/A"}</td>
                      <td className="py-3 text-sm text-center text-foreground">1</td>
                      <td className="py-3 text-sm text-right font-medium text-foreground">{formatCurrency(selectedOrder.amount)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t border-border">
                    <tr>
                      <td colSpan={2} className="py-3 text-sm font-medium text-right text-foreground">Total Amount:</td>
                      <td className="py-3 text-lg font-semibold text-right text-foreground">{formatCurrency(selectedOrder.amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div>
                <p className="text-xs text-secondary mb-2">Update Status</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => updateOrderStatus(selectedOrder.id, "confirmed")}>Confirm</Button>
                  <Button size="sm" variant="secondary" onClick={() => updateOrderStatus(selectedOrder.id, "shipped")}>Shipped</Button>
                  <Button size="sm" variant="secondary" onClick={() => updateOrderStatus(selectedOrder.id, "delivered")}>Delivered</Button>
                  <Button size="sm" variant="secondary" onClick={() => updateOrderStatus(selectedOrder.id, "completed")}>Complete</Button>
                </div>
              </div>

              <div className="flex items-center justify-center p-6 bg-background rounded-lg">
                <div className="text-center">
                  <div className="w-32 h-32 bg-white border-2 border-border rounded-lg flex items-center justify-center mx-auto mb-3">
                    <QrCode className="w-20 h-20 text-secondary" />
                  </div>
                  <p className="text-xs text-secondary">Scan for tracking</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
