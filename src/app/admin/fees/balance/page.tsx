"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, IndianRupee, MessageCircle, Search,
  AlertCircle, Loader2,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

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

const today = new Date();
today.setHours(0, 0, 0, 0);

const fmt = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

const STATUS_COLORS: Record<string, string> = {
  "Paid":           "bg-green-100 text-green-700",
  "Partially Paid": "bg-amber-100 text-amber-700",
  "Unpaid":         "bg-red-100 text-red-700",
};

export default function BalanceDuesPage() {
  const { currentBranch } = useBranch();
  const { data: allFees, loading } = useFirestoreCollection<FeeDoc>(
    "fees",
    currentBranch,
    { orderByField: "createdAt", orderByDir: "desc" }
  );

  const [nameFilter,    setNameFilter]    = useState("");
  const [classFilter,   setClassFilter]   = useState("");
  const [boardFilter,   setBoardFilter]   = useState("");
  const [statusFilter,  setStatusFilter]  = useState("All");

  // All records (show all, not just balance > 0)
  const filtered = useMemo(() => {
    return allFees.filter(r => {
      const sName = (r.studentName ?? r.name ?? "").toLowerCase();
      return (
        (!nameFilter   || sName.includes(nameFilter.toLowerCase())) &&
        (!classFilter  || (r.class ?? "").includes(classFilter)) &&
        (!boardFilter  || (r.board ?? "").toLowerCase().includes(boardFilter.toLowerCase())) &&
        (statusFilter === "All" || r.status === statusFilter)
      );
    });
  }, [allFees, nameFilter, classFilter, boardFilter, statusFilter]);

  // Summary — computed from ALL records with a balance
  const withBalance = useMemo(() => allFees.filter(r => (r.balance ?? 0) > 0), [allFees]);

  const summary = useMemo(() => ({
    totalOutstanding: withBalance.reduce((sum, r) => sum + (r.balance ?? 0), 0),
    studentsWithDues: new Set(withBalance.map(r => r.studentId ?? r.id)).size,
    overdue: withBalance.filter(r => r.dueDate && new Date(r.dueDate) < today).length,
  }), [withBalance]);

  const handleClear = () => {
    setNameFilter(""); setClassFilter(""); setBoardFilter(""); setStatusFilter("All");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Balance Fees" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/fees/collect" className="hover:text-[#0D7C8F]">Fees</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Balance Fees</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Balance Dues</h2>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading
                ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                : <p className="text-2xl font-bold text-red-600">{fmt(summary.totalOutstanding)}</p>
              }
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Students with Dues</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading
                ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                : <p className="text-2xl font-bold text-[#1E2A4A]">{summary.studentsWithDues}</p>
              }
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {loading
                ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                : <p className="text-2xl font-bold text-amber-600">{summary.overdue}</p>
              }
            </CardContent>
          </Card>
        </div>

        {/* Filters — live, no Search button needed */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Filter students with balance dues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <Input
                placeholder="Student Name"
                value={nameFilter}
                onChange={e => setNameFilter(e.target.value)}
              />
              <Input
                placeholder="Class (e.g. 10)"
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
              />
              <Input
                placeholder="Board (e.g. CBSE)"
                value={boardFilter}
                onChange={e => setBoardFilter(e.target.value)}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleClear} className="gap-1">
                <Search className="h-4 w-4" /> Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">
              Balance Dues
              <span className="text-muted-foreground font-normal text-sm ml-2">
                ({filtered.length} record{filtered.length !== 1 ? "s" : ""})
              </span>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Bill No</TableHead>
                  <TableHead className="text-right">Total Fee</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length > 0 ? filtered.map(r => {
                  const isOverdue = r.dueDate && new Date(r.dueDate) < today && (r.balance ?? 0) > 0;
                  return (
                    <TableRow key={r.id} className={cn("hover:bg-slate-50/50", isOverdue && "bg-red-50/40")}>
                      <TableCell className={cn(
                        "font-semibold text-sm text-[#1E2A4A]",
                        isOverdue && "border-l-4 border-red-500 pl-3"
                      )}>
                        {r.studentName ?? r.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.class ? `Class ${r.class}` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.billNo ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.totalFee)}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {fmt(r.amountPaid)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${(r.balance ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                        {fmt(r.balance)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-xs",
                        isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"
                      )}>
                        {r.dueDate ?? "—"}
                        {isOverdue && <span className="ml-1 text-red-500">(Overdue)</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="outline" size="sm"
                            className="h-8 text-xs border-[#0D7C8F] text-[#0D7C8F] hover:bg-[#0D7C8F] hover:text-white">
                            <Link href="/admin/fees/collect">Collect</Link>
                          </Button>
                          <Button variant="outline" size="sm"
                            className="h-8 text-xs gap-1 border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                            <MessageCircle className="h-3 w-3" /> Remind
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <IndianRupee className="h-8 w-8 opacity-20" />
                        <p>No fee records found.</p>
                        <Link href="/admin/fees/add">
                          <Button size="sm" className="mt-1 bg-[#0D7C8F] hover:bg-[#0a6275] text-xs">
                            + Add Fee Record
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
}
