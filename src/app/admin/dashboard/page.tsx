
"use client";

import { useEffect, useState } from "react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  IndianRupee,
  AlertCircle,
  PhoneCall,
  Plus,
  CreditCard,
  ClipboardCheck,
  FileEdit,
  BarChart3,
  MessageSquare,
  ArrowRight,
  MapPin,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { dashboardService } from "@/services/dashboardService";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#0D7C8F", "#1E2A4A", "#E8A020", "#059669", "#6B7280"];

interface KpiData {
  totalStudents: number;
  activeStaff: number;
  feesCollectedThisMonth: number;
  pendingDues: number;
}
interface FeeAlert {
  id: string;
  name: string;
  class: string;
  dueDate: { toDate: () => Date };
  amount: number;
  overdue?: boolean;
}
interface RecentEnquiry {
  id: string;
  name: string;
  source: string;
  class: string;
  status: string;
  date: { toDate: () => Date };
}
interface LeadSourceData {
  name: string;
  value: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [monthlyFees, setMonthlyFees] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSourceData[]>([]);
  const [feeAlerts, setFeeAlerts] = useState<FeeAlert[]>([]);
  const [recentEnquiries, setRecentEnquiries] = useState<RecentEnquiry[]>([]);

  useEffect(() => {
    if (!currentBranch) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          kpiData,
          monthlyFeeData,
          leadSourceData,
          feeAlertsData,
          recentEnquiriesData,
        ] = await Promise.all([
          dashboardService.getDashboardKPIs(currentBranch),
          dashboardService.getMonthlyFeeCollection(currentBranch),
          dashboardService.getLeadSources(currentBranch),
          dashboardService.getFeeAlerts(currentBranch),
          dashboardService.getRecentEnquiries(currentBranch),
        ]);

        setKpis(kpiData);
        setMonthlyFees(monthlyFeeData);
        setLeadSources(leadSourceData);
        setFeeAlerts(feeAlertsData as FeeAlert[]);
        setRecentEnquiries(recentEnquiriesData as RecentEnquiry[]);
      } catch (err) {
        console.error("Dashboard data fetching error:", err);
        setError("Failed to load dashboard data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentBranch]);

  const quickActions = [
    { label: "Add Student", icon: Plus, href: "/admin/students/add" },
    { label: "Collect Fee", icon: CreditCard, href: "/admin/fees" },
    { label: "Attendance", icon: ClipboardCheck, href: "/admin/attendance" },
    { label: "New Enquiry", icon: PhoneCall, href: "/admin/leads" },
    { label: "Schedule Exam", icon: FileEdit, href: "/admin/examination" },
    { label: "Reports", icon: BarChart3, href: "/admin/reports" },
  ];

  const kpiCards = kpis
    ? [
        {
          label: "Total Students",
          value: kpis.totalStudents,
          sub: "Active",
          icon: Users,
          color: "border-[#0D7C8F]",
          iconColor: "text-[#0D7C8F]",
        },
        {
          label: "Active Staff",
          value: kpis.activeStaff,
          sub: "Across departments",
          icon: UserCheck,
          color: "border-[#1E2A4A]",
          iconColor: "text-[#1E2A4A]",
        },
        {
          label: "Fees Collected",
          value: `₹${kpis.feesCollectedThisMonth.toLocaleString("en-IN")}`,
          sub: "This Month",
          icon: IndianRupee,
          color: "border-green-600",
          iconColor: "text-green-600",
        },
        {
          label: "Pending Dues",
          value: `₹${kpis.pendingDues.toLocaleString("en-IN")}`,
          sub: "Immediate attention",
          icon: AlertCircle,
          color: "border-amber-500",
          iconColor: "text-amber-500",
        },
      ]
    : [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-lg font-medium text-red-600">Error</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Dashboard" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3 bg-[#0D7C8F]/10 border border-[#0D7C8F]/20 p-4 rounded-xl">
          <MapPin className="text-[#0D7C8F] h-5 w-5" />
          <p className="text-sm font-medium text-[#1E2A4A]">
            Viewing:{" "}
            <span className="font-bold">{currentBranch} Branch</span> — Data as
            of{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading
            ? [...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                  </CardContent>
                </Card>
              ))
            : kpiCards.map((kpi, idx) => (
                <Card
                  key={idx}
                  className={`border-none border-l-4 ${kpi.color} shadow-sm hover:shadow-md transition-all`}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {kpi.label}
                    </CardTitle>
                    <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#1E2A4A]">
                      {kpi.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpi.sub}
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-12">
          <Card className="md:col-span-7 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#1E2A4A]">
                Fee Collection — Last 6 Months
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFees}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E2E8F0"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: "#F1F5F9" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: number) => [
                        `₹${value.toLocaleString()}`,
                        "Collected",
                      ]}
                    />
                    <Bar
                      dataKey="collected"
                      fill="#0D7C8F"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-5 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#1E2A4A]">
                Lead Sources This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadSources}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {leadSources.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Attendance & Fee Alerts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Today&apos;s Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#1E2A4A]">
                Fee Due Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {feeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${
                        alert.overdue
                          ? "border-red-500 bg-red-50/50"
                          : "border-amber-500 bg-amber-50/50"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-[#1E2A4A]">
                          {alert.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Class {alert.class} • Due{" "}
                          {alert.dueDate.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-red-600">
                          ₹{alert.amount}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="link"
                    className="w-full text-xs text-[#0D7C8F] mt-2"
                  >
                    View All Dues <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enquiries & Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#1E2A4A]">
                Recent Enquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEnquiries.map((enq) => (
                    <div
                      key={enq.id}
                      className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#1E2A4A]">
                          {enq.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{enq.name}</p>
                          <div className="flex gap-2 items-center">
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 h-4 bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {enq.source}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              Class {enq.class}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="text-[10px] bg-teal-600">
                          {enq.status}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {enq.date.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="link"
                    className="w-full text-xs text-[#0D7C8F]"
                  >
                    View All Leads <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#1E2A4A]">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-[#0D7C8F]/20 transition-all group"
                    onClick={() => (window.location.href = action.href)}
                  >
                    <div className="h-10 w-10 rounded-lg bg-[#1E2A4A]/5 flex items-center justify-center text-[#1E2A4A] group-hover:bg-[#0D7C8F] group-hover:text-white transition-all">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-center text-muted-foreground group-hover:text-[#1E2A4A]">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
