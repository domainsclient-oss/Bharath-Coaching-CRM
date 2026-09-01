"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Search, IndianRupee } from "lucide-react";
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
import { mockFeeRecords } from "@/data/feesData";
import { useBranch } from "@/context/BranchContext";

const ALL_SUBJECTS = [
  "All", "Mathematics", "Physics", "Chemistry", "Biology",
  "English", "Science", "Computer Science", "Economics",
  "Accountancy", "Business Studies", "Commerce",
];

export default function OneToOneFeesPage() {
  const { currentBranch } = useBranch();
  const [name, setName] = useState("");
  const [stdFilter, setStdFilter] = useState("All");
  const [boardFilter, setBoardFilter] = useState("All");
  const [subject1, setSubject1] = useState("All");
  const [subject2, setSubject2] = useState("All");
  const [searched, setSearched] = useState(false);

  const records = useMemo(() => {
    if (!searched) return [];
    return mockFeeRecords.filter(r =>
      r.branchId === currentBranch &&
      (!name || r.studentName.toLowerCase().includes(name.toLowerCase())) &&
      (stdFilter === "All" || r.class === stdFilter) &&
      (boardFilter === "All" || r.board === boardFilter) &&
      (subject1 === "All" || (r.subjects ?? []).includes(subject1)) &&
      (subject2 === "All" || (r.subjects ?? []).includes(subject2))
    );
  }, [searched, currentBranch, name, stdFilter, boardFilter, subject1, subject2]);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const instCell = (inst?: { amount: number; collected: boolean }) =>
    inst ? (
      <div className="text-xs">
        <p className="font-semibold">{fmt(inst.amount)}</p>
        <p className={inst.collected ? "text-green-600" : "text-amber-500"}>
          {inst.collected ? "Paid" : "Pending"}
        </p>
      </div>
    ) : <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="One to One Class Fees" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">One to One Fees</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">One to One Class Fees</h2>

        {/* Filter bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">Name</p>
                <Input
                  className="w-44"
                  placeholder="Student name..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && setSearched(true)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">Std</p>
                <Select value={stdFilter} onValueChange={setStdFilter}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["All", "8", "9", "10", "11", "12"].map(c => (
                      <SelectItem key={c} value={c}>
                        {c === "All" ? "All Std" : `Class ${c}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">Board</p>
                <Select value={boardFilter} onValueChange={setBoardFilter}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["All", "CBSE", "ICSE", "State", "Samacheer", "IB"].map(b => (
                      <SelectItem key={b} value={b}>
                        {b === "All" ? "All Boards" : b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">Subject</p>
                <Select value={subject1} onValueChange={setSubject1}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>
                        {s === "All" ? "All Subjects" : s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">Subject</p>
                <Select value={subject2} onValueChange={setSubject2}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>
                        {s === "All" ? "Any Subject" : s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2"
                onClick={() => setSearched(true)}
              >
                <Search className="h-4 w-4" /> Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results table */}
        {searched && (
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b py-3 px-6">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-[#0D7C8F]" />
                {records.length} Record{records.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead className="text-right">Total Fees</TableHead>
                    <TableHead>Instalment I</TableHead>
                    <TableHead>Instalment II</TableHead>
                    <TableHead>Instalment III</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Next Payment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length > 0 ? records.map(r => (
                    <TableRow key={r.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-sm text-[#1E2A4A]">{r.studentName}</TableCell>
                      <TableCell className="text-sm">Class {r.class}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {(r.subjects ?? []).map(s => (
                            <Badge key={s} variant="secondary" className="text-xs py-0">{s}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.billNo}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.totalFee)}</TableCell>
                      <TableCell>{instCell(r.instalments.i1)}</TableCell>
                      <TableCell>{instCell(r.instalments.i2)}</TableCell>
                      <TableCell>{instCell(r.instalments.i3)}</TableCell>
                      <TableCell className={`text-right font-bold ${r.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                        {fmt(r.balance)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.nextPaymentDate ?? "—"}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <IndianRupee className="h-8 w-8 opacity-20" />
                          <p>No fee records found matching your filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
