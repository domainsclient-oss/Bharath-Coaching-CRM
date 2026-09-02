"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight, Save, Check, X, Clock, ExternalLink,
  Video, Users, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { getSessionStatus } from "@/lib/sessionStatus";
import { useNow } from "@/hooks/use-now";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AttendanceStatus = "Joined" | "Absent" | "Late";

interface SessionAttendance {
  studentId: string;
  status: AttendanceStatus;
  joinTime?: string;
}

interface OnlineClassDoc {
  id: string;
  title: string;
  class: string;
  subject: string;
  teacherName?: string;
  date: string;
  time: string;
  duration?: number;
  meetLink?: string;
  status: "Scheduled" | "Live" | "Ended";
  branchId: string;
}

interface StudentDoc {
  id: string;
  name: string;
  rollNo?: string;
  class?: string;
  mode?: string;
  status?: string;
  photo?: string;
  branchId: string;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function StatusBadge({ status }: { status: OnlineClassDoc["status"] }) {
  if (status === "Live") return (
    <Badge className="bg-red-600 animate-pulse gap-1.5 flex w-fit items-center text-xs">
      <span className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE NOW
    </Badge>
  );
  if (status === "Scheduled") return (
    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs">Scheduled</Badge>
  );
  return (
    <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-xs">Ended</Badge>
  );
}

export default function OnlineClassAttendancePage() {
  const { currentBranch } = useBranch();

  const { data: allSessions } = useFirestoreCollection<OnlineClassDoc>("onlineClasses", currentBranch);
  const now = useNow(30_000);
  const { data: allStudents } = useFirestoreCollection<StudentDoc>("students", currentBranch);

  const sessions = useMemo(() => allSessions, [allSessions]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, SessionAttendance>>({});
  const [saved, setSaved] = useState(false);

  // Auto-select first session when data loads
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  const selectedSession = useMemo(() =>
    sessions.find(s => s.id === selectedSessionId),
    [sessions, selectedSessionId]
  );

  const enrolledStudents = useMemo(() => {
    if (!selectedSession) return [];
    return allStudents.filter(s =>
      s.class === selectedSession.class &&
      s.status === "Active"
    );
  }, [selectedSession, allStudents]);

  useEffect(() => {
    const map: Record<string, SessionAttendance> = {};
    enrolledStudents.forEach(s => {
      map[s.id] = { studentId: s.id, status: "Joined" };
    });
    setAttendanceMap(map);
    setSaved(false);
  }, [selectedSessionId, enrolledStudents]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const map = { ...attendanceMap };
    enrolledStudents.forEach(s => { map[s.id] = { studentId: s.id, status }; });
    setAttendanceMap(map);
  };

  const handleSave = () => {
    setSaved(true);
    toast({
      title: "Attendance Saved",
      description: `Attendance for "${selectedSession?.title}" has been recorded.`,
    });
  };

  const joinedCount = Object.values(attendanceMap).filter(a => a.status === "Joined").length;
  const absentCount = Object.values(attendanceMap).filter(a => a.status === "Absent").length;
  const lateCount   = Object.values(attendanceMap).filter(a => a.status === "Late").length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Online Class Attendance" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/online-classes" className="hover:text-[#0D7C8F]">Online Classes</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Students Attendance</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Online Class Attendance</h2>

        {/* Session Selector */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Select Session</Label>
                <Select value={selectedSessionId} onValueChange={v => { setSelectedSessionId(v); setSaved(false); }}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose a session..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.length === 0 ? (
                      <SelectItem value="_none" disabled>No sessions found</SelectItem>
                    ) : (
                      sessions.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <span>{s.title}</span>
                            <span className="text-muted-foreground text-xs">· {s.date} · {s.class}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selectedSession && (
                <Button
                  variant="outline"
                  className="gap-2 h-11"
                  onClick={() => window.open(selectedSession.meetLink, "_blank")}
                  disabled={getSessionStatus(selectedSession, now) === "Ended" || !selectedSession.meetLink}
                >
                  <ExternalLink className="h-4 w-4" /> Open Meet Link
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedSession && (
          <>
            {/* Session Info */}
            <Card className="border-none shadow-sm bg-gradient-to-r from-[#1E2A4A] to-[#0D7C8F] text-white">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-tight">{selectedSession.title}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-white/70 text-xs">
                        <span>{selectedSession.class}</span>
                        <span>·</span>
                        <span>{selectedSession.subject}</span>
                        <span>·</span>
                        <span>{selectedSession.teacherName}</span>
                        <span>·</span>
                        <span>{selectedSession.date} @ {selectedSession.time}</span>
                        <span>·</span>
                        <span>{selectedSession.duration} mins</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={getSessionStatus(selectedSession, now)} />
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="text-2xl font-bold text-[#1E2A4A]">{joinedCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Late</p>
                    <p className="text-2xl font-bold text-[#1E2A4A]">{lateCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold text-[#1E2A4A]">{absentCount}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Table */}
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-3 px-6">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">
                    {enrolledStudents.length} Students · {selectedSession.class}
                  </CardTitle>
                  {saved && (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Saved
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-600 gap-1 h-8"
                    onClick={() => markAll("Joined")}
                  >
                    <Check className="h-3.5 w-3.5" /> All Joined
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600 gap-1 h-8"
                    onClick={() => markAll("Absent")}
                  >
                    <X className="h-3.5 w-3.5" /> All Absent
                  </Button>
                </div>
              </CardHeader>

              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-center w-[280px]">Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.length > 0 ? (
                    enrolledStudents.map((student, idx) => {
                      const current = attendanceMap[student.id]?.status ?? "Joined";
                      return (
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
                              <span className="font-semibold text-sm text-[#1E2A4A]">{student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium text-muted-foreground">{student.rollNo || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{student.mode || "—"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              {(["Joined", "Late", "Absent"] as AttendanceStatus[]).map(status => (
                                <button
                                  key={status}
                                  onClick={() => setStatus(student.id, status)}
                                  className={cn(
                                    "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border",
                                    current === status && status === "Joined" && "bg-green-600 text-white border-green-600 shadow-sm",
                                    current === status && status === "Late" && "bg-amber-500 text-white border-amber-500 shadow-sm",
                                    current === status && status === "Absent" && "bg-red-600 text-white border-red-600 shadow-sm",
                                    current !== status && "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                                  )}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 opacity-20" />
                          <p>No active students found for {selectedSession.class}.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {enrolledStudents.length > 0 && (
                <div className="p-4 bg-slate-50 border-t flex justify-end">
                  <Button
                    className="bg-[#0D7C8F] hover:bg-[#1E2A4A] gap-2 px-8"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4" /> Save Attendance
                  </Button>
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
