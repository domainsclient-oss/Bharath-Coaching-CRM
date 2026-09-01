/**
 * Admin navigation tree — the single source of truth for the sidebar and for
 * the header's global search. Both render from this list and apply the same
 * `hasAccess` role gating, so a route can never appear in one and not the other.
 */

import type { ComponentType } from 'react';
import {
  Banknote, BarChart3, BookMarked, BookOpen, Building2, ClipboardList, FlaskConical, Globe, GraduationCap, IndianRupee, LayoutDashboard, Library, Megaphone, MessageSquare, Package, PenLine, Settings, UserCog, Users, Video
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlatNavItem {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  roles?: string[];
}

export interface SubNavItem {
  href: string;
  label: string;
  roles?: string[];
}

export interface FlatSection {
  label: null;
  roles?: string[];
  items: FlatNavItem[];
}

export interface GroupSection {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  roles?: string[];
  items: SubNavItem[];
}

export type NavSection = FlatSection | GroupSection;

// ─── Nav structure ────────────────────────────────────────────────────────────

export const navSections: NavSection[] = [
  {
    label: null,
    items: [
      { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'admin', 'teacher'] },
    ],
  },
  {
    label: 'Students Records',
    icon: Users,
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { href: '/admin/students', label: 'All Students' },
      { href: '/admin/students/add', label: 'Add Student', roles: ['super_admin', 'admin'] },
      { href: '/admin/students/application', label: 'Application Form', roles: ['super_admin', 'admin'] },
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
      { href: '/admin/academics/teachers', label: 'Assign Class Teachers', roles: ['super_admin', 'admin'] },
      { href: '/admin/academics/subjects', label: 'Subjects', roles: ['super_admin', 'admin'] },
      { href: '/admin/academics/class-timetable', label: 'Class Timetable' },
      { href: '/admin/academics/teacher-timetable', label: 'Teacher Timetable' },
      { href: '/admin/academics/exam-schedule', label: 'Exam Schedule', roles: ['super_admin', 'admin', 'teacher'] },
      { href: '/admin/academics/monthly-report', label: 'Monthly Report', roles: ['super_admin', 'admin', 'teacher'] },
      { href: '/admin/examination/marksheet', label: 'Print Mark Sheet', roles: ['super_admin', 'admin'] },
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
      { href: '/admin/online-classes/attendance', label: 'Students Attendance' },
      { href: '/admin/online-classes/timetable', label: 'Online Timetable' },
    ],
  },
  {
    label: 'G Meet Classes',
    icon: Video,
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { href: '/admin/online-classes/live-classes', label: 'Live Classes' },
      { href: '/admin/online-classes/meeting-link', label: 'Live Meeting Link' },
    ],
  },
  {
    label: 'Front Office',
    icon: Building2,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/leads', label: 'Enquiry Pipeline' },
      { href: '/admin/leads/add', label: 'Add Enquiry' },
      { href: '/admin/leads/phone-log', label: 'Phone Call Log' },
      { href: '/admin/leads/reminders', label: 'Enquiry Reminder' },
      { href: '/admin/leads/website-enquiry', label: 'Website Enquiry' },
      { href: '/admin/leads/report', label: 'Detailed Report' },
    ],
  },
  {
    label: 'Lead Sources',
    icon: Megaphone,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/leads/sources/walk-in', label: 'Walk In' },
      { href: '/admin/leads/sources/phone-call', label: 'Phone Call' },
      { href: '/admin/leads/sources/whatsapp', label: 'WhatsApp Enquiry' },
      { href: '/admin/leads/sources/social-media', label: 'Social Media' },
      { href: '/admin/leads/sources/student-referral', label: 'Students Referral' },
      { href: '/admin/leads/sources/school-reference', label: 'School Reference' },
      { href: '/admin/leads/sources/banner-sunpack', label: 'Banner / Sunpack' },
      { href: '/admin/leads/sources/pamphlet', label: 'Pamphlet' },
      { href: '/admin/leads/sources/google-seo', label: 'Google (SEO)' },
      { href: '/admin/leads/sources/website', label: 'Website' },
      { href: '/admin/leads/sources/old-students', label: 'Old Students' },
    ],
  },
  {
    label: 'Fees',
    icon: IndianRupee,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/fees/add', label: 'Add Fee Record' },
      { href: '/admin/fees/collect', label: 'Collect Fees' },
      { href: '/admin/fees/collected', label: 'Collected Fees' },
      { href: '/admin/fees/balance', label: 'Balance Fees' },
      { href: '/admin/fees/due', label: 'Due Fees' },
      { href: '/admin/fees/search', label: 'Search Fees' },
      { href: '/admin/fees/reminder', label: 'Fees Reminder' },
      { href: '/admin/fees/one-to-one', label: 'One to One Fees' },
      { href: '/admin/fees/discontinued-fees', label: 'Discontinued Fees' },
      { href: '/admin/fees/receipt', label: 'Fees Receipt' },
      { href: '/admin/fees/analytics', label: 'Fees Analytics', roles: ['super_admin'] },
      { href: '/admin/fees/report', label: 'Report & Export' },
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
      { href: '/admin/examination/report', label: 'Report' },
    ],
  },
  {
    label: 'Online Assessment',
    icon: FlaskConical,
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { href: '/admin/assessment/create', label: 'Online Exam' },
      { href: '/admin/assessment/question-bank', label: 'Question Bank' },
    ],
  },
  {
    label: 'Human Resource',
    icon: UserCog,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/hr', label: 'Staff Directory' },
      { href: '/admin/hr/attendance', label: 'Staff Attendance' },
      { href: '/admin/hr/payroll', label: 'Pay Roll' },
      { href: '/admin/hr/report/monthly', label: 'Staff Report Monthly' },
      { href: '/admin/hr/report/yearly', label: 'Staff Year Report' },
    ],
  },
  {
    label: 'Alumni',
    icon: GraduationCap,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/alumni',          label: 'Old Students Data' },
      { href: '/admin/alumni/manage',   label: 'Manage Alumni' },
      { href: '/admin/alumni/whatsapp', label: 'WhatsApp Alumni' },
    ],
  },
  {
    label: 'Inventory',
    icon: Package,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/inventory/store',      label: 'Item Store' },
      { href: '/admin/inventory/issue',      label: 'Issue Item' },
      { href: '/admin/inventory/stock',      label: 'Add Item Stock' },
      { href: '/admin/inventory/add-item',   label: 'Add Item' },
      { href: '/admin/inventory/categories', label: 'Item Category' },
    ],
  },
  {
    label: 'Library',
    icon: Library,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/library/books', label: 'Book List' },
      { href: '/admin/library/issue', label: 'Book Issue / Return' },
    ],
  },
  {
    label: 'Expenditure',
    icon: Banknote,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/expenditure', label: 'Overview' },
      { href: '/admin/expenditure/add', label: 'Add Expenses' },
      { href: '/admin/expenditure/search', label: 'Search Expenses' },
    ],
  },
  {
    label: 'Website Download Center',
    icon: Globe,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/website/uploads', label: 'Upload Content' },
      { href: '/admin/website/gallery', label: 'Gallery' },
      { href: '/admin/website/downloads', label: 'Download Report' },
      { href: '/admin/website/enquiries', label: 'Enquiry Report' },
      { href: '/admin/website/events', label: 'Events' },
      { href: '/admin/website/news', label: 'News' },
      { href: '/admin/website/banners', label: 'Banner Images' },
    ],
  },
  {
    label: 'Teaching Plans',
    icon: BookMarked,
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { href: '/admin/teaching-plans', label: 'Lesson Plans' },
      { href: '/admin/teaching-plans/homework', label: 'Homework' },
      { href: '/admin/teaching-plans/study-materials', label: 'Study Materials' },
    ],
  },
  {
    label: 'WhatsApp',
    icon: MessageSquare,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/whatsapp', label: 'Broadcast Messages' },
      { href: '/admin/whatsapp/templates', label: 'Message Templates' },
      { href: '/admin/whatsapp/scheduled', label: 'Scheduled Messages' },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { href: '/admin/reports/students',     label: 'Students Information' },
      { href: '/admin/reports/finance',      label: 'Finance' },
      { href: '/admin/reports/attendance',   label: 'Attendance' },
      { href: '/admin/reports/examination',  label: 'Examinations' },
      { href: '/admin/reports/online-exams', label: 'Online Examinations' },
      { href: '/admin/reports/lesson-plans', label: 'Lesson Plans' },
      { href: '/admin/reports/hr',           label: 'Human Resource' },
      { href: '/admin/reports/homework',     label: 'Home Work' },
      { href: '/admin/reports/library',      label: 'Library' },
      { href: '/admin/reports/inventory',    label: 'Inventory' },
      { href: '/admin/reports/alumni',       label: 'Alumni' },
      { href: '/admin/reports/user-log',      label: 'User Log' },
      { href: '/admin/reports/audit-trail',  label: 'Audit Trial Report' },
    ],
  },
  {
    label: null,
    items: [
      { href: '/admin/settings', icon: Settings, label: 'Settings', roles: ['super_admin'] },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hasAccess(roles: string[] | undefined, userRole: string) {
  if (!roles) return true;
  return roles.includes(userRole);
}
