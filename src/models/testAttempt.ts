
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a student's in-progress attempt at a test (exam).
 * This stores their answers, which questions are marked for review, and time remaining.
 */
export interface TestAttempt {
  id: string; // Composite key: `${examId}_${studentId}`
  branchId: string;
  examId: string;
  studentId: string;

  answers: Record<string, string>; // questionId -> selectedOptionId
  markedForReview: string[]; // Array of questionIds
  timeLeft: number; // Seconds remaining

  // Timestamps
  startedAt: Timestamp | Date;
  lastSavedAt: Timestamp | Date;
}
