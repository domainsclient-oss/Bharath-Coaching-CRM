"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight, Calendar as CalendarIcon, CheckCircle2, XCircle,
  Clock, Save, Edit2, Check, X, Users, AlertCircle,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { db } from "@/config/firebase";
import {
  collection, doc, getDocs, query, where, writeBatch,
} from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/data/attendanceData";

// ── types ──────────────────────────────────────────────────────────────────────
interface StaffMember {
  id: string;
  staffId?: string;
  name: string;
  role: string;
  status: string;
  branchId: string;
}

// ── constants ──────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { label: "Present",  short: "P",  value: "Present"  as AttendanceStatus, active: "bg-green-600 text-white border-green-600",  border: "hover:border-green-300" },
  { label: "Absent",   short: "A",  value: "Absent"   as AttendanceStatus, active: "bg-red-600 text-white border-red-600",       border: "hover:border-red-300"   },
  { label: "Half-Day", short: "HD", value: "Half-Day" as AttendanceStatus, active: "bg-blue-500 text-white border-blue-500",     border: "hover:border-blue-300"  },
  { label: "Leave",    short: "L",  value: "Leave"    as AttendanceStatus, active: "bg-amber-500 text-white border-amber-500",   border: "hover:border-amber-300" },
];

const ROLE_COLORS: Record<string, string> = {
  Principal: "bg-purple-100 text-purple-700",
  Admin:     "bg-blue-100 text-blue-700",
  Teacher:   "bg-teal-100 text-teal-700",
  Support:   "bg-orange-100 text-orange-700",
};

const today = new Date().toISOString().split("T")[0];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

// Deterministic Firestore doc ID per staff-per-day
function attDocId(branchId: string, date: string, staffId: string) {
  return `${branchId}_${date}_${staffId}`;
}

