
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a course or a group of students studying together for a specific duration.
 * E.g., "12th Grade Board Exam Batch 2025", "NEET Repeaters 2025".
 */
export interface Batch {
  id: string; // Firestore document ID
  branchId: string;
  name: string; // A descriptive name for the batch
  startDate: Timestamp | Date;
  endDate: Timestamp | Date;
  teacherIds?: string[]; // IDs of teachers associated with this batch

  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
