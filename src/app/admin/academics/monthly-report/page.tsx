"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight, Printer, Download, TrendingUp, Users, CheckCircle, AlertCircle,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { db } from "@/config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentDoc {
  id: string;
  name: string;
  rollNo?: string;
  applicationNo?: string;
  class: string;
  board: string;
  status: string;
  branchId: string;
}

interface ClassDoc {
  id: string;
  name: string;
  board: string;
  branchId: string;
}

interface AttendanceDoc {
  studentId: string;
  date: string;
  status: string;
  classId?: string;
}

interface MarkDoc {
  studentId: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  date: string;
  status?: string;
}

interface StudentMonthlyRecord {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  board: string;
  subjects: { name: string; marks: number; maxMarks: number }[];
  attendanceDays: number;
  totalWorkingDays: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const YEARS = ["2026", "2025", "2024"];
const BOARDS = ["All", "CBSE", "State", "ICSE", "Samacheer", "IB"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAvgMarks(subjects: StudentMonthlyRecord["subjects"]): number {
  if (!subjects.length) return 0;
  const total = subjects.reduce((s, sub) => s + sub.marks, 0);
  const max   = subjects.reduce((s, sub) => s + sub.maxMarks, 0);
  return max > 0 ? Math.round((total / max) * 100) : 0;
}

function getAttendancePct(record: StudentMonthlyRecord): number {
  if (!record.totalWorkingDays) return 0;
  return Math.round((record.attendanceDays / record.totalWorkingDays) * 100);
}

function getGrade(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: "A+", color: "bg-emerald-100 text-emerald-800" };
  if (pct >= 80) return { label: "A",  color: "bg-green-100 text-green-800" };
  if (pct >= 70) return { label: "B",  color: "bg-blue-100 text-blue-800" };
  if (pct >= 60) return { label: "C",  color: "bg-yellow-100 text-yellow-800" };
  if (pct >= 50) return { label: "D",  color: "bg-orange-100 text-orange-800" };
  return { label: "F", color: "bg-red-100 text-red-800" };
}

function monthDateRange(month: string, year: string): { start: string; end: string } {
  const monthIdx = MONTHS.indexOf(month);
  const y = parseInt(year, 10);
  const start = `${year}-${String(monthIdx + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(y, monthIdx + 1, 0).getDate();
  const end = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MonthlyReportPage() {
  const { currentBranch } = useBranch();

  const currentMonth = MONTHS[new Date().getMonth()];
  const currentYear  = String(new Date().getFullYear());

  const [filters, setFilters] = useState({
    month: currentMonth,
    year:  currentYear,
    class: "All",
    board: "All",
  });

  const { data: students, loading: studentsLoading } = useFirestoreCollection<StudentDoc>("students", currentBranch);
  const { data: classes }                            = useFirestoreCollection<ClassDoc>("classes", currentBranch);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceDoc[]>([]);
  const [markRecords,       setMarkRecords]       = useState<MarkDoc[]>([]);
  const [dataLoading,       setDataLoading]       = useState(false);

  // Fetch attendance + marks whenever month, year, or branch changes.
  // Query by branchId only (single-field index, no composite needed) and filter dates client-side.
  useEffect(() => {
    if (!currentBranch) return;
    const { start, end } = monthDateRange(filters.month, filters.year);
    setDataLoading(true);

    const attQ  = query(collection(db, "studentAttendance"), where("branchId", "==", currentBranch));
    const markQ = query(collection(db, "marks"),             where("branchId", "==", currentBranch));

    Promise.all([getDocs(attQ), getDocs(markQ)])
      .then(([attSnap, markSnap]) => {
        setAttendanceRecords(
          attSnap.docs
            .map(d => d.data() as AttendanceDoc)
            .filter(a => a.date >= start && a.date <= end)
        );
        setMarkRecords(
          markSnap.docs
            .map(d => d.data() as MarkDoc)
            .filter(m => m.date >= start && m.date <= end)
        );
      })
      .catch(err => console.error("[MonthlyReport] fetch error:", err))
      .finally(() => setDataLoading(false));
  }, [filters.month, filters.year, currentBranch]);

  // Total working days = distinct dates that have any attendance record for the branch/month
  const totalWorkingDays = useMemo(() => {
    const dates = new Set(attendanceRecords.map(a => a.date));
    return dates.size || 0;
  }, [attendanceRecords]);

  // Class list for filter dropdown
  const classOptions = useMemo(() => {
    const names = Array.from(new Set(classes.map(c => c.name))).sort();
    return ["All", ...names];
  }, [classes]);

  const data = useMemo<StudentMonthlyRecord[]>(() => {
    return students
      .filter(s => s.status === "Active" || s.status === "active")
      .filter(s => filters.class === "All" || s.class === filters.class)
      .filter(s => filters.board === "All" || s.board === filters.board)
      .map(student => {
        // Attendance
        const stuAtt = attendanceRecords.filter(a => a.studentId === student.id);
        const presentDays = stuAtt.filter(
          a => a.status === "Present" || a.status === "Half-Day"
        ).length;

        // Marks — group by subject, average if multiple tests
        const stuMarks = markRecords.filter(
          m => m.studentId === student.id && m.status !== "Absent"
        );
        const subjectMap = new Map<string, { total: number; maxTotal: number; count: number }>();
        stuMarks.forEach(m => {
          const existing = subjectMap.get(m.subject);
          if (existing) {
            existing.total    += m.marksObtained;
            existing.maxTotal += m.maxMarks;
            existing.count    += 1;
          } else {
            subjectMap.set(m.subject, { total: m.marksObtained, maxTotal: m.maxMarks, count: 1 });
          }
        });
        const subjects = Array.from(subjectMap.entries()).map(([name, d]) => ({
          name,
          marks:    Math.round(d.total / d.count),
          maxMarks: Math.round(d.maxTotal / d.count),
        }));

        return {
          id:               student.id,
          name:             student.name,
          rollNo:           student.rollNo ?? student.applicationNo ?? "—",
          class:            student.class,
          board:            student.board,
          subjects,
          attendanceDays:   presentDays,
          totalWorkingDays,
        };
      });
  }, [students, attendanceRecords, markRecords, filters.class, filters.board, totalWorkingDays]);

  // Summary stats
  const totalStudents  = data.length;
  const avgMarks       = totalStudents ? Math.round(data.reduce((s, r) => s + getAvgMarks(r.subjects), 0) / totalStudents) : 0;
  const avgAttendance  = totalStudents ? Math.round(data.reduce((s, r) => s + getAttendancePct(r), 0) / totalStudents) : 0;
  const passCount      = data.filter(r => r.subjects.length > 0 && getAvgMarks(r.subjects) >= 50).length;
  const failCount      = data.filter(r => r.subjects.length > 0 && getAvgMarks(r.subjects) < 50).length;

  const loading = studentsLoading || dataLoading;

  const handleExport = () => {
    const headers = ["Roll No", "Student Name", "Class", "Board", "Subjects & Marks", "Avg %", "Grade", "Attendance Days", "Total Working Days", "Attendance %", "Result"];
    const rows = data.map(r => {
      const avg     = getAvgMarks(r.subjects);
      const attPct  = getAttendancePct(r);
      const grade   = getGrade(avg);
      const passed  = r.subjects.length > 0 && avg >= 50;
      const subjectStr = r.subjects.map(s => `${s.name}:${s.marks}/${s.maxMarks}`).join("; ");
      return [
        r.rollNo, r.name, r.class, r.board,
        `"${subjectStr}"`,
        r.subjects.length > 0 ? `${avg}%` : "—",
        r.subjects.length > 0 ? grade.label : "—",
        r.attendanceDays, r.totalWorkingDays,
        r.totalWorkingDays > 0 ? `${attPct}%` : "—",
        r.subjects.length > 0 ? (passed ? "Pass" : "Fail") : "Pending",
      ];
    });
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-report-${filters.month}-${filters.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${data.length} records exported as CSV.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <div className="print-hide"><SharedHeader title="Monthly Report" /></div>

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
        {/* Breadcrumb */}
        <div className="print-hide flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/academics" className="hover:text-[#0D7C8F]">Academics</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Monthly Report</span>
        </div>

        <div className="print-hide flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Monthly Academic Report</h2>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExport} disabled={loading || data.length === 0}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="print-hide border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Month</Label>
                <Select value={filters.month} onValueChange={v => setFilters(f => ({ ...f, month: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Year</Label>
                <Select value={filters.year} onValueChange={v => setFilters(f => ({ ...f, year: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Class</Label>
                <Select value={filters.class} onValueChange={v => setFilters(f => ({ ...f, class: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Board</Label>
                <Select value={filters.board} onValueChange={v => setFilters(f => ({ ...f, board: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Printable region ── */}
        <div className="print-area space-y-6">

        {/* Print-only title */}
        <div className="print-only-block text-center mb-4">
          <h1 className="text-xl font-bold text-[#1E2A4A]">Monthly Academic Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filters.month} {filters.year}
            {filters.class !== "All" && ` · ${filters.class}`}
            {filters.board !== "All" && ` · ${filters.board}`}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Students",  value: totalStudents,                       icon: Users,        bg: "bg-blue-100",   ic: "text-blue-600"   },
            { label: "Avg. Marks",       value: `${avgMarks}%`,                      icon: TrendingUp,   bg: "bg-emerald-100",ic: "text-emerald-600"},
            { label: "Avg. Attendance",  value: `${avgAttendance}%`,                 icon: CheckCircle,  bg: "bg-teal-100",   ic: "text-teal-600"   },
            { label: "Pass / Fail",      value: `${passCount} / ${failCount}`,       icon: AlertCircle,  bg: "bg-amber-100",  ic: "text-amber-600"  },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${c.ic}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-2xl font-bold text-[#1E2A4A]">{loading ? "—" : c.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Period label — screen only (print title already has this) */}
        <div className="print-hide text-sm font-medium text-muted-foreground">
          Showing report for <span className="text-foreground font-semibold">{filters.month} {filters.year}</span>
          {filters.class !== "All" && <> · {filters.class}</>}
          {filters.board !== "All" && <> · {filters.board}</>}
        </div>

        {/* Main Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">Student Performance — {loading ? "…" : data.length}</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="min-w-[50px]">Roll</TableHead>
                    <TableHead className="min-w-[160px]">Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Board</TableHead>
                    <TableHead>Subjects & Marks</TableHead>
                    <TableHead className="text-center">Avg %</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Attendance</TableHead>
                    <TableHead className="text-center">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? data.map(record => {
                    const avg     = getAvgMarks(record.subjects);
                    const attPct  = getAttendancePct(record);
                    const grade   = getGrade(avg);
                    const passed  = record.subjects.length > 0 && avg >= 50;
                    const hasMarks = record.subjects.length > 0;
                    return (
                      <TableRow key={record.id} className="hover:bg-slate-50/50 align-top">
                        <TableCell className="font-medium text-muted-foreground">{record.rollNo}</TableCell>
                        <TableCell className="font-semibold text-[#1E2A4A]">{record.name}</TableCell>
                        <TableCell>{record.class || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{record.board || "—"}</Badge></TableCell>
                        <TableCell>
                          {hasMarks ? (
                            <div className="flex flex-wrap gap-1.5">
                              {record.subjects.map(sub => (
                                <span key={sub.name} className="text-xs bg-slate-100 rounded px-2 py-0.5">
                                  {sub.name}: <span className="font-semibold">{sub.marks}/{sub.maxMarks}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No marks recorded</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold text-[#1E2A4A]">
                          {hasMarks ? `${avg}%` : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasMarks ? (
                            <Badge className={`${grade.color} hover:${grade.color}`}>{grade.label}</Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {record.totalWorkingDays > 0 ? (
                            <>
                              <div className="text-sm font-medium">{attPct}%</div>
                              <div className="text-xs text-muted-foreground">{record.attendanceDays}/{record.totalWorkingDays} days</div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasMarks ? (
                            <Badge className={passed ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>
                              {passed ? "Pass" : "Fail"}
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                        No students found for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        </div>{/* end print-area */}
      </main>
    </div>
  );
}
