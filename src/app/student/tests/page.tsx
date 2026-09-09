"use client";

import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { queryDocuments } from "@/services/firestoreService";
import { useStudentRecord, normalizeClassName } from "@/hooks/useStudentRecord";
import { useRouter } from 'next/navigation';
import { ArrowRight, Calendar, Clock, FileText } from 'lucide-react';

/** Written by the admin assessment screen into `onlineExams`. */
interface OnlineExam {
  id: string;
  title: string;
  class?: string;
  subject?: string;
  /** "YYYY-MM-DDTHH:mm" from a datetime-local input. */
  dateTime?: string;
  durationMins?: number;
  totalMarks?: number;
  status?: string;
  branchId?: string;
}

interface Attempt {
  id: string;
  examId: string;
  studentId: string;
  score?: number;
}

type TestStatus = 'Upcoming' | 'Active' | 'Completed' | 'Missed';

const MyTestsPage = () => {
    const router = useRouter();
    const { studentId, className, branchId, loading: recordLoading, unlinked } = useStudentRecord();
    const [exams, setExams] = useState<OnlineExam[]>([]);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (recordLoading) return;
        if (unlinked || !studentId) { setLoading(false); return; }

        const load = async () => {
            setLoading(true);
            try {
                const [examRows, attemptRows] = await Promise.all([
                    branchId
                      ? queryDocuments<OnlineExam>("onlineExams", [{ field: "branchId", operator: "==", value: branchId }])
                      : Promise.resolve([]),
                    queryDocuments<Attempt>("testAttempts", [{ field: "studentId", operator: "==", value: studentId }]),
                ]);

                // Drafts are not visible to students, and the class is matched on
                // its normalised form since admins type it either way.
                const visible = (examRows as OnlineExam[]).filter(e =>
                    e.status !== "Draft" &&
                    (!e.class || normalizeClassName(e.class) === className)
                );
                setExams(visible);
                setAttempts(attemptRows as Attempt[]);
            } catch (err) {
                console.error("Failed to load tests:", err);
                setExams([]);
                setAttempts([]);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [studentId, className, branchId, recordLoading, unlinked]);

    const studentExams = useMemo(() => {
        const now = new Date();
        return exams.map(exam => {
            const attempt = attempts.find(a => a.examId === exam.id);
            const start = exam.dateTime ? new Date(exam.dateTime) : null;
            const end = start && exam.durationMins
                ? new Date(start.getTime() + exam.durationMins * 60000)
                : start;

            let status: TestStatus;
            if (attempt && attempt.score != null) status = 'Completed';
            else if (!start || isNaN(start.getTime())) status = 'Upcoming';
            else if (now < start) status = 'Upcoming';
            else if (end && now <= end) status = 'Active';
            else status = 'Missed';

            return { ...exam, status, attempt };
        });
    }, [exams, attempts]);

    const upcomingTests  = studentExams.filter(e => e.status === 'Upcoming' || e.status === 'Active');
    const completedTests = studentExams.filter(e => e.status === 'Completed');
    const missedTests    = studentExams.filter(e => e.status === 'Missed');

    const handleStartTest  = (examId: string) => router.push(`/student/tests/${examId}/take`);
    const handleViewResult = (examId: string) => router.push(`/student/tests/${examId}/result`);

    const TestCard = ({ test }: { test: typeof studentExams[0] }) => {
        const { title, subject, dateTime, durationMins, totalMarks, status, attempt } = test;
        const start = dateTime ? new Date(dateTime) : null;
        const validStart = start && !isNaN(start.getTime()) ? start : null;

        const getStatusBadge = () => {
            switch (status) {
                case 'Active': return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
                case 'Completed': return <Badge className="bg-blue-500 hover:bg-blue-600">Completed</Badge>;
                case 'Missed': return <Badge variant="destructive">Missed</Badge>;
                default: return <Badge variant="secondary">Upcoming</Badge>;
            }
        };

        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-lg mb-1">{title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground gap-4 flex-wrap">
                            {subject && <div className="flex items-center"><FileText className="h-4 w-4 mr-1"/>{subject}</div>}
                            {validStart && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1"/>
                                {validStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                            )}
                            {validStart && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1"/>
                                {validStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                        </div>
                    </div>
                    {getStatusBadge()}
                </CardHeader>
                <CardContent className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex gap-4 text-sm">
                        {durationMins != null && <span>Duration: <strong>{durationMins} mins</strong></span>}
                        {totalMarks != null && <span>Max Marks: <strong>{totalMarks}</strong></span>}
                        {attempt?.score != null && <span>Score: <strong className="text-primary">{attempt.score}{totalMarks != null ? `/${totalMarks}` : ''}</strong></span>}
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

    const busy = loading || recordLoading;

    return (
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
            <div>
                <h1 className="text-2xl font-bold">My Online Tests</h1>
                <p className="text-muted-foreground">Take new tests and review your past performance.</p>
            </div>

            {busy ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
            ) : unlinked ? (
                <Card><CardContent className="pt-6">
                    <p className="text-muted-foreground">
                        Your login is not linked to a student record yet. Please contact your branch office.
                    </p>
                </CardContent></Card>
            ) : (
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
            )}
        </div>
    );
}

export default MyTestsPage;
