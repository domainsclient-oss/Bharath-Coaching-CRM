"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Library, Download, BookOpen, AlertCircle, RotateCcw } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";

interface Book {
  id: string;
  title: string;
  author?: string;
  category?: string;
  totalCopies: number;
  availableCopies: number;
  branchId: string;
}

interface BookIssue {
  id: string;
  bookTitle: string;
  memberName: string;
  memberType: "Student" | "Staff";
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: "Issued" | "Returned" | "Overdue";
  fineAmount?: number;
  branchId: string;
}

const STATUS_COLOR: Record<string, string> = {
  Issued:   "bg-blue-100 text-blue-700",
  Returned: "bg-green-100 text-green-700",
  Overdue:  "bg-red-100 text-red-700",
};

export default function LibraryReportPage() {
  const { currentBranch } = useBranch();

  const { data: books,  loading: booksLoading  } = useFirestoreCollection<Book>("books", currentBranch);
  const { data: issues, loading: issuesLoading } = useFirestoreCollection<BookIssue>("bookIssues", currentBranch);

  const loading = booksLoading || issuesLoading;

  const [statusF, setStatusF] = useState("All");
  const [typeF,   setTypeF]   = useState("All");

  const filtered = useMemo(() =>
    issues.filter(i =>
      (statusF === "All" || i.status     === statusF) &&
      (typeF   === "All" || i.memberType === typeF)
    ), [issues, statusF, typeF]);

  const kpi = useMemo(() => ({
    totalBooks: books.length,
    issued:     issues.filter(i => i.status === "Issued").length,
    overdue:    issues.filter(i => i.status === "Overdue").length,
    returned:   issues.filter(i => i.status === "Returned").length,
  }), [books, issues]);

  const totalFines = useMemo(() => issues.reduce((s, i) => s + (i.fineAmount ?? 0), 0), [issues]);

  const catSummary = useMemo(() => {
    const map: Record<string, { total: number; available: number }> = {};
    books.forEach(b => {
      const cat = b.category ?? "Uncategorized";
      if (!map[cat]) map[cat] = { total: 0, available: 0 };
      map[cat].total     += b.totalCopies ?? 0;
      map[cat].available += b.availableCopies ?? 0;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [books]);

  const handleExport = () => {
    const headers = ["#", "Book", "Member", "Type", "Issue Date", "Due Date", "Status", "Fine"];
    const rows = filtered.map((i, idx) => [
      idx + 1, `"${i.bookTitle}"`, `"${i.memberName}"`, i.memberType, i.issueDate, i.dueDate, i.status, i.fineAmount ?? 0,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "library-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: `${filtered.length} records exported.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Library Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Library</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Books", value: kpi.totalBooks, color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: Library     },
            { label: "Issued",      value: kpi.issued,     color: "text-blue-600",  bg: "bg-blue-100",  icon: BookOpen    },
            { label: "Overdue",     value: kpi.overdue,    color: "text-red-600",   bg: "bg-red-100",   icon: AlertCircle },
            { label: "Returned",    value: kpi.returned,   color: "text-green-600", bg: "bg-green-100", icon: RotateCcw   },
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
                      ? <Skeleton className="h-7 w-10 mt-0.5" />
                      : <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Category breakdown */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Stock by Category</CardTitle>
            {totalFines > 0 && (
              <span className="text-xs text-red-600 font-semibold">Total Fines: ₹{totalFines}</span>
            )}
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)
            ) : catSummary.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4">No books added yet.</p>
            ) : catSummary.map(([cat, d]) => {
              const pct = d.total > 0 ? Math.round((d.available / d.total) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-4">
                  <span className="w-36 text-xs font-medium text-[#1E2A4A] truncate">{cat}</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 50 ? "bg-green-400" : pct > 20 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-green-600 font-semibold w-20 text-right">{d.available}/{d.total} avail.</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Issue records */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Issue Records — {filtered.length}</CardTitle>
            <div className="flex gap-2">
              <Select value={statusF} onValueChange={setStatusF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["All","Issued","Returned","Overdue"].map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Status" : s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={typeF} onValueChange={setTypeF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["All","Student","Staff"].map(t => <SelectItem key={t} value={t}>{t === "All" ? "All Members" : t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8 bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-1.5"
                onClick={handleExport} disabled={loading || filtered.length === 0}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Book</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Fine</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-20 text-center text-muted-foreground">No records found.</TableCell></TableRow>
              ) : filtered.map((i, idx) => (
                <TableRow key={i.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-semibold text-sm text-[#1E2A4A]">{i.bookTitle}</TableCell>
                  <TableCell className="text-sm">{i.memberName}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${i.memberType === "Student" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{i.memberType}</Badge></TableCell>
                  <TableCell className="text-xs">{i.issueDate}</TableCell>
                  <TableCell className="text-xs">{i.dueDate}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${STATUS_COLOR[i.status] ?? ""}`}>{i.status}</Badge></TableCell>
                  <TableCell className="text-right text-sm font-semibold text-red-600">{i.fineAmount ? `₹${i.fineAmount}` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
