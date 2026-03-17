
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockStudentProfile } from "@/data/studentPortalData";
import { mockAttendanceData } from "@/data/attendanceData";
import { mockMarksData } from "@/data/marksData";
import { mockOnlineExams, mockStudentTestAttempts } from "@/data/onlineExamsData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Check, X as XIcon, Award, TrendingUp, TrendingDown } from 'lucide-react';

const ProgressPage = () => {
    const studentId = mockStudentProfile.id;

    const attendanceSummary = useMemo(() => {
        const studentRecords = mockAttendanceData.filter(r => r.studentId === studentId);
        const totalDays = studentRecords.length;
        const presentDays = studentRecords.filter(r => r.status === 'Present').length;
        const absentDays = totalDays - presentDays;
        const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        let streak = 0;
        for (let i = studentRecords.length - 1; i >= 0; i--) {
            if (studentRecords[i].status === 'Present') {
                streak++;
            } else {
                break;
            }
        }

        return { totalDays, presentDays, absentDays, percentage, streak };
    }, [studentId]);

    const testPerformance = useMemo(() => {
        const offlineTests = mockMarksData.filter(m => m.studentId === studentId);
        const onlineTests = mockStudentTestAttempts
            .filter(a => a.studentId === studentId && a.status === 'Completed')
            .map(attempt => {
                const exam = mockOnlineExams.find(e => e.id === attempt.examId);
                if (!exam) return null;
                return {
                    subject: exam.subject,
                    testName: exam.title,
                    date: exam.date,
                    marksObtained: attempt.score || 0,
                    maxMarks: exam.maxMarks
                };
            }).filter(item => item !== null);
        
        const allTests = [...offlineTests, ...onlineTests as any];
        allTests.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const subjects = [...new Set(allTests.map(t => t.subject))];
        const subjectAverages = subjects.map(subject => {
            const subjectTests = allTests.filter(t => t.subject === subject);
            const totalPercentage = subjectTests.reduce((acc, test) => acc + (test.marksObtained / test.maxMarks) * 100, 0);
            const average = totalPercentage / subjectTests.length;
            return { subject, average };
        });

        const overallAverage = subjectAverages.reduce((acc, s) => acc + s.average, 0) / subjectAverages.length;

        // Find best and worst subjects
        const sortedSubjects = [...subjectAverages].sort((a,b) => a.average - b.average);
        const bestSubject = sortedSubjects.length > 0 ? sortedSubjects[sortedSubjects.length - 1] : null;
        const worstSubject = sortedSubjects.length > 0 ? sortedSubjects[0] : null;

        return { allTests, subjectAverages, overallAverage, bestSubject, worstSubject };
    }, [studentId]);

    const attendanceChartData = [
        { name: 'Present', value: attendanceSummary.presentDays },
        { name: 'Absent', value: attendanceSummary.absentDays },
    ];
    const ATTENDANCE_COLORS = ['#0D7C8F', '#D9534F'];

    const scoreChartData = testPerformance.subjectAverages;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">My Progress Overview</h1>
                <p className="text-muted-foreground">Track your attendance and test performance throughout the year.</p>
            </div>

            {/* Attendance Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Summary</CardTitle>
                    <CardDescription>Your attendance record across all classes.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                         <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={attendanceChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {attendanceChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 text-center place-content-center">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-3xl font-bold">{attendanceSummary.percentage.toFixed(1)}%</p>
                            <p className="text-sm text-muted-foreground">Overall Attendance</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-3xl font-bold">{attendanceSummary.presentDays}<span className="text-muted-foreground">/{attendanceSummary.totalDays}</span></p>
                            <p className="text-sm text-muted-foreground">Days Attended</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-3xl font-bold">{attendanceSummary.absentDays}</p>
                            <p className="text-sm text-muted-foreground">Days Absent</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-3xl font-bold">{attendanceSummary.streak}</p>
                            <p className="text-sm text-muted-foreground">Current Streak (Days)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Test Performance Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Test Performance</CardTitle>
                    <CardDescription>Your average scores across different subjects.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={scoreChartData}>
                                    <XAxis dataKey="subject" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis unit="%" />
                                    <Tooltip cursor={{fill: 'transparent'}}/>
                                    <Legend />
                                    <Bar dataKey="average" name="Average Score" fill="#1E2A4A" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="md:col-span-1 space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg text-center">
                                <p className="text-3xl font-bold">{testPerformance.overallAverage.toFixed(1)}%</p>
                                <p className="text-sm text-muted-foreground">Overall Average Score</p>
                            </div>
                            {testPerformance.bestSubject && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-start">
                                        <div className="p-2 bg-green-200 rounded-full mr-3"><TrendingUp className="h-5 w-5 text-green-700"/></div>
                                        <div>
                                            <p className="font-bold text-green-800">Best Subject</p>
                                            <p className="text-sm">{testPerformance.bestSubject.subject}: <span className="font-semibold">{testPerformance.bestSubject.average.toFixed(1)}%</span></p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {testPerformance.worstSubject && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start">
                                        <div className="p-2 bg-red-200 rounded-full mr-3"><TrendingDown className="h-5 w-5 text-red-700"/></div>
                                        <div>
                                            <p className="font-bold text-red-800">Needs Improvement</p>
                                            <p className="text-sm">{testPerformance.worstSubject.subject}: <span className="font-semibold">{testPerformance.worstSubject.average.toFixed(1)}%</span></p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}

export default ProgressPage;
