"use client";

import { BOARD_FILTER_OPTIONS } from "@/config/boards";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, IndianRupee, MessageCircle, Search,
  AlertCircle, Loader2, CreditCard, Users,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

/** Local YYYY-MM-DD — string compare against dueDate is timezone-safe. */
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const fmt = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

const STATUS_COLORS: Record<string, string> = {
  "Paid":           "bg-green-100 text-green-700",
  "Partially Paid": "bg-amber-100 text-amber-700",
  "Unpaid":         "bg-red-100 text-red-700",
};

/** Outstanding = balance > 0 (the old "Due Fees" view). All = every record. */
type Scope = "outstanding" | "all";

export default function BalanceDuesPage() {
  const { currentBranch } = useBranch();
  const { data: allFees, loading } = useFirestoreCollection<FeeDoc>(
    "fees",
    currentBranch,
    { orderByField: "createdAt", orderByDir: "desc" }
  );

  const [scope,        setScope]        = useState<Scope>("outstanding");
  const [nameFilter,   setNameFilter]   = useState("");
  const [classFilter,  setClassFilter]  = useState("All");
  const [boardFilter,  setBoardFilter]  = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showOverdue,  setShowOverdue]  = useState(false);

  // Recomputed every render, so a tab left open overnight still judges overdue correctly.
  const today = localToday();

  const records = useMemo(() =>
    allFees.map(r => ({
      ...r,
      isOverdue: !!(r.dueDate && r.dueDate < today && (r.balance ?? 0) > 0),
    })),
    [allFees, today]
  );

  // Dropdown options come from every record, so they stay valid in both scopes.
  const classOptions = useMemo(() =>
    ["All", ...Array.from(new Set(records.map(r => r.class).filter(Boolean))).sort()],
    [records]
  );
  const boardOptions = BOARD_FILTER_OPTIONS;

  const filtered = useMemo(() =>
    records.filter(r => {
      const sName = (r.studentName ?? r.name ?? "").toLowerCase();
      return (
        (scope === "all" || (r.balance ?? 0) > 0) &&
        (!nameFilter || sName.includes(nameFilter.toLowerCase())) &&
        (classFilter  === "All" || (r.class  ?? "") === classFilter) &&
        (boardFilter  === "All" || (r.board  ?? "") === boardFilter) &&
        (statusFilter === "All" || r.status === statusFilter) &&
        (!showOverdue || r.isOverdue)
      );
    }),
    [records, scope, nameFilter, classFilter, boardFilter, statusFilter, showOverdue]
  );

  const countStudents = (rows: typeof records) =>
    new Set(rows.filter(r => (r.balance ?? 0) > 0).map(r => r.studentId ?? r.id)).size;

  // Cards reflect what the table is showing…
  const summary = useMemo(() => ({
    totalOutstanding: filtered.reduce((sum, r) => sum + Math.max(0, r.balance ?? 0), 0),
    studentsWithDues: countStudents(filtered),
    overdue:          filtered.filter(r => r.isOverdue).length,
  }), [filtered]);

  // …with the branch-wide figures kept alongside whenever a filter narrows the list.
  const branchTotals = useMemo(() => ({
    totalOutstanding: records.reduce((sum, r) => sum + Math.max(0, r.balance ?? 0), 0),
    studentsWithDues: countStudents(records),
    overdue:          records.filter(r => r.isOverdue).length,
  }), [records]);

  const filtersActive =
    !!nameFilter || classFilter !== "All" || boardFilter !== "All" ||
    statusFilter !== "All" || showOverdue;

  const overdueCount = branchTotals.overdue;

  const handleClear = () => {
    setNameFilter(""); setClassFilter("All"); setBoardFilter("All");
    setStatusFilter("All"); setShowOverdue(false); setScope("outstanding");
  };

  const handleRemind = (r: typeof records[0]) => {
    toast({
      title: "Reminder Sent",
      description: `WhatsApp reminder sent to ${r.studentName ?? r.name ?? "student"}.`,
    });
  };

  const SummaryCard = ({
    label, value, sub, tone, icon: Icon, iconBg, iconColor,
  }: {
    label: string; value: string; sub?: string; tone: string;
    icon: typeof IndianRupee; iconBg: string; iconColor: string;
  }) => (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading
            ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
            : <p className={cn("text-xl font-bold", tone)}>{value}</p>
          }
          {!loading && sub && (
            <p className="text-[11px] text-muted-foreground">{sub}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Balance / Due Fees" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/fees/collect" className="hover:text-[#0D7C8F]">Fees</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Balance / Due Fees</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Balance / Due Fees</h2>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Outstanding"
            value={fmt(summary.totalOutstanding)}
            sub={filtersActive ? `of ${fmt(branchTotals.totalOutstanding)} branch-wide` : undefined}
            tone="text-red-600"
            icon={IndianRupee} iconBg="bg-red-100" iconColor="text-red-600"
          />
          <SummaryCard
            label="Students with Dues"
            value={String(summary.studentsWithDues)}
            sub={filtersActive ? `of ${branchTotals.studentsWithDues} branch-wide` : undefined}
            tone="text-[#1E2A4A]"
            icon={Users} iconBg="bg-blue-100" iconColor="text-blue-600"
          />
          <SummaryCard
            label="Overdue Accounts"
            value={String(summary.overdue)}
            sub={filtersActive ? `of ${branchTotals.overdue} branch-wide` : undefined}
            tone="text-amber-600"
            icon={AlertCircle} iconBg="bg-amber-100" iconColor="text-amber-600"
          />
        </div>

        {/* Filters — live, no Search button needed */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>
              Showing {scope === "outstanding" ? "students with a balance due" : "all fee records, paid included"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Student Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    autoCapitalize="off"
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
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scope + overdue toggles */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5">
                {([
                  ["outstanding", "Outstanding Only"],
                  ["all",         "All Records"],
                ] as [Scope, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScope(value)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                      scope === value
                        ? "bg-[#0D7C8F] text-white"
                        : "text-slate-600 hover:text-[#0D7C8F]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
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

              <Button variant="outline" size="sm" onClick={handleClear} className="gap-1 h-7 text-xs">
                <Search className="h-3.5 w-3.5" /> Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">
              {scope === "outstanding" ? "Due Fee Records" : "All Fee Records"}
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
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class / Board</TableHead>
                  <TableHead>Subjects</TableHead>
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
                    <TableCell colSpan={10} className="h-32 text-center">
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
                    <TableCell className="text-right font-semibold text-green-600">
                      {fmt(r.amountPaid)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-bold",
                        (r.balance ?? 0) <= 0 ? "text-green-600" : r.isOverdue ? "text-red-600" : "text-amber-600"
                      )}>
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
                    <TableCell>
                      <Badge className={cn("text-xs", STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-700")}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" className="h-8 text-xs bg-[#0D7C8F] hover:bg-[#1E2A4A] gap-1">
                          <Link href="/admin/fees/collect">
                            <CreditCard className="h-3 w-3" /> Collect
                          </Link>
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          className="h-8 text-xs gap-1 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                          title="Send WhatsApp reminder"
                          onClick={() => handleRemind(r)}
                        >
                          <MessageCircle className="h-3 w-3" /> Remind
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        {showOverdue
                          ? <AlertCircle className="h-8 w-8 opacity-20" />
                          : <IndianRupee className="h-8 w-8 opacity-20" />
                        }
                        <p>
                          No {scope === "outstanding" ? "due " : ""}fee records found
                          {showOverdue ? " (overdue only)" : ""}.
                        </p>
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
