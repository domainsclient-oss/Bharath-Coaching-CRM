
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  ChevronRight, 
  UserCheck, 
  BookOpen, 
  Filter, 
  MoreVertical,
  GraduationCap,
  Users
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  mockClasses, 
  mockSubjects, 
  mockTeacherAssignments,
  TeacherAssignment 
} from "@/data/academicsData";
import { mockStaff } from "@/data/hrData";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { toast } from "@/hooks/use-toast";

export default function TeacherAssignmentPage() {
  useAuth();
  const { currentBranch } = useBranch();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  // Filter teachers by branch
  const teachers = useMemo(() => {
    return mockStaff.filter(s => s.role === "Teacher" && s.branchId === currentBranch);
  }, [currentBranch]);

  // Filter assignments by branch
  const assignments = useMemo(() => {
    return mockTeacherAssignments.filter(a => a.branchId === currentBranch);
  }, [currentBranch]);

  // Filtered teachers based on search
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Teacher Assigned",
      description: "Successfully updated teacher workload.",
    });
    setIsAssignModalOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Teacher Assignment" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/academics/classes" className="hover:text-[#0D7C8F]">Academics</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Teacher Assignment</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Faculty Workload</h2>
            
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
                  <Plus className="h-4 w-4" /> Assign Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleAssign}>
                  <DialogHeader>
                    <DialogTitle>Assign Workload</DialogTitle>
                    <DialogDescription>
                      Link a teacher to a subject and class.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Select Teacher *</Label>
                      <Select defaultValue={selectedTeacherId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose Faculty" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Class *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockClasses.filter(c => c.branchId === currentBranch).map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name} ({c.board})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Subject *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose Subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockSubjects.filter(s => s.branchId === currentBranch).map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="batch">Batch / Section</Label>
                      <Input id="batch" placeholder="e.g. Evening Batch A" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-[#0D7C8F] w-full">Save Assignment</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search faculty by name..." 
                  className="pl-10 h-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 h-10">
                <Filter className="h-4 w-4" /> Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => {
            const teacherAssignments = assignments.filter(a => a.teacherId === teacher.id);
            return (
              <Card key={teacher.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <CardHeader className="pb-4 bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage src={undefined} />
                        <AvatarFallback className="bg-[#0D7C8F]/10 text-[#0D7C8F] font-bold">
                          {getInitials(teacher.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base font-bold text-[#1E2A4A]">{teacher.name}</CardTitle>
                        <CardDescription className="text-xs font-medium">{teacher.id}</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Assigned Classes & Subjects</p>
                    <div className="flex flex-wrap gap-2 min-h-[60px]">
                      {teacherAssignments.length > 0 ? (
                        teacherAssignments.map(a => (
                          <Badge key={a.id} variant="secondary" className="bg-[#1E2A4A]/5 text-[#1E2A4A] border-none flex flex-col items-start p-2 rounded-lg h-auto gap-0.5">
                            <span className="text-[10px] font-bold">{a.subjectName}</span>
                            <span className="text-[9px] opacity-70">{a.className} • {a.batch}</span>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No active assignments</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-2 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 text-xs h-9 border-[#0D7C8F] text-[#0D7C8F] hover:bg-[#0D7C8F] hover:text-white"
                      onClick={() => {
                        setSelectedTeacherId(teacher.id);
                        setIsAssignModalOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-2" /> Assign
                    </Button>
                    <Button variant="ghost" className="flex-1 text-xs h-9" asChild>
                      <Link href={`/admin/hr/staff/${teacher.id}`}>View Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
