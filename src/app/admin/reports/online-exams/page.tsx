"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Laptop, Download, CheckCircle, FileText, BookOpen, BarChart2 } from "lucide-react";
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

interface OnlineExam {
  id: string;
  title: string;
  subject: string;
  class: string;
  dateTime: string;
  durationMins: number;
  totalMarks: number;
  questionIds: string[];
  status: "Published" | "Draft";
  instructions?: string;
  branchId: string;
}

const STATUS_COLOR: Record<string, string> = {
  Published: "bg-green-100 text-green-700",
  Draft:     "bg-amber-100 text-amber-700",
};

export default function OnlineExamsReportPage() {
  const { currentBranch } = useBranch();

  const { data: exams, loading } = useFirestoreCollection<OnlineExam>(
    "onlineExams", currentBranch, { orderByField: "createdAt", orderByDir: "desc" }
  );
  const { data: allSubjects } = useFirestoreCollection<SubjectDoc>("subjects", currentBranch);
  const { data: allClasses  } = useFirestoreCollection<ClassDoc>("classes",  currentBranch);

  const [subjectF, setSubjectF] = useState("All");
  const [classF,   setClassF]   = useState("All");
  const [statusF,  setStatusF]  = useState("All");

  // Merge subjects from Firestore subjects collection + any found in exam records
  const subjects = useMemo(() => {
    const fromCollection = allSubjects.map(s => s.name).filter(Boolean);
    const fromExams      = exams.map(e => e.subject).filter(Boolean);
    const merged         = Array.from(new Set([...fromCollection, ...fromExams])).sort();
    return ["All", ...merged];
  }, [allSubjects, exams]);

  // Merge classes from Firestore classes collection + any found in exam records
  // Classes stored as "Class 6", "Class 7" — strip prefix for value, show full for label
  const classes = useMemo(() => {
    const fromCollection = allClasses.map(c => {
      const n = (c.name ?? "").trim();
      return n.toLowerCase().startsWith("class ") ? n.slice(6).trim() : n;
    }).filter(Boolean);
    const fromExams = exams.map(e => e.class).filter(Boolean);
    const merged    = Array.from(new Set([...fromCollection, ...fromExams])).sort((a, b) => {
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    return ["All", ...merged];
  }, [allClasses, exams]);

  const filtered = useMemo(() =>
    exams.filter(e =>
      (subjectF === "All" || e.subject === subjectF) &&
      (classF   === "All" || e.class   === classF)   &&
      (statusF  === "All" || e.status  === statusF)
    ), [exams, subjectF, classF, statusF]);

  const kpi = useMemo(() => ({
    total:      exams.length,
    published:  exams.filter(e => e.status === "Published").length,
    draft:      exams.filter(e => e.status === "Draft").length,
    totalQs:    exams.reduce((s, e) => s + (e.questionIds?.length ?? 0), 0),
  }), [exams]);

  // Subject-wise breakdown
  const subjectBreakdown = useMemo(() => {
    const map: Record<string, { total: number; published: number; totalMarks: number }> = {};
    exams.forEach(e => {
      const sub = e.subject ?? "Unknown";
      if (!map[sub]) map[sub] = { total: 0, published: 0, totalMarks: 0 };
      map[sub].total++;
      if (e.status === "Published") map[sub].published++;
      map[sub].totalMarks += e.totalMarks ?? 0;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [exams]);

  const handleExport = () => {
    const headers = ["#", "Title", "Subject", "Class", "Date & Time", "Duration (min)", "Total Marks", "Questions", "Status"];
    const rows = filtered.map((e, i) => [
      i + 1,
      `"${e.title}"`,
      e.subject,
      `Class ${e.class}`,
      e.dateTime,
      e.durationMins,
      e.totalMarks,
      e.questionIds?.length ?? 0,
      e.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "online-exams-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: `${filtered.length} records exported.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Online Examinations Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Online Examinations</span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Exams",      value: kpi.total,     color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: Laptop      },
            { label: "Published",        value: kpi.published, color: "text-green-600", bg: "bg-green-100", icon: CheckCircle },
            { label: "Drafts",           value: kpi.draft,     color: "text-amber-600", bg: "bg-amber-100", icon: FileText    },
            { label: "Total Questions",  value: kpi.totalQs,   color: "text-teal-600",  bg: "bg-teal-100",  icon: BookOpen    },
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
            <CardTitle className="text-sm font-bold text-[#1E2A4A] flex items-center gap-2">
              <BarChart2 className="h-4 w-4" /> Subject-wise Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)
            ) : subjectBreakdown.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4">No exams created yet.</p>
            ) : subjectBreakdown.map(([sub, d]) => (
              <div key={sub} className="flex items-center gap-4">
                <span className="w-32 text-xs font-medium text-[#1E2A4A] truncate">{sub}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0D7C8F]"
                    style={{ width: kpi.total > 0 ? `${Math.round((d.total / kpi.total) * 100)}%` : "0%" }}
                  />
                </div>
                <span className="text-xs font-bold w-8 text-right">{d.total}</span>
                <Badge className={`text-[10px] ${d.published > 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {d.published} published
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Exams table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Online Exams — {filtered.length}</CardTitle>
            <div className="flex gap-2">
              <Select value={statusF} onValueChange={setStatusF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subjectF} onValueChange={setSubjectF}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Subjects" : s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={classF} onValueChange={setClassF}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</SelectItem>)}</SelectContent>
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
                <TableHead>Exam Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Class</TableHead>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead className="text-center">Duration</TableHead>
                <TableHead className="text-center">Marks</TableHead>
                <TableHead className="text-center">Questions</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="h-20 text-center text-muted-foreground">No exams found.</TableCell></TableRow>
              ) : filtered.map((e, i) => (
                <TableRow key={e.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-semibold text-sm text-[#1E2A4A]">{e.title}</TableCell>
                  <TableCell><Badge className="bg-indigo-100 text-indigo-700 text-[10px]">{e.subject}</Badge></TableCell>
                  <TableCell className="text-center text-sm">Class {e.class}</TableCell>
                  <TableCell className="text-xs">{e.dateTime ? new Date(e.dateTime).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"}</TableCell>
                  <TableCell className="text-center text-sm">{e.durationMins ?? "—"} min</TableCell>
                  <TableCell className="text-center font-semibold text-sm">{e.totalMarks ?? "—"}</TableCell>
                  <TableCell className="text-center text-sm">{e.questionIds?.length ?? 0}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-[10px] ${STATUS_COLOR[e.status] ?? "bg-slate-100 text-slate-700"}`}>{e.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
