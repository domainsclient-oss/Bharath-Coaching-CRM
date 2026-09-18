"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { doc, writeBatch } from "firebase/firestore";
import { ChevronRight, Eye, Loader2, Pencil, Search, Trash2, X } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db } from "@/config/firebase";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";
import { classNumberOf } from "@/config/academics";
import { GradeBadge, MarkListRow, SubjectMark, summarise, toSubjectMark } from "./markList";
import MarkListDialog from "./MarkListDialog";
import EditMarksDialog from "./EditMarksDialog";

export default function StudentMarkListPage() {
  const { currentBranch } = useBranch();
  const [search, setSearch] = useState("");
  // Rows are held by key and looked up in the live list, so an open dialog
  // follows edits made elsewhere and closes if its row disappears.
  const [viewKey, setViewKey] = useState<string | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: allMarks, loading: marksLoading } = useFirestoreCollection<any>("marks", currentBranch, { orderByField: "date" });
  const { data: allStudents } = useFirestoreCollection<any>("students", currentBranch);

  const rows = useMemo<MarkListRow[]>(() => {
    const studentById = new Map(allStudents.map((s: any) => [s.id, s]));
    // One row per student + exam. Marks saved without an exam are grouped
    // under their test name ("Manual Entry").
    const byRow = new Map<string, { studentId: string; examName: string; examKey: string; subjects: SubjectMark[]; sample: any }>();
    allMarks.forEach((m: any) => {
      if (!m.studentId) return;
      const examKey = m.examId ?? `test:${m.testName ?? "Manual Entry"}`;
      const key = `${m.studentId}|${examKey}`;
      let entry = byRow.get(key);
      if (!entry) {
        entry = { studentId: m.studentId, examName: m.testName ?? "Manual Entry", examKey, subjects: [], sample: m };
        byRow.set(key, entry);
      }
      entry.subjects.push(toSubjectMark(m));
    });

    return Array.from(byRow, ([key, r]) => {
      const student = studentById.get(r.studentId);
      const rawClass = student?.class ?? r.sample.class;
      return {
        key,
        studentId: r.studentId,
        name: student?.name ?? r.sample.studentName ?? "—",
        classNumber: classNumberOf(rawClass) || String(rawClass ?? ""),
        rollNo: student?.rollNo ? String(student.rollNo) : "",
        exam: summarise(r.examKey, r.examName, r.subjects),
      };
    })
      // Most recent exam first, then by student name.
      .sort((a, b) => b.exam.latestDate.localeCompare(a.exam.latestDate) || a.name.localeCompare(b.name));
  }, [allMarks, allStudents]);

  const rowByKey = useMemo(() => new Map(rows.map(r => [r.key, r])), [rows]);
  const viewRow = viewKey ? rowByKey.get(viewKey) ?? null : null;
  const editRow = editKey ? rowByKey.get(editKey) ?? null : null;
  const deleteRow = deleteKey ? rowByKey.get(deleteKey) ?? null : null;

  const query = search.trim().toLowerCase();
  const visible = query
    ? rows.filter(r => r.name.toLowerCase().includes(query) || r.exam.name.toLowerCase().includes(query))
    : rows;

  const confirmDelete = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      const batch = writeBatch(db);
      deleteRow.exam.subjects.forEach(s => batch.delete(doc(db, "marks", s.id)));
      await batch.commit();
      toast({
        title: "Marks Deleted",
        description: `${deleteRow.name}'s marks for ${deleteRow.exam.name} were deleted.`,
      });
      setDeleteKey(null);
    } catch (err) {
      console.error("Failed to delete marks:", err);
      toast({ title: "Error", description: "Could not delete marks.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Student Mark List" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/examination" className="hover:text-[#0D7C8F]">Examination</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Student Mark List</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Student Mark List</h2>
          {!marksLoading && (
            <span className="text-sm text-muted-foreground">
              {visible.length} {visible.length === 1 ? "record" : "records"}
            </span>
          )}
        </div>

        {/* Search */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1.5">Search</p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoCapitalize="off"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Type a student or exam name..."
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-right">Total Marks</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marksLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                      Loading marks...
                    </TableCell>
                  </TableRow>
                ) : visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                      {query
                        ? `No marks found matching "${search.trim()}".`
                        : "No marks have been saved yet. Enter marks in Mark Entry to see them here."}
                    </TableCell>
                  </TableRow>
                ) : visible.map(row => (
                  <TableRow key={row.key} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-[#1E2A4A]">{row.exam.name}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.classNumber ? `Class ${row.classNumber}` : "—"}</TableCell>
                    <TableCell>{row.rollNo || "—"}</TableCell>
                    <TableCell className="text-center"><GradeBadge grade={row.exam.grade} /></TableCell>
                    <TableCell className="text-right font-bold text-[#1E2A4A] whitespace-nowrap">
                      {row.exam.totalObtained} / {row.exam.totalMax}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-[#0D7C8F] hover:text-[#0D7C8F] hover:bg-teal-50"
                          onClick={() => setViewKey(row.key)}
                          title="View mark list"
                          aria-label={`View mark list for ${row.name}, ${row.exam.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => setEditKey(row.key)}
                          title="Edit marks"
                          aria-label={`Edit marks for ${row.name}, ${row.exam.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteKey(row.key)}
                          title="Delete marks"
                          aria-label={`Delete marks for ${row.name}, ${row.exam.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </main>

      <MarkListDialog row={viewRow} onClose={() => setViewKey(null)} />

      {editRow && <EditMarksDialog key={editRow.key} row={editRow} onClose={() => setEditKey(null)} />}

      <AlertDialog open={!!deleteRow} onOpenChange={open => { if (!open && !deleting) setDeleteKey(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete these marks?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRow && (
                <>
                  This permanently deletes {deleteRow.exam.subjects.length}{" "}
                  {deleteRow.exam.subjects.length === 1 ? "subject mark" : "subject marks"} for{" "}
                  <span className="font-semibold text-foreground">{deleteRow.name}</span> in{" "}
                  <span className="font-semibold text-foreground">{deleteRow.exam.name}</span>.
                  This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 gap-2"
              disabled={deleting}
              onClick={e => { e.preventDefault(); confirmDelete(); }}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
