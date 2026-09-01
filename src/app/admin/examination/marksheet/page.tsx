"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Printer, BookOpen } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useSettings } from "@/context/SettingsContext";

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

export default function MarksheetPage() {
  const { currentBranch } = useBranch();
  const { settings } = useSettings();

  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const { data: allExams } = useFirestoreCollection<any>("exams", currentBranch, { orderByField: "date", orderByDir: "desc" });
  const { data: allStudents } = useFirestoreCollection<any>("students", currentBranch);
  const { data: allMarks } = useFirestoreCollection<any>("marks", currentBranch, { filterByBranch: false });

  const branchExams = useMemo(
    () => allExams.filter((e: any) => e.status === "Completed"),
    [allExams],
  );

  const selectedExam = useMemo(
    () => branchExams.find((e: any) => e.id === selectedExamId) ?? null,
    [branchExams, selectedExamId],
  );

  const examStudentIds = useMemo(
    () => new Set(allMarks.filter((m: any) => m.examId === selectedExamId).map((m: any) => m.studentId)),
    [allMarks, selectedExamId],
  );

  const examStudents = useMemo(
    () => allStudents.filter((s: any) => examStudentIds.has(s.id)),
    [allStudents, examStudentIds],
  );

  const selectedStudent = useMemo(
    () => examStudents.find((s: any) => s.id === selectedStudentId) ?? null,
    [examStudents, selectedStudentId],
  );

  const markRecord = useMemo(
    () => allMarks.find((m: any) => m.examId === selectedExamId && m.studentId === selectedStudentId) ?? null,
    [allMarks, selectedExamId, selectedStudentId],
  );

  const handleExamChange = (v: string) => {
    setSelectedExamId(v);
    setSelectedStudentId("");
  };

  const pct = markRecord
    ? ((markRecord.marksObtained / markRecord.maxMarks) * 100).toFixed(1)
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Print Marksheet" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/examination" className="hover:text-[#0D7C8F]">Examination</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Print Marksheet</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Print Marksheet</h2>
        </div>

        {/* Selector */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5 flex-1 min-w-48">
                <p className="text-xs font-bold uppercase text-muted-foreground">Exam (Completed only)</p>
                <Select value={selectedExamId} onValueChange={handleExamChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam..." />
                  </SelectTrigger>
                  <SelectContent>
                    {branchExams.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground text-center">No completed exams</div>
                    ) : branchExams.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} — Class {e.class}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex-1 min-w-48">
                <p className="text-xs font-bold uppercase text-muted-foreground">Student</p>
                <Select
                  value={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                  disabled={!selectedExamId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedExamId ? "Select student..." : "Select exam first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {examStudents.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground text-center">No marks recorded for this exam</div>
                    ) : examStudents.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marksheet */}
        {markRecord && selectedExam && selectedStudent ? (
          <Card className="border-none shadow-sm overflow-hidden" id="marksheet-print">
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
                <p className="text-sm font-semibold text-blue-100">ACADEMIC MARKSHEET</p>
                <p className="text-base font-bold mt-1">{selectedExam.name}</p>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Student info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-lg p-4">
                {[
                  { label: "Student Name", value: selectedStudent.name },
                  { label: "Class", value: `Class ${selectedStudent.class}` },
                  { label: "Roll No", value: selectedStudent.rollNo },
                  { label: "Exam Date", value: selectedExam.date },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-semibold text-sm text-[#1E2A4A]">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Marks table */}
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Max Marks</TableHead>
                    <TableHead className="text-right">Pass Marks</TableHead>
                    <TableHead className="text-right">Marks Obtained</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">{selectedExam.subject}</TableCell>
                    <TableCell className="text-right">{markRecord.maxMarks}</TableCell>
                    <TableCell className="text-right">{selectedExam.passMarks}</TableCell>
                    <TableCell className="text-right font-bold text-[#1E2A4A]">
                      {markRecord.status === "Absent" ? "—" : markRecord.marksObtained}
                    </TableCell>
                    <TableCell className="text-center">
                      {markRecord.grade ? (
                        <Badge className={`text-xs ${GRADE_COLORS[markRecord.grade] ?? ""}`}>
                          {markRecord.grade}
                        </Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {markRecord.status === "Absent" ? (
                        <Badge variant="outline" className="text-xs text-red-500 border-red-200 bg-red-50">Absent</Badge>
                      ) : markRecord.grade === "F" ? (
                        <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">Fail</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">Pass</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Summary */}
              <div className="flex justify-end">
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 w-64">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Marks Obtained</span>
                    <span className="font-bold text-[#1E2A4A]">
                      {markRecord.status === "Absent" ? "Absent" : `${markRecord.marksObtained} / ${markRecord.maxMarks}`}
                    </span>
                  </div>
                  {pct && markRecord.status !== "Absent" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Percentage</span>
                      <span className="font-bold text-[#1E2A4A]">{pct}%</span>
                    </div>
                  )}
                  {markRecord.grade && (
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-semibold">Overall Grade</span>
                      <Badge className={`text-sm px-3 ${GRADE_COLORS[markRecord.grade] ?? ""}`}>
                        {markRecord.grade}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground border-t pt-4">
                <p>{settings.appName} — {settings.address}</p>
                <p>Phone: {settings.contactPhone} | Email: {settings.contactEmail}</p>
              </div>
            </CardContent>

            {/* Print button */}
            <div className="bg-slate-50 border-t px-6 py-3 flex justify-end print:hidden">
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print Marksheet
              </Button>
            </div>
          </Card>
        ) : selectedExamId && selectedStudentId ? (
          <Card className="border-none shadow-sm">
            <CardContent className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              No marks record found for the selected student and exam.
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-sm">
            <CardContent className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              Select an exam and student above to generate the marksheet.
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}
