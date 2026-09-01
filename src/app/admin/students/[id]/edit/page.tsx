"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SharedHeader } from "@/components/layout/shared-header";
import { StudentForm } from "@/components/students/student-form";
import { ChevronRight, AlertCircle } from "lucide-react";
import { getDocument } from "@/services/firestoreService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDocument("students", id)
      .then((doc) => setStudent(doc))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
        <SharedHeader title="Edit Student" />
        <main className="p-4 md:p-6 lg:p-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
        <SharedHeader title="Edit Student" />
        <main className="p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-red-600">Student not found</h2>
          <Button onClick={() => router.push("/admin/students")}>Back to Students</Button>
        </main>
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
