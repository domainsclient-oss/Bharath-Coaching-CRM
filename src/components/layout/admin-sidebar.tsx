
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  CreditCard, 
  Settings, 
  GraduationCap,
  Monitor,
  PhoneCall,
  ClipboardCheck,
  Briefcase,
  TrendingDown,
  History,
  Package,
  Library,
  BookMarked,
  MessageSquare,
  Globe,
  BarChart3,
  UserCheck
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    ]
  },
  {
    label: 'ACADEMICS',
    items: [
      { icon: Users, label: 'Students', href: '/admin/students' },
      { icon: GraduationCap, label: 'Classes', href: '/admin/academics/classes' },
      { icon: BookOpen, label: 'Subjects', href: '/admin/academics/subjects' },
      { icon: UserCheck, label: 'Teacher Assignment', href: '/admin/academics/teachers' },
      { icon: ClipboardCheck, label: 'Attendance', href: '/admin/attendance' },
      { icon: Monitor, label: 'Online Classes', href: '/admin/online-classes' },
    ]
  },
  {
    label: 'OPERATIONS',
    items: [
      { icon: PhoneCall, label: 'Lead Management', href: '/admin/leads' },
      { icon: CreditCard, label: 'Fees & Payments', href: '/admin/fees' },
      { icon: FileText, label: 'Examination', href: '/admin/examination' },
      { icon: BarChart3, label: 'Online Assessment', href: '/admin/assessment' },
    ]
  },
  {
    label: 'HR & ADMIN',
    items: [
      { icon: Briefcase, label: 'Human Resources', href: '/admin/hr' },
      { icon: TrendingDown, label: 'Expenditure', href: '/admin/expenditure' },
      { icon: History, label: 'Alumni', href: '/admin/alumni' },
      { icon: Package, label: 'Inventory', href: '/admin/inventory' },
      { icon: Library, label: 'Library', href: '/admin/library' },
      { icon: BookMarked, label: 'Teaching Plans', href: '/admin/teaching-plans' },
    ]
  },
  {
    label: 'COMMUNICATIONS',
    items: [
      { icon: MessageSquare, label: 'WhatsApp', href: '/admin/whatsapp' },
    ]
  },
  {
    label: 'SYSTEM',
    items: [
      { icon: Globe, label: 'Website Center', href: '/admin/website' },
      { icon: BarChart3, label: 'Reports', href: '/admin/reports' },
      { icon: Settings, label: 'Settings', href: '/admin/settings' },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { currentBranch } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="bg-primary text-primary-foreground border-r-0">
      <SidebarHeader className="h-16 flex flex-col items-center justify-center border-b border-primary-foreground/10 px-4">
        <div className="flex w-full items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary-foreground">
              <GraduationCap size={20} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">Bharath Academy</span>
                <span className="text-[10px] font-medium text-secondary">{currentBranch} Branch</span>
              </div>
            )}
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[10px] text-white/50 px-4 py-2 uppercase tracking-widest font-bold">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarMenu className="px-2">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "transition-all-150 hover:bg-white/10 h-10 mb-0.5",
                        isActive && "bg-secondary/20 text-white border-l-2 border-secondary rounded-l-none"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-secondary" : "text-white/60")} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
