"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, BookOpen, Download, CheckCircle, Clock, LayoutList, FileText } from "lucide-react";
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

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  className: string;
  teacher: string;
  date: string;
  duration: string;
  status: "Draft" | "Approved" | "Completed";
  objectives?: string;
  topics?: string;
  branchId: string;
}

const STATUS_COLOR: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  Approved:  "bg-blue-100 text-blue-700",
  Draft:     "bg-amber-100 text-amber-700",
};

export default function LessonPlansReportPage() {
  const { currentBranch } = useBranch();
  const { data: all, loading } = useFirestoreCollection<LessonPlan>("lessonPlans", currentBranch);

  const [subjectF, setSubjectF] = useState("All");
  const [statusF,  setStatusF]  = useState("All");
  const [classF,   setClassF]   = useState("All");

  const subjects = useMemo(() => ["All", ...Array.from(new Set(all.map(l => l.subject).filter(Boolean))).sort()], [all]);
  const classes  = useMemo(() => ["All", ...Array.from(new Set(all.map(l => l.className).filter(Boolean))).sort()], [all]);

  const filtered = useMemo(() =>
    all.filter(l =>
      (subjectF === "All" || l.subject   === subjectF) &&
      (statusF  === "All" || l.status    === statusF)  &&
      (classF   === "All" || l.className === classF)
    ), [all, subjectF, statusF, classF]);

  const kpi = useMemo(() => ({
    total:      all.length,
    completed:  all.filter(l => l.status === "Completed").length,
    approved:   all.filter(l => l.status === "Approved").length,
    draft:      all.filter(l => l.status === "Draft").length,
  }), [all]);

  // Subject-wise breakdown
  const subjectBreakdown = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    all.forEach(l => {
      const sub = l.subject ?? "Unknown";
      if (!map[sub]) map[sub] = { total: 0, completed: 0 };
      map[sub].total++;
      if (l.status === "Completed") map[sub].completed++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [all]);

  const handleExport = () => {
    const headers = ["#", "Title", "Subject", "Class", "Teacher", "Date", "Duration", "Status"];
    const rows = filtered.map((l, i) => [
      i + 1, `"${l.title}"`, l.subject, l.className, `"${l.teacher}"`, l.date, l.duration, l.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "lesson-plans-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: `${filtered.length} records exported.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Lesson Plans Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Lesson Plans</span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Plans",  value: kpi.total,     color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: LayoutList  },
            { label: "Completed",    value: kpi.completed, color: "text-green-600", bg: "bg-green-100", icon: CheckCircle },
            { label: "Approved",     value: kpi.approved,  color: "text-blue-600",  bg: "bg-blue-100",  icon: BookOpen    },
            { label: "Draft",        value: kpi.draft,     color: "text-amber-600", bg: "bg-amber-100", icon: FileText    },
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

        {/* Subject breakdown */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b py-3 px-6">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Subject-wise Plans</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)
            ) : subjectBreakdown.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4">No lesson plans created yet.</p>
            ) : subjectBreakdown.map(([sub, d]) => {
              const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
              return (
                <div key={sub} className="flex items-center gap-4">
                  <span className="w-36 text-xs font-medium text-[#1E2A4A] truncate">{sub}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 80 ? "bg-green-400" : pct >= 50 ? "bg-blue-400" : "bg-amber-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold w-10 text-right">{pct}%</span>
                  <span className="text-xs text-muted-foreground w-20">{d.completed}/{d.total} done</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Detail table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Lesson Plans — {filtered.length}</CardTitle>
            <div className="flex gap-2">
              <Select value={subjectF} onValueChange={setSubjectF}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Subjects" : s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={classF} onValueChange={setClassF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={statusF} onValueChange={setStatusF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["All", "Completed", "Approved", "Draft"].map(s =>
                    <SelectItem key={s} value={s}>{s === "All" ? "All Status" : s}</SelectItem>
                  )}
                </SelectContent>
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
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Class</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Duration</TableHead>
                <TableHead>Status</TableHead>
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
                <TableRow><TableCell colSpan={8} className="h-20 text-center text-muted-foreground">No records found.</TableCell></TableRow>
              ) : filtered.map((l, i) => (
                <TableRow key={l.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-semibold text-sm text-[#1E2A4A]">{l.title}</TableCell>
                  <TableCell><Badge className="bg-purple-100 text-purple-700 text-[10px]">{l.subject}</Badge></TableCell>
                  <TableCell className="text-center text-sm">{l.className}</TableCell>
                  <TableCell className="text-sm">{l.teacher}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.date}</TableCell>
                  <TableCell className="text-center text-xs">{l.duration}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${STATUS_COLOR[l.status] ?? "bg-slate-100 text-slate-700"}`}>{l.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
