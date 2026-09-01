"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, Save, CalendarDays, Users, CheckCircle2, XCircle } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { db } from "@/config/firebase";
import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

type AttendanceStatus = "Present" | "Absent" | "Half Day" | "Leave";

interface StaffMember {
  id: string;
  staffId?: string;
  name: string;
  role: string;
  status: string;
  branchId: string;
}

const STATUS_OPTIONS: AttendanceStatus[] = ["Present", "Absent", "Half Day", "Leave"];

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  Present:    "bg-green-100 text-green-700 border-green-200",
  Absent:     "bg-red-100 text-red-600 border-red-200",
  "Half Day": "bg-amber-100 text-amber-700 border-amber-200",
  Leave:      "bg-blue-100 text-blue-700 border-blue-200",
};

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function attDocId(branchId: string, date: string, staffId: string) {
  return `${branchId}_${date}_${staffId}`;
}

export default function StaffAttendancePage() {
  const { currentBranch } = useBranch();
  const today = toYMD(new Date());

  const { data: allStaff, loading: staffLoading } = useFirestoreCollection<StaffMember>(
    "staff", currentBranch,
  );

  const branchStaff = useMemo(
    () => allStaff.filter(s => s.status === "Active"),
    [allStaff],
  );

  const [selectedDate, setSelectedDate] = useState(today);
  const [statusMap,    setStatusMap]    = useState<Record<string, AttendanceStatus>>({});
  const [attLoading,   setAttLoading]   = useState(false);
  const [saving,       setSaving]       = useState(false);

  // Load existing attendance records from Firestore
  const loadAttendance = useCallback(async () => {
    if (!currentBranch || branchStaff.length === 0) return;
    setAttLoading(true);
    try {
      const q = query(
        collection(db, "staffAttendance"),
        where("branchId", "==", currentBranch),
        where("date", "==", selectedDate),
      );
      const snap = await getDocs(q);
      const map: Record<string, AttendanceStatus> = {};

      if (!snap.empty) {
        snap.docs.forEach(d => {
          const data = d.data();
          // normalize "Half-Day" → "Half Day" if stored differently
          let st = data.status as string;
          if (st === "Half-Day") st = "Half Day";
          map[data.staffId] = st as AttendanceStatus;
        });
      }
      // default unset staff to Present
      branchStaff.forEach(s => { if (!map[s.id]) map[s.id] = "Present"; });
      setStatusMap(map);
    } catch (err) {
      console.error("Failed to load attendance:", err);
      toast({ title: "Error", description: "Could not load attendance records.", variant: "destructive" });
    } finally {
      setAttLoading(false);
    }
  }, [currentBranch, selectedDate, branchStaff]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const setStatus = (staffId: string, s: AttendanceStatus) =>
    setStatusMap(prev => ({ ...prev, [staffId]: s }));

  const statusFor = (staffId: string): AttendanceStatus =>
    statusMap[staffId] ?? "Present";

  const handleSave = async () => {
    if (branchStaff.length === 0) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      branchStaff.forEach(staff => {
        const status = statusFor(staff.id);
        const docRef = doc(db, "staffAttendance", attDocId(currentBranch, selectedDate, staff.id));
        batch.set(docRef, {
          branchId:  currentBranch,
          date:      selectedDate,
          staffId:   staff.id,
          staffName: staff.name,
          role:      staff.role,
          status,
          notes:     "",
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      toast({ title: "Attendance Saved", description: `${selectedDate} — ${branchStaff.length} records saved.` });
    } catch (err) {
      console.error("Save failed:", err);
      toast({ title: "Error", description: "Could not save attendance.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => ({
    present:  branchStaff.filter(s => statusFor(s.id) === "Present").length,
    absent:   branchStaff.filter(s => statusFor(s.id) === "Absent").length,
    halfDay:  branchStaff.filter(s => statusFor(s.id) === "Half Day").length,
    leave:    branchStaff.filter(s => statusFor(s.id) === "Leave").length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [branchStaff, statusMap]);

  const isLoading = staffLoading || attLoading;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Staff Attendance" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/hr" className="hover:text-[#0D7C8F]">HR</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Staff Attendance</span>
        </div>

        {/* Date picker + save */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-[#0D7C8F]" />
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Staff Attendance</h2>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={selectedDate}
              max={today}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-44"
            />
            <Button
              className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2"
              onClick={handleSave}
              disabled={branchStaff.length === 0 || saving}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Present",  value: counts.present,  color: "text-green-600",  bg: "bg-green-100",  icon: CheckCircle2 },
            { label: "Absent",   value: counts.absent,   color: "text-red-500",    bg: "bg-red-100",    icon: XCircle },
            { label: "Half Day", value: counts.halfDay,  color: "text-amber-600",  bg: "bg-amber-100",  icon: Users },
            { label: "Leave",    value: counts.leave,    color: "text-blue-600",   bg: "bg-blue-100",   icon: Users },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full ${c.bg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Attendance table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {staffLoading ? "Loading staff..." : `${branchStaff.length} Staff Members`} — {selectedDate}
            </CardTitle>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {STATUS_OPTIONS.map(s => (
                <Badge key={s} variant="outline" className={`${STATUS_STYLE[s]} text-xs`}>{s}</Badge>
              ))}
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Staff Name</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Mark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-32 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : branchStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No active staff found for {currentBranch}. Add staff first under HR → Staff Directory.
                  </TableCell>
                </TableRow>
              ) : branchStaff.map((s, idx) => {
                const status = statusFor(s.id);
                return (
                  <TableRow key={s.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-sm text-[#1E2A4A]">{s.name}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{s.staffId ?? s.id}</TableCell>
                    <TableCell className="text-sm">{s.role}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${STATUS_STYLE[status]}`}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt}
                            onClick={() => setStatus(s.id, opt)}
                            className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                              status === opt
                                ? STATUS_STYLE[opt] + " shadow-sm"
                                : "border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600"
                            }`}
                          >
                            {opt === "Half Day" ? "HD" : opt.slice(0, 1)}
                          </button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="bg-slate-50 border-t px-6 py-2 flex justify-between items-center text-xs text-muted-foreground">
            <span>Click P / A / HD / L buttons to mark attendance, then Save.</span>
            <span className="font-semibold text-green-600">{counts.present}/{branchStaff.length} Present</span>
          </div>
        </Card>

      </main>
    </div>
  );
}
