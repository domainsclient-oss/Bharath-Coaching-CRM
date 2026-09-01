"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Search, FileText, X, Loader2 } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";

interface FeeDoc {
  id: string;
  studentId?: string;
  studentName?: string;
  name?: string;
  class?: string;
  board?: string;
  subjects?: string[];
  billNo?: string;
  feeType?: string;
  totalFee: number;
  amountPaid: number;
  balance: number;
  status: string;
  paymentDate?: string | null;
  dueDate?: string;
  mode?: string | null;
  branchId: string;
}

const STATUS_COLORS: Record<string, string> = {
  "Paid":           "bg-green-100 text-green-700",
  "Partially Paid": "bg-amber-100 text-amber-700",
  "Unpaid":         "bg-red-100 text-red-700",
};

const fmt = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

export default function SearchFeesPage() {
  const { currentBranch } = useBranch();
  const { data: allFees, loading } = useFirestoreCollection<FeeDoc>(
    "fees",
    currentBranch,
    { orderByField: "createdAt", orderByDir: "desc" }
  );

  const [query,        setQuery]        = useState("");
  const [classFilter,  setClassFilter]  = useState("");
  const [boardFilter,  setBoardFilter]  = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [hasSearched,  setHasSearched]  = useState(false);

  const results = useMemo(() => {
    if (!hasSearched) return [];
    const q = query.trim().toLowerCase();
    return allFees.filter(r => {
      const sName = (r.studentName ?? r.name ?? "").toLowerCase();
      const billNo = (r.billNo ?? "").toLowerCase();
      const matchQ = !q || sName.includes(q) || billNo.includes(q);
      const matchClass  = !classFilter  || (r.class ?? "").includes(classFilter);
      const matchBoard  = !boardFilter  || (r.board ?? "").toLowerCase().includes(boardFilter.toLowerCase());
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      return matchQ && matchClass && matchBoard && matchStatus;
    });
  }, [hasSearched, allFees, query, classFilter, boardFilter, statusFilter]);

  const handleSearch = () => setHasSearched(true);
  const handleClear  = () => {
    setQuery(""); setClassFilter(""); setBoardFilter(""); setStatusFilter("All");
    setHasSearched(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Search Fees Payment" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/fees/collect" className="hover:text-[#0D7C8F]">Fees</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Search Fees</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Search Fees Payment</h2>

        {/* Search & filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-3">
            {/* Main search */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Search by student name or bill no..."
                  value={query}
                  onChange={e => { setQuery(e.target.value); setHasSearched(false); }}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={handleSearch}>
                <Search className="h-4 w-4" /> Search
              </Button>
              {hasSearched && (
                <Button variant="outline" className="gap-1" onClick={handleClear}>
                  <X className="h-4 w-4" /> Clear
                </Button>
              )}
            </div>

            {/* Secondary filters */}
            <div className="flex flex-wrap gap-3">
              <Input
                className="w-32"
                placeholder="Class"
                value={classFilter}
                onChange={e => { setClassFilter(e.target.value); setHasSearched(false); }}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
              <Input
                className="w-36"
                placeholder="Board (CBSE...)"
                value={boardFilter}
                onChange={e => { setBoardFilter(e.target.value); setHasSearched(false); }}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setHasSearched(false); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {!hasSearched && !loading && (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <Search className="h-10 w-10 opacity-20" />
            <p className="text-sm">Enter a name or bill number and click Search.</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {hasSearched && !loading && (
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b py-3 px-6">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0D7C8F]" />
                {results.length > 0
                  ? `${results.length} Result${results.length !== 1 ? "s" : ""}`
                  : "No results found"}
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead className="text-right">Total Fee</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length > 0 ? results.map(r => (
                    <TableRow key={r.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-sm text-[#1E2A4A]">
                        {r.studentName ?? r.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.class ? `Class ${r.class}` : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[130px]">
                          {(r.subjects ?? []).map(s => (
                            <Badge key={s} variant="secondary" className="text-xs py-0">{s}</Badge>
                          ))}
                          {!r.subjects?.length && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-[#0D7C8F]">
                        {r.billNo ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.totalFee)}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {fmt(r.amountPaid)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${(r.balance ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                        {fmt(r.balance)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.mode ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.paymentDate ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.dueDate ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 opacity-20" />
                          <p>No fee records match your search.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
