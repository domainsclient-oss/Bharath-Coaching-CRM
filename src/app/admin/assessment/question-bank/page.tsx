"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, PlusCircle, Edit, Trash2,
  BookOpen, HelpCircle, AlignLeft, ToggleLeft, Search,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";
import type { Question, QuestionType, DifficultyLevel } from "@/data/assessmentData";

// ── constants ──────────────────────────────────────────────────────────────────
const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "History", "Geography", "Computer Science"];
const CLASSES  = ["6", "7", "8", "9", "10", "11", "12"];

const TYPE_COLORS: Record<QuestionType, string> = {
  MCQ:            "bg-blue-100 text-blue-700",
  "Short Answer": "bg-purple-100 text-purple-700",
  "True/False":   "bg-teal-100 text-teal-700",
};
const DIFF_COLORS: Record<DifficultyLevel, string> = {
  Easy:   "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard:   "bg-red-100 text-red-700",
};

// ── zod schema ─────────────────────────────────────────────────────────────────
const questionSchema = z.object({
  subject:       z.string().min(1, "Subject is required"),
  class:         z.string().min(1, "Class is required"),
  type:          z.enum(["MCQ", "Short Answer", "True/False"]),
  question:      z.string().min(5, "Question text is too short"),
  options:       z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  marks:         z.coerce.number().min(1, "Marks must be ≥ 1"),
  difficulty:    z.enum(["Easy", "Medium", "Hard"]),
}).refine(d => {
  if (d.type === "MCQ") return d.options?.length === 4 && d.options.every(o => o.length > 0);
  return true;
}, { message: "MCQ must have 4 non-empty options", path: ["options"] });

type FormData = z.infer<typeof questionSchema>;

