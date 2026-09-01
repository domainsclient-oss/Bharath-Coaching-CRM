// src/data/attendanceData.ts

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Half-Day';

export interface AttendanceRecord {
  id: string;
  studentId?: string;
  entityType: 'student' | 'staff';
  entityId: string;
  date: string;        // YYYY-MM-DD
  status: AttendanceStatus;
  branchId: string;
  notes?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function att(
  id: string,
  entityType: 'student' | 'staff',
  entityId: string,
  date: string,
  status: AttendanceStatus,
  branchId = 'Trichy',
  notes = '',
): AttendanceRecord {
  return { id, studentId: entityType === 'student' ? entityId : undefined, entityType, entityId, date, status, branchId, notes };
}

// ── Student Attendance ─────────────────────────────────────────────────────
// Class 10 (C001) — Trichy active students: STU001, STU005, STU011, STU013
// Class 9 (C003)  — Trichy active students: STU002
// Class 11         — Trichy active students: STU009

const studentAttendance: AttendanceRecord[] = [
  // ── 2026-04-09 (Wed) – Class 10 ────────────────────────────────────────
  att('SA001', 'student', 'STU001', '2026-04-09', 'Present'),
  att('SA002', 'student', 'STU005', '2026-04-09', 'Present'),
  att('SA003', 'student', 'STU011', '2026-04-09', 'Absent', 'Trichy', 'Sick leave'),
  att('SA004', 'student', 'STU013', '2026-04-09', 'Present'),

  // ── 2026-04-10 (Thu) – Class 10 ────────────────────────────────────────
  att('SA005', 'student', 'STU001', '2026-04-10', 'Present'),
  att('SA006', 'student', 'STU005', '2026-04-10', 'Leave',   'Trichy', 'Family function'),
  att('SA007', 'student', 'STU011', '2026-04-10', 'Present'),
  att('SA008', 'student', 'STU013', '2026-04-10', 'Half-Day'),

  // ── 2026-04-09 – Class 9 ────────────────────────────────────────────────
  att('SA009', 'student', 'STU002', '2026-04-09', 'Present'),
  att('SA010', 'student', 'STU002', '2026-04-10', 'Absent', 'Trichy', 'Not feeling well'),

  // ── 2026-04-09 – Class 11 ───────────────────────────────────────────────
  att('SA011', 'student', 'STU009', '2026-04-09', 'Present'),
  att('SA012', 'student', 'STU009', '2026-04-10', 'Present'),

  // ── March 2026 – Class 10 (historical) ─────────────────────────────────
  att('SA013', 'student', 'STU001', '2026-03-31', 'Present'),
  att('SA014', 'student', 'STU005', '2026-03-31', 'Present'),
  att('SA015', 'student', 'STU011', '2026-03-31', 'Present'),
  att('SA016', 'student', 'STU013', '2026-03-31', 'Absent'),

  att('SA017', 'student', 'STU001', '2026-03-28', 'Present'),
  att('SA018', 'student', 'STU005', '2026-03-28', 'Present'),
  att('SA019', 'student', 'STU011', '2026-03-28', 'Half-Day'),
  att('SA020', 'student', 'STU013', '2026-03-28', 'Present'),

  att('SA021', 'student', 'STU001', '2026-03-27', 'Present'),
  att('SA022', 'student', 'STU005', '2026-03-27', 'Absent'),
  att('SA023', 'student', 'STU011', '2026-03-27', 'Present'),
  att('SA024', 'student', 'STU013', '2026-03-27', 'Present'),
];

// ── Staff Attendance ───────────────────────────────────────────────────────
// Trichy active staff: EMP001, EMP002, EMP003, EMP005, EMP007, EMP008

const staffAttendance: AttendanceRecord[] = [
  // ── 2026-04-09 (Wed) ────────────────────────────────────────────────────
  att('STA001', 'staff', 'EMP001', '2026-04-09', 'Present'),
  att('STA002', 'staff', 'EMP002', '2026-04-09', 'Present'),
  att('STA003', 'staff', 'EMP003', '2026-04-09', 'Present'),
  att('STA004', 'staff', 'EMP005', '2026-04-09', 'Present'),
  att('STA005', 'staff', 'EMP007', '2026-04-09', 'Present'),
  att('STA006', 'staff', 'EMP008', '2026-04-09', 'Absent', 'Trichy', 'Medical appointment'),

  // ── 2026-04-10 (Thu) ────────────────────────────────────────────────────
  att('STA007', 'staff', 'EMP001', '2026-04-10', 'Present'),
  att('STA008', 'staff', 'EMP002', '2026-04-10', 'Present'),
  att('STA009', 'staff', 'EMP003', '2026-04-10', 'Present'),
  att('STA010', 'staff', 'EMP005', '2026-04-10', 'Leave',   'Trichy', 'Personal'),
  att('STA011', 'staff', 'EMP007', '2026-04-10', 'Present'),
  att('STA012', 'staff', 'EMP008', '2026-04-10', 'Present'),

  // ── 2026-04-08 (Tue) ────────────────────────────────────────────────────
  att('STA013', 'staff', 'EMP001', '2026-04-08', 'Present'),
  att('STA014', 'staff', 'EMP002', '2026-04-08', 'Present'),
  att('STA015', 'staff', 'EMP003', '2026-04-08', 'Half-Day'),
  att('STA016', 'staff', 'EMP005', '2026-04-08', 'Present'),
  att('STA017', 'staff', 'EMP007', '2026-04-08', 'Present'),
  att('STA018', 'staff', 'EMP008', '2026-04-08', 'Present'),
];

// ── Exports ────────────────────────────────────────────────────────────────
export const mockAttendanceData: AttendanceRecord[] = [
  ...studentAttendance,
  ...staffAttendance,
];

export const mockAttendanceRecords = mockAttendanceData;
