
'use client';

import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Printer } from 'lucide-react';
import centerConfig from '../../../../config/centerConfig';

// Mock data - replace with actual data fetching
const mockExams = [
    { id: 'exam01', name: 'Midterm Exam - Grade 10' },
    { id: 'exam02', name: 'Final Exam - Grade 12' },
];

const mockStudents = [
    { id: 'stud01', name: 'Arun Kumar' },
    { id: 'stud02', name: 'Bhavani S' },
];

const mockMarksheet = {
    examName: 'Midterm Exam - Grade 10',
    studentName: 'Arun Kumar',
    totalMarks: 450,
    maxMarks: 500,
    percentage: 90,
    grade: 'A+',
    subjects: [
        { name: 'Tamil', marks: 95, max: 100 },
        { name: 'English', marks: 88, max: 100 },
        { name: 'Mathematics', marks: 92, max: 100 },
        { name: 'Science', marks: 85, max: 100 },
        { name: 'Social Science', marks: 90, max: 100 },
    ],
};

export default function MarksheetPage() {
    const [selectedExam, setSelectedExam] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [marksheet, setMarksheet] = useState<typeof mockMarksheet | null>(null);

    const handleGenerate = () => {
        if (selectedExam && selectedStudent) {
            // In a real app, fetch marksheet data from the server
            setMarksheet(mockMarksheet);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Student Marksheet</h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Select Criteria</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <Select onValueChange={setSelectedExam}>
                        <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
                        <SelectContent>
                            {mockExams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setSelectedStudent}>
                        <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                        <SelectContent>
                            {mockStudents.map(stud => <SelectItem key={stud.id} value={stud.id}>{stud.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleGenerate}>Generate Marksheet</Button>
                </CardContent>
            </Card>

            {marksheet && (
                <Card id="marksheet-print">
                    <CardHeader className="text-center border-b pb-6">
                         <div className="flex items-center justify-center mb-4">
                            <img src={centerConfig.logo} alt="Logo" className="h-16 w-16 mr-4" />
                            <div>
                                <h1 className="text-3xl font-bold">{centerConfig.centerName}</h1>
                                <p className="text-sm text-gray-500">Academic Marksheet</p>
                            </div>
                        </div>
                        <div className="text-left mt-6 flex justify-between">
                            <p><span className="font-semibold">Student Name:</span> {marksheet.studentName}</p>
                            <p><span className="font-semibold">Exam:</span> {marksheet.examName}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead className="text-right">Marks Obtained</TableHead>
                                    <TableHead className="text-right">Maximum Marks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {marksheet.subjects.map(subject => (
                                    <TableRow key={subject.name}>
                                        <TableCell>{subject.name}</TableCell>
                                        <TableCell className="text-right">{subject.marks}</TableCell>
                                        <TableCell className="text-right">{subject.max}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex justify-end mt-6 pr-6">
                            <div className="text-right w-64">
                                <p className="font-semibold border-t pt-2">Total Marks: <span className="font-normal">{marksheet.totalMarks} / {marksheet.maxMarks}</span></p>
                                <p className="font-semibold">Percentage: <span className="font-normal">{marksheet.percentage.toFixed(2)}%</span></p>
                                <p className="font-bold text-lg border-t mt-2 pt-2">Grade: <span className="text-green-600">{marksheet.grade}</span></p>
                            </div>
                        </div>
                         <div className="mt-8 text-center text-xs text-gray-500">
                            <p>{centerConfig.address}</p>
                            <p>Contact: {centerConfig.phone} | {centerConfig.email}</p>
                        </div>
                    </CardContent>
                    <div className="p-6 border-t flex justify-end print-hide">
                        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/> Print</Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
