
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  CreditCard, 
  Settings, 
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Staff Management', href: '/admin/staff' },
  { icon: GraduationCap, label: 'Students', href: '/admin/students' },
  { icon: BookOpen, label: 'Course Catalog', href: '/admin/courses' },
  { icon: Calendar, label: 'Schedule', href: '/admin/schedule' },
  { icon: FileText, label: 'Reports', href: '/admin/reports' },
  { icon: CreditCard, label: 'Fees & Finance', href: '/admin/finance' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="bg-primary text-primary-foreground border-r-0">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-primary-foreground/10 px-4">
        <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary-foreground">
            <GraduationCap size={20} />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight whitespace-nowrap">Bharath Admin</span>
          )}
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="py-4">
        <SidebarMenu className="px-2">
          {adminMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    "transition-all-150 hover:bg-white/10 h-10 mb-1",
                    isActive && "bg-secondary text-primary-foreground hover:bg-secondary/90"
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

      <SidebarFooter className="border-t border-primary-foreground/10 p-4">
        {!isCollapsed && (
          <div className="flex flex-col gap-1 rounded-lg bg-white/5 p-3">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider">System Status</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold">Live & Secure</span>
            </div>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
