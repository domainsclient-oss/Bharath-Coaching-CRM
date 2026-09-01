"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Download, Printer, BarChart3, IndianRupee, TrendingUp, Users } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockFeeRecords } from "@/data/feesData";
import { useBranch } from "@/context/BranchContext";
import { exportToCSV } from "@/lib/exportToCSV";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS = ["2026", "2025", "2024"];

export default function FeesReportPage() {
  const { currentBranch } = useBranch();
  const [filters, setFilters] = useState({
    period: "all",
    class: "All",
    board: "All",
    month: MONTHS[new Date().getMonth()],
    year: String(new Date().getFullYear()),
  });

  const records = useMemo(() =>
    mockFeeRecords.filter(r => r.branchId === currentBranch &&
      (filters.class === "All" || r.class === filters.class) &&
      (filters.board === "All" || r.board === filters.board)
    ),
    [currentBranch, filters.class, filters.board]
  );

  const totalFees = records.reduce((s, r) => s + r.totalFee, 0);
  const totalCollected = records.reduce((s, r) => s + r.collected, 0);
  const totalBalance = records.reduce((s, r) => s + r.balance, 0);
  const collectionRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0;

  // Class-wise breakdown
  const classSummary = useMemo(() => {
    const map: Record<string, { total: number; collected: number; balance: number; count: number }> = {};
    records.forEach(r => {
      if (!map[r.class]) map[r.class] = { total: 0, collected: 0, balance: 0, count: 0 };
      map[r.class].total += r.totalFee;
      map[r.class].collected += r.collected;
      map[r.class].balance += r.balance;
      map[r.class].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [records]);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const handleExportCSV = () => {
    const date = new Date().toISOString().split("T")[0];

    // Sheet 1 — detailed records
    const headers = [
      "Bill No", "Student Name", "Class", "Board",
      "Total Fee", "Inst I", "Inst II", "Inst III", "Balance", "Next Due Date",
    ];
    const rows = records.map(r => [
      r.billNo,
      r.studentName,
      `Class ${r.class}`,
      r.board,
      r.totalFee,
      r.instalments.i1?.amount ?? "",
      r.instalments.i2?.amount ?? "",
      r.instalments.i3?.amount ?? "",
      r.balance,
      r.nextPaymentDate ?? "",
    ]);
    exportToCSV(headers, rows, `fees-report-${currentBranch}-${date}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Fees Report & Export" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/fees" className="hover:text-[#0D7C8F]">Fees</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Report & Export</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Fees Report & Export</h2>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button className="gap-2 bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleExportCSV}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Period</Label>
                <Select value={filters.period} onValueChange={v => setFilters(f => ({ ...f, period: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filters.period === "monthly" && (
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Month</Label>
                  <Select value={filters.month} onValueChange={v => setFilters(f => ({ ...f, month: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {(filters.period === "monthly" || filters.period === "yearly") && (
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Year</Label>
                  <Select value={filters.year} onValueChange={v => setFilters(f => ({ ...f, year: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Class</Label>
                <Select value={filters.class} onValueChange={v => setFilters(f => ({ ...f, class: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["All", "8", "9", "10", "11", "12"].map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Board</Label>
                <Select value={filters.board} onValueChange={v => setFilters(f => ({ ...f, board: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["All", "CBSE", "ICSE", "State", "Samacheer", "IB"].map(b => <SelectItem key={b} value={b}>{b === "All" ? "All Boards" : b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Fee", value: fmt(totalFees), icon: IndianRupee, color: "bg-blue-100 text-blue-600" },
            { label: "Collected", value: fmt(totalCollected), icon: TrendingUp, color: "bg-green-100 text-green-600" },
            { label: "Balance", value: fmt(totalBalance), icon: BarChart3, color: "bg-red-100 text-red-600" },
            { label: "Collection Rate", value: `${collectionRate}%`, icon: Users, color: "bg-teal-100 text-teal-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold text-[#1E2A4A]">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Class-wise summary */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">Class-wise Fee Summary</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead className="text-center">Students</TableHead>
                <TableHead className="text-right">Total Fee</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Collection %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classSummary.map(([cls, data]) => {
                const pct = data.total > 0 ? Math.round((data.collected / data.total) * 100) : 0;
                return (
                  <TableRow key={cls} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-[#1E2A4A]">Class {cls}</TableCell>
                    <TableCell className="text-center">{data.count}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(data.total)}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">{fmt(data.collected)}</TableCell>
                    <TableCell className="text-right text-red-600 font-medium">{fmt(data.balance)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-[#0D7C8F]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold w-10 text-right">{pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Detailed records */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">Detailed Fee Records ({records.length})</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Bill No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Board</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Inst I</TableHead>
                <TableHead className="text-right">Inst II</TableHead>
                <TableHead className="text-right">Inst III</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Next Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(r => {
                const inst = (k: "i1" | "i2" | "i3") => r.instalments[k];
                return (
                  <TableRow key={r.id} className="hover:bg-slate-50/50 text-sm">
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.billNo}</TableCell>
                    <TableCell className="font-semibold text-[#1E2A4A]">{r.studentName}</TableCell>
                    <TableCell>Class {r.class}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.board}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.totalFee)}</TableCell>
                    {(["i1", "i2", "i3"] as const).map(k => (
                      <TableCell key={k} className="text-right">
                        {inst(k)
                          ? <span className={inst(k)!.collected ? "text-green-600 font-medium" : "text-red-500"}>{fmt(inst(k)!.amount)}</span>
                          : <span className="text-muted-foreground text-xs">—</span>
                        }
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-bold text-red-600">{fmt(r.balance)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.nextPaymentDate || "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
