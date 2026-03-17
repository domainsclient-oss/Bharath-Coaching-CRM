
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { SharedHeader } from "@/components/layout/shared-header";
import { StudentForm } from "@/components/students/student-form";
import { ChevronRight } from "lucide-react";
import { mockStudents } from "@/data/studentsData";

export default function EditStudentPage() {
  const { id } = useParams();
  const student = mockStudents.find(s => s.id === id);

  if (!student) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
        <SharedHeader title="Edit Student" />
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">Student not found</h2>
          <Link href="/admin/students" className="text-blue-600 hover:underline mt-4 inline-block">Return to list</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Edit Student" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F] transition-colors">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/students" className="hover:text-[#0D7C8F] transition-colors">Students</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Edit Profile</span>
          </div>
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Edit: {student.name}</h2>
        </div>

        <StudentForm initialData={student} isEdit={true} />
      </main>
    </div>
  );
}
