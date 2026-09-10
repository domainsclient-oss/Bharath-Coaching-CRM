
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, ClipboardList, BookOpen, FileText, Calendar, DollarSign, User, Megaphone, LogOut } from 'lucide-react';
import Image from 'next/image';
import centerConfig from '../../config/centerConfig';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

const getInitials = (name?: string) =>
  (name ?? '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';

export function StudentSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

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

      {/* Signed-in student and the way out — mirrors the admin sidebar footer. */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={() => setShowLogout(true)}
          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-[#0D7C8F] text-white text-xs font-bold">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium">{user?.name ?? 'Student'}</span>
            <span className="truncate text-xs text-muted-foreground">
              {(user as { rollNo?: string } | null)?.rollNo ?? 'Student'}
            </span>
          </div>
          <LogOut className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>

      <AlertDialog open={showLogout} onOpenChange={setShowLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your student portal?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[#1E2A4A] hover:bg-[#0D7C8F]" onClick={logout}>
              Yes, Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
