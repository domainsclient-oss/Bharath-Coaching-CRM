
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Search, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Filter,
  Save,
  Edit2,
  Check,
  X,
  MessageSquare
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { mockStudents } from "@/data/studentsData";
import { mockClasses } from "@/data/academicsData";
import { mockAttendanceRecords, AttendanceRecord } from "@/data/attendanceData";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function StudentAttendancePage() {
  useAuth();
  const { currentBranch } = useBranch();
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClassId, setSelectedClassId] = useState("C001");
  const [selectedMode, setSelectedMode] = useState("All");
  
  // State
  const [isMarking, setIsMarking] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; notes: string }>>({});
  const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);

  const selectedClass = useMemo(() => {
    return mockClasses.find(c => c.id === selectedClassId);
  }, [selectedClassId]);

  const studentsInClass = useMemo(() => {
    return mockStudents.filter(s => 
      s.branchId === currentBranch && 
      s.class === selectedClass?.name.split(' ')[1] &&
      (selectedMode === "All" || s.mode === selectedMode)
    );
  }, [currentBranch, selectedClass, selectedMode]);

  // Load existing attendance or initialize new
  useEffect(() => {
    const existing = mockAttendanceRecords.filter(r => 
      r.date === selectedDate && 
      r.branchId === currentBranch &&
      r.entityType === "student"
    );

    if (existing.length > 0) {
      const map: Record<string, { status: string; notes: string }> = {};
      existing.forEach(r => {
        if (r.entityId) map[r.entityId] = { status: r.status, notes: r.notes || "" };
      });
      setAttendanceMap(map);
      setIsAlreadyMarked(true);
      setIsMarking(false);
    } else {
      const map: Record<string, { status: string; notes: string }> = {};
      studentsInClass.forEach(s => {
        map[s.id] = { status: "Present", notes: "" };
      });
      setAttendanceMap(map);
      setIsAlreadyMarked(false);
      setIsMarking(true);
    }
  }, [selectedDate, selectedClassId, studentsInClass, currentBranch]);

  const updateStatus = (studentId: string, status: string) => {
    if (!isMarking && isAlreadyMarked) return;
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const updateNotes = (studentId: string, notes: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes }
    }));
  };

  const handleBulkMark = (status: string) => {
    const newMap = { ...attendanceMap };
    studentsInClass.forEach(s => {
      newMap[s.id] = { ...newMap[s.id], status };
    });
    setAttendanceMap(newMap);
  };

  const handleSubmit = () => {
    toast({
      title: "Attendance Submitted",
      description: `Attendance for ${selectedClass?.name} on ${selectedDate} has been saved.`,
    });
    setIsAlreadyMarked(true);
    setIsMarking(false);
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Student Attendance" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs */}
        <div className="flex items-center text-xs text-muted-foreground gap-2 mb-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Attendance</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Students</span>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    className="pl-10" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClasses.filter(c => c.branchId === currentBranch).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.board})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Mode</Label>
                <Select value={selectedMode} onValueChange={setSelectedMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Modes</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-[#1E2A4A] gap-2">
                <Filter className="h-4 w-4" /> Load Students
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Sheet */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="space-y-0.5">
                <CardTitle className="text-lg font-bold text-[#1E2A4A]">
                  {selectedClass?.name} — {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {selectedClass?.board}
                  </Badge>
                  {isAlreadyMarked ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Already Marked
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                      <Clock className="h-3 w-3" /> Not Marked Yet
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {isMarking && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-green-600 border-green-200 hover:bg-green-50 gap-1"
                  onClick={() => handleBulkMark("Present")}
                >
                  <Check className="h-3.5 w-3.5" /> Mark All Present
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                  onClick={() => handleBulkMark("Absent")}
                >
                  <X className="h-3.5 w-3.5" /> Mark All Absent
                </Button>
              </div>
            )}

            {!isMarking && isAlreadyMarked && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setIsMarking(true)}
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Attendance
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead className="text-center w-[300px]">Attendance Status</TableHead>
                  <TableHead className="text-right w-20">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsInClass.length > 0 ? (
                  studentsInClass.map((student, idx) => (
                    <TableRow key={student.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-center text-muted-foreground font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border">
                            <AvatarImage src={student.photo} />
                            <AvatarFallback className="bg-[#0D7C8F]/10 text-[#0D7C8F] text-[10px] font-bold">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#1E2A4A]">{student.name}</span>
                            <span className="text-[10px] text-muted-foreground">{student.mode}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs text-[#1E2A4A]">{student.rollNo}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={!isMarking}
                            onClick={() => updateStatus(student.id, "Present")}
                            className={cn(
                              "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border",
                              attendanceMap[student.id]?.status === "Present" 
                                ? "bg-green-600 text-white border-green-600 shadow-sm" 
                                : "bg-white text-slate-500 border-slate-200 hover:border-green-200",
                              !isMarking && "cursor-default opacity-80"
                            )}
                          >
                            Present
                          </button>
                          <button
                            disabled={!isMarking}
                            onClick={() => updateStatus(student.id, "Absent")}
                            className={cn(
                              "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border",
                              attendanceMap[student.id]?.status === "Absent" 
                                ? "bg-red-600 text-white border-red-600 shadow-sm" 
                                : "bg-white text-slate-500 border-slate-200 hover:border-red-200",
                              !isMarking && "cursor-default opacity-80"
                            )}
                          >
                            Absent
                          </button>
                          <button
                            disabled={!isMarking}
                            onClick={() => updateStatus(student.id, "Leave")}
                            className={cn(
                              "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border",
                              attendanceMap[student.id]?.status === "Leave" 
                                ? "bg-amber-500 text-white border-amber-500 shadow-sm" 
                                : "bg-white text-slate-500 border-slate-200 hover:border-amber-200",
                              !isMarking && "cursor-default opacity-80"
                            )}
                          >
                            Leave
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className={cn(
                              "h-8 w-8",
                              attendanceMap[student.id]?.notes ? "text-[#0D7C8F]" : "text-slate-300"
                            )}>
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <h4 className="font-bold text-sm leading-none">Absence Note</h4>
                                <p className="text-xs text-muted-foreground">Add a reason for the student's absence.</p>
                              </div>
                              <Textarea 
                                placeholder="Type reason here..." 
                                className="h-20 text-xs" 
                                value={attendanceMap[student.id]?.notes || ""}
                                onChange={(e) => updateNotes(student.id, e.target.value)}
                                disabled={!isMarking}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No students found for this class and branch.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {isMarking && (
              <div className="p-6 bg-slate-50 border-t flex justify-end">
                <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A] gap-2 px-8" onClick={handleSubmit}>
                  <Save className="h-4 w-4" /> Submit Attendance
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
