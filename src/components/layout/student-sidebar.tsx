
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  BookOpen, 
  Video, 
  FileText, 
  FileEdit, 
  BarChart2,
  Bell,
  CreditCard,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
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
  { icon: LayoutDashboard, label: 'My Dashboard', href: '/student' },
  { icon: BookOpen, label: 'Resources', href: '/student/resources' },
  { icon: Video, label: 'Video Lectures', href: '/student/videos' },
  { icon: FileText, label: 'Question Papers', href: '/student/question-papers' },
  { icon: FileEdit, label: 'My Tests', href: '/student/tests' },
  { icon: BarChart2, label: 'My Progress', href: '/student/progress' },
  { icon: Bell, label: 'Notices & Homework', href: '/student/notices' },
  { icon: CreditCard, label: 'My Fees', href: '/student/fees' },
  { icon: Calendar, label: 'My Timetable', href: '/student/timetable' },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { user, currentBranch } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="bg-gradient-to-b from-[#1A3A5C] to-[#0D5C72] text-white border-r-0">
      <SidebarHeader className="h-auto py-6 flex flex-col items-center justify-center border-b border-white/10 px-4 gap-4">
        <Link href="/student" className="flex items-center gap-3 overflow-hidden w-full">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-white">
            <GraduationCap size={20} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white uppercase">Bharath Academy</span>
              <span className="text-[10px] text-secondary font-medium uppercase tracking-widest">{currentBranch} Portal</span>
            </div>
          )}
        </Link>
        
        {!isCollapsed && user && (
          <div className="flex flex-col w-full gap-1">
            <p className="text-sm font-semibold">{user.name}</p>
            <div className="flex items-center justify-between text-[11px] text-white/60">
              <span>{user.rollNo}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded">Class {user.class} · {user.board}</span>
            </div>
          </div>
        )}
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
                    "transition-all-150 hover:bg-white/10 h-11 mb-1",
                    isActive && "bg-white text-primary hover:bg-white font-semibold border-l-4 border-primary rounded-l-none"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-white/70")} />
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
