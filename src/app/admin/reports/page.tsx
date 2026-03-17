
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
    Users, DollarSign, CalendarCheck, ClipboardList, Laptop, 
    BookOpen, Briefcase, Library, Box, GraduationCap, History, Link2 
} from "lucide-react";

const reportCards = [
    { title: "Students Info", description: "Detailed student demographics and enrollment data.", href: "/admin/reports/students", icon: <Users className="h-8 w-8 text-blue-500"/> },
    { title: "Finance Report", description: "Income, expenditure, and fee collection analysis.", href: "/admin/reports/finance", icon: <DollarSign className="h-8 w-8 text-green-500"/> },
    { title: "Attendance Report", description: "Class-wise and student-wise attendance records.", href: "/admin/reports/attendance", icon: <CalendarCheck className="h-8 w-8 text-yellow-500"/> },
    { title: "Examination Results", description: "Performance analysis of internal examinations.", href: "/admin/reports/examination", icon: <ClipboardList className="h-8 w-8 text-red-500"/> },
    { title: "Online Exams", description: "Usage and performance of online assessments.", href: "/admin/reports/online-exams", icon: <Laptop className="h-8 w-8 text-indigo-500"/> },
    { title: "Lesson Plans", description: "Track curriculum coverage and teaching progress.", href: "/admin/reports/lesson-plans", icon: <BookOpen className="h-8 w-8 text-purple-500"/> },
    { title: "Human Resources", description: "Staff data, payroll, and leave information.", href: "/admin/reports/hr", icon: <Briefcase className="h-8 w-8 text-pink-500"/> },
    { title: "Library Usage", description: "Book issuance, returns, and popular titles.", href: "/admin/reports/library", icon: <Library className="h-8 w-8 text-cyan-500"/> },
    { title: "Inventory Status", description: "Stock levels and usage of academy assets.", href: "/admin/reports/inventory", icon: <Box className="h-8 w-8 text-orange-500"/> },
    { title: "Alumni Records", description: "Data on former students and their progress.", href: "/admin/reports/alumni", icon: <GraduationCap className="h-8 w-8 text-lime-500"/> },
    { title: "Homework Submissions", description: "Track assigned homework and student submissions.", href: "/admin/reports/homework", icon: <History className="h-8 w-8 text-amber-500"/> },
    { title: "Audit Trail", description: "Review of critical activities and system changes.", href: "/admin/reports/audit-trail", icon: <Link2 className="h-8 w-8 text-gray-500"/> },
];

const ReportsHubPage = () => {
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Reports Hub</h1>
        </div>
        <p className="text-muted-foreground">
            Select a report to view detailed analytics and data. You can export the data from each report page.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportCards.map((card) => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        {card.icon}
                        <div>
                            <CardTitle>{card.title}</CardTitle>
                            <CardDescription>{card.description}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="flex justify-end space-x-2">
                        <Link href={card.href} passHref>
                            <Button>View Report</Button>
                        </Link>
                        {/* The export function will be on the specific report page */}
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
};

export default ReportsHubPage;

