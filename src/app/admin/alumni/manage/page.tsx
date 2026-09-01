"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, PlusCircle, Search, Edit, Trash2,
  GraduationCap, Users, Calendar, CheckCircle2, Phone, Mail,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AlumniDoc {
  id: string;
  name: string;
  appNo?: string;
  rollNo?: string;
  class?: string;
  board?: string;
  school?: string;
  subjects?: string[];
  phone?: string;
  whatsapp?: string;
  parentName?: string;
  email?: string;
  gender?: string;
  mode?: string;
  admissionDate?: string;
  discontinuedDate?: string;
  previousSchoolMarks?: number;
  status: string;
  branchId: string;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
function getBatch(date?: string) {
  return date ? new Date(date).getFullYear() : null;
}

const BOARDS   = ["CBSE", "ICSE", "State", "Samacheer", "IB"];
const CLASSES  = ["6","7","8","9","10","11","12"];
const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","English","Computer Science","Economics","Commerce","History","Geography","Tamil"];

type AlumniForm = {
  name: string; class: string; board: string; school: string;
  subjects: string[]; phone: string; whatsapp: string; parentName: string;
  email: string; gender: string; mode: string; admissionDate: string;
  discontinuedDate: string; previousSchoolMarks: string;
};

const EMPTY: AlumniForm = {
  name: "", class: "12", board: "CBSE", school: "", subjects: [],
  phone: "", whatsapp: "", parentName: "", email: "", gender: "",
  mode: "Offline", admissionDate: "", discontinuedDate: "", previousSchoolMarks: "",
};

export default function ManageAlumniPage() {
  const { currentBranch } = useBranch();

  const { data: allStudents, loading } = useFirestoreCollection<AlumniDoc>("students", currentBranch);

  const alumni = useMemo(
    () => allStudents.filter(s => s.status === "Discontinued" || s.status === "Alumni"),
    [allStudents],
  );

  const [search,      setSearch]      = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [boardFilter, setBoardFilter] = useState("All");
  const [yearFilter,  setYearFilter]  = useState("All");
  const [isOpen,      setIsOpen]      = useState(false);
  const [editing,     setEditing]     = useState<AlumniDoc | null>(null);
  const [form,        setForm]        = useState<AlumniForm>(EMPTY);
  const [deleteTarget,setDeleteTarget]= useState<AlumniDoc | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  const kpi = useMemo(() => {
    const thisYear = new Date().getFullYear();
    return {
      total:     alumni.length,
      thisYear:  alumni.filter(s => getBatch(s.discontinuedDate) === thisYear).length,
      withEmail: alumni.filter(s => s.email).length,
    };
  }, [alumni]);

  const years = useMemo(() => {
    const set = new Set(
      alumni.map(s => getBatch(s.discontinuedDate)).filter(Boolean) as number[]
    );
    return ["All", ...Array.from(set).sort((a, b) => b - a).map(String)];
  }, [alumni]);

  const filtered = useMemo(() =>
    alumni.filter(s => {
      const py = getBatch(s.discontinuedDate);
      return (
        (classFilter === "All" || s.class === classFilter) &&
        (boardFilter === "All" || s.board === boardFilter) &&
        (yearFilter  === "All" || String(py) === yearFilter) &&
        (!search || [s.name, s.appNo, s.phone].some(
          f => f?.toLowerCase().includes(search.toLowerCase())
        ))
      );
    }),
    [alumni, classFilter, boardFilter, yearFilter, search],
  );

  const openAdd = () => { setEditing(null); setForm(EMPTY); setIsOpen(true); };

  const openEdit = (s: AlumniDoc) => {
    setEditing(s);
    setForm({
      name: s.name, class: s.class ?? "12", board: s.board ?? "CBSE",
      school: s.school ?? "", subjects: s.subjects ?? [],
      phone: s.phone ?? "", whatsapp: s.whatsapp ?? "",
      parentName: s.parentName ?? "", email: s.email ?? "",
      gender: s.gender ?? "", mode: s.mode ?? "Offline",
      admissionDate: s.admissionDate ?? "",
      discontinuedDate: s.discontinuedDate ?? "",
      previousSchoolMarks: s.previousSchoolMarks != null ? String(s.previousSchoolMarks) : "",
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: "Name and phone are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name, class: form.class, board: form.board,
        school: form.school, subjects: form.subjects,
        phone: form.phone, whatsapp: form.whatsapp,
        parentName: form.parentName, email: form.email,
        gender: form.gender, mode: form.mode,
        admissionDate: form.admissionDate,
        discontinuedDate: form.discontinuedDate,
        previousSchoolMarks: form.previousSchoolMarks ? Number(form.previousSchoolMarks) : null,
        status: "Discontinued",
        branchId: currentBranch,
      };
      if (editing) {
        await updateDocument("students", editing.id, payload);
        toast({ title: "Alumni Updated", description: `${form.name} updated.` });
      } else {
        await addDocument("students", payload);
        toast({ title: "Alumni Added", description: `${form.name} added to alumni records.` });
      }
      setIsOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not save alumni record." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument("students", deleteTarget.id);
      toast({ title: "Alumni Removed", description: `${deleteTarget.name} removed.`, variant: "destructive" });
      setDeleteTarget(null);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not remove alumni record." });
    } finally {
      setDeleting(false);
    }
  };

  const setF = (k: keyof AlumniForm, v: string) => setForm(p => ({ ...p, [k]: v }));
  const toggleSubject = (sub: string) =>
    setForm(p => ({
      ...p,
      subjects: p.subjects.includes(sub) ? p.subjects.filter(s => s !== sub) : [...p.subjects, sub],
    }));

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Manage Alumni" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/alumni" className="hover:text-[#0D7C8F]">Alumni</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Manage Alumni</span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Alumni",       value: kpi.total,     icon: GraduationCap, color: "text-[#1E2A4A]", bg: "bg-blue-100"   },
            { label: `${currentBranch} Branch`, value: alumni.length, icon: Users,     color: "text-teal-600",  bg: "bg-teal-100"   },
            { label: "This Year Batch",    value: kpi.thisYear,  icon: Calendar,      color: "text-purple-600",bg: "bg-purple-100" },
            { label: "With Email",         value: kpi.withEmail, icon: CheckCircle2,  color: "text-green-600", bg: "bg-green-100"  },
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

        {/* Filters + Add */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name, app no, phone..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Classes</SelectItem>
                  {CLASSES.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={boardFilter} onValueChange={setBoardFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="All Boards" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Boards</SelectItem>
                  {BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All Years" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y === "All" ? "All Years" : `Batch ${y}`}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={openAdd}>
                <PlusCircle className="h-4 w-4" /> Add Alumni
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-3 px-6">
            <CardTitle className="text-base font-bold text-[#1E2A4A]">
              {loading ? "Loading alumni..." : `Alumni Records — ${filtered.length}`}
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-8 text-center">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class / Board</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Batch Year</TableHead>
                <TableHead>Marks %</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>No alumni records found{alumni.length === 0 ? ` for ${currentBranch}` : " matching your filters"}.</p>
                    {alumni.length === 0 && <p className="text-xs mt-1">Discontinued students appear here automatically, or use &quot;Add Alumni&quot; to add manually.</p>}
                  </TableCell>
                </TableRow>
              ) : filtered.map((s, idx) => (
                <TableRow key={s.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 border flex-shrink-0">
                        <AvatarFallback className="bg-[#1E2A4A]/10 text-[#1E2A4A] text-xs font-bold">
                          {getInitials(s.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-[#1E2A4A]">{s.name}</p>
                        {s.email && <p className="text-[10px] text-muted-foreground">{s.email}</p>}
                        <Badge variant="outline" className="text-[9px] mt-0.5">{s.branchId}</Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{s.class ? `Class ${s.class}` : "—"}</p>
                    {s.board && <Badge variant="outline" className="text-xs">{s.board}</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {(s.subjects ?? []).slice(0, 3).map(sub => (
                        <Badge key={sub} variant="secondary" className="text-[10px] py-0 px-1.5">{sub}</Badge>
                      ))}
                      {(s.subjects?.length ?? 0) > 3 && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">+{(s.subjects?.length ?? 0) - 3}</Badge>
                      )}
                      {(!s.subjects || s.subjects.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.discontinuedDate ? (
                      <>
                        <div className="text-sm font-bold text-[#0D7C8F]">Batch {getBatch(s.discontinuedDate)}</div>
                        <div className="text-[10px] text-muted-foreground">{s.discontinuedDate}</div>
                      </>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {s.previousSchoolMarks ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-[#0D7C8F]" style={{ width: `${Math.min(s.previousSchoolMarks, 100)}%` }} />
                        </div>
                        <span className="text-xs font-bold">{s.previousSchoolMarks}%</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {s.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {s.phone}
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {s.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={() => openEdit(s)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteTarget(s)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={v => { if (!v) setIsOpen(false); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">
              {editing ? "Edit Alumni Record" : "Add New Alumni"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs font-semibold">Full Name *</Label>
              <Input placeholder="Student full name" value={form.name} onChange={e => setF("name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Class *</Label>
              <Select value={form.class} onValueChange={v => setF("class", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Board *</Label>
              <Select value={form.board} onValueChange={v => setF("board", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs font-semibold">School</Label>
              <Input placeholder="School name" value={form.school} onChange={e => setF("school", e.target.value)} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs font-semibold">Subjects</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50">
                {SUBJECTS.map(sub => (
                  <button key={sub} type="button" onClick={() => toggleSubject(sub)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-all",
                      form.subjects.includes(sub)
                        ? "bg-[#0D7C8F] text-white border-[#0D7C8F]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#0D7C8F]"
                    )}
                  >{sub}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Phone *</Label>
              <PhoneInput placeholder="10-digit number" value={form.phone} onChange={v => setF("phone", v)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">WhatsApp</Label>
              <PhoneInput placeholder="WhatsApp number" value={form.whatsapp} onChange={v => setF("whatsapp", v)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Parent Name</Label>
              <Input placeholder="Parent / Guardian" value={form.parentName} onChange={e => setF("parentName", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email</Label>
              <Input type="email" placeholder="student@email.com" value={form.email} onChange={e => setF("email", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Gender</Label>
              <Select value={form.gender} onValueChange={v => setF("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Study Mode</Label>
              <Select value={form.mode} onValueChange={v => setF("mode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Offline">Offline</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Admission Date</Label>
              <Input type="date" value={form.admissionDate} onChange={e => setF("admissionDate", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Passed Out Date</Label>
              <Input type="date" value={form.discontinuedDate} onChange={e => setF("discontinuedDate", e.target.value)} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs font-semibold">Board Exam Marks (%)</Label>
              <Input type="number" min={0} max={100} placeholder="e.g. 92" value={form.previousSchoolMarks} onChange={e => setF("previousSchoolMarks", e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Alumni"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Remove Alumni Record</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
