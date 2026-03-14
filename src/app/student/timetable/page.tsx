
"use client";
import { ModulePlaceholder } from '@/components/layout/module-placeholder';
import { Calendar } from 'lucide-react';
export default function StudentTimetablePage() {
  return <ModulePlaceholder title="My Timetable" description="Weekly class schedule and special lab session timings." icon={Calendar} />;
}
