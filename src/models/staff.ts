
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a staff member, such as a teacher or an admin, in the system.
 * This interface extends the base user profile with roles and other employment-specific details.
 */
export interface Staff {
  id: string; // Firestore document ID
  name: string; // Full name
  email: string; // Contact email, should be unique
  phone: string; // Contact phone number

  // Role & Permissions
  role: 'teacher' | 'admin' | 'super_admin';
  branchId: string; // The branch this staff member belongs to
  
  // Employment Details
  dateOfJoining: Timestamp | Date;
  qualifications: string;
  isActive: boolean; // To handle active vs. inactive employees

  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
