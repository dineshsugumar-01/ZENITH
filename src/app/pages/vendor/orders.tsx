import { useState, useEffect } from "react";
import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { dataService, PurchaseOrder, RFQ, Vendor } from "../../lib/data";
import { authService } from "../../lib/auth";

interface OrderWithDetails extends PurchaseOrder {
  rfq?: RFQ;
  vendor?: Vendor;
}

export function VendorOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    const user = authService.getCurrentUser();
    if (!user) return;

    const allOrders = dataService.getOrdersForVendor(user.id).map(order => {
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

  if (loading) {
    return (
      <Layout type="vendor" title="Orders">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981]"></div>
        </div>
      </Layout>
    );
  }

  const totalOrders = orders.length;
  const inProductionOrders = orders.filter(o => o.status === "created" || o.status === "confirmed").length;
  const shippedOrders = orders.filter(o => o.status === "shipped").length;
  const deliveredOrders = orders.filter(o => o.status === "delivered" || o.status === "completed").length;

  return (
    <Layout type="vendor" title="Orders">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Total Orders</p>
              <h3 className="text-2xl font-semibold text-foreground">{totalOrders}</h3>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">In Production</p>
              <h3 className="text-2xl font-semibold text-foreground">{inProductionOrders}</h3>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Shipped</p>
              <h3 className="text-2xl font-semibold text-foreground">{shippedOrders}</h3>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Delivered</p>
              <h3 className="text-2xl font-semibold text-foreground">{deliveredOrders}</h3>
            </CardContent>
          </Card>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Orders Yet</h3>
              <p className="text-sm text-secondary">Submit quotes on RFQs to receive orders</p>
              <Button className="mt-4" onClick={() => window.location.href = "/vendor/rfqs"}>
                Browse RFQs
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
                        <td className="py-3 px-4 text-sm font-medium text-[#059669]">{order.id.toUpperCase().slice(-6)}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{order.rfq?.title || "N/A"}</td>
                        <td className="py-3 px-4 text-sm text-secondary">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground">{formatCurrency(order.amount)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => alert(`Order Details:\nPO: ${order.id}\nAmount: ${formatCurrency(order.amount)}\nStatus: ${order.status}`)}>View</Button>
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
    </Layout>
  );
}
