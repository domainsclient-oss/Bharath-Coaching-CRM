"use client";

import Link from "next/link";
import { ChevronRight, Users, IndianRupee, CalendarCheck, ClipboardList, Laptop, BookOpen, Briefcase, PenSquare, Library, Box, GraduationCap, History, ShieldCheck, BarChart3 } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";

const REPORTS = [
  { title: "Students Information", desc: "Demographics, enrollment, class-wise breakdown.", href: "/admin/reports/students",      icon: Users,         color: "text-blue-600",   bg: "bg-blue-100"   },
  { title: "Finance",              desc: "Fee collection, income and expenditure summary.", href: "/admin/reports/finance",       icon: IndianRupee,   color: "text-green-600",  bg: "bg-green-100"  },
  { title: "Attendance",           desc: "Student & staff daily attendance analytics.",    href: "/admin/reports/attendance",     icon: CalendarCheck, color: "text-amber-600",  bg: "bg-amber-100"  },
  { title: "Examinations",         desc: "Internal exam results and performance trends.",  href: "/admin/reports/examination",    icon: ClipboardList, color: "text-red-600",    bg: "bg-red-100"    },
  { title: "Online Examinations",  desc: "Online test completion and scoring analysis.",   href: "/admin/reports/online-exams",   icon: Laptop,        color: "text-indigo-600", bg: "bg-indigo-100" },
  { title: "Lesson Plans",         desc: "Curriculum coverage and teaching progress.",     href: "/admin/reports/lesson-plans",   icon: BookOpen,      color: "text-purple-600", bg: "bg-purple-100" },
  { title: "Human Resource",       desc: "Staff records, payroll and attendance.",         href: "/admin/reports/hr",             icon: Briefcase,     color: "text-pink-600",   bg: "bg-pink-100"   },
  { title: "Home Work",            desc: "Assigned homework and subject-wise tracking.",   href: "/admin/reports/homework",       icon: PenSquare,     color: "text-orange-600", bg: "bg-orange-100" },
  { title: "Library",              desc: "Book issuance, returns and overdue fines.",      href: "/admin/reports/library",        icon: Library,       color: "text-cyan-600",   bg: "bg-cyan-100"   },
  { title: "Inventory",            desc: "Stock levels, usage and low-stock alerts.",      href: "/admin/reports/inventory",      icon: Box,           color: "text-teal-600",   bg: "bg-teal-100"   },
  { title: "Alumni",               desc: "Former students data and batch-wise summary.",   href: "/admin/reports/alumni",         icon: GraduationCap, color: "text-lime-600",   bg: "bg-lime-100"   },
  { title: "User Log",             desc: "User activity and login history.",               href: "/admin/reports/user-log",        icon: History,       color: "text-slate-600",  bg: "bg-slate-100"  },
  { title: "Audit Trial Report",   desc: "Critical system events and change tracking.",    href: "/admin/reports/audit-trail",    icon: ShieldCheck,   color: "text-gray-600",   bg: "bg-gray-100"   },
];

export default function ReportsHubPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Reports" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Reports</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#1E2A4A]/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-[#1E2A4A]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1E2A4A]">Reports Hub</h2>
            <p className="text-xs text-muted-foreground">Select a category to view detailed analytics and export data.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {REPORTS.map(r => {
            const Icon = r.icon;
            return (
              <Link key={r.title} href={r.href}>
                <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className={`h-11 w-11 rounded-xl ${r.bg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${r.color}`} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1E2A4A] group-hover:text-[#0D7C8F] transition-colors">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{r.desc}</p>
                    </div>
                    <div className="mt-auto">
                      <span className={`text-[11px] font-semibold ${r.color} flex items-center gap-1`}>
                        View Report <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
