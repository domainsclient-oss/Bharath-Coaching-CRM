"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useBranchData } from "@/hooks/use-branch-data";
import { useBranchId } from '@/hooks/use-branch-id';
import { mockQuestions, Question } from "@/data/assessmentData";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const questionSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  class: z.string().min(1, "Class is required"),
  type: z.enum(["MCQ", "Short Answer", "True/False"]),
  question: z.string().min(1, "Question text is required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  marks: z.coerce.number().min(1, "Marks must be at least 1"),
  difficulty: z.enum(["Easy", "Medium", "Hard"])
}).refine(data => {
    if (data.type === 'MCQ') {
        return data.options && data.options.length === 4 && data.options.every(opt => opt.length > 0);
    }
    return true;
}, { message: "MCQ must have 4 non-empty options", path: ["options"] });

const QuestionBankPage = () => {
  const branchId = useBranchId();
  const { data: questions, setData: setQuestions } = useBranchData<Question>(mockQuestions);
  const [filters, setFilters] = useState({ subject: '', type: 'all', difficulty: 'all' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const { register, handleSubmit, control, reset, formState: { errors }, setValue } = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: { type: 'MCQ', difficulty: 'Medium', marks: 1, options: ['','','',''] }
  });

  const questionType = useWatch({ control, name: 'type' });

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => 
      (filters.subject ? q.subject.toLowerCase().includes(filters.subject.toLowerCase()) : true) &&
      (filters.type !== 'all' ? q.type === filters.type : true) &&
      (filters.difficulty !== 'all' ? q.difficulty === filters.difficulty : true)
    );
  }, [questions, filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const openModal = (question: Question | null = null) => {
    setEditingQuestion(question);
    if (question) {
        const questionOptions = question.options || ['','','',''];
        reset({ ...question, options: questionOptions } as any);
    } else {
        reset({ type: 'MCQ', difficulty: 'Medium', marks: 1, options: ['','','',''], subject: '', class: '', question: '', correctAnswer: '' });
    }
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
    reset();
  }

  const onSubmit = (data: z.infer<typeof questionSchema>) => {
    const questionData = { ...data, branchId };
    if (editingQuestion) {
      setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...questionData, id: editingQuestion.id } : q));
    } else {
      const newQuestion = { ...questionData, id: `QST${Date.now()}` };
      setQuestions(prev => [...prev, newQuestion]);
    }
    closeModal();
  };
  
  const deleteQuestion = (id: string) => {
      if(confirm('Are you sure you want to delete this question?')) {
          setQuestions(prev => prev.filter(q => q.id !== id))
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Question Bank</h1>
         <Dialog open={isModalOpen} onOpenChange={v => { if(!v) closeModal(); else setIsModalOpen(v); }}>
            <DialogTrigger asChild>
                <Button onClick={() => openModal()}><PlusCircle className="mr-2 h-4 w-4"/> Add Question</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader><DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <Input placeholder="Subject" {...register("subject")} />
                       <Input placeholder="Class (e.g., 10, 12)" {...register("class")} />
                       <Controller name="type" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue placeholder="Question Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MCQ">MCQ</SelectItem>
                                    <SelectItem value="Short Answer">Short Answer</SelectItem>
                                    <SelectItem value="True/False">True/False</SelectItem>
                                </SelectContent>
                            </Select>
                        )} />
                    </div>
                    {errors.subject && <p className="text-red-500 text-xs">{errors.subject.message}</p>}
                    {errors.class && <p className="text-red-500 text-xs">{errors.class.message}</p>}
                    
                    <Textarea placeholder="Enter the question text..." {...register("question")} />
                    {errors.question && <p className="text-red-500 text-xs">{errors.question.message}</p>}

                    {questionType === 'MCQ' && (
                        <div className="space-y-2 p-4 border rounded-md">
                            <Label>Options</Label>
                            <div className="grid grid-cols-2 gap-4">
                                {[0, 1, 2, 3].map(i => <Input key={i} placeholder={`Option ${i + 1}`} {...register(`options.${i}`)} />)}
                            </div>
                           <Controller name="correctAnswer" control={control} render={({ field }) => (
                               <Select onValueChange={field.onChange} defaultValue={field.value}>
                                   <SelectTrigger className="mt-2"><SelectValue placeholder="Select Correct Answer" /></SelectTrigger>
                                   <SelectContent>{[0,1,2,3].map(i => <SelectItem key={i} value={String(i)}>Option {i+1}</SelectItem>)}</SelectContent>
                               </Select>
                           )} />
                           {errors.options && <p className="text-red-500 text-xs">{errors.options.message}</p>}
                        </div>
                    )}
                    {questionType === 'True/False' && (
                        <Controller name="correctAnswer" control={control} render={({ field }) => (
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                               <SelectTrigger><SelectValue placeholder="Select Correct Answer" /></SelectTrigger>
                               <SelectContent><SelectItem value="True">True</SelectItem><SelectItem value="False">False</SelectItem></SelectContent>
                           </Select>
                       )} />
                    )}
                    {questionType === 'Short Answer' && (
                        <Textarea placeholder="Enter the ideal correct answer..." {...register("correctAnswer")} />
                    )}
                    {errors.correctAnswer && <p className="text-red-500 text-xs">{errors.correctAnswer.message}</p>}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="number" placeholder="Marks" {...register("marks")} />
                        <Controller name="difficulty" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Easy">Easy</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        )} />
                    </div>
                    {errors.marks && <p className="text-red-500 text-xs">{errors.marks.message}</p>}

                   <DialogFooter>
                     <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                     <Button type="submit">{editingQuestion ? 'Save Changes' : 'Add Question'}</Button>
                   </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Input placeholder="Filter by Subject..." value={filters.subject} onChange={e => handleFilterChange('subject', e.target.value)} />
                <Select value={filters.type} onValueChange={v => handleFilterChange('type', v)}>
                  <SelectTrigger><SelectValue placeholder="Filter by Type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="MCQ">MCQ</SelectItem>
                    <SelectItem value="Short Answer">Short Answer</SelectItem>
                    <SelectItem value="True/False">True/False</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.difficulty} onValueChange={v => handleFilterChange('difficulty', v)}>
                  <SelectTrigger><SelectValue placeholder="Filter by Difficulty..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Questions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead className="w-2/5">Question</TableHead><TableHead>Subject</TableHead><TableHead>Class</TableHead><TableHead>Type</TableHead><TableHead>Marks</TableHead><TableHead>Difficulty</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredQuestions.map(q => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium truncate max-w-sm">{q.question}</TableCell>
                  <TableCell>{q.subject}</TableCell>
                  <TableCell>{q.class}</TableCell>
                  <TableCell><Badge variant="secondary">{q.type}</Badge></TableCell>
                  <TableCell>{q.marks}</TableCell>
                  <TableCell><Badge variant={q.difficulty === 'Easy' ? 'default' : q.difficulty === 'Medium' ? 'outline' : 'destructive'}>{q.difficulty}</Badge></TableCell>
                  <TableCell className="space-x-1 whitespace-nowrap">
                    <Button variant="outline" size="icon" onClick={() => openModal(q)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => deleteQuestion(q.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredQuestions.length === 0 && <TableRow><TableCell colSpan={7} className="text-center">No questions found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionBankPage;