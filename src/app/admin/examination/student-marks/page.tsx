"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Printer, Search, X } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useSettings } from "@/context/SettingsContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { classNumberOf } from "@/config/academics";

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-green-700 bg-green-100",
  "A":  "text-green-600 bg-green-50",
  "B+": "text-blue-700 bg-blue-100",
  "B":  "text-blue-600 bg-blue-50",
  "C+": "text-amber-700 bg-amber-100",
  "C":  "text-amber-600 bg-amber-50",
  "D":  "text-orange-600 bg-orange-50",
  "F":  "text-red-600 bg-red-100",
};

// Same bands Mark Entry uses when it grades a single subject.
function gradeFor(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C+";
  if (pct >= 40) return "C";
  return "D";
}

type Result = "Pass" | "Fail" | "Absent";

interface SubjectMark {
  id: string;
  subject: string;
  date: string;
  maxMarks: number;
  passMarks: number;
  marksObtained: number;
  grade: string | null;
  result: Result;
}

interface ExamMarks {
  key: string;
  name: string;
  subjects: SubjectMark[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  result: "Pass" | "Fail" | "Incomplete";
  grade: string;
}

interface StudentMarks {
  studentId: string;
  name: string;
  classNumber: string;
  rollNo: string;
  exams: ExamMarks[];
}

function formatDate(date?: string): string {
  if (!date) return "—";
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function dateRange(subjects: SubjectMark[]): string {
  const dates = subjects.map(s => s.date).filter(Boolean).sort();
  if (dates.length === 0) return "—";
  const first = dates[0], last = dates[dates.length - 1];
  return first === last ? formatDate(first) : `${formatDate(first)} – ${formatDate(last)}`;
}

function toSubjectMark(m: any): SubjectMark {
  const maxMarks = Number(m.maxMarks) || 0;
  const passMarks = Number(m.passMarks) || 0;
  const marksObtained = Number(m.marksObtained) || 0;
  const result: Result = m.status === "Absent" ? "Absent" : marksObtained < passMarks ? "Fail" : "Pass";
  return {
    id: m.id,
    subject: m.subject ?? "—",
    date: m.date ?? "",
    maxMarks,
    passMarks,
    marksObtained,
    grade: result === "Absent" ? null : (m.grade ?? null),
    result,
  };
}

function summarise(key: string, name: string, subjects: SubjectMark[]): ExamMarks {
  subjects.sort((a, b) => a.date.localeCompare(b.date) || a.subject.localeCompare(b.subject));
  const totalObtained = subjects.reduce((sum, s) => sum + (s.result === "Absent" ? 0 : s.marksObtained), 0);
  const totalMax = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
  const percentage = totalMax ? (totalObtained / totalMax) * 100 : 0;
  const result = subjects.some(s => s.result === "Fail") ? "Fail"
    : subjects.some(s => s.result === "Absent") ? "Incomplete"
    : "Pass";
  return {
    key, name, subjects, totalObtained, totalMax, percentage, result,
    grade: result === "Fail" ? "F" : gradeFor(percentage),
  };
}

const PRINT_CLASS = "student-marks-printing";
const PRINT_TARGET = "student-marks-print-target";

// Print one mark list on its own. The rules only apply while the body carries
// PRINT_CLASS, so they never affect printing anywhere else in the app.
const PRINT_CSS = `
@media print {
  body.${PRINT_CLASS} * { visibility: hidden; }
  body.${PRINT_CLASS} .${PRINT_TARGET}, body.${PRINT_CLASS} .${PRINT_TARGET} * { visibility: visible; }
  body.${PRINT_CLASS} .${PRINT_TARGET} {
    position: absolute; left: 0; top: 0; width: 100%;
    box-shadow: none !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
}`;

function ResultBadge({ result }: { result: string }) {
  const styles: Record<string, string> = {
    Pass:       "text-green-600 border-green-200 bg-green-50",
    Fail:       "text-red-600 border-red-200 bg-red-50",
    Absent:     "text-red-500 border-red-200 bg-red-50",
    Incomplete: "text-amber-600 border-amber-200 bg-amber-50",
  };
  return <Badge variant="outline" className={`text-xs ${styles[result] ?? ""}`}>{result}</Badge>;
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-muted-foreground">—</span>;
  return <Badge className={`text-xs ${GRADE_COLORS[grade] ?? ""}`}>{grade}</Badge>;
}

export default function StudentMarkListPage() {
  const { currentBranch } = useBranch();
  const { settings } = useSettings();
  const [search, setSearch] = useState("");

  const { data: allMarks, loading: marksLoading } = useFirestoreCollection<any>("marks", currentBranch, { orderByField: "date" });
  const { data: allStudents } = useFirestoreCollection<any>("students", currentBranch);

  const studentMarks = useMemo<StudentMarks[]>(() => {
    const studentById = new Map(allStudents.map((s: any) => [s.id, s]));
    // student → exam → subject marks. Marks saved without an exam are grouped
    // under their test name ("Manual Entry").
    const byStudent = new Map<string, { name: string; classNumber: string; exams: Map<string, { name: string; subjects: SubjectMark[] }> }>();
    allMarks.forEach((m: any) => {
      if (!m.studentId) return;
      const student = studentById.get(m.studentId);
      let entry = byStudent.get(m.studentId);
      if (!entry) {
        entry = {
          name: student?.name ?? m.studentName ?? "—",
          classNumber: classNumberOf(student?.class ?? m.class) || String(student?.class ?? m.class ?? ""),
          exams: new Map(),
        };
        byStudent.set(m.studentId, entry);
      }
      const examKey = m.examId ?? `test:${m.testName ?? "Manual Entry"}`;
      const exam = entry.exams.get(examKey) ?? { name: m.testName ?? "Manual Entry", subjects: [] as SubjectMark[] };
      exam.subjects.push(toSubjectMark(m));
      entry.exams.set(examKey, exam);
    });

    return Array.from(byStudent, ([studentId, s]) => ({
      studentId,
      name: s.name,
      classNumber: s.classNumber,
      rollNo: studentById.get(studentId)?.rollNo ?? "",
      exams: Array.from(s.exams, ([key, e]) => summarise(key, e.name, e.subjects))
        // Most recent exam first.
        .sort((a, b) => (b.subjects[b.subjects.length - 1]?.date ?? "").localeCompare(a.subjects[a.subjects.length - 1]?.date ?? "")),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allMarks, allStudents]);

  const query = search.trim().toLowerCase();
  const visible = query
    ? studentMarks.filter(s => s.name.toLowerCase().includes(query))
    : studentMarks;

  const printList = (studentId: string) => {
    const target = document.getElementById(`mark-list-${studentId}`);
    if (!target) return;
    target.classList.add(PRINT_TARGET);
    document.body.classList.add(PRINT_CLASS);
    const cleanup = () => {
      target.classList.remove(PRINT_TARGET);
      document.body.classList.remove(PRINT_CLASS);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <style>{PRINT_CSS}</style>
      <SharedHeader title="Student Mark List" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/examination" className="hover:text-[#0D7C8F]">Examination</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Student Mark List</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Student Mark List</h2>
          {!marksLoading && (
            <span className="text-sm text-muted-foreground">
              {visible.length} {visible.length === 1 ? "student" : "students"}
            </span>
          )}
        </div>

        {/* Search */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1.5">Search Student</p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Type a student name..."
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {marksLoading ? (
          <Card className="border-none shadow-sm">
            <CardContent className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              Loading marks...
            </CardContent>
          </Card>
        ) : visible.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              {query
                ? `No marks found for a student named "${search.trim()}".`
                : "No marks have been saved yet. Enter marks in Mark Entry to see them here."}
            </CardContent>
          </Card>
        ) : visible.map(student => (
          <Card
            key={student.studentId}
            id={`mark-list-${student.studentId}`}
            className="border-none shadow-sm overflow-hidden bg-white"
          >
            {/* Header */}
            <CardHeader className="bg-[#1E2A4A] text-white p-6 text-center space-y-1">
              <div className="flex items-center justify-center gap-3 mb-2">
                <BookOpen className="h-8 w-8 text-blue-300" />
                <div className="text-left">
                  <p className="text-xl font-bold">{settings.appName}</p>
                  <p className="text-xs text-blue-200">{settings.address}</p>
                </div>
              </div>
              <div className="border-t border-blue-700 pt-3">
                <p className="text-sm font-semibold tracking-wide text-blue-100">STUDENT MARK LIST</p>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Student info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-lg p-4">
                {[
                  { label: "Student Name", value: student.name },
                  { label: "Class", value: student.classNumber ? `Class ${student.classNumber}` : "—" },
                  { label: "Roll No", value: student.rollNo || "—" },
                  { label: "Exams", value: String(student.exams.length) },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-semibold text-sm text-[#1E2A4A]">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* One table per exam */}
              {student.exams.map(exam => (
                <div key={exam.key} className="rounded-lg border overflow-hidden break-inside-avoid">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 px-4 py-2.5">
                    <div>
                      <p className="text-xs text-muted-foreground">Exam Name</p>
                      <p className="font-bold text-[#1E2A4A]">{exam.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Exam Date</p>
                      <p className="text-sm font-medium text-[#1E2A4A]">{dateRange(exam.subjects)}</p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Max Marks</TableHead>
                        <TableHead className="text-right">Pass Marks</TableHead>
                        <TableHead className="text-right">Marks Obtained</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-center">Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exam.subjects.map(sub => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.subject}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(sub.date)}</TableCell>
                          <TableCell className="text-right">{sub.maxMarks}</TableCell>
                          <TableCell className="text-right">{sub.passMarks}</TableCell>
                          <TableCell className="text-right font-bold text-[#1E2A4A]">
                            {sub.result === "Absent" ? "—" : sub.marksObtained}
                          </TableCell>
                          <TableCell className="text-center"><GradeBadge grade={sub.grade} /></TableCell>
                          <TableCell className="text-center"><ResultBadge result={sub.result} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter className="bg-slate-50">
                      <TableRow>
                        <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                        <TableCell className="text-right font-semibold">{exam.totalMax}</TableCell>
                        <TableCell />
                        <TableCell className="text-right font-bold text-[#1E2A4A]">{exam.totalObtained}</TableCell>
                        <TableCell colSpan={2} />
                      </TableRow>
                    </TableFooter>
                  </Table>

                  {/* Exam summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t px-4 py-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Marks</p>
                      <p className="font-bold text-sm text-[#1E2A4A]">{exam.totalObtained} / {exam.totalMax}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Percentage</p>
                      <p className="font-bold text-sm text-[#1E2A4A]">{exam.percentage.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Overall Grade</p>
                      <GradeBadge grade={exam.grade} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Overall Result</p>
                      <ResultBadge result={exam.result} />
                    </div>
                  </div>
                </div>
              ))}

              {/* Grade key, so parents can read the grades */}
              <div className="text-xs text-muted-foreground bg-slate-50 rounded-lg px-4 py-3">
                <span className="font-semibold text-foreground">Grade Scale: </span>
                A+ (90–100%) · A (80–89%) · B+ (70–79%) · B (60–69%) · C+ (50–59%) · C (40–49%) · D (below 40%) · F (below pass marks)
              </div>

              {/* Footer */}
              <div className="grid grid-cols-2 gap-8 pt-10 text-xs text-muted-foreground">
                <div className="border-t pt-2 text-center">Class Teacher</div>
                <div className="border-t pt-2 text-center">Parent / Guardian</div>
              </div>
              <div className="text-center text-xs text-muted-foreground border-t pt-4">
                <p>{settings.appName} — {settings.address}</p>
                <p>Phone: {settings.contactPhone} | Email: {settings.contactEmail}</p>
              </div>
            </CardContent>

            <div className="bg-slate-50 border-t px-6 py-3 flex justify-end print:hidden">
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={() => printList(student.studentId)}>
                <Printer className="h-4 w-4" /> Print Mark List
              </Button>
            </div>
          </Card>
        ))}

      </main>
    </div>
  );
}
