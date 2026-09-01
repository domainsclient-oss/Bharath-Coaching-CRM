"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Copy, CheckCheck } from 'lucide-react';
import { SharedHeader } from "@/components/layout/shared-header";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

type Category = 'Fees' | 'Academic' | 'Event' | 'General' | 'Attendance';

interface Template {
  id: string;
  name: string;
  category: Category;
  body: string;
  usageCount: number;
  branchId: string;
}

const CATEGORY_COLORS: Record<Category, string> = {
  Fees:       'bg-red-100 text-red-700',
  Academic:   'bg-blue-100 text-blue-700',
  Event:      'bg-purple-100 text-purple-700',
  General:    'bg-gray-100 text-gray-700',
  Attendance: 'bg-yellow-100 text-yellow-700',
};

const EMPTY = { name: '', category: 'General' as Category, body: '' };

export default function WhatsAppTemplatesPage() {
  const { currentBranch } = useBranch();
  const { data: templates, loading } = useFirestoreCollection<Template>("whatsappTemplates", currentBranch);

  const [showDialog,    setShowDialog]    = useState(false);
  const [editItem,      setEditItem]      = useState<Template | null>(null);
  const [form,          setForm]          = useState(EMPTY);
  const [saving,        setSaving]        = useState(false);
  const [copied,        setCopied]        = useState<string | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<Template | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const openNew = () => { setEditItem(null); setForm(EMPTY); setShowDialog(true); };
  const openEdit = (t: Template) => {
    setEditItem(t);
    setForm({ name: t.name, category: t.category, body: t.body });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast({ title: "Name and message body are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await updateDocument("whatsappTemplates", editItem.id, {
          name: form.name.trim(), category: form.category, body: form.body.trim(),
        });
        toast({ title: "Template updated" });
      } else {
        await addDocument("whatsappTemplates", {
          name: form.name.trim(), category: form.category, body: form.body.trim(),
          usageCount: 0, branchId: currentBranch,
        });
        toast({ title: "Template saved" });
      }
      setShowDialog(false);
    } catch {
      toast({ title: "Error", description: "Failed to save template.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument("whatsappTemplates", deleteTarget.id);
      toast({ title: "Deleted", description: `"${deleteTarget.name}" removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = (id: string, body: string) => {
    navigator.clipboard.writeText(body).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Message Templates" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E2A4A]">Message Templates</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage reusable WhatsApp message templates</p>
          </div>
          <Button onClick={openNew} className="bg-[#0D7C8F] hover:bg-[#0D7C8F]/90">
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(['Fees', 'Academic', 'Event', 'General', 'Attendance'] as Category[]).map(cat => (
            <Card key={cat}>
              <CardContent className="p-3 text-center">
                {loading
                  ? <Skeleton className="h-7 w-6 mx-auto mb-1" />
                  : <p className="text-xl font-bold">{templates.filter(t => t.category === cat).length}</p>
                }
                <p className="text-xs text-muted-foreground">{cat}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-3 w-40 mt-2" />
                </CardContent>
              </Card>
            ))
          ) : templates.length === 0 ? (
            <div className="col-span-2 py-16 text-center text-muted-foreground">
              No templates yet. Click &quot;New Template&quot; to create one.
            </div>
          ) : templates.map(t => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold text-[#1E2A4A]">{t.name}</CardTitle>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[t.category]}`}>{t.category}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(t.id, t.body)}>
                      {copied === t.id ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteTarget(t)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-sm text-slate-600 leading-relaxed">{t.body}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Used {t.usageCount ?? 0} times · <code className="bg-slate-100 px-1 rounded">{'{name}'}</code> for personalisation
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add / Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={v => !v && setShowDialog(false)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Template' : 'New Message Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Template Name *</Label>
                  <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Fee Reminder" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => set('category', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fees">Fees</SelectItem>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Event">Event</SelectItem>
                      <SelectItem value="Attendance">Attendance</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Message Body *</Label>
                <Textarea
                  rows={5}
                  value={form.body}
                  onChange={e => set('body', e.target.value)}
                  placeholder="Type your template message... Use {name} to personalise."
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-slate-100 px-1 rounded">{'{name}'}</code> to insert the recipient&apos;s first name.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button className="bg-[#0D7C8F] hover:bg-[#0D7C8F]/90" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editItem ? 'Update' : 'Save Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Template</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{deleteTarget?.name}&quot;</span>? This cannot be undone.
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
