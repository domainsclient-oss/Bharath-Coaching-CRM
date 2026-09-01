"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Users, CheckCircle2, XCircle, IndianRupee, Download,
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
  processedDate?: string;
}

interface AttendanceDoc {
  id: string;
  staffId: string;
  date: string;
  status: string;
  branchId: string;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function StaffMonthlyReportPage() {
  const { currentBranch } = useBranch();
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year,  setYear]  = useState(today.getFullYear());

  const { data: allStaff,      loading: staffLoading   } = useFirestoreCollection<StaffDoc>("staff", currentBranch);
  const { data: payrollDocs,   loading: payrollLoading } = useFirestoreCollection<PayrollDoc>("payroll", currentBranch);
  const { data: allAttendance, loading: attLoading     } = useFirestoreCollection<AttendanceDoc>("staffAttendance", currentBranch);

  const activeStaff = useMemo(
    () => allStaff.filter(s => s.status === "Active"),
    [allStaff],
  );

  const monthYear = useMemo(
    () => `${year}-${String(month).padStart(2, "0")}`,
    [year, month],
  );

  // Filter attendance records to the selected month in memory — no composite index needed
  const attendanceRecs = useMemo(
    () => allAttendance.filter(a => a.date.startsWith(monthYear)),
    [allAttendance, monthYear],
  );

  // Distinct working days found in attendance records
  const workingDays = useMemo(() => {
    const dates = new Set(attendanceRecs.map(a => a.date));
    return dates.size || 22;
  }, [attendanceRecs]);

  const rows = useMemo(() => {
    return activeStaff.map(s => {
      const staffAtt = attendanceRecs.filter(a => a.staffId === s.id);
      const present  = staffAtt.filter(a => a.status === "Present").length;
      const absent   = staffAtt.filter(a => a.status === "Absent").length;
      const halfDay  = staffAtt.filter(a => a.status === "Half Day" || a.status === "Half-Day").length;
      const leave    = staffAtt.filter(a => a.status === "Leave").length;
      const effectiveDays = present + halfDay * 0.5;
      const attendancePct = workingDays > 0
        ? Math.round((effectiveDays / workingDays) * 100)
        : 0;

      const payrollRec = payrollDocs.find(p => p.staffId === s.id && p.monthYear === monthYear);
      const baseSalary = payrollRec?.baseSalary ?? (s.salary ?? 0);
      const bonus      = payrollRec?.bonus      ?? 0;
      const deductions = payrollRec?.deductions ?? 0;
      const netSalary  = payrollRec?.netSalary  ?? (s.salary ?? 0);
      const payStatus  = payrollRec?.status     ?? "Unpaid";

      return {
        id: s.id, name: s.name, staffId: s.staffId ?? s.id, role: s.role,
        present, absent, halfDay, leave, effectiveDays, attendancePct,
        baseSalary, bonus, deductions, netSalary, payStatus,
      };
    });
  }, [activeStaff, attendanceRecs, payrollDocs, monthYear, workingDays]);

  const totalSalary   = rows.reduce((s, r) => s + r.netSalary, 0);
  const paidSalary    = rows.filter(r => r.payStatus === "Paid").reduce((s, r) => s + r.netSalary, 0);
  const pendingSalary = totalSalary - paidSalary;
  const avgAtt        = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.attendancePct, 0) / rows.length)
    : 0;

  const handleExport = () => {
    const headers = ["Staff ID","Name","Role","Present","Absent","Half Day","Leave","Att %","Base Salary","Bonus","Deductions","Net Salary","Pay Status"];
    const csvRows = rows.map(r =>
      [r.staffId, r.name, r.role, r.present, r.absent, r.halfDay, r.leave,
       r.attendancePct + "%", r.baseSalary, r.bonus, r.deductions, r.netSalary, r.payStatus].join(",")
    );
    const blob = new Blob([headers.join(",") + "\n" + csvRows.join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `staff-monthly-report-${monthYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = staffLoading || payrollLoading || attLoading;


  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Staff Monthly Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/hr" className="hover:text-[#0D7C8F]">HR</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Monthly Report</span>
        </div>

        {/* Header + filters */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Monthly Staff Report</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleExport} disabled={rows.length === 0}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Staff",    value: activeStaff.length, sub: "active",                    color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: Users },
            { label: "Avg Attendance", value: `${avgAtt}%`,        sub: `${workingDays} working days`, color: "text-green-600", bg: "bg-green-100", icon: CheckCircle2 },
            { label: "Total Payroll",  value: fmt(totalSalary),   sub: "gross salary",              color: "text-[#0D7C8F]", bg: "bg-teal-100",  icon: IndianRupee },
            { label: "Salary Pending", value: fmt(pendingSalary), sub: fmt(paidSalary) + " paid",   color: "text-amber-600", bg: "bg-amber-100", icon: XCircle },
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
                    <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-muted-foreground">{c.sub}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Report table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">
              {MONTHS[month - 1]} {year} — Staff-wise Summary
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Half Day</TableHead>
                  <TableHead className="text-center">Leave</TableHead>
                  <TableHead className="text-center">Att %</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Bonus</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead className="text-center">Pay Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(12)].map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-32 text-center text-muted-foreground">
                      No active staff found for {currentBranch} in {MONTHS[month - 1]} {year}.
                    </TableCell>
                  </TableRow>
                ) : rows.map(r => (
                  <TableRow key={r.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-[#1E2A4A]">{r.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{r.staffId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.role}</TableCell>
                    <TableCell className="text-center text-green-600 font-semibold">{r.present}</TableCell>
                    <TableCell className="text-center text-red-500 font-semibold">{r.absent}</TableCell>
                    <TableCell className="text-center text-amber-600 font-semibold">{r.halfDay}</TableCell>
                    <TableCell className="text-center text-blue-600 font-semibold">{r.leave}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-bold ${r.attendancePct >= 90 ? "text-green-600" : r.attendancePct >= 75 ? "text-amber-600" : "text-red-500"}`}>
                          {r.attendancePct}%
                        </span>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${r.attendancePct >= 90 ? "bg-green-500" : r.attendancePct >= 75 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${r.attendancePct}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">{fmt(r.baseSalary)}</TableCell>
                    <TableCell className="text-right text-sm text-green-600">{r.bonus > 0 ? "+" + fmt(r.bonus) : "—"}</TableCell>
                    <TableCell className="text-right text-sm text-red-500">{r.deductions > 0 ? "-" + fmt(r.deductions) : "—"}</TableCell>
                    <TableCell className="text-right font-bold text-[#1E2A4A]">{fmt(r.netSalary)}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={r.payStatus === "Paid"
                          ? "text-xs text-green-600 border-green-200 bg-green-50"
                          : "text-xs text-amber-600 border-amber-200 bg-amber-50"}
                      >
                        {r.payStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="bg-slate-50 border-t px-6 py-2 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{rows.length} staff members</span>
            <div className="flex gap-6">
              <span>Total: <span className="font-bold text-[#1E2A4A]">{fmt(totalSalary)}</span></span>
              <span>Paid: <span className="font-bold text-green-600">{fmt(paidSalary)}</span></span>
              <span>Pending: <span className="font-bold text-amber-600">{fmt(pendingSalary)}</span></span>
            </div>
          </div>
        </Card>

      </main>
    </div>
  );
}
