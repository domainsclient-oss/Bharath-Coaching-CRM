
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, BookOpen, FileText, Calendar, DollarSign, User, Megaphone } from 'lucide-react';
import Image from 'next/image';
import centerConfig from '../../config/centerConfig';

const navConfig = [
  { href: '/student/dashboard', icon: Home, label: 'Dashboard', feature: null },
  { href: '/student/attendance', icon: ClipboardList, label: 'My Attendance', feature: 'attendance' },
  { href: '/student/timetable', icon: Calendar, label: 'My Timetable', feature: 'timetable' },
  { href: '/student/homework', icon: BookOpen, label: 'Homework', feature: 'homework' },
  { href: '/student/tests', icon: FileText, label: 'Tests & Exams', feature: 'tests' },
  { href: '/student/fees', icon: DollarSign, label: 'Fee Payments', feature: 'fees' },
  { href: '/student/profile', icon: User, label: 'My Profile', feature: 'profile' },
  { href: '/student/notices', icon: Megaphone, label: 'Announcements', feature: 'communication' },
];

export function StudentSidebar() {
  const pathname = usePathname();

  const visibleNavItems = navConfig.filter(item => 
      !item.feature || centerConfig.features[item.feature as keyof typeof centerConfig.features]
  );

  return (
    <div className="w-64 shrink-0 bg-card text-foreground border-r border-border shadow-[1px_0_3px_0_rgb(0_0_0_/_0.04)] flex flex-col h-screen">
      {/* Same header treatment as the admin sidebar: left aligned, px-3 py-2. */}
      <div className="flex items-center border-b border-border px-3 py-2">
        <Image
          src="/Logo-bcc.webp"
          alt="Bharath Academy"
          width={160}
          height={48}
          className="object-contain"
          priority
        />
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
                  ? 'bg-[#0D7C8F]/10 text-[#0D7C8F] font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
