
"use client";

import Link from "next/link";
import { SharedHeader } from "@/components/layout/shared-header";
import { StudentForm } from "@/components/students/student-form";
import { ChevronRight } from "lucide-react";

export default function AddStudentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Add Student" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F] transition-colors">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/students" className="hover:text-[#0D7C8F] transition-colors">Students</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Add Student</span>
          </div>
          <h2 className="text-2xl font-bold text-[#1E2A4A]">New Student Enrollment</h2>
        </div>

        <StudentForm />
      </main>
    </div>
  );
}
