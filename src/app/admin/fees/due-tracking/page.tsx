"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, TrendingDown, AlertCircle, Clock, CheckCircle2, IndianRupee } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockFeeRecords } from "@/data/feesData";
import { useBranch } from "@/context/BranchContext";

const TODAY = new Date().toISOString().split("T")[0];

type AgingBucket = "0-30 days" | "31-60 days" | "61-90 days" | "90+ days";

function getAgingBucket(dueDate: string): AgingBucket {
  const days = Math.floor((new Date(TODAY).getTime() - new Date(dueDate).getTime()) / 86400000);
  if (days <= 30) return "0-30 days";
  if (days <= 60) return "31-60 days";
  if (days <= 90) return "61-90 days";
  return "90+ days";
}

const BUCKET_COLORS: Record<AgingBucket, string> = {
  "0-30 days": "bg-amber-100 text-amber-700",
  "31-60 days": "bg-orange-100 text-orange-700",
  "61-90 days": "bg-red-100 text-red-700",
  "90+ days": "bg-red-200 text-red-900",
};

export default function DueTrackingPage() {
  const { currentBranch } = useBranch();

  const allRecords = useMemo(() =>
    mockFeeRecords.filter(r => r.branchId === currentBranch),
    [currentBranch]
  );

  const overdueItems = useMemo(() => {
    const items: Array<{
      record: typeof allRecords[0];
      instLabel: string;
      amount: number;
      dueDate: string;
      daysOverdue: number;
      bucket: AgingBucket;
    }> = [];

    allRecords.forEach(r => {
      const instMap = { i1: "Instalment I", i2: "Instalment II", i3: "Instalment III", i4: "Instalment IV" };
      Object.entries(r.instalments).forEach(([key, inst]) => {
        if (inst && !inst.collected && inst.date < TODAY) {
          const daysOverdue = Math.floor((new Date(TODAY).getTime() - new Date(inst.date).getTime()) / 86400000);
          items.push({
            record: r,
            instLabel: instMap[key as keyof typeof instMap],
            amount: inst.amount,
            dueDate: inst.date,
            daysOverdue,
            bucket: getAgingBucket(inst.date),
          });
        }
      });
    });

    return items.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [allRecords]);

  // Aging analysis
  const agingBuckets = useMemo(() => {
    const buckets: Record<AgingBucket, { count: number; amount: number }> = {
      "0-30 days": { count: 0, amount: 0 },
      "31-60 days": { count: 0, amount: 0 },
      "61-90 days": { count: 0, amount: 0 },
      "90+ days": { count: 0, amount: 0 },
    };
    overdueItems.forEach(item => {
      buckets[item.bucket].count += 1;
      buckets[item.bucket].amount += item.amount;
    });
    return buckets;
  }, [overdueItems]);

  const totalOverdue = overdueItems.reduce((s, i) => s + i.amount, 0);
  const totalPaid = allRecords.reduce((s, r) => s + r.collected, 0);
  const totalFees = allRecords.reduce((s, r) => s + r.totalFee, 0);
  const collectionRate = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Due Tracking" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/fees" className="hover:text-[#0D7C8F]">Fees</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Due Tracking</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Due Tracking Dashboard</h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Overdue</p>
                <p className="text-xl font-bold text-red-600">{fmt(totalOverdue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue Instalments</p>
                <p className="text-xl font-bold text-amber-600">{overdueItems.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collection Rate</p>
                <p className="text-xl font-bold text-green-600">{collectionRate}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Collected</p>
                <p className="text-xl font-bold text-[#1E2A4A]">{fmt(totalPaid)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aging Analysis */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" /> Aging Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(Object.entries(agingBuckets) as [AgingBucket, { count: number; amount: number }][]).map(([bucket, data]) => (
                <div key={bucket} className="rounded-xl border p-4 space-y-2">
                  <Badge className={`${BUCKET_COLORS[bucket]} text-xs hover:${BUCKET_COLORS[bucket]}`}>{bucket}</Badge>
                  <p className="text-xl font-bold text-[#1E2A4A]">{fmt(data.amount)}</p>
                  <p className="text-xs text-muted-foreground">{data.count} instalment{data.count !== 1 ? "s" : ""}</p>
                  {/* Mini bar */}
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#0D7C8F]"
                      style={{ width: totalOverdue > 0 ? `${Math.round((data.amount / totalOverdue) * 100)}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overdue Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">Overdue Instalments</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Bill No</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Instalment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead className="text-center">Aging</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueItems.length > 0 ? overdueItems.map((item, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/50">
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.record.billNo}</TableCell>
                  <TableCell className="font-semibold text-sm text-[#1E2A4A]">{item.record.studentName}</TableCell>
                  <TableCell>Class {item.record.class}</TableCell>
                  <TableCell className="text-sm">{item.instLabel}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{fmt(item.amount)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.dueDate}</TableCell>
                  <TableCell>
                    <span className="font-bold text-red-600">{item.daysOverdue}</span>
                    <span className="text-xs text-muted-foreground ml-1">days</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${BUCKET_COLORS[item.bucket]} hover:${BUCKET_COLORS[item.bucket]}`}>
                      {item.bucket}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="h-7 text-xs bg-[#0D7C8F] hover:bg-[#1E2A4A]" asChild>
                      <Link href={`/admin/fees/collect?studentId=${item.record.studentId}`}>Collect</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No overdue instalments. All fees are on track!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
