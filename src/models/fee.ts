
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a single fee record assigned to a student.
 * This could be tuition, exam fees, or other charges.
 */
export interface Fee {
  id: string; // Firestore document ID
  branchId: string; // Branch the fee belongs to
  studentId: string; // The student this fee is for

  description: string; // e.g., 'Monthly Tuition Fee - May 2024'
  totalAmount: number; // The total amount due
  amountPaid: number; // The amount paid so far
  balance: number; // `totalAmount` - `amountPaid`
  dueDate: Timestamp | Date;
  status: 'Paid' | 'Unpaid' | 'Partially Paid';

  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
