import { queryDocuments } from './firestoreService';
import { normalizeClassName } from '@/hooks/useStudentRecord';

/**
 * Dashboard figures for one student, assembled from the same collections the
 * individual portal pages read, so the summary and the detail always agree.
 */
export interface StudentDashboardData {
  attendance: { percentage: number | null; present: number; total: number };
  feesDue: number;
  feesDueDate: string;
  upcomingTests: Array<{ id: string; title: string; subject?: string; start: Date | null }>;
  recentHomework: Array<{ id: string; title: string; subject?: string; dueDate?: string }>;
  todayClasses: Array<{ id: string; subjectName?: string; teacherName?: string; timeSlot?: string }>;
}

export const EMPTY_DASHBOARD: StudentDashboardData = {
  attendance: { percentage: null, present: 0, total: 0 },
  feesDue: 0,
  feesDueDate: 'N/A',
  upcomingTests: [],
  recentHomework: [],
  todayClasses: [],
};

/** Fee due dates arrive as a Timestamp, a Date or a plain string. */
const formatDueDate = (value: any): string => {
  if (!value) return 'N/A';
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN');
};

const toDate = (value: any): Date | null => {
  if (!value) return null;
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export interface DashboardParams {
  studentId: string | null;
  classId: string | null;
  className: string;
  branchId: string;
}

const getStudentDashboardData = async ({
  studentId, classId, className, branchId,
}: DashboardParams): Promise<StudentDashboardData> => {
  // A login with no student record behind it still has to render.
  if (!studentId) return EMPTY_DASHBOARD;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const byBranch = branchId ? [{ field: 'branchId', operator: '==' as const, value: branchId }] : [];

  // Each read is independent, so failing one section should not blank the page.
  const settle = <T,>(p: Promise<T[]>): Promise<T[]> => p.catch(() => [] as T[]);

  const [attendanceRows, feeRows, examRows, homeworkRows, slotRows] = await Promise.all([
    settle(queryDocuments<any>('studentAttendance', [{ field: 'studentId', operator: '==', value: studentId }])),
    settle(queryDocuments<any>('fees', [{ field: 'studentId', operator: '==', value: studentId }])),
    settle(branchId ? queryDocuments<any>('onlineExams', byBranch) : Promise.resolve([])),
    settle(branchId ? queryDocuments<any>('homework', byBranch) : Promise.resolve([])),
    settle(classId ? queryDocuments<any>('timetable', [{ field: 'classId', operator: '==', value: classId }]) : Promise.resolve([])),
  ]);

  // Attendance
  const marked = attendanceRows.filter(r => r.status !== 'Holiday');
  const present = marked.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const percentage = marked.length > 0 ? Math.round((present / marked.length) * 100) : null;

  // Fees still owed. Any row carrying a balance counts, whatever the office
  // called its status ("Partial", "Pending", "Unpaid" are all in use).
  const outstanding = feeRows.filter(f => (Number(f.balance) || 0) > 0);
  const feesDue = outstanding.reduce((sum, f) => sum + (Number(f.balance) || 0), 0);
  const nextDue = [...outstanding]
    .sort((a, b) => String(a.dueDate ?? '').localeCompare(String(b.dueDate ?? '')))[0];

  // Tests still ahead of us, soonest first.
  const now = new Date();
  const upcomingTests = examRows
    .filter(e => e.status !== 'Draft' && (!e.class || normalizeClassName(e.class) === className))
    .map(e => ({ id: e.id, title: e.title, subject: e.subject, start: toDate(e.dateTime) }))
    .filter(e => e.start && e.start > now)
    .sort((a, b) => (a.start!.getTime() - b.start!.getTime()))
    .slice(0, 5);

  // Homework for this class, most recently due first.
  const recentHomework = homeworkRows
    .filter(h => !h.className || normalizeClassName(h.className) === className)
    .sort((a, b) => String(b.dueDate ?? '').localeCompare(String(a.dueDate ?? '')))
    .slice(0, 5)
    .map(h => ({ id: h.id, title: h.title, subject: h.subject, dueDate: h.dueDate }));

  const todayClasses = slotRows
    .filter(s => s.day === today)
    .sort((a, b) => String(a.timeSlot ?? '').localeCompare(String(b.timeSlot ?? '')));

  return {
    attendance: { percentage, present, total: marked.length },
    feesDue,
    feesDueDate: formatDueDate(nextDue?.dueDate),
    upcomingTests,
    recentHomework,
    todayClasses,
  };
};

export const studentDashboardService = {
    getStudentDashboardData
};
