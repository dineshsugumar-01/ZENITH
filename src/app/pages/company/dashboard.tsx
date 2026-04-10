import { useEffect, useState } from "react";
import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, AlertCircle, Sparkles, PackageOpen } from "lucide-react";
import { authService } from "../../lib/auth";
import { dataService } from "../../lib/data";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function CompanyDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentRFQs, setRecentRFQs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      const s = dataService.getDashboardStats(user.id);
      setStats(s);
      const rfqs = dataService.getAllRFQs(user.id);
      setRecentRFQs(rfqs.slice(-5).reverse());
    }
    setLoading(false);
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusVariant = (status: string) => {
    const map: Record<string, any> = {
      awarded: "success", completed: "success", verified: "success",
      open: "warning", quoted: "warning", submitted: "warning",
      rejected: "danger", closed: "danger",
    };
    return map[status] || "default";
  };

  if (loading || !stats) {
    return (
      <Layout type="company" title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const isEmpty = stats.totalOrders === 0 && stats.activeRFQs === 0 && stats.verifiedVendors === 0;

  return (
    <Layout type="company" title="Dashboard">
      <div className="space-y-6">

        {isEmpty && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <PackageOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Welcome to Zenith — Your procurement hub is ready!</h3>
              <p className="text-sm text-secondary">
                Get started by <a href="/company/vendors" className="text-primary underline">connecting vendors</a> to your network and <a href="/company/rfq" className="text-primary underline">creating your first RFQ</a>. All charts and stats will update automatically as your data grows.
              </p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-secondary mb-1">Total Spend</p>
                  <h3 className="text-2xl font-semibold text-foreground">{formatCurrency(stats.totalSpend)}</h3>
                  <p className="text-xs text-muted mt-2">{stats.totalOrders} total orders</p>
                </div>
                <div className="w-12 h-12 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-secondary mb-1">Active RFQs</p>
                  <h3 className="text-2xl font-semibold text-foreground">{stats.activeRFQs}</h3>
                  <p className="text-xs text-muted mt-2">open for quotes</p>
                </div>
                <div className="w-12 h-12 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-secondary mb-1">Connected Vendors</p>
                  <h3 className="text-2xl font-semibold text-foreground">{stats.verifiedVendors}</h3>
                  <p className="text-xs text-muted mt-2">in your network</p>
                </div>
                <div className="w-12 h-12 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-secondary mb-1">Pending Quotes</p>
                  <h3 className="text-2xl font-semibold text-foreground">{stats.pendingQuotes}</h3>
                  <p className="text-xs text-muted mt-2">awaiting review</p>
                </div>
                <div className="w-12 h-12 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Procurement Spend Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.spendData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-secondary text-sm">
                  No spend data yet. Accept quotes to generate orders.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.spendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, "Spend"]} contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={2} dot={{ fill: "#4F46E5", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendors by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.categoryData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-secondary text-sm">
                  Connect vendors to see breakdown by category.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={stats.categoryData} cx="50%" cy="50%" labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100} fill="#8884d8" dataKey="value">
                      {stats.categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent RFQs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent RFQs</CardTitle>
              <Button size="sm" variant="secondary" onClick={() => window.location.href = "/company/rfq"}>View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentRFQs.length === 0 ? (
              <div className="text-center py-12 text-secondary">
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No RFQs yet. <a href="/company/rfq" className="text-primary underline">Create your first RFQ</a></p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">RFQ ID</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Title</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Items</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRFQs.map((rfq) => (
                      <tr key={rfq.id} className="border-b border-border hover:bg-accent transition-colors cursor-pointer">
                        <td className="py-3 px-4 text-sm font-medium text-primary">{rfq.id.toUpperCase().slice(-8)}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{rfq.title}</td>
                        <td className="py-3 px-4 text-sm text-secondary">{rfq.items?.length || 0} items</td>
                        <td className="py-3 px-4"><Badge variant={getStatusVariant(rfq.status)}>{rfq.status}</Badge></td>
                        <td className="py-3 px-4 text-sm text-secondary">{rfq.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


