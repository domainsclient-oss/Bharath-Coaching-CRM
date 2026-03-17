'use client';

import { useState, useEffect, useReducer, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { examService, testAttemptService } from '../../../../../services/firestoreService'; 
import { useAuth } from '../../../../../lib/auth-context';
import { useBranchData } from '../../../../../context/BranchContext';
import type { Exam } from '../../../../../models/exam';
import type { TestAttempt } from '../../../../../models/testAttempt';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../../../../components/ui/radio-group';
import { Label } from '../../../../../components/ui/label';
import { Checkbox } from '../../../../../components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '../../../../../components/ui/skeleton';

const initialState = {
  answers: {},
  currentQuestionIndex: 0,
  markedForReview: [],
  timeLeft: 0,
};

function testReducer(state: any, action: any) {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'SET_ANSWER':
      return { ...state, answers: { ...state.answers, [action.payload.questionId]: action.payload.answer } };
    case 'NEXT_QUESTION':
      return { ...state, currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, action.payload.totalQuestions - 1) };
    case 'PREV_QUESTION':
      return { ...state, currentQuestionIndex: Math.max(state.currentQuestionIndex - 0, 0) };
    case 'JUMP_TO_QUESTION':
      return { ...state, currentQuestionIndex: action.payload };
    case 'TOGGLE_REVIEW': {
      const newMarked = state.markedForReview.includes(action.payload)
        ? state.markedForReview.filter((id: string) => id !== action.payload)
        : [...state.markedForReview, action.payload];
      return { ...state, markedForReview: newMarked };
    }
    case 'TICK':
      return { ...state, timeLeft: Math.max(state.timeLeft - 1, 0) };
    default:
      return state;
  }
}

// Dummy questions - replace with actual data fetching
const DUMMY_QUESTIONS = [...Array(20)].map((_, i) => ({
  id: `q${i + 1}`,
  text: `This is the text for question ${i + 1}. It might be a long question that spans multiple lines. What is the correct answer?`,
  options: [
    { id: `o1`, text: `Option A for Q${i + 1}` },
    { id: `o2`, text: `Option B for Q${i + 1}` },
    { id: `o3`, text: `Option C for Q${i + 1}` },
    { id: `o4`, text: `Option D for Q${i + 1}` },
  ],
  correctAnswer: 'o2',
}));

export default function TakeTestPage() {
  const [state, dispatch] = useReducer(testReducer, initialState);
  const { answers, currentQuestionIndex, markedForReview, timeLeft } = state;
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { branchId } = useBranchData();
  const examId = params.id as string;
  const studentId = user?.uid;

  const attemptId = examId && studentId ? `${examId}_${studentId}` : null;

  // Load exam and any saved progress
  useEffect(() => {
    const loadInitialData = async () => {
      if (!examId || !studentId || !branchId) return;
      setLoading(true);
      try {
        const examData = await examService.getById(examId);
        if (!examData) throw new Error('Exam not found.');
        setExam(examData as Exam);

        const savedAttempt = await testAttemptService.getById(attemptId!);
        if (savedAttempt) {
          dispatch({ type: 'SET_STATE', payload: { answers: savedAttempt.answers, markedForReview: savedAttempt.markedForReview, timeLeft: savedAttempt.timeLeft } });
        } else {
          dispatch({ type: 'SET_STATE', payload: { timeLeft: (examData.totalMarks || 120) * 60 } }); // Default to 120 minutes if not set
        }
      } catch (error) {
        console.error("Error loading test:", error);
        toast({ title: "Error", description: "Could not load the test.", variant: "destructive" });
        router.push('/student/tests');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [examId, studentId, branchId, router, attemptId]);

  // Autosave progress
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      if (!loading && attemptId && timeLeft > 0) {
        const progress: Omit<TestAttempt, 'id'> = {
          branchId,
          examId,
          studentId: studentId!,
          answers,
          markedForReview,
          timeLeft,
          lastSavedAt: new Date(),
        };
        try {
          await testAttemptService.set(attemptId, progress);
          console.log('Progress saved');
        } catch (error) {
          console.error("Failed to save progress:", error);
          toast({ title: "Warning", description: "Could not save your progress. Check your connection.", variant: "destructive" });
        }
      }
    }, 15000); // Save every 15 seconds

    return () => clearInterval(saveInterval);
  }, [answers, markedForReview, timeLeft, loading, attemptId, branchId, examId, studentId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 && !loading) {
      // handleSubmit(); // Auto-submit when time is up
      return;
    }
    const timer = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading]);


  const handleSubmit = useCallback(async () => {
    if (!window.confirm("Are you sure you want to submit your answers?")) return;
    setIsSubmitting(true);
    // In a real app, you would save the final answers to a 'submissions' collection.
    console.log("Submitting answers:", answers);
    try {
      // Here you would call a service to grade the test and store the final result.
      // For now, we just log it and clean up.
      if (attemptId) {
        await testAttemptService.delete(attemptId);
      }
      toast({ title: "Success", description: "Your test has been submitted." });
      router.push(`/student/results/${examId}`);
    } catch (error) {
      console.error("Submission failed:", error);
      toast({ title: "Error", description: "Failed to submit the test.", variant: "destructive" });
      setIsSubmitting(false);
    }
  }, [answers, router, examId, attemptId]);

  const currentQ = DUMMY_QUESTIONS[currentQuestionIndex];
  const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substr(11, 8);

  if (loading) return <div className="container mx-auto p-4"><Skeleton className="h-[80vh] w-full" /></div>;
  if (!exam) return <div className="container mx-auto p-4"><p>Exam not found.</p></div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{exam.name}</h1>
        <div className="text-xl font-mono bg-navy-700 text-white px-4 py-2 rounded-lg">{formatTime(timeLeft)}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Question {currentQuestionIndex + 1} of {DUMMY_QUESTIONS.length}</h2>
              <p className="mb-6">{currentQ.text}</p>
              <RadioGroup
                value={answers[currentQ.id] || ''}
                onValueChange={(value) => dispatch({ type: 'SET_ANSWER', payload: { questionId: currentQ.id, answer: value } })}
              >
                {currentQ.options.map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={opt.id} id={opt.id} />
                    <Label htmlFor={opt.id}>{opt.text}</Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="mt-6 flex items-center">
                 <Checkbox
                    id="review-checkbox"
                    checked={markedForReview.includes(currentQ.id)}
                    onCheckedChange={() => dispatch({ type: 'TOGGLE_REVIEW', payload: currentQ.id })}
                />
                <Label htmlFor="review-checkbox" className="ml-2">Mark for Review</Label>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between mt-4">
            <Button onClick={() => dispatch({ type: 'PREV_QUESTION' })} disabled={currentQuestionIndex === 0}>Previous</Button>
            <Button onClick={() => dispatch({ type: 'NEXT_QUESTION', payload: { totalQuestions: DUMMY_QUESTIONS.length } })} disabled={currentQuestionIndex === DUMMY_QUESTIONS.length - 1}>Next</Button>
          </div>
        </div>
        <div>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold mb-4">Question Palette</h3>
              <div className="grid grid-cols-5 gap-2">
                {DUMMY_QUESTIONS.map((q, index) => (
                  <Button
                    key={q.id}
                    variant={index === currentQuestionIndex ? 'default' : answers[q.id] ? 'secondary' : 'outline'}
                    size="sm"
                    className={`w-10 h-10 ${markedForReview.includes(q.id) ? 'ring-2 ring-yellow-400' : ''}`}
                    onClick={() => dispatch({ type: 'JUMP_TO_QUESTION', payload: index })}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              <Button className="w-full mt-6" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
