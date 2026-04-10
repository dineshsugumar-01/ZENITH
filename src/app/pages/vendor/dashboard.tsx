import { useEffect, useState } from "react";
import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { TrendingUp, FileText, ShoppingCart, DollarSign, ArrowRight, Package, Network } from "lucide-react";
import { authService } from "../../lib/auth";
import { dataService } from "../../lib/data";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router";

export function VendorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentRFQs, setRecentRFQs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      const dashboardStats = dataService.getVendorDashboardStats(user.id);
      const openRFQs = dataService.getVendorRFQs(user.id);
      setStats(dashboardStats);
      setRecentRFQs(openRFQs.slice(0, 5));
    }
    setLoading(false);
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  if (loading || !stats) {
    return (
      <Layout type="vendor" title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981]"></div>
        </div>
      </Layout>
    );
  }

  const isEmpty = stats.totalRevenue === 0 && stats.openRFQs === 0;
  const quoteChartData = [
    { status: "Submitted", count: stats.submittedQuotes },
    { status: "Accepted", count: stats.acceptedQuotes },
    { status: "Pending", count: Math.max(0, stats.submittedQuotes - stats.acceptedQuotes) },
  ];

  return (
    <Layout type="vendor" title="Dashboard">
      <div className="space-y-6">

        {isEmpty && (
          <div className="bg-[#D1FAE5] border border-[#6EE7B7] rounded-xl p-6 flex items-start gap-4">
            <div className="p-3 bg-[#10B981]/20 rounded-xl">
              <Package className="w-6 h-6 text-[#059669]" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Welcome to your Vendor Dashboard!</h3>
              <p className="text-sm text-secondary">
                <a href="/vendor/rfqs" className="text-[#059669] underline font-medium">Connect with companies</a> to start receiving RFQs and submitting quotes. Your revenue graphs and order stats will update in real-time once you're active.
              </p>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-secondary mb-1">Total Revenue</p>
                  <h3 className="text-2xl font-semibold">{formatCurrency(stats.totalRevenue)}</h3>
                  <p className="text-xs text-muted mt-2">{stats.totalOrders} total orders</p>
                </div>
                <div className="w-12 h-12 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-[#059669]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-secondary mb-1">Open RFQs</p>
                  <h3 className="text-2xl font-semibold">{stats.openRFQs}</h3>
                  <p className="text-sm text-muted mt-2">Respond soon</p>
                </div>
                <div className="w-12 h-12 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#059669]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-secondary mb-1">Active Orders</p>
                  <h3 className="text-2xl font-semibold">{stats.activeOrders}</h3>
                  <p className="text-sm text-muted mt-2">In progress</p>
                </div>
                <div className="w-12 h-12 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-[#059669]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-secondary mb-1">Pending Payments</p>
                  <h3 className="text-2xl font-semibold">{formatCurrency(stats.pendingPayments)}</h3>
                  <p className="text-sm text-muted mt-2">Due this week</p>
                </div>
                <div className="w-12 h-12 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-[#D97706]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
            <CardContent>
              {stats.revenueData && stats.revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-secondary text-sm">
                  No revenue data yet. Your chart will appear after orders are completed.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quote Performance</CardTitle></CardHeader>
            <CardContent>
              {stats.submittedQuotes > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quoteChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="status" stroke="#6B7280" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
                    <Tooltip contentStyle={{ borderRadius: "8px" }} />
                    <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-secondary text-sm">
                  No quote data yet. Submit quotes to track performance.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent RFQs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Available RFQs</CardTitle>
              <Button size="sm" variant="secondary" onClick={() => navigate("/vendor/rfqs")}>View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentRFQs.length === 0 ? (
              <div className="text-center py-12 text-secondary">
                <Network className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm mb-3">No RFQs yet. Connect with companies to see their open orders.</p>
                <Button size="sm" variant="secondary" onClick={() => navigate("/vendor/rfqs")}>Discover Companies</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase">RFQ ID</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase">Title</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase">Items</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase">Deadline</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRFQs.map((rfq) => (
                      <tr key={rfq.id} className="border-b border-border hover:bg-accent transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-[#059669]">{rfq.id.toUpperCase().slice(-8)}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{rfq.title}</td>
                        <td className="py-3 px-4 text-sm text-secondary">{rfq.items?.length || 0} items</td>
                        <td className="py-3 px-4 text-sm text-secondary">{rfq.deadline}</td>
                        <td className="py-3 px-4"><Badge variant="success">{rfq.status}</Badge></td>
                        <td className="py-3 px-4 text-right">
                          <Button size="sm" onClick={() => navigate("/vendor/rfqs")}>Submit Quote</Button>
                        </td>
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
