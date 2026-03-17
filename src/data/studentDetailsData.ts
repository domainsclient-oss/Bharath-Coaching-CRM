
export interface FeeRecord {
  id: string;
  billNo: string;
  subjects: string[];
  total: number;
  inst1: number;
  inst2: number;
  inst3: number;
  balance: number;
  nextDue: string;
  status: "Paid" | "Partial" | "Overdue";
}

export interface AttendanceDay {
  date: string;
  status: "Present" | "Absent" | "Leave" | "Holiday";
}

export interface ExamMark {
  subject: string;
  maxMarks: number;
  obtained: number;
  grade: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  action: string;
  by: string;
}

export const mockStudentFees: Record<string, FeeRecord[]> = {
  "STU001": [
    {
      id: "F001",
      billNo: "BA-2025-0001",
      subjects: ["Mathematics", "Physics", "Chemistry"],
      total: 15000,
      inst1: 5000,
      inst2: 5000,
      inst3: 0,
      balance: 5000,
      nextDue: "2025-03-20",
      status: "Partial"
    }
  ]
};

export const mockStudentAttendance: Record<string, AttendanceDay[]> = {
  "STU001": [
    { date: "2025-03-01", status: "Present" },
    { date: "2025-03-02", status: "Holiday" },
    { date: "2025-03-03", status: "Present" },
    { date: "2025-03-04", status: "Present" },
    { date: "2025-03-05", status: "Absent" },
    { date: "2025-03-06", status: "Present" },
    { date: "2025-03-07", status: "Present" },
    { date: "2025-03-08", status: "Present" },
    { date: "2025-03-09", status: "Holiday" },
    { date: "2025-03-10", status: "Leave" },
    { date: "2025-03-11", status: "Present" },
    { date: "2025-03-12", status: "Present" },
  ]
};

export const mockStudentMarks: Record<string, ExamMark[]> = {
  "STU001": [
    { subject: "Mathematics", maxMarks: 100, obtained: 88, grade: "A" },
    { subject: "Physics", maxMarks: 100, obtained: 76, grade: "B+" },
    { subject: "Chemistry", maxMarks: 100, obtained: 92, grade: "A+" },
  ]
};

export const mockActivityLog: Record<string, ActivityLog[]> = {
  "STU001": [
    { id: "L001", date: "2025-03-12 10:30 AM", action: "Profile details updated", by: "Admin User" },
    { id: "L002", date: "2025-03-10 02:15 PM", action: "Fee collected ₹5,000", by: "Admin User" },
    { id: "L003", date: "2025-01-10 09:00 AM", action: "Student admitted to Branch", by: "System" },
  ]
};
