
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a sub-division of a batch, if needed.
 * E.g., "Section A", "Section B".
 */
export interface Section {
  id: string; // Firestore document ID
  branchId: string;
  batchId: string; // The parent batch this section belongs to
  name: string; // e.g., 'A', 'B', 'Morning Session'
  roomNumber?: string;

  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
