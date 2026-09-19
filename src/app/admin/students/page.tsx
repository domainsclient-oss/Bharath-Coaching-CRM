
"use client";

import { CLASSES, MODES } from "@/config/academics";
import { BOARD_FILTER_OPTIONS } from "@/config/boards";
import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  UserPlus, 
  Download, 
  Upload,
  Search, 
  Filter, 
  Eye, 
  Pencil, 
  XCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Trash2
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { batchWrite, deleteDocument } from "@/services/firestoreService";
import { logAuditAuto } from "@/lib/auditLogger";
import { compareAppNo } from "@/lib/appNumber";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToCSV } from "@/lib/exportToCSV";
import { ImportStudentsDialog } from "@/components/students/import-students-dialog";

interface Student {
  id: string;
  appNo?: string;
  name: string;
  class: string;
  board: string;
  subjects?: string[];
  mode: string;
  status: string;
  parentName?: string;
  photo?: string;
  branchId: string;
}

export default function StudentListPage() {
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // ── Real-time Firestore subscription ─────────────────────────────────────
  const { data: students, loading, error } = useFirestoreCollection<Student>(
    "students",
    currentBranch
  );

  // ── Filters ───────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedBoard, setSelectedBoard] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const itemsPerPage = 10;

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const searchMatch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.appNo ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!searchMatch) return false;
      if (selectedClass  !== "all" && student.class  !== selectedClass)  return false;
      if (selectedBoard  !== "all" && student.board  !== selectedBoard)  return false;
      if (selectedMode   !== "all" && student.mode   !== selectedMode)   return false;
      if (selectedStatus !== "all" && student.status !== selectedStatus) return false;
      return true;
    }).sort((a, b) => compareAppNo(a.appNo, b.appNo));
  }, [students, searchTerm, selectedClass, selectedBoard, selectedMode, selectedStatus]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase();

  const handleReset = () => {
    setSearchTerm("");
    setSelectedClass("all");
    setSelectedBoard("all");
    setSelectedMode("all");
    setSelectedStatus("all");
    setCurrentPage(1);
    toast({
      title: "Filters Reset",
      description: "Showing all students for the current branch.",
    });
  };

  const handleExportCSV = () => {
    const headers = ["App No", "Name", "Parent Name", "Class", "Board", "Subjects", "Mode", "Status", "Phone"];
    const rows = filteredStudents.map(s => [
      s.appNo ?? "",
      s.name,
      s.parentName ?? "",
      `Class ${s.class}`,
      s.board,
      (s.subjects ?? []).join("; "),
      s.mode,
      s.status,
      (s as any).phone ?? "",
    ]);
    const date = new Date().toISOString().split("T")[0];
    exportToCSV(headers, rows, `students-${currentBranch}-${date}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument("students", deleteTarget.id);
      toast({ title: "Student Removed", description: `${deleteTarget.name} has been deleted.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not delete student." });
    } finally {
      setDeleteTarget(null);
    }
  };

  const closeDeleteAll = () => {
    if (deletingAll) return;
    setDeleteAllOpen(false);
    setDeleteAllConfirm("");
  };

  // Deletes every student in the branch, whatever the filters show.
  // Firestore caps a batch at 500 writes, so larger rolls go in chunks.
  const handleDeleteAll = async () => {
    if (!isAdmin || deleteAllConfirm !== "DELETE") return;
    const ids = students.map(s => s.id);
    setDeletingAll(true);
    let deleted = 0;
    try {
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        await batchWrite(chunk.map(id => ({ type: "delete" as const, collection: "students", id })));
        deleted += chunk.length;
      }
      logAuditAuto("Delete", "students", `Deleted all ${deleted} student records`, {
        severity: "Critical",
        branchId: currentBranch ?? "",
      });
      toast({ title: "All Students Deleted", description: `${deleted} student records were deleted.` });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: deleted
          ? `Deleted ${deleted} of ${ids.length} students, then failed. Try again to delete the rest.`
          : "Could not delete students.",
      });
    } finally {
      setDeletingAll(false);
      setDeleteAllOpen(false);
      setDeleteAllConfirm("");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Students" />
      
      <main className="p-4 md:p-6 space-y-6">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1E2A4A]">Student Directory</h2>
            <div className="flex items-center text-xs text-muted-foreground gap-2">
              <Link href="/admin" className="hover:text-primary">Dashboard</Link>
              <span>/</span>
              <span className="font-medium text-foreground">Students</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setDeleteAllOpen(true)}
                disabled={loading || students.length === 0}
              >
                <Trash2 className="h-4 w-4" /> Delete All Students
              </Button>
            )}
            <Button variant="outline" size="sm" className="hidden md:flex gap-2" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
            <Button variant="outline" size="sm" className="hidden md:flex gap-2" onClick={handleExportCSV}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Link href="/admin/students/add">
              <Button size="sm" className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
                <UserPlus className="h-4 w-4" /> Add Student
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative lg:col-span-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input autoCapitalize="off" 
                  placeholder="Search name, app no..." 
                  className="pl-10 h-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {CLASSES.map(cls => (
                    <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Boards</SelectItem>
                  {BOARD_FILTER_OPTIONS.filter(b => b !== 'All').map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-10 flex-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Discontinued">Discontinued</SelectItem>
                    <SelectItem value="Alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-[#0D7C8F] hover:text-white h-10"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filteredStudents.length}</span> of {students.length} students
            </div>
          </CardContent>
        </Card>

        {/* Loading / Error states */}
        {loading && (
          <Card className="border-none shadow-sm">
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          </Card>
        )}
        {error && (
          <Card className="border-none shadow-sm">
            <div className="p-6 text-center text-red-500 text-sm">{error}</div>
          </Card>
        )}

        {/* Results Table */}
        {!loading && !error && (
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[120px]">App No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Board</TableHead>
                <TableHead className="hidden lg:table-cell">Subjects</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-xs text-[#1E2A4A]">{student.appNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border">
                          <AvatarImage src={student.photo} />
                          <AvatarFallback className="bg-[#0D7C8F]/10 text-[#0D7C8F] text-[10px] font-bold">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#1E2A4A]">{student.name}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">Class {student.class}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium border-slate-200">
                        {student.board}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(student.subjects ?? []).slice(0, 2).map((sub, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
                            {sub}
                          </Badge>
                        ))}
                        {(student.subjects ?? []).length > 2 && (
                          <span className="text-[9px] text-muted-foreground ml-1">+{(student.subjects ?? []).length - 2} more</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] font-bold ${student.mode === 'Online' ? 'bg-[#0D7C8F]' : student.mode === 'One to One' ? 'bg-rose-600' : 'bg-[#1E2A4A]'}`}>
                        {student.mode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] font-bold ${
                          student.status === 'Active' ? 'text-green-600 border-green-200 bg-green-50' : 
                          student.status === 'Discontinued' ? 'text-red-600 border-red-200 bg-red-50' : 
                          'text-gray-500 border-gray-200 bg-gray-50'
                        }`}
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:text-blue-700" asChild>
                          <Link href={`/admin/students/${student.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:text-amber-700" asChild>
                          <Link href={`/admin/students/${student.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeleteTarget({ id: student.id, name: student.name })}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="rounded-full bg-slate-100 p-4">
                        <GraduationCap className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-600">No students found</p>
                        <p className="text-xs text-slate-400">Try adjusting your filters or search criteria.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleReset}>Clear All Filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredStudents.length > itemsPerPage && (
            <div className="flex items-center justify-between p-4 bg-white border-t">
              <div className="text-xs text-muted-foreground">
                Page <span className="font-bold text-foreground">{currentPage}</span> of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
        )}
      </main>

      <ImportStudentsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        branchId={currentBranch}
        existing={students}
      />

      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Remove Student</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>? This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteAllOpen} onOpenChange={v => { if (!v) closeDeleteAll(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete All Students</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              This permanently deletes all <span className="font-semibold text-foreground">{students.length}</span> student
              records, including any hidden by the current filters. It cannot be undone.
            </p>
            <p>Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm.</p>
            <Input
              autoCapitalize="off"
              autoComplete="off"
              value={deleteAllConfirm}
              onChange={e => setDeleteAllConfirm(e.target.value)}
              placeholder="DELETE"
              disabled={deletingAll}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDeleteAll} disabled={deletingAll}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deleteAllConfirm !== "DELETE" || deletingAll}
            >
              {deletingAll ? "Deleting..." : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
