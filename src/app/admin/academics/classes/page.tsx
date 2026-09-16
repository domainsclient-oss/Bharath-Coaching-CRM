"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus, Search, ChevronRight, Pencil, Trash2, Users, LayoutGrid,
  GraduationCap, AlertTriangle, Wifi, WifiOff, User,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/context/BranchContext";
import { toast } from "@/hooks/use-toast";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { BOARDS, BOARD_FILTER_OPTIONS } from "@/config/boards";
import {
  CLASSES, CLASS_FILTER_OPTIONS, MODES, MODE_FILTER_OPTIONS,
  classLabel, batchClassNumber, batchLabel, batchKey,
} from "@/config/academics";

const MODE_COLORS: Record<string, string> = {
  "Offline":    "bg-[#1E2A4A] text-white",
  "Online":     "bg-[#0D7C8F] text-white",
  "One to One": "bg-rose-600 text-white",
};

const MODE_ICONS: Record<string, typeof Wifi> = {
  "Offline":    WifiOff,
  "Online":     Wifi,
  "One to One": User,
};

/** A batch. Stored in the `classes` collection, which other pages also read. */
interface BatchDoc {
  id: string;
  name: string;          // always "Class N" — attendance and leads read the grade from it
  classNumber?: string;  // absent on records made before batches
  board: string;
  mode: string;
  branchId: string;
}

interface StudentDoc {
  id: string;
  class?: string;
  board?: string;
  mode?: string;
  status?: string;
}

const EMPTY_FORM = { classNumber: "", board: BOARDS[0], mode: MODES[0] };

/** A record made before batches that no longer fits Class 1–12 × board × mode. */
function needsUpdate(b: BatchDoc): boolean {
  const n = batchClassNumber(b);
  return (
    !CLASSES.includes(n) ||
    !BOARDS.includes(b.board) ||
    !MODES.includes(b.mode) ||
    b.name !== classLabel(n)
  );
}

