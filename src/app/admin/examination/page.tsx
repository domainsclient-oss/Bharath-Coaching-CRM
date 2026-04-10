"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useBranchData } from "@/hooks/use-branch-data";
import { mockExams, Exam } from "@/data/examinationData";
import { PlusCircle, Edit, Trash2, BookOpen } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBranchId } from '@/hooks/use-branch-id';

const examSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  class: z.string().min(1, "Class is required"),
  board: z.string().min(1, "Board is required"),
  subject: z.string().min(1, "Subject is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  maxMarks: z.coerce.number().min(1, "Max marks must be at least 1"),
  passMarks: z.coerce.number().min(1, "Pass marks must be at least 1"),
  examiner: z.string().optional(),
  status: z.enum(["Scheduled", "Completed"])
});

const ExamSchedulePage = () => {
  const branchId = useBranchId();
  const { data: exams, setData: setExams } = useBranchData<Exam>(mockExams);
  const [filters, setFilters] = useState({ class: '', subject: '', date: '', status: 'all' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof examSchema>>({
    resolver: zodResolver(examSchema),
    defaultValues: { status: "Scheduled" }
  });

  const filteredExams = useMemo(() => {
    return exams.filter(exam => 
      (filters.class ? exam.class === filters.class : true) &&
      (filters.subject ? exam.subject.toLowerCase().includes(filters.subject.toLowerCase()) : true) &&
      (filters.date ? exam.date === filters.date : true) &&
      (filters.status !== 'all' ? exam.status === filters.status : true)
    );
  }, [exams, filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const openModal = (exam: Exam | null = null) => {
    setEditingExam(exam);
    reset((exam || { status: "Scheduled" }) as any);
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
    reset();
  }

  const onSubmit = (data: z.infer<typeof examSchema>) => {
    if (editingExam) {
      // Update existing exam
      setExams(prev => prev.map(e => e.id === editingExam.id ? { ...data, id: editingExam.id, branchId: editingExam.branchId } as Exam : e));
    } else {
      // Create new exam
      const newExam = { ...data, id: `EXM${Date.now()}`, branchId };
      setExams(prev => [...prev, newExam as Exam]);
    }
    closeModal();
  };
  
  const deleteExam = (id: string) => {
      if(confirm('Are you sure you want to delete this exam?')) {
          setExams(prev => prev.filter(e => e.id !== id))
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Exam Schedule</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => openModal()}><PlusCircle className="mr-2 h-4 w-4"/> Create Exam</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader><DialogTitle>{editingExam ? 'Edit Exam' : 'Create Exam'}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <Input placeholder="Exam Name" {...register("name")} />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                    <Input placeholder="Class" {...register("class")} />
                    {errors.class && <p className="text-red-500 text-xs">{errors.class.message}</p>}
                    <Input placeholder="Board" {...register("board")} />
                    {errors.board && <p className="text-red-500 text-xs">{errors.board.message}</p>}
                    <Input placeholder="Subject" {...register("subject")} />
                    {errors.subject && <p className="text-red-500 text-xs">{errors.subject.message}</p>}
                    <Input type="date" {...register("date")} />
                    {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
                    <Input type="time" {...register("startTime")} />
                    {errors.startTime && <p className="text-red-500 text-xs">{errors.startTime.message}</p>}
                    <Input type="time" {...register("endTime")} />
                    {errors.endTime && <p className="text-red-500 text-xs">{errors.endTime.message}</p>}
                    <Input type="number" placeholder="Max Marks" {...register("maxMarks")} />
                    {errors.maxMarks && <p className="text-red-500 text-xs">{errors.maxMarks.message}</p>}
                    <Input type="number" placeholder="Pass Marks" {...register("passMarks")} />
                    {errors.passMarks && <p className="text-red-500 text-xs">{errors.passMarks.message}</p>}
                    <Input placeholder="Examiner (optional)" {...register("examiner")} />
                    <Controller name="status" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Scheduled">Scheduled</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                   <DialogFooter className="col-span-1 md:col-span-2">
                     <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                     <Button type="submit">{editingExam ? 'Save Changes' : 'Create Exam'}</Button>
                   </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Input placeholder="Filter by Class..." value={filters.class} onChange={e => handleFilterChange('class', e.target.value)} />
                <Input placeholder="Filter by Subject..." value={filters.subject} onChange={e => handleFilterChange('subject', e.target.value)} />
                <Input type="date" value={filters.date} onChange={e => handleFilterChange('date', e.target.value)} />
                <Select value={filters.status} onValueChange={value => handleFilterChange('status', value)}>
                    <SelectTrigger><SelectValue placeholder="Filter by Status..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Scheduled Exams</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Class/Board</TableHead><TableHead>Subject</TableHead><TableHead>Date & Time</TableHead><TableHead>Marks</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredExams.map(exam => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.name}</TableCell>
                  <TableCell>{exam.class} / {exam.board}</TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>{exam.date} @ {exam.startTime}</TableCell>
                  <TableCell>{exam.maxMarks}/{exam.passMarks}</TableCell>
                  <TableCell><Badge variant={exam.status === 'Scheduled' ? 'default' : 'secondary'}>{exam.status}</Badge></TableCell>
                  <TableCell className="space-x-1">
                    <Button variant="outline" size="icon" onClick={() => openModal(exam)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" asChild><Link href={`/admin/examination/marks?examId=${exam.id}`}><BookOpen className="h-4 w-4" /></Link></Button>
                    <Button variant="destructive" size="icon" onClick={() => deleteExam(exam.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredExams.length === 0 && <TableRow><TableCell colSpan={7} className="text-center">No exams found matching your criteria.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamSchedulePage;