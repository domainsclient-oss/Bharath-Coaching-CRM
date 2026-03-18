// Shared model types used across the application

export interface Fee {
  id: string;
  studentId: string;
  studentName: string;
  branchId: string;
  totalFee: number;
  collected: number;
  balance: number;
  status: 'Paid' | 'Partial' | 'Pending';
  dueDate?: string;
  nextPaymentDate?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Payment {
  id: string;
  feeId: string;
  studentId: string;
  branchId: string;
  amount: number;
  mode: 'Cash' | 'Online' | 'Cheque' | 'DD';
  date: string;
  receiptNo: string;
  createdAt?: any;
}

export interface Student {
  id: string;
  name: string;
  standard: string;
  section: string;
  branchId: string;
  email?: string;
  phone?: string;
  status: 'Active' | 'Inactive' | 'Discontinued';
  admissionDate?: string;
  board?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  branchId: string;
  email: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  salary?: number;
  joiningDate?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  branchId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  class: string;
  branchId: string;
  dateTime: string;
  durationMins: number;
  totalMarks: number;
  status: 'Draft' | 'Published' | 'Completed';
  questionIds: string[];
  teacherId: string;
  assignedToClass: string;
  instructions: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface TestAttempt {
  id: string;
  examId: string;
  studentId: string;
  branchId: string;
  answers: Record<string, string>;
  score?: number;
  submittedAt?: any;
  startedAt?: any;
}

export interface Timetable {
  id: string;
  branchId: string;
  classId: string;
  entries: TimetableEntry[];
  createdAt?: any;
  updatedAt?: any;
}

export interface TimetableEntry {
  day: string;
  slot: string;
  subjectId: string;
  teacherId: string;
  type: 'Physical' | 'Online';
}

export interface Batch {
  id: string;
  branchId: string;
  name: string;
  startDate: any;
  endDate: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface DailyAttendance {
  id: string;
  branchId: string;
  date: string | Date;
  records: Record<string, AttendanceStatus>;
  createdAt?: any;
  updatedAt?: any;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';
