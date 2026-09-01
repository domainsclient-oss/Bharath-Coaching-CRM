"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, UserCheck, Users, BookOpen, Edit, CheckCircle2,
  AlertCircle, Plus, User,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBranch } from "@/context/BranchContext";
import { toast } from "@/hooks/use-toast";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { Skeleton } from "@/components/ui/skeleton";

interface ClassDoc {
  id: string;
  name: string;
  board: string;
  mode: string;
  branchId: string;
}

interface StaffDoc {
  id: string;
  name: string;
  role: string;
  staffId?: string;
  status: string;
  branchId: string;
}

interface ClassTeacher {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  branchId: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function AssignClassTeachersPage() {
  const { currentBranch } = useBranch();

  const { data: branchClasses, loading: loadingClasses } = useFirestoreCollection<ClassDoc>("classes", currentBranch);
  const { data: branchStaff  }                           = useFirestoreCollection<StaffDoc>("staff",   currentBranch);
  const { data: assignments, loading: loadingAssign }    = useFirestoreCollection<ClassTeacher>("classTeachers", currentBranch);

  const [isOpen,     setIsOpen]     = useState(false);
  const [editingCT,  setEditingCT]  = useState<ClassTeacher | null>(null);
  const [selClass,   setSelClass]   = useState("");
  const [selTeacher, setSelTeacher] = useState("");
  const [saving,     setSaving]     = useState(false);

  const branchTeachers = useMemo(() =>
    branchStaff.filter((s) => s.status === "Active"), [branchStaff]);

  const kpi = useMemo(() => ({
    totalClasses: branchClasses.length,
    assigned:     assignments.length,
    unassigned:   Math.max(0, branchClasses.length - assignments.length),
    teachers:     branchTeachers.filter((t) => t.role === "Teacher").length,
  }), [branchClasses, assignments, branchTeachers]);

  const rows = useMemo(() =>
    branchClasses.map((cls) => ({
      cls,
      ct: assignments.find((ct) => ct.classId === cls.id) ?? null,
    })), [branchClasses, assignments]);

  const openAssign = (ct: ClassTeacher | null, classId?: string) => {
    setEditingCT(ct);
    setSelClass(ct?.classId ?? classId ?? "");
    setSelTeacher(ct?.teacherId ?? "");
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!selClass || !selTeacher) {
      toast({ title: "Please select both a class and a teacher.", variant: "destructive" });
      return;
    }
    const cls  = branchClasses.find((c) => c.id === selClass);
    const tchr = branchTeachers.find((t) => t.id === selTeacher);
    if (!cls || !tchr) return;

    setSaving(true);
    try {
      if (editingCT) {
        await updateDocument("classTeachers", editingCT.id, {
          classId:     selClass,
          className:   cls.name,
          teacherId:   selTeacher,
          teacherName: tchr.name,
        });
        toast({ title: "Assignment Updated", description: `${tchr.name} is now class teacher for ${cls.name}.` });
      } else {
        // Remove any existing assignment for this class first
        const existing = assignments.find((a) => a.classId === selClass);
        if (existing) {
          await deleteDocument("classTeachers", existing.id);
        }
        await addDocument("classTeachers", {
          classId:     selClass,
          className:   cls.name,
          teacherId:   selTeacher,
          teacherName: tchr.name,
          branchId:    currentBranch,
        });
        toast({ title: "Teacher Assigned", description: `${tchr.name} assigned to ${cls.name}.` });
      }
      setIsOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not save assignment." });
    } finally {
      setSaving(false);
    }
  };

  const [removeTarget, setRemoveTarget] = useState<ClassTeacher | null>(null);
  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await deleteDocument("classTeachers", removeTarget.id);
      toast({ title: "Assignment Removed", description: `Class teacher removed from ${removeTarget.className}.`, variant: "destructive" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not remove assignment." });
    } finally {
      setRemoveTarget(null);
    }
  };

