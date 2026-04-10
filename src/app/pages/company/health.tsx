import { Layout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Activity, TrendingUp, Clock, Users, DollarSign, CheckCircle } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { dataService } from "../../lib/data";
import { authService } from "../../lib/auth";

export function ProcurementHealth() {
  const user = authService.getCurrentUser();
  const allData = dataService.getData();
  const companyId = user?.id || "";

  const orders = allData.orders.filter(o => o.companyId === companyId);
  const payments = allData.payments.filter(p => p.companyId === companyId);
  const rfqs = allData.rfqs.filter(r => r.companyId === companyId);
  const quotes = allData.quotes.filter(q => rfqs.some(r => r.id === q.rfqId));
  const approvedVendors = dataService.getApprovedVendorsForCompany(companyId);

  // Compute metrics from real data
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "delivered").length;
  const onTimeRate = orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0;

  const totalSpend = orders.reduce((s, o) => s + o.amount, 0);
  const totalPaid = payments.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const costEfficiency = totalSpend > 0 ? Math.min(100, Math.round((totalPaid / totalSpend) * 100)) : 0;

  const acceptedQuotes = quotes.filter(q => q.status === "accepted").length;
  const vendorQuality = quotes.length > 0 ? Math.round((acceptedQuotes / quotes.length) * 100) : 0;

  const closedRFQs = rfqs.filter(r => r.status === "awarded" || r.status === "closed").length;
  const processCompliance = rfqs.length > 0 ? Math.round((closedRFQs / rfqs.length) * 100) : 0;

  const overallScore = orders.length > 0
    ? Math.round((onTimeRate + costEfficiency + vendorQuality + processCompliance) / 4)
    : 0;

  const healthScore = [{ name: "Score", value: overallScore, fill: "#4F46E5" }];

  const metrics = [
    { name: "On-Time Delivery", score: onTimeRate, color: onTimeRate >= 80 ? "#16A34A" : onTimeRate >= 50 ? "#D97706" : "#DC2626" },
    { name: "Cost Efficiency", score: costEfficiency, color: costEfficiency >= 80 ? "#16A34A" : "#4F46E5" },
    { name: "Vendor Quality", score: vendorQuality, color: vendorQuality >= 70 ? "#4F46E5" : "#D97706" },
    { name: "Process Compliance", score: processCompliance, color: processCompliance >= 70 ? "#4F46E5" : "#D97706" },
  ];

  const performanceLabel = overallScore >= 80 ? "Excellent Performance" : overallScore >= 50 ? "Good Performance" : overallScore > 0 ? "Needs Improvement" : "No Data Yet";

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
  };

  const savings = Math.max(0, totalSpend - totalPaid);

  return (
    <Layout type="company" title="Procurement Health">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Overall Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="100%"
                    barSize={20}
                    data={healthScore}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar dataKey="value" cornerRadius={10} fill="#4F46E5" />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center pt-4">
                <h2 className="text-5xl font-bold text-primary">{overallScore}</h2>
                <p className="text-base font-semibold text-foreground mt-2">{performanceLabel}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Key Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.map((metric) => (
                <div key={metric.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{metric.name}</span>
                    <span className="text-sm font-semibold text-foreground">{metric.score}%</span>
                  </div>
                  <div className="w-full bg-accent rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ width: `${metric.score}%`, backgroundColor: metric.color }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#DCFCE7] rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-[#16A34A]" />
                </div>
                <div>
                  <p className="text-sm text-secondary mb-1">Estimated Savings</p>
                  <h3 className="text-2xl font-semibold text-foreground mb-1">{formatCurrency(savings)}</h3>
                  <p className="text-xs text-secondary">from negotiated orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#EEF2FF] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-secondary mb-1">Total RFQs Created</p>
                  <h3 className="text-2xl font-semibold text-foreground mb-1">{rfqs.length}</h3>
                  <p className="text-xs text-secondary">{closedRFQs} completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#DCFCE7] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-[#16A34A]" />
                </div>
                <div>
                  <p className="text-sm text-secondary mb-1">Connected Vendors</p>
                  <h3 className="text-2xl font-semibold text-foreground mb-1">{approvedVendors.length}</h3>
                  <p className="text-xs text-secondary">in your network</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Improvement Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvedVendors.length === 0 && rfqs.length === 0 && orders.length === 0 ? (
              <div className="text-center py-8 text-secondary text-sm">
                Start by connecting vendors and creating RFQs to generate health insights.
              </div>
            ) : (
              <>
                {approvedVendors.length > 2 && (
                  <div className="flex items-start gap-4 p-4 border border-border rounded-lg">
                    <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">Optimize Vendor Mix</h4>
                      <p className="text-sm text-secondary mb-2">
                        You have {approvedVendors.length} connected vendors. Consolidating orders could improve efficiency.
                      </p>
                      <Badge variant="success">Potential Optimization</Badge>
                    </div>
                  </div>
                )}

                {processCompliance < 80 && rfqs.length > 0 && (
                  <div className="flex items-start gap-4 p-4 border border-border rounded-lg">
                    <div className="w-8 h-8 bg-[#FEF3C7] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-[#D97706]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">Close Open RFQs</h4>
                      <p className="text-sm text-secondary mb-2">
                        {rfqs.length - closedRFQs} RFQ(s) are still open. Award contracts to improve your compliance score.
                      </p>
                      <Badge variant="warning">Process Compliance: {processCompliance}%</Badge>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 p-4 border border-border rounded-lg">
                  <div className="w-8 h-8 bg-[#DCFCE7] rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-[#16A34A]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">Keep Building</h4>
                    <p className="text-sm text-secondary mb-2">
                      Continue processing orders and payments to improve your overall health score over time.
                    </p>
                    <Badge variant="success">Overall Score: {overallScore}/100</Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
