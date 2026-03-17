
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents the marks obtained by a single student in a specific exam for a subject.
 * Each document is a record for one subject for one student in one exam.
 */
export interface Mark {
  id: string; // Firestore document ID
  branchId: string;
  studentId: string;
  examId: string; 

  subject: string; // e.g., 'Mathematics', 'Physics', 'English'
  marksObtained: number;
  totalMarks: number; // Total marks for this subject in this exam

  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
