"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Briefcase, Download, Users, IndianRupee, UserCheck } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";

interface StaffDoc {
  id: string;
  staffId?: string;
  name: string;
  role: string;
  status: string;
  phone?: string;
  email?: string;
  salary?: number;
  branchId: string;
}

interface PayrollDoc {
  id: string;
  staffId: string;
  status: "Paid" | "Unpaid";
  branchId: string;
}

function fmt(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

export default function HRReportPage() {
  const { currentBranch } = useBranch();

  const { data: staff,   loading: staffLoading   } = useFirestoreCollection<StaffDoc>("staff", currentBranch);
  const { data: payroll, loading: payrollLoading } = useFirestoreCollection<PayrollDoc>("payroll", currentBranch);

  const loading = staffLoading || payrollLoading;

  const [roleF,   setRoleF]   = useState("All");
  const [statusF, setStatusF] = useState("All");

  const roles = useMemo(() => ["All", ...Array.from(new Set(staff.map(s => s.role).filter(Boolean))).sort()], [staff]);

  const filtered = useMemo(() =>
    staff.filter(s =>
      (roleF   === "All" || s.role   === roleF)   &&
      (statusF === "All" || s.status === statusF)
    ), [staff, roleF, statusF]);

  const kpi = useMemo(() => {
    const active     = staff.filter(s => s.status === "Active").length;
    const totalSal   = staff.filter(s => s.status === "Active").reduce((sum, s) => sum + (s.salary ?? 0), 0);
    const payrollPaid = payroll.filter(p => p.status === "Paid").length;
    return { total: staff.length, active, totalSal, payrollPaid };
  }, [staff, payroll]);

  const roleSummary = useMemo(() => {
    const map: Record<string, number> = {};
    staff.forEach(s => { map[s.role] = (map[s.role] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [staff]);

  const handleExport = () => {
    const headers = ["#", "Name", "Staff ID", "Role", "Contact", "Salary", "Status"];
    const rows = filtered.map((s, i) => [
      i + 1, `"${s.name}"`, s.staffId ?? "—", s.role, s.phone ?? "—", s.salary ?? 0, s.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "hr-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: `${filtered.length} records exported.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Human Resource Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Human Resource</span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Staff",     value: kpi.total,            color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: Users       },
            { label: "Active Staff",    value: kpi.active,           color: "text-green-600", bg: "bg-green-100", icon: UserCheck   },
            { label: "Monthly Payroll", value: fmt(kpi.totalSal),    color: "text-pink-600",  bg: "bg-pink-100",  icon: IndianRupee },
            { label: "Payroll Paid",    value: kpi.payrollPaid,      color: "text-teal-600",  bg: "bg-teal-100",  icon: Briefcase   },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    {loading
                      ? <Skeleton className="h-7 w-16 mt-0.5" />
                      : <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Role breakdown */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b py-3 px-6">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Staff by Role</CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            ) : roleSummary.length === 0 ? (
              <p className="col-span-4 text-sm text-center text-muted-foreground py-4">No staff records found.</p>
            ) : roleSummary.map(([role, count]) => (
              <div key={role} className="text-center bg-slate-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-[#1E2A4A]">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{role}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Staff table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Staff Records — {filtered.length}</CardTitle>
            <div className="flex gap-2">
              <Select value={roleF} onValueChange={setRoleF}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r === "All" ? "All Roles" : r}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={statusF} onValueChange={setStatusF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["All", "Active", "Inactive"].map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Status" : s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8 bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-1.5"
                onClick={handleExport} disabled={loading || filtered.length === 0}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-20 text-center text-muted-foreground">No records found.</TableCell></TableRow>
              ) : filtered.map((s, i) => (
                <TableRow key={s.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-semibold text-sm text-[#1E2A4A]">{s.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.staffId ?? "—"}</TableCell>
                  <TableCell><Badge className="bg-pink-100 text-pink-700 text-[10px]">{s.role}</Badge></TableCell>
                  <TableCell className="text-xs">{s.phone ?? "—"}</TableCell>
                  <TableCell className="text-right font-semibold text-sm">{s.salary ? fmt(s.salary) : "—"}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${s.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.status}</Badge>
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
