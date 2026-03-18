
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  Filter,
  Save,
  Edit2,
  Check,
  X,
  MessageSquare,
  Users
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockStaff } from "@/data/hrData";
import { mockAttendanceRecords } from "@/data/attendanceData";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function StaffAttendancePage() {
  useAuth();
  const { currentBranch } = useBranch();
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State
  const [isMarking, setIsMarking] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; reason: string }>>({});
  const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);

  const staffList = useMemo(() => {
    return mockStaff.filter(s => s.branchId === currentBranch);
  }, [currentBranch]);

  // Load existing attendance or initialize new
  useEffect(() => {
    const existing = mockAttendanceRecords.filter(r => 
      r.date === selectedDate && 
      r.branchId === currentBranch &&
      r.entityType === "staff"
    );

    if (existing.length > 0) {
      const map: Record<string, { status: string; reason: string }> = {};
      existing.forEach(r => {
        map[r.entityId] = { status: r.status, reason: r.notes || "" };
      });
      setAttendanceMap(map);
      setIsAlreadyMarked(true);
      setIsMarking(false);
    } else {
      const map: Record<string, { status: string; reason: string }> = {};
      staffList.forEach(s => {
        map[s.id] = { status: "Present", reason: "" };
      });
      setAttendanceMap(map);
      setIsAlreadyMarked(false);
      setIsMarking(true);
    }
  }, [selectedDate, staffList, currentBranch]);

  const updateStatus = (staffId: string, status: string) => {
    if (!isMarking && isAlreadyMarked) return;
    setAttendanceMap(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId], status }
    }));
  };

  const updateReason = (staffId: string, reason: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId], reason }
    }));
  };

  const handleBulkMark = (status: string) => {
    const newMap = { ...attendanceMap };
    staffList.forEach(s => {
      newMap[s.id] = { ...newMap[s.id], status };
    });
    setAttendanceMap(newMap);
  };

  const handleSubmit = () => {
    toast({
      title: "Staff Attendance Submitted",
      description: `Attendance for ${staffList.length} staff members on ${selectedDate} has been saved.`,
    });
    setIsAlreadyMarked(true);
    setIsMarking(false);
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Staff Attendance" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs */}
        <div className="flex items-center text-xs text-muted-foreground gap-2 mb-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Attendance</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Staff</span>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Attendance Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    className="pl-10 h-10" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 h-10 px-4 bg-slate-50 rounded-md border text-sm font-medium text-slate-600">
                <Users className="h-4 w-4 text-[#0D7C8F]" />
                Total Staff: {staffList.length}
              </div>
              <Button className="bg-[#1E2A4A] gap-2 h-10">
                <Filter className="h-4 w-4" /> Refresh List
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
                  Staff Registry — {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {currentBranch} Branch
                  </Badge>
                  {isAlreadyMarked ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Records Saved
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                      <Clock className="h-3 w-3" /> Draft Mode
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
                  <Check className="h-3.5 w-3.5" /> All Present
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
                  <TableHead>Staff Member</TableHead>
                  <TableHead className="text-center w-[450px]">Attendance Status</TableHead>
                  <TableHead>Reason / Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.length > 0 ? (
                  staffList.map((staff, idx) => {
                    const status = attendanceMap[staff.id]?.status || "Present";
                    const showReason = status === "Absent" || status === "Leave";
                    
                    return (
                      <TableRow key={staff.id} className="hover:bg-slate-50/50">
                        <TableCell className="text-center text-muted-foreground font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                              <AvatarImage src={staff.avatar} />
                              <AvatarFallback className="bg-[#1E2A4A]/10 text-[#1E2A4A] text-xs font-bold">
                                {getInitials(staff.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#1E2A4A]">{staff.name}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">{staff.role} • {staff.staffId}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1.5">
                            {["Present", "Absent", "Half-Day", "Leave"].map((s) => (
                              <button
                                key={s}
                                disabled={!isMarking}
                                onClick={() => updateStatus(staff.id, s)}
                                className={cn(
                                  "flex-1 py-1.5 px-2 rounded-md text-[10px] font-bold transition-all border whitespace-nowrap",
                                  status === s 
                                    ? s === "Present" ? "bg-green-600 text-white border-green-600" :
                                      s === "Absent" ? "bg-red-600 text-white border-red-600" :
                                      s === "Half-Day" ? "bg-blue-500 text-white border-blue-500" :
                                      "bg-amber-500 text-white border-amber-500"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                                  !isMarking && "cursor-default opacity-80"
                                )}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {showReason ? (
                            <Input 
                              placeholder="Enter reason..." 
                              className="h-8 text-xs bg-red-50/30 border-red-100 focus:border-red-200"
                              value={attendanceMap[staff.id]?.reason || ""}
                              onChange={(e) => updateReason(staff.id, e.target.value)}
                              disabled={!isMarking}
                            />
                          ) : (
                            <Input 
                              placeholder="Optional notes" 
                              className="h-8 text-xs border-transparent hover:border-slate-200 focus:border-slate-200"
                              value={attendanceMap[staff.id]?.reason || ""}
                              onChange={(e) => updateReason(staff.id, e.target.value)}
                              disabled={!isMarking}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      No staff records found for this branch.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {isMarking && (
              <div className="p-6 bg-slate-50 border-t flex justify-end">
                <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A] gap-2 px-8" onClick={handleSubmit}>
                  <Save className="h-4 w-4" /> Save Staff Attendance
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
