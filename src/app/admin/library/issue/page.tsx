"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, PlusCircle, Search, RotateCcw, Clock,
  CheckCircle2, AlertCircle, BookOpen, IndianRupee,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { addDocument, updateDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

type IssueStatus = "Issued" | "Returned" | "Overdue";

interface Book {
  id: string;
  title: string;
  isbn?: string;
  availableCopies: number;
  branchId: string;
}

interface BookIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  bookIsbn?: string;
  memberId: string;
  memberName: string;
  memberType: "Student" | "Staff";
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: IssueStatus;
  fineAmount?: number;
  branchId: string;
}

const STATUS_STYLES: Record<IssueStatus, string> = {
  Issued:   "bg-blue-100 text-blue-700",
  Returned: "bg-green-100 text-green-700",
  Overdue:  "bg-red-100 text-red-700",
};

const today = new Date().toISOString().split("T")[0];

function calcDueDate(issueDate: string, days = 14): string {
  const d = new Date(issueDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function calcFine(dueDate: string, returnDate: string): number {
  const due = new Date(dueDate);
  const ret = new Date(returnDate);
  if (ret <= due) return 0;
  return Math.ceil((ret.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)) * 5;
}

const EMPTY_FORM = {
  bookId: "", memberId: "", memberName: "", memberType: "Student" as "Student" | "Staff",
  issueDate: today, dueDate: calcDueDate(today),
};

export default function BookIssuePage() {
  const { currentBranch } = useBranch();

  const { data: issues, loading: issuesLoading } = useFirestoreCollection<BookIssue>("bookIssues", currentBranch);
  const { data: books,  loading: booksLoading  } = useFirestoreCollection<Book>("books", currentBranch);

  const loading = issuesLoading || booksLoading;

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isOpen,       setIsOpen]       = useState(false);
  const [returnId,     setReturnId]     = useState<string | null>(null);
  const [returnDate,   setReturnDate]   = useState(today);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [returning,    setReturning]    = useState(false);

  const kpi = useMemo(() => ({
    total:    issues.length,
    issued:   issues.filter(i => i.status === "Issued").length,
    overdue:  issues.filter(i => i.status === "Overdue").length,
    returned: issues.filter(i => i.status === "Returned").length,
    fines:    issues.reduce((s, i) => s + (i.fineAmount ?? 0), 0),
  }), [issues]);

  const filtered = useMemo(() =>
    issues.filter(i =>
      (statusFilter === "all" || i.status === statusFilter) &&
      (
        i.bookTitle.toLowerCase().includes(search.toLowerCase()) ||
        i.memberName.toLowerCase().includes(search.toLowerCase()) ||
        i.memberId.toLowerCase().includes(search.toLowerCase())
      )
    ), [issues, search, statusFilter]);

  const handleIssue = async () => {
    const book = books.find(b => b.id === form.bookId);
    if (!form.bookId || !form.memberId.trim() || !form.memberName.trim()) {
      toast({ title: "All fields are required.", variant: "destructive" }); return;
    }
    if (!book || (book.availableCopies ?? 0) === 0) {
      toast({ title: "No copies available.", description: "This book is currently out of stock.", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      await addDocument("bookIssues", {
        bookId:     form.bookId,
        bookTitle:  book.title,
        bookIsbn:   book.isbn ?? "",
        memberId:   form.memberId.trim(),
        memberName: form.memberName.trim(),
        memberType: form.memberType,
        issueDate:  form.issueDate,
        dueDate:    form.dueDate,
        status:     "Issued",
        branchId:   currentBranch,
      });
      // Decrement available copies
      await updateDocument("books", book.id, {
        availableCopies: (book.availableCopies ?? 1) - 1,
      });
      toast({ title: "Book Issued", description: `"${book.title}" issued to ${form.memberName}.` });
      setForm(EMPTY_FORM);
      setIsOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to issue book.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openReturn = (id: string) => { setReturnId(id); setReturnDate(today); };

  const handleReturn = async () => {
    if (!returnId) return;
    const issue = issues.find(i => i.id === returnId);
    if (!issue) return;
    const fine = calcFine(issue.dueDate, returnDate);
    setReturning(true);
    try {
      await updateDocument("bookIssues", returnId, {
        returnDate,
        status:     "Returned" as IssueStatus,
        fineAmount: fine > 0 ? fine : null,
      });
      // Restore available copies
      const book = books.find(b => b.id === issue.bookId);
      if (book) {
        await updateDocument("books", book.id, {
          availableCopies: (book.availableCopies ?? 0) + 1,
        });
      }
      toast({
        title: "Book Returned",
        description: fine > 0 ? `Returned. Fine: ₹${fine}.` : "Returned on time. No fine.",
      });
      setReturnId(null);
    } catch {
      toast({ title: "Error", description: "Failed to process return.", variant: "destructive" });
    } finally {
      setReturning(false);
    }
  };

  const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const returningIssue = issues.find(i => i.id === returnId);
  const previewFine    = returningIssue ? calcFine(returningIssue.dueDate, returnDate) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Book Issue & Return" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/library" className="hover:text-[#0D7C8F]">Library</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Book Issue &amp; Return</span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Records", value: kpi.total,        icon: BookOpen,     color: "text-[#1E2A4A]", bg: "bg-blue-100"  },
            { label: "Issued",        value: kpi.issued,       icon: BookOpen,     color: "text-blue-600",  bg: "bg-blue-100"  },
            { label: "Overdue",       value: kpi.overdue,      icon: AlertCircle,  color: "text-red-500",   bg: "bg-red-100"   },
            { label: "Returned",      value: kpi.returned,     icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
            { label: "Total Fines",   value: `₹${kpi.fines}`, icon: IndianRupee,  color: "text-amber-600", bg: "bg-amber-100" },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-3 flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    {loading
                      ? <Skeleton className="h-6 w-10 mt-1" />
                      : <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Overdue banner */}
        {!loading && kpi.overdue > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              <span className="font-bold">{kpi.overdue} book{kpi.overdue !== 1 ? "s" : ""}</span> are overdue.
              Fine of <span className="font-bold">₹5 per day</span> applies after the due date.
            </p>
          </div>
        )}

        {/* Filters + Issue */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by book title or member..." className="pl-9"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Issued">Issued</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={() => setIsOpen(true)}>
                <PlusCircle className="h-4 w-4" /> Issue Book
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-3 px-6">
            <CardTitle className="text-base font-bold text-[#1E2A4A]">
              {loading ? "Loading…" : `Issue Records — ${filtered.length}`}
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-8 text-center">#</TableHead>
                <TableHead>Book</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-28">Issue Date</TableHead>
                <TableHead className="w-28">Due Date</TableHead>
                <TableHead className="w-28">Return Date</TableHead>
                <TableHead className="w-24 text-center">Fine</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                <TableHead className="w-24 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(10)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="h-8 w-8 opacity-20" />
                      <p>No records found{search || statusFilter !== "all" ? " matching your filters" : `. Use "Issue Book" to create one.`}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((issue, idx) => (
                <TableRow key={issue.id} className={`hover:bg-slate-50/50 ${issue.status === "Overdue" ? "bg-red-50/30" : ""}`}>
                  <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <p className="font-semibold text-[#1E2A4A] text-sm">{issue.bookTitle}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{issue.bookIsbn || "—"}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{issue.memberName}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{issue.memberId}</p>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{issue.memberType}</Badge></TableCell>
                  <TableCell className="text-sm">{issue.issueDate}</TableCell>
                  <TableCell className={`text-sm font-medium ${issue.status === "Overdue" ? "text-red-600" : ""}`}>
                    {issue.dueDate}
                    {issue.status === "Overdue" && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-red-500" />
                        <span className="text-[10px] text-red-500">Overdue</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{issue.returnDate ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    {issue.fineAmount
                      ? <span className="text-sm font-bold text-red-600">₹{issue.fineAmount}</span>
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${STATUS_STYLES[issue.status]}`}>{issue.status}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {(issue.status === "Issued" || issue.status === "Overdue") && (
                      <Button size="sm" variant="outline"
                        className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50 hover:text-green-700"
                        onClick={() => openReturn(issue.id)}>
                        <RotateCcw className="h-3 w-3" /> Return
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>

      {/* Issue Book Dialog */}
      <Dialog open={isOpen} onOpenChange={v => { if (!v) { setIsOpen(false); setForm(EMPTY_FORM); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Issue a Book</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Select Book *</Label>
              <Select value={form.bookId} onValueChange={v => f("bookId", v)}>
                <SelectTrigger><SelectValue placeholder="Choose a book" /></SelectTrigger>
                <SelectContent>
                  {books.length === 0
                    ? <SelectItem value="_none" disabled>No books added yet</SelectItem>
                    : books.map(b => (
                        <SelectItem key={b.id} value={b.id} disabled={(b.availableCopies ?? 0) === 0}>
                          {b.title} — {(b.availableCopies ?? 0) > 0 ? `${b.availableCopies} available` : "Out of stock"}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Member ID *</Label>
                <Input placeholder="e.g. STU001" value={form.memberId} onChange={e => f("memberId", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Member Type</Label>
                <Select value={form.memberType} onValueChange={v => f("memberType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Member Name *</Label>
              <Input placeholder="Full name" value={form.memberName} onChange={e => f("memberName", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Issue Date</Label>
                <Input type="date" value={form.issueDate} max={today} onChange={e =>
                  setForm(p => ({ ...p, issueDate: e.target.value, dueDate: calcDueDate(e.target.value) }))
                } />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Due Date</Label>
                <Input type="date" value={form.dueDate} min={form.issueDate} onChange={e => f("dueDate", e.target.value)} />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
              Fine policy: <span className="font-semibold">₹5 per day</span> after the due date.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsOpen(false); setForm(EMPTY_FORM); }}>Cancel</Button>
            <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleIssue} disabled={saving}>
              {saving ? "Issuing…" : "Issue Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Book Dialog */}
      <Dialog open={!!returnId} onOpenChange={v => { if (!v) setReturnId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Return Book</DialogTitle>
          </DialogHeader>
          {returningIssue && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                <p className="text-sm font-semibold text-[#1E2A4A]">{returningIssue.bookTitle}</p>
                <p className="text-xs text-muted-foreground">Issued to: {returningIssue.memberName} · Due: {returningIssue.dueDate}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Return Date</Label>
                <Input type="date" value={returnDate} min={returningIssue.issueDate} max={today}
                  onChange={e => setReturnDate(e.target.value)} />
              </div>
              {previewFine > 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-bold text-red-700">Fine Applicable: ₹{previewFine}</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {Math.ceil((new Date(returnDate).getTime() - new Date(returningIssue.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue × ₹5/day
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Returned on time — no fine.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReturnId(null)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleReturn} disabled={returning}>
              <RotateCcw className="h-4 w-4 mr-1.5" />
              {returning ? "Processing…" : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
