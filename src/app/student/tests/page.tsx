
"use client";

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockOnlineExams, mockStudentTestAttempts } from "@/data/onlineExamsData";
import { mockStudentProfile } from "@/data/studentPortalData";
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, X, Calendar, Clock, FileText } from 'lucide-react';

const MyTestsPage = () => {
    const router = useRouter();
    const studentId = mockStudentProfile.id;
    const studentClass = mockStudentProfile.class;

    const studentExams = useMemo(() => {
        const now = new Date();
        const examsForClass = mockOnlineExams.filter(exam => exam.assignedToClass === studentClass);

        return examsForClass.map(exam => {
            const attempt = mockStudentTestAttempts.find(a => a.examId === exam.id && a.studentId === studentId);
            const examDateTime = new Date(`${exam.date}T${exam.startTime}`);
            const examEndTime = new Date(examDateTime.getTime() + exam.duration * 60000);
            
            let status: 'Upcoming' | 'Active' | 'Completed' | 'Missed';
            if (attempt) {
                status = attempt.status;
            } else if (now < examDateTime) {
                status = 'Upcoming';
            } else if (now >= examDateTime && now <= examEndTime) {
                status = 'Active';
            } else { // now > examEndTime and no attempt
                status = 'Missed';
            }
            
            return { ...exam, status, attempt };
        });
    }, [studentClass, studentId]);

    const upcomingTests = studentExams.filter(e => e.status === 'Upcoming' || e.status === 'Active');
    const completedTests = studentExams.filter(e => e.status === 'Completed');
    const missedTests = studentExams.filter(e => e.status === 'Missed');
    
    const handleStartTest = (examId: string) => {
        router.push(`/student/tests/${examId}`);
    };

    const handleViewResult = (examId: string) => {
        router.push(`/student/tests/${examId}/result`);
    };

    const TestCard = ({ test }: { test: typeof studentExams[0] }) => {
        const { title, subject, date, startTime, duration, maxMarks, status, attempt } = test;

        const getStatusBadge = () => {
            switch(status) {
                case 'Active': return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
                case 'Completed': return <Badge className="bg-blue-500 hover:bg-blue-600">Completed</Badge>;
                case 'Missed': return <Badge variant="destructive">Missed</Badge>;
                default: return <Badge variant="secondary">Upcoming</Badge>;
            }
        }

        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-lg mb-1">{title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground gap-4">
                            <div className="flex items-center"><FileText className="h-4 w-4 mr-1"/>{subject}</div>
                            <div className="flex items-center"><Calendar className="h-4 w-4 mr-1"/>{new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                            <div className="flex items-center"><Clock className="h-4 w-4 mr-1"/>{startTime}</div>
                        </div>
                    </div>
                    {getStatusBadge()}
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                    <div className="flex gap-4 text-sm">
                        <span>Duration: <strong>{duration} mins</strong></span>
                        <span>Max Marks: <strong>{maxMarks}</strong></span>
                        {attempt?.score !== undefined && <span>Score: <strong className="text-primary">{attempt.score}/{maxMarks}</strong></span>}
                    </div>
                    <div>
                        {status === 'Active' && <Button onClick={() => handleStartTest(test.id)}>Start Test <ArrowRight className="ml-2 h-4 w-4"/></Button>}
                        {status === 'Upcoming' && <Button disabled>Upcoming</Button>}
                        {status === 'Completed' && <Button variant="outline" onClick={() => handleViewResult(test.id)}>View Result</Button>}
                        {status === 'Missed' && <Button variant="secondary" disabled>Not Attempted</Button>}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const NoTestsMessage = ({ message }: { message: string }) => (
        <div className="text-center text-muted-foreground py-12">
            <p>{message}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">My Online Tests</h1>
                <p className="text-muted-foreground">Take new tests and review your past performance.</p>
            </div>

            <Tabs defaultValue="upcoming">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="missed">Missed</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="space-y-4 pt-4">
                    {upcomingTests.length > 0 ? 
                        upcomingTests.map(test => <TestCard key={test.id} test={test} />) : 
                        <NoTestsMessage message="No upcoming tests found."/>}
                </TabsContent>
                <TabsContent value="completed" className="space-y-4 pt-4">
                    {completedTests.length > 0 ? 
                        completedTests.map(test => <TestCard key={test.id} test={test} />) : 
                        <NoTestsMessage message="You haven't completed any tests yet."/>}
                </TabsContent>
                <TabsContent value="missed" className="space-y-4 pt-4">
                    {missedTests.length > 0 ? 
                        missedTests.map(test => <TestCard key={test.id} test={test} />) : 
                        <NoTestsMessage message="You haven't missed any tests."/>}
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default MyTestsPage;
