"use client";

import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare, Send, Users, CheckCheck, Clock, Search, Filter,
  Plus, Trash2, Edit, AlertCircle,
} from 'lucide-react';
import { SharedHeader } from "@/components/layout/shared-header";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface Recipient {
  id: string;
  name: string;
  phone: string;
  group: string;
  branchId: string;
}

interface ScheduledMessage {
  id: string;
  template: string;
  group: string;
  scheduledFor: string;
  message: string;
  status: 'Scheduled' | 'Sent' | 'Cancelled';
  recipientCount: number;
  branchId: string;
}

interface BroadcastLog {
  id: string;
  template: string;
  group: string;
  sentCount: number;
  sentAt: string;
  status: 'Sent' | 'Pending' | 'Failed';
  branchId: string;
}

const TEMPLATES = [
  { id: 'T1', name: 'Fee Reminder',          body: 'Dear {name}, your fees are due. Please pay at your earliest. Contact us at our center for details. Thank you.' },
  { id: 'T2', name: 'Exam Notification',      body: 'Dear {name}, your upcoming exam schedule has been published. Please login to the portal to view your timetable. Best wishes.' },
  { id: 'T3', name: 'Holiday Announcement',   body: 'Dear {name}, we would like to inform you that there will be a holiday on account of a special occasion. Classes will resume as normal thereafter.' },
  { id: 'T4', name: 'Result Published',       body: 'Dear {name}, your exam results have been published. Please visit the center or login to the student portal to view your marks.' },
  { id: 'T5', name: 'General Notice',         body: 'Dear {name}, this is an important notice from Bharath Academy. Please check the notice board or contact us for details.' },
];

const CONTACT_BLANK = { name: '', phone: '', group: '' };

