
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useBranchData } from "@/hooks/use-branch-data";
import { useBranchId } from '@/hooks/use-branch-id';
import { mockQuestions, Question, OnlineExam } from "@/data/assessmentData";
import { mockStudents, Student } from '@/data/studentsData';
import { Save, ListChecks, ChevronRight, ChevronLeft } from 'lucide-react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  class: z.string().min(1, "Class is required"),
  subject: z.string().min(1, "Subject is required"),
  dateTime: z.string().min(1, "Date & Time are required"),
  durationMins: z.coerce.number().min(5, "Duration must be at least 5 minutes"),
  instructions: z.string().optional(),
  questionIds: z.array(z.string()).min(1, "At least one question must be selected"),
  assignedToClass: z.string(),
  status: z.enum(["Draft", "Published"]),
});

const CreateOnlineExamPage = () => {
  const branchId = useBranchId();
  const router = useRouter();
  const { data: questions } = useBranchData<Question>(mockQuestions);
  const { data: students } = useBranchData<Student>(mockStudents);
  // This would be a real API call in a real app
  const [onlineExams, setOnlineExams] = useState<OnlineExam[]>([]);

  const [step, setStep] = useState(1);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<z.infer<typeof examSchema>>({
    resolver: zodResolver(examSchema),
    defaultValues: { status: 'Draft', assignedToClass: '' }
  });
  
  const examClass = useWatch({ control, name: 'class' });

  const availableQuestions = useMemo(() => {
      return examClass ? questions.filter(q => q.class === examClass && q.branchId === branchId) : [];
  }, [questions, examClass, branchId]);

  const totalMarks = useMemo(() => {
    return selectedQuestions.reduce((acc, q) => acc + q.marks, 0);
  }, [selectedQuestions]);

  const toggleQuestion = (question: Question) => {
    const isSelected = selectedQuestions.some(q => q.id === question.id);
    let newSelected: Question[];
    if (isSelected) {
      newSelected = selectedQuestions.filter(q => q.id !== question.id);
    } else {
      newSelected = [...selectedQuestions, question];
    }
    setSelectedQuestions(newSelected);
    setValue('questionIds', newSelected.map(q => q.id), { shouldValidate: true });
  };

  const onSubmit = (data: z.infer<typeof examSchema>) => {
      const newExam: OnlineExam = {
        id: `OEX${Date.now()}`,
        teacherId: 'TCHR001', // placeholder
        totalMarks: totalMarks,
        ...data,
        branchId,
      };
      setOnlineExams(prev => [...prev, newExam]);
      alert(`Exam "${newExam.title}" created as ${newExam.status}!`);
      router.push('/admin/assessment/results/REPLACE_WITH_NEW_ID'); // Redirect needs real ID
  };
  
  const studentsInClass = useMemo(() => {
      return examClass ? students.filter(s => s.class === examClass && s.branchId === branchId).length : 0;
  }, [students, examClass, branchId]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Create New Online Exam</CardTitle>
                <CardDescription>Step {step} of 2: {step === 1 ? 'Exam Details' : 'Select Questions'}</CardDescription>
            </CardHeader>
        </Card>

        {step === 1 && (
          <Card>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Exam Title" {...register('title')} />
                  <Input placeholder="Class" {...register('class')} />
                  <Input placeholder="Subject" {...register('subject')} />
                  <Input type="datetime-local" {...register('dateTime')} />
                  <Input type="number" placeholder="Duration (in minutes)" {...register('durationMins')} />
                   <Controller name="assignedToClass" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!examClass}>
                            <SelectTrigger><SelectValue placeholder={examClass ? `Assign to Class ${examClass} (${studentsInClass} students)` : 'Assign to...'} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={examClass || ''}>Entire Class ({studentsInClass} students)</SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                  <Textarea placeholder="Instructions for students..." {...register('instructions')} className="md:col-span-2" />
              </CardContent>
               <CardContent className="flex justify-end">
                  <Button type="button" onClick={() => setStep(2)} disabled={!examClass}><ListChecks className="mr-2 h-4 w-4"/> Select Questions</Button>
               </CardContent>
          </Card>
        )}

        {step === 2 && (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                         <CardTitle>Select Questions for "{useWatch({control, name: 'title'})}" </CardTitle>
                         <CardDescription>Selected: {selectedQuestions.length} | Total Marks: {totalMarks}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead className="w-2/5">Question</TableHead><TableHead>Type</TableHead><TableHead>Marks</TableHead><TableHead>Difficulty</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {availableQuestions.map(q => (
                                <TableRow key={q.id}>
                                    <TableCell><Checkbox checked={selectedQuestions.some(sq => sq.id === q.id)} onCheckedChange={() => toggleQuestion(q)} /></TableCell>
                                    <TableCell>{q.question}</TableCell>
                                    <TableCell>{q.type}</TableCell>
                                    <TableCell>{q.marks}</TableCell>
                                    <TableCell>{q.difficulty}</TableCell>
                                </TableRow>
                            ))}
                            {availableQuestions.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No questions found for Class {examClass} in this branch. Add questions in the Question Bank.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                    {errors.questionIds && <p className="text-red-500 text-sm mt-4">{errors.questionIds.message}</p>}
                </CardContent>
                 <CardContent className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}><ChevronLeft className="mr-2 h-4 w-4"/> Back to Details</Button>
                    <div>
                        <Button type="submit" variant="secondary" className="mr-2" onClick={() => setValue('status', 'Draft')} disabled={selectedQuestions.length === 0}>Save as Draft</Button>
                        <Button type="submit" onClick={() => setValue('status', 'Published')} disabled={selectedQuestions.length === 0}><Save className="mr-2 h-4 w-4"/> Publish Exam</Button>
                    </div>
               </CardContent>
            </Card>
        )}
    </form>
  )
}

export default CreateOnlineExamPage;
