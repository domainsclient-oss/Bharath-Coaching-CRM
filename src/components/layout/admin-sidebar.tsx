'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, Video, 
  IndianRupee, FlaskConical, UserCog, Banknote, BarChart3, 
  Settings, LogOut, ChevronDown, ChevronRight, School, Phone, 
  PenLine
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSubButton, SidebarRail,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import centerConfig from '@/config/centerConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlatNavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

interface SubNavItem {
  href: string;
  label: string;
  roles?: string[];
}

interface FlatSection {
  label: null;
  roles?: string[];
  items: FlatNavItem[];
}

interface GroupSection {
  label: string;
  icon?: React.ElementType;
  roles?: string[];
  items: SubNavItem[];
}

type NavSection = FlatSection | GroupSection;

// ─── Nav structure ────────────────────────────────────────────────────────────

const navSections: NavSection[] = [
  {
    label: null,
    items: [
      { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'admin', 'teacher'] },
    ],
  },
  {
    label: 'Students',
    icon: Users,
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { href: '/admin/students', label: 'All Students' },
      { href: '/admin/students/add', label: 'Add Student', roles: ['super_admin', 'admin'] },
      { href: '/admin/students/online', label: 'Online Admissions', roles: ['super_admin', 'admin'] },
      { href: '/admin/students/discontinued', label: 'Discontinued', roles: ['super_admin', 'admin'] },
    ],
  },
  {
    label: 'Academics',
    icon: BookOpen,
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { href: '/admin/academics/classes', label: 'Classes', roles: ['super_admin', 'admin'] },
      { href: '/admin/academics/teachers', label: 'Subject Teachers', roles: ['super_admin', 'admin'] },
      { href: '/admin/academics/subjects', label: 'Subjects', roles: ['super_admin', 'admin'] },
      { href: '/admin/academics/class-timetable', label: 'Class Timetable' },
      { href: '/admin/academics/teacher-timetable', label: 'Teacher Timetable' },
    ],
  },
  {
    label: 'Attendance',
    icon: ClipboardList,
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { href: '/admin/attendance/students', label: 'Student Attendance' },
      { href: '/admin/attendance/staff', label: 'Staff Attendance', roles: ['super_admin', 'admin'] },
      { href: '/admin/attendance/reports', label: 'Reports' },
    ],
  },
  {
    label: 'Online Classes',
    icon: Video,
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { href: '/admin/online-classes', label: 'Live Classes' },
      { href: '/admin/online-classes/timetable', label: 'Online Timetable' },
    ],
  },
  {
    label: 'CRM / Leads',
    icon: Phone,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/leads', label: 'Enquiry Pipeline' },
      { href: '/admin/leads/add', label: 'Add Enquiry' },
      { href: '/admin/leads/phone-log', label: 'Phone Call Log' },
      { href: '/admin/leads/reminders', label: 'Reminders' },
    ],
  },
  {
    label: 'Fees',
    icon: IndianRupee,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/fees/collect', label: 'Collect Fee' },
      { href: '/admin/fees/balance', label: 'Balance Dues' },
      { href: '/admin/fees/one-to-one', label: 'One-to-One Fees' },
      { href: '/admin/fees/search', label: 'Fee Search & Receipt' },
      { href: '/admin/fees/analytics', label: 'Fee Analytics', roles: ['super_admin'] },
    ],
  },
  {
    label: 'Examination',
    icon: PenLine,
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { href: '/admin/examination', label: 'Exam Schedule' },
      { href: '/admin/examination/marks', label: 'Mark Entry' },
      { href: '/admin/examination/marksheet', label: 'Print Marksheet' },
    ],
  },
  {
    label: 'Assessment',
    icon: FlaskConical,
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { href: '/admin/assessment/question-bank', label: 'Question Bank' },
      { href: '/admin/assessment/create', label: 'Create Online Exam' },
    ],
  },
  {
    label: 'HR',
    icon: UserCog,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/hr', label: 'Staff Directory' },
      { href: '/admin/hr/payroll', label: 'Payroll' },
    ],
  },
  {
    label: null,
    items: [
      { href: '/admin/expenditure', icon: Banknote, label: 'Expenditure', roles: ['super_admin', 'admin'] },
      { href: '/admin/reports', icon: BarChart3, label: 'Reports', roles: ['super_admin', 'admin', 'teacher'] },
      { href: '/admin/settings', icon: Settings, label: 'Settings', roles: ['super_admin'] },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasAccess(roles: string[] | undefined, userRole: string) {
  if (!roles) return true;
  return roles.includes(userRole);
}

function getInitials(name: string) {
  if (!name) return 'A';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const userRole = user?.role ?? 'admin';

  // Track which sections are open — default open if any child is active
  const defaultOpen: Record<string, boolean> = {};
  navSections.forEach(section => {
    if (section.label) {
      defaultOpen[section.label] = section.items.some(item => pathname.startsWith(item.href));
    }
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(defaultOpen);

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <School className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-foreground">{centerConfig.centerName}</span>
            <span className="text-xs text-muted-foreground">Admin Portal</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Main nav */}
      <SidebarContent className="gap-0">
        {navSections.map((section, si) => {
          if (!hasAccess(section.roles, userRole)) return null;

          // Flat items (no grouping label)
          if (!section.label) {
            const flatItems = section.items as FlatNavItem[];
            return (
              <SidebarGroup key={si} className="py-1">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {flatItems.map(item => {
                      if (!hasAccess(item.roles, userRole)) return null;
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                            <Link href={item.href}>
                              {Icon && <Icon />}
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          // Collapsible section
          const SectionIcon = section.icon;
          const isOpen = !!openSections[section.label];
          const isSectionActive = section.items.some(item => pathname.startsWith(item.href));
          const visibleItems = section.items.filter(item => hasAccess(item.roles, userRole));
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={section.label} className="py-0">
              <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.label!)}>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel
                    className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${isSectionActive ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    <div className="flex items-center gap-2">
                      {SectionIcon && <SectionIcon className="h-4 w-4" />}
                      <span className="group-data-[collapsible=icon]:hidden">{section.label}</span>
                    </div>
                    {isOpen
                      ? <ChevronDown className="h-3 w-3 group-data-[collapsible=icon]:hidden" />
                      : <ChevronRight className="h-3 w-3 group-data-[collapsible=icon]:hidden" />
                    }
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleItems.map(item => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuSubButton asChild isActive={isActive} className="h-8">
                              <Link href={item.href}>
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="w-full cursor-pointer"
              onClick={logout}
              tooltip="Log out"
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {user ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate">{user?.name ?? 'Admin'}</span>
                <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
              </div>
              <LogOut className="ml-auto h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
