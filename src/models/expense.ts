
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a single expense record for a branch.
 * This could be for salaries, rent, utilities, supplies, etc.
 */
export interface Expense {
  id: string; // Firestore document ID
  branchId: string; // The branch this expense belongs to

  description: string; // Detailed description of the expense
  category: 'Salary' | 'Rent' | 'Utilities' | 'Supplies' | 'Marketing' | 'Other';
  amount: number; // The total amount of the expense
  date: Timestamp | Date; // The date the expense was incurred

  // Optional fields
  vendor?: string; // Who was paid
  receiptUrl?: string; // Link to a scanned receipt

  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