  const loading = loadingClasses || loadingAssign;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Assign Class Teachers" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/academics" className="hover:text-[#0D7C8F]">Academics</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Assign Class Teachers</span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Classes",  value: kpi.totalClasses, icon: BookOpen,     color: "text-[#1E2A4A]", bg: "bg-blue-100"  },
            { label: "Assigned",       value: kpi.assigned,     icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
            { label: "Unassigned",     value: kpi.unassigned,   icon: AlertCircle,  color: "text-amber-600", bg: "bg-amber-100" },
            { label: "Teaching Staff", value: kpi.teachers,     icon: Users,        color: "text-teal-600",  bg: "bg-teal-100"  },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${c.color}`} />
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

        {/* Loading */}
        {loading && (
          <Card className="border-none shadow-sm">
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          </Card>
        )}

        {/* Table */}
        {!loading && (
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-3 px-6">
              <div>
                <CardTitle className="text-base font-bold text-[#1E2A4A]">Class Teacher Assignments</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{currentBranch} Branch · One class teacher per class</p>
              </div>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={() => openAssign(null)}>
                <Plus className="h-4 w-4" /> Assign Teacher
              </Button>
            </CardHeader>

            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-8 text-center">#</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Board / Mode</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length > 0 ? rows.map(({ cls, ct }, idx) => (
                  <TableRow key={cls.id} className={`hover:bg-slate-50/50 ${!ct ? "bg-amber-50/30" : ""}`}>
                    <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-bold text-[#1E2A4A]">{cls.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">{cls.board}</Badge>
                        <Badge className={`text-xs text-white ${cls.mode === "Online" ? "bg-[#0D7C8F]" : cls.mode === "Both" ? "bg-teal-600" : "bg-slate-500"}`}>
                          {cls.mode}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ct ? (
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 border flex-shrink-0">
                            <AvatarFallback className="bg-[#0D7C8F]/10 text-[#0D7C8F] text-xs font-bold">
                              {getInitials(ct.teacherName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-[#1E2A4A]">{ct.teacherName}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{ct.teacherId}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-amber-600 italic flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" /> Not assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ct ? (
                        <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Assigned
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 text-xs gap-1">
                          <AlertCircle className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {ct ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={() => openAssign(ct)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setRemoveTarget(ct)}>
                              <UserCheck className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline" size="sm"
                            className="h-8 text-xs text-[#0D7C8F] border-[#0D7C8F] hover:bg-[#0D7C8F] hover:text-white gap-1"
                            onClick={() => openAssign(null, cls.id)}
                          >
                            <Plus className="h-3 w-3" /> Assign
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      No classes found. Add classes first under Academics → Classes.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="bg-slate-50 border-t px-6 py-2 text-xs text-muted-foreground">
              {kpi.assigned} of {kpi.totalClasses} classes have a class teacher assigned
            </div>
          </Card>
        )}
      </main>

      {/* Remove Confirmation Dialog */}
      <Dialog open={!!removeTarget} onOpenChange={v => { if (!v) setRemoveTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Remove Class Teacher</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove the class teacher assignment for <span className="font-semibold text-foreground">{removeTarget?.className}</span>? This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemove}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={isOpen} onOpenChange={(v) => { if (!v) setIsOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">
              {editingCT ? "Change Class Teacher" : "Assign Class Teacher"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Class *</Label>
              <Select value={selClass} onValueChange={setSelClass} disabled={!!editingCT}>
                <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
                <SelectContent>
                  {branchClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.board})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Class Teacher *</Label>
              <Select value={selTeacher} onValueChange={setSelTeacher}>
                <SelectTrigger><SelectValue placeholder="Select a teacher" /></SelectTrigger>
                <SelectContent>
                  {branchTeachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {t.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground bg-blue-50 rounded p-2">
              A class teacher acts as the primary contact for a class. Only one teacher can be assigned per class.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : (editingCT ? "Update Assignment" : "Assign Teacher")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
