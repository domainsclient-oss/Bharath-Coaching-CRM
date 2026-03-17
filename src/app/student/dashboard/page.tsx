
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, CheckCircle, Clock, BookOpen, AlertCircle, IndianRupee, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/lib/auth-context';
import { studentDashboardService } from '@/services/studentDashboardService';
import { Skeleton } from '@/components/ui/skeleton';

// Type definitions for our data
interface StudentDashboardData {
    name: string;
    photoUrl: string;
    attendancePercentage: number;
    feesDue: number;
    feesDueDate: string;
    upcomingTests: any[];
    recentHomework: any[];
    todayClasses: any[];
}

const StudentDashboardPage = () => {
  const { user, currentBranch } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && currentBranch) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const data = await studentDashboardService.getStudentDashboardData(user.uid, currentBranch);
          setDashboardData(data);
        } catch (err) {
          console.error("Failed to fetch student dashboard data:", err);
          setError("Could not load dashboard. Please try again later.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, currentBranch]);

  const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const SummaryCard = ({ icon, title, value, footer, color, link, isLoading }: { icon: React.ReactNode, title: string, value: string, footer: string, color: string, link: string, isLoading: boolean }) => (
      <Link href={link} passHref>
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={`${color}`}>{icon}</div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <>
                        <Skeleton className="h-8 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground">{footer}</p>
                    </>
                )}
            </CardContent>
        </Card>
      </Link>
  )

  if (error) {
    return <div className="text-red-500 text-center py-10">{error}</div>;
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-background to-teal-50/20">
            <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                {loading ? (
                    <div className="flex items-center gap-4 w-full">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={dashboardData?.photoUrl} />
                            <AvatarFallback className="text-xl">{getInitials(dashboardData?.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold">Welcome back, {dashboardData?.name?.split(' ')[0]}!</h2>
                            <p className="text-muted-foreground">Here's your academic snapshot for today.</p>
                        </div>
                    </div>
                )}
                <div className="flex gap-2">
                    <Button variant="outline" asChild><Link href="/student/profile">My Profile</Link></Button>
                    <Button asChild><Link href="/student/timetable">View Full Timetable</Link></Button>
                </div>
            </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SummaryCard 
                title="Attendance" 
                value={`${dashboardData?.attendancePercentage || 0}%`} 
                footer="Last updated today" 
                icon={<CheckCircle size={24}/>} 
                color="text-green-500" 
                link="/student/attendance"
                isLoading={loading}
            />
            <SummaryCard 
                title="Fees Due" 
                value={`₹${dashboardData?.feesDue?.toLocaleString('en-IN') || 0}`} 
                footer={loading ? '' : `Next due date: ${dashboardData?.feesDueDate}`}
                icon={<IndianRupee size={24}/>} 
                color="text-red-500" 
                link="/student/fees"
                isLoading={loading}
            />
            <SummaryCard 
                title="Upcoming Tests" 
                value={`${dashboardData?.upcomingTests?.length || 0} Tests`} 
                footer="In the next 30 days"
                icon={<AlertCircle size={24}/>} 
                color="text-yellow-500" 
                link="/student/tests"
                isLoading={loading}
            />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
            {/* Today's Schedule */}
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Today's Schedule ({today})</CardTitle>
                    <Link href="/student/timetable" className="text-sm text-primary hover:underline">View All</Link>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> :
                        <div className="space-y-4">
                         {dashboardData?.todayClasses?.length > 0 ? dashboardData.todayClasses.map(item => (
                            <div key={item.id} className="flex items-center">
                                <Clock className="h-5 w-5 mr-4 text-muted-foreground"/>
                                <div className="flex-1">
                                    <p className="font-semibold">{item.subject}</p>
                                    <p className="text-sm text-muted-foreground">{item.teacher}</p>
                                </div>
                                <Badge variant="outline">{item.time}</Badge>
                            </div>
                        )) : <p className="text-muted-foreground text-center py-4">No classes scheduled for today.</p>}
                    </div>}
                </CardContent>
            </Card>

             {/* Upcoming Tests */}
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Upcoming Tests</CardTitle>
                    <Link href="/student/tests" className="text-sm text-primary hover:underline">View All</Link>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> :
                        <div className="space-y-4">
                        {dashboardData?.upcomingTests?.slice(0, 3).map(test => (
                            <div key={test.id} className="flex items-center">
                               <Calendar className="h-5 w-5 mr-4 text-muted-foreground"/>
                                <div className="flex-1">
                                    <p className="font-semibold">{test.subject}</p>
                                    <p className="text-sm text-muted-foreground">{test.title}</p>
                                </div>
                                 <Badge>{new Date(test.date.toDate()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Badge>
                            </div>
                        ))}
                    </div>}
                </CardContent>
            </Card>

             {/* Recent Homework */}
            <Card className="lg:col-span-2">
                 <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Homework</CardTitle>
                    <Link href="/student/homework" className="text-sm text-primary hover:underline">View All</Link>
                </CardHeader>
                <CardContent>
                     {loading ? <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> :
                        <div className="space-y-4">
                        {dashboardData?.recentHomework?.slice(0, 3).map(hw => (
                             <div key={hw.id} className="flex items-center p-2 rounded-md hover:bg-muted/50">
                               <BookOpen className="h-5 w-5 mr-4 text-muted-foreground"/>
                                <div className="flex-1">
                                    <p className="font-semibold">{hw.subject} - <span className="font-normal text-sm text-muted-foreground">{hw.title}</span></p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">Due: {new Date(hw.dueDate.toDate()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                    <Badge variant={hw.status === 'Submitted' ? 'default' : (hw.status === 'Pending' ? 'secondary' : 'destructive')}>{hw.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

export default StudentDashboardPage;
