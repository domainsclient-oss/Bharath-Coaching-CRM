"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, IndianRupee, TrendingUp, TrendingDown, Download, AlertCircle } from "lucide-react";
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

const MONTHS = ["All","January","February","March","April","May","June","July","August","September","October","November","December"];

function fmt(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

interface Student {
  id: string;
  name: string;
  class: string;
  status: string;
  admissionDate?: string;
  totalFees?: number;
  collectedFees?: number;
  balance?: number;
  branchId: string;
}

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paidTo?: string;
  branchId: string;
}

export default function FinanceReportPage() {
  const { currentBranch } = useBranch();

  const { data: students, loading: stuLoading } = useFirestoreCollection<Student>("students", currentBranch);
  const { data: expenses, loading: expLoading } = useFirestoreCollection<Expense>("expenses", currentBranch);

  const loading = stuLoading || expLoading;

  const [monthF, setMonthF] = useState("All");
  const [catF,   setCatF]   = useState("All");

  const categories = useMemo(() =>
    ["All", ...Array.from(new Set(expenses.map(e => e.category).filter(Boolean))).sort()],
    [expenses]
  );

  const filteredExp = useMemo(() =>
    expenses.filter(e =>
      (monthF === "All" || new Date(e.date).toLocaleString("en-US", { month: "long" }) === monthF) &&
      (catF   === "All" || e.category === catF)
    ), [expenses, monthF, catF]);

  // KPI totals from student fee fields
  const feeStats = useMemo(() => {
    const totalFeeCollected = students.reduce((s, st) => s + (st.collectedFees ?? 0), 0);
    const totalFeeDue       = students.reduce((s, st) => s + (st.totalFees     ?? 0), 0);
    const totalPending      = students.reduce((s, st) => s + (st.balance       ?? 0), 0);
    const totalExpenses     = expenses.reduce((s, e)  => s + (e.amount         ?? 0), 0);
    return { totalFeeCollected, totalFeeDue, totalPending, totalExpenses };
  }, [students, expenses]);

  // Class-wise fee summary
  const classSummary = useMemo(() => {
    const map: Record<string, { collected: number; due: number; balance: number; count: number }> = {};
    students.forEach(st => {
      const cls = st.class ?? "—";
      if (!map[cls]) map[cls] = { collected: 0, due: 0, balance: 0, count: 0 };
      map[cls].due       += st.totalFees     ?? 0;
      map[cls].collected += st.collectedFees ?? 0;
      map[cls].balance   += st.balance       ?? 0;
      map[cls].count++;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  }, [students]);

  const handleExport = () => {
    const headers = ["#", "Date", "Category", "Description", "Paid To", "Amount"];
    const rows = filteredExp.map((e, i) => [i + 1, e.date, e.category, `"${e.description}"`, e.paidTo ?? "-", e.amount]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "finance-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: `${filteredExp.length} records exported.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Finance Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Finance</span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Fee Collected",  value: fmt(feeStats.totalFeeCollected),                              color: "text-green-600",  bg: "bg-green-100",  icon: TrendingUp   },
            { label: "Fee Pending",    value: fmt(feeStats.totalPending),                                   color: "text-amber-600",  bg: "bg-amber-100",  icon: AlertCircle  },
            { label: "Total Expenses", value: fmt(feeStats.totalExpenses),                                  color: "text-red-600",    bg: "bg-red-100",    icon: TrendingDown },
            { label: "Net Balance",    value: fmt(feeStats.totalFeeCollected - feeStats.totalExpenses),     color: "text-[#1E2A4A]",  bg: "bg-blue-100",   icon: IndianRupee  },
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
                      ? <Skeleton className="h-6 w-24 mt-0.5" />
                      : <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Class-wise fee collection */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b py-3 px-6">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Class-wise Fee Collection</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Total Due</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-center">Collection %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stuLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : classSummary.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-16 text-center text-muted-foreground">No student fee data yet.</TableCell></TableRow>
              ) : classSummary.map(([cls, d]) => {
                const pct = d.due > 0 ? Math.round((d.collected / d.due) * 100) : 0;
                return (
                  <TableRow key={cls} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-sm text-[#1E2A4A]">Class {cls}</TableCell>
                    <TableCell className="text-right text-sm">{d.count}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(d.due)}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">{fmt(d.collected)}</TableCell>
                    <TableCell className="text-right text-amber-600 font-medium">{fmt(d.balance)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full">
                          <div
                            className={`h-full rounded-full ${pct >= 90 ? "bg-green-400" : pct >= 70 ? "bg-amber-400" : "bg-red-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs w-8 text-right">{pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Expenditure records */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Expenditure Records — {filteredExp.length}</CardTitle>
            <div className="flex gap-2">
              <Select value={monthF} onValueChange={setMonthF}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m === "All" ? "All Months" : m}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={catF} onValueChange={setCatF}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Categories" : c}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" className="h-8 bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-1.5" onClick={handleExport} disabled={expLoading || filteredExp.length === 0}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Paid To</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filteredExp.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground">No expense records.</TableCell></TableRow>
              ) : filteredExp.map((e, i) => (
                <TableRow key={e.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-xs">{e.date}</TableCell>
                  <TableCell><Badge className="bg-slate-100 text-slate-700 text-[10px]">{e.category}</Badge></TableCell>
                  <TableCell className="text-sm text-[#1E2A4A]">{e.description}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.paidTo ?? "—"}</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">{fmt(e.amount ?? 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