// ── component ──────────────────────────────────────────────────────────────────
export default function StaffAttendancePage() {
  const { currentBranch } = useBranch();

  const { data: allStaff, loading: staffLoading } = useFirestoreCollection<StaffMember>(
    "staff", currentBranch,
  );

  const staffList = useMemo(
    () => allStaff.filter(s => s.status === "Active"),
    [allStaff],
  );

  const [selectedDate,    setSelectedDate]    = useState(today);
  const [isMarking,       setIsMarking]       = useState(true);
  const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);
  const [attendanceMap,   setAttendanceMap]   = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [attLoading,      setAttLoading]      = useState(false);
  const [saving,          setSaving]          = useState(false);

  // ── Load attendance from Firestore when date or staff list changes ───────────
  const loadAttendance = useCallback(async () => {
    if (!currentBranch || staffList.length === 0) return;
    setAttLoading(true);
    try {
      const q = query(
        collection(db, "staffAttendance"),
        where("branchId", "==", currentBranch),
        where("date", "==", selectedDate),
      );
      const snap = await getDocs(q);

      const map: Record<string, { status: AttendanceStatus; notes: string }> = {};

      if (!snap.empty) {
        snap.docs.forEach(d => {
          const data = d.data();
          map[data.staffId] = { status: data.status as AttendanceStatus, notes: data.notes ?? "" };
        });
        // fill any staff not yet in map with Present default
        staffList.forEach(s => { if (!map[s.id]) map[s.id] = { status: "Present", notes: "" }; });
        setIsAlreadyMarked(true);
        setIsMarking(false);
      } else {
        // No records for this date — fresh sheet
        staffList.forEach(s => { map[s.id] = { status: "Present", notes: "" }; });
        setIsAlreadyMarked(false);
        setIsMarking(true);
      }
      setAttendanceMap(map);
    } catch (err) {
      console.error("Failed to load attendance:", err);
      toast({ title: "Error", description: "Could not load attendance records.", variant: "destructive" });
    } finally {
      setAttLoading(false);
    }
  }, [currentBranch, selectedDate, staffList]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const updateStatus = (id: string, status: AttendanceStatus) => {
    if (!isMarking) return;
    setAttendanceMap(prev => ({ ...prev, [id]: { ...prev[id], status } }));
  };

  const updateNotes = (id: string, notes: string) => {
    if (!isMarking) return;
    setAttendanceMap(prev => ({ ...prev, [id]: { ...prev[id], notes } }));
  };

  const handleBulkMark = (status: AttendanceStatus) => {
    const map = { ...attendanceMap };
    staffList.forEach(s => { map[s.id] = { ...map[s.id], status }; });
    setAttendanceMap(map);
  };

  // ── Save to Firestore using batch write with deterministic doc IDs ─────────
  const handleSubmit = async () => {
    if (staffList.length === 0) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);

      staffList.forEach(staff => {
        const entry = attendanceMap[staff.id] ?? { status: "Present" as AttendanceStatus, notes: "" };
        const docRef = doc(db, "staffAttendance", attDocId(currentBranch, selectedDate, staff.id));
        batch.set(docRef, {
          branchId:   currentBranch,
          date:       selectedDate,
          staffId:    staff.id,
          staffName:  staff.name,
          role:       staff.role,
          status:     entry.status,
          notes:      entry.notes ?? "",
          updatedAt:  new Date().toISOString(),
        });
      });

      await batch.commit();

      toast({
        title: "Attendance Saved",
        description: `${selectedDate} — ${staffList.length} staff members updated.`,
      });
      setIsAlreadyMarked(true);
      setIsMarking(false);
    } catch (err) {
      console.error("Save failed:", err);
      toast({ title: "Error", description: "Could not save attendance.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Summary ────────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const vals = staffList.map(s => attendanceMap[s.id]?.status ?? "Present");
    return {
      total:   staffList.length,
      present: vals.filter(v => v === "Present").length,
      absent:  vals.filter(v => v === "Absent").length,
      halfDay: vals.filter(v => v === "Half-Day").length,
      leave:   vals.filter(v => v === "Leave").length,
    };
  }, [staffList, attendanceMap]);

  const attendancePct = counts.total > 0
    ? Math.round(((counts.present + counts.halfDay * 0.5) / counts.total) * 100)
    : 0;

  const isLoading = staffLoading || attLoading;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Staff Attendance" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/attendance" className="hover:text-[#0D7C8F]">Attendance</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Staff</span>
        </div>

        {/* Date bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Attendance Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-10 w-48"
                    value={selectedDate}
                    max={today}
                    onChange={e => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-md border text-sm font-medium text-slate-600">
                <Users className="h-4 w-4 text-[#0D7C8F]" />
                {staffLoading ? "Loading..." : `${staffList.length} Active Staff Members`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
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

        {/* Attendance Sheet */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-3 px-6 flex-wrap gap-3">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold text-[#1E2A4A]">
                Staff Registry — {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{currentBranch} Branch</Badge>
                {isAlreadyMarked ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Records Saved
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs gap-1">
                    <Clock className="h-3 w-3" /> Not Yet Marked
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isMarking && (
                <>
                  <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-600 gap-1" onClick={() => handleBulkMark("Present")}>
                    <Check className="h-3.5 w-3.5" /> All Present
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600 gap-1" onClick={() => handleBulkMark("Absent")}>
                    <X className="h-3.5 w-3.5" /> All Absent
                  </Button>
                </>
              )}
              {!isMarking && isAlreadyMarked && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsMarking(true)}>
                  <Edit2 className="h-3.5 w-3.5" /> Edit Attendance
                </Button>
              )}
            </div>
          </CardHeader>

          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Staff Member</TableHead>
                <TableHead className="w-28">Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-56">Reason / Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                    <TableCell><div className="flex items-center gap-2"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-32" /></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : staffList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No active staff found for {currentBranch}. Add staff first under HR → Staff Directory.
                  </TableCell>
                </TableRow>
              ) : staffList.map((staff, idx) => {
                const entry = attendanceMap[staff.id] ?? { status: "Present" as AttendanceStatus, notes: "" };
                const showReason = entry.status === "Absent" || entry.status === "Leave";
                return (
                  <TableRow key={staff.id} className={cn("hover:bg-slate-50/50", entry.status === "Absent" && "bg-red-50/20")}>
                    <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9 border flex-shrink-0">
                          <AvatarFallback className="bg-[#1E2A4A]/10 text-[#1E2A4A] text-xs font-bold">
                            {getInitials(staff.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-[#1E2A4A]">{staff.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{staff.staffId ?? staff.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${ROLE_COLORS[staff.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {staff.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            disabled={!isMarking}
                            onClick={() => updateStatus(staff.id, opt.value)}
                            className={cn(
                              "flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all border",
                              entry.status === opt.value
                                ? opt.active
                                : `bg-white text-slate-400 border-slate-200 ${opt.border}`,
                              !isMarking && "cursor-default opacity-75",
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder={showReason ? "Enter reason (required)..." : "Optional note..."}
                        className={cn(
                          "h-8 text-xs",
                          showReason
                            ? "bg-red-50/40 border-red-200 focus:border-red-300 placeholder:text-red-300"
                            : "border-transparent hover:border-slate-200 focus:border-slate-200",
                        )}
                        value={entry.notes}
                        onChange={e => updateNotes(staff.id, e.target.value)}
                        disabled={!isMarking}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Footer */}
          <div className="bg-slate-50 border-t px-6 py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-5 text-xs">
              <span>Present: <strong className="text-green-600">{counts.present}</strong></span>
              <span>Absent: <strong className="text-red-500">{counts.absent}</strong></span>
              <span>Half-Day: <strong className="text-blue-600">{counts.halfDay}</strong></span>
              <span>Leave: <strong className="text-amber-600">{counts.leave}</strong></span>
              <span className="font-semibold text-[#0D7C8F]">Attendance: {attendancePct}%</span>
            </div>
            {isMarking && (
              <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A] gap-2" onClick={handleSubmit} disabled={saving || staffList.length === 0}>
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Attendance"}
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