export default function BatchManagementPage() {
  const { currentBranch } = useBranch();

  const { data: batches, loading } = useFirestoreCollection<BatchDoc>("classes", currentBranch);
  const { data: students }         = useFirestoreCollection<StudentDoc>("students", currentBranch);

  const [search,      setSearch]      = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [boardFilter, setBoardFilter] = useState("All");
  const [modeFilter,  setModeFilter]  = useState("All");

  const [isOpen,     setIsOpen]     = useState(false);
  const [editing,    setEditing]    = useState<BatchDoc | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [deleting,   setDeleting]   = useState<BatchDoc | null>(null);
  const [saving,     setSaving]     = useState(false);

  // Active students per Class + Board + Mode — counted, never typed in.
  const studentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    students.forEach(s => {
      if (s.status !== "Active" || !s.class || !s.board || !s.mode) return;
      const key = batchKey(s.class, s.board, s.mode);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [students]);

  const countFor = (b: BatchDoc) =>
    studentCounts.get(batchKey(batchClassNumber(b), b.board, b.mode)) ?? 0;

  // Class 1 → 12, then the order boards and modes are listed in config.
  const sorted = useMemo(() => {
    const rank = (list: readonly string[], v: string) => {
      const i = list.indexOf(v);
      return i < 0 ? list.length : i;
    };
    return [...batches].sort((a, b) =>
      (Number(batchClassNumber(a)) || 99) - (Number(batchClassNumber(b)) || 99) ||
      rank(BOARDS, a.board) - rank(BOARDS, b.board) ||
      rank(MODES, a.mode) - rank(MODES, b.mode)
    );
  }, [batches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter(b =>
      (!q || batchLabel(b).toLowerCase().includes(q)) &&
      (classFilter === "All" || batchClassNumber(b) === classFilter) &&
      (boardFilter === "All" || b.board === boardFilter) &&
      (modeFilter  === "All" || b.mode  === modeFilter)
    );
  }, [sorted, search, classFilter, boardFilter, modeFilter]);

  const kpi = useMemo(() => ({
    batches:       batches.length,
    classesCovered: new Set(batches.map(batchClassNumber).filter(n => CLASSES.includes(n))).size,
    students:      batches.reduce((sum, b) => sum + countFor(b), 0),
    needsUpdate:   batches.filter(needsUpdate).length,
  }), [batches, studentCounts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Duplicate check for the dialog. The batch being edited doesn't clash with itself.
  const clashesWith = useMemo(() => {
    if (!form.classNumber) return null;
    const key = batchKey(form.classNumber, form.board, form.mode);
    return batches.find(b =>
      b.id !== editing?.id &&
      batchKey(batchClassNumber(b), b.board, b.mode) === key
    ) ?? null;
  }, [batches, form, editing]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsOpen(true);
  };

  const openEdit = (b: BatchDoc) => {
    const n = batchClassNumber(b);
    setEditing(b);
    // Legacy values that aren't in the lists are left blank / defaulted so the
    // admin has to pick a valid one — that's what fixes a "Needs update" row.
    setForm({
      classNumber: CLASSES.includes(n) ? n : "",
      board:       BOARDS.includes(b.board) ? b.board : BOARDS[0],
      mode:        MODES.includes(b.mode) ? b.mode : MODES[0],
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.classNumber) {
      toast({ title: "Select a class", variant: "destructive" });
      return;
    }
    if (clashesWith) {
      toast({
        title: "Batch already exists",
        description: `${batchLabel(clashesWith)} is already set up.`,
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name:        classLabel(form.classNumber),
      classNumber: form.classNumber,
      board:       form.board,
      mode:        form.mode,
    };
    const label = batchLabel(payload);

    setSaving(true);
    try {
      if (editing) {
        await updateDocument("classes", editing.id, payload);
        toast({ title: "Batch Updated", description: label });
      } else {
        await addDocument("classes", { ...payload, branchId: currentBranch });
        toast({ title: "Batch Added", description: label });
      }
      setIsOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not save batch." });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await deleteDocument("classes", deleting.id);
      toast({ title: "Batch Deleted", description: batchLabel(deleting), variant: "destructive" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not delete batch." });
    }
    setDeleting(null);
  };

  const hasFilters = !!search || classFilter !== "All" || boardFilter !== "All" || modeFilter !== "All";

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Batch Management" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/academics" className="hover:text-[#0D7C8F]">Academics</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Classes</span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Batches</h2>
          <p className="text-xs text-muted-foreground">
            A batch is one Class + Board + Mode, e.g. Class 10 - CBSE - Offline.
          </p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Batches",   value: String(kpi.batches),              icon: LayoutGrid,     color: "text-[#1E2A4A]", bg: "bg-blue-100" },
            { label: "Classes Covered", value: `${kpi.classesCovered} / ${CLASSES.length}`, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Active Students", value: String(kpi.students),             icon: Users,          color: "text-teal-600",  bg: "bg-teal-100" },
            { label: "Needs Update",    value: String(kpi.needsUpdate),          icon: AlertTriangle,  color: kpi.needsUpdate ? "text-amber-600" : "text-slate-400", bg: kpi.needsUpdate ? "bg-amber-100" : "bg-slate-100" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {kpi.needsUpdate > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              {kpi.needsUpdate} older record{kpi.needsUpdate !== 1 ? "s don't" : " doesn't"} fit
              Class 1–12 with a listed board and mode. Click the pencil on each row marked
              <span className="font-semibold"> Needs update</span> and pick valid values.
            </p>
          </div>
        )}

        {/* Filters + Add */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search batches..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add Batch
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASS_FILTER_OPTIONS.map(c => (
                    <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : classLabel(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={boardFilter} onValueChange={setBoardFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BOARD_FILTER_OPTIONS.map(b => (
                    <SelectItem key={b} value={b}>{b === "All" ? "All Boards" : b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODE_FILTER_OPTIONS.map(m => (
                    <SelectItem key={m} value={m}>{m === "All" ? "All Modes" : m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <Card className="border-none shadow-sm">
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          </Card>
        )}

        {/* Table */}
        {!loading && (
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b py-3 px-6">
              <CardTitle className="text-base font-bold text-[#1E2A4A]">Batches — {filtered.length}</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-8 text-center">#</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Board</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? filtered.map((b, idx) => {
                    const ModeIcon = MODE_ICONS[b.mode];
                    const stale = needsUpdate(b);
                    return (
                      <TableRow key={b.id} className={stale ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50/50"}>
                        <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <p className="font-bold text-[#1E2A4A]">{batchLabel(b)}</p>
                          {stale && (
                            <Badge className="mt-1 bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">
                              Needs update · saved as “{b.name}”
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{batchClassNumber(b) ? classLabel(batchClassNumber(b)) : "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="font-medium">{b.board || "—"}</Badge></TableCell>
                        <TableCell>
                          <Badge className={`${MODE_COLORS[b.mode] ?? "bg-slate-200 text-slate-700"} text-xs`}>
                            {ModeIcon && <ModeIcon className="h-3 w-3 mr-1 inline" />}
                            {b.mode || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-semibold">{countFor(b)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={() => openEdit(b)} title="Edit batch">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleting(b)} title="Delete batch">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        <LayoutGrid className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        {hasFilters
                          ? "No batches match these filters."
                          : "No batches yet. Click \"Add Batch\" to get started."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(v) => { if (!v) setIsOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">{editing ? "Edit Batch" : "Add New Batch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Class *</Label>
              <Select value={form.classNumber} onValueChange={(v) => setForm((f) => ({ ...f, classNumber: v }))}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => <SelectItem key={c} value={c}>{classLabel(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Board *</Label>
              <Select value={form.board} onValueChange={(v) => setForm((f) => ({ ...f, board: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mode *</Label>
              <Select value={form.mode} onValueChange={(v) => setForm((f) => ({ ...f, mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {form.classNumber && (
              clashesWith ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><span className="font-semibold">{batchLabel(clashesWith)}</span> already exists.</span>
                </div>
              ) : (
                <div className="rounded-lg border border-[#0D7C8F]/20 bg-[#0D7C8F]/5 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Batch: </span>
                  <span className="font-semibold text-[#1E2A4A]">
                    {batchLabel({ classNumber: form.classNumber, board: form.board, mode: form.mode })}
                  </span>
                </div>
              )
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleSave} disabled={saving || !form.classNumber || !!clashesWith}>
              {saving ? "Saving..." : (editing ? "Save Changes" : "Create Batch")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Delete Batch</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deleting ? batchLabel(deleting) : ""}</span>?
            Students are not deleted — they keep their class, board and mode. This cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
