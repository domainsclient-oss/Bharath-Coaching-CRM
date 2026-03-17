
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents the attendance status for a single student.
 */
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

/**
 * Represents the attendance record for an entire branch for a single day.
 * The document ID in Firestore should be in the format: YYYY-MM-DD_{branchId}
 */
export interface DailyAttendance {
  id: string; // Composite ID, e.g., '2024-07-21_trichy'
  branchId: string;
  date: Timestamp | Date; // The specific date of this record

  /**
   * A map where keys are student IDs and values are their attendance status.
   * e.g., { 'student123': 'Present', 'student456': 'Absent' }
   */
  records: Record<string, AttendanceStatus>;

  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
