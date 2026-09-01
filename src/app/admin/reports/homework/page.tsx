"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, PenSquare, Download, BookOpen, Calendar, Users } from "lucide-react";
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

interface Homework {
  id: string;
  title: string;
  subject: string;
  className: string;
  teacher: string;
  assignedDate: string;
  dueDate: string;
  status: "Pending" | "Submitted" | "Overdue";
  description?: string;
  totalStudents?: number;
  submitted?: number;
  branchId: string;
}

const STATUS_COLOR: Record<string, string> = {
  Submitted: "bg-green-100 text-green-700",
  Pending:   "bg-amber-100 text-amber-700",
  Overdue:   "bg-red-100 text-red-700",
};

export default function HomeworkReportPage() {
  const { currentBranch } = useBranch();
  const { data: all, loading } = useFirestoreCollection<Homework>("homework", currentBranch);

  const [subjectF, setSubjectF] = useState("All");
  const [classF,   setClassF]   = useState("All");

  const subjects = useMemo(() => ["All", ...Array.from(new Set(all.map(h => h.subject).filter(Boolean))).sort()], [all]);
  const classes  = useMemo(() => ["All", ...Array.from(new Set(all.map(h => h.className).filter(Boolean))).sort()], [all]);

  const filtered = useMemo(() =>
    all.filter(h =>
      (subjectF === "All" || h.subject   === subjectF) &&
      (classF   === "All" || h.className === classF)
    ), [all, subjectF, classF]);

  const today = new Date();
  const kpi = useMemo(() => ({
    total:    all.length,
    overdue:  all.filter(h => h.status === "Overdue" || (h.dueDate && new Date(h.dueDate) < today)).length,
    upcoming: all.filter(h => h.status === "Pending"  && h.dueDate && new Date(h.dueDate) >= today).length,
    subjects: new Set(all.map(h => h.subject).filter(Boolean)).size,
  }), [all]);

  const subjectSummary = useMemo(() => {
    const map: Record<string, number> = {};
    all.forEach(h => { if (h.subject) map[h.subject] = (map[h.subject] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [all]);

  const handleExport = () => {
    const headers = ["#", "Title", "Subject", "Class", "Teacher", "Assigned", "Due Date", "Status"];
    const rows = filtered.map((h, i) => [
      i + 1, `"${h.title}"`, h.subject, h.className, `"${h.teacher}"`, h.assignedDate, h.dueDate, h.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "homework-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: `${filtered.length} records exported.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Home Work Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Home Work</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Homework", value: kpi.total,    color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: PenSquare },
            { label: "Overdue",        value: kpi.overdue,  color: "text-red-600",   bg: "bg-red-100",   icon: Calendar  },
            { label: "Upcoming",       value: kpi.upcoming, color: "text-green-600", bg: "bg-green-100", icon: BookOpen  },
            { label: "Subjects",       value: kpi.subjects, color: "text-purple-600",bg: "bg-purple-100",icon: Users     },
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
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Homework by Subject</CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-wrap gap-3">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-28 rounded-lg" />)
            ) : subjectSummary.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4 w-full">No homework assigned yet.</p>
            ) : subjectSummary.map(([sub, count]) => (
              <div key={sub} className="flex items-center gap-2 bg-slate-50 rounded-lg px-4 py-2.5">
                <span className="text-sm font-semibold text-[#1E2A4A]">{sub}</span>
                <Badge className="bg-orange-100 text-orange-700 text-xs">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Homework Records — {filtered.length}</CardTitle>
            <div className="flex gap-2">
              <Select value={subjectF} onValueChange={setSubjectF}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Subjects" : s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={classF} onValueChange={setClassF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : c}</SelectItem>)}</SelectContent>
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
                <TableHead>Assigned</TableHead>
                <TableHead>Due Date</TableHead>
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
              ) : filtered.map((h, i) => (
                <TableRow key={h.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-semibold text-sm text-[#1E2A4A]">{h.title}</TableCell>
                  <TableCell><Badge className="bg-orange-100 text-orange-700 text-[10px]">{h.subject}</Badge></TableCell>
                  <TableCell className="text-center text-sm">{h.className}</TableCell>
                  <TableCell className="text-xs">{h.teacher}</TableCell>
                  <TableCell className="text-xs">{h.assignedDate}</TableCell>
                  <TableCell className="text-xs font-medium">{h.dueDate}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${STATUS_COLOR[h.status] ?? "bg-slate-100 text-slate-700"}`}>{h.status}</Badge>
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
