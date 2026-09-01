
import {
  studentService,
  staffService,
  feeService,
  enquiryService,
  attendanceService,
} from './firestoreService';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Safely converts Firestore Timestamp / JS Date / ISO string → JS Date */
function toDate(value: unknown): Date {
  if (!value) return new Date(0);
  if (typeof (value as any).toDate === 'function') return (value as any).toDate();
  if (value instanceof Date) return value;
  return new Date(value as string);
}

/** Runs fn(), returns fallback silently on any error (index missing, permission, etc.) */
async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn('[dashboardService] query failed (returning fallback):', err);
    return fallback;
  }
}

// ── KPIs ─────────────────────────────────────────────────────────────────────

export interface DashboardKPIs {
  totalStudents: number;
  activeStaff: number;
  feesCollectedThisMonth: number;
  pendingDues: number;
}

const getDashboardKPIs = async (branchId: string): Promise<DashboardKPIs> => {
  const today = new Date();
  const start = startOfMonth(today);
  const end   = endOfMonth(today);

  const [students, staff, feesThisMonth, pendingFees] = await Promise.all([
    safeFetch(
      () => studentService.query([
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'status',   operator: '==', value: 'Active'  },
      ]),
      []
    ),
    safeFetch(
      () => staffService.query([
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'status',   operator: '==', value: 'Active'  },
      ]),
      []
    ),
    safeFetch(
      () => feeService.query([
        { field: 'branchId',     operator: '==', value: branchId },
        { field: 'paymentDate',  operator: '>=', value: start    },
        { field: 'paymentDate',  operator: '<=', value: end      },
      ]),
      []
    ),
    safeFetch(
      () => feeService.query([
        { field: 'branchId', operator: '==',  value: branchId                  },
        { field: 'status',   operator: 'in',  value: ['Unpaid', 'Partially Paid'] },
      ]),
      []
    ),
  ]);

  return {
    totalStudents:         students.length,
    activeStaff:           staff.length,
    feesCollectedThisMonth: feesThisMonth.reduce((s: number, f: any) => s + (f.amountPaid ?? 0), 0),
    pendingDues:           pendingFees.reduce((s: number, f: any) => s + (f.balance ?? 0), 0),
  };
};

// ── Monthly Fee Collection ────────────────────────────────────────────────────

export interface MonthlyFee {
  month: string;
  collected: number;
}

const getMonthlyFeeCollection = async (branchId: string): Promise<MonthlyFee[]> => {
  const today  = new Date();
  // Build 6-month buckets: oldest first
  const buckets: MonthlyFee[] = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(today, 5 - i);
    return { month: format(d, 'MMM'), collected: 0 };
  });

  // Query fees paid in the last 6 months
  const rangeStart = startOfMonth(subMonths(today, 5));
  const rangeEnd   = endOfMonth(today);

  const fees = await safeFetch(
    () => feeService.query([
      { field: 'branchId',    operator: '==', value: branchId  },
      { field: 'paymentDate', operator: '>=', value: rangeStart },
      { field: 'paymentDate', operator: '<=', value: rangeEnd   },
    ]),
    []
  );

  fees.forEach((fee: any) => {
    const pd    = toDate(fee.paymentDate);
    const label = format(pd, 'MMM');
    const bucket = buckets.find(b => b.month === label);
    if (bucket) bucket.collected += fee.amountPaid ?? 0;
  });

  return buckets;
};

// ── Lead Sources ──────────────────────────────────────────────────────────────

export interface LeadSource {
  name: string;
  value: number;
}

const getLeadSources = async (branchId: string): Promise<LeadSource[]> => {
  const start = startOfMonth(new Date());

  const enquiries = await safeFetch(
    () => enquiryService.query([
      { field: 'branchId',  operator: '==', value: branchId },
      { field: 'createdAt', operator: '>=', value: start    },
    ]),
    []
  );

  const map: Record<string, number> = {};
  enquiries.forEach((e: any) => {
    const src = e.source || 'Unknown';
    map[src] = (map[src] || 0) + 1;
  });

  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

// ── Fee Alerts ────────────────────────────────────────────────────────────────

export interface FeeAlert {
  id: string;
  name: string;
  class: string;
  dueDate: Date;
  amount: number;
  overdue: boolean;
}

const getFeeAlerts = async (branchId: string): Promise<FeeAlert[]> => {
  const now = new Date();

  const fees = await safeFetch(
    () => feeService.query(
      [
        { field: 'branchId', operator: '==', value: branchId                       },
        { field: 'status',   operator: 'in', value: ['Unpaid', 'Partially Paid']   },
      ],
      { field: 'dueDate', direction: 'asc' },
      5
    ),
    []
  );

  return fees.map((f: any) => {
    const due = toDate(f.dueDate);
    return {
      id:      f.id      ?? '',
      name:    f.name    ?? f.studentName ?? 'Unknown',
      class:   f.class   ?? f.className   ?? '—',
      dueDate: due,
      amount:  f.balance ?? f.amount      ?? 0,
      overdue: due < now,
    };
  });
};

// ── Recent Enquiries ──────────────────────────────────────────────────────────

export interface RecentEnquiry {
  id: string;
  name: string;
  source: string;
  class: string;
  status: string;
  date: Date;
}

const getRecentEnquiries = async (branchId: string): Promise<RecentEnquiry[]> => {
  const enquiries = await safeFetch(
    () => enquiryService.query(
      [{ field: 'branchId', operator: '==', value: branchId }],
      { field: 'createdAt', direction: 'desc' },
      5
    ),
    []
  );

  return enquiries.map((e: any) => ({
    id:     e.id       ?? '',
    name:   e.name     ?? e.studentName ?? 'Unknown',
    source: e.source   ?? 'Unknown',
    class:  e.class    ?? e.className   ?? '—',
    status: e.status   ?? 'New',
    date:   toDate(e.createdAt ?? e.date),
  }));
};

// ── Today's Attendance ────────────────────────────────────────────────────────

export interface TodayAttendance {
  present: number;
  absent: number;
  late: number;
  total: number;
  pct: number;
}

const getTodayAttendance = async (branchId: string): Promise<TodayAttendance> => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const records = await safeFetch(
    () => attendanceService.query([
      { field: 'branchId', operator: '==', value: branchId },
      { field: 'date',     operator: '==', value: todayStr },
    ]),
    []
  );

  const present = records.filter((r: any) => r.status === 'Present').length;
  const absent  = records.filter((r: any) => r.status === 'Absent').length;
  const late    = records.filter((r: any) => r.status === 'Late').length;
  const total   = records.length;
  const pct     = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return { present, absent, late, total, pct };
};

// ── Exports ───────────────────────────────────────────────────────────────────

export const dashboardService = {
  getDashboardKPIs,
  getMonthlyFeeCollection,
  getLeadSources,
  getFeeAlerts,
  getRecentEnquiries,
  getTodayAttendance,
};
