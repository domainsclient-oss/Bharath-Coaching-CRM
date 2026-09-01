"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, FileText, Edit, Trash2, BookOpen, Clock, User } from 'lucide-react';
import { SharedHeader } from "@/components/layout/shared-header";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  className: string;
  teacher: string;
  date: string;
  duration: string;
  status: 'Draft' | 'Approved' | 'Completed';
  objectives: string;
  topics: string;
  branchId: string;
}

const STATUS_COLORS: Record<string, string> = {
  Draft:     'bg-yellow-100 text-yellow-700',
  Approved:  'bg-green-100 text-green-700',
  Completed: 'bg-blue-100 text-blue-700',
};

const EMPTY_FORM = {
  title: '', subject: '', className: '', teacher: '',
  date: '', duration: '45 min', objectives: '', topics: '', status: 'Draft' as LessonPlan['status'],
};

export default function LessonPlansPage() {
  const { currentBranch } = useBranch();

  const { data: plans, loading } = useFirestoreCollection<LessonPlan>("lessonPlans", currentBranch);

  const [search,         setSearch]         = useState('');
  const [filterSubject,  setFilterSubject]  = useState('all');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterClass,    setFilterClass]    = useState('all');
  const [showDialog,     setShowDialog]     = useState(false);
  const [editPlan,       setEditPlan]       = useState<LessonPlan | null>(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [saving,         setSaving]         = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState<LessonPlan | null>(null);
  const [deleting,       setDeleting]       = useState(false);

  const subjects = useMemo(() => Array.from(new Set(plans.map(p => p.subject))).sort(), [plans]);
  const classes  = useMemo(() => Array.from(new Set(plans.map(p => p.className))).sort(), [plans]);

  const filtered = useMemo(() => plans.filter(p => {
    const matchSearch  = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.teacher.toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject === 'all' || p.subject === filterSubject;
    const matchStatus  = filterStatus  === 'all' || p.status  === filterStatus;
    const matchClass   = filterClass   === 'all' || p.className === filterClass;
    return matchSearch && matchSubject && matchStatus && matchClass;
  }), [plans, search, filterSubject, filterStatus, filterClass]);

  const stats = useMemo(() => ({
    total:     plans.length,
    approved:  plans.filter(p => p.status === 'Approved').length,
    draft:     plans.filter(p => p.status === 'Draft').length,
    completed: plans.filter(p => p.status === 'Completed').length,
  }), [plans]);

  const openNew = () => { setEditPlan(null); setForm(EMPTY_FORM); setShowDialog(true); };
  const openEdit = (plan: LessonPlan) => {
    setEditPlan(plan);
    setForm({ title: plan.title, subject: plan.subject, className: plan.className, teacher: plan.teacher, date: plan.date, duration: plan.duration, objectives: plan.objectives, topics: plan.topics, status: plan.status });
    setShowDialog(true);
  };

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editPlan) {
        await updateDocument("lessonPlans", editPlan.id, {
          title: form.title.trim(), subject: form.subject.trim(),
          className: form.className.trim(), teacher: form.teacher.trim(),
          date: form.date, duration: form.duration,
          objectives: form.objectives.trim(), topics: form.topics.trim(),
          status: form.status,
        });
        toast({ title: "Updated", description: form.title.trim() });
      } else {
        await addDocument("lessonPlans", {
          ...form,
          title:     form.title.trim(),
          subject:   form.subject.trim(),
          className: form.className.trim(),
          teacher:   form.teacher.trim(),
          objectives: form.objectives.trim(),
          topics:    form.topics.trim(),
          branchId:  currentBranch,
        });
        toast({ title: "Lesson Plan Added", description: form.title.trim() });
      }
      setShowDialog(false);
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument("lessonPlans", deleteTarget.id);
      toast({ title: "Deleted", description: `"${deleteTarget.title}" removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Lesson Plans" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E2A4A]">Lesson Plans</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage and track teaching lesson plans</p>
          </div>
          <Button onClick={openNew} className="bg-[#0D7C8F] hover:bg-[#0D7C8F]/90">
            <Plus className="h-4 w-4 mr-2" /> Add Lesson Plan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Plans', value: stats.total,     icon: FileText, color: 'text-blue-600' },
            { label: 'Approved',    value: stats.approved,  icon: BookOpen, color: 'text-green-600' },
            { label: 'Draft',       value: stats.draft,     icon: Edit,     color: 'text-yellow-600' },
            { label: 'Completed',   value: stats.completed, icon: Clock,    color: 'text-gray-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  {loading
                    ? <Skeleton className="h-7 w-8 mb-1" />
                    : <p className="text-2xl font-bold">{s.value}</p>
                  }
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by title or teacher..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Subjects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            {loading
              ? <Skeleton className="h-5 w-40" />
              : <CardTitle className="text-base">Lesson Plans ({filtered.length})</CardTitle>
            }
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    {['Title', 'Subject', 'Class', 'Teacher', 'Date', 'Duration', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-slate-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b">
                        {[...Array(8)].map((__, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-muted-foreground">
                        No lesson plans found.
                      </td>
                    </tr>
                  ) : filtered.map(plan => (
                    <tr key={plan.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1E2A4A]">{plan.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{plan.topics}</p>
                      </td>
                      <td className="px-4 py-3">{plan.subject}</td>
                      <td className="px-4 py-3">{plan.className}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground" />{plan.teacher}
                        </div>
                      </td>
                      <td className="px-4 py-3">{plan.date}</td>
                      <td className="px-4 py-3">{plan.duration}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[plan.status]}`}>{plan.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(plan)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => setDeleteTarget(plan)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Add / Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={v => !v && setShowDialog(false)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editPlan ? 'Edit Lesson Plan' : 'Add New Lesson Plan'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2 space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Lesson title..." />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Mathematics" />
              </div>
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Input value={form.className} onChange={e => set('className', e.target.value)} placeholder="e.g. Class 10" />
              </div>
              <div className="space-y-1.5">
                <Label>Teacher</Label>
                <Input value={form.teacher} onChange={e => set('teacher', e.target.value)} placeholder="Teacher name" />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Select value={form.duration} onValueChange={v => set('duration', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30 min">30 min</SelectItem>
                    <SelectItem value="45 min">45 min</SelectItem>
                    <SelectItem value="60 min">60 min</SelectItem>
                    <SelectItem value="90 min">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Topics Covered</Label>
                <Input value={form.topics} onChange={e => set('topics', e.target.value)} placeholder="e.g. Variables, Expressions, Equations" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Learning Objectives</Label>
                <Textarea rows={3} value={form.objectives} onChange={e => set('objectives', e.target.value)} placeholder="What students will learn from this lesson..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button className="bg-[#0D7C8F] hover:bg-[#0D7C8F]/90" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editPlan ? 'Update' : 'Add Lesson Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Lesson Plan</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{deleteTarget?.title}&quot;</span>? This cannot be undone.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
