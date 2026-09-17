import { Badge } from "@/components/ui/badge";

export const GRADE_COLORS: Record<string, string> = {
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
export function gradeFor(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C+";
  if (pct >= 40) return "C";
  return "D";
}

// A single subject's grade, as Mark Entry stores it.
export function subjectGrade(marks: number, passMarks: number, maxMarks: number): string {
  if (marks < passMarks) return "F";
  return gradeFor(maxMarks ? (marks / maxMarks) * 100 : 0);
}

export type Result = "Pass" | "Fail" | "Absent";

export interface SubjectMark {
  id: string;
  subject: string;
  date: string;
  maxMarks: number;
  passMarks: number;
  marksObtained: number;
  grade: string | null;
  result: Result;
}

export interface ExamMarks {
  key: string;
  name: string;
  subjects: SubjectMark[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  result: "Pass" | "Fail" | "Incomplete";
  grade: string;
  latestDate: string;
}

/** One row of the list: a student's marks for one exam. */
export interface MarkListRow {
  key: string;
  studentId: string;
  name: string;
  classNumber: string;
  rollNo: string;
  exam: ExamMarks;
}

export function formatDate(date?: string): string {
  if (!date) return "—";
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function dateRange(subjects: SubjectMark[]): string {
  const dates = subjects.map(s => s.date).filter(Boolean).sort();
  if (dates.length === 0) return "—";
  const first = dates[0], last = dates[dates.length - 1];
  return first === last ? formatDate(first) : `${formatDate(first)} – ${formatDate(last)}`;
}

export function toSubjectMark(m: any): SubjectMark {
  const maxMarks = Number(m.maxMarks) || 0;
  const passMarks = Number(m.passMarks) || 0;
  const marksObtained = Number(m.marksObtained) || 0;
  const result: Result = m.status === "Absent" ? "Absent" : marksObtained < passMarks ? "Fail" : "Pass";
  return {
    id: m.id,
    subject: m.subject ?? "—",
    date: typeof m.date === "string" ? m.date : "",
    maxMarks,
    passMarks,
    marksObtained,
    grade: result === "Absent" ? null : (m.grade ?? null),
    result,
  };
}

export function summarise(key: string, name: string, subjects: SubjectMark[]): ExamMarks {
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
    latestDate: subjects[subjects.length - 1]?.date ?? "",
  };
}

export function ResultBadge({ result }: { result: string }) {
  const styles: Record<string, string> = {
    Pass:       "text-green-600 border-green-200 bg-green-50",
    Fail:       "text-red-600 border-red-200 bg-red-50",
    Absent:     "text-red-500 border-red-200 bg-red-50",
    Incomplete: "text-amber-600 border-amber-200 bg-amber-50",
  };
  return <Badge variant="outline" className={`text-xs ${styles[result] ?? ""}`}>{result}</Badge>;
}

export function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-muted-foreground">—</span>;
  return <Badge className={`text-xs ${GRADE_COLORS[grade] ?? ""}`}>{grade}</Badge>;
}
