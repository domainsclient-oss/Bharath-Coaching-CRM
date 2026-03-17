
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a single scheduled class or event in the timetable.
 */
export interface TimetableEntry {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "10:00"
  subject: string;
  teacherId: string;
  roomNumber?: string;
}

/**
 * Represents the full weekly timetable for a specific batch or section.
 */
export interface Timetable {
  id: string; // Firestore document ID, could be the same as batchId or sectionId
  branchId: string;
  batchId?: string;
  sectionId?: string;
  schedule: TimetableEntry[]; // An array of all classes for the week

  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
