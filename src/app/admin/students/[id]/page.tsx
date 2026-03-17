
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Pencil, 
  Printer, 
  ChevronRight, 
  User, 
  CreditCard, 
  ClipboardCheck, 
  FileText, 
  History,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  IndianRupee,
  MessageSquare
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { mockStudents } from "@/data/studentsData";
import { 
  mockStudentFees, 
  mockStudentAttendance, 
  mockStudentMarks, 
  mockActivityLog 
} from "@/data/studentDetailsData";

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const student = mockStudents.find(s => s.id === id);

  if (!student) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Student not found</h2>
        <Button onClick={() => router.push('/admin/students')} className="mt-4">Back to Students</Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const attendanceData = mockStudentAttendance[student.id] || [];
  const feeRecords = mockStudentFees[student.id] || [];
  const marksData = mockStudentMarks[student.id] || [];
  const activityLogs = mockActivityLog[student.id] || [];

  const totalFees = feeRecords.reduce((acc, curr) => acc + curr.total, 0);
  const collectedFees = feeRecords.reduce((acc, curr) => acc + (curr.total - curr.balance), 0);
  const balanceFees = feeRecords.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Student Profile" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs */}
        <div className="flex items-center text-xs text-muted-foreground gap-2 mb-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/students" className="hover:text-[#0D7C8F]">Students</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">{student.name}</span>
        </div>

        {/* Profile Header */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#1E2A4A] to-[#0D7C8F] p-6 md:p-8 text-white relative">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-white/20 shadow-xl">
                <AvatarImage src={student.photo} />
                <AvatarFallback className="bg-white/10 text-white text-2xl font-bold">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-2xl md:text-3xl font-bold">{student.name}</h1>
                  <div className="flex gap-2 justify-center">
                    <Badge className="bg-green-500/20 text-green-100 border-green-500/30">
                      {student.status}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30">
                      {student.mode}
                    </Badge>
                  </div>
                </div>
                <p className="text-white/70 font-medium">Application No: {student.appNo}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-white/80">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" /> Class {student.class} · {student.board}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {student.branchId} Branch
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" /> {student.school}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
                  <Link href={`/admin/students/${student.id}/edit`}><Pencil className="mr-2 h-4 w-4" /> Edit</Link>
                </Button>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs Container */}
          <Tabs defaultValue="profile" className="w-full">
            <div className="bg-white border-b px-6">
              <TabsList className="h-14 bg-transparent p-0 gap-8">
                {["profile", "fees", "attendance", "marks", "activity"].map((tab) => (
                  <TabsTrigger 
                    key={tab}
                    value={tab} 
                    className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0D7C8F] data-[state=active]:bg-transparent data-[state=active]:text-[#0D7C8F] capitalize px-0 font-bold"
                  >
                    {tab === "activity" ? "Activity Log" : tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <CardContent className="p-6 bg-slate-50/50">
              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <User className="h-4 w-4 text-[#0D7C8F]" /> Personal & Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Full Name</p>
                          <p className="text-sm font-medium">{student.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Date of Birth</p>
                          <p className="text-sm font-medium">15 May 2010</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Parent Name</p>
                          <p className="text-sm font-medium">{student.parentName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Gender</p>
                          <p className="text-sm font-medium">Male</p>
                        </div>
                      </div>
                      <div className="pt-2 space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{student.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                          <span>{student.whatsapp}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{student.name.toLowerCase().replace(' ', '.')}@example.com</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                          <span>No. 42, Green Avenue, Anna Nagar, Trichy - 620001</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-[#0D7C8F]" /> Academic Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">School</p>
                          <p className="text-sm font-medium">{student.school}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Class & Board</p>
                          <p className="text-sm font-medium">{student.class} ({student.board})</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Mode</p>
                          <Badge variant="secondary" className="text-[10px]">{student.mode}</Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Admission Date</p>
                          <p className="text-sm font-medium">{student.admissionDate}</p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Subjects</p>
                        <div className="flex flex-wrap gap-2">
                          {student.subjects.map((sub, i) => (
                            <Badge key={i} className="bg-[#1E2A4A]">{sub}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Documents Collected</p>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> ID Proof
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Report Card
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold">
                            <XCircle className="h-3.5 w-3.5" /> Photo
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Fees Tab */}
              <TabsContent value="fees" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-none shadow-sm border-l-4 border-[#1E2A4A]">
                    <CardContent className="pt-6">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Total Fees</p>
                      <h3 className="text-2xl font-bold text-[#1E2A4A] mt-1">₹{totalFees.toLocaleString()}</h3>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm border-l-4 border-green-600">
                    <CardContent className="pt-6">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Collected</p>
                      <h3 className="text-2xl font-bold text-green-600 mt-1">₹{collectedFees.toLocaleString()}</h3>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm border-l-4 border-red-500">
                    <CardContent className="pt-6">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Balance Due</p>
                      <h3 className="text-2xl font-bold text-red-500 mt-1">₹{balanceFees.toLocaleString()}</h3>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-bold">Payment History</CardTitle>
                    <Button size="sm" className="bg-[#0D7C8F] gap-2">
                      <IndianRupee className="h-4 w-4" /> Collect Fee
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bill No</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Inst-1</TableHead>
                          <TableHead>Inst-2</TableHead>
                          <TableHead>Inst-3</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Next Due</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feeRecords.map((fee) => (
                          <TableRow key={fee.id}>
                            <TableCell className="font-bold text-xs">{fee.billNo}</TableCell>
                            <TableCell className="font-medium">₹{fee.total}</TableCell>
                            <TableCell className="text-green-600 font-medium">₹{fee.inst1}</TableCell>
                            <TableCell className="text-green-600 font-medium">₹{fee.inst2}</TableCell>
                            <TableCell className="text-muted-foreground">₹{fee.inst3}</TableCell>
                            <TableCell className="text-red-600 font-bold">₹{fee.balance}</TableCell>
                            <TableCell className="text-xs font-medium">{fee.nextDue}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="text-[#0D7C8F] h-8">Print</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-8">
                    <Card className="border-none shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-bold">Monthly Calendar</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[10px]">March 2025</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-7 gap-2">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-muted-foreground p-2 uppercase">{d}</div>
                          ))}
                          {Array.from({ length: 31 }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = `2025-03-${day.toString().padStart(2, '0')}`;
                            const record = attendanceData.find(d => d.date === dateStr);
                            let bg = "bg-slate-100";
                            if (record?.status === "Present") bg = "bg-green-100 text-green-700 border border-green-200";
                            if (record?.status === "Absent") bg = "bg-red-100 text-red-700 border border-red-200";
                            if (record?.status === "Leave") bg = "bg-amber-100 text-amber-700 border border-amber-200";
                            if (record?.status === "Holiday") bg = "bg-blue-50 text-blue-400 border border-blue-100";

                            return (
                              <div key={i} className={`h-12 flex items-center justify-center rounded-lg font-bold text-xs ${bg}`}>
                                {day}
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider justify-center">
                          <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-green-500" /> Present</div>
                          <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-red-500" /> Absent</div>
                          <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-amber-500" /> Leave</div>
                          <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-blue-100" /> Holiday</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="md:col-span-4 space-y-4">
                    <Card className="border-none shadow-sm bg-[#0D7C8F] text-white">
                      <CardContent className="pt-6 text-center">
                        <div className="text-4xl font-bold">92%</div>
                        <p className="text-[10px] uppercase font-bold text-white/70 mt-1">Average Attendance</p>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold">March Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Total Working Days</span>
                          <span className="font-bold">24</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Present</span>
                          <span className="font-bold text-green-600">22</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Absent</span>
                          <span className="font-bold text-red-600">1</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Leave</span>
                          <span className="font-bold text-amber-600">1</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Marks Tab */}
              <TabsContent value="marks" className="mt-0 space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b">
                    <CardTitle className="text-lg font-bold">Internal Assessment - Unit Test 1</CardTitle>
                    <Badge className="bg-green-600">Result: PASS</Badge>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Max Marks</TableHead>
                          <TableHead>Obtained</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marksData.map((mark, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-bold">{mark.subject}</TableCell>
                            <TableCell>{mark.maxMarks}</TableCell>
                            <TableCell className="font-bold text-[#0D7C8F]">{mark.obtained}</TableCell>
                            <TableCell>{(mark.obtained / mark.maxMarks * 100).toFixed(1)}%</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-bold">{mark.grade}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-8 p-4 bg-slate-100 rounded-lg flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-muted-foreground uppercase font-bold text-[10px]">Total Score: </span>
                        <span className="font-bold text-lg ml-2">256 / 300</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground uppercase font-bold text-[10px]">Aggregate %: </span>
                        <span className="font-bold text-lg ml-2">85.3%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Log Tab */}
              <TabsContent value="activity" className="mt-0 space-y-6">
                <Card className="border-none shadow-sm">
                  <CardContent className="pt-6">
                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-slate-100 text-slate-400 group-[.is-active]:bg-[#0D7C8F] group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <History className="h-4 w-4" />
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm ml-4 md:ml-0">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                              <div className="font-bold text-slate-900">{log.action}</div>
                              <time className="font-medium text-xs text-muted-foreground whitespace-nowrap">{log.date}</time>
                            </div>
                            <div className="text-xs text-muted-foreground">by {log.by}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}
