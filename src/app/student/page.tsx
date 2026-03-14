
"use client";

import { SharedHeader } from '@/components/layout/shared-header';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Calendar, Clock, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const courses = [
    { name: 'Advanced Mathematics', code: 'MATH401', progress: 75, grade: 'A' },
    { name: 'Data Structures', code: 'CS202', progress: 45, grade: 'B+' },
    { name: 'Microprocessors', code: 'EC305', progress: 90, grade: 'A-' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <SharedHeader title="Student Overview" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-[#1A3A5C]">
            Namaste, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-muted-foreground">Here is what is happening with your studies today.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-[#0D5C72] text-white border-none shadow-lg col-span-1 md:col-span-2 overflow-hidden relative">
            <div className="absolute right-[-20px] top-[-20px] opacity-10">
              <GraduationCap size={200} />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Academic Performance</CardTitle>
              <CardDescription className="text-white/70">You are doing great! Keep up the consistency.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-8 py-4">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold">8.4</span>
                <span className="text-xs text-white/70 uppercase">CGPA</span>
              </div>
              <div className="h-12 w-[1px] bg-white/20" />
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold">92%</span>
                <span className="text-xs text-white/70 uppercase">Attendance</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Next Lecture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                  <h4 className="font-bold text-primary">Microprocessors</h4>
                  <p className="text-sm text-muted-foreground">Lab Session 201</p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-accent">
                    <Clock className="h-3 w-3" />
                    STARTS IN 45 MINS
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-none shadow-md">
            <CardHeader>
              <CardTitle>My Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {courses.map((course) => (
                <div key={course.code} className="space-y-2">
                  <div className="flex justify-between text-sm items-center">
                    <span className="font-medium">{course.name}</span>
                    <Badge variant="secondary">{course.code}</Badge>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                    <span>{course.progress}% Completed</span>
                    <span>Current Grade: {course.grade}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: 'Maths Assignment 4', date: 'Tomorrow', icon: BookOpen },
                  { title: 'OS Project Phase 1', date: '25 Oct', icon: Award },
                  { title: 'Workshop Fee', date: '30 Oct', icon: Calendar },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg transition-all-150 hover:bg-muted">
                    <div className="p-2 rounded bg-muted">
                      <item.icon size={16} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{item.title}</h4>
                      <p className="text-xs text-destructive">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
