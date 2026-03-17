
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a single examination event held at a branch.
 * Examples: "Quarterly Exam - Term 1", "Midterm Assessment", "Final Exam".
 */
export interface Exam {
  id: string; // Firestore document ID
  branchId: string; // The branch where the exam is held
  name: string; // The official name of the exam
  date: Timestamp | Date; // The date of the examination
  totalMarks: number; // The maximum marks for this exam

  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
