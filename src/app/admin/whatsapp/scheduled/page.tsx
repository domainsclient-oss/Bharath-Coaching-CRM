"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Clock, Send, CheckCheck, XCircle } from 'lucide-react';
import { SharedHeader } from "@/components/layout/shared-header";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

type ScheduleStatus = 'Scheduled' | 'Sent' | 'Cancelled';

interface ScheduledMessage {
  id: string;
  template: string;
  group: string;
  scheduledFor: string;
  message: string;
  status: ScheduleStatus;
  recipientCount: number;
  branchId: string;
}

interface BroadcastLog {
  id: string;
  sentCount: number;
  branchId: string;
}

const STATUS_ICONS: Record<ScheduleStatus, React.ReactNode> = {
  Scheduled: <Clock className="h-4 w-4 text-blue-600" />,
  Sent:      <CheckCheck className="h-4 w-4 text-green-600" />,
  Cancelled: <XCircle className="h-4 w-4 text-red-500" />,
};
const STATUS_COLORS: Record<ScheduleStatus, string> = {
  Scheduled: 'bg-blue-100 text-blue-700',
  Sent:      'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const GROUPS = ['All Parents', 'All Students', 'All Students & Parents', 'Staff', 'Class 9 Parents', 'Class 10 Parents', 'Class 11 Parents', 'Class 12 Parents'];
const EMPTY = { template: '', group: '', scheduledFor: '', message: '', recipientCount: '' };

export default function ScheduledMessagesPage() {
  const { currentBranch } = useBranch();
  const { data: messages, loading } = useFirestoreCollection<ScheduledMessage>("scheduledMessages", currentBranch);
  const { data: broadcasts, loading: logsLoading } = useFirestoreCollection<BroadcastLog>("broadcastHistory", currentBranch);

  const [filterStatus,  setFilterStatus]  = useState('all');
  const [showDialog,    setShowDialog]    = useState(false);
  const [editItem,      setEditItem]      = useState<ScheduledMessage | null>(null);
  const [form,          setForm]          = useState(EMPTY);
  const [saving,        setSaving]        = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState<ScheduledMessage | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const filtered = useMemo(() =>
    messages.filter(m => filterStatus === 'all' || m.status === filterStatus),
    [messages, filterStatus]
  );

  const stats = useMemo(() => ({
    scheduled: messages.filter(m => m.status === 'Scheduled').length,
    sent:      broadcasts.length,
    cancelled: messages.filter(m => m.status === 'Cancelled').length,
  }), [messages, broadcasts]);

  const openNew = () => { setEditItem(null); setForm(EMPTY); setShowDialog(true); };
  const openEdit = (m: ScheduledMessage) => {
    setEditItem(m);
    setForm({ template: m.template, group: m.group, scheduledFor: m.scheduledFor, message: m.message, recipientCount: String(m.recipientCount ?? '') });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.template.trim() || !form.group || !form.scheduledFor || !form.message.trim()) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await updateDocument("scheduledMessages", editItem.id, {
          template: form.template.trim(),
          group: form.group,
          scheduledFor: form.scheduledFor,
          message: form.message.trim(),
          recipientCount: Number(form.recipientCount) || 0,
        });
        toast({ title: "Updated" });
      } else {
        await addDocument("scheduledMessages", {
          template: form.template.trim(),
          group: form.group,
          scheduledFor: form.scheduledFor,
          message: form.message.trim(),
          recipientCount: Number(form.recipientCount) || 0,
          status: 'Scheduled' as ScheduleStatus,
          branchId: currentBranch,
        });
        toast({ title: "Message scheduled" });
      }
      setShowDialog(false);
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (m: ScheduledMessage) => {
    try {
      await updateDocument("scheduledMessages", m.id, { status: 'Cancelled' });
      toast({ title: "Cancelled", description: `"${m.template}" has been cancelled.` });
    } catch {
      toast({ title: "Error", description: "Failed to cancel.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument("scheduledMessages", deleteTarget.id);
      toast({ title: "Deleted" });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Scheduled Messages" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E2A4A]">Scheduled Messages</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Schedule WhatsApp messages for future delivery</p>
          </div>
          <Button onClick={openNew} className="bg-[#0D7C8F] hover:bg-[#0D7C8F]/90">
            <Plus className="h-4 w-4 mr-2" /> Schedule Message
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Scheduled',        value: stats.scheduled, icon: Clock,   color: 'text-blue-600',  isLoading: loading },
            { label: 'Total Broadcasts', value: stats.sent,      icon: Send,    color: 'text-green-600', isLoading: logsLoading },
            { label: 'Cancelled',        value: stats.cancelled, icon: XCircle, color: 'text-red-600',   isLoading: loading },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  {s.isLoading
                    ? <Skeleton className="h-7 w-8 mb-1" />
                    : <p className="text-2xl font-bold">{s.value}</p>
                  }
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="p-4 flex gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scheduled Messages ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    {['Template', 'Group', 'Scheduled For', 'Recipients', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-slate-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="border-b">
                        {[...Array(6)].map((__, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No messages found.</td></tr>
                  ) : filtered.map(m => (
                    <tr key={m.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1E2A4A]">{m.template}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{m.message.substring(0, 60)}…</p>
                      </td>
                      <td className="px-4 py-3">{m.group}</td>
                      <td className="px-4 py-3">{m.scheduledFor}</td>
                      <td className="px-4 py-3">{m.recipientCount || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {STATUS_ICONS[m.status]}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {m.status === 'Scheduled' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-yellow-600" onClick={() => handleCancel(m)} title="Cancel">
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteTarget(m)}>
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
              <DialogTitle>{editItem ? 'Edit Scheduled Message' : 'Schedule New Message'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Template Name *</Label>
                  <Input value={form.template} onChange={e => set('template', e.target.value)} placeholder="e.g. Fee Reminder" />
                </div>
                <div className="space-y-1.5">
                  <Label>Recipient Group *</Label>
                  <Select value={form.group} onValueChange={v => set('group', v)}>
                    <SelectTrigger><SelectValue placeholder="Select group..." /></SelectTrigger>
                    <SelectContent>
                      {GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Scheduled Date & Time *</Label>
                  <Input type="datetime-local" value={form.scheduledFor} onChange={e => set('scheduledFor', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Recipient Count</Label>
                  <Input type="number" min={0} value={form.recipientCount} onChange={e => set('recipientCount', e.target.value)} placeholder="e.g. 120" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Message *</Label>
                <Textarea rows={4} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Message body... Use {name} for personalisation." className="resize-none" />
                <p className="text-xs text-muted-foreground">Use <code className="bg-slate-100 px-1 rounded">{'{name}'}</code> to insert the recipient&apos;s first name.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button className="bg-[#0D7C8F] hover:bg-[#0D7C8F]/90" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editItem ? 'Update' : 'Schedule Message'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Scheduled Message</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the scheduled message for <span className="font-semibold text-foreground">&quot;{deleteTarget?.group}&quot;</span>? This cannot be undone.
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