export default function WhatsAppBroadcastPage() {
  const { currentBranch } = useBranch();

  const { data: recipients, loading: recipientsLoading } = useFirestoreCollection<Recipient>("whatsappContacts", currentBranch);
  const { data: logs,       loading: logsLoading }       = useFirestoreCollection<BroadcastLog>("broadcastHistory", currentBranch);
  const { data: scheduled }                              = useFirestoreCollection<ScheduledMessage>("scheduledMessages", currentBranch);

  const composeRef = useRef<HTMLDivElement>(null);

  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message,          setMessage]          = useState('');
  const [filterGroup,      setFilterGroup]      = useState('all');
  const [search,           setSearch]           = useState('');
  const [selected,         setSelected]         = useState<Set<string>>(new Set());
  const [showPreview,      setShowPreview]      = useState(false);
  const [sending,          setSending]          = useState(false);

  // Contact management
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editContact,       setEditContact]       = useState<Recipient | null>(null);
  const [contactForm,       setContactForm]       = useState(CONTACT_BLANK);
  const [savingContact,     setSavingContact]     = useState(false);
  const [deleteTarget,      setDeleteTarget]      = useState<Recipient | null>(null);
  const [deleting,          setDeleting]          = useState(false);

  const groups = useMemo(() => Array.from(new Set(recipients.map(r => r.group))).sort(), [recipients]);

  const filtered = useMemo(() => recipients.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search);
    const matchGroup  = filterGroup === 'all' || r.group === filterGroup;
    return matchSearch && matchGroup;
  }), [recipients, search, filterGroup]);

  const selectedRecipients = useMemo(() => recipients.filter(r => selected.has(r.id)), [recipients, selected]);

  const dueNow = useMemo(() => {
    const now = new Date();
    return scheduled.filter(s => s.status === 'Scheduled' && new Date(s.scheduledFor) <= now);
  }, [scheduled]);

  const stats = useMemo(() => ({
    total:    logs.length,
    sent:     logs.reduce((a, l) => a + (l.sentCount ?? 0), 0),
    pending:  logs.filter(l => l.status === 'Pending').length,
  }), [logs]);

  const toggleAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.id)));
  };

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const onTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const t = TEMPLATES.find(t => t.id === templateId);
    if (t) setMessage(t.body);
  };

  const getPreviewFor = (r: Recipient) => message.replace(/\{name\}/g, r.name.split(' ')[0]);

  const handleSend = async () => {
    setSending(true);
    try {
      selectedRecipients.forEach(r => {
        const personalised = encodeURIComponent(message.replace(/\{name\}/g, r.name.split(' ')[0]));
        window.open(`https://wa.me/${r.phone}?text=${personalised}`, '_blank');
      });

      const groupLabel = filterGroup === 'all' ? 'Custom Selection' : filterGroup;
      const templateName = TEMPLATES.find(t => t.id === selectedTemplate)?.name ?? 'Custom Message';

      await addDocument("broadcastHistory", {
        template:  templateName,
        group:     groupLabel,
        sentCount: selectedRecipients.length,
        sentAt:    new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
        status:    'Sent',
        branchId:  currentBranch,
      });

      toast({ title: "Broadcast Sent", description: `Opened WhatsApp for ${selectedRecipients.length} recipient(s).` });
      setShowPreview(false);
      setSelected(new Set());
    } catch {
      toast({ title: "Error", description: "Failed to log broadcast.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // Contact CRUD
  const openAddContact = () => { setEditContact(null); setContactForm(CONTACT_BLANK); setShowContactDialog(true); };
  const openEditContact = (r: Recipient) => { setEditContact(r); setContactForm({ name: r.name, phone: r.phone, group: r.group }); setShowContactDialog(true); };

  const handleSaveContact = async () => {
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      toast({ title: "Name and phone required", variant: "destructive" });
      return;
    }
    setSavingContact(true);
    try {
      if (editContact) {
        await updateDocument("whatsappContacts", editContact.id, { name: contactForm.name.trim(), phone: contactForm.phone.trim(), group: contactForm.group.trim() });
        toast({ title: "Contact Updated" });
      } else {
        await addDocument("whatsappContacts", { name: contactForm.name.trim(), phone: contactForm.phone.trim(), group: contactForm.group.trim() || 'General', branchId: currentBranch });
        toast({ title: "Contact Added" });
      }
      setShowContactDialog(false);
    } catch {
      toast({ title: "Error", description: "Failed to save contact.", variant: "destructive" });
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument("whatsappContacts", deleteTarget.id);
      setSelected(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n; });
      toast({ title: "Deleted", description: `${deleteTarget.name} removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="WhatsApp Broadcast" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E2A4A]">WhatsApp Broadcast</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Send bulk WhatsApp messages to parents, students, and staff</p>
          </div>
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            <MessageSquare className="h-3 w-3 mr-1" /> WhatsApp Ready
          </Badge>
        </div>

        {/* Due Now Alert */}
        {dueNow.length > 0 && (
          <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-orange-700 font-semibold">
              <AlertCircle className="h-5 w-5" />
              {dueNow.length} Scheduled Message{dueNow.length > 1 ? 's' : ''} Due Now
            </div>
            <div className="space-y-2">
              {dueNow.map(s => (
                <div key={s.id} className="flex items-start justify-between gap-3 bg-white rounded-md border border-orange-200 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1E2A4A]">{s.template} → <span className="text-orange-700">{s.group}</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.message.substring(0, 80)}…</p>
                    <p className="text-xs text-orange-600 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Scheduled for {s.scheduledFor}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#25D366] hover:bg-[#25D366]/90 text-white flex-shrink-0"
                    onClick={() => {
                      setMessage(s.message);
                      setSelectedTemplate('');
                      setTimeout(() => {
                        composeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                      toast({ title: "Message loaded", description: "Select recipients below, then click Send." });
                    }}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" /> Load & Send
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Broadcasts', value: stats.total,   icon: Send,       color: 'text-[#0D7C8F]' },
            { label: 'Messages Sent',    value: stats.sent,    icon: CheckCheck, color: 'text-green-600' },
            { label: 'Pending',          value: stats.pending, icon: Clock,      color: 'text-yellow-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  {logsLoading
                    ? <Skeleton className="h-7 w-8 mb-1" />
                    : <p className="text-2xl font-bold">{s.value}</p>
                  }
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" ref={composeRef}>
          {/* Compose */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Compose Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Message Template</Label>
                  <Select value={selectedTemplate} onValueChange={onTemplateChange}>
                    <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <Textarea
                    rows={6}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type your message... Use {name} for personalisation."
                    className="resize-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Use <code className="bg-slate-100 px-1 rounded">{'{name}'}</code> to personalise.</p>
                </div>
                <Button
                  className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                  disabled={!message.trim() || selected.size === 0}
                  onClick={() => setShowPreview(true)}
                >
                  <Send className="h-4 w-4 mr-2" /> Send to {selected.size} Recipient{selected.size !== 1 ? 's' : ''}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recipients */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" /> Recipients
                    <Badge variant="secondary">{selected.size} selected</Badge>
                  </CardTitle>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={openAddContact}>
                    <Plus className="h-3.5 w-3.5" /> Add Contact
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <Select value={filterGroup} onValueChange={setFilterGroup}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-3.5 w-3.5 mr-1.5" />
                      <SelectValue placeholder="All Groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {groups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleAll}
                    />
                    <span className="text-xs font-semibold text-slate-600 uppercase">
                      Select All ({filtered.length})
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y">
                    {recipientsLoading ? (
                      [...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                          <Skeleton className="h-4 w-4 rounded" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))
                    ) : filtered.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No contacts found. Click &quot;Add Contact&quot; to get started.
                      </div>
                    ) : filtered.map(r => (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group">
                        <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1E2A4A]">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.phone} · {r.group}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditContact(r)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => setDeleteTarget(r)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Broadcast History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Broadcast History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  {['Template', 'Group', 'Sent To', 'Date & Time', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {[...Array(5)].map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No broadcasts sent yet.</td></tr>
                ) : [...logs].sort((a, b) => b.sentAt.localeCompare(a.sentAt)).map(log => (
                  <tr key={log.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{log.template}</td>
                    <td className="px-4 py-3">{log.group}</td>
                    <td className="px-4 py-3">{log.sentCount} recipients</td>
                    <td className="px-4 py-3">{log.sentAt}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'Sent'    ? 'bg-green-100 text-green-700' :
                        log.status === 'Failed'  ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Preview & Send Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Preview & Confirm</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Sending to {selectedRecipients.length} recipient(s). Sample preview:</p>
              {selectedRecipients.slice(0, 2).map(r => (
                <div key={r.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-800 mb-1">{r.name} ({r.phone})</p>
                  <p className="text-sm text-slate-700">{getPreviewFor(r)}</p>
                </div>
              ))}
              {selectedRecipients.length > 2 && (
                <p className="text-xs text-muted-foreground text-center">+ {selectedRecipients.length - 2} more recipients</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
              <Button className="bg-[#25D366] hover:bg-[#25D366]/90 text-white" onClick={handleSend} disabled={sending}>
                <Send className="h-4 w-4 mr-2" /> {sending ? 'Sending…' : 'Open WhatsApp & Send'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add / Edit Contact Dialog */}
        <Dialog open={showContactDialog} onOpenChange={v => { setShowContactDialog(v); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} placeholder="10-digit number" />
              </div>
              <div className="space-y-1.5">
                <Label>Group</Label>
                <Input value={contactForm.group} onChange={e => setContactForm(p => ({ ...p, group: e.target.value }))} placeholder="e.g. Class 10 Parents" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancel</Button>
              <Button className="bg-[#0D7C8F] hover:bg-[#0D7C8F]/90" onClick={handleSaveContact} disabled={savingContact}>
                {savingContact ? 'Saving…' : editContact ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Contact Confirmation */}
        <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Contact</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Remove <span className="font-semibold text-foreground">{deleteTarget?.name}</span> from your contacts?
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteContact} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
