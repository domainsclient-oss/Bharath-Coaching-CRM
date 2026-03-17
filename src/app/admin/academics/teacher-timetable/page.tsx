
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Printer, 
  Clock, 
  Calendar,
  User,
  BookOpen,
  MapPin,
  Video
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  mockClasses, 
  mockTimetable, 
  TIME_SLOTS, 
  DAYS 
} from "@/data/academicsData";
import { mockStaff } from "@/data/hrData";
import { useAuth } from "@/lib/auth-context";

export default function TeacherTimetablePage() {
  const { currentBranch } = useAuth();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("STF001");

  const teachers = useMemo(() => {
    return mockStaff.filter(s => s.role === "Teacher" && s.branchId === currentBranch);
  }, [currentBranch]);

  const selectedTeacher = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId);
  }, [selectedTeacherId, teachers]);

  const teacherSchedule = useMemo(() => {
    return mockTimetable.filter(t => t.teacherId === selectedTeacherId && t.branchId === currentBranch);
  }, [selectedTeacherId, currentBranch]);

  const handlePrint = () => {
    window.print();
  };

  const getClassName = (classId: string) => {
    return mockClasses.find(c => c.id === classId)?.name || classId;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Teacher Timetable" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 print:p-0 print:bg-white">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-1 mb-2 print:hidden">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/academics/classes" className="hover:text-[#0D7C8F]">Academics</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Teacher Timetable</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Faculty Schedule</h2>
            <Button variant="outline" className="gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Print Schedule
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm print:hidden">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="grid gap-2 flex-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Select Teacher</Label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose Faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name} ({t.staffId})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-slate-50 px-4 py-2 rounded-lg border flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Sessions</span>
                  <span className="text-sm font-bold text-[#0D7C8F]">{teacherSchedule.length} per week</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timetable Grid */}
        <Card className="border-none shadow-sm overflow-hidden print:shadow-none print:border">
          <div className="bg-[#1E2A4A] text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-[#0D7C8F]" />
              <h3 className="font-bold">{selectedTeacher?.name} — Weekly Schedule</h3>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">{selectedTeacher?.staffId}</Badge>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border p-3 text-xs font-bold text-muted-foreground uppercase w-32">Time Slot</th>
                  {DAYS.map(day => (
                    <th key={day} className="border p-3 text-xs font-bold text-[#1E2A4A] uppercase w-40">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(slot => (
                  <tr key={slot}>
                    <td className="border p-3 text-center bg-slate-50/50">
                      <div className="flex flex-col items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-slate-600">{slot}</span>
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const entry = teacherSchedule.find(e => e.day === day && e.timeSlot === slot);
                      return (
                        <td key={`${day}-${slot}`} className="border p-2 h-24">
                          {entry ? (
                            <div className="h-full flex flex-col justify-between p-2 rounded-lg bg-teal-50/30 border border-teal-100">
                              <div className="flex justify-between items-start">
                                <Badge className="text-[9px] font-bold bg-[#0D7C8F] text-white px-1.5 py-0 border-none">
                                  {entry.subjectName}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-[#1E2A4A]">
                                  <BookOpen className="h-3 w-3 opacity-70" />
                                  <span className="text-[10px] font-bold">{getClassName(entry.classId)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {entry.mode === 'Online' ? (
                                    <span className="text-[8px] flex items-center gap-0.5 text-[#0D7C8F] font-bold">
                                      <Video className="h-2 w-2" /> ONLINE
                                    </span>
                                  ) : (
                                    <span className="text-[8px] flex items-center gap-0.5 text-slate-500 font-bold">
                                      <MapPin className="h-2 w-2" /> OFFLINE
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[10px] text-slate-300 italic">No Class</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
          .overflow-x-auto {
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
