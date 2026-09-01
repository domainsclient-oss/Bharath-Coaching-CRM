"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight, Calendar as CalendarIcon, CheckCircle2, XCircle,
  Clock, Filter, Save, Edit2, Check, X, MessageSquare, Users,
  AlertCircle,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { db } from "@/config/firebase";
import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore";

type AttendanceStatus = "Present" | "Absent" | "Half-Day" | "Leave";

interface Student {
  id: string;
  name: string;
  class: string;
  board: string;
  mode: string;
  rollNo?: string;
  photo?: string;
  status: string;
  branchId: string;
}

interface ClassDoc {
  id: string;
  name: string;
  board: string;
  branchId: string;
}

const STATUS_OPTIONS: { label: string; value: AttendanceStatus; active: string; border: string }[] = [
  { label: "Present",  value: "Present",  active: "bg-green-600 text-white border-green-600",  border: "hover:border-green-300" },
  { label: "Absent",   value: "Absent",   active: "bg-red-600 text-white border-red-600",       border: "hover:border-red-300" },
  { label: "Half-Day", value: "Half-Day", active: "bg-blue-500 text-white border-blue-500",     border: "hover:border-blue-300" },
  { label: "Leave",    value: "Leave",    active: "bg-amber-500 text-white border-amber-500",   border: "hover:border-amber-300" },
];

