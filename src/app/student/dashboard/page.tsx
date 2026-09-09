"use client";

import { useEffect, useState } from 'react';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowRight, Calendar, CheckCircle, Clock, BookOpen, FileText,
  IndianRupee, Megaphone, User, ClipboardList, CalendarDays,
} from "lucide-react";
import { useStudentRecord } from '@/hooks/useStudentRecord';
import {
  studentDashboardService,
  EMPTY_DASHBOARD,
  type StudentDashboardData,
} from '@/services/studentDashboardService';

const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').toUpperCase();

const quickLinks = [
  { label: "Attendance", icon: ClipboardList, href: "/student/attendance" },
  { label: "Timetable", icon: CalendarDays, href: "/student/timetable" },
  { label: "Homework", icon: BookOpen, href: "/student/homework" },
  { label: "Tests", icon: FileText, href: "/student/tests" },
  { label: "Fees", icon: IndianRupee, href: "/student/fees" },
  { label: "Notices", icon: Megaphone, href: "/student/notices" },
];

const StudentDashboardPage = () => {
  const { student, studentId, classId, className, branchId, loading: recordLoading, unlinked } = useStudentRecord();
  const [data, setData] = useState<StudentDashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recordLoading) return;
    if (unlinked || !studentId) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await studentDashboardService.getStudentDashboardData({
          studentId, classId, className, branchId,
        });
        setData(result);
      } catch (err) {
        console.error("Failed to fetch student dashboard data:", err);
        setError("Could not load your dashboard. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, classId, className, branchId, recordLoading, unlinked]);

  const busy = loading || recordLoading;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const name = student?.name ?? 'Student';

  const kpiCards = [
    {
      label: "Attendance",
      value: data.attendance.percentage != null ? `${data.attendance.percentage}%` : "—",
      sub: data.attendance.total > 0
        ? `Present ${data.attendance.present} of ${data.attendance.total} days`
        : "Not marked yet",
      icon: CheckCircle,
      color: "border-[#0D7C8F]",
      iconColor: "text-[#0D7C8F]",
      href: "/student/attendance",
    },
    {
      label: "Fees Due",
      value: `₹${data.feesDue.toLocaleString('en-IN')}`,
      sub: data.feesDue > 0 ? `Next due ${data.feesDueDate}` : "Nothing outstanding",
      icon: IndianRupee,
      color: "border-[#E8A020]",
      iconColor: "text-[#E8A020]",
      href: "/student/fees",
    },
    {
      label: "Upcoming Tests",
      value: `${data.upcomingTests.length}`,
      sub: data.upcomingTests.length > 0 ? "Scheduled ahead" : "None scheduled",
      icon: FileText,
      color: "border-[#1E2A4A]",
      iconColor: "text-[#1E2A4A]",
      href: "/student/tests",
    },
    {
      label: "Classes Today",
      value: `${data.todayClasses.length}`,
      sub: today,
      icon: Clock,
      color: "border-[#059669]",
      iconColor: "text-[#059669]",
      href: "/student/timetable",
    },
  ];

  return (
    <div className="flex flex-col">
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Welcome banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#0D7C8F]/10 border border-[#0D7C8F]/20 p-4 rounded-xl">
          <div className="flex items-center gap-4">
            {busy ? (
              <Skeleton className="h-12 w-12 rounded-full" />
            ) : (
              <Avatar className="h-12 w-12">
                <AvatarImage src={student?.photoUrl ?? student?.photo} />
                <AvatarFallback className="bg-[#1E2A4A] text-white font-bold">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="text-lg font-bold text-[#1E2A4A]">
                Welcome back, {name.split(' ')[0]}
              </p>
              <p className="text-sm text-[#1E2A4A]/70">
                {className ? `Class ${className}` : 'Your portal'}
                {branchId ? ` · ${branchId} Branch` : ''}
                {' · '}
                {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <Link
            href="/student/profile"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0D7C8F] hover:underline"
          >
            <User className="h-4 w-4" /> My Profile
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">{error}</div>
        )}

        {unlinked && !busy && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl">
            Your login is not linked to a student record yet. Please contact your branch office.
          </div>
        )}

        {/* KPI cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {busy
            ? [...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
                  <CardContent><Skeleton className="h-8 w-1/2" /></CardContent>
                </Card>
              ))
            : kpiCards.map((kpi, idx) => (
                <Link key={idx} href={kpi.href}>
                  <Card className={`border-none border-l-4 ${kpi.color} shadow-sm hover:shadow-md transition-all h-full`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                      <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-[#1E2A4A]">{kpi.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>

        {/* Today's schedule and upcoming tests */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-[#1E2A4A]">Today&apos;s Schedule</CardTitle>
              <Link href="/student/timetable" className="text-xs font-semibold text-[#0D7C8F] hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {busy ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : data.todayClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No classes scheduled for {today}.</p>
              ) : (
                <div className="space-y-4">
                  {data.todayClasses.map(slot => (
                    <div key={slot.id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex gap-3 items-center">
                        <div className="h-10 w-10 rounded-lg bg-[#0D7C8F]/10 flex items-center justify-center text-[#0D7C8F]">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1E2A4A]">{slot.subjectName || 'Class'}</p>
                          {slot.teacherName && (
                            <p className="text-[11px] text-muted-foreground">{slot.teacherName}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{slot.timeSlot}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-[#1E2A4A]">Upcoming Tests</CardTitle>
              <Link href="/student/tests" className="text-xs font-semibold text-[#0D7C8F] hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {busy ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : data.upcomingTests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tests scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {data.upcomingTests.slice(0, 4).map(test => (
                    <div key={test.id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex gap-3 items-center">
                        <div className="h-10 w-10 rounded-lg bg-[#1E2A4A]/5 flex items-center justify-center text-[#1E2A4A]">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1E2A4A]">{test.title}</p>
                          {test.subject && (
                            <p className="text-[11px] text-muted-foreground">{test.subject}</p>
                          )}
                        </div>
                      </div>
                      <Badge className="text-[10px] bg-teal-600">
                        {test.start?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Homework and quick links */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-[#1E2A4A]">Recent Homework</CardTitle>
              <Link href="/student/homework" className="text-xs font-semibold text-[#0D7C8F] hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {busy ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : data.recentHomework.length === 0 ? (
                <p className="text-sm text-muted-foreground">No homework assigned to your class yet.</p>
              ) : (
                <div className="space-y-4">
                  {data.recentHomework.slice(0, 4).map(hw => (
                    <div key={hw.id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex gap-3 items-center">
                        <div className="h-10 w-10 rounded-lg bg-[#E8A020]/10 flex items-center justify-center text-[#E8A020]">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1E2A4A]">{hw.title}</p>
                          {hw.subject && (
                            <p className="text-[11px] text-muted-foreground">{hw.subject}</p>
                          )}
                        </div>
                      </div>
                      {hw.dueDate && (
                        <span className="text-[11px] text-muted-foreground">Due {hw.dueDate}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#1E2A4A]">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {quickLinks.map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.href}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-[#0D7C8F]/20 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-[#1E2A4A]/5 flex items-center justify-center text-[#1E2A4A] group-hover:bg-[#0D7C8F] group-hover:text-white transition-all">
                      <link.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-center text-muted-foreground group-hover:text-[#1E2A4A]">
                      {link.label}
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href="/student/notices"
                className="mt-4 inline-flex items-center text-xs font-semibold text-[#0D7C8F] hover:underline"
              >
                See all announcements <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default StudentDashboardPage;