// ── component ─────────────────────────────────────────────────────────────────
export default function QuestionBankPage() {
  const { currentBranch } = useBranch();

  const { data: questions, loading: questionsLoading } = useFirestoreCollection<Question>(
    "questions", currentBranch,
  );

  const [filters, setFilters]   = useState({ class: "all", subject: "all", type: "all", difficulty: "all", search: "" });
  const [isOpen, setIsOpen]     = useState(false);
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: { type: "MCQ", difficulty: "Medium", marks: 1, options: ["", "", "", ""] },
  });
  const qType = useWatch({ control, name: "type" });

  // ── KPI counts ───────────────────────────────────────────────────────────────
  const kpi = useMemo(() => ({
    total:  questions.length,
    mcq:    questions.filter(q => q.type === "MCQ").length,
    short:  questions.filter(q => q.type === "Short Answer").length,
    tf:     questions.filter(q => q.type === "True/False").length,
    easy:   questions.filter(q => q.difficulty === "Easy").length,
    medium: questions.filter(q => q.difficulty === "Medium").length,
    hard:   questions.filter(q => q.difficulty === "Hard").length,
  }), [questions]);

  // ── filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = filters.search.toLowerCase();
    return questions.filter(q =>
      (filters.class      !== "all" ? q.class      === filters.class      : true) &&
      (filters.subject    !== "all" ? q.subject     === filters.subject    : true) &&
      (filters.type       !== "all" ? q.type        === filters.type       : true) &&
      (filters.difficulty !== "all" ? q.difficulty  === filters.difficulty : true) &&
      (s                            ? q.question.toLowerCase().includes(s) : true),
    );
  }, [questions, filters]);

  const setFilter = (key: keyof typeof filters, val: string) =>
    setFilters(prev => ({ ...prev, [key]: val }));

  // ── open add/edit dialog ─────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingQ(null);
    reset({ type: "MCQ", difficulty: "Medium", marks: 1, options: ["", "", "", ""], subject: "", class: "", question: "", correctAnswer: "" });
    setIsOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditingQ(q);
    reset({ ...q, options: q.options ?? ["", "", "", ""] } as FormData);
    setIsOpen(true);
  };

  const closeDialog = () => { setIsOpen(false); setEditingQ(null); reset(); };

  // ── save to Firestore ─────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = { ...data, branchId: currentBranch };
      if (editingQ) {
        await updateDocument("questions", editingQ.id, payload);
        toast({ title: "Question updated", description: "Changes saved successfully." });
      } else {
        await addDocument("questions", payload);
        toast({ title: "Question added", description: "New question added to the bank." });
      }
      closeDialog();
    } catch {
      toast({ title: "Error", description: "Could not save question.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── delete from Firestore ─────────────────────────────────────────────────────
  const confirmDelete = (id: string) => setDeletingId(id);
  const doDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteDocument("questions", deletingId);
      toast({ title: "Question deleted", description: "The question has been removed.", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Could not delete question.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Question Bank" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/assessment/create" className="hover:text-[#0D7C8F]">Online Assessment</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Question Bank</span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Questions", value: kpi.total,  icon: BookOpen,   color: "text-[#1E2A4A]",  bg: "bg-blue-100"   },
            { label: "MCQ",             value: kpi.mcq,    icon: HelpCircle, color: "text-blue-600",   bg: "bg-blue-100"   },
            { label: "Short Answer",    value: kpi.short,  icon: AlignLeft,  color: "text-purple-600", bg: "bg-purple-100" },
            { label: "True / False",    value: kpi.tf,     icon: ToggleLeft, color: "text-teal-600",   bg: "bg-teal-100"   },
          ].map(c => {
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

        {/* Difficulty mini-row */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Easy",   value: kpi.easy,   cls: "bg-green-100 text-green-700" },
            { label: "Medium", value: kpi.medium, cls: "bg-amber-100 text-amber-700" },
            { label: "Hard",   value: kpi.hard,   cls: "bg-red-100 text-red-700"     },
          ].map(d => (
            <div key={d.label} className={`px-4 py-2 rounded-lg text-sm font-semibold ${d.cls}`}>
              {d.label}: {d.value}
            </div>
          ))}
        </div>

        {/* Filters + Add */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  className="pl-9"
                  value={filters.search}
                  onChange={e => setFilter("search", e.target.value)}
                />
              </div>

              <Select value={filters.class} onValueChange={v => setFilter("class", v)}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {CLASSES.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filters.subject} onValueChange={v => setFilter("subject", v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filters.type} onValueChange={v => setFilter("type", v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="MCQ">MCQ</SelectItem>
                  <SelectItem value="Short Answer">Short Answer</SelectItem>
                  <SelectItem value="True/False">True / False</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.difficulty} onValueChange={v => setFilter("difficulty", v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A] gap-2 ml-auto" onClick={openAdd}>
                <PlusCircle className="h-4 w-4" /> Add Question
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-3 px-6">
            <CardTitle className="text-base font-bold text-[#1E2A4A]">
              {questionsLoading ? "Loading..." : `Questions — ${filtered.length} of ${questions.length}`}
            </CardTitle>
          </CardHeader>

          {questionsLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-8 text-center">#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="w-28">Subject</TableHead>
                  <TableHead className="w-20 text-center">Class</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead className="w-24">Difficulty</TableHead>
                  <TableHead className="w-16 text-center">Marks</TableHead>
                  <TableHead className="w-20 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      {questions.length === 0
                        ? 'No questions yet. Click "Add Question" to get started.'
                        : "No questions match the current filters."}
                    </TableCell>
                  </TableRow>
                ) : filtered.map((q, idx) => (
                  <TableRow key={q.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-[#1E2A4A] line-clamp-2 max-w-md">{q.question}</p>
                      {q.options && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {q.options.slice(0, 2).join(" / ")}…
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{q.subject}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">Cls {q.class}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${TYPE_COLORS[q.type]}`}>{q.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${DIFF_COLORS[q.difficulty]}`}>{q.difficulty}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-[#1E2A4A]">{q.marks}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-700" onClick={() => openEdit(q)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => confirmDelete(q.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!questionsLoading && filtered.length > 0 && (
            <div className="bg-slate-50 border-t px-6 py-2 text-xs text-muted-foreground">
              Showing {filtered.length} question{filtered.length !== 1 ? "s" : ""}
            </div>
          )}
        </Card>
      </main>

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={isOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">
              {editingQ ? "Edit Question" : "Add New Question"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Row 1: subject / class / type */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Subject</Label>
                <Controller name="subject" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.subject && <p className="text-red-500 text-xs">{errors.subject.message}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Class</Label>
                <Controller name="class" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {CLASSES.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.class && <p className="text-red-500 text-xs">{errors.class.message}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Type</Label>
                <Controller name="type" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ">MCQ</SelectItem>
                      <SelectItem value="Short Answer">Short Answer</SelectItem>
                      <SelectItem value="True/False">True / False</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            {/* Question text */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Question Text</Label>
              <Textarea placeholder="Enter the question..." rows={2} {...register("question")} />
              {errors.question && <p className="text-red-500 text-xs">{errors.question.message}</p>}
            </div>

            {/* MCQ options */}
            {qType === "MCQ" && (
              <div className="space-y-3 p-4 border rounded-lg bg-slate-50">
                <Label className="text-xs font-semibold">Options</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map(i => (
                    <Input key={i} placeholder={`Option ${i + 1}`} {...register(`options.${i}`)} />
                  ))}
                </div>
                {errors.options && <p className="text-red-500 text-xs">{errors.options.message as string}</p>}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Correct Answer</Label>
                  <Controller name="correctAnswer" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select correct option" /></SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3].map(i => <SelectItem key={i} value={String(i)}>Option {i + 1}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </div>
            )}

            {/* True/False */}
            {qType === "True/False" && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Correct Answer</Label>
                <Controller name="correctAnswer" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="True or False?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="True">True</SelectItem>
                      <SelectItem value="False">False</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
            )}

            {/* Short Answer */}
            {qType === "Short Answer" && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Ideal Answer</Label>
                <Textarea placeholder="Enter the model answer..." rows={3} {...register("correctAnswer")} />
              </div>
            )}
            {errors.correctAnswer && <p className="text-red-500 text-xs">{errors.correctAnswer.message}</p>}

            {/* Marks + difficulty */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Marks</Label>
                <Input type="number" min={1} {...register("marks")} />
                {errors.marks && <p className="text-red-500 text-xs">{errors.marks.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Difficulty</Label>
                <Controller name="difficulty" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" disabled={saving}>
                {saving ? "Saving..." : editingQ ? "Save Changes" : "Add Question"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ────────────────────────────────────────── */}
      <Dialog open={!!deletingId} onOpenChange={v => { if (!v) setDeletingId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Delete Question</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this question? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
