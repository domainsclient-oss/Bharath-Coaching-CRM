"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, IndianRupee, AlertTriangle, UserX } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockFeeRecords } from "@/data/feesData";
import { useBranch } from "@/context/BranchContext";
import { toast } from "@/hooks/use-toast";

// Discontinued student IDs (would come from students data in production)
const DISCONTINUED_STUDENT_IDS = new Set(["STU_DIS_001", "STU_DIS_002"]);

export default function DiscontinuedFeesPage() {
  const { currentBranch } = useBranch();

  const records = useMemo(() =>
    mockFeeRecords.filter(r =>
      r.branchId === currentBranch && DISCONTINUED_STUDENT_IDS.has(r.studentId)
    ),
    [currentBranch]
  );

  const totalBalance = records.reduce((s, r) => s + r.balance, 0);
  const totalCollected = records.reduce((s, r) => s + r.collected, 0);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Discontinued Fees" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/fees" className="hover:text-[#0D7C8F]">Fees</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Discontinued Fees</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Discontinued Student Fees</h2>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <UserX className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Discontinued Students</p>
                <p className="text-2xl font-bold text-[#1E2A4A]">{records.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">{fmt(totalCollected)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Balance</p>
                <p className="text-2xl font-bold text-red-600">{fmt(totalBalance)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">Fee Records — Discontinued Students</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Bill No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class / Board</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead className="text-right">Total Fee</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Instalment I</TableHead>
                <TableHead>Instalment II</TableHead>
                <TableHead>Instalment III</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length > 0 ? records.map(r => {
                const { i1, i2, i3 } = r.instalments;
                const instCell = (inst: typeof i1) =>
                  inst
                    ? <div className="text-xs"><p className="font-semibold">{fmt(inst.amount)}</p><p className={`${inst.collected ? "text-green-600" : "text-red-500"}`}>{inst.collected ? "Paid" : "Pending"}</p></div>
                    : <span className="text-muted-foreground text-xs">—</span>;

                return (
                  <TableRow key={r.id} className="hover:bg-slate-50/50 align-top">
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.billNo}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm text-[#1E2A4A]">{r.studentName}</p>
                        <Badge variant="outline" className="text-xs mt-0.5 text-red-600 border-red-200">Discontinued</Badge>
                      </div>
                    </TableCell>
                    <TableCell>Class {r.class} / {r.board}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(r.subjects || []).map(s => <Badge key={s} variant="secondary" className="text-xs py-0">{s}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.totalFee)}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">{fmt(r.collected)}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">{fmt(r.balance)}</TableCell>
                    <TableCell>{instCell(i1)}</TableCell>
                    <TableCell>{instCell(i2)}</TableCell>
                    <TableCell>{instCell(i3)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" className="h-7 text-xs bg-[#0D7C8F] hover:bg-[#1E2A4A]"
                        onClick={() => toast({ title: "Payment recorded", description: `Payment updated for ${r.studentName}.` })}>
                        Collect
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">No discontinued student fee records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
