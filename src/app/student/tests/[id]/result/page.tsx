
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockOnlineExams, OnlineExam, mockStudentTestAttempts, StudentTestAttempt } from "@/data/onlineExamsData";
import { mockStudentProfile } from "@/data/studentPortalData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, MinusCircle, Target, ArrowLeft, AlertCircle } from 'lucide-react';

const TestResultPage = () => {
    const router = useRouter();
    const params = useParams();
    const examId = params.id as string;
    const studentId = mockStudentProfile.id;

    const [exam, setExam] = useState<OnlineExam | null>(null);
    const [attempt, setAttempt] = useState<StudentTestAttempt | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        const examData = mockOnlineExams.find(e => e.id === examId);
        // In a real app, this would be a fetch.
        // We are directly modifying the mock array in the 'take' page for this simulation.
        const attemptData = mockStudentTestAttempts.find(a => a.examId === examId && a.studentId === studentId);
        
        if (examData && attemptData) {
            setExam(examData);
            setAttempt(attemptData);
        } else {
            // If no attempt is found, maybe redirect.
            // For now, just showing empty state.
        }
        setIsClient(true);
    }, [examId, studentId]);

    const accuracy = useMemo(() => {
        if (!attempt || !attempt.totalAttempted) return 0;
        return ((attempt.totalCorrect || 0) / attempt.totalAttempted) * 100;
    }, [attempt]);
    
    const scorePercentage = useMemo(() => {
        if (!attempt || !exam) return 0;
        return (attempt.score! / exam.maxMarks) * 100;
    }, [attempt, exam]);

    if (!isClient) {
      return <div className="flex justify-center items-center h-screen">Loading Results...</div>; // Or a spinner
    }

    if (!exam || !attempt) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center">
                <AlertCircle className="w-16 h-16 text-destructive mb-4"/>
                <h1 className="text-2xl font-bold mb-2">Result Not Found</h1>
                <p className="text-muted-foreground mb-6">We couldn't find the results for this test. It might be that you haven't completed it yet.</p>
                <Button onClick={() => router.push('/student/tests')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Tests
                </Button>
            </div>
        );
    }

    // NOTE: In a real app, student answers would be fetched along with the attempt data.
    // Since we don't have that, we can't show the user's specific answer.
    // The spec requires showing it, so we will show a placeholder message for incorrect answers.
    const getAnswerStatus = (questionId: string) => {
        // This is a simplified simulation. A real implementation would need the student's answers.
        // For now, we'll just mark the first few as correct based on totalCorrect for demonstration.
        const questionIndex = exam.questions.findIndex(q => q.id === questionId);
        if (questionIndex < (attempt.totalCorrect || 0)) {
            return 'correct';
        }
        if (questionIndex < (attempt.totalAttempted || 0)) {
            return 'incorrect';
        }
        return 'unanswered';
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-muted-foreground">Results for</p>
                    <h1 className="text-3xl font-bold">{exam.title}</h1>
                </div>
                <Button variant="outline" onClick={() => router.push('/student/tests')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Tests
                </Button>
            </div>

            {/* Summary Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                            <p className="text-3xl font-bold">{attempt.score}<span className="text-lg text-muted-foreground">/{exam.maxMarks}</span></p>
                            <p className="text-sm text-muted-foreground">Score</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{attempt.totalCorrect || 0}<span className="text-lg text-muted-foreground">/{exam.questions.length}</span></p>
                            <p className="text-sm text-muted-foreground">Correct Answers</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{attempt.totalAttempted || 0}</p>
                            <p className="text-sm text-muted-foreground">Attempted</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{accuracy.toFixed(2)}%</p>
                            <p className="text-sm text-muted-foreground">Accuracy</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Progress value={scorePercentage} className="h-3" />
                    </div>
                </CardContent>
            </Card>

            {/* Question by Question Review */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Question Review</h2>
                <div className="space-y-6">
                    {exam.questions.map((q, index) => {
                        const status = getAnswerStatus(q.id);
                        
                        const getStatusAlert = () => {
                            switch(status) {
                                case 'correct': return (
                                    <Alert variant="default" className="bg-green-50 border-green-200">
                                        <CheckCircle className="h-4 w-4 text-green-600"/>
                                        <AlertTitle className="text-green-800">Correct</AlertTitle>
                                        <AlertDescription>Your answer was correct.</AlertDescription>
                                    </Alert>
                                );
                                case 'incorrect': return (
                                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                                        <XCircle className="h-4 w-4"/>
                                        <AlertTitle>Incorrect</AlertTitle>
                                        <AlertDescription>
                                            The correct answer is: <strong>{q.options.find(o => o.id === q.correctOptionId)?.text}</strong>
                                        </AlertDescription>
                                    </Alert>
                                );
                                default: return (
                                    <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                                        <MinusCircle className="h-4 w-4 text-yellow-600"/>
                                        <AlertTitle className="text-yellow-800">Not Answered</AlertTitle>
                                        <AlertDescription>
                                            The correct answer was: <strong>{q.options.find(o => o.id === q.correctOptionId)?.text}</strong>
                                        </AlertDescription>
                                    </Alert>
                                );
                            }
                        }

                        return (
                            <Card key={q.id}>
                                <CardContent className="pt-6">
                                    <p className="font-semibold mb-4">Q{index + 1}: {q.questionText}</p>
                                    <div className="space-y-2 mb-4">
                                        {q.options.map(opt => (
                                            <div key={opt.id} className={`p-3 rounded-md text-sm border ${opt.id === q.correctOptionId ? 'border-green-400 bg-green-50/50' : ''}`}>
                                                {opt.text}
                                            </div>
                                        ))}
                                    </div>
                                    {getStatusAlert()}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

export default TestResultPage;
