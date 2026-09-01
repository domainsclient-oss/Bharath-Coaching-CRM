"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Video, RefreshCw, Copy, Save, Check,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface ClassDoc { id: string; name: string; board?: string; branchId: string; }
interface StaffDoc  { id: string; name: string; role?: string; branchId: string; }

const DURATIONS = ["30", "45", "60", "90", "120"];

function generateMeetLink() {
  const seg = () => Math.random().toString(36).substring(2, 5);
  return `https://meet.google.com/${seg()}-${seg()}${seg()}-${seg()}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export default function MeetingLinkPage() {
  const { currentBranch } = useBranch();

  const { data: classes  } = useFirestoreCollection<ClassDoc>("classes", currentBranch);
  const { data: staffList } = useFirestoreCollection<StaffDoc>("staff",   currentBranch);

  const teachers = useMemo(() =>
    staffList.filter(s => s.role === "Teacher" || s.role === "teacher"),
    [staffList]
  );

  const [form, setForm] = useState({
    title: "", date: "", time: "", duration: "60",
    meetLink: "", staffId: "", classId: "", subject: "", description: "",
  });
  const [saved,      setSaved]      = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [generating, setGenerating] = useState(false);

  const today = todayStr();

  // When today is selected, restrict time to future minutes only
  const minTime = useMemo(() => {
    if (form.date !== today) return undefined;
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  }, [form.date, today]);

  const set = (key: keyof typeof form, value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
      // clear time when date changes so user picks a valid time for the new date
      ...(key === "date" ? { time: "" } : {}),
    }));
    setSaved(false);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const link = generateMeetLink();
      setForm(prev => ({ ...prev, meetLink: link }));
      setGenerating(false);
      toast({ title: "Link Generated", description: link });
    }, 600);
  };

  const handleCopy = () => {
    if (!form.meetLink) return;
    navigator.clipboard.writeText(form.meetLink);
    toast({ title: "Copied", description: "Meet link copied to clipboard." });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time || !form.staffId) {
      toast({ title: "Missing fields", description: "Please fill in Title, Date, Time and Staff.", variant: "destructive" });
      return;
    }
    if (!form.meetLink) {
      toast({ title: "No meeting link", description: "Generate or paste a Google Meet link before saving.", variant: "destructive" });
      return;
    }
    // Past date/time guard
    const selectedDateTime = new Date(`${form.date}T${form.time}`);
    if (selectedDateTime <= new Date()) {
      toast({ title: "Invalid date/time", description: "Please select a future date and time.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const selClass = classes.find(c => c.id === form.classId);
      const selStaff = staffList.find(s => s.id === form.staffId);

      await addDocument("onlineClasses", {
        title:       form.title,
        classId:     form.classId,
        class:       selClass?.name ?? "",
        subjectId:   "",
        subject:     form.subject || "General",
        teacherId:   form.staffId,
        teacherName: selStaff?.name ?? "—",
        date:        form.date,
        time:        form.time,
        duration:    Number(form.duration),
        meetLink:    form.meetLink,
        description: form.description,
        status:      "Scheduled",
        branchId:    currentBranch,
      });

      setSaved(true);
      toast({ title: "Meeting Saved", description: `"${form.title}" scheduled for ${form.date} at ${form.time}.` });
    } catch {
      toast({ title: "Error", description: "Failed to save meeting.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ title: "", date: "", time: "", duration: "60", meetLink: "", staffId: "", classId: "", subject: "", description: "" });
    setSaved(false);
  };

  const selectedStaffName = staffList.find(s => s.id === form.staffId)?.name ?? "—";
  const selectedClassName = classes.find(c => c.id === form.classId)?.name ?? "";

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Live Meeting Link" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/online-classes" className="hover:text-[#0D7C8F]">Online Classes</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/online-classes/live-classes" className="hover:text-[#0D7C8F]">Live Classes</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Live Meeting Link</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0D7C8F]/10 flex items-center justify-center">
            <Video className="h-5 w-5 text-[#0D7C8F]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Create Live Meeting Link</h2>
            <p className="text-xs text-muted-foreground">Generate a Google Meet link and schedule a class session</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main form */}
            <div className="lg:col-span-2 space-y-5">

              {/* Meeting details */}
              <Card className="border-none shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Meeting Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Algebra Revision — Class 10"
                      value={form.title}
                      onChange={e => set("title", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Meeting Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        min={today}
                        value={form.date}
                        onChange={e => set("date", e.target.value)}
                      />
                      {form.date && form.date < today && (
                        <p className="text-xs text-red-500">Past dates are not allowed.</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Meeting Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="time"
                        min={minTime}
                        value={form.time}
                        onChange={e => set("time", e.target.value)}
                      />
                      {form.date === today && form.time && minTime && form.time < minTime && (
                        <p className="text-xs text-red-500">Please select a future time.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Duration</Label>
                      <Select value={form.duration} onValueChange={v => set("duration", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DURATIONS.map(d => (
                            <SelectItem key={d} value={d}>{d} minutes</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Class</Label>
                      <Select value={form.classId} onValueChange={v => set("classId", v)}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          {classes.length === 0
                            ? <SelectItem value="_none" disabled>No classes found</SelectItem>
                            : classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}{c.board ? ` (${c.board})` : ""}
                                </SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Subject</Label>
                    <Input
                      placeholder="e.g. Mathematics"
                      value={form.subject}
                      onChange={e => set("subject", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* G Meet Link */}
              <Card className="border-none shadow-sm">
                <CardHeader className="border-b py-3 px-5">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Video className="h-4 w-4 text-[#0D7C8F]" /> G Meet Link
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Google Meet Link <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://meet.google.com/..."
                        value={form.meetLink}
                        onChange={e => set("meetLink", e.target.value)}
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-1.5 flex-shrink-0 text-[#0D7C8F] border-[#0D7C8F]"
                        onClick={handleGenerate}
                        disabled={generating}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
                        {generating ? "Generating..." : "Generate"}
                      </Button>
                    </div>
                  </div>
                  {form.meetLink && (
                    <div className="flex items-center gap-3 p-3 bg-[#0D7C8F]/5 rounded-lg border border-[#0D7C8F]/20">
                      <a
                        href={form.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#0D7C8F] font-mono hover:underline flex-1 break-all"
                      >
                        {form.meetLink}
                      </a>
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={handleCopy}
                        title="Copy link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Staff + Description */}
              <Card className="border-none shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Staff / Teacher <span className="text-red-500">*</span>
                    </Label>
                    <Select value={form.staffId} onValueChange={v => set("staffId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                      <SelectContent>
                        {staffList.length === 0
                          ? <SelectItem value="_none" disabled>No staff found</SelectItem>
                          : staffList.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Description</Label>
                    <Textarea
                      placeholder="What will be covered in this session? Any instructions for students..."
                      className="h-24 resize-none"
                      value={form.description}
                      onChange={e => set("description", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right panel */}
            <div className="space-y-4">
              {/* Preview */}
              <Card className="border-none shadow-sm bg-gradient-to-br from-[#1E2A4A] to-[#0D7C8F] text-white">
                <CardContent className="p-5 space-y-3">
                  <p className="text-xs text-white/60 font-bold uppercase">Session Preview</p>
                  <p className="text-base font-bold leading-tight">{form.title || "Meeting Title"}</p>
                  <div className="space-y-1.5 text-sm text-white/70">
                    <p>📅 {form.date || "Date not set"} · {form.time || "Time not set"}</p>
                    <p>⏱ {form.duration} minutes</p>
                    {selectedClassName && <p>🎓 {selectedClassName}{form.subject ? ` · ${form.subject}` : ""}</p>}
                    {form.staffId && <p>👤 {selectedStaffName}</p>}
                  </div>
                  {form.meetLink && (
                    <div className="mt-3 p-2 bg-white/10 rounded text-xs font-mono break-all text-white/80">
                      {form.meetLink}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Checklist */}
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Checklist</p>
                  {[
                    { label: "Meeting Title",  done: !!form.title },
                    { label: "Date & Time",    done: !!(form.date && form.time && form.date >= today) },
                    { label: "Duration",       done: !!form.duration },
                    { label: "G Meet Link",    done: !!form.meetLink },
                    { label: "Staff / Teacher",done: !!form.staffId },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-100" : "bg-slate-100"}`}>
                        {done
                          ? <Check className="h-2.5 w-2.5 text-green-600" />
                          : <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        }
                      </div>
                      <span className={done ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {label}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button
                type="submit"
                className={`w-full gap-2 ${saved ? "bg-green-600 hover:bg-green-700" : "bg-[#1E2A4A] hover:bg-[#0D7C8F]"}`}
                size="lg"
                disabled={saving}
              >
                {saved ? (
                  <><Check className="h-4 w-4" /> Saved!</>
                ) : saving ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="h-4 w-4" /> Save Meeting</>
                )}
              </Button>

              {saved && (
                <Button type="button" variant="outline" className="w-full" onClick={handleReset}>
                  Create Another
                </Button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
