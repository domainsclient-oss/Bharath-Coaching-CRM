"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, TrendingUp, Users, IndianRupee, BarChart3, Download,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";

interface StaffDoc {
  id: string;
  staffId?: string;
  name: string;
  role: string;
  status: string;
  salary?: number;
  branchId: string;
}

interface PayrollDoc {
  id: string;
  staffId: string;
  monthYear: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: "Paid" | "Unpaid";
  branchId: string;
}

interface AttendanceDoc {
  id: string;
  staffId: string;
  date: string;
  status: string;
  branchId: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function StaffYearlyReportPage() {
  const { currentBranch } = useBranch();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: allStaff,      loading: staffLoading   } = useFirestoreCollection<StaffDoc>("staff", currentBranch);
  const { data: allPayroll,    loading: payrollLoading } = useFirestoreCollection<PayrollDoc>("payroll", currentBranch);
  const { data: allAttendance, loading: attLoading     } = useFirestoreCollection<AttendanceDoc>("staffAttendance", currentBranch);

  const activeStaff = useMemo(
    () => allStaff.filter(s => s.status === "Active"),
    [allStaff],
  );

  // Derive available years from real data
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    allPayroll.forEach(p => years.add(Number(p.monthYear.slice(0, 4))));
    allAttendance.forEach(a => years.add(Number(a.date.slice(0, 4))));
    return [...years].sort((a, b) => b - a);
  }, [allPayroll, allAttendance, currentYear]);

  // Filter to selected year
  const yearPayroll    = useMemo(() => allPayroll.filter(p => p.monthYear.startsWith(String(year))),    [allPayroll, year]);
  const yearAttendance = useMemo(() => allAttendance.filter(a => a.date.startsWith(String(year))),      [allAttendance, year]);

  // Month-wise payroll totals — for months with no records, fall back to sum of staff salaries
  const monthlyPayroll = useMemo(() => {
    const staffSalaryTotal = activeStaff.reduce((s, st) => s + (st.salary ?? 0), 0);
    return MONTHS.map((_, idx) => {
      const monthYear = `${year}-${String(idx + 1).padStart(2, "0")}`;
      const recs  = yearPayroll.filter(p => p.monthYear === monthYear);
      const paid  = recs.filter(p => p.status === "Paid").reduce((s, p) => s + p.netSalary, 0);
      // Use actual records if they exist; fall back to budgeted salary total
      const total = recs.length > 0
        ? recs.reduce((s, p) => s + p.netSalary, 0)
        : staffSalaryTotal;
      return { monthYear, total, paid, pending: total - paid, hasRecords: recs.length > 0 };
    });
  }, [yearPayroll, year, activeStaff]);

  // Month-wise attendance totals
  const monthlyAttendance = useMemo(() => {
    return MONTHS.map((_, idx) => {
      const prefix = `${year}-${String(idx + 1).padStart(2, "0")}`;
      const recs    = yearAttendance.filter(a => a.date.startsWith(prefix));
      const present = recs.filter(a => a.status === "Present").length;
      const absent  = recs.filter(a => a.status === "Absent").length;
      const halfDay = recs.filter(a => a.status === "Half Day" || a.status === "Half-Day").length;
      const leave   = recs.filter(a => a.status === "Leave").length;
      const total   = recs.length;
      const pct = total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0;
      return { present, absent, halfDay, leave, total, pct };
    });
  }, [yearAttendance, year]);

  // Per-staff yearly summary
  const staffRows = useMemo(() => {
    // For current year cap at current month; for past years use all 12 months
    const maxMonth = new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12;

    return activeStaff.map(s => {
      const salary     = Number(s.salary) || 0;  // coerce string → number safely
      const staffPay   = yearPayroll.filter(p => p.staffId === s.id);
      const paidRecs   = staffPay.filter(p => p.status === "Paid");
      const paidMonths = paidRecs.length;
      const totalPaid  = paidRecs.reduce((sum, p) => sum + (Number(p.netSalary) || 0), 0);

      // Months up to maxMonth that have NO paid record → each owes one month's salary
      const paidMonthSet = new Set(paidRecs.map(p => p.monthYear));
      const unpaidMonthCount = Array.from({ length: maxMonth }, (_, idx) => {
        const my = `${year}-${String(idx + 1).padStart(2, "0")}`;
        return paidMonthSet.has(my) ? 0 : 1;
      }).reduce((a, b) => a + b, 0);
      const totalPending = unpaidMonthCount * salary;

      const staffAtt = yearAttendance.filter(a => a.staffId === s.id);
      const present  = staffAtt.filter(a => a.status === "Present").length;
      const absent   = staffAtt.filter(a => a.status === "Absent").length;
      const halfDay  = staffAtt.filter(a => a.status === "Half Day" || a.status === "Half-Day").length;
      const leave    = staffAtt.filter(a => a.status === "Leave").length;
      const attPct   = staffAtt.length > 0
        ? Math.round(((present + halfDay * 0.5) / staffAtt.length) * 100)
        : 0;

      return {
        id: s.id, name: s.name, staffId: s.staffId ?? s.id, role: s.role, salary,
        totalPaid, totalPending, paidMonths, maxMonth, present, absent, leave, attPct,
      };
    });
  }, [activeStaff, yearPayroll, yearAttendance, year]);

  const currentMonth    = new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12;
  // Only sum months up to the current month for the selected year
  const relevantMonths  = monthlyPayroll.slice(0, currentMonth);
  const totalYearSalary = relevantMonths.reduce((s, m) => s + m.total, 0);
  const totalYearPaid   = relevantMonths.reduce((s, m) => s + m.paid, 0);
  const maxPayroll      = Math.max(...monthlyPayroll.map(m => m.total), 1);

  const handleExport = () => {
    const headers = ["Staff ID","Name","Role","Present","Absent","Leave","Att %","Total Paid","Pending","Paid Months"];
    const csvRows = staffRows.map(r =>
      [r.staffId, r.name, r.role, r.present, r.absent, r.leave,
       r.attPct + "%", r.totalPaid, r.totalPending, r.paidMonths + "/12"].join(",")
    );
    const blob = new Blob([headers.join(",") + "\n" + csvRows.join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `staff-yearly-report-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = staffLoading || payrollLoading || attLoading;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Staff Yearly Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/hr" className="hover:text-[#0D7C8F]">HR</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Year Report</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Staff Year Report</h2>
          <div className="flex items-center gap-3">
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableYears.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleExport} disabled={staffRows.length === 0}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Staff",  value: activeStaff.length,              color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: Users },
            { label: "Total Payroll", value: fmt(totalYearSalary),            color: "text-[#0D7C8F]", bg: "bg-teal-100",  icon: IndianRupee },
            { label: "Total Paid",    value: fmt(totalYearPaid),              color: "text-green-600", bg: "bg-green-100", icon: TrendingUp },
            { label: "Pending",       value: fmt(totalYearSalary - totalYearPaid), color: "text-amber-600", bg: "bg-amber-100", icon: BarChart3 },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    {isLoading
                      ? <Skeleton className="h-5 w-16 mt-1" />
                      : <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Month-wise payroll bar chart */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">Month-wise Payroll — {year}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <div className="flex items-end gap-2 h-40">
                  {monthlyPayroll.map((m, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-muted-foreground" style={{ fontSize: 9 }}>
                        {m.total > 0 ? fmt(m.total).replace("₹", "") : "—"}
                      </span>
                      <div className="w-full flex flex-col justify-end" style={{ height: 96 }}>
                        {m.total > 0 ? (
                          <div className="w-full rounded-t-sm overflow-hidden">
                            <div className="bg-green-500 w-full" style={{ height: `${Math.round((m.paid / maxPayroll) * 96)}px` }} />
                            {m.pending > 0 && (
                              <div className="bg-amber-400 w-full" style={{ height: `${Math.round((m.pending / maxPayroll) * 96)}px` }} />
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-1 bg-slate-100 rounded" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{MONTHS[idx]}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground justify-end">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Paid</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Pending</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Month-wise attendance trend */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">Month-wise Attendance Trend — {year}</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Half Day</TableHead>
                  <TableHead className="text-center">Leave</TableHead>
                  <TableHead className="text-center">Att %</TableHead>
                  <TableHead className="text-right">Payroll</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(9)].map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : MONTHS.map((m, idx) => {
                  const att     = monthlyAttendance[idx];
                  const pay     = monthlyPayroll[idx];
                  const hasData = att.total > 0 || pay.total > 0;
                  return (
                    <TableRow key={m} className={hasData ? "hover:bg-slate-50/50" : "opacity-40"}>
                      <TableCell className="font-medium text-sm text-[#1E2A4A]">{m} {year}</TableCell>
                      <TableCell className="text-center text-green-600 font-semibold">{att.present || "—"}</TableCell>
                      <TableCell className="text-center text-red-500 font-semibold">{att.absent || "—"}</TableCell>
                      <TableCell className="text-center text-amber-600 font-semibold">{att.halfDay || "—"}</TableCell>
                      <TableCell className="text-center text-blue-600 font-semibold">{att.leave || "—"}</TableCell>
                      <TableCell className="text-center">
                        {att.total > 0 ? (
                          <span className={`text-xs font-bold ${att.pct >= 90 ? "text-green-600" : att.pct >= 75 ? "text-amber-600" : "text-red-500"}`}>
                            {att.pct}%
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm">{pay.total > 0 ? fmt(pay.total) : "—"}</TableCell>
                      <TableCell className="text-right text-sm text-green-600">{pay.paid > 0 ? fmt(pay.paid) : "—"}</TableCell>
                      <TableCell className="text-center">
                        {pay.total === 0 ? (
                          <Badge variant="outline" className="text-xs text-slate-400 border-slate-200">No Data</Badge>
                        ) : pay.pending === 0 ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">Completed</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">Partial</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Per-staff yearly summary */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">Staff-wise Yearly Summary — {year}</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Leave</TableHead>
                <TableHead className="text-center">Att %</TableHead>
                <TableHead className="text-right">Total Paid</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-center">Months Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : staffRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No active staff found for {currentBranch}.
                  </TableCell>
                </TableRow>
              ) : staffRows.map(r => (
                <TableRow key={r.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm text-[#1E2A4A]">{r.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.staffId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.role}</TableCell>
                  <TableCell className="text-center text-green-600 font-semibold">{r.present || "—"}</TableCell>
                  <TableCell className="text-center text-red-500 font-semibold">{r.absent || "—"}</TableCell>
                  <TableCell className="text-center text-blue-600 font-semibold">{r.leave || "—"}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-bold ${r.attPct >= 90 ? "text-green-600" : r.attPct >= 75 ? "text-amber-600" : r.attPct === 0 ? "text-muted-foreground" : "text-red-500"}`}>
                        {r.attPct > 0 ? r.attPct + "%" : "—"}
                      </span>
                      {r.attPct > 0 && (
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${r.attPct >= 90 ? "bg-green-500" : r.attPct >= 75 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${r.attPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {r.totalPaid > 0 ? fmt(r.totalPaid) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.totalPending > 0 ? (
                      <div>
                        <p className="font-semibold text-amber-600">{fmt(r.totalPending)}</p>
                        {r.salary > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            {r.maxMonth - r.paidMonths} mo × {fmt(r.salary)}
                          </p>
                        )}
                      </div>
                    ) : r.salary === 0 ? (
                      <span className="text-xs text-muted-foreground italic">No salary set</span>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">All paid</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-xs ${r.paidMonths === r.maxMonth ? "text-green-600 border-green-200 bg-green-50" : "text-amber-600 border-amber-200 bg-amber-50"}`}>
                      {r.paidMonths}/{r.maxMonth}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

      </main>
    </div>
  );
}
