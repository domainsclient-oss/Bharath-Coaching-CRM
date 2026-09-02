"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight, Printer, Clock, Calendar, Video,
  ExternalLink, ArrowLeft, ChevronLeft, ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { getSessionStatus } from "@/lib/sessionStatus";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

interface ClassDoc { id: string; name: string; board?: string; branchId: string; }
interface OnlineClassDoc {
  id: string; title: string; classId?: string; class: string; subject: string;
  teacherName?: string; date: string; time: string; duration?: number;
  meetLink?: string; status: "Scheduled" | "Live" | "Ended"; branchId: string;
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekStart(offset: number): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function fmt12(time: string) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function OnlineTimetablePage() {
  useAuth();
  const { currentBranch } = useBranch();

  const { data: classes }       = useFirestoreCollection<ClassDoc>("classes", currentBranch);
  const { data: onlineClasses } = useFirestoreCollection<OnlineClassDoc>("onlineClasses", currentBranch);
  const now = useNow(30_000);

  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [weekOffset, setWeekOffset] = useState(0);

  const selectedClass = useMemo(() =>
    classes.find(c => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  // Build week days with actual dates
  const weekDays = useMemo(() => {
    const monday = getWeekStart(weekOffset);
    return WEEK_DAYS.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { label, date: formatDate(d), display: formatDisplay(d), dateObj: d };
    });
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.display} – ${end.display}`;
  }, [weekDays]);

  // Filter sessions for selected class (or all classes)
  const classSessions = useMemo(() => {
    if (selectedClassId === "all") return onlineClasses;
    if (!selectedClass) return onlineClasses;
    const normalize = (s: string) => s?.trim().toLowerCase();
    return onlineClasses.filter(oc =>
      oc.classId === selectedClass.id ||
      normalize(oc.class) === normalize(selectedClass.name)
    );
  }, [selectedClassId, selectedClass, onlineClasses]);

  // Sessions for this week
  const weekDates = useMemo(() => new Set(weekDays.map(d => d.date)), [weekDays]);
  const weekSessions = useMemo(() =>
    classSessions.filter(oc => weekDates.has(oc.date)),
    [classSessions, weekDates]
  );

  // Sessions per day
  const sessionsByDate = useMemo(() => {
    const map: Record<string, OnlineClassDoc[]> = {};
    weekDays.forEach(d => { map[d.date] = []; });
    weekSessions.forEach(oc => {
      if (map[oc.date]) {
        map[oc.date].push(oc);
        map[oc.date].sort((a, b) => a.time.localeCompare(b.time));
      }
    });
    return map;
  }, [weekSessions, weekDays]);

  const todayStr = formatDate(new Date());
  const isToday = (dateStr: string) => todayStr === dateStr;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Online Timetable" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 print:p-0 print:bg-white">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col gap-1 mb-2 print:hidden">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/online-classes" className="hover:text-[#0D7C8F]">Online Classes</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Timetable</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Virtual Class Schedule</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print Timetable
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/online-classes"><ArrowLeft className="h-4 w-4 mr-2" /> Back to List</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm print:hidden">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="grid gap-2 flex-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Select Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.board ? ` (${c.board})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-teal-50 px-4 py-2 rounded-lg border border-teal-100 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                  <Video className="h-4 w-4 text-[#0D7C8F]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-teal-700 uppercase font-bold">This Week</span>
                  <span className="text-sm font-bold text-[#1E2A4A]">{weekSessions.length} Sessions</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Week Navigation + Grid */}
        <Card className="border-none shadow-sm overflow-hidden print:shadow-none print:border">
          {/* Header */}
          <div className="bg-[#0D7C8F] text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-white/80" />
              <h3 className="font-bold">
                {selectedClass ? `${selectedClass.name}${selectedClass.board ? ` · ${selectedClass.board}` : ""}` : "All Classes"}
              </h3>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button
                size="icon" variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setWeekOffset(w => w - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[140px] text-center">{weekLabel}</span>
              <Button
                size="icon" variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setWeekOffset(w => w + 1)}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              {weekOffset !== 0 && (
                <Button
                  size="sm" variant="ghost"
                  className="text-white hover:bg-white/20 text-xs h-8 px-3"
                  onClick={() => setWeekOffset(0)}
                >
                  Today
                </Button>
              )}
            </div>
          </div>

          {/* Day columns */}
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 min-w-[900px]">
              {/* Day headers */}
              {weekDays.map(day => (
                <div
                  key={day.date}
                  className={cn(
                    "border-b border-r p-3 text-center",
                    isToday(day.date) ? "bg-[#0D7C8F]/10" : "bg-slate-50"
                  )}
                >
                  <p className={cn(
                    "text-xs font-bold uppercase",
                    isToday(day.date) ? "text-[#0D7C8F]" : "text-slate-500"
                  )}>
                    {day.label}
                  </p>
                  <p className={cn(
                    "text-sm font-bold mt-0.5",
                    isToday(day.date) ? "text-[#0D7C8F]" : "text-[#1E2A4A]"
                  )}>
                    {day.display}
                  </p>
                  {isToday(day.date) && (
                    <span className="text-[9px] font-bold text-[#0D7C8F] uppercase">Today</span>
                  )}
                </div>
              ))}

              {/* Session cells */}
              {weekDays.map(day => {
                const sessions = sessionsByDate[day.date] ?? [];
                return (
                  <div
                    key={day.date}
                    className={cn(
                      "border-r min-h-[240px] p-2 space-y-2",
                      isToday(day.date) ? "bg-[#0D7C8F]/5" : "bg-white"
                    )}
                  >
                    {sessions.length === 0 ? (
                      <div className="h-full flex items-center justify-center py-8">
                        <span className="text-[10px] text-slate-300 italic">No sessions</span>
                      </div>
                    ) : (
                      sessions.map(oc => {
                        const derived = getSessionStatus(oc, now);
                        const isPast = derived === "Ended";
                        const isLive = derived === "Live";
                        return (
                          <div
                            key={oc.id}
                            className={cn(
                              "rounded-lg border p-2 space-y-1 transition-all",
                              isPast && "bg-slate-50 border-slate-200 opacity-70",
                              isLive && "bg-red-50 border-red-200",
                              !isPast && !isLive && "bg-gradient-to-br from-teal-50 to-white border-teal-100 hover:border-[#0D7C8F]/40"
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <Badge className={cn(
                                "text-[9px] py-0 h-4 font-bold",
                                isPast ? "bg-slate-200 text-slate-600" :
                                isLive ? "bg-red-600 text-white animate-pulse" :
                                "bg-[#0D7C8F] text-white"
                              )}>
                                {isLive ? "LIVE" : oc.subject}
                              </Badge>
                            </div>
                            <p className={cn(
                              "text-[10px] font-bold line-clamp-2 leading-tight",
                              isPast ? "text-slate-400" : "text-[#1E2A4A]"
                            )}>
                              {oc.title}
                            </p>
                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                              <Clock className="h-2.5 w-2.5" />
                              <span>{fmt12(oc.time)}</span>
                              {oc.duration && <span>· {oc.duration}m</span>}
                            </div>
                            {oc.teacherName && (
                              <p className="text-[9px] text-muted-foreground truncate">{oc.teacherName}</p>
                            )}
                            <Button
                              size="sm"
                              variant={isPast ? "secondary" : "outline"}
                              disabled={isPast || !oc.meetLink}
                              className={cn(
                                "w-full h-6 text-[9px] gap-1 font-bold mt-1",
                                !isPast && oc.meetLink && "border-[#0D7C8F] text-[#0D7C8F] hover:bg-[#0D7C8F] hover:text-white"
                              )}
                              onClick={() => oc.meetLink && window.open(oc.meetLink, "_blank")}
                            >
                              {isPast ? "Ended" : <><ExternalLink className="h-2.5 w-2.5" /> Join</>}
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground print:hidden">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-gradient-to-br from-teal-50 to-white border border-teal-100" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-50 border border-red-200" />
            <span>Live Now</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-slate-50 border border-slate-200" />
            <span>Ended</span>
          </div>
        </div>
      </main>
    </div>
  );
}
