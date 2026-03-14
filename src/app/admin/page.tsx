
"use client";

import { SharedHeader } from '@/components/layout/shared-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Students', value: '2,450', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Faculty', value: '185', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Total Courses', value: '42', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending Exams', value: '8', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <SharedHeader title="Admin Dashboard" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">Snapshot of your educational institution's performance.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-md transition-all-150 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600 font-medium">+12%</span> from last semester
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4 border-none shadow-md">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 transition-all-150 hover:bg-muted">
                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded bg-primary text-primary-foreground font-bold">
                      <span className="text-xs">OCT</span>
                      <span className="text-lg leading-none">{14 + i}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">Faculty Seminar on AI in Education</h4>
                      <p className="text-xs text-muted-foreground">09:00 AM - Auditorium A</p>
                    </div>
                    <Badge variant="outline">Seminar</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 border-none shadow-md">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium">Admission Approved</p>
                      <p className="text-muted-foreground text-xs">New student Arjun registered for Computer Science</p>
                      <p className="text-muted-foreground text-[10px] mt-1 uppercase tracking-wider">2 HOURS AGO</p>
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
