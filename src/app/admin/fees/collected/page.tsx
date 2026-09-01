"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Search, IndianRupee, CheckCircle2, Loader2, Users,
} from "lucide-react";
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

export default function CollectedFeesPage() {
  const { currentBranch } = useBranch();
  const { data: allFees, loading } = useFirestoreCollection<FeeDoc>(
    "fees",
    currentBranch,
    { orderByField: "createdAt", orderByDir: "desc" }
  );

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Only records where payment has been made
  const collected = useMemo(() =>
    allFees.filter(r => (r.amountPaid ?? 0) > 0),
    [allFees]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collected.filter(r => {
      const name   = (r.studentName ?? r.name ?? "").toLowerCase();
      const billNo = (r.billNo ?? "").toLowerCase();
      const matchQ      = !q || name.includes(q) || billNo.includes(q);
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [collected, search, statusFilter]);

  const totalCollected = useMemo(() =>
    collected.reduce((s, r) => s + (r.amountPaid ?? 0), 0), [collected]);

  const totalBalance = useMemo(() =>
    collected.reduce((s, r) => s + (r.balance ?? 0), 0), [collected]);

  const uniqueStudents = useMemo(() =>
    new Set(collected.map(r => r.studentName ?? r.name ?? r.id)).size, [collected]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Collected Fees" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/fees/collect" className="hover:text-[#0D7C8F]">Fees</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Collected Fees</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Collected Fees</h2>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Collected</p>
                {loading
                  ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                  : <p className="text-xl font-bold text-green-600">{fmt(totalCollected)}</p>
                }
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <IndianRupee className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining Balance</p>
                {loading
                  ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                  : <p className="text-xl font-bold text-red-600">{fmt(totalBalance)}</p>
                }
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Students</p>
                {loading
                  ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                  : <p className="text-xl font-bold text-[#1E2A4A]">{uniqueStudents}</p>
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Search by name or bill no..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                </SelectContent>
              </Select>
              {(search || statusFilter !== "All") && (
                <Button variant="outline" size="sm" onClick={() => { setSearch(""); setStatusFilter("All"); }}>
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">
              Payment Records
              <span className="text-muted-foreground font-normal text-sm ml-2">
                ({filtered.length} record{filtered.length !== 1 ? "s" : ""})
              </span>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Bill No</TableHead>
                  <TableHead className="text-right">Total Fee</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length > 0 ? filtered.map(r => (
                  <TableRow key={r.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-sm text-[#1E2A4A]">
                      {r.studentName ?? r.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.class ? `Class ${r.class}` : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.billNo ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.totalFee)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {fmt(r.amountPaid)}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${(r.balance ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                      {fmt(r.balance)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.mode ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.paymentDate ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <IndianRupee className="h-8 w-8 opacity-20" />
                        <p>No collected fee records found.</p>
                        <Link href="/admin/fees/collect">
                          <Button size="sm" className="mt-1 bg-[#0D7C8F] hover:bg-[#1E2A4A] text-xs">
                            Collect a Payment
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
