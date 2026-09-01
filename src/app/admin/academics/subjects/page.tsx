"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus, Search, ChevronRight, Pencil, Trash2,
  BookOpen, FlaskConical, Layers, GraduationCap,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { Skeleton } from "@/components/ui/skeleton";

const BOARDS = ["CBSE", "ICSE", "State", "Samacheer", "IB"];
const TYPE_COLORS: Record<string, string> = {
  Theory:    "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800",
  Practical: "bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800",
  Both:      "bg-teal-100 text-teal-700 hover:bg-teal-200 hover:text-teal-800",
};

interface SubjectDoc {
  id: string;
  name: string;
  classIds: string[];
  board: string;
  type: "Theory" | "Practical" | "Both";
  branchId: string;
}

interface ClassDoc {
  id: string;
  name: string;
  board: string;
  branchId: string;
}

const EMPTY = { name: "", classIds: [] as string[], board: "CBSE", type: "Theory" as const };

export default function SubjectManagementPage() {
  const { currentBranch } = useBranch();

  const { data: subjects, loading }      = useFirestoreCollection<SubjectDoc>("subjects", currentBranch);
  const { data: branchClasses }          = useFirestoreCollection<ClassDoc>("classes", currentBranch);

  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isOpen,     setIsOpen]     = useState(false);
  const [editing,    setEditing]    = useState<SubjectDoc | null>(null);
  const [form,       setForm]       = useState(EMPTY);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);

  const kpi = useMemo(() => ({
    total:     subjects.length,
    theory:    subjects.filter((s) => s.type === "Theory").length,
    practical: subjects.filter((s) => s.type === "Practical").length,
    both:      subjects.filter((s) => s.type === "Both").length,
  }), [subjects]);

  const filtered = useMemo(() =>
    subjects.filter((s) =>
      (typeFilter === "all" || s.type === typeFilter) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
       s.board.toLowerCase().includes(search.toLowerCase()))
    ), [subjects, search, typeFilter]);

  const getClassName = (id: string) =>
    branchClasses.find((c) => c.id === id)?.name ?? id;

  const toggleClassId = (cid: string) =>
    setForm((f) => ({
      ...f,
      classIds: f.classIds.includes(cid)
        ? f.classIds.filter((id) => id !== cid)
        : [...f.classIds, cid],
    }));

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, classIds: [] });
    setIsOpen(true);
  };

  const openEdit = (sub: SubjectDoc) => {
    setEditing(sub);
    setForm({ name: sub.name, classIds: [...(sub.classIds ?? [])], board: sub.board, type: sub.type });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Subject name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDocument("subjects", editing.id, { ...form });
        toast({ title: "Subject Updated", description: `${form.name} has been updated.` });
      } else {
        await addDocument("subjects", { ...form, branchId: currentBranch });
        toast({ title: "Subject Added", description: `${form.name} has been added.` });
      }
      setIsOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not save subject." });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDocument("subjects", deletingId);
      toast({ title: "Subject Deleted", variant: "destructive" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not delete subject." });
    }
    setDeletingId(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Subject Management" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/academics" className="hover:text-[#0D7C8F]">Academics</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Subjects</span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Subjects", value: kpi.total,     icon: GraduationCap, color: "text-[#1E2A4A]", bg: "bg-blue-100" },
            { label: "Theory",         value: kpi.theory,    icon: BookOpen,      color: "text-blue-600",  bg: "bg-blue-100" },
            { label: "Practical",      value: kpi.practical, icon: FlaskConical,  color: "text-purple-600",bg: "bg-purple-100" },
            { label: "Theory + Prac.", value: kpi.both,      icon: Layers,        color: "text-teal-600",  bg: "bg-teal-100" },
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
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search subjects..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Theory">Theory</SelectItem>
                  <SelectItem value="Practical">Practical</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add Subject
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
              <CardTitle className="text-base font-bold text-[#1E2A4A]">Subjects — {filtered.length}</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-8 text-center">#</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Linked Classes</TableHead>
                  <TableHead>Board</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? filtered.map((sub, idx) => (
                  <TableRow key={sub.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-bold text-[#1E2A4A]">{sub.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(sub.classIds ?? []).slice(0, 4).map((cid) => (
                          <Badge key={cid} variant="secondary" className="text-[10px] py-0 px-1.5">
                            {getClassName(cid)}
                          </Badge>
                        ))}
                        {(sub.classIds ?? []).length > 4 && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            +{(sub.classIds ?? []).length - 4}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="font-medium">{sub.board}</Badge></TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", TYPE_COLORS[sub.type] ?? "")}>{sub.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={() => openEdit(sub)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setDeletingId(sub.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      No subjects found. Click "Add Subject" to get started.
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
            <DialogTitle className="text-[#1E2A4A]">{editing ? "Edit Subject" : "Add New Subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Subject Name *</Label>
              <Input placeholder="e.g. Advanced Mathematics" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>

            {branchClasses.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Linked Classes</Label>
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50 max-h-36 overflow-y-auto">
                  {branchClasses.map((cls) => (
                    <div key={cls.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cls-${cls.id}`}
                        checked={form.classIds.includes(cls.id)}
                        onCheckedChange={() => toggleClassId(cls.id)}
                      />
                      <Label htmlFor={`cls-${cls.id}`} className="text-xs cursor-pointer">
                        {cls.name} ({cls.board})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Board</Label>
                <Select value={form.board} onValueChange={(v) => setForm((f) => ({ ...f, board: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Type</Label>
                <RadioGroup value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as any }))} className="flex flex-col gap-1.5 pt-1">
                  {["Theory", "Practical", "Both"].map((t) => (
                    <div key={t} className="flex items-center space-x-2">
                      <RadioGroupItem value={t} id={`type-${t}`} />
                      <Label htmlFor={`type-${t}`} className="cursor-pointer text-sm">{t}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : (editing ? "Save Changes" : "Create Subject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(v) => { if (!v) setDeletingId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Delete Subject</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This will remove the subject from all linked classes.</p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
