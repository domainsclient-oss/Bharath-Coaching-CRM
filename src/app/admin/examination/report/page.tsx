"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, BarChart3, Users, CheckCircle2, XCircle, TrendingUp,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-green-100 text-green-700",
  "A":  "bg-green-100 text-green-600",
  "B+": "bg-blue-100 text-blue-700",
  "B":  "bg-blue-100 text-blue-600",
  "C+": "bg-amber-100 text-amber-700",
  "C":  "bg-amber-100 text-amber-600",
  "D":  "bg-orange-100 text-orange-600",
  "F":  "bg-red-100 text-red-600",
};

const ALL_GRADES = ["A+", "A", "B+", "B", "C+", "C", "D", "F"];

export default function ExamReportPage() {
  const { currentBranch } = useBranch();

  const { data: allExams } = useFirestoreCollection<any>("exams", currentBranch, { orderByField: "date", orderByDir: "desc" });
  const { data: allMarks } = useFirestoreCollection<any>("marks", currentBranch, { filterByBranch: false });

  const branchExams = useMemo(
    () => allExams.filter((e: any) => e.status === "Completed"),
    [allExams],
  );

  const [selectedExamId, setSelectedExamId] = useState<string>("");

  const selectedExam = useMemo(
    () => branchExams.find((e: any) => e.id === selectedExamId) ?? null,
    [branchExams, selectedExamId],
  );

  const examMarks = useMemo(
    () => allMarks.filter((m: any) => m.examId === selectedExamId),
    [allMarks, selectedExamId],
  );

  const totalStudents = examMarks.length;
  const presentStudents = examMarks.filter(m => m.status === "Present");
  const absentCount = examMarks.filter(m => m.status === "Absent").length;
  const passCount = presentStudents.filter(m => m.grade && m.grade !== "F").length;
  const failCount = presentStudents.filter(m => m.grade === "F").length;
  const passRate = presentStudents.length > 0
    ? Math.round((passCount / presentStudents.length) * 100)
    : 0;

  const avgMarks = presentStudents.length > 0
    ? (presentStudents.reduce((s, m) => s + m.marksObtained, 0) / presentStudents.length).toFixed(1)
    : "—";

  const highestMark = presentStudents.length > 0
    ? Math.max(...presentStudents.map(m => m.marksObtained))
    : 0;
  const lowestMark = presentStudents.length > 0
    ? Math.min(...presentStudents.map(m => m.marksObtained))
    : 0;

  // Grade distribution
  const gradeDist = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_GRADES.forEach(g => (counts[g] = 0));
    presentStudents.forEach(m => {
      if (m.grade) counts[m.grade] = (counts[m.grade] ?? 0) + 1;
    });
    const max = Math.max(...Object.values(counts), 1);
    return ALL_GRADES.map(g => ({ grade: g, count: counts[g], pct: Math.round((counts[g] / max) * 100) }));
  }, [presentStudents]);

  // Sorted student results
  const sortedResults = useMemo(
    () => [...examMarks].sort((a, b) => b.marksObtained - a.marksObtained),
    [examMarks],
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Exam Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/examination" className="hover:text-[#0D7C8F]">Examination</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Report</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Exam Report</h2>
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select completed exam..." />
            </SelectTrigger>
            <SelectContent>
              {branchExams.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground text-center">No completed exams</div>
              ) : branchExams.map((e: any) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} — Class {e.class}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedExam ? (
          <Card className="border-none shadow-sm">
            <CardContent className="h-40 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <BarChart3 className="h-10 w-10 mx-auto opacity-20" />
                <p>Select a completed exam to view the report.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Exam info banner */}
            <Card className="border-none shadow-sm bg-[#1E2A4A] text-white">
              <CardContent className="p-5 flex flex-wrap gap-6">
                <div>
                  <p className="text-xs text-blue-200 mb-1">Exam</p>
                  <p className="text-base font-bold">{selectedExam.name}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-200 mb-1">Class / Subject</p>
                  <p className="font-semibold">Class {selectedExam.class} — {selectedExam.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-200 mb-1">Date</p>
                  <p className="font-semibold">{selectedExam.date}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-200 mb-1">Max / Pass</p>
                  <p className="font-semibold">{selectedExam.maxMarks} / {selectedExam.passMarks}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-200 mb-1">Pass Rate</p>
                  <p className={`text-lg font-bold ${passRate >= 70 ? "text-green-300" : passRate >= 50 ? "text-amber-300" : "text-red-300"}`}>
                    {passRate}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Students", value: totalStudents, icon: Users, color: "text-[#1E2A4A]", bg: "bg-blue-100", iconColor: "text-blue-600" },
                { label: "Pass", value: passCount, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100", iconColor: "text-green-600" },
                { label: "Fail", value: failCount, icon: XCircle, color: "text-red-500", bg: "bg-red-100", iconColor: "text-red-500" },
                { label: "Absent", value: absentCount, icon: Users, color: "text-amber-600", bg: "bg-amber-100", iconColor: "text-amber-600" },
              ].map(card => {
                const Icon = card.icon;
                return (
                  <Card key={card.label} className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full ${card.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-4 w-4 ${card.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Average Marks", value: avgMarks },
                { label: "Highest", value: highestMark || "—" },
                { label: "Lowest", value: lowestMark || "—" },
              ].map(s => (
                <Card key={s.label} className="border-none shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-[#0D7C8F]">{s.value}</p>
                    <p className="text-xs text-muted-foreground">/ {selectedExam.maxMarks}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Grade distribution */}
            <Card className="border-none shadow-sm">
              <CardHeader className="bg-slate-50 border-b py-3 px-6">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#0D7C8F]" />
                  Grade Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-end gap-3 h-36">
                  {gradeDist.map(g => (
                    <div key={g.grade} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">{g.count}</span>
                      <div
                        className={`w-full rounded-t-sm transition-all ${
                          g.grade === "F" ? "bg-red-400" :
                          g.grade.startsWith("A") ? "bg-green-500" :
                          g.grade.startsWith("B") ? "bg-blue-400" :
                          g.grade.startsWith("C") ? "bg-amber-400" : "bg-orange-400"
                        }`}
                        style={{ height: `${Math.max(g.pct, g.count > 0 ? 8 : 0)}%` }}
                      />
                      <Badge className={`text-xs px-1.5 py-0 ${GRADE_COLORS[g.grade]}`}>{g.grade}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Student results table */}
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 border-b py-3 px-6">
                <CardTitle className="text-base">Student Results</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Marks</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No marks recorded for this exam yet.
                      </TableCell>
                    </TableRow>
                  ) : sortedResults.map((m, idx) => {
                    const studentPct = m.status === "Absent"
                      ? null
                      : ((m.marksObtained / m.maxMarks) * 100).toFixed(1);
                    return (
                      <TableRow key={m.id} className="hover:bg-slate-50/50">
                        <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-sm text-[#1E2A4A]">{m.studentName}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {m.status === "Absent" ? "—" : `${m.marksObtained} / ${m.maxMarks}`}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {studentPct ? `${studentPct}%` : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {m.grade ? (
                            <Badge className={`text-xs ${GRADE_COLORS[m.grade] ?? ""}`}>{m.grade}</Badge>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {m.status === "Absent" ? (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">Absent</Badge>
                          ) : m.grade === "F" ? (
                            <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">Fail</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">Pass</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

      </main>
    </div>
  );
}
