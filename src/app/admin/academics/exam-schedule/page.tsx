"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, PlusCircle, Edit, Trash2, BookOpen, Search
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Exam } from "@/data/examinationData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

const EMPTY_FORM: Omit<Exam, "id" | "branchId"> = {
  name: "", class: "", board: "CBSE", subject: "", date: "",
  startTime: "", endTime: "", maxMarks: 100, passMarks: 35,
  examiner: "", status: "Scheduled",
};

export default function AcademicsExamSchedulePage() {
  const { currentBranch } = useBranch();
  const { data: exams, loading } = useFirestoreCollection<Exam>("exams", currentBranch, { orderByField: "date", orderByDir: "desc" });

  const [filters, setFilters] = useState({ search: "", status: "all" });
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);

  const filtered = useMemo(() => {
    return exams.filter(e =>
      (filters.status === "all" || e.status === filters.status) &&
      (
        e.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        e.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
        e.class.toLowerCase().includes(filters.search.toLowerCase())
      )
    );
  }, [exams, filters]);

  const openModal = (exam: Exam | null = null) => {
    setEditing(exam);
    setForm(exam ? { name: exam.name, class: exam.class, board: exam.board, subject: exam.subject, date: exam.date, startTime: exam.startTime, endTime: exam.endTime, maxMarks: exam.maxMarks, passMarks: exam.passMarks, examiner: exam.examiner ?? "", status: exam.status } : EMPTY_FORM);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.class || !form.subject || !form.date) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDocument("exams", editing.id, { ...form, branchId: currentBranch });
        toast({ title: "Exam Updated", description: `${form.name} has been updated.` });
      } else {
        await addDocument("exams", { ...form, branchId: currentBranch });
        toast({ title: "Exam Created", description: `${form.name} has been scheduled.` });
      }
      setIsOpen(false);
      setEditing(null);
    } catch {
      toast({ title: "Error", description: "Could not save exam.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument("exams", deleteTarget.id);
      toast({ title: "Exam Deleted" });
    } catch {
      toast({ title: "Error", description: "Could not delete exam.", variant: "destructive" });
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
          <Link href="/admin/academics" className="hover:text-[#0D7C8F]">Academics</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Exam Schedule</span>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Exam Schedule</h2>
          <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={() => openModal()}>
            <PlusCircle className="h-4 w-4" /> Schedule Exam
          </Button>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Exam" : "Schedule New Exam"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-1">
                  <Label>Exam Name *</Label>
                  <Input placeholder="e.g. Unit Test 1 - Physics" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Class *</Label>
                  <Input placeholder="e.g. 10" value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Board *</Label>
                  <Select value={form.board} onValueChange={v => setForm(f => ({ ...f, board: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBSE">CBSE</SelectItem>
                      <SelectItem value="ICSE">ICSE</SelectItem>
                      <SelectItem value="State">State Board</SelectItem>
                      <SelectItem value="Samacheer">Samacheer</SelectItem>
                      <SelectItem value="IB">IB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Subject *</Label>
                  <Input placeholder="e.g. Physics" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Date *</Label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Start Time</Label>
                  <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>End Time</Label>
                  <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Max Marks</Label>
                  <Input type="number" value={form.maxMarks} onChange={e => setForm(f => ({ ...f, maxMarks: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label>Pass Marks</Label>
                  <Input type="number" value={form.passMarks} onChange={e => setForm(f => ({ ...f, passMarks: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label>Examiner</Label>
                  <Input placeholder="Optional" value={form.examiner} onChange={e => setForm(f => ({ ...f, examiner: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Exam["status"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button className="bg-[#0D7C8F] hover:bg-[#0b6b7c]" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Exam"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by exam name, subject or class..."
                  className="pl-10"
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                />
              </div>
              <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Confirm Delete */}
        <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-[360px]">
            <DialogHeader><DialogTitle>Delete Exam</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Delete <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>? This cannot be undone.</p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">{loading ? "Loading..." : `${filtered.length} Exam${filtered.length !== 1 ? "s" : ""}`}</CardTitle>
          </CardHeader>
          {loading && <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>}
          {!loading && <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Exam Name</TableHead>
                <TableHead>Class / Board</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Marks (Max/Pass)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map(exam => (
                <TableRow key={exam.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-semibold text-[#1E2A4A]">{exam.name}</TableCell>
                  <TableCell>Class {exam.class} / {exam.board}</TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>
                    <div className="text-sm">{exam.date}</div>
                    {exam.startTime && <div className="text-xs text-muted-foreground">{exam.startTime} – {exam.endTime}</div>}
                  </TableCell>
                  <TableCell>{exam.maxMarks} / {exam.passMarks}</TableCell>
                  <TableCell>
                    <Badge className={exam.status === "Scheduled" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : "bg-green-100 text-green-800 hover:bg-green-100"}>
                      {exam.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={() => openModal(exam)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700" asChild>
                        <Link href={`/admin/examination/marks?examId=${exam.id}`}>
                          <BookOpen className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteTarget(exam)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No exams found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>}
        </Card>
      </main>
    </div>
  );
}
