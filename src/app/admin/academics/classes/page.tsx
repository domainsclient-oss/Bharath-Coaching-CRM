"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus, Search, ChevronRight, Pencil, Trash2,
  Users, LayoutGrid, BookOpen, Wifi, WifiOff, Layers,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBranch } from "@/context/BranchContext";
import { toast } from "@/hooks/use-toast";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { Skeleton } from "@/components/ui/skeleton";

const BOARDS = ["CBSE", "ICSE", "State", "Samacheer", "IB"];
const MODE_COLORS: Record<string, string> = {
  Offline: "bg-[#1E2A4A] text-white",
  Online:  "bg-[#0D7C8F] text-white",
  Both:    "bg-teal-600 text-white",
};

interface ClassDoc {
  id: string;
  name: string;
  board: string;
  mode: string;
  studentCount: number;
  branchId: string;
}

const EMPTY = { name: "", board: "CBSE", mode: "Offline", studentCount: 0 };

export default function ClassManagementPage() {
  const { currentBranch } = useBranch();

  const { data: classes, loading } = useFirestoreCollection<ClassDoc>("classes", currentBranch);

  const [search,     setSearch]     = useState("");
  const [isOpen,     setIsOpen]     = useState(false);
  const [editing,    setEditing]    = useState<ClassDoc | null>(null);
  const [form,       setForm]       = useState(EMPTY);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);

  const kpi = useMemo(() => ({
    total:    classes.length,
    cbse:     classes.filter((c) => c.board === "CBSE").length,
    state:    classes.filter((c) => c.board === "State").length,
    students: classes.reduce((s, c) => s + (c.studentCount ?? 0), 0),
  }), [classes]);

  const filtered = useMemo(() =>
    classes.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.board.toLowerCase().includes(search.toLowerCase())
    ), [classes, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setIsOpen(true);
  };

  const openEdit = (cls: ClassDoc) => {
    setEditing(cls);
    setForm({ name: cls.name, board: cls.board, mode: cls.mode, studentCount: cls.studentCount });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Class name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDocument("classes", editing.id, { ...form });
        toast({ title: "Class Updated", description: `${form.name} has been updated.` });
      } else {
        await addDocument("classes", { ...form, branchId: currentBranch });
        toast({ title: "Class Added", description: `${form.name} has been added.` });
      }
      setIsOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not save class." });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDocument("classes", deletingId);
      toast({ title: "Class Deleted", variant: "destructive" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not delete class." });
    }
    setDeletingId(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Class Management" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/academics" className="hover:text-[#0D7C8F]">Academics</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Classes</span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Classes",  value: kpi.total,    icon: LayoutGrid, color: "text-[#1E2A4A]", bg: "bg-blue-100" },
            { label: "CBSE Classes",   value: kpi.cbse,     icon: BookOpen,   color: "text-blue-600",  bg: "bg-blue-100" },
            { label: "State Board",    value: kpi.state,    icon: Layers,     color: "text-purple-600",bg: "bg-purple-100" },
            { label: "Total Students", value: kpi.students, icon: Users,      color: "text-teal-600",  bg: "bg-teal-100" },
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

        {/* Filter + Add */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by class name or board..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add Class
              </Button>
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
              <CardTitle className="text-base font-bold text-[#1E2A4A]">Classes — {filtered.length}</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-8 text-center">#</TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Board</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? filtered.map((cls, idx) => (
                  <TableRow key={cls.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-bold text-[#1E2A4A]">{cls.name}</TableCell>
                    <TableCell><Badge variant="outline" className="font-medium">{cls.board}</Badge></TableCell>
                    <TableCell>
                      <Badge className={`${MODE_COLORS[cls.mode] ?? "bg-slate-200 text-slate-700"} text-xs`}>
                        {cls.mode === "Online" ? <Wifi className="h-3 w-3 mr-1 inline" /> : cls.mode === "Offline" ? <WifiOff className="h-3 w-3 mr-1 inline" /> : null}
                        {cls.mode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold">{cls.studentCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={() => openEdit(cls)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setDeletingId(cls.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <LayoutGrid className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      No classes found. Click "Add Class" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(v) => { if (!v) setIsOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">{editing ? "Edit Class" : "Add New Class"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Class Name *</Label>
              <Input placeholder="e.g. Class 10 A" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Board *</Label>
              <Select value={form.board} onValueChange={(v) => setForm((f) => ({ ...f, board: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Study Mode</Label>
              <RadioGroup value={form.mode} onValueChange={(v) => setForm((f) => ({ ...f, mode: v }))} className="flex gap-4 pt-1">
                {["Offline", "Online", "Both"].map((m) => (
                  <div key={m} className="flex items-center space-x-2">
                    <RadioGroupItem value={m} id={`mode-${m}`} />
                    <Label htmlFor={`mode-${m}`} className="cursor-pointer">{m}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Student Count</Label>
              <Input type="number" min={0} value={form.studentCount} onChange={(e) => setForm((f) => ({ ...f, studentCount: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : (editing ? "Save Changes" : "Create Class")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(v) => { if (!v) setDeletingId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Delete Class</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this class? This cannot be undone.</p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
