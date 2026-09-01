"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardList, Download, TrendingUp, Users, Award } from "lucide-react";
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

interface MarkRecord {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  subject: string;
  testName: string;
  date: string;
  marksObtained: number;
  maxMarks: number;
  passMarks?: number;
  status: "Present" | "Absent";
  grade: string | null;
  class?: string;
  branchId: string;
}

interface SubjectDoc {
  id: string;
  name: string;
  branchId: string;
}

interface ClassDoc {
  id: string;
  name: string;
  branchId: string;
}

const GRADE_COLOR: Record<string, string> = {
  "A+": "bg-green-100 text-green-700",
  "A":  "bg-teal-100 text-teal-700",
  "B+": "bg-blue-100 text-blue-700",
  "B":  "bg-blue-100 text-blue-600",
  "C+": "bg-amber-100 text-amber-700",
  "C":  "bg-amber-100 text-amber-600",
  "D":  "bg-orange-100 text-orange-700",
  "F":  "bg-red-100 text-red-700",
};

export default function ExaminationReportPage() {
  const { currentBranch } = useBranch();

  const { data: all,         loading }     = useFirestoreCollection<MarkRecord>("marks",    currentBranch);
  const { data: allSubjects }              = useFirestoreCollection<SubjectDoc>("subjects", currentBranch);
  const { data: allClasses  }              = useFirestoreCollection<ClassDoc>("classes",   currentBranch);

  const [subjectF, setSubjectF] = useState("All");
  const [classF,   setClassF]   = useState("All");

  const subjects = useMemo(() => {
    const fromCollection = allSubjects.map(s => s.name).filter(Boolean);
    const fromRecords    = all.map(r => r.subject).filter(Boolean);
    const merged         = Array.from(new Set([...fromCollection, ...fromRecords])).sort();
    return ["All", ...merged];
  }, [allSubjects, all]);

  const classes = useMemo(() => {
    const fromCollection = allClasses.map(c => {
      const n = (c.name ?? "").trim();
      return n.toLowerCase().startsWith("class ") ? n.slice(6).trim() : n;
    }).filter(Boolean);
    const fromRecords = all.map(r => r.class).filter(Boolean) as string[];
    const merged      = Array.from(new Set([...fromCollection, ...fromRecords])).sort((a, b) => {
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    return ["All", ...merged];
  }, [allClasses, all]);

  const filtered = useMemo(() =>
    all.filter(r => {
      const rClass = (r.class ?? "").trim();
      const rClassNorm = rClass.toLowerCase().startsWith("class ") ? rClass.slice(6).trim() : rClass;
      return (
        (subjectF === "All" || r.subject === subjectF) &&
        (classF   === "All" || rClassNorm === classF)
      );
    }), [all, subjectF, classF]);

  const kpi = useMemo(() => {
    const present = filtered.filter(r => r.status === "Present");
    const avg     = present.length > 0
      ? Math.round(present.reduce((s, r) => s + (r.marksObtained / r.maxMarks) * 100, 0) / present.length)
      : 0;
    const passed  = present.filter(r => (r.marksObtained / r.maxMarks) >= 0.4).length;
    const toppers = present.filter(r => (r.marksObtained / r.maxMarks) >= 0.9).length;
    return { total: filtered.length, avg, passed, toppers };
  }, [filtered]);

  const subjectSummary = useMemo(() => {
    const map: Record<string, { total: number; sumPct: number }> = {};
    all.filter(r => r.status === "Present").forEach(r => {
      if (!map[r.subject]) map[r.subject] = { total: 0, sumPct: 0 };
      map[r.subject].total++;
      map[r.subject].sumPct += (r.marksObtained / r.maxMarks) * 100;
    });
    return Object.entries(map).map(([sub, d]) => ({
      subject: sub,
      avg:     d.total > 0 ? Math.round(d.sumPct / d.total) : 0,
      total:   d.total,
    })).sort((a, b) => b.avg - a.avg);
  }, [all]);

  const handleExport = () => {
    const headers = ["#", "Student", "Subject", "Test", "Class", "Date", "Marks", "Max", "%", "Grade", "Status"];
    const rows = filtered.map((r, i) => {
      const pct = r.status === "Present" ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0;
      return [i + 1, `"${r.studentName}"`, r.subject, `"${r.testName}"`, r.class ?? "-", r.date, r.marksObtained, r.maxMarks, `${pct}%`, r.grade ?? "-", r.status];
    });
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "examination-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: `${filtered.length} records exported.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Examinations Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Examinations</span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Records",  value: kpi.total,     color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: ClipboardList },
            { label: "Avg. Score",     value: `${kpi.avg}%`, color: "text-teal-600",  bg: "bg-teal-100",  icon: TrendingUp    },
            { label: "Passed",         value: kpi.passed,    color: "text-green-600", bg: "bg-green-100", icon: Users         },
            { label: "Toppers (≥90%)", value: kpi.toppers,   color: "text-amber-600", bg: "bg-amber-100", icon: Award         },
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

        {/* Subject-wise average */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b py-3 px-6">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Subject-wise Average</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)
            ) : subjectSummary.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4">No marks entered yet. Save marks from the Examinations page.</p>
            ) : subjectSummary.map(s => (
              <div key={s.subject} className="flex items-center gap-4">
                <span className="w-36 text-xs font-medium text-[#1E2A4A] truncate">{s.subject}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.avg >= 80 ? "bg-green-400" : s.avg >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${s.avg}%` }}
                  />
                </div>
                <span className="text-xs font-bold w-10 text-right">{s.avg}%</span>
                <span className="text-xs text-muted-foreground w-16">{s.total} records</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Detail table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Mark Records — {filtered.length}</CardTitle>
            <div className="flex gap-2">
              <Select value={classF} onValueChange={setClassF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={subjectF} onValueChange={setSubjectF}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Subjects" : s}</SelectItem>)}</SelectContent>
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
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Marks</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-center">%</TableHead>
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
              ) : filtered.map((r, i) => {
                const pct = r.status === "Present" ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0;
                return (
                  <TableRow key={r.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-semibold text-sm text-[#1E2A4A]">{r.studentName}</TableCell>
                    <TableCell className="text-sm">{r.subject}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.testName}</TableCell>
                    <TableCell className="text-xs">{r.date}</TableCell>
                    <TableCell className="text-center text-sm">
                      {r.status === "Present"
                        ? `${r.marksObtained}/${r.maxMarks}`
                        : <Badge className="bg-red-100 text-red-700 text-[10px]">Absent</Badge>}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.grade
                        ? <Badge className={`text-[10px] ${GRADE_COLOR[r.grade] ?? "bg-slate-100 text-slate-700"}`}>{r.grade}</Badge>
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold">
                      {r.status === "Present" ? `${pct}%` : "—"}
                    </TableCell>
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
