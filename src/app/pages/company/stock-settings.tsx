import { useState, useEffect } from "react";
import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Server, Link2, CheckCircle, XCircle, Plus, Trash2, RefreshCw, Package, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { authService } from "../../lib/auth";

interface StockItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  unit_price: number;
  category: string;
  last_updated: string;
}

const SETTINGS_KEY = "zenith_stock_api_settings";

function getSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? JSON.parse(raw) : { serverUrl: "http://localhost:8001", apiKey: "" };
}
function saveSettings(settings: any) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function StockSettings() {
  const user = authService.getCurrentUser();
  const [serverUrl, setServerUrl] = useState("http://localhost:8001");
  const [apiKey, setApiKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ itemName: "", quantity: 0, unit: "units", reorder_level: 50, unit_price: 0, category: "General" });
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showStatus = (text: string, type: "success" | "error") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  useEffect(() => {
    const saved = getSettings();
    setServerUrl(saved.serverUrl || "http://localhost:8001");
    setApiKey(saved.apiKey || "");
  }, []);

  const testConnection = async () => {
    setTesting(true);
    try {
      const resp = await fetch(`${serverUrl}/health`);
      if (resp.ok) {
        const data = await resp.json();
        setIsConnected(true);
        saveSettings({ serverUrl, apiKey });
        showStatus(`Connected! ${data.companies_connected || 0} companies on server.`, "success");
        await fetchStock();
      } else {
        setIsConnected(false);
        showStatus("Server responded with an error.", "error");
      }
    } catch {
      setIsConnected(false);
      showStatus("Cannot reach the stock server. Make sure it's running.", "error");
    }
    setTesting(false);
  };

  const fetchStock = async () => {
    if (!user) return;
    try {
      const resp = await fetch(`${serverUrl}/stock/${user.id}`);
      if (resp.ok) {
        const data = await resp.json();
        setStockItems(data.items || []);
        setTotalValue(data.total_value || 0);
        setAlerts(data.alerts || []);
      }
    } catch {
      showStatus("Failed to fetch stock data.", "error");
    }
  };

  const addStockItem = async () => {
    if (!user || !newItem.itemName) return;
    try {
      const resp = await fetch(`${serverUrl}/stock/${user.id}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });
      if (resp.ok) {
        showStatus(`Added ${newItem.itemName} to stock.`, "success");
        setNewItem({ itemName: "", quantity: 0, unit: "units", reorder_level: 50, unit_price: 0, category: "General" });
        setShowAddForm(false);
        await fetchStock();
      } else {
        showStatus("Failed to add stock item: Server error.", "error");
      }
    } catch {
      showStatus("Failed to add stock item.", "error");
    }
  };

  const resetStock = async () => {
    if (!user) return;
    if (!confirm("This will delete all stock items for your company. Continue?")) return;
    try {
      await fetch(`${serverUrl}/stock/${user.id}/reset`, { method: "DELETE" });
      showStatus("Stock reset.", "success");
      setStockItems([]);
      setTotalValue(0);
      setAlerts([]);
    } catch {
      showStatus("Failed to reset.", "error");
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <Layout type="company" title="Stock Server API">
      <div className="space-y-6">

        {/* Status Banner */}
        {statusMsg && (
          <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${statusMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {statusMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {statusMsg.text}
          </div>
        )}

        {/* Connection Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              Stock Server Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-secondary">
              <strong className="text-foreground">How it works:</strong> Connect your FastAPI Stock Server to enable live inventory sync.
              Start the server with: <code className="bg-accent px-2 py-0.5 rounded text-xs font-mono">uvicorn stock_server:app --port 8001 --reload</code>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Server URL</label>
                <Input
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://localhost:8001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">API Key (optional)</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key if required"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isConnected ? (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Wifi className="w-4 h-4" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-secondary">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm">Disconnected</span>
                  </div>
                )}
              </div>
              <Button onClick={testConnection} disabled={testing}>
                <Link2 className="w-4 h-4" />
                {testing ? "Testing..." : "Test & Connect"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Inventory — only shown when connected */}
        {isConnected && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-secondary mb-1">Total SKUs</p>
                  <h3 className="text-2xl font-semibold text-foreground">{stockItems.length}</h3>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-secondary mb-1">Total Value</p>
                  <h3 className="text-2xl font-semibold text-foreground">{formatCurrency(totalValue)}</h3>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-secondary mb-1">Low Stock Alerts</p>
                  <h3 className="text-2xl font-semibold text-amber-500">{alerts.filter(a => a.level === "low").length}</h3>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-secondary mb-1">Critical Alerts</p>
                  <h3 className="text-2xl font-semibold text-red-500">{alerts.filter(a => a.level === "critical" || a.level === "out_of_stock").length}</h3>
                </CardContent>
              </Card>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                  <Plus className="w-4 h-4" /> Add Stock Item
                </Button>
                <Button variant="secondary" onClick={fetchStock}>
                  <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
              </div>
              <Button variant="destructive" onClick={resetStock}>
                <Trash2 className="w-4 h-4" /> Reset All Stock
              </Button>
            </div>

            {/* Add Item Form */}
            {showAddForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add New Stock Item</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Item Name *</label>
                      <Input value={newItem.itemName} onChange={(e) => setNewItem({...newItem, itemName: e.target.value})} placeholder="Steel Rods 20mm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Quantity *</label>
                      <Input type="number" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: +e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Unit</label>
                      <Input value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})} placeholder="kg / units / liters" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Reorder Level</label>
                      <Input type="number" value={newItem.reorder_level} onChange={(e) => setNewItem({...newItem, reorder_level: +e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Unit Price (₹)</label>
                      <Input type="number" value={newItem.unit_price} onChange={(e) => setNewItem({...newItem, unit_price: +e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                      <Input value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})} placeholder="General" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={addStockItem}>Save Item</Button>
                    <Button variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inventory Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Live Inventory ({stockItems.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stockItems.length === 0 ? (
                  <div className="text-center py-12 text-secondary">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No stock items yet. Add items using the form above or bulk-sync from your warehouse.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Item</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Category</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Stock</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Reorder Level</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Unit Price</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Total Value</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Status</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockItems.map((item) => {
                          const status = item.quantity <= 0 ? "Out" : item.quantity <= item.reorder_level / 2 ? "Critical" : item.quantity <= item.reorder_level ? "Low" : "Good";
                          const itemTotalValue = item.quantity * item.unit_price;
                          return (
                            <tr key={item.id} className={`border-b border-border hover:bg-accent transition-colors ${status === "Critical" || status === "Out" ? "bg-red-500/5" : ""}`}>
                              <td className="py-3 px-4 text-sm font-medium text-foreground">{item.item_name}</td>
                              <td className="py-3 px-4 text-sm text-secondary">{item.category}</td>
                              <td className={`py-3 px-4 text-sm font-semibold ${status === "Critical" || status === "Out" ? "text-red-500" : status === "Low" ? "text-amber-500" : "text-foreground"}`}>
                                {item.quantity} {item.unit}
                              </td>
                              <td className="py-3 px-4 text-sm text-secondary">{item.reorder_level} {item.unit}</td>
                              <td className="py-3 px-4 text-sm text-foreground text-right">₹{item.unit_price.toLocaleString()}</td>
                              <td className="py-3 px-4 text-sm font-medium text-foreground text-right">{formatCurrency(itemTotalValue)}</td>
                              <td className="py-3 px-4">
                                <Badge variant={status === "Good" ? "success" : status === "Low" ? "warning" : "danger"}>
                                  {status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-xs text-secondary">{item.last_updated ? new Date(item.last_updated).toLocaleString() : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