const today = new Date().toISOString().split("T")[0];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function StudentAttendancePage() {
  const { currentBranch } = useBranch();

  const { data: allStudents, loading: studentsLoading } = useFirestoreCollection<Student>("students", currentBranch);
  const { data: classes,     loading: classesLoading  } = useFirestoreCollection<ClassDoc>("classes", currentBranch);

  const [selectedDate,    setSelectedDate]    = useState(today);
  const [selectedClass,   setSelectedClass]   = useState("");
  const [selectedMode,    setSelectedMode]    = useState("All");
  const [loaded,          setLoaded]          = useState(false);
  const [isMarking,       setIsMarking]       = useState(false);
  const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);
  const [attendanceMap,   setAttendanceMap]   = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [saving,          setSaving]          = useState(false);

  const selectedClassDoc = useMemo(() => classes.find(c => c.id === selectedClass) ?? null, [classes, selectedClass]);

  // Extract class number from class doc name e.g. "Class 10" → "10"
  const classNumber = useMemo(() => {
    if (!selectedClassDoc) return "";
    return selectedClassDoc.name.replace(/class\s*/i, "").trim();
  }, [selectedClassDoc]);

  const studentsInClass = useMemo(() => {
    if (!classNumber) return [];
    return allStudents.filter(s =>
      s.status === "Active" &&
      s.class === classNumber &&
      (selectedMode === "All" || s.mode === selectedMode)
    );
  }, [allStudents, classNumber, selectedMode]);

  // Auto-select first class
  useEffect(() => {
    if (!selectedClass && classes.length > 0) setSelectedClass(classes[0].id);
  }, [classes, selectedClass]);

  const loadAttendance = useCallback(async () => {
    if (!selectedClass || !currentBranch || studentsInClass.length === 0) {
      const map: Record<string, { status: AttendanceStatus; notes: string }> = {};
      studentsInClass.forEach(s => { map[s.id] = { status: "Present", notes: "" }; });
      setAttendanceMap(map);
      setIsAlreadyMarked(false);
      setIsMarking(true);
      setLoaded(true);
      return;
    }

    try {
      const q = query(
        collection(db, "studentAttendance"),
        where("branchId", "==", currentBranch),
        where("date", "==", selectedDate),
        where("classId", "==", selectedClass),
      );
      const snap = await getDocs(q);

      const map: Record<string, { status: AttendanceStatus; notes: string }> = {};
      studentsInClass.forEach(s => { map[s.id] = { status: "Present", notes: "" }; });

      if (!snap.empty) {
        snap.docs.forEach(d => {
          const data = d.data();
          map[data.studentId] = { status: data.status as AttendanceStatus, notes: data.notes ?? "" };
        });
        setIsAlreadyMarked(true);
        setIsMarking(false);
      } else {
        setIsAlreadyMarked(false);
        setIsMarking(true);
      }
      setAttendanceMap(map);
    } catch (err) {
      console.error("Failed to load attendance:", err);
      toast({ title: "Error", description: "Could not load attendance.", variant: "destructive" });
    }
    setLoaded(true);
  }, [selectedClass, selectedDate, currentBranch, studentsInClass]);

  const updateStatus = (id: string, status: AttendanceStatus) => {
    if (!isMarking) return;
    setAttendanceMap(prev => ({ ...prev, [id]: { ...prev[id], status } }));
  };

  const updateNotes = (id: string, notes: string) => {
    setAttendanceMap(prev => ({ ...prev, [id]: { ...prev[id], notes } }));
  };

  const handleBulkMark = (status: AttendanceStatus) => {
    const map = { ...attendanceMap };
    studentsInClass.forEach(s => { map[s.id] = { ...map[s.id], status }; });
    setAttendanceMap(map);
  };

  const handleSubmit = async () => {
    if (!currentBranch || studentsInClass.length === 0) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      studentsInClass.forEach(student => {
        const entry = attendanceMap[student.id] ?? { status: "Present" as AttendanceStatus, notes: "" };
        const docId = `${currentBranch}_${selectedDate}_${student.id}`;
        const docRef = doc(db, "studentAttendance", docId);
        batch.set(docRef, {
          branchId:    currentBranch,
          date:        selectedDate,
          studentId:   student.id,
          studentName: student.name,
          classId:     selectedClass,
          className:   selectedClassDoc?.name ?? "",
          status:      entry.status,
          notes:       entry.notes,
        });
      });
      await batch.commit();
      toast({ title: "Attendance Saved", description: `${selectedClassDoc?.name} — ${selectedDate} — ${studentsInClass.length} students.` });
      setIsAlreadyMarked(true);
      setIsMarking(false);
    } catch (err) {
      console.error("Failed to save attendance:", err);
      toast({ title: "Error", description: "Could not save attendance.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => {
    const vals = studentsInClass.map(s => attendanceMap[s.id]?.status ?? "Present");
    return {
      total:   studentsInClass.length,
      present: vals.filter(v => v === "Present").length,
      absent:  vals.filter(v => v === "Absent").length,
      halfDay: vals.filter(v => v === "Half-Day").length,
      leave:   vals.filter(v => v === "Leave").length,
    };
  }, [studentsInClass, attendanceMap]);

  const attendancePct = counts.total > 0
    ? Math.round(((counts.present + counts.halfDay * 0.5) / counts.total) * 100)
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Student Attendance" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/attendance" className="hover:text-[#0D7C8F]">Attendance</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Students</span>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="date" className="pl-10" value={selectedDate} max={today}
                    onChange={e => { setSelectedDate(e.target.value); setLoaded(false); }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Class</Label>
                <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setLoaded(false); }}
                  disabled={classesLoading}>
                  <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.board})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Mode</Label>
                <Select value={selectedMode} onValueChange={v => { setSelectedMode(v); setLoaded(false); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Modes</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={loadAttendance}
                disabled={!selectedClass || studentsLoading}>
                <Filter className="h-4 w-4" /> Load Students
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {loaded && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total",    value: counts.total,   color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: Users        },
              { label: "Present",  value: counts.present, color: "text-green-600", bg: "bg-green-100", icon: CheckCircle2 },
              { label: "Absent",   value: counts.absent,  color: "text-red-500",   bg: "bg-red-100",   icon: XCircle      },
              { label: "Half-Day", value: counts.halfDay, color: "text-blue-600",  bg: "bg-blue-100",  icon: Clock        },
              { label: "Leave",    value: counts.leave,   color: "text-amber-600", bg: "bg-amber-100", icon: AlertCircle  },
            ].map(c => {
              const Icon = c.icon;
              return (
                <Card key={c.label} className="border-none shadow-sm">
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${c.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{c.label}</p>
                      <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Attendance Sheet */}
        {!loaded ? (
          <Card className="border-none shadow-sm">
            <CardContent className="h-40 flex items-center justify-center text-muted-foreground gap-2">
              <Filter className="h-5 w-5 opacity-40" />
              Select a date, class and click &quot;Load Students&quot; to begin.
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-3 px-6 flex-wrap gap-3">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold text-[#1E2A4A]">
                  {selectedClassDoc?.name} — {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">{selectedClassDoc?.board}</Badge>
                  <Badge variant="outline" className="text-[10px]">{selectedMode === "All" ? "All Modes" : selectedMode}</Badge>
                  {isAlreadyMarked ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Already Marked
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs gap-1">
                      <Clock className="h-3 w-3" /> Not Marked Yet
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMarking && (
                  <>
                    <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 gap-1" onClick={() => handleBulkMark("Present")}>
                      <Check className="h-3.5 w-3.5" /> All Present
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600 gap-1" onClick={() => handleBulkMark("Absent")}>
                      <X className="h-3.5 w-3.5" /> All Absent
                    </Button>
                  </>
                )}
                {!isMarking && isAlreadyMarked && (
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsMarking(true)}>
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                )}
              </div>
            </CardHeader>

            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="w-24">Roll No</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-12 text-right">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsInClass.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No active students found for {selectedClassDoc?.name}.
                    </TableCell>
                  </TableRow>
                ) : studentsInClass.map((student, idx) => {
                  const entry = attendanceMap[student.id] ?? { status: "Present" as AttendanceStatus, notes: "" };
                  return (
                    <TableRow key={student.id} className={cn("hover:bg-slate-50/50", entry.status === "Absent" && "bg-red-50/30")}>
                      <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 border flex-shrink-0">
                            <AvatarImage src={student.photo} />
                            <AvatarFallback className="bg-[#0D7C8F]/10 text-[#0D7C8F] text-[10px] font-bold">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-[#1E2A4A] leading-tight">{student.name}</p>
                            <p className="text-[10px] text-muted-foreground">{student.mode} · {student.board}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{student.rollNo ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          {STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              disabled={!isMarking}
                              onClick={() => updateStatus(student.id, opt.value)}
                              className={cn(
                                "flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all border whitespace-nowrap",
                                entry.status === opt.value ? opt.active : `bg-white text-slate-400 border-slate-200 ${opt.border}`,
                                !isMarking && "cursor-default opacity-75",
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon"
                              className={cn("h-8 w-8", entry.notes ? "text-[#0D7C8F]" : "text-slate-300")}>
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-3">
                            <p className="text-xs font-bold mb-2">Note for {student.name}</p>
                            <Textarea rows={3} placeholder="Enter reason or note..." className="text-xs resize-none"
                              value={entry.notes} onChange={e => updateNotes(student.id, e.target.value)}
                              disabled={!isMarking} />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="bg-slate-50 border-t px-6 py-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-5 text-xs">
                <span>Present: <strong className="text-green-600">{counts.present}</strong></span>
                <span>Absent: <strong className="text-red-500">{counts.absent}</strong></span>
                <span>Half-Day: <strong className="text-blue-600">{counts.halfDay}</strong></span>
                <span>Leave: <strong className="text-amber-600">{counts.leave}</strong></span>
                <span className="font-semibold text-[#0D7C8F]">Attendance: {attendancePct}%</span>
              </div>
              {isMarking && (
                <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A] gap-2" onClick={handleSubmit} disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Attendance"}
                </Button>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
