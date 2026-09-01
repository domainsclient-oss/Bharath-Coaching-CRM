"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, IndianRupee, TrendingDown, TrendingUp, Users, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AccessDenied } from "@/components/auth/access-denied";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useBranch } from "@/context/BranchContext";
import {
  Bar, BarChart, Pie, PieChart, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

interface FeeDoc {
  id: string;
  studentId?: string;
  studentName?: string;
  name?: string;
  branchId: string;
  totalFee: number;
  amountPaid: number;
  balance: number;
  status: string;
  paymentDate?: string | null;
  dueDate?: string;
  mode?: string | null;
}

interface StudentDoc {
  id: string;
  branchId: string;
}

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const COLORS = ["#0D7C8F", "#1E2A4A", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6"];

function getDateStr(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (typeof (raw as { toDate?: () => Date }).toDate === "function") {
    const d = (raw as { toDate: () => Date }).toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return String(raw);
}

function localYearMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return { year: String(y), yearMonth: `${y}-${m}` };
}

export default function FeeAnalyticsPage() {
  const { user } = useAuth();
  const { branches } = useBranch();

  // Fetch all fees and students across all branches (super_admin view)
  const { data: allFees, loading } = useFirestoreCollection<FeeDoc>(
    "fees",
    null,
    { filterByBranch: false, orderByField: "createdAt", orderByDir: "desc" }
  );
  const { data: allStudents } = useFirestoreCollection<StudentDoc>(
    "students",
    null,
    { filterByBranch: false, orderByField: "createdAt", orderByDir: "desc" }
  );

  const { year, yearMonth } = localYearMonth();

  const analytics = useMemo(() => {
    const paid = allFees.filter(r => (r.amountPaid ?? 0) > 0);

    // KPIs
    const totalCollectedYTD = paid
      .filter(r => getDateStr(r.paymentDate).startsWith(year))
      .reduce((s, r) => s + (r.amountPaid ?? 0), 0);

    const collectedThisMonth = paid
      .filter(r => getDateStr(r.paymentDate).startsWith(yearMonth))
      .reduce((s, r) => s + (r.amountPaid ?? 0), 0);

    const totalOutstanding = allFees.reduce((s, r) => s + (r.balance ?? 0), 0);

    const today = new Date().toISOString().split("T")[0];
    const defaulters = new Set(
      allFees
        .filter(r => (r.balance ?? 0) > 0 && r.dueDate && r.dueDate < today)
        .map(r => r.studentId ?? r.id)
    ).size;

    // Monthly collection — last 6 months
    const monthlyCollection = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        month: d.toLocaleString("default", { month: "short" }),
        key,
        amount: 0,
      };
    });
    paid.forEach(r => {
      const pd = getDateStr(r.paymentDate);
      if (!pd) return;
      const monthKey = pd.slice(0, 7); // "YYYY-MM"
      const entry = monthlyCollection.find(m => m.key === monthKey);
      if (entry) entry.amount += r.amountPaid ?? 0;
    });

    // Payment mode breakdown
    const modeMap: Record<string, number> = {};
    paid.forEach(r => {
      const k = r.mode || "Unknown";
      modeMap[k] = (modeMap[k] ?? 0) + (r.amountPaid ?? 0);
    });
    const paymentModes = Object.entries(modeMap).map(([name, value]) => ({ name, value }));

    // Branch-wise comparison — built only from actual fee records to avoid phantom rows
    const branchMap: Record<string, { name: string; totalFee: number; collected: number; balance: number }> = {};

    allFees.forEach(r => {
      const key = r.branchId || "Unknown";
      if (!branchMap[key]) {
        // Resolve display name: exact id match → name field, otherwise use the id as-is
        const branch = branches.find(b => b.id === key);
        branchMap[key] = { name: branch?.name ?? key, totalFee: 0, collected: 0, balance: 0 };
      }
      branchMap[key].totalFee  += r.totalFee   ?? 0;
      branchMap[key].collected += r.amountPaid  ?? 0;
      branchMap[key].balance   += r.balance     ?? 0;
    });

    // Student counts per branch from students collection
    const studentsByBranch: Record<string, number> = {};
    allStudents.forEach(s => {
      const key = s.branchId || "Unknown";
      studentsByBranch[key] = (studentsByBranch[key] ?? 0) + 1;
    });

    const branchData = Object.entries(branchMap).map(([id, d]) => ({
      name: d.name,
      students: studentsByBranch[id] ?? 0,
      totalFees: d.totalFee,
      collected: d.collected,
      outstanding: d.balance,
      pct: d.totalFee > 0 ? (d.collected / d.totalFee) * 100 : 0,
    }));

    return { totalCollectedYTD, collectedThisMonth, totalOutstanding, defaulters, monthlyCollection, paymentModes, branchData };
  }, [allFees, allStudents, branches, year, yearMonth]);

  if (user?.role !== "super_admin") return <AccessDenied />;

  const kpis = [
    { label: "Collected (YTD)",        value: fmt(analytics.totalCollectedYTD),    icon: TrendingUp,     iconBg: "bg-green-100",         iconColor: "text-green-600",  valueColor: "text-green-700" },
    { label: "Collected (This Month)", value: fmt(analytics.collectedThisMonth),   icon: IndianRupee,    iconBg: "bg-[#0D7C8F]/10",      iconColor: "text-[#0D7C8F]",  valueColor: "text-[#0D7C8F]" },
    { label: "Total Outstanding",      value: fmt(analytics.totalOutstanding),     icon: TrendingDown,   iconBg: "bg-red-100",            iconColor: "text-red-600",    valueColor: "text-red-600" },
    { label: "Defaulters",             value: String(analytics.defaulters),        icon: AlertTriangle,  iconBg: "bg-amber-100",          iconColor: "text-amber-600",  valueColor: "text-amber-600" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Fee Analytics" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/fees/collect" className="hover:text-[#0D7C8F]">Fees</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Fee Analytics</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#1E2A4A]">Fee Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of fee collection across all branches</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => (
            <Card key={k.label} className="border-none shadow-sm">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`h-11 w-11 flex-shrink-0 rounded-xl flex items-center justify-center ${k.iconBg}`}>
                  <k.icon className={`h-5 w-5 ${k.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight mb-1">{k.label}</p>
                  {loading
                    ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                    : <p className={`text-xl font-bold leading-tight truncate ${k.valueColor}`}>{k.value}</p>
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar chart — monthly collection */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[#1E2A4A]">Monthly Collection (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.monthlyCollection} barSize={36} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip formatter={(v: number) => [fmt(v), "Collected"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="amount" fill="#0D7C8F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie chart — payment mode */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[#1E2A4A]">Payment Mode Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : analytics.paymentModes.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                  No payment data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={analytics.paymentModes}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={95}
                      innerRadius={50}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {analytics.paymentModes.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Branch comparison table */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1E2A4A]">Branch-wise Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : analytics.branchData.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
                No branch data available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700 pl-6">Branch</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Students</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Total Billed</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Collected</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Outstanding</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right pr-6">Collection %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.branchData.map(b => (
                      <TableRow key={b.name} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium text-[#1E2A4A] pl-6">{b.name}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />{b.students}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{fmt(b.totalFees)}</TableCell>
                        <TableCell className="text-right text-green-700 font-medium">{fmt(b.collected)}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">{fmt(b.outstanding)}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#0D7C8F]"
                                style={{ width: `${Math.min(b.pct, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{b.pct.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
