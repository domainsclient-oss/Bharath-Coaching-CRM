"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Search, AlertCircle, IndianRupee,
  MessageSquare, Loader2, CreditCard,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";
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
  totalFee: number;
  amountPaid: number;
  balance: number;
  status: string;
  dueDate?: string;
  paymentDate?: string | null;
  mode?: string | null;
  branchId: string;
}

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const fmt = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

export default function SearchDueFeesPage() {
  const { currentBranch } = useBranch();
  const { data: allFees, loading } = useFirestoreCollection<FeeDoc>(
    "fees",
    currentBranch,
    { orderByField: "createdAt", orderByDir: "desc" }
  );

  const [nameFilter,   setNameFilter]   = useState("");
  const [classFilter,  setClassFilter]  = useState("All");
  const [boardFilter,  setBoardFilter]  = useState("All");
  const [showOverdue,  setShowOverdue]  = useState(false);

  const today = localToday();

  // All records with a balance due
  const dueRecords = useMemo(() => {
    return allFees
      .filter(r => (r.balance ?? 0) > 0)
      .map(r => ({
        ...r,
        isOverdue: !!(r.dueDate && r.dueDate < today),
      }));
  }, [allFees, today]);

  const filtered = useMemo(() => {
    return dueRecords.filter(r => {
      const sName = (r.studentName ?? r.name ?? "").toLowerCase();
      return (
        (!nameFilter  || sName.includes(nameFilter.toLowerCase())) &&
        (classFilter === "All" || (r.class ?? "") === classFilter) &&
        (boardFilter === "All" || (r.board ?? "") === boardFilter) &&
        (!showOverdue || r.isOverdue)
      );
    });
  }, [dueRecords, nameFilter, classFilter, boardFilter, showOverdue]);

  // Class & board options from real data
  const classOptions = useMemo(() =>
    ["All", ...Array.from(new Set(dueRecords.map(r => r.class).filter(Boolean))).sort()],
    [dueRecords]
  );
  const boardOptions = useMemo(() =>
    ["All", ...Array.from(new Set(dueRecords.map(r => r.board).filter(Boolean))).sort()],
    [dueRecords]
  );

  const totalDue     = useMemo(() => filtered.reduce((s, r) => s + (r.balance ?? 0), 0), [filtered]);
  const overdueCount = useMemo(() => dueRecords.filter(r => r.isOverdue).length, [dueRecords]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Search Due Fees" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/fees/collect" className="hover:text-[#0D7C8F]">Fees</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Search Due Fees</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Search Due Fees</h2>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <IndianRupee className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Outstanding</p>
                {loading
                  ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                  : <p className="text-xl font-bold text-red-600">{fmt(totalDue)}</p>
                }
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue Accounts</p>
                {loading
                  ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                  : <p className="text-xl font-bold text-amber-600">{overdueCount}</p>
                }
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Students with Dues</p>
                {loading
                  ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                  : <p className="text-xl font-bold text-[#1E2A4A]">{filtered.length}</p>
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Student Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Search student..."
                    value={nameFilter}
                    onChange={e => setNameFilter(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Class</Label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {classOptions.map(c => (
                      <SelectItem key={c} value={c!}>
                        {c === "All" ? "All Classes" : `Class ${c}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Board</Label>
                <Select value={boardFilter} onValueChange={setBoardFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {boardOptions.map(b => (
                      <SelectItem key={b} value={b!}>
                        {b === "All" ? "All Boards" : b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Overdue toggle */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setShowOverdue(p => !p)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold border transition-colors",
                  showOverdue
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-red-400"
                )}
              >
                {showOverdue ? "✕ Clear" : "⚠ Overdue Only"} ({overdueCount})
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">
              Due Fee Records
              <span className="text-muted-foreground font-normal text-sm ml-2">
                ({filtered.length} record{filtered.length !== 1 ? "s" : ""})
              </span>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class / Board</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead className="text-right">Total Fee</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
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
                  <TableRow key={r.id} className={cn("hover:bg-slate-50/50", r.isOverdue && "bg-red-50/40")}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.billNo ?? "—"}
                    </TableCell>
                    <TableCell className={cn(
                      "font-semibold text-sm text-[#1E2A4A]",
                      r.isOverdue && "border-l-4 border-red-500 pl-3"
                    )}>
                      {r.studentName ?? r.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{r.class ? `Class ${r.class}` : "—"}</div>
                      {r.board && <Badge variant="outline" className="text-xs mt-0.5">{r.board}</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[130px]">
                        {(r.subjects ?? []).map(s => (
                          <Badge key={s} variant="secondary" className="text-xs py-0">{s}</Badge>
                        ))}
                        {!r.subjects?.length && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.totalFee)}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">{fmt(r.amountPaid)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${r.isOverdue ? "text-red-600" : "text-amber-600"}`}>
                        {fmt(r.balance)}
                      </span>
                      {r.isOverdue && (
                        <Badge className="ml-1 bg-red-100 text-red-700 text-xs hover:bg-red-100">Overdue</Badge>
                      )}
                    </TableCell>
                    <TableCell className={cn(
                      "text-xs",
                      r.isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"
                    )}>
                      {r.dueDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-[#0D7C8F] hover:bg-[#1E2A4A] gap-1"
                          asChild
                        >
                          <Link href="/admin/fees/collect">
                            <CreditCard className="h-3 w-3" /> Collect
                          </Link>
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 text-green-600 hover:bg-green-50 hover:text-green-700"
                          title="Send WhatsApp reminder"
                          onClick={() => toast({
                            title: "Reminder Sent",
                            description: `WhatsApp reminder sent to ${r.studentName ?? r.name}.`,
                          })}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 opacity-20" />
                        <p>No due fee records found{showOverdue ? " (overdue only)" : ""}.</p>
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
