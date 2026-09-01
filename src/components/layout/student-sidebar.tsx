
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, BookOpen, FileText, Calendar, DollarSign, User, Megaphone } from 'lucide-react';
import centerConfig from '../../config/centerConfig';
import { useSettings } from '../../context/SettingsContext';

const navConfig = [
  { href: '/student/dashboard', icon: Home, label: 'Dashboard', feature: null },
  { href: '/student/attendance', icon: ClipboardList, label: 'My Attendance', feature: 'attendance' },
  { href: '/student/timetable', icon: Calendar, label: 'My Timetable', feature: 'timetable' },
  { href: '/student/homework', icon: BookOpen, label: 'Homework', feature: 'homework' },
  { href: '/student/tests', icon: FileText, label: 'Tests & Exams', feature: 'tests' },
  { href: '/student/fees', icon: DollarSign, label: 'Fee Payments', feature: 'fees' },
  { href: '/student/profile', icon: User, label: 'My Profile', feature: 'profile' },
  { href: '/student/communication', icon: Megaphone, label: 'Announcements', feature: 'communication' },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { settings } = useSettings();

  const visibleNavItems = navConfig.filter(item => 
      !item.feature || centerConfig.features[item.feature as keyof typeof centerConfig.features]
  );

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen">
      <div className="h-16 flex items-center justify-center border-b border-secondary">
         <img src={centerConfig.logo} alt={`${settings.appName} Logo`} className="h-9 w-auto" />
         <span className="ml-3 text-sm font-bold tracking-tight uppercase">{settings.appName}</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                  : 'hover:bg-secondary'
              }`}>
              <item.icon className="h-5 w-5 mr-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
