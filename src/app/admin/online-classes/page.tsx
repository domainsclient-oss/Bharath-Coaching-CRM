"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus, Search, ChevronRight, Video, ExternalLink, Trash2, Edit,
  ClipboardCheck, Calendar, Clock, Filter, Link as LinkIcon, Radio,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OnlineClass } from "@/data/onlineClassesData";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface ClassDoc   { id: string; name: string; board?: string; branchId: string; }
interface SubjectDoc { id: string; name: string; branchId: string; }
interface StaffDoc   { id: string; name: string; role?: string; branchId: string; }

const FORM_EMPTY = { title: "", classId: "", subjectId: "", date: "", time: "", duration: "60", staffId: "", description: "" };

export default function OnlineClassesPage() {
  useAuth();
  const { currentBranch } = useBranch();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: classes }       = useFirestoreCollection<ClassDoc>("classes",       currentBranch);
  const { data: subjects }      = useFirestoreCollection<SubjectDoc>("subjects",    currentBranch);
  const { data: staffList }     = useFirestoreCollection<StaffDoc>("staff",         currentBranch);
  const { data: branchClasses } = useFirestoreCollection<OnlineClass>("onlineClasses", currentBranch);

  // ── Form / modal state ─────────────────────────────────────────────────────
  const [form,        setForm]        = useState(FORM_EMPTY);
  const [meetLink,    setMeetLink]    = useState("");
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);

  // ── Counts ─────────────────────────────────────────────────────────────────
  const liveCount      = branchClasses.filter(c => c.status === "Live").length;
  const scheduledCount = branchClasses.filter(c => c.status === "Scheduled").length;
  const endedCount     = branchClasses.filter(c => c.status === "Ended").length;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const parseSessionDate = (dateStr: string, timeStr: string) => {
    const base = new Date(dateStr);
    const ampm = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (ampm) {
      let h = parseInt(ampm[1]);
      const m = parseInt(ampm[2]);
      if (ampm[3].toUpperCase() === "PM" && h !== 12) h += 12;
      if (ampm[3].toUpperCase() === "AM" && h === 12) h = 0;
      base.setHours(h, m, 0, 0);
    } else {
      const [h, m] = timeStr.split(":").map(Number);
      base.setHours(h || 0, m || 0, 0, 0);
    }
    return base;
  };

  const nextSession = useMemo(() => {
    const now = new Date();
    return branchClasses
      .filter(oc => oc.status === "Scheduled" && oc.date && oc.time)
      .map(oc => ({ ...oc, dt: parseSessionDate(oc.date, oc.time) }))
      .filter(oc => oc.dt > now)
      .sort((a, b) => a.dt.getTime() - b.dt.getTime())[0] ?? null;
  }, [branchClasses]);

  const nextSessionLabel = useMemo(() => {
    if (!nextSession) return null;
    const diff = Math.round((nextSession.dt.getTime() - Date.now()) / 60000);
    if (diff < 60) return `Starts in ${diff} min${diff !== 1 ? "s" : ""}`;
    const hrs = Math.floor(diff / 60), mins = diff % 60;
    return `Starts in ${hrs}h${mins > 0 ? ` ${mins}m` : ""}`;
  }, [nextSession]);

  const weekStats = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now); monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day)); monday.setHours(0,0,0,0);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23,59,59,999);
    const lastMon = new Date(monday); lastMon.setDate(monday.getDate() - 7);
    const lastSun = new Date(sunday); lastSun.setDate(sunday.getDate() - 7);
    const inRange = (d: Date, s: Date, e: Date) => d >= s && d <= e;
    const thisWeek = branchClasses.filter(oc => inRange(new Date(oc.date), monday, sunday));
    const lastWeek = branchClasses.filter(oc => inRange(new Date(oc.date), lastMon, lastSun));
    const totalMins = thisWeek.reduce((s, oc) => s + (oc.duration || 0), 0);
    const lastMins  = lastWeek.reduce((s, oc) => s + (oc.duration || 0), 0);
    const diff = totalMins - lastMins;
    return { sessions: thisWeek.length, totalHrs: (totalMins / 60).toFixed(1), diffHrs: (Math.abs(diff) / 60).toFixed(1), up: diff >= 0 };
  }, [branchClasses]);

  const filteredByStatus = (status: string) =>
    branchClasses.filter(oc =>
      (status === "All" || oc.status === status) &&
      (oc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       oc.subject.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // ── Open add / edit modal ──────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm(FORM_EMPTY);
    setMeetLink("");
    setModalOpen(true);
  };

  const openEdit = (oc: OnlineClass) => {
    setEditingId(oc.id);
    const matchClass   = classes.find(c => c.name === oc.class);
    const matchSubject = subjects.find(s => s.name === oc.subject);
    const matchStaff   = staffList.find(s => s.id === oc.teacherId);
    setForm({
      title:      oc.title,
      classId:    matchClass?.id   ?? oc.class,
      subjectId:  matchSubject?.id ?? oc.subject,
      date:       oc.date,
      time:       oc.time,
      duration:   String(oc.duration ?? 60),
      staffId:    matchStaff?.id   ?? oc.teacherId ?? "",
      description: oc.description ?? "",
    });
    setMeetLink(oc.meetLink ?? "");
    setModalOpen(true);
  };

  // ── Date/time helpers ─────────────────────────────────────────────────────
  const todayDate = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }, []);

  const minTime = useMemo(() => {
    if (form.date !== todayDate) return undefined;
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  }, [form.date, todayDate]);

  // ── Save (add or update) ───────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.classId || !form.subjectId || !form.date || !form.time) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    const selectedDateTime = new Date(`${form.date}T${form.time}`);
    if (selectedDateTime <= new Date()) {
      toast({ title: "Invalid date/time", description: "Please select a future date and time.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const selClass   = classes.find(c => c.id === form.classId);
      const selSubject = subjects.find(s => s.id === form.subjectId);
      const selStaff   = staffList.find(s => s.id === form.staffId);
      const payload = {
        title:       form.title,
        classId:     form.classId,
        class:       selClass?.name   ?? form.classId,
        subjectId:   form.subjectId,
        subject:     selSubject?.name ?? form.subjectId,
        teacherId:   form.staffId,
        teacherName: selStaff?.name   ?? "",
        date:        form.date,
        time:        form.time,
        duration:    Number(form.duration),
        meetLink,
        description: form.description,
        branchId:    currentBranch,
      };
      if (editingId) {
        await updateDocument("onlineClasses", editingId, payload);
        toast({ title: "Session Updated" });
      } else {
        await addDocument("onlineClasses", { ...payload, status: "Scheduled" });
        toast({ title: "Class Scheduled", description: "New session created." });
      }
      setModalOpen(false);
      setForm(FORM_EMPTY);
      setMeetLink("");
      setEditingId(null);
    } catch {
      toast({ title: "Error", description: "Failed to save session.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDocument("onlineClasses", deleteId);
      toast({ title: "Session Deleted", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  // ── Mark Live / Ended ──────────────────────────────────────────────────────
  const handleStatusChange = async (oc: OnlineClass, status: "Live" | "Ended" | "Scheduled") => {
    try {
      await updateDocument("onlineClasses", oc.id, { status });
      toast({ title: `Marked as ${status}` });
    } catch {
      toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
    }
  };

  const handleGenerateLink = () => {
    const r = () => Math.random().toString(36).substring(2, 5 + Math.floor(Math.random() * 2));
    setMeetLink(`https://meet.google.com/${r()}-${r()}-${r()}`);
  };

  // ── Table ──────────────────────────────────────────────────────────────────
  const SessionTable = ({ sessions }: { sessions: OnlineClass[] }) => (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow>
          <TableHead>Session Title</TableHead>
          <TableHead>Class & Subject</TableHead>
          <TableHead>Faculty</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.length > 0 ? sessions.map(oc => (
          <TableRow key={oc.id} className="hover:bg-slate-50/50 group">
            <TableCell>
              <div className="flex flex-col">
                <span className="font-bold text-[#1E2A4A]">{oc.title}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{oc.meetLink || "—"}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{oc.class}</span>
                <Badge variant="secondary" className="w-fit text-[10px] py-0 h-4">{oc.subject}</Badge>
              </div>
            </TableCell>
            <TableCell className="text-sm font-medium">{oc.teacherName || "—"}</TableCell>
            <TableCell>
              <div className="flex flex-col text-xs">
                <span className="font-bold">{oc.date}</span>
                <span className="text-muted-foreground">{oc.time}</span>
              </div>
            </TableCell>
            <TableCell className="text-xs font-medium">{oc.duration} mins</TableCell>
            <TableCell>
              {oc.status === "Live" ? (
                <Badge className="bg-red-600 animate-pulse gap-1.5 flex w-fit items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE NOW
                </Badge>
              ) : oc.status === "Scheduled" ? (
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Scheduled</Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none">Ended</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                {/* Join */}
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-[#0D7C8F] hover:bg-teal-50 hover:text-[#0D7C8F]"
                  disabled={!oc.meetLink || oc.status === "Ended"}
                  onClick={() => window.open(oc.meetLink, "_blank")}
                  title="Join Session"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                {/* Mark Live / End */}
                {oc.status === "Scheduled" && (
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleStatusChange(oc, "Live")}
                    title="Mark as Live"
                  >
                    <Radio className="h-4 w-4" />
                  </Button>
                )}
                {oc.status === "Live" && (
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => handleStatusChange(oc, "Ended")}
                    title="End Session"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                  </Button>
                )}
                {oc.status === "Ended" && (
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => handleStatusChange(oc, "Scheduled")}
                    title="Reschedule"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                )}
                {/* Edit */}
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                  onClick={() => openEdit(oc)}
                  title="Edit Session"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {/* Delete */}
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => setDeleteId(oc.id)}
                  title="Delete Session"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
              No sessions found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Online Classes" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Online Classes</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Virtual Classroom Hub</h2>
            <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2 shadow-lg" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Schedule Class
            </Button>
          </div>
        </div>

        {/* Tabs + Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <Tabs defaultValue="All" className="w-full">
            <div className="bg-white border-b px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <TabsList className="bg-transparent p-0 border-b gap-2">
                {[
                  { value: "All",       label: `All` },
                  { value: "Live",      label: `Live Now (${liveCount})`, dot: true },
                  { value: "Scheduled", label: `Scheduled (${scheduledCount})` },
                  { value: "Ended",     label: `Ended (${endedCount})` },
                ].map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0D7C8F] data-[state=active]:bg-transparent data-[state=active]:text-[#0D7C8F] data-[state=active]:shadow-none px-4 pb-2 text-slate-500 font-medium gap-1.5">
                    {t.dot && <div className="h-2 w-2 rounded-full bg-red-600" />}
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by topic or subject..." className="pl-9 h-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="p-0">
              {["All","Live","Scheduled","Ended"].map(s => (
                <TabsContent key={s} value={s} className="mt-0 outline-none">
                  <SessionTable sessions={filteredByStatus(s)} />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-[#1E2A4A] to-[#2a3a6a] text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-[#0D7C8F]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-white/60">Coming Up Next</p>
                {nextSession ? (
                  <>
                    <p className="text-sm font-bold mt-1 truncate max-w-[180px]">{nextSession.title}</p>
                    <p className="text-[10px] text-white/40">{nextSessionLabel} · {nextSession.subject}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold mt-1">No upcoming sessions</p>
                    <p className="text-[10px] text-white/40">Schedule a class to get started</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-[#0D7C8F] text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-white/60">Live Now</p>
                <p className="text-sm font-bold mt-1">{liveCount > 0 ? `${liveCount} session${liveCount > 1 ? "s" : ""} live` : "No live sessions"}</p>
                <p className="text-[10px] text-white/40">{scheduledCount} scheduled · {endedCount} ended</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Total Sessions This Week</p>
                <p className="text-sm font-bold text-[#1E2A4A] mt-1">{weekStats.sessions} sessions · {weekStats.totalHrs} hrs</p>
                <p className="text-[10px] text-muted-foreground">
                  {parseFloat(weekStats.diffHrs) === 0 ? "Same as last week" : `${weekStats.up ? "+" : "-"}${weekStats.diffHrs} hrs vs last week`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add / Edit dialog */}
      <Dialog open={modalOpen} onOpenChange={v => { if (!v) { setModalOpen(false); setEditingId(null); } }}>
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-[#0D7C8F]" />
                {editingId ? "Edit Session" : "Schedule New Session"}
              </DialogTitle>
              <DialogDescription>
                {editingId ? "Update the session details below." : "Fill in the details to create a new online class session."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Meeting Title *</Label>
                <Input placeholder="e.g. Weekly Math Quiz Review" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Select Class *</Label>
                  <Select value={form.classId} onValueChange={v => setForm(f => ({ ...f, classId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>
                      {classes.length === 0
                        ? <SelectItem value="__none__" disabled>No classes found</SelectItem>
                        : classes.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}{c.board ? ` (${c.board})` : ""}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Select Subject *</Label>
                  <Select value={form.subjectId} onValueChange={v => setForm(f => ({ ...f, subjectId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.length === 0
                        ? <SelectItem value="__none__" disabled>No subjects found</SelectItem>
                        : subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Date *</Label>
                  <Input type="date" required min={todayDate} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value, time: "" }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Time *</Label>
                  <Input type="time" required min={minTime} value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Duration (mins)</Label>
                  <Select value={form.duration} onValueChange={v => setForm(f => ({ ...f, duration: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["30","45","60","90","120"].map(d => <SelectItem key={d} value={d}>{d} mins</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Faculty</Label>
                  <Select value={form.staffId} onValueChange={v => setForm(f => ({ ...f, staffId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                    <SelectContent>
                      {staffList.length === 0
                        ? <SelectItem value="__none__" disabled>No staff found</SelectItem>
                        : staffList.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Google Meet Link</Label>
                <div className="flex gap-2">
                  <Input placeholder="https://meet.google.com/..." value={meetLink} onChange={e => setMeetLink(e.target.value)} />
                  <Button type="button" variant="outline" className="gap-2 shrink-0" onClick={handleGenerateLink}>
                    <LinkIcon className="h-3 w-3" /> Generate
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Brief Description</Label>
                <Textarea placeholder="What will be covered in this session?" className="h-20" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#0D7C8F]" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Update Session" : "Save Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Session?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
