
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  BookMarked, 
  CalendarCheck, 
  Award, 
  FileCheck, 
  Wallet,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';

const studentMenuItems = [
  { icon: Home, label: 'Overview', href: '/student' },
  { icon: BookMarked, label: 'My Courses', href: '/student/courses' },
  { icon: CalendarCheck, label: 'Attendance', href: '/student/attendance' },
  { icon: Award, label: 'Results', href: '/student/results' },
  { icon: FileCheck, label: 'Exams', href: '/student/exams' },
  { icon: Wallet, label: 'Fees Payment', href: '/student/fees' },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="bg-[#1A3A5C] text-white border-r-0">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-white/10 px-4">
        <Link href="/student" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0D5C72] text-white">
            <GraduationCap size={20} />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight whitespace-nowrap">My Portal</span>
          )}
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="py-4">
        <SidebarMenu className="px-2">
          {studentMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    "transition-all-150 hover:bg-white/10 h-10 mb-1",
                    isActive && "bg-[#0D5C72] text-white hover:bg-[#0D5C72]/90"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
