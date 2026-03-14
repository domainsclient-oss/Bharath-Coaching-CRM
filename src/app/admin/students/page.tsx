
"use client";

import { SharedHeader } from '@/components/layout/shared-header';
import { ModulePlaceholder } from '@/components/layout/module-placeholder';
import { GraduationCap } from 'lucide-react';

export default function StudentsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SharedHeader title="Student Records" />
      <ModulePlaceholder 
        title="Student Information System" 
        description="A robust portal for handling admissions, student documentation, academic history, and behavioral records. Currently under development for enhanced performance." 
        icon={GraduationCap} 
      />
    </div>
  );
}
