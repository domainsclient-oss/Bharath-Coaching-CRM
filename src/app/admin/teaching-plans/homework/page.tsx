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
import { Plus, Search, Edit, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { SharedHeader } from "@/components/layout/shared-header";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface Homework {
  id: string;
  title: string;
  subject: string;
  className: string;
  teacher: string;
  assignedDate: string;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Overdue';
  description: string;
  totalStudents: number;
  submitted: number;
  branchId: string;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Submitted: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  Pending:   <Clock        className="h-4 w-4 text-yellow-600" />,
  Overdue:   <AlertCircle  className="h-4 w-4 text-red-600" />,
};
const STATUS_COLORS: Record<string, string> = {
  Submitted: 'bg-green-100 text-green-700',
  Pending:   'bg-yellow-100 text-yellow-700',
  Overdue:   'bg-red-100 text-red-700',
};

const EMPTY = {
  title: '', subject: '', className: '', teacher: '',
  assignedDate: '', dueDate: '', description: '',
  status: 'Pending' as Homework['status'],
  totalStudents: 0, submitted: 0,
};

export default function HomeworkPage() {
  const { currentBranch } = useBranch();

  const { data: items, loading } = useFirestoreCollection<Homework>("homework", currentBranch);

  const [search,       setSearch]       = useState('');
  const [filterClass,  setFilterClass]  = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDialog,   setShowDialog]   = useState(false);
  const [editItem,     setEditItem]     = useState<Homework | null>(null);
  const [form,         setForm]         = useState(EMPTY);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Homework | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const classes = useMemo(() => Array.from(new Set(items.map(i => i.className))).sort(), [items]);

  const filtered = useMemo(() => items.filter(i => {
    const matchSearch  = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.teacher.toLowerCase().includes(search.toLowerCase());
    const matchClass   = filterClass  === 'all' || i.className === filterClass;
    const matchStatus  = filterStatus === 'all' || i.status    === filterStatus;
    return matchSearch && matchClass && matchStatus;
  }), [items, search, filterClass, filterStatus]);

  const stats = useMemo(() => ({
    total:     items.length,
    submitted: items.filter(i => i.status === 'Submitted').length,
    pending:   items.filter(i => i.status === 'Pending').length,
    overdue:   items.filter(i => i.status === 'Overdue').length,
  }), [items]);

  const set = (k: string, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  const openNew = () => { setEditItem(null); setForm(EMPTY); setShowDialog(true); };
  const openEdit = (hw: Homework) => {
    setEditItem(hw);
    setForm({ title: hw.title, subject: hw.subject, className: hw.className, teacher: hw.teacher, assignedDate: hw.assignedDate, dueDate: hw.dueDate, description: hw.description, status: hw.status, totalStudents: hw.totalStudents, submitted: hw.submitted });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await updateDocument("homework", editItem.id, {
          title: form.title.trim(), subject: form.subject.trim(),
          className: form.className.trim(), teacher: form.teacher.trim(),
          assignedDate: form.assignedDate, dueDate: form.dueDate,
          description: form.description.trim(), status: form.status,
          totalStudents: Number(form.totalStudents), submitted: Number(form.submitted),
        });
        toast({ title: "Updated", description: form.title.trim() });
      } else {
        await addDocument("homework", {
          title:         form.title.trim(),
          subject:       form.subject.trim(),
          className:     form.className.trim(),
          teacher:       form.teacher.trim(),
          assignedDate:  form.assignedDate,
          dueDate:       form.dueDate,
          description:   form.description.trim(),
          status:        form.status,
          totalStudents: Number(form.totalStudents),
          submitted:     Number(form.submitted),
          branchId:      currentBranch,
        });
        toast({ title: "Homework Assigned", description: form.title.trim() });
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
      await deleteDocument("homework", deleteTarget.id);
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
      <SharedHeader title="Homework" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E2A4A]">Homework</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Assign and track homework submissions</p>
          </div>
          <Button onClick={openNew} className="bg-[#0D7C8F] hover:bg-[#0D7C8F]/90">
            <Plus className="h-4 w-4 mr-2" /> Assign Homework
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Assigned', value: stats.total,     color: 'text-blue-600' },
            { label: 'Submitted',      value: stats.submitted, color: 'text-green-600' },
            { label: 'Pending',        value: stats.pending,   color: 'text-yellow-600' },
            { label: 'Overdue',        value: stats.overdue,   color: 'text-red-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4">
                {loading
                  ? <Skeleton className="h-7 w-8 mb-1" />
                  : <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                }
                <p className="text-xs text-muted-foreground">{s.label}</p>
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            {loading
              ? <Skeleton className="h-5 w-40" />
              : <CardTitle className="text-base">Homework List ({filtered.length})</CardTitle>
            }
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    {['Title', 'Subject', 'Class', 'Teacher', 'Due Date', 'Submission', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-slate-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="border-b">
                        {[...Array(8)].map((__, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No homework found.</td></tr>
                  ) : filtered.map(hw => (
                    <tr key={hw.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1E2A4A]">{hw.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{hw.description}</p>
                      </td>
                      <td className="px-4 py-3">{hw.subject}</td>
                      <td className="px-4 py-3">{hw.className}</td>
                      <td className="px-4 py-3">{hw.teacher}</td>
                      <td className="px-4 py-3">{hw.dueDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-16 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0D7C8F] rounded-full"
                              style={{ width: hw.totalStudents > 0 ? `${Math.round((hw.submitted / hw.totalStudents) * 100)}%` : '0%' }} />
                          </div>
                          <span className="text-xs">{hw.submitted}/{hw.totalStudents}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {STATUS_ICONS[hw.status]}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[hw.status]}`}>{hw.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(hw)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteTarget(hw)}>
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
              <DialogTitle>{editItem ? 'Edit Homework' : 'Assign Homework'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2 space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Homework title..." />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Mathematics" />
              </div>
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Input value={form.className} onChange={e => set('className', e.target.value)} placeholder="e.g. Class 9A" />
              </div>
              <div className="space-y-1.5">
                <Label>Teacher</Label>
                <Input value={form.teacher} onChange={e => set('teacher', e.target.value)} placeholder="Assigned by" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Assigned Date</Label>
                <Input type="date" value={form.assignedDate} onChange={e => set('assignedDate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Total Students</Label>
                <Input type="number" min="0" value={form.totalStudents} onChange={e => set('totalStudents', e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Submitted Count</Label>
                <Input type="number" min="0" value={form.submitted} onChange={e => set('submitted', e.target.value)} placeholder="0" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description / Instructions</Label>
                <Textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the homework task..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button className="bg-[#0D7C8F] hover:bg-[#0D7C8F]/90" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editItem ? 'Update' : 'Assign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Homework</DialogTitle></DialogHeader>
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
