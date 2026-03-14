
"use client";

import { SharedHeader } from '@/components/layout/shared-header';
import { ModulePlaceholder } from '@/components/layout/module-placeholder';
import { Users } from 'lucide-react';

export default function StaffPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SharedHeader title="Staff Management" />
      <ModulePlaceholder 
        title="Faculty & Staff Directory" 
        description="Comprehensive tool for managing teacher profiles, department assignments, payroll configuration, and professional development tracking is coming soon." 
        icon={Users} 
      />
    </div>
  );
}
