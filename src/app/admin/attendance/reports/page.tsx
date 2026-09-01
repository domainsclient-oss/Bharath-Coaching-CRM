"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Calendar as CalendarIcon,
  Printer,
  Filter,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { db } from "@/config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface StudentDoc {
  id: string;
  name: string;
  rollNo?: string;
  applicationNo?: string;
  class: string;
  board: string;
  mode?: string;
  photo?: string;
  status: string;
  branchId: string;
}

interface StaffDoc {
  id: string;
  name: string;
  staffId?: string;
  role?: string;
  avatar?: string;
  branchId: string;
}

interface ClassDoc {
  id: string;
  name: string;
  branchId: string;
}

interface AttendanceRecord {
  date: string;
  status: string;
  notes?: string;
}

const getInitials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

export default function AttendanceReportsPage() {
  const { currentBranch } = useBranch();

  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedClassId,   setSelectedClassId]   = useState<string>("all");
  const [studentMonth,      setStudentMonth]       = useState(currentMonthStr);
  const [selectedStaffId,   setSelectedStaffId]    = useState<string>("");
  const [staffMonth,        setStaffMonth]         = useState(currentMonthStr);

  // ── Firestore collections ─────────────────────────────────────────────────
  const { data: students, loading: studentsLoading } = useFirestoreCollection<StudentDoc>("students", currentBranch);
  const { data: staff,    loading: staffLoading }    = useFirestoreCollection<StaffDoc>("staff",    currentBranch);
  const { data: classes }                            = useFirestoreCollection<ClassDoc>("classes",  currentBranch);

  // ── Attendance records (fetched on demand) ────────────────────────────────
  const [studentRecords,    setStudentRecords]    = useState<AttendanceRecord[]>([]);
  const [staffRecords,      setStaffRecords]      = useState<AttendanceRecord[]>([]);
  const [stuAttLoading,     setStuAttLoading]     = useState(false);
  const [staffAttLoading,   setStaffAttLoading]   = useState(false);

  useEffect(() => {
    if (!selectedStudentId || !currentBranch) { setStudentRecords([]); return; }
    setStuAttLoading(true);
    getDocs(query(
      collection(db, "studentAttendance"),
      where("branchId",  "==", currentBranch),
      where("studentId", "==", selectedStudentId),
    ))
      .then(snap => {
        const start = `${studentMonth}-01`;
        const end   = `${studentMonth}-31`;
        setStudentRecords(
          snap.docs.map(d => d.data() as AttendanceRecord)
            .filter(r => r.date >= start && r.date <= end)
        );
      })
      .catch(console.error)
      .finally(() => setStuAttLoading(false));
  }, [selectedStudentId, studentMonth, currentBranch]);

  useEffect(() => {
    if (!selectedStaffId || !currentBranch) { setStaffRecords([]); return; }
    setStaffAttLoading(true);
    getDocs(query(
      collection(db, "staffAttendance"),
      where("branchId", "==", currentBranch),
      where("staffId",  "==", selectedStaffId),
    ))
      .then(snap => {
        const start = `${staffMonth}-01`;
        const end   = `${staffMonth}-31`;
        setStaffRecords(
          snap.docs.map(d => d.data() as AttendanceRecord)
            .filter(r => r.date >= start && r.date <= end)
        );
      })
      .catch(console.error)
      .finally(() => setStaffAttLoading(false));
  }, [selectedStaffId, staffMonth, currentBranch]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredStudents = useMemo(() =>
    students.filter(s =>
      (s.status === "Active" || s.status === "active") &&
      (selectedClassId === "all" || s.class === selectedClassId)
    ), [students, selectedClassId]);

  const selectedStudent = useMemo(() =>
    students.find(s => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId]);

  const selectedStaff = useMemo(() =>
    staff.find(s => s.id === selectedStaffId) ?? null,
    [staff, selectedStaffId]);

  const studentSummary = useMemo(() => ({
    present:  studentRecords.filter(r => r.status === "Present").length,
    absent:   studentRecords.filter(r => r.status === "Absent").length,
    leave:    studentRecords.filter(r => r.status === "Leave").length,
    halfDay:  studentRecords.filter(r => r.status === "Half-Day").length,
    total:    studentRecords.length,
    percent:  studentRecords.length > 0
      ? Math.round((studentRecords.filter(r => r.status === "Present").length / studentRecords.length) * 100)
      : 0,
  }), [studentRecords]);

  const staffSummary = useMemo(() => ({
    present:  staffRecords.filter(r => r.status === "Present").length,
    absent:   staffRecords.filter(r => r.status === "Absent").length,
    leave:    staffRecords.filter(r => r.status === "Leave").length,
    halfDay:  staffRecords.filter(r => r.status === "Half-Day").length,
    total:    staffRecords.length,
  }), [staffRecords]);

  const classOptions = useMemo(() => {
    const names = Array.from(new Set(students.map(s => s.class).filter(Boolean))).sort();
    return names;
  }, [students]);

  const printedAt = new Date().toLocaleString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      {/* ── Screen-only chrome ── */}
      <div className="print:hidden"><SharedHeader title="Attendance Reports" /></div>

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <div className="flex items-center text-xs text-muted-foreground gap-2 print:hidden">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Attendance Reports</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Attendance Analytics</h2>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print Report
          </Button>
        </div>

        {/* ── Print-only header ── */}
        <div className="att-print-header hidden">
          <div className="att-print-logo">Bharath Academy</div>
          <h1 className="att-print-title">Attendance Analytics Report</h1>
          <p className="att-print-meta">
            {selectedStudent
              ? `Student: ${selectedStudent.name} · ${selectedStudent.class} · ${selectedStudent.board}`
              : selectedStaff
              ? `Staff: ${selectedStaff.name}${selectedStaff.role ? ` · ${selectedStaff.role}` : ""}`
              : ""}
          </p>
          <p className="att-print-meta">
            Period: {selectedStudent
              ? new Date(`${studentMonth}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
              : new Date(`${staffMonth}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            &nbsp;·&nbsp;Generated: {printedAt}
          </p>
          <hr className="att-print-divider" />
        </div>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="bg-transparent p-0 h-auto w-full max-w-md grid grid-cols-2 mb-6 border-b print:hidden">
            <TabsTrigger value="students" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0D7C8F] data-[state=active]:bg-transparent data-[state=active]:text-[#0D7C8F] font-semibold pb-3 text-slate-500">
              Student Reports
            </TabsTrigger>
            <TabsTrigger value="staff" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0D7C8F] data-[state=active]:bg-transparent data-[state=active]:text-[#0D7C8F] font-semibold pb-3 text-slate-500">
              Staff Reports
            </TabsTrigger>
          </TabsList>

          {/* ── STUDENT REPORTS ─────────────────────────────────────────────── */}
          <TabsContent value="students" className="space-y-6 outline-none">
            <Card className="border-none shadow-sm print:hidden">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

                  {/* Class filter */}
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Class Filter</Label>
                    {studentsLoading ? <Skeleton className="h-10 w-full" /> : (
                      <Select value={selectedClassId} onValueChange={v => { setSelectedClassId(v); setSelectedStudentId(""); }}>
                        <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Student select */}
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Search Student</Label>
                    {studentsLoading ? <Skeleton className="h-10 w-full" /> : (
                      <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                        <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                        <SelectContent>
                          {filteredStudents.length === 0
                            ? <SelectItem value="__none__" disabled>No students found</SelectItem>
                            : filteredStudents.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} {s.rollNo ? `(${s.rollNo})` : ""}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Month */}
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Month</Label>
                    <Input type="month" value={studentMonth} onChange={e => setStudentMonth(e.target.value)} />
                  </div>

                  <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" disabled={!selectedStudentId}>
                    <Filter className="h-4 w-4" /> Load Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {stuAttLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : selectedStudent && !stuAttLoading ? (
              <div className="space-y-6">
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Present Days",  value: studentSummary.present,  color: "text-green-600",  border: "border-green-600" },
                    { label: "Absent Days",   value: studentSummary.absent,   color: "text-red-600",    border: "border-red-500" },
                    { label: "On Leave",      value: studentSummary.leave,    color: "text-amber-600",  border: "border-amber-500" },
                    { label: "Attendance %",  value: `${studentSummary.percent}%`, color: "text-white", border: "border-[#0D7C8F]", dark: true },
                  ].map(c => (
                    <Card key={c.label} className={`border-none shadow-sm border-l-4 ${c.border} ${c.dark ? "bg-[#0D7C8F] text-white" : "bg-white"}`}>
                      <CardContent className="pt-6">
                        <p className={`text-[10px] font-bold uppercase ${c.dark ? "text-white/70" : "text-muted-foreground"}`}>{c.label}</p>
                        <h3 className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Calendar grid */}
                  <Card className="md:col-span-2 border-none shadow-sm">
                    <CardHeader className="bg-white border-b">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-[#0D7C8F]" />
                        {new Date(`${studentMonth}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                      <div className="grid grid-cols-7 gap-2">
                        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                          <div key={d} className="text-center text-[10px] font-bold text-muted-foreground p-2 uppercase">{d}</div>
                        ))}
                        {Array.from({ length: 31 }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = `${studentMonth}-${String(day).padStart(2, "0")}`;
                          const record = studentRecords.find(r => r.date === dateStr);
                          const bg = record?.status === "Present"  ? "bg-green-100 border border-green-200" :
                                     record?.status === "Absent"   ? "bg-red-100 border border-red-200" :
                                     record?.status === "Leave"    ? "bg-amber-100 border border-amber-200" :
                                     record?.status === "Half-Day" ? "bg-blue-100 border border-blue-200" :
                                     "bg-slate-50";
                          const color = record?.status === "Present"  ? "text-green-700" :
                                        record?.status === "Absent"   ? "text-red-700" :
                                        record?.status === "Leave"    ? "text-amber-700" :
                                        record?.status === "Half-Day" ? "text-blue-700" :
                                        "text-slate-300";
                          return (
                            <div key={i} className={cn("h-14 flex flex-col items-center justify-center rounded-lg font-bold text-sm relative", bg, color)}>
                              {day}
                              {record && <div className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-current" />}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-8 flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-wider justify-center border-t pt-6">
                        {[
                          { color: "bg-green-500",  label: "Present" },
                          { color: "bg-red-500",    label: "Absent" },
                          { color: "bg-amber-500",  label: "Leave" },
                          { color: "bg-blue-500",   label: "Half-Day" },
                          { color: "bg-slate-200",  label: "No Record" },
                        ].map(l => (
                          <div key={l.label} className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${l.color}`} /> {l.label}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Student profile */}
                  <Card className="border-none shadow-sm bg-white overflow-hidden h-fit">
                    <CardHeader className="border-b">
                      <CardTitle className="text-base font-bold">Student Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 text-center space-y-4">
                      <Avatar className="h-24 w-24 mx-auto border-4 border-slate-50 shadow-sm">
                        <AvatarImage src={selectedStudent.photo} />
                        <AvatarFallback className="bg-[#1E2A4A]/10 text-[#1E2A4A] text-2xl font-bold">
                          {getInitials(selectedStudent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-lg text-[#1E2A4A]">{selectedStudent.name}</h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          {selectedStudent.rollNo ?? selectedStudent.applicationNo} • {selectedStudent.class}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-left">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Board</p>
                          <p className="text-sm font-bold">{selectedStudent.board || "—"}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Mode</p>
                          <p className="text-sm font-bold text-[#0D7C8F]">{selectedStudent.mode || "—"}</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="w-full text-[#0D7C8F] hover:text-white text-xs font-bold print:hidden" asChild>
                        <Link href={`/admin/students/${selectedStudent.id}`}>View Full Profile <ChevronRight className="h-3 w-3 ml-1" /></Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="border-dashed border-2 bg-white/50 h-64 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Users className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">Select a student to generate report</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* ── STAFF REPORTS ────────────────────────────────────────────────── */}
          <TabsContent value="staff" className="space-y-6 outline-none">
            <Card className="border-none shadow-sm print:hidden">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Select Faculty / Staff</Label>
                    {staffLoading ? <Skeleton className="h-10 w-full" /> : (
                      <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                        <SelectTrigger><SelectValue placeholder="Choose Staff" /></SelectTrigger>
                        <SelectContent>
                          {staff.length === 0
                            ? <SelectItem value="__none__" disabled>No staff found</SelectItem>
                            : staff.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}{s.staffId ? ` (${s.staffId})` : ""}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Month</Label>
                    <Input type="month" value={staffMonth} onChange={e => setStaffMonth(e.target.value)} />
                  </div>
                  <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" disabled={!selectedStaffId}>
                    <Filter className="h-4 w-4" /> Load Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {staffAttLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : selectedStaff ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-[#1E2A4A] text-white py-4">
                      <CardTitle className="text-sm font-bold">Summary Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="flex justify-between items-center pb-4 border-b">
                        <div className="space-y-0.5">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Working Days</p>
                          <p className="text-lg font-bold">{staffSummary.total}</p>
                        </div>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">Month</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: "Present",  value: staffSummary.present,  color: "text-green-600" },
                          { label: "Absent",   value: staffSummary.absent,   color: "text-red-600" },
                          { label: "Half-Day", value: staffSummary.halfDay,  color: "text-blue-500" },
                          { label: "Leave",    value: staffSummary.leave,    color: "text-amber-500" },
                        ].map(c => (
                          <div key={c.label} className="space-y-0.5">
                            <p className={`text-[10px] uppercase font-bold ${c.color}`}>{c.label}</p>
                            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3">Staff Details</p>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedStaff.avatar} />
                            <AvatarFallback className="bg-slate-100 font-bold">{getInitials(selectedStaff.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold">{selectedStaff.name}</p>
                            <p className="text-[10px] text-muted-foreground">{selectedStaff.role}{selectedStaff.staffId ? ` • ${selectedStaff.staffId}` : ""}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="lg:col-span-3 border-none shadow-sm overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Day</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes / Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffRecords.length > 0 ? staffRecords.map((record, i) => {
                        const dateObj = new Date(record.date);
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-xs">
                              {dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {dateObj.toLocaleDateString("en-IN", { weekday: "long" })}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(
                                "text-[10px] font-bold px-2 py-0.5",
                                record.status === "Present"  ? "bg-green-100 text-green-700 hover:bg-green-100" :
                                record.status === "Absent"   ? "bg-red-100 text-red-700 hover:bg-red-100" :
                                record.status === "Half-Day" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                                "bg-amber-100 text-amber-700 hover:bg-amber-100"
                              )}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground italic">{record.notes || "—"}</TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                            No attendance records found for this period.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed border-2 bg-white/50 h-64 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Users className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">Select a staff member to generate report</p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <style>{`
        /* ── Print styles ──────────────────────────────────────────────────── */
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.5cm 1.5cm 1.5cm 1.5cm;
          }

          /* Hide all layout chrome */
          body, html { background: white !important; }
          aside, nav, [data-sidebar] { display: none !important; }

          /* Show print header */
          .att-print-header { display: block !important; margin-bottom: 20px; }
          .att-print-logo   { font-size: 11px; font-weight: 700; color: #1E2A4A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .att-print-title  { font-size: 20px; font-weight: 800; color: #1E2A4A; margin: 0 0 6px; }
          .att-print-meta   { font-size: 11px; color: #64748b; margin: 2px 0; }
          .att-print-divider{ border: none; border-top: 2px solid #1E2A4A; margin: 12px 0 20px; }

          /* Remove screen-only spacing */
          main { padding: 0 !important; }

          /* Remove all scrollbars and overflow clipping */
          * {
            overflow: visible !important;
            scrollbar-width: none !important;
          }
          *::-webkit-scrollbar { display: none !important; }

          /* KPI summary cards — print as a row */
          .att-kpi-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 16px !important;
          }
          .att-kpi-card {
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            padding: 10px 12px !important;
            box-shadow: none !important;
          }

          /* Calendar grid — compact */
          .att-calendar-grid {
            display: grid !important;
            grid-template-columns: repeat(7, 1fr) !important;
            gap: 3px !important;
          }
          .att-calendar-cell {
            height: 32px !important;
            font-size: 10px !important;
            border-radius: 4px !important;
          }

          /* Table */
          table { width: 100% !important; border-collapse: collapse !important; font-size: 11px !important; }
          th, td { padding: 6px 8px !important; border: 1px solid #e2e8f0 !important; }
          th { background: #f8fafc !important; font-weight: 700 !important; }

          /* Cards */
          .shadow-sm, [class*="shadow"] { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }

          /* Preserve badge colours */
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>
    </div>
  );
}
