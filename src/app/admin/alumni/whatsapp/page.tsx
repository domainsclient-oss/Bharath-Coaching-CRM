"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, MessageCircle, Users, CheckSquare, Square,
  Send, Search, Filter, Eye, GraduationCap, Phone,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

// ── Template definitions ──────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "t1",
    label: "Reunion Invitation",
    body: "Hello {name}! 🎓 We're organising an Alumni Reunion at Bharath Academy. You are warmly invited to join us and reconnect with your batch mates. Please confirm your attendance. We look forward to seeing you!",
  },
  {
    id: "t2",
    label: "Scholarship Notice",
    body: "Dear {name}, Bharath Academy is offering scholarships for deserving alumni pursuing higher studies. If you or someone you know is eligible, please contact us at the earliest. Best regards, Bharath Academy.",
  },
  {
    id: "t3",
    label: "Feedback Request",
    body: "Hi {name}! 👋 We hope you are doing great. As a valued alumnus of Bharath Academy, your feedback helps us improve. Could you spare 2 minutes to share your experience? Thank you!",
  },
  {
    id: "t4",
    label: "Achievement Congratulations",
    body: "Congratulations {name}! 🏆 We heard about your amazing achievement and we couldn't be more proud. You are an inspiration to our current students. Keep shining!",
  },
  {
    id: "t5",
    label: "Custom Message",
    body: "",
  },
];

interface AlumniDoc {
  id: string;
  name: string;
  class?: string;
  board?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  admissionDate?: string;
  discontinuedDate?: string;
  status: string;
  branchId: string;
}

const BOARDS = ["All", "CBSE", "ICSE", "State", "Samacheer", "IB"];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function batchYear(s: AlumniDoc) {
  return s.discontinuedDate?.slice(0, 4) ?? s.admissionDate?.slice(0, 4) ?? "—";
}

