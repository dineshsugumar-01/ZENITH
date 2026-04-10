import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { AlertCircle, TrendingDown, Package, Link2 } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useStockSimulator } from "../../lib/stockSimulator";
import { dataService } from "../../lib/data";
import { authService } from "../../lib/auth";
import { useState, useEffect } from "react";

const demoMovementData = [
  { month: "Oct", inbound: 320, outbound: 280 },
  { month: "Nov", inbound: 380, outbound: 340 },
  { month: "Dec", inbound: 350, outbound: 310 },
  { month: "Jan", inbound: 420, outbound: 380 },
  { month: "Feb", inbound: 390, outbound: 350 },
  { month: "Mar", inbound: 450, outbound: 420 },
];

export function Inventory() {
  const { inventory: simInventory, isConnected: simConnected } = useStockSimulator();
  const user = authService.getCurrentUser();
  const allData = dataService.getData();
  const isDemo = authService.isDemo();

  const [realInventory, setRealInventory] = useState<any[]>([]);
  const [realConnected, setRealConnected] = useState(true);

  useEffect(() => {
    if (isDemo || !user) return;
    const fetchApiData = async () => {
      try {
        const raw = localStorage.getItem("zenith_stock_api_settings");
        const settings = raw ? JSON.parse(raw) : { serverUrl: "http://localhost:8001" };
        const resp = await fetch(`${settings.serverUrl}/stock/${user.id}`);
        if (resp.ok) {
          const data = await resp.json();
          // Map the specific 'updates' array to UI format
          const mappedItems = (data.updates || []).map((u: any, idx: number) => {
            const stock = u.quantity;
            let status = "Good";
            if (stock === 0) status = "Out";
            else if (stock <= 25) status = "Critical";
            else if (stock <= 50) status = "Low";
            
            return {
              id: `api_${idx}`,
              item: u.itemName,
              stock: stock,
              unit: u.unit,
              reorderLevel: 50,
              status: status,
              value: "N/A"
            };
          });
          setRealInventory(mappedItems);
          setRealConnected(true);
        } else {
          setRealConnected(false);
        }
      } catch {
        setRealConnected(false);
      }
    };
    fetchApiData();
  }, [isDemo, user]);

  const inventory = isDemo ? simInventory : realInventory;
  const isConnected = isDemo ? simConnected : realConnected;

  const lowStockItems = inventory.filter(i => i.status === "Low" || i.status === "Critical").length;
  const outOfStockItems = inventory.filter(i => i.stock === 0).length;

  // Count pending/shipped orders for "expected delivery" 
  const pendingOrderCount = allData.orders.filter(
    o => o.companyId === user?.id && (o.status === "shipped" || o.status === "confirmed")
  ).length;
  
  const alerts = inventory.filter(i => i.status !== "Good").sort((a, b) => a.stock - b.stock);

  return (
    <Layout type="company" title="Inventory">
      <div className="space-y-6">
        
        {!isConnected && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Link2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">Stock Server Disconnected</h4>
                        <p className="text-xs text-secondary mt-0.5">Connect your internal ERP to enable live telemetry and auto-replenishment.</p>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Total Monitored SKU</p>
              <h3 className="text-2xl font-semibold text-foreground">{inventory.length}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Low Stock Items</p>
              <h3 className="text-2xl font-semibold text-[#D97706]">{lowStockItems}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Out of Stock</p>
              <h3 className="text-2xl font-semibold text-[#DC2626]">{outOfStockItems}</h3>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Inventory Movement</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={authService.isDemo() ? demoMovementData : []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "8px" }} />
                  <Bar dataKey="inbound" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outbound" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length === 0 ? (
                  <div className="text-center p-4 text-sm text-secondary bg-accent rounded-lg border border-border">
                      All inventory levels are optimal.
                  </div>
              ) : (
                  alerts.map((alertItem) => (
                      <div key={alertItem.id} className={`flex items-start gap-3 p-3 rounded-lg border ${alertItem.status === 'Critical' || alertItem.stock === 0 ? 'bg-[#FEE2E2] border-[#FCA5A5]' : 'bg-[#FEF3C7] border-[#FDE68A]'}`}>
                          {alertItem.status === 'Critical' ? (
                              <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                          ) : (
                              <TrendingDown className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">{alertItem.item}</p>
                            <p className="text-xs text-secondary">{alertItem.status}: {alertItem.stock} {alertItem.unit} remaining</p>
                          </div>
                      </div>
                  ))
              )}
              
              <div className="flex items-start gap-3 p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg mt-4">
                <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Expected Delivery</p>
                  <p className="text-xs text-secondary">{pendingOrderCount > 0 ? `${pendingOrderCount} order(s) arriving soon` : "No pending deliveries"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Item</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Current Stock</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Reorder Level</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id} className={`border-b border-border hover:bg-accent transition-colors ${item.status === 'Critical' ? 'bg-red-500/5' : ''}`}>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{item.item}</td>
                      <td className={`py-3 px-4 text-sm font-semibold ${item.status === 'Critical' ? 'text-red-500' : item.status === 'Low' ? 'text-amber-500' : 'text-foreground'}`}>
                          {item.stock} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary">{item.reorderLevel} {item.unit}</td>
                      <td className="py-3 px-4">
                        <Badge variant={item.status === "Good" ? "success" : item.status === "Low" ? "warning" : "danger"}>
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
