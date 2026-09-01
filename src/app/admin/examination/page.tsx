"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, PlusCircle, Edit, Trash2, BookOpen,
  Search, Calendar, CheckCircle2, Clock,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Exam } from "@/data/examinationData";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

const empty: Omit<Exam, "id" | "branchId"> = {
  name: "", class: "", board: "CBSE", subject: "",
  date: "", startTime: "", endTime: "",
  maxMarks: 100, passMarks: 35, examiner: "", status: "Scheduled",
};

export default function ExamSchedulePage() {
  const { currentBranch } = useBranch();
  const { data: exams, loading: examsLoading } = useFirestoreCollection<Exam>(
    "exams",
    currentBranch,
    { orderByField: "date", orderByDir: "desc" }
  );

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);

  const branchExams = exams;

  const filtered = useMemo(() =>
    branchExams.filter(e =>
      (classFilter === "All" || e.class === classFilter) &&
      (statusFilter === "All" || e.status === statusFilter) &&
      (
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.subject.toLowerCase().includes(search.toLowerCase())
      )
    ).sort((a, b) => b.date.localeCompare(a.date)),
    [branchExams, classFilter, statusFilter, search]
  );

  const scheduledCount = branchExams.filter(e => e.status === "Scheduled").length;
  const completedCount = branchExams.filter(e => e.status === "Completed").length;

  const set = (k: keyof typeof form, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty });
    setOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setEditing(exam);
    setForm({
      name: exam.name, class: exam.class, board: exam.board,
      subject: exam.subject, date: exam.date,
      startTime: exam.startTime, endTime: exam.endTime,
      maxMarks: exam.maxMarks, passMarks: exam.passMarks,
      examiner: exam.examiner ?? "", status: exam.status,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.class || !form.subject || !form.date) {
      toast({ title: "Missing fields", description: "Fill in Name, Class, Subject and Date.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDocument("exams", editing.id, { ...form, branchId: currentBranch });
        toast({ title: "Exam Updated", description: form.name });
      } else {
        await addDocument("exams", { ...form, branchId: currentBranch });
        toast({ title: "Exam Scheduled", description: form.name });
      }
      setOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not save exam." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument("exams", deleteTarget.id);
      toast({ title: "Deleted", description: `"${deleteTarget.name}" removed.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not delete exam." });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Exam Schedule" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Examination</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Exam Schedule</h2>
          <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={openNew}>
            <PlusCircle className="h-4 w-4" /> Schedule Exam
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Exams</p>
                <p className="text-2xl font-bold text-[#1E2A4A]">{branchExams.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-amber-600">{scheduledCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Exam name or subject..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["All","8","9","10","11","12"].map(c => (
                    <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">
              {examsLoading ? "Loading..." : `${filtered.length} Exam${filtered.length !== 1 ? "s" : ""}`}
            </CardTitle>
          </CardHeader>
          {examsLoading && (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          )}
          {!examsLoading && <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Exam Name</TableHead>
                <TableHead>Class / Board</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead>Max / Pass</TableHead>
                <TableHead>Examiner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map(exam => (
                <TableRow key={exam.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-semibold text-sm text-[#1E2A4A]">{exam.name}</TableCell>
                  <TableCell>
                    <p className="text-sm">Class {exam.class}</p>
                    <Badge variant="outline" className="text-xs mt-0.5">{exam.board}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{exam.subject}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{exam.date}</p>
                    <p className="text-xs text-muted-foreground">{exam.startTime} – {exam.endTime}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-medium">{exam.maxMarks}</span>
                    <span className="text-muted-foreground"> / {exam.passMarks}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{exam.examiner ?? "—"}</TableCell>
                  <TableCell>
                    {exam.status === "Scheduled" ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Scheduled</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Completed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/examination/marks?examId=${exam.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#0D7C8F] hover:bg-teal-50 hover:text-[#0D7C8F]" title="Enter Marks">
                          <BookOpen className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700" title="Edit"
                        onClick={() => openEdit(exam)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" title="Delete"
                        onClick={() => setDeleteTarget(exam)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="h-8 w-8 opacity-20" />
                      <p>No exams found. Schedule one to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>}
        </Card>
      </main>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Exam" : "Schedule New Exam"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Exam Name *</Label>
              <Input placeholder="e.g. Unit Test 1 — Physics"
                value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Class *</Label>
              <Select value={form.class} onValueChange={v => set("class", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["8","9","10","11","12"].map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Board *</Label>
              <Select value={form.board} onValueChange={v => set("board", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["CBSE","ICSE","State","Samacheer","IB"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Subject *</Label>
              <Input placeholder="e.g. Mathematics"
                value={form.subject} onChange={e => set("subject", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Date *</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Start Time</Label>
              <Input type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">End Time</Label>
              <Input type="time" value={form.endTime} onChange={e => set("endTime", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Max Marks</Label>
              <Input type="number" min={1} value={form.maxMarks}
                onChange={e => set("maxMarks", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Pass Marks</Label>
              <Input type="number" min={1} value={form.passMarks}
                onChange={e => set("passMarks", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Examiner</Label>
              <Input placeholder="Teacher name" value={form.examiner}
                onChange={e => set("examiner", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F]" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Schedule Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Delete Exam</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>? This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