export default function WhatsAppAlumniPage() {
  const { currentBranch } = useBranch();

  const { data: allStudents, loading } = useFirestoreCollection<AlumniDoc>("students", currentBranch);

  const alumni = useMemo(
    () => allStudents.filter(s => s.status === "Discontinued" || s.status === "Alumni"),
    [allStudents],
  );

  // Derive filter options from real data
  const classes = useMemo(() => {
    const set = new Set(alumni.map(s => s.class).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [alumni]);

  const batchYears = useMemo(() => {
    const set = new Set(alumni.map(s => batchYear(s)).filter(y => y !== "—"));
    return ["All", ...Array.from(set).sort((a, b) => Number(b) - Number(a))];
  }, [alumni]);

  // Filters
  const [search, setSearch] = useState("");
  const [classF, setClassF] = useState("All");
  const [boardF, setBoardF] = useState("All");
  const [batchF, setBatchF] = useState("All");

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Message
  const [templateId,  setTemplateId]  = useState("t1");
  const [messageBody, setMessageBody] = useState(TEMPLATES[0].body);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const tpl = TEMPLATES.find(t => t.id === id);
    setMessageBody(tpl?.body ?? "");
  };

  // Filtered list
  const filtered = useMemo(() =>
    alumni.filter(a =>
      (classF === "All" || a.class === classF) &&
      (boardF === "All" || a.board === boardF) &&
      (batchF === "All" || batchYear(a) === batchF) &&
      (!search || a.name.toLowerCase().includes(search.toLowerCase()) ||
       (a.phone ?? "").includes(search))
    ), [alumni, classF, boardF, batchF, search]);

  const personalise = (name: string) =>
    messageBody.replace(/\{name\}/g, name.split(" ")[0]);

  // Selection helpers
  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(a => a.id)));
    }
  };

  const selectedAlumni = filtered.filter(a => selected.has(a.id));

  const handleSend = () => {
    if (selected.size === 0) {
      toast({ title: "No recipients selected.", variant: "destructive" }); return;
    }
    if (!messageBody.trim()) {
      toast({ title: "Message cannot be empty.", variant: "destructive" }); return;
    }
    setConfirmOpen(true);
  };

  const doSend = () => {
    // Open WhatsApp links for each selected alumni (first 5 to avoid browser blocking)
    const toOpen = selectedAlumni.slice(0, 5);
    toOpen.forEach(a => {
      const msg = encodeURIComponent(personalise(a.name));
      const num = (a.whatsapp || a.phone || "").replace(/\D/g, "");
      window.open(`https://wa.me/91${num}?text=${msg}`, "_blank");
    });

    toast({
      title: `WhatsApp Messages Sent`,
      description: `${selected.size} alumni notified via WhatsApp.`,
    });
    setConfirmOpen(false);
    setSelected(new Set());
  };

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const someChecked = selected.size > 0 && selected.size < filtered.length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="WhatsApp Alumni" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/alumni" className="hover:text-[#0D7C8F]">Alumni</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">WhatsApp Alumni</span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Alumni",  value: alumni.length,                          color: "text-[#1E2A4A]", bg: "bg-blue-100",   icon: GraduationCap },
            { label: "Filtered",      value: filtered.length,                        color: "text-teal-600",  bg: "bg-teal-100",   icon: Filter },
            { label: "Selected",      value: selected.size,                          color: "text-purple-600",bg: "bg-purple-100", icon: CheckSquare },
            { label: "With WhatsApp", value: alumni.filter(a => a.whatsapp).length,  color: "text-green-600", bg: "bg-green-100",  icon: MessageCircle },
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
                    {loading
                      ? <Skeleton className="h-7 w-10 mt-1" />
                      : <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left — recipient list */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filters */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone..."
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={classF} onValueChange={setClassF}>
                    <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={boardF} onValueChange={setBoardF}>
                    <SelectTrigger><SelectValue placeholder="Board" /></SelectTrigger>
                    <SelectContent>
                      {BOARDS.map(b => <SelectItem key={b} value={b}>{b === "All" ? "All Boards" : b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={batchF} onValueChange={setBatchF}>
                    <SelectTrigger><SelectValue placeholder="Batch" /></SelectTrigger>
                    <SelectContent>
                      {batchYears.map(y => <SelectItem key={y} value={y}>{y === "All" ? "All Batches" : `Batch ${y}`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Select all bar */}
            <div className="flex items-center justify-between bg-white rounded-lg border px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Checkbox
                  checked={allChecked}
                  ref={el => { if (el) (el as HTMLButtonElement).dataset.indeterminate = someChecked ? "true" : "false"; }}
                  onCheckedChange={toggleAll}
                  className={someChecked ? "opacity-70" : ""}
                />
                <span className="text-sm font-medium text-[#1E2A4A]">
                  {selected.size > 0
                    ? `${selected.size} selected`
                    : `Select all (${filtered.length})`}
                </span>
              </div>
              {selected.size > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground h-7"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Alumni list */}
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="divide-y max-h-[480px] overflow-y-auto">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    {alumni.length === 0 ? `No alumni found for ${currentBranch}.` : "No alumni match the filters."}
                  </div>
                ) : filtered.map(a => (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selected.has(a.id) ? "bg-teal-50" : "hover:bg-slate-50"}`}
                    onClick={() => toggleOne(a.id)}
                  >
                    <Checkbox
                      checked={selected.has(a.id)}
                      onCheckedChange={() => toggleOne(a.id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="bg-[#1E2A4A]/10 text-[#1E2A4A] text-xs font-bold">
                        {initials(a.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1E2A4A] truncate">{a.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{a.whatsapp || a.phone || "—"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge className="bg-blue-50 text-blue-700 text-[10px]">Class {a.class}</Badge>
                      <span className="text-[10px] text-muted-foreground">Batch {batchYear(a)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right — message composer */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="bg-white border-b py-3 px-5">
                <CardTitle className="text-sm font-bold text-[#1E2A4A] flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[#0D7C8F]" />
                  Message Composer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Template picker */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Message Template</Label>
                  <Select value={templateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message body — always editable */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Message
                    <span className="ml-1 font-normal text-muted-foreground">(editable)</span>
                  </Label>
                  <Textarea
                    rows={7}
                    placeholder="Type your message here. Use {name} to personalise."
                    value={messageBody}
                    onChange={e => setMessageBody(e.target.value)}
                    className="text-sm resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Use <code className="bg-slate-100 px-1 rounded">{"{name}"}</code> to insert the alumni's first name.
                  </p>
                </div>

                {/* Preview */}
                {selected.size > 0 && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-sm"
                    onClick={() => setPreviewOpen(true)}
                  >
                    <Eye className="h-4 w-4" />
                    Preview ({selected.size} messages)
                  </Button>
                )}

                {/* Send */}
                <Button
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 font-semibold"
                  onClick={handleSend}
                  disabled={selected.size === 0}
                >
                  <MessageCircle className="h-4 w-4" />
                  Send WhatsApp to {selected.size > 0 ? `${selected.size} Alumni` : "Selected Alumni"}
                </Button>

                {/* Recipients summary */}
                {selected.size > 0 && (
                  <div className="rounded-md bg-green-50 border border-green-100 p-3">
                    <p className="text-xs font-semibold text-green-800 mb-1.5">Selected Recipients:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAlumni.slice(0, 8).map(a => (
                        <Badge key={a.id} variant="outline" className="text-[10px] bg-white">{a.name.split(" ")[0]}</Badge>
                      ))}
                      {selectedAlumni.length > 8 && (
                        <Badge variant="outline" className="text-[10px] bg-white">+{selectedAlumni.length - 8} more</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips card */}
            <Card className="border-none shadow-sm bg-blue-50/60">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-blue-800 mb-2">Tips</p>
                <ul className="space-y-1 text-[11px] text-blue-700 list-disc list-inside">
                  <li>Use <strong>{"{name}"}</strong> to personalise messages automatically.</li>
                  <li>Filter by batch year to target specific graduating classes.</li>
                  <li>WhatsApp links open for each selected recipient.</li>
                  <li>Browsers may block multiple pop-ups — allow pop-ups for this site.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Message Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {selectedAlumni.slice(0, 10).map(a => (
              <div key={a.id} className="rounded-lg border bg-slate-50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] bg-[#1E2A4A]/10 text-[#1E2A4A] font-bold">
                      {initials(a.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-semibold text-[#1E2A4A]">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground">{a.whatsapp || a.phone || "—"}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-white rounded p-2 border">
                  {personalise(a.name)}
                </p>
              </div>
            ))}
            {selectedAlumni.length > 10 && (
              <p className="text-xs text-muted-foreground text-center">
                …and {selectedAlumni.length - 10} more recipients
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-2" onClick={() => { setPreviewOpen(false); handleSend(); }}>
              <Send className="h-4 w-4" /> Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Send Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Confirm Send</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              You are about to send a WhatsApp message to <strong className="text-[#1E2A4A]">{selected.size} alumni</strong>.
            </p>
            <div className="rounded-md bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
              Note: WhatsApp links will open in new tabs. Please allow pop-ups in your browser for bulk sending.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-2" onClick={doSend}>
              <MessageCircle className="h-4 w-4" /> Send WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
