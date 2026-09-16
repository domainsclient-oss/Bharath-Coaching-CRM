"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2, PenLine } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CLASSES, SUBJECTS_BY_CLASS_BAND, classNumberOf, subjectsForClass } from "@/config/academics";
import { db } from "@/config/firebase";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { Exam } from "@/data/examinationData";

// Without a selected exam, entries are scored out of a fixed maximum.
// The reports divide by maxMarks, so it must always be stored.
const DEFAULT_MAX_MARKS  = 100;
const DEFAULT_PASS_MARKS = 40;

interface EntryRow {
  key: string;
  classNumber: string;
  studentId: string;
  date: string;
  subject: string;
  mark: string;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

const ALL_SUBJECTS = Array.from(new Set(Object.values(SUBJECTS_BY_CLASS_BAND).flat()));

function subjectOptions(studentClass?: string, examSubject?: string): string[] {
  const list = subjectsForClass(studentClass);
  const options = (list.length ? [...list] : ALL_SUBJECTS).filter(s => s !== "All Subjects");
  return examSubject && !options.includes(examSubject) ? [examSubject, ...options] : options;
}

let rowSeq = 0;
const newRow = (date: string, subject = "", classNumber = ""): EntryRow => ({
  key: `row-${++rowSeq}`, classNumber, studentId: "", date, subject, mark: "",
});

export default function ManualMarkEntry({
  exam = null,
  students,
  studentsLoading,
  branchId,
}: {
  exam?: Exam | null;
  students: any[];
  studentsLoading: boolean;
  branchId: string | null | undefined;
}) {
  const maxMarks  = exam?.maxMarks  ?? DEFAULT_MAX_MARKS;
  const passMarks = exam?.passMarks ?? DEFAULT_PASS_MARKS;
  // An exam belongs to one class, so its rows are locked to that class.
  const examClass = exam ? classNumberOf(exam.class) : "";
  const classOptions = examClass && !CLASSES.includes(examClass) ? [examClass, ...CLASSES] : CLASSES;
  // New rows start with the selected exam's date and subject; both stay editable.
  // Otherwise they carry over the previous row's class.
  const blankRow = (date?: string, classNumber?: string) =>
    newRow(date || exam?.date || todayKey(), exam?.subject ?? "", examClass || classNumber);

  const [rows, setRows] = useState<EntryRow[]>(() => [blankRow()]);
  const [saving, setSaving] = useState(false);

  const studentsByClass = useMemo(() => {
    const byClass = new Map<string, any[]>();
    students
      .filter((s: any) => s.status === "Active")
      .sort((a: any, b: any) => String(a.name ?? "").localeCompare(String(b.name ?? "")))
      .forEach((s: any) => {
        const cls = classNumberOf(s.class);
        byClass.set(cls, [...(byClass.get(cls) ?? []), s]);
      });
    return byClass;
  }, [students]);
  const studentById = useMemo(
    () => new Map(students.map((s: any) => [s.id, s])),
    [students],
  );

  const updateRow = (key: string, patch: Partial<EntryRow>) =>
    setRows(prev => prev.map(r => (r.key === key ? { ...r, ...patch } : r)));

  // Changing the class drops a student or subject that doesn't belong to it.
  const changeClass = (key: string, classNumber: string) =>
    setRows(prev => prev.map(r => {
      if (r.key !== key) return r;
      const keepStudent = classNumberOf(studentById.get(r.studentId)?.class) === classNumber;
      const keepSubject = subjectOptions(classNumber, exam?.subject).includes(r.subject);
      return {
        ...r,
        classNumber,
        studentId: keepStudent ? r.studentId : "",
        subject:   keepSubject ? r.subject : "",
      };
    }));

  const changeMark = (key: string, val: string) => {
    if (val !== "") {
      const n = Number(val);
      if (Number.isNaN(n) || n < 0 || n > maxMarks) return;
    }
    updateRow(key, { mark: val });
  };

  const addRow = () =>
    setRows(prev => {
      const last = prev[prev.length - 1];
      return [...prev, blankRow(last?.date, last?.classNumber)];
    });

  const removeRow = (key: string) =>
    setRows(prev => (prev.length === 1 ? [blankRow(prev[0].date, prev[0].classNumber)] : prev.filter(r => r.key !== key)));

  const handleSave = async () => {
    if (!branchId) return;
    const filled = rows.filter(r => r.studentId || r.subject || r.mark !== "");
    if (filled.length === 0) {
      toast({ title: "Nothing to save", description: "Enter at least one student's mark.", variant: "destructive" });
      return;
    }
    const incomplete = filled.findIndex(r => !r.classNumber || !r.studentId || !r.date || !r.subject || r.mark === "");
    if (incomplete !== -1) {
      toast({
        title: "Incomplete entry",
        description: `Row ${rows.indexOf(filled[incomplete]) + 1}: fill in Class, Student Name, Date, Subject and Mark.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);
      // One record per student + date + subject (per exam when one is selected):
      // re-saving updates it instead of duplicating. A mark for the exam's own
      // subject shares the exam table's record ID so the two never diverge.
      const ids = new Set<string>();
      filled.forEach(r => {
        const student = studentById.get(r.studentId);
        const marks = Number(r.mark);
        const id = (exam && r.subject === exam.subject
          ? `${exam.id}_${r.studentId}`
          : `manual_${exam ? `${exam.id}_` : ""}${r.studentId}_${r.date}_${r.subject}`
        ).replace(/\//g, "-");
        ids.add(id);
        batch.set(doc(db, "marks", id), {
          examId:        exam?.id ?? null,
          source:        "manual",
          studentId:     r.studentId,
          studentName:   student?.name ?? "",
          subject:       r.subject,
          testName:      exam?.name ?? "Manual Entry",
          date:          r.date,
          maxMarks,
          passMarks,
          status:        "Present",
          marksObtained: marks,
          grade:         calcGrade(marks, passMarks, maxMarks),
          branchId,
          class:         exam?.class ?? student?.class ?? r.classNumber,
          createdAt:     serverTimestamp(),
        });
      });
      await batch.commit();
      toast({ title: "Marks Saved", description: `${ids.size} mark ${ids.size === 1 ? "entry" : "entries"} saved.` });
      const last = filled[filled.length - 1];
      setRows([blankRow(last.date, last.classNumber)]);
    } catch (err) {
      console.error("Failed to save manual marks:", err);
      toast({ title: "Error", description: "Could not save marks.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50 border-b py-3 px-6 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <PenLine className="h-4 w-4" /> Enter Student Marks
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {exam ? `${exam.name} · ` : ""}Marks out of {maxMarks}
        </span>
      </CardHeader>
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-36">Class</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead className="w-44">Date</TableHead>
            <TableHead className="w-48">Subject</TableHead>
            <TableHead className="w-32">Mark</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => {
            const classStudents = studentsByClass.get(row.classNumber) ?? [];
            return (
              <TableRow key={row.key} className="hover:bg-slate-50/50">
                <TableCell>
                  <Select value={row.classNumber} onValueChange={v => changeClass(row.key, v)} disabled={!!examClass}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.map(c => (
                        <SelectItem key={c} value={c}>Class {c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={row.studentId}
                    onValueChange={v => updateRow(row.key, { studentId: v })}
                    disabled={studentsLoading || !row.classNumber}
                  >
                    <SelectTrigger className="h-8 text-sm min-w-[12rem]">
                      <SelectValue placeholder={
                        studentsLoading ? "Loading students..." : row.classNumber ? "Select student" : "Select class first"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {classStudents.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No active students in Class {row.classNumber}
                        </div>
                      ) : classStudents.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    className="h-8 text-sm"
                    value={row.date}
                    max={todayKey()}
                    onChange={e => updateRow(row.key, { date: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Select value={row.subject} onValueChange={v => updateRow(row.key, { subject: v })} disabled={!row.classNumber}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={row.classNumber ? "Select subject" : "Select class first"} />
                    </SelectTrigger>
                    {/* Fit the list to the space on screen so it scrolls instead of running off the page. */}
                    <SelectContent className="max-h-[min(24rem,var(--radix-select-content-available-height))]">
                      {subjectOptions(row.classNumber, exam?.subject).map(sub => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="w-24 h-8 text-sm"
                    min={0}
                    max={maxMarks}
                    value={row.mark}
                    onChange={e => changeMark(row.key, e.target.value)}
                    placeholder="—"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    onClick={() => removeRow(row.key)}
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="bg-slate-50 border-t px-6 py-3 flex justify-between gap-2">
        <Button variant="outline" className="gap-2" onClick={addRow}>
          <Plus className="h-4 w-4" /> Add Row
        </Button>
        <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={handleSave} disabled={saving || !branchId}>
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Marks"}
        </Button>
      </div>
    </Card>
  );
}
