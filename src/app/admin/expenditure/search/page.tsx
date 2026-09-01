"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Search, Download, Plus, Trash2, IndianRupee,
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
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  EXPENSE_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS,
  ExpenseCategory, ExpensePaymentMode,
} from "@/data/expenditureData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { deleteDocument } from "@/services/firestoreService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

const PAYMENT_MODES: ExpensePaymentMode[] = ["Cash", "UPI", "Cheque", "NEFT", "Card"];

export default function SearchExpensesPage() {
  const { currentBranch } = useBranch();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [paymentMode, setPaymentMode] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]   = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; desc: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: expenses, loading } = useFirestoreCollection<{
    id: string; date: string; category: ExpenseCategory; description: string;
    amount: number; paymentMode: ExpensePaymentMode; paidTo: string;
    billNo?: string; notes?: string; branchId: string;
  }>("expenses", currentBranch);

  const filtered = useMemo(() =>
    expenses.filter(e =>
      (category === "All" || e.category === category) &&
      (paymentMode === "All" || e.paymentMode === paymentMode) &&
      (!dateFrom || e.date >= dateFrom) &&
      (!dateTo   || e.date <= dateTo) &&
      (
        !search ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.paidTo.toLowerCase().includes(search.toLowerCase()) ||
        (e.billNo ?? "").toLowerCase().includes(search.toLowerCase())
      )
    ).sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, category, paymentMode, dateFrom, dateTo, search]
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteDocument("expenses", pendingDelete.id);
      toast({ title: "Deleted", description: `Expense "${pendingDelete.desc}" removed.` });
      setPendingDelete(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete expense.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const rows = [
      ["Date", "Category", "Description", "Paid To", "Bill No", "Amount", "Payment Mode"],
      ...filtered.map(e => [
        e.date, e.category, e.description, e.paidTo,
        e.billNo ?? "", e.amount.toString(), e.paymentMode,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "expenses.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Search Expenses" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/expenditure" className="hover:text-[#0D7C8F]">Expenditure</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Search Expenses</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Search Expenses</h2>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Link href="/admin/expenditure/add">
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
                <Plus className="h-4 w-4" /> Add Expense
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-3">
            {/* Row 1: text search + category + payment mode */}
            <div className="flex flex-wrap gap-3 items-end">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Description, vendor, bill no..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_ICONS[c]} {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Modes</SelectItem>
                  {PAYMENT_MODES.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Row 2: date range */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">From</p>
                <Input
                  type="date"
                  className="w-40"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">To</p>
                <Input
                  type="date"
                  className="w-40"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                />
              </div>
              {(search || category !== "All" || paymentMode !== "All" || dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground mt-4"
                  onClick={() => {
                    setSearch(""); setCategory("All"); setPaymentMode("All");
                    setDateFrom(""); setDateTo("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary row */}
        <div className="flex items-center justify-between px-1">
          {loading
            ? <Skeleton className="h-4 w-24" />
            : <p className="text-sm text-muted-foreground"><span className="font-bold text-[#1E2A4A]">{filtered.length}</span> record{filtered.length !== 1 ? "s" : ""}</p>
          }
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-[#0D7C8F]" />
            {loading
              ? <Skeleton className="h-4 w-24" />
              : <span className="text-sm font-bold text-[#1E2A4A]">Total: {fmt(total)}</span>
            }
          </div>
        </div>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Paid To</TableHead>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length > 0 ? filtered.map(e => (
                  <TableRow key={e.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {e.date}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs whitespace-nowrap ${CATEGORY_COLORS[e.category]}`}>
                        {CATEGORY_ICONS[e.category]} {e.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-[#1E2A4A] max-w-[200px]">{e.description}</p>
                      {e.notes && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{e.notes}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{e.paidTo}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {e.billNo ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{e.paymentMode}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#1E2A4A]">
                      {fmt(e.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                        title="Delete"
                        onClick={() => setPendingDelete({ id: e.id, desc: e.description })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 opacity-20" />
                        <p>No expenses found matching your filters.</p>
                        <Link href="/admin/expenditure/add">
                          <Button size="sm" variant="outline" className="mt-1 gap-1.5">
                            <Plus className="h-3.5 w-3.5" /> Add First Expense
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 0 && (
            <div className="bg-slate-50 border-t px-6 py-3 flex justify-end">
              <p className="text-sm font-bold text-[#1E2A4A]">
                Total: {fmt(total)}
              </p>
            </div>
          )}
        </Card>

      </main>

      {/* Delete Confirmation */}
      <Dialog open={!!pendingDelete} onOpenChange={v => { if (!v) setPendingDelete(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Delete Expense</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">&quot;{pendingDelete?.desc}&quot;</span>?
            This action cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
