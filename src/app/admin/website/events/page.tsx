"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Plus, Trash2, Edit2, CalendarDays, MapPin,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { EventCategory } from "@/data/websiteData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface WebsiteEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  venue?: string;
  category: EventCategory;
  isPublished: boolean;
  branchId: string;
}

const CATEGORIES: EventCategory[] = ["Academic", "Cultural", "Sports", "Seminar", "Workshop", "Holiday", "Exam"];

const CAT_COLORS: Record<EventCategory, string> = {
  Academic:  "bg-blue-100 text-blue-700",
  Cultural:  "bg-pink-100 text-pink-700",
  Sports:    "bg-green-100 text-green-700",
  Seminar:   "bg-purple-100 text-purple-700",
  Workshop:  "bg-teal-100 text-teal-700",
  Holiday:   "bg-amber-100 text-amber-700",
  Exam:      "bg-red-100 text-red-700",
};

const BLANK = {
  title: "", description: "", date: "", time: "", venue: "",
  category: "Academic" as EventCategory, isPublished: true,
};

export default function EventsPage() {
  const { currentBranch } = useBranch();

  const { data: events, loading } = useFirestoreCollection<WebsiteEvent>("websiteEvents", currentBranch);

  const [catFilter,    setCatFilter]    = useState("All");
  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState<WebsiteEvent | null>(null);
  const [form,         setForm]         = useState({ ...BLANK });
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebsiteEvent | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const filtered = useMemo(() =>
    events
      .filter(e => catFilter === "All" || e.category === catFilter)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [events, catFilter],
  );

  const publishedCount = filtered.filter(e => e.isPublished).length;

  const openAdd = () => {
    setEditing(null);
    setForm({ ...BLANK });
    setShowForm(true);
  };

  const openEdit = (ev: WebsiteEvent) => {
    setEditing(ev);
    setForm({
      title:       ev.title,
      description: ev.description,
      date:        ev.date,
      time:        ev.time ?? "",
      venue:       ev.venue ?? "",
      category:    ev.category,
      isPublished: ev.isPublished,
    });
    setShowForm(true);
  };

  const togglePublish = async (ev: WebsiteEvent) => {
    try {
      await updateDocument("websiteEvents", ev.id, { isPublished: !ev.isPublished });
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument("websiteEvents", deleteTarget.id);
      toast({ title: "Deleted", description: `"${deleteTarget.title}" removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) {
      toast({ title: "Title and Date required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDocument("websiteEvents", editing.id, {
          title:       form.title.trim(),
          description: form.description.trim(),
          date:        form.date,
          time:        form.time || null,
          venue:       form.venue.trim() || null,
          category:    form.category,
          isPublished: form.isPublished,
        });
        toast({ title: "Event Updated", description: form.title.trim() });
      } else {
        await addDocument("websiteEvents", {
          title:       form.title.trim(),
          description: form.description.trim(),
          date:        form.date,
          time:        form.time || null,
          venue:       form.venue.trim() || null,
          category:    form.category,
          isPublished: form.isPublished,
          branchId:    currentBranch,
        });
        toast({ title: "Event Added", description: form.title.trim() });
      }
      setShowForm(false);
    } catch {
      toast({ title: "Error", description: "Failed to save event.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Events" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Events</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Events</h2>
            {loading
              ? <Skeleton className="h-4 w-36 mt-1" />
              : <p className="text-sm text-muted-foreground">{publishedCount} published · {filtered.length} total</p>
            }
          </div>
          <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                catFilter === c
                  ? "bg-[#1E2A4A] text-white border-[#1E2A4A]"
                  : "bg-white text-muted-foreground border-slate-200 hover:border-slate-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Event cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-none shadow-sm overflow-hidden">
                <div className="h-1.5 bg-slate-200" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="h-40 flex items-center justify-center text-muted-foreground">
              No events found. Click &quot;Add Event&quot; to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(ev => (
              <Card key={ev.id} className={`border-none shadow-sm overflow-hidden ${!ev.isPublished ? "opacity-60" : ""}`}>
                <div className="h-1.5 bg-[#0D7C8F]" />
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className={`text-xs flex-shrink-0 ${CAT_COLORS[ev.category]}`}>{ev.category}</Badge>
                    {!ev.isPublished && <Badge variant="outline" className="text-xs text-slate-400">Draft</Badge>}
                  </div>
                  <h3 className="font-bold text-[#1E2A4A] text-sm leading-snug">{ev.title}</h3>
                  {ev.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{ev.description}</p>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3 flex-shrink-0" />
                      {ev.date}{ev.time ? ` · ${ev.time}` : ""}
                    </div>
                    {ev.venue && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" /> {ev.venue}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t">
                    <div className="flex items-center gap-1.5">
                      <Switch checked={ev.isPublished} onCheckedChange={() => togglePublish(ev)} className="scale-75" />
                      <span className="text-xs text-muted-foreground">{ev.isPublished ? "Published" : "Draft"}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ev)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600"
                        onClick={() => setDeleteTarget(ev)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add / Edit Dialog */}
        <Dialog open={showForm} onOpenChange={v => { setShowForm(v); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Event" : "Add New Event"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Event Title *</Label>
                <Input placeholder="e.g. Annual Day 2026" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={3} placeholder="Event details..." value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input type="date" value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Time</Label>
                  <Input placeholder="10:00 AM" value={form.time}
                    onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as EventCategory }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Venue</Label>
                  <Input placeholder="e.g. Main Auditorium" value={form.venue}
                    onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isPublished} onCheckedChange={v => setForm(p => ({ ...p, isPublished: v }))} />
                <Label>Publish on website</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F]" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{deleteTarget?.title}&quot;</span>?
            This cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
