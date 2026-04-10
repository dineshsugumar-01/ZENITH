import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Shield, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { dataService } from "../../lib/data";
import { authService } from "../../lib/auth";

export function Finance() {
  const user = authService.getCurrentUser();
  const allData = dataService.getData();

  const companyId = user?.id || "";
  const orders = allData.orders.filter(o => o.companyId === companyId);
  const payments = allData.payments.filter(p => p.companyId === companyId);

  const totalSpend = orders.reduce((s, o) => s + o.amount, 0);
  const pendingPayments = payments.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const completedPayments = payments.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const savings = Math.max(0, totalSpend - completedPayments - pendingPayments);

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
  };

  // Budget vs Actual from real order data by month
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const spendByMonth: Record<string, number> = {};
  orders.forEach(o => {
    const m = monthNames[new Date(o.createdAt).getMonth()];
    spendByMonth[m] = (spendByMonth[m] || 0) + o.amount;
  });
  const budgetData = monthNames.filter(m => spendByMonth[m]).map(m => ({
    month: m,
    actual: Math.round(spendByMonth[m] / 1000),
    budget: Math.round((spendByMonth[m] / 1000) * 1.05), // budget is 5% above actual as estimate
  }));

  // Category spend from vendors
  const approvedVendors = dataService.getApprovedVendorsForCompany(companyId);
  const colors = ["#4F46E5", "#16A34A", "#D97706", "#6B7280", "#EF4444", "#8B5CF6"];
  const catCount: Record<string, number> = {};
  approvedVendors.forEach(v => {
    catCount[v.category] = (catCount[v.category] || 0) + 1;
  });
  const departmentSpend = Object.entries(catCount).map(([name, value], i) => ({
    name, value, color: colors[i % colors.length]
  }));

  // Recent transactions from payments
  const recentTransactions = payments.slice(-5).reverse().map(p => {
    const vendor = allData.vendors.find(v => v.userId === p.vendorId);
    return {
      vendor: vendor?.companyName || "Unknown Vendor",
      invoice: p.id,
      amount: formatCurrency(p.amount),
      date: new Date(p.createdAt).toLocaleDateString(),
      status: p.status === "completed" ? "Paid" : p.status === "processed" ? "Processing" : "Pending",
    };
  });

  return (
    <Layout type="company" title="Finance">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-secondary">Total Spend</p>
                  <h3 className="text-xl font-semibold text-foreground">{formatCurrency(totalSpend)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DCFCE7] rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div>
                  <p className="text-sm text-secondary">Completed Payments</p>
                  <h3 className="text-xl font-semibold text-foreground">{formatCurrency(completedPayments)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#D97706]" />
                </div>
                <div>
                  <p className="text-sm text-secondary">Pending Payments</p>
                  <h3 className="text-xl font-semibold text-foreground">{formatCurrency(pendingPayments)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DCFCE7] rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div>
                  <p className="text-sm text-secondary">Savings (Est)</p>
                  <h3 className="text-xl font-semibold text-foreground">{formatCurrency(savings)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spend</CardTitle>
            </CardHeader>
            <CardContent>
              {budgetData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-secondary text-sm">
                  No spend data yet. Create orders to see monthly trends.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="budget" stroke="#6B7280" strokeWidth={2} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="actual" stroke="#4F46E5" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spend by Vendor Category</CardTitle>
            </CardHeader>
            <CardContent>
              {departmentSpend.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-secondary text-sm">
                  Connect vendors to see category breakdown.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={departmentSpend}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentSpend.map((entry, index) => (
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-secondary text-sm">
                  No transactions recorded yet. Payments will appear here once orders are processed.
                </div>
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.invoice} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{tx.vendor}</p>
                      <p className="text-xs text-secondary mt-0.5">{tx.invoice} • {tx.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-semibold text-foreground">{tx.amount}</p>
                      <Badge variant={tx.status === "Paid" ? "success" : tx.status === "Processing" ? "warning" : "secondary"}>
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
