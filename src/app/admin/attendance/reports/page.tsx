
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Search, 
  Calendar as CalendarIcon, 
  Printer, 
  Filter,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockStudents } from "@/data/studentsData";
import { mockStaff } from "@/data/hrData";
import { mockClasses } from "@/data/academicsData";
import { mockAttendanceRecords } from "@/data/attendanceData";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export default function AttendanceReportsPage() {
  const { currentBranch } = useAuth();
  
  // State for Student Reports
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("C001");
  const [studentMonth, setStudentMonth] = useState("2025-03");

  // State for Staff Reports
  const [selectedStaffId, setSelectedStaffId] = useState<string>("STF001");
  const [staffMonth, setStaffMonth] = useState("2025-03");

  // Derived Data: Students in branch
  const students = useMemo(() => {
    return mockStudents.filter(s => s.branchId === currentBranch);
  }, [currentBranch]);

  // Derived Data: Staff in branch
  const staffMembers = useMemo(() => {
    return mockStaff.filter(s => s.branchId === currentBranch);
  }, [currentBranch]);

  // Aggregate Student Report Data
  const studentReport = useMemo(() => {
    if (!selectedStudentId) return null;
    
    const student = students.find(s => s.id === selectedStudentId);
    const records = mockAttendanceRecords.filter(r => 
      r.entityId === selectedStudentId && 
      r.date.startsWith(studentMonth)
    );

    const summary = {
      present: records.filter(r => r.status === "Present").length,
      absent: records.filter(r => r.status === "Absent").length,
      leave: records.filter(r => r.status === "Leave").length,
      total: records.length,
      percent: records.length > 0 ? Math.round((records.filter(r => r.status === "Present").length / records.length) * 100) : 0
    };

    return { student, records, summary };
  }, [selectedStudentId, studentMonth, students]);

  // Aggregate Staff Report Data
  const staffReport = useMemo(() => {
    const staff = staffMembers.find(s => s.id === selectedStaffId);
    const records = mockAttendanceRecords.filter(r => 
      r.entityId === selectedStaffId && 
      r.date.startsWith(staffMonth)
    );

    const summary = {
      workingDays: records.length,
      present: records.filter(r => r.status === "Present").length,
      absent: records.filter(r => r.status === "Absent").length,
      leave: records.filter(r => r.status === "Leave").length,
      halfDay: records.filter(r => r.status === "Half-Day").length,
    };

    return { staff, records, summary };
  }, [selectedStaffId, staffMonth, staffMembers]);

  const handlePrint = () => {
    window.print();
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Attendance Reports" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 print:bg-white print:p-0">
        {/* Breadcrumbs */}
        <div className="flex items-center text-xs text-muted-foreground gap-2 mb-2 print:hidden">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Attendance Reports</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Attendance Analytics</h2>
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print Report
          </Button>
        </div>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="bg-white border p-1 h-12 w-full max-w-md grid grid-cols-2 mb-6 print:hidden">
            <TabsTrigger value="students" className="data-[state=active]:bg-[#1E2A4A] data-[state=active]:text-white font-bold">
              Student Reports
            </TabsTrigger>
            <TabsTrigger value="staff" className="data-[state=active]:bg-[#1E2A4A] data-[state=active]:text-white font-bold">
              Staff Reports
            </TabsTrigger>
          </TabsList>

          {/* STUDENT REPORTS TAB */}
          <TabsContent value="students" className="space-y-6 outline-none">
            <Card className="border-none shadow-sm print:hidden">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Search Student</Label>
                    <Select value={selectedStudentId || ""} onValueChange={setSelectedStudentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} ({s.rollNo})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Class Filter</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockClasses.filter(c => c.branchId === currentBranch).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Month</Label>
                    <Input 
                      type="month" 
                      value={studentMonth} 
                      onChange={(e) => setStudentMonth(e.target.value)} 
                    />
                  </div>
                  <Button className="bg-[#1E2A4A] gap-2">
                    <Filter className="h-4 w-4" /> Load Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {studentReport ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-none shadow-sm border-l-4 border-green-600 bg-white">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Present Days</p>
                      <h3 className="text-2xl font-bold text-green-600 mt-1">{studentReport.summary.present}</h3>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm border-l-4 border-red-500 bg-white">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Absent Days</p>
                      <h3 className="text-2xl font-bold text-red-600 mt-1">{studentReport.summary.absent}</h3>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm border-l-4 border-amber-500 bg-white">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">On Leave</p>
                      <h3 className="text-2xl font-bold text-amber-600 mt-1">{studentReport.summary.leave}</h3>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm border-l-4 border-[#0D7C8F] bg-[#0D7C8F] text-white">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-bold text-white/70 uppercase">Attendance %</p>
                      <h3 className="text-2xl font-bold text-white mt-1">{studentReport.summary.percent}%</h3>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2 border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-[#0D7C8F]" />
                        Monthly Visualization — {new Date(studentMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                      <div className="grid grid-cols-7 gap-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                          <div key={d} className="text-center text-[10px] font-bold text-muted-foreground p-2 uppercase">{d}</div>
                        ))}
                        {Array.from({ length: 31 }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = `${studentMonth}-${day.toString().padStart(2, '0')}`;
                          const record = studentReport.records.find(d => d.date === dateStr);
                          
                          let bg = "bg-slate-50";
                          let color = "text-slate-300";
                          
                          if (record) {
                            if (record.status === "Present") {
                              bg = "bg-green-100 border border-green-200";
                              color = "text-green-700";
                            } else if (record.status === "Absent") {
                              bg = "bg-red-100 border border-red-200";
                              color = "text-red-700";
                            } else if (record.status === "Leave") {
                              bg = "bg-amber-100 border border-amber-200";
                              color = "text-amber-700";
                            }
                          }

                          return (
                            <div key={i} className={cn(
                              "h-14 flex flex-col items-center justify-center rounded-lg font-bold text-sm relative transition-all",
                              bg, color
                            )}>
                              {day}
                              {record && <div className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-current" />}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-8 flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-wider justify-center border-t pt-6">
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-green-500" /> Present</div>
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-red-500" /> Absent</div>
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-amber-500" /> Leave</div>
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-slate-200" /> No Record</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-white overflow-hidden h-fit">
                    <CardHeader className="border-b">
                      <CardTitle className="text-base font-bold">Student Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 text-center space-y-4">
                      <Avatar className="h-24 w-24 mx-auto border-4 border-slate-50 shadow-sm">
                        <AvatarImage src={studentReport.student?.photo} />
                        <AvatarFallback className="bg-[#1E2A4A]/10 text-[#1E2A4A] text-2xl font-bold">
                          {getInitials(studentReport.student?.name || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-lg text-[#1E2A4A]">{studentReport.student?.name}</h4>
                        <p className="text-xs text-muted-foreground font-medium">{studentReport.student?.rollNo} • Class {studentReport.student?.class}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-left">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Board</p>
                          <p className="text-sm font-bold">{studentReport.student?.board}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Mode</p>
                          <p className="text-sm font-bold text-[#0D7C8F]">{studentReport.student?.mode}</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="w-full text-[#0D7C8F] text-xs font-bold" asChild>
                        <Link href={`/admin/students/${studentReport.student?.id}`}>View Full Profile <ChevronRight className="h-3 w-3 ml-1" /></Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="border-dashed border-2 bg-white/50 h-64 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Users className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">Select a student to generate reports</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* STAFF REPORTS TAB */}
          <TabsContent value="staff" className="space-y-6 outline-none">
            <Card className="border-none shadow-sm print:hidden">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Select Faculty / Staff</Label>
                    <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} ({s.staffId})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Month</Label>
                    <Input 
                      type="month" 
                      value={staffMonth} 
                      onChange={(e) => setStaffMonth(e.target.value)} 
                    />
                  </div>
                  <Button className="bg-[#1E2A4A] gap-2">
                    <Filter className="h-4 w-4" /> Load Report
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                        <p className="text-lg font-bold">{staffReport.summary.workingDays}</p>
                      </div>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600">Month</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-green-600">Present</p>
                        <p className="text-lg font-bold text-green-600">{staffReport.summary.present}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-red-600">Absent</p>
                        <p className="text-lg font-bold text-red-600">{staffReport.summary.absent}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-blue-500">Half-Day</p>
                        <p className="text-lg font-bold text-blue-500">{staffReport.summary.halfDay}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-amber-500">Leave</p>
                        <p className="text-lg font-bold text-amber-500">{staffReport.summary.leave}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3">Staff Details</p>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={staffReport.staff?.avatar} />
                          <AvatarFallback className="bg-slate-100 font-bold">{getInitials(staffReport.staff?.name || "")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold">{staffReport.staff?.name}</p>
                          <p className="text-[10px] text-muted-foreground">{staffReport.staff?.role} • {staffReport.staff?.staffId}</p>
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
                      <TableHead>Attendance Status</TableHead>
                      <TableHead>Notes / Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffReport.records.length > 0 ? (
                      staffReport.records.map((record) => {
                        const dateObj = new Date(record.date);
                        const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'long' });
                        
                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium text-xs">
                              {dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{dayName}</TableCell>
                            <TableCell>
                              <Badge className={cn(
                                "text-[10px] font-bold px-2 py-0.5",
                                record.status === "Present" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                                record.status === "Absent" ? "bg-red-100 text-red-700 hover:bg-red-100" :
                                record.status === "Half-Day" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                                "bg-amber-100 text-amber-700 hover:bg-amber-100"
                              )}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground italic">
                              {record.notes || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
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
          </TabsContent>
        </Tabs>
      </main>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
          }
          aside, header, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .card, .card-content {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>
    </div>
  );
}
