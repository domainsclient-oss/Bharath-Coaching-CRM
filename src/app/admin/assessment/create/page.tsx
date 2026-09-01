"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Plus, BookOpen, Clock, CheckCircle2,
  Trash2, Edit2, Eye, Save, ListChecks, ChevronLeft,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Question, OnlineExam } from "@/data/assessmentData";

// ── constants ──────────────────────────────────────────────────────────────────
const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Economics", "Computer Science"];
const CLASSES  = ["8", "9", "10", "11", "12"];

const STATUS_STYLE: Record<string, string> = {
  Draft:     "bg-slate-100 text-slate-600 border-slate-200",
  Published: "bg-green-100 text-green-700 border-green-200",
  Completed: "bg-blue-100 text-blue-700 border-blue-200",
};

const DIFF_STYLE: Record<string, string> = {
  Easy:   "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard:   "bg-red-100 text-red-600",
};

const BLANK_FORM = {
  title: "", class: "", subject: "", dateTime: "",
  durationMins: 30, instructions: "",
  status: "Draft" as "Draft" | "Published",
};

// ── component ──────────────────────────────────────────────────────────────────
export default function OnlineExamPage() {
  const { currentBranch } = useBranch();

  const { data: exams, loading: examsLoading } = useFirestoreCollection<OnlineExam>(
    "onlineExams", currentBranch, { orderByField: "dateTime", orderByDir: "desc" },
  );
  const { data: allQuestions, loading: questionsLoading } = useFirestoreCollection<Question>(
    "questions", currentBranch,
  );

  const [showCreate, setShowCreate]     = useState(false);
  const [step, setStep]                 = useState<1 | 2>(1);
  const [form, setForm]                 = useState({ ...BLANK_FORM });
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [viewExam, setViewExam]         = useState<OnlineExam | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OnlineExam | null>(null);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);

  // Questions matching selected class
  const availableQs = useMemo(
    () => allQuestions.filter(q => q.class === form.class),
    [allQuestions, form.class],
  );

  const selectedQs   = useMemo(() => availableQs.filter(q => selectedQIds.includes(q.id)), [availableQs, selectedQIds]);
  const totalMarks   = selectedQs.reduce((s, q) => s + q.marks, 0);

  const toggleQ = (id: string) =>
    setSelectedQIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const openCreate = () => {
    setForm({ ...BLANK_FORM });
    setSelectedQIds([]);
    setEditingId(null);
    setStep(1);
    setShowCreate(true);
  };

  const openEdit = (exam: OnlineExam) => {
    setForm({
      title: exam.title, class: exam.class, subject: exam.subject,
      dateTime: exam.dateTime, durationMins: exam.durationMins,
      instructions: exam.instructions ?? "",
      status: exam.status === "Completed" ? "Published" : exam.status,
    });
    setSelectedQIds(exam.questionIds);
    setEditingId(exam.id);
    setStep(1);
    setShowCreate(true);
  };

  const handleSave = async (status: "Draft" | "Published") => {
    if (!form.title || !form.class || !form.subject || !form.dateTime) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    if (selectedQIds.length === 0) {
      toast({ title: "Select at least one question", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title, class: form.class, subject: form.subject,
        dateTime: form.dateTime, durationMins: form.durationMins,
        instructions: form.instructions || "",
        questionIds: selectedQIds, totalMarks, status,
        branchId: currentBranch,
      };
      if (editingId) {
        await updateDocument("onlineExams", editingId, payload);
        toast({ title: "Exam Updated", description: `${form.title} saved as ${status}.` });
      } else {
        await addDocument("onlineExams", payload);
        toast({ title: status === "Published" ? "Exam Published!" : "Exam Saved as Draft", description: form.title });
      }
      setShowCreate(false);
    } catch {
      toast({ title: "Error", description: "Could not save exam.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument("onlineExams", deleteTarget.id);
      toast({ title: "Exam Deleted", description: `"${deleteTarget.title}" removed.` });
    } catch {
      toast({ title: "Error", description: "Could not delete exam.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // KPI
  const published = exams.filter(e => e.status === "Published").length;
  const draft     = exams.filter(e => e.status === "Draft").length;
  const completed = exams.filter(e => e.status === "Completed").length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Online Exam" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/assessment" className="hover:text-[#0D7C8F]">Assessment</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Online Exam</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Online Exams</h2>
          <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Exam
          </Button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Exams", value: exams.length, color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: BookOpen     },
            { label: "Published",   value: published,    color: "text-green-600", bg: "bg-green-100", icon: CheckCircle2 },
            { label: "Draft",       value: draft,        color: "text-slate-600", bg: "bg-slate-100", icon: Edit2        },
            { label: "Completed",   value: completed,    color: "text-[#0D7C8F]", bg: "bg-teal-100",  icon: Eye          },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
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

        {/* Exam List */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">
              {examsLoading ? "Loading..." : `${exams.length} Exam${exams.length !== 1 ? "s" : ""}`}
            </CardTitle>
          </CardHeader>

          {examsLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Class / Subject</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead className="text-center">Marks</TableHead>
                  <TableHead className="text-center">Duration</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No exams yet. Click "Create Exam" to get started.
                    </TableCell>
                  </TableRow>
                ) : exams.map(exam => (
                  <TableRow key={exam.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-sm text-[#1E2A4A]">{exam.title}</TableCell>
                    <TableCell className="text-sm">Class {exam.class} • {exam.subject}</TableCell>
                    <TableCell className="text-center font-semibold">{exam.questionIds.length}</TableCell>
                    <TableCell className="text-center font-semibold text-[#0D7C8F]">{exam.totalMarks}</TableCell>
                    <TableCell className="text-center text-sm">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" /> {exam.durationMins} min
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(exam.dateTime).toLocaleString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-xs ${STATUS_STYLE[exam.status]}`}>{exam.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewExam(exam)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => openEdit(exam)} disabled={exam.status === "Completed"}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600"
                          onClick={() => setDeleteTarget(exam)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* ── Create / Edit Dialog ── */}
        <Dialog open={showCreate} onOpenChange={v => { if (!v) setShowCreate(false); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingId ? "Edit Exam" : "Create New Exam"}
                <Badge variant="outline" className="text-xs">Step {step} of 2</Badge>
              </DialogTitle>
            </DialogHeader>

            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("flex items-center gap-1.5 font-medium", step === 1 ? "text-[#1E2A4A]" : "text-muted-foreground")}>
                <span className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold", step === 1 ? "bg-[#1E2A4A] text-white" : "bg-green-100 text-green-600")}>
                  {step > 1 ? "✓" : "1"}
                </span>
                Exam Details
              </span>
              <div className="flex-1 h-px bg-slate-200" />
              <span className={cn("flex items-center gap-1.5 font-medium", step === 2 ? "text-[#1E2A4A]" : "text-muted-foreground")}>
                <span className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold", step === 2 ? "bg-[#1E2A4A] text-white" : "bg-slate-100 text-slate-400")}>2</span>
                Select Questions
              </span>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Exam Title *</Label>
                  <Input placeholder="e.g. Physics Unit Test — Chapter 1"
                    value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Class *</Label>
                    <Select value={form.class} onValueChange={v => { setForm(p => ({ ...p, class: v })); setSelectedQIds([]); }}>
                      <SelectTrigger><SelectValue placeholder="Select class..." /></SelectTrigger>
                      <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Subject *</Label>
                    <Select value={form.subject} onValueChange={v => setForm(p => ({ ...p, subject: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select subject..." /></SelectTrigger>
                      <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Date & Time *</Label>
                    <Input type="datetime-local" value={form.dateTime}
                      onChange={e => setForm(p => ({ ...p, dateTime: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Duration (minutes) *</Label>
                    <Input type="number" min={5} value={form.durationMins}
                      onChange={e => setForm(p => ({ ...p, durationMins: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Instructions for Students</Label>
                  <Textarea rows={3} placeholder="e.g. Read all questions carefully. No negative marking."
                    value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {questionsLoading
                      ? "Loading questions..."
                      : `Questions for Class ${form.class} — ${availableQs.length} available`}
                  </p>
                  <div className="flex items-center gap-3 text-sm">
                    <span>Selected: <strong className="text-[#1E2A4A]">{selectedQIds.length}</strong></span>
                    <span>Total Marks: <strong className="text-[#0D7C8F]">{totalMarks}</strong></span>
                  </div>
                </div>

                {questionsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : availableQs.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-muted-foreground text-sm border rounded-lg bg-slate-50">
                    No questions found for Class {form.class} in the Question Bank.&nbsp;
                    <Link href="/admin/assessment/question-bank" className="text-[#0D7C8F] underline">Add questions</Link>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>Question</TableHead>
                          <TableHead className="w-24">Type</TableHead>
                          <TableHead className="w-16 text-center">Marks</TableHead>
                          <TableHead className="w-20 text-center">Difficulty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableQs.map(q => (
                          <TableRow
                            key={q.id}
                            className={cn("cursor-pointer hover:bg-slate-50/50", selectedQIds.includes(q.id) && "bg-blue-50/40")}
                            onClick={() => toggleQ(q.id)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedQIds.includes(q.id)}
                                onCheckedChange={() => toggleQ(q.id)}
                                onClick={e => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell className="text-sm font-medium text-[#1E2A4A] max-w-xs">
                              <p className="line-clamp-2">{q.question}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{q.type}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-semibold text-[#0D7C8F]">{q.marks}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={`text-xs ${DIFF_STYLE[q.difficulty]}`}>{q.difficulty}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex items-center justify-between flex-row w-full pt-2 gap-3">
              {step === 1 ? (
                <>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2"
                    onClick={() => setStep(2)}
                    disabled={!form.title || !form.class || !form.subject || !form.dateTime}
                  >
                    <ListChecks className="h-4 w-4" /> Select Questions
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="gap-2" onClick={() => setStep(1)}>
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleSave("Draft")}
                      disabled={selectedQIds.length === 0 || saving}>
                      Save as Draft
                    </Button>
                    <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A] gap-2"
                      onClick={() => handleSave("Published")}
                      disabled={selectedQIds.length === 0 || saving}>
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Publish Exam"}
                    </Button>
                  </div>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={!!viewExam} onOpenChange={v => { if (!v) setViewExam(null); }}>
          {viewExam && (
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{viewExam.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2 text-sm">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg p-4">
                  {([
                    ["Class",         `Class ${viewExam.class}`],
                    ["Subject",       viewExam.subject],
                    ["Duration",      `${viewExam.durationMins} minutes`],
                    ["Total Marks",   viewExam.totalMarks],
                    ["Questions",     viewExam.questionIds.length],
                    ["Status",        viewExam.status],
                  ] as [string, string | number][]).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs text-muted-foreground">{k}</p>
                      <p className="font-semibold text-[#1E2A4A]">{v}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Scheduled</p>
                  <p className="font-medium">
                    {new Date(viewExam.dateTime).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
                  </p>
                </div>
                {viewExam.instructions && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Instructions</p>
                    <p className="text-muted-foreground">{viewExam.instructions}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                {viewExam.status !== "Completed" && (
                  <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F]"
                    onClick={() => { openEdit(viewExam); setViewExam(null); }}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>

        {/* Confirm Delete Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Exam</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteTarget?.title}"</span>? This cannot be undone.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
