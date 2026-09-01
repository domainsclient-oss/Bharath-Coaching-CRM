"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight, Save, AlertCircle, Users,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Exam } from "@/data/examinationData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { db } from "@/config/firebase";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface MarkRow {
  studentId: string;
  studentName: string;
  rollNo: string;
  markId: string | null;
  status: "Present" | "Absent";
  marksObtained: number | null;
  grade: string | null;
}

function calcGrade(marks: number, passMarks: number, maxMarks: number): string {
  if (marks < passMarks) return "F";
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C+";
  if (pct >= 40) return "C";
  return "D";
}

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

export default function MarkEntryContent({ examId }: { examId: string | null }) {
  const { currentBranch } = useBranch();

  const [exam, setExam] = useState<Exam | null>(null);
  const [examsLoading, setExamsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rows, setRows] = useState<MarkRow[]>([]);

  const { data: allStudents, loading: studentsLoading } = useFirestoreCollection<any>("students", currentBranch);

  // Direct document fetch by ID — no query, no index needed
  useEffect(() => {
    if (!examId) {
      setExamsLoading(false);
      return;
    }
    let cancelled = false;
    setExamsLoading(true);
    setFetchError(null);
    getDoc(doc(db, "exams", examId))
      .then((snap) => {
        if (cancelled) return;
        setExam(snap.exists() ? ({ id: snap.id, ...snap.data() } as Exam) : null);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[MarkEntry] getDoc failed:", err);
          setFetchError(err?.message ?? "Unknown error");
          setExam(null);
        }
      })
      .finally(() => { if (!cancelled) setExamsLoading(false); });
    return () => { cancelled = true; };
  }, [examId]);

  // Build student rows when exam + students ready
  useEffect(() => {
    if (!exam || studentsLoading) return;
    const eligible = allStudents.filter(
      (s: any) => s.class === exam.class && s.status === "Active",
    );
    setRows(
      eligible.map((s: any) => ({
        studentId: s.id,
        studentName: s.name,
        rollNo: s.rollNo ?? s.applicationNo ?? "",
        markId: null,
        status: "Present" as const,
        marksObtained: null,
        grade: null,
      })),
    );
  }, [exam, allStudents, studentsLoading]);

  const updateStatus = (studentId: string, present: boolean) => {
    setRows(prev => prev.map(r =>
      r.studentId !== studentId ? r : {
        ...r,
        status: present ? "Present" : "Absent",
        marksObtained: present ? r.marksObtained : null,
        grade: present ? r.grade : null,
      }
    ));
  };

  const updateMarks = (studentId: string, val: string) => {
    if (!exam) return;
    setRows(prev => prev.map(r => {
      if (r.studentId !== studentId) return r;
      if (val === "") return { ...r, marksObtained: null, grade: null };
      const n = Number(val);
      if (n < 0 || n > exam.maxMarks) return r;
      return { ...r, marksObtained: n, grade: calcGrade(n, exam.passMarks, exam.maxMarks) };
    }));
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!exam || !currentBranch) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      rows.forEach(r => {
        const docRef = doc(db, "marks", `${exam.id}_${r.studentId}`);
        batch.set(docRef, {
          examId:        exam.id,
          studentId:     r.studentId,
          studentName:   r.studentName,
          subject:       exam.subject,
          testName:      exam.name,
          date:          exam.date,
          maxMarks:      exam.maxMarks,
          passMarks:     exam.passMarks,
          status:        r.status,
          marksObtained: r.status === "Present" ? (r.marksObtained ?? 0) : 0,
          grade:         r.status === "Present" ? (r.grade ?? null) : null,
          branchId:      currentBranch,
          class:         exam.class,
        });
      });
      await batch.commit();
      toast({ title: "Marks Saved", description: `${exam.name} — ${rows.length} students updated.` });
    } catch (err) {
      console.error("Failed to save marks:", err);
      toast({ title: "Error", description: "Could not save marks.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = rows.filter(r => r.status === "Present").length;
  const absentCount  = rows.filter(r => r.status === "Absent").length;
  const enteredCount = rows.filter(r => r.status === "Present" && r.marksObtained !== null).length;
  const passCount    = rows.filter(r => r.grade && r.grade !== "F").length;

  if (examsLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
        <SharedHeader title="Mark Entry" />
        <main className="p-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </main>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
        <SharedHeader title="Mark Entry" />
        <main className="p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-amber-400 opacity-60" />
          <p className="text-muted-foreground">
            {examId ? "Exam not found. It may have been deleted." : "No exam selected."}
          </p>
          {examId && (
            <p className="text-xs text-muted-foreground font-mono">ID: {examId}</p>
          )}
          {fetchError && (
            <p className="text-xs text-red-500">Error: {fetchError}</p>
          )}
          <Link href="/admin/examination">
            <Button variant="outline">Back to Exam Schedule</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Mark Entry" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/examination" className="hover:text-[#0D7C8F]">Examination</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Mark Entry</span>
        </div>

        {/* Exam info banner */}
        <Card className="border-none shadow-sm bg-[#1E2A4A] text-white">
          <CardContent className="p-5 flex flex-wrap gap-6 items-start">
            <div>
              <p className="text-xs text-blue-200 mb-1">Exam</p>
              <p className="text-lg font-bold">{exam.name}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200 mb-1">Class / Subject</p>
              <p className="font-semibold">Class {exam.class} — {exam.subject}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200 mb-1">Date</p>
              <p className="font-semibold">{exam.date}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200 mb-1">Max / Pass</p>
              <p className="font-semibold">{exam.maxMarks} / {exam.passMarks}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200 mb-1">Board</p>
              <p className="font-semibold">{exam.board}</p>
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Students", value: rows.length,                        color: "text-[#1E2A4A]" },
            { label: "Present",        value: presentCount,                       color: "text-green-600" },
            { label: "Absent",         value: absentCount,                        color: "text-red-500"   },
            { label: "Marks Entered",  value: `${enteredCount}/${presentCount}`,  color: "text-[#0D7C8F]" },
          ].map(card => (
            <Card key={card.label} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Marks table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base">{rows.length} Students</CardTitle>
            {enteredCount > 0 && (
              <span className="text-xs text-muted-foreground">
                Pass: <span className="text-green-600 font-semibold">{passCount}</span> /
                Fail: <span className="text-red-500 font-semibold">{enteredCount - passCount}</span>
              </span>
            )}
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-16">Roll No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="w-32">Attendance</TableHead>
                <TableHead className="w-36">Marks Obtained</TableHead>
                <TableHead className="w-20">Grade</TableHead>
                <TableHead className="w-20">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Loading students...</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No active students found for Class {exam.class}.
                  </TableCell>
                </TableRow>
              ) : rows.map(row => (
                <TableRow key={row.studentId} className={row.status === "Absent" ? "bg-slate-50/50 opacity-60" : "hover:bg-slate-50/50"}>
                  <TableCell className="text-xs text-muted-foreground font-mono">{row.rollNo}</TableCell>
                  <TableCell className="font-medium text-sm text-[#1E2A4A]">{row.studentName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${row.status === "Absent" ? "text-red-500" : "text-muted-foreground"}`}>A</span>
                      <Switch
                        checked={row.status === "Present"}
                        onCheckedChange={checked => updateStatus(row.studentId, checked)}
                      />
                      <span className={`text-xs font-semibold ${row.status === "Present" ? "text-green-600" : "text-muted-foreground"}`}>P</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-24 h-8 text-sm"
                      min={0}
                      max={exam.maxMarks}
                      value={row.marksObtained ?? ""}
                      onChange={e => updateMarks(row.studentId, e.target.value)}
                      disabled={row.status === "Absent"}
                      placeholder="—"
                    />
                  </TableCell>
                  <TableCell>
                    {row.grade ? (
                      <Badge className={`text-xs ${GRADE_COLORS[row.grade] ?? ""}`}>{row.grade}</Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {row.status === "Absent" ? (
                      <Badge variant="outline" className="text-xs text-red-500 border-red-200 bg-red-50">Absent</Badge>
                    ) : row.grade === null ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : row.grade === "F" ? (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">Fail</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">Pass</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="bg-slate-50 border-t px-6 py-3 flex justify-end">
            <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Marks"}
            </Button>
          </div>
        </Card>

      </main>
    </div>
  );
}
