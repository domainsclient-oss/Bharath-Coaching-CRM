
"use client";

import { SharedHeader } from '@/components/layout/shared-header';
import { ModulePlaceholder } from '@/components/layout/module-placeholder';
import { BookMarked } from 'lucide-react';

export default function StudentCoursesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SharedHeader title="My Courses" />
      <ModulePlaceholder 
        title="Learning Management System" 
        description="Access your lecture notes, course materials, recorded sessions, and interactive quizzes here. We are polishing the experience for you!" 
        icon={BookMarked} 
      />
    </div>
  );
}
