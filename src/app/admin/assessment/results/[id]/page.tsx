
"use client";

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useBranchData } from "@/hooks/use-branch-data";
import { mockOnlineExams, mockExamResults, OnlineExam, ExamResult } from "@/data/assessmentData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const ExamResultsPage = () => {
  const params = useParams();
  const examId = params.id as string;

  const { data: onlineExams } = useBranchData<OnlineExam>(mockOnlineExams);
  const { data: examResults } = useBranchData<ExamResult>(mockExamResults);
  
  const currentExam = useMemo(() => {
    // In a real app, you would fetch a single exam by ID. Here we find it.
    return onlineExams.find(e => e.id === examId);
  }, [onlineExams, examId]);

  const resultsForExam = useMemo(() => {
    return examResults
      .filter(r => r.examId === examId)
      .sort((a, b) => b.score - a.score); // Sort by score descending
  }, [examResults, examId]);

  const markDistribution = useMemo(() => {
    const distribution = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ];
    resultsForExam.forEach(result => {
      const percentage = result.percentage;
      if (percentage <= 20) distribution[0].count++;
      else if (percentage <= 40) distribution[1].count++;
      else if (percentage <= 60) distribution[2].count++;
      else if (percentage <= 80) distribution[3].count++;
      else distribution[4].count++;
    });
    return distribution;
  }, [resultsForExam]);

  const exportToCSV = () => {
    if (!resultsForExam.length) return;
    const headers = ['Rank', 'Student Name', 'Score', 'Total Marks', 'Percentage', 'Grade', 'Correct', 'Wrong', 'Skipped'];
    const csvRows = [headers.join(',')];
    resultsForExam.forEach((result, index) => {
      const row = [
        index + 1,
        `"${result.studentName}"`,
        result.score,
        result.totalMarks,
        result.percentage.toFixed(2),
        result.grade,
        result.correct,
        result.wrong,
        result.skipped,
      ].join(',');
      csvRows.push(row);
    });
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${currentExam?.title}_results.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!currentExam) {
    return <div><p>Exam not found.</p><Link href="/admin/examination">Go Back</Link></div>;
  }

  return (
    <div className="space-y-6">
        <Link href="/admin/examination" className="flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Exam List
        </Link>

        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle>{currentExam.title} - Results</CardTitle>
                    <CardDescription>Class: {currentExam.class} | Subject: {currentExam.subject} | Total Marks: {currentExam.totalMarks}</CardDescription>
                </div>
                <Button onClick={exportToCSV} variant="outline"><Download className="mr-2 h-4 w-4"/> Export CSV</Button>
            </CardHeader>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Mark Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={markDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0D7C8F" name="Number of Students" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Student Results</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Correct</TableHead>
                            <TableHead>Wrong</TableHead>
                            <TableHead>Skipped</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {resultsForExam.map((result, index) => (
                            <TableRow key={result.id} className={index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/50' : ''}>
                                <TableCell className="font-bold">{index + 1}</TableCell>
                                <TableCell>{result.studentName}</TableCell>
                                <TableCell>{result.score} / {result.totalMarks}</TableCell>
                                <TableCell>{result.percentage.toFixed(2)}%</TableCell>
                                <TableCell><Badge>{result.grade}</Badge></TableCell>
                                <TableCell className="text-green-600">{result.correct}</TableCell>
                                <TableCell className="text-red-600">{result.wrong}</TableCell>
                                <TableCell className="text-gray-500">{result.skipped}</TableCell>
                            </TableRow>
                        ))}
                        {resultsForExam.length === 0 && <TableRow><TableCell colSpan={8} className="text-center">No results submitted for this exam yet.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
};

export default ExamResultsPage;
