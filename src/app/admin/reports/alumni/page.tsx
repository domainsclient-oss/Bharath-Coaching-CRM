"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, GraduationCap, Download, Users, Search } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  class?: string;
  board?: string;
  school?: string;
  phone?: string;
  email?: string;
  status: string;
  admissionDate?: string;
  discontinuedDate?: string;
  branchId: string;
}

const BOARD_FALLBACK_COLOR = "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-800";

const BOARD_COLOR: Record<string, string> = {
  CBSE:  "bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800",
  ICSE:  "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-800",
  State: "bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800",
  IB:    "bg-teal-100 text-teal-700 hover:bg-teal-200 hover:text-teal-800",
};

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function batchYear(s: Student) {
  return s.discontinuedDate?.slice(0, 4) ?? s.admissionDate?.slice(0, 4) ?? "—";
}

export default function AlumniReportPage() {
  const { currentBranch } = useBranch();
  const { data: allStudents, loading } = useFirestoreCollection<Student>("students", currentBranch);

  const alumni = useMemo(() => allStudents.filter(s => s.status === "Discontinued" || s.status === "Alumni"), [allStudents]);

  const [search,  setSearch]  = useState("");
  const [classF,  setClassF]  = useState("All");
  const [boardF,  setBoardF]  = useState("All");
  const [batchF,  setBatchF]  = useState("All");

  const classes = useMemo(() => ["All", ...Array.from(new Set(alumni.map(a => a.class).filter(Boolean))).sort()], [alumni]);
  const batches = useMemo(() => ["All", ...Array.from(new Set(alumni.map(batchYear))).filter(y => y !== "—").sort().reverse()], [alumni]);

  const filtered = useMemo(() =>
    alumni.filter(a =>
      (classF === "All" || a.class === classF) &&
      (boardF === "All" || a.board === boardF) &&
      (batchF === "All" || batchYear(a) === batchF) &&
      a.name.toLowerCase().includes(search.toLowerCase())
    ), [alumni, classF, boardF, batchF, search]);

  const batchSummary = useMemo(() => {
    const map: Record<string, number> = {};
    alumni.forEach(a => { const y = batchYear(a); map[y] = (map[y] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [alumni]);

  const kpi = useMemo(() => ({
    total:     alumni.length,
    class12:   alumni.filter(a => a.class === "12").length,
    batches:   batchSummary.length,
    withEmail: alumni.filter(a => a.email).length,
  }), [alumni, batchSummary]);

  const handleExport = () => {
    const headers = ["#", "Name", "Class", "Board", "School", "Phone", "Email", "Batch"];
    const rows = filtered.map((a, i) => [
      i + 1, `"${a.name}"`, a.class ?? "—", a.board ?? "—", `"${a.school ?? ""}"`, a.phone ?? "—", a.email ?? "—", batchYear(a),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "alumni-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: `${filtered.length} records exported.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Alumni Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Alumni</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Alumni",  value: kpi.total,     color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: GraduationCap },
            { label: "Class 12",      value: kpi.class12,   color: "text-teal-600",  bg: "bg-teal-100",  icon: Users         },
            { label: "Batch Years",   value: kpi.batches,   color: "text-purple-600",bg: "bg-purple-100",icon: GraduationCap },
            { label: "With Email",    value: kpi.withEmail, color: "text-green-600", bg: "bg-green-100", icon: Users         },
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
                      ? <Skeleton className="h-7 w-10 mt-0.5" />
                      : <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Batch summary */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b py-3 px-6">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Batch-wise Alumni Count</CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-wrap gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-24 rounded-xl" />)
            ) : batchSummary.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4 w-full">No alumni records found.</p>
            ) : batchSummary.map(([year, count]) => (
              <div key={year} className="text-center bg-slate-50 rounded-xl px-6 py-4">
                <p className="text-2xl font-bold text-[#1E2A4A]">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">Batch {year}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Filters + table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Alumni Records — {filtered.length}</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-8 h-8 text-xs w-40" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={classF} onValueChange={setClassF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={boardF} onValueChange={setBoardF}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["All","CBSE","ICSE","State","Samacheer","IB"].map(b => <SelectItem key={b} value={b}>{b === "All" ? "All Boards" : b}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={batchF} onValueChange={setBatchF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{batches.map(y => <SelectItem key={y} value={y}>{y === "All" ? "All Batches" : `Batch ${y}`}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" className="h-8 bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-1.5"
                onClick={handleExport} disabled={loading || filtered.length === 0}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Batch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-20 text-center text-muted-foreground">No alumni found.</TableCell></TableRow>
              ) : filtered.map((a, i) => (
                <TableRow key={a.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-[#1E2A4A]/10 text-[#1E2A4A] font-bold">{initials(a.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-sm text-[#1E2A4A]">{a.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{a.class ? `Class ${a.class}` : "—"}</TableCell>
                  <TableCell>{a.board ? <Badge className={cn("text-[10px]", BOARD_COLOR[a.board] ?? BOARD_FALLBACK_COLOR)}>{a.board}</Badge> : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.school ?? "—"}</TableCell>
                  <TableCell className="text-xs">{a.phone ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.email ?? "—"}</TableCell>
                  <TableCell className="text-xs font-semibold">{batchYear(a)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
