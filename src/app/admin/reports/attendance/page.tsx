"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, CalendarCheck, UserCheck, UserX, Download, Users } from "lucide-react";
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

type AttendanceStatus = string;

interface StudentAttendanceDoc {
  id: string;
  branchId: string;
  date: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  status: AttendanceStatus;
  notes?: string;
}

interface StaffAttendanceDoc {
  id: string;
  branchId: string;
  date: string;
  staffId: string;
  staffName?: string;
  status: AttendanceStatus;
  notes?: string;
}

const STATUS_COLOR: Record<string, string> = {
  Present:    "bg-green-100 text-green-700",
  Absent:     "bg-red-100 text-red-700",
  Leave:      "bg-amber-100 text-amber-700",
  "Half-Day": "bg-blue-100 text-blue-700",
  Late:       "bg-orange-100 text-orange-700",
  Excused:    "bg-purple-100 text-purple-700",
};

export default function AttendanceReportPage() {
  const { currentBranch } = useBranch();

  const { data: studentDocs, loading: studentLoading } =
    useFirestoreCollection<StudentAttendanceDoc>("studentAttendance", currentBranch);
  const { data: staffDocs, loading: staffLoading } =
    useFirestoreCollection<StaffAttendanceDoc>("staffAttendance", currentBranch);

  const [typeF,   setTypeF]   = useState("All");
  const [statusF, setStatusF] = useState("All");

  const loading = studentLoading || staffLoading;

  // Unified rows
  const allRows = useMemo(() => [
    ...studentDocs.map(d => ({ date: d.date, name: d.studentName, entityId: d.studentId, entityType: "student" as const, status: d.status, className: d.className })),
    ...staffDocs.map(d => ({ date: d.date, name: d.staffName ?? d.staffId, entityId: d.staffId, entityType: "staff" as const, status: d.status, className: "" })),
  ], [studentDocs, staffDocs]);

  const filtered = useMemo(() =>
    allRows.filter(r =>
      (typeF   === "All" || r.entityType === typeF) &&
      (statusF === "All" || r.status     === statusF)
    ).sort((a, b) => b.date.localeCompare(a.date)),
    [allRows, typeF, statusF]
  );

  // KPI — counts from all rows
  const kpi = useMemo(() => {
    const present = allRows.filter(r => r.status === "Present").length;
    const absent  = allRows.filter(r => r.status === "Absent").length;
    const pct     = allRows.length > 0 ? Math.round((present / allRows.length) * 100) : 0;
    return { total: allRows.length, present, absent, pct };
  }, [allRows]);

  // Daily summary (all records, last 10 days)
  const daySummary = useMemo(() => {
    const map: Record<string, { present: number; absent: number; total: number }> = {};
    allRows.forEach(r => {
      if (!map[r.date]) map[r.date] = { present: 0, absent: 0, total: 0 };
      map[r.date].total++;
      if (r.status === "Present") map[r.date].present++;
      if (r.status === "Absent")  map[r.date].absent++;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10);
  }, [studentDocs]);

  const handleExport = () => {
    const headers = ["#", "Name", "Type", "Class", "Date", "Status"];
    const rows = filtered.map((r, i) => [i + 1, r.name, r.entityType, r.className || "—", r.date, r.status]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "attendance-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: `${filtered.length} records exported.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Attendance Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Attendance</span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Records",   value: kpi.total,     color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: Users        },
            { label: "Present",         value: kpi.present,   color: "text-green-600", bg: "bg-green-100", icon: UserCheck    },
            { label: "Absent",          value: kpi.absent,    color: "text-red-600",   bg: "bg-red-100",   icon: UserX        },
            { label: "Avg. Attendance", value: `${kpi.pct}%`, color: "text-teal-600",  bg: "bg-teal-100",  icon: CalendarCheck },
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
                      ? <Skeleton className="h-7 w-10 mt-0.5" />
                      : <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Daily summary */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b py-3 px-6">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Recent Daily Summary (Students)</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead>Attendance %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : daySummary.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-16 text-center text-muted-foreground">No attendance marked yet. Mark attendance from the Attendance page.</TableCell></TableRow>
              ) : daySummary.map(([date, d]) => {
                const pct = d.total > 0 ? Math.round((d.present / d.total) * 100) : 0;
                return (
                  <TableRow key={date} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-sm text-[#1E2A4A]">{date}</TableCell>
                    <TableCell className="text-center text-sm">{d.total}</TableCell>
                    <TableCell className="text-center font-semibold text-green-600">{d.present}</TableCell>
                    <TableCell className="text-center font-semibold text-red-600">{d.absent}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full">
                          <div className={`h-full rounded-full ${pct >= 80 ? "bg-green-400" : pct >= 60 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs">{pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Detail records */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Attendance Records — {filtered.length}</CardTitle>
            <div className="flex gap-2">
              <Select value={typeF} onValueChange={setTypeF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusF} onValueChange={setStatusF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["All", "Present", "Absent", "Leave", "Half-Day", "Late"].map(s =>
                    <SelectItem key={s} value={s}>{s === "All" ? "All Status" : s}</SelectItem>
                  )}
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
                <TableHead>Type</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow>
              ) : filtered.slice(0, 100).map((r, i) => (
                <TableRow key={`${r.date}-${r.entityId}`} className="hover:bg-slate-50/50">
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-sm font-medium text-[#1E2A4A]">{r.name}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${r.entityType === "student" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {r.entityType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.className || "—"}</TableCell>
                  <TableCell className="text-xs">{r.date}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${STATUS_COLOR[r.status] ?? "bg-gray-100 text-gray-700"}`}>{r.status}</Badge>
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
