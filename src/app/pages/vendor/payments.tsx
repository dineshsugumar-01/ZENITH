import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { DollarSign, Clock, CheckCircle } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { dataService } from "../../lib/data";
import { authService } from "../../lib/auth";


export function VendorPayments() {
  const user = authService.getCurrentUser();
  const allData = dataService.getData();
  
  const myPayments = allData.payments.filter(p => p.vendorId === user?.id);

  let totalReceived = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  const tableRows = myPayments.map(payment => {
    const company = authService.getAllCompanies().find(c => c.id === payment.companyId) || allData.vendors.find(v => v.userId === payment.companyId);
    
    // Simplistic due date logic (30 days from creation)
    const createdAt = new Date(payment.createdAt);
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + 30);
    const isOverdue = new Date() > dueDate && payment.status === "pending";
    
    const uiStatus = payment.status === "completed" ? "Paid" : (isOverdue ? "Overdue" : "Pending");

    if (uiStatus === "Paid") totalReceived += payment.amount;
    else if (uiStatus === "Pending") totalPending += payment.amount;
    else if (uiStatus === "Overdue") totalOverdue += payment.amount;

    return {
      id: payment.id,
      po: payment.orderId,
      companyName: company?.companyName || "Unknown",
      amount: payment.amount,
      invoiceDate: createdAt.toLocaleDateString(),
      dueDate: dueDate.toLocaleDateString(),
      status: uiStatus
    };
  });

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString()}`;
  };

  const monthlyRevenueMap: Record<string, number> = {};
  myPayments.forEach(payment => {
    const date = new Date(payment.createdAt);
    const month = date.toLocaleString('default', { month: 'short' });
    if (!monthlyRevenueMap[month]) {
      monthlyRevenueMap[month] = 0;
    }
    monthlyRevenueMap[month] += payment.amount;
  });

  const realRevenueData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.toLocaleString('default', { month: 'short' });
    realRevenueData.push({
      month: m,
      amount: monthlyRevenueMap[m] || 0
    });
  }

  const totalRevenue = totalReceived + totalPending + totalOverdue;

  return (
    <Layout type="vendor" title="Payments">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#059669]" />
                </div>
                <div>
                  <p className="text-sm text-secondary">Total Revenue</p>
                  <h3 className="text-xl font-semibold text-foreground">{formatCurrency(totalRevenue)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#D97706]" />
                </div>
                <div>
                  <p className="text-sm text-secondary">Pending</p>
                  <h3 className="text-xl font-semibold text-foreground">{formatCurrency(totalPending)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#059669]" />
                </div>
                <div>
                  <p className="text-sm text-secondary">Received</p>
                  <h3 className="text-xl font-semibold text-foreground">{formatCurrency(totalReceived)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FEE2E2] rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#DC2626]" />
                </div>
                <div>
                  <p className="text-sm text-secondary">Overdue</p>
                  <h3 className="text-xl font-semibold text-foreground">{formatCurrency(totalOverdue)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={realRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: "12px" }} />
                <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "8px" }} />
                <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Invoice ID</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">PO Number</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Company</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Invoice Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Due Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-secondary">
                        No payments found in current records.
                      </td>
                    </tr>
                  )}
                  {tableRows.map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-accent transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-[#059669]">{payment.id}</td>
                      <td className="py-3 px-4 text-sm text-secondary">{payment.po}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{payment.companyName}</td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">₹{payment.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-secondary">{payment.invoiceDate}</td>
                      <td className="py-3 px-4 text-sm text-secondary">{payment.dueDate}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            payment.status === "Paid"
                              ? "success"
                              : payment.status === "Overdue"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {payment.status}
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
