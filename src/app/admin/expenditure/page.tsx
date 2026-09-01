"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, TrendingDown, Plus, Search,
  IndianRupee, BarChart3,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CATEGORY_COLORS, CATEGORY_ICONS, ExpenseCategory,
} from "@/data/expenditureData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";

interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paidTo: string;
  branchId: string;
}

export default function ExpenditurePage() {
  const { currentBranch } = useBranch();

  const { data: expenses, loading } = useFirestoreCollection<Expense>("expenses", currentBranch);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const thisMonth = new Date().toISOString().slice(0, 7);

  const thisMonthExpenses = useMemo(
    () => expenses.filter(e => e.date?.startsWith(thisMonth)),
    [expenses, thisMonth]
  );

  const thisMonthTotal = thisMonthExpenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const totalAll       = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);

  const avgPerMonth = useMemo(() => {
    if (expenses.length === 0) return 0;
    const months = new Set(expenses.map(e => e.date?.slice(0, 7)).filter(Boolean)).size;
    return Math.round(totalAll / Math.max(months, 1));
  }, [expenses, totalAll]);

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      if (e.category) map[e.category] = (map[e.category] ?? 0) + (e.amount ?? 0);
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 6) as [ExpenseCategory, number][];
  }, [expenses]);

  const maxCatAmount = Math.max(...categoryTotals.map(([, v]) => v), 1);

  const recent = useMemo(() =>
    [...expenses].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).slice(0, 5),
    [expenses]
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Expenditure" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Expenditure</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Expenditure Overview</h2>
          <div className="flex gap-2">
            <Link href="/admin/expenditure/search">
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" /> Search
              </Button>
            </Link>
            <Link href="/admin/expenditure/add">
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
                <Plus className="h-4 w-4" /> Add Expense
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "This Month",    value: fmt(thisMonthTotal), sub: `${thisMonthExpenses.length} transactions`, icon: IndianRupee, bg: "bg-red-100",   color: "text-red-600"   },
            { label: "Total Expenses",value: fmt(totalAll),       sub: `${expenses.length} records`,              icon: TrendingDown, bg: "bg-slate-100", color: "text-slate-600" },
            { label: "Avg per Month", value: fmt(avgPerMonth),    sub: "",                                        icon: BarChart3,    bg: "bg-amber-100", color: "text-amber-600" },
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
                      ? <Skeleton className="h-7 w-24 mt-1" />
                      : <p className="text-2xl font-bold text-[#1E2A4A]">{c.value}</p>
                    }
                    {c.sub && <p className="text-xs text-muted-foreground">{c.sub}</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Category breakdown bars */}
          <Card className="border-none shadow-sm lg:col-span-2">
            <CardHeader className="border-b py-3 px-5">
              <CardTitle className="text-sm">Top Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {loading ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
              ) : categoryTotals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
              ) : categoryTotals.map(([cat, total]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#1E2A4A] flex items-center gap-1">
                      {CATEGORY_ICONS[cat]} {cat}
                    </span>
                    <span className="text-xs font-bold text-[#0D7C8F]">{fmt(total)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0D7C8F]"
                      style={{ width: `${(total / maxCatAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent expenses */}
          <Card className="border-none shadow-sm lg:col-span-3 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b py-3 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Recent Expenses</CardTitle>
                <Link href="/admin/expenditure/search" className="text-xs text-[#0D7C8F] hover:underline font-semibold">
                  View all →
                </Link>
              </div>
            </CardHeader>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Paid To</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : recent.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No expenses recorded yet.
                    </TableCell>
                  </TableRow>
                ) : recent.map(e => (
                  <TableRow key={e.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs text-muted-foreground">{e.date}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${CATEGORY_COLORS[e.category] ?? "bg-slate-100 text-slate-700"}`}>
                        {CATEGORY_ICONS[e.category]} {e.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[160px] truncate">{e.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.paidTo}</TableCell>
                    <TableCell className="text-right font-bold text-[#1E2A4A]">{fmt(e.amount ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

      </main>
    </div>
  );
}
