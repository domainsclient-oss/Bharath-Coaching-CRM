"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Users, UserCheck, UserX, Download, Search } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";

interface Student {
  id: string;
  appNo: string;
  name: string;
  class: string;
  board: string;
  mode: string;
  status: string;
  admissionDate: string;
  branchId: string;
}

const STATUS_COLOR: Record<string, string> = {
  Active:       "bg-green-100 text-green-700",
  Discontinued: "bg-red-100 text-red-700",
  Alumni:       "bg-blue-100 text-blue-700",
};

const BOARD_COLOR: Record<string, string> = {
  CBSE:  "bg-purple-100 text-purple-700",
  ICSE:  "bg-indigo-100 text-indigo-700",
  State: "bg-amber-100 text-amber-700",
  IB:    "bg-teal-100 text-teal-700",
};

export default function StudentsReportPage() {
  const { currentBranch } = useBranch();
  const { data: all, loading } = useFirestoreCollection<Student>("students", currentBranch);

  const [search,  setSearch]  = useState("");
  const [statusF, setStatusF] = useState("All");
  const [boardF,  setBoardF]  = useState("All");
  const [classF,  setClassF]  = useState("All");

  const classes = useMemo(() => ["All", ...Array.from(new Set(all.map(s => s.class).filter(Boolean))).sort()], [all]);
  const boards  = useMemo(() => ["All", ...Array.from(new Set(all.map(s => s.board).filter(Boolean))).sort()], [all]);

  const filtered = useMemo(() =>
    all.filter(s =>
      (statusF === "All" || s.status === statusF) &&
      (boardF  === "All" || s.board  === boardF)  &&
      (classF  === "All" || s.class  === classF)  &&
      (s.name ?? "").toLowerCase().includes(search.toLowerCase())
    ), [all, statusF, boardF, classF, search]);

  const kpi = useMemo(() => ({
    total:        all.length,
    active:       all.filter(s => s.status === "Active").length,
    discontinued: all.filter(s => s.status === "Discontinued").length,
    alumni:       all.filter(s => s.status === "Alumni").length,
  }), [all]);

  const classSummary = useMemo(() => {
    const map: Record<string, { active: number; total: number }> = {};
    all.forEach(s => {
      if (!s.class) return;
      if (!map[s.class]) map[s.class] = { active: 0, total: 0 };
      map[s.class].total++;
      if (s.status === "Active") map[s.class].active++;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  }, [all]);

  const handleExport = () => {
    const headers = ["#", "Name", "App No.", "Class", "Board", "Mode", "Status", "Admission Date"];
    const rows = filtered.map((s, i) => [
      i + 1, s.name, s.appNo, s.class, s.board, s.mode, s.status, s.admissionDate,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "students-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: `${filtered.length} records exported as CSV.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Students Information Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Students Information</span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Students",  value: kpi.total,        color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: Users     },
            { label: "Active",          value: kpi.active,       color: "text-green-600", bg: "bg-green-100", icon: UserCheck },
            { label: "Discontinued",    value: kpi.discontinued, color: "text-red-600",   bg: "bg-red-100",   icon: UserX     },
            { label: "Alumni",          value: kpi.alumni,       color: "text-blue-600",  bg: "bg-blue-100",  icon: Users     },
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

        {/* Class-wise breakdown */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b py-3 px-6">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Class-wise Enrollment</CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="text-center space-y-1">
                  <Skeleton className="h-3 w-14 mx-auto" />
                  <Skeleton className="h-8 w-10 mx-auto" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                </div>
              ))
            ) : classSummary.length === 0 ? (
              <p className="col-span-full text-center text-sm text-muted-foreground py-4">No data yet.</p>
            ) : classSummary.map(([cls, d]) => (
              <div key={cls} className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Class {cls}</p>
                <p className="text-2xl font-bold text-[#1E2A4A]">{d.total}</p>
                <p className="text-[10px] text-green-600">{d.active} active</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Filters + Export */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusF} onValueChange={setStatusF}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {["All", "Active", "Discontinued", "Alumni"].map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Status" : s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={boardF} onValueChange={setBoardF}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Board" /></SelectTrigger>
                <SelectContent>
                  {boards.map(b => <SelectItem key={b} value={b}>{b === "All" ? "All Boards" : b}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={classF} onValueChange={setClassF}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={handleExport} disabled={loading || filtered.length === 0}>
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-6">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Student Records — {filtered.length}</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-8 text-center">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>App No.</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow>
              ) : filtered.map((s, i) => (
                <TableRow key={s.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-center text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-semibold text-sm text-[#1E2A4A]">{s.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.appNo ?? "-"}</TableCell>
                  <TableCell className="text-sm">{s.class ? `Class ${s.class}` : "-"}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${BOARD_COLOR[s.board] ?? "bg-gray-100 text-gray-700"}`}>{s.board ?? "-"}</Badge></TableCell>
                  <TableCell className="text-sm">{s.mode ?? "-"}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${STATUS_COLOR[s.status] ?? "bg-gray-100 text-gray-700"}`}>{s.status ?? "-"}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.admissionDate ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
