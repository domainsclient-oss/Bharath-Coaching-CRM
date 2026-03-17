'use client';

import { useState, useEffect } from 'react';
import { examService } from '../../../services/firestoreService';
import { useBranchData } from '../../../context/BranchContext';
import type { Exam } from '../../../models/exam';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { branchId } = useBranchData();

  useEffect(() => {
    if (!branchId) return;
    const fetchExams = async () => {
      try {
        setLoading(true);
        setError(null);
        const examList = await examService.query([{ field: 'branchId', operator: '==', value: branchId }], { field: 'date', direction: 'desc' });
        setExams(examList as Exam[]);
      } catch (err) {
        console.error("Failed to load exams:", err);
        setError("Failed to load exam data.");
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [branchId]);

  const handleAddExam = async () => {
    // In a real app, you'd use a form/modal here.
    const newExamData: Omit<Exam, 'id'> = {
      branchId,
      name: `New Exam ${new Date().toLocaleDateString()}`,
      date: new Date(),
      totalMarks: 100,
    };
    try {
      const newExam = await examService.add(newExamData);
      setExams(prev => [newExam as Exam, ...prev]);
      toast({ title: "Success", description: "Exam created." });
    } catch (err) {
      toast({ title: "Error", description: "Could not create exam." });
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm("Delete this exam? This may affect existing mark records.")) return;
    try {
      await examService.delete(id);
      setExams(prev => prev.filter(e => e.id !== id));
      toast({ title: "Success", description: "Exam deleted." });
    } catch (err) {
      toast({ title: "Error", description: "Could not delete exam." });
    }
  };

  const formatDate = (date: any) => new Date(date.seconds * 1000).toLocaleDateString();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Exam Management</h1>
        <Button onClick={handleAddExam}><PlusCircle className="mr-2 h-4 w-4" /> Create Exam</Button>
      </div>
      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
      <Card>
        <CardHeader><CardTitle>Scheduled Exams</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : (
                exams.map(exam => (
                  <TableRow key={exam.id}>
                    <TableCell>{exam.name}</TableCell>
                    <TableCell>{formatDate(exam.date)}</TableCell>
                    <TableCell>{exam.totalMarks}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteExam(exam.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!loading && exams.length === 0 && <p className="text-center p-4">No exams scheduled.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
