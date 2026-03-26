
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { mockExams, Exam } from "@/data/examinationData";
import { mockStudents, Student } from "@/data/studentsData";
import { mockMarks, Mark } from "@/data/marksData";
import { useBranchData } from "@/hooks/use-branch-data";
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useBranchId } from '@/hooks/use-branch-id';

interface MarkEntryRow extends Omit<Student, 'status'> {
  markId: string | null;
  marksObtained: number | null;
  status: "Present" | "Absent";
  grade: string | null;
}

const MarkEntryPage = () => {
  const branchId = useBranchId();
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');

  const { data: exams } = useBranchData<Exam>(mockExams);
  const { data: students } = useBranchData<Student>(mockStudents);
  const { data: marks, setData: setMarks } = useBranchData<Mark>(mockMarks);

  const [exam, setExam] = useState<Exam | null>(null);
  const [markEntryRows, setMarkEntryRows] = useState<MarkEntryRow[]>([]);

  // Find the current exam
  useEffect(() => {
    const currentExam = exams.find(e => e.id === examId && e.branchId === branchId);
    setExam(currentExam || null);
  }, [examId, exams, branchId]);

  // Create the rows for the mark entry table
  useEffect(() => {
    if (!exam) return;

    const eligibleStudents = students.filter(s => s.class === exam.class && s.branchId === branchId);
    
    const rows = eligibleStudents.map(student => {
      const existingMark = marks.find(m => m.examId === exam.id && m.studentId === student.id);
      return {
        ...student,
        markId: existingMark?.id || null,
        marksObtained: existingMark?.marksObtained ?? null,
        status: existingMark?.status ?? "Present",
        grade: existingMark?.grade ?? null,
      };
    });

    setMarkEntryRows(rows);

  }, [exam, students, marks, branchId]);
  
  const calculateGrade = (marks: number, passMarks: number, maxMarks: number): string => {
      if (marks < passMarks) return "F";
      const percentage = (marks / maxMarks) * 100;
      if (percentage >= 90) return "A+";
      if (percentage >= 80) return "A";
      if (percentage >= 70) return "B+";
      if (percentage >= 60) return "B";
      if (percentage >= 50) return "C+";
      if (percentage >= 40) return "C";
      return "D";
  };

  const handleMarkChange = (studentId: string, value: string) => {
    const newRows = markEntryRows.map(row => {
        if (row.id === studentId) {
            const marksNum = value === '' ? null : Number(value);
            let grade = row.grade;
            if (exam && marksNum !== null && row.status === 'Present') {
                 if(marksNum > exam.maxMarks) return row; // Do not update if marks are invalid
                 grade = calculateGrade(marksNum, exam.passMarks, exam.maxMarks);
            }
            return { ...row, marksObtained: marksNum, grade };
        }
        return row;
    });
    setMarkEntryRows(newRows);
  };

  const handleStatusChange = (studentId: string, isPresent: boolean) => {
    setMarkEntryRows(markEntryRows.map(row => {
        if (row.id === studentId) {
            const status = isPresent ? "Present" : "Absent";
            const marksObtained = status === 'Absent' ? null : row.marksObtained;
            const grade = status === 'Absent' ? null : row.grade;
            return { ...row, status, marksObtained, grade };
        }
        return row;
    }));
  };

  const handleSave = () => {
      if (!exam) return;
      
      const updatedMarks: Mark[] = markEntryRows.map(row => ({
          id: row.markId || `MRK${Date.now()}${row.id}`,
          examId: exam.id,
          studentId: row.id,
          studentName: row.name,
          marksObtained: row.marksObtained ?? 0,
          status: row.status,
          grade: row.grade,
          branchId: exam.branchId,
          // Required fields from MarksRecord
          subject: exam.subject,
          testName: exam.name,
          date: exam.date,
          maxMarks: exam.maxMarks,
      }));
      
      // This logic merges new/updated marks with existing marks from other exams
      const otherExamsMarks = marks.filter(m => m.examId !== exam.id);
      setMarks([...otherExamsMarks, ...updatedMarks]);
      alert('Marks saved successfully!');
  };

  if (!exam) {
    return (
      <div className="text-center py-10">
        <p>Exam not found or you do not have access to this branch&apos;s exam.</p>
        <Button asChild variant="link"><Link href="/admin/examination">Go Back</Link></Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <Link href="/admin/examination" className="flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Exam Schedule
        </Link>
        <Card>
            <CardHeader>
                <CardTitle>{exam.name}</CardTitle>
                <CardDescription>Class: {exam.class} | Subject: {exam.subject} | Date: {exam.date}</CardDescription>
                <CardDescription>Max Marks: {exam.maxMarks} | Pass Marks: {exam.passMarks}</CardDescription>
            </CardHeader>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Mark Entry</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Roll No</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Attendance</TableHead>
                            <TableHead>Marks Obtained</TableHead>
                            <TableHead>Grade</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {markEntryRows.map(row => (
                            <TableRow key={row.id}>
                                <TableCell>{row.rollNo}</TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                      <Label htmlFor={`status-${row.id}`}>A</Label>
                                      <Switch
                                          id={`status-${row.id}`}
                                          checked={row.status === "Present"}
                                          onCheckedChange={(checked) => handleStatusChange(row.id, checked)}
                                      />
                                      <Label htmlFor={`status-${row.id}`}>P</Label>
                                  </div>
                                </TableCell>
                                <TableCell>
                                    <Input 
                                      type="number" 
                                      className="w-24" 
                                      value={row.marksObtained ?? ''}
                                      onChange={e => handleMarkChange(row.id, e.target.value)}
                                      disabled={row.status === 'Absent'}
                                      max={exam.maxMarks}
                                    />
                                </TableCell>
                                <TableCell>{row.grade}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <div className="mt-6 flex justify-end">
                    <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/> Save Marks</Button>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}

export default MarkEntryPage;
