
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a single payment transaction made by a student towards a fee.
 */
export interface Payment {
  id: string; // Firestore document ID
  branchId: string; // Branch the payment was made in
  studentId: string; // The student who made the payment
  feeId: string; // The fee this payment is for

  amount: number; // The amount paid in this transaction
  paymentDate: Timestamp | Date;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'UPI';
  receiptNumber: string; // A unique receipt number for this transaction

  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
