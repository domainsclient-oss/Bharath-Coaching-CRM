
import centerConfig from '../config/centerConfig';

export interface CenterSettings {
  appName: string;
  contactEmail: string;
  defaultBranch: string;
  currency: string;
  address: string;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  status: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId?: string;
  status: string;
  lastLogin: string;
}

export const initialSettings: CenterSettings = {
  appName: centerConfig.centerName,
  contactEmail: centerConfig.email,
  defaultBranch: "BR001",
  currency: "INR",
  address: centerConfig.address,
};

// Aliases expected by settings page
export const mockCenterSettings = initialSettings;

export const mockBranches: Branch[] = [
  { id: "BR001", name: "Trichy Branch", city: "Trichy", status: "active" },
  { id: "BR002", name: "Chennai Branch", city: "Chennai", status: "active" },
  { id: "BR003", name: "Coimbatore Branch", city: "Coimbatore", status: "active" },
  { id: "BR004", name: "Madurai Branch", city: "Madurai", status: "active" },
];

export const sampleUsers: User[] = [
    { id: "user001", name: "Super Admin", email: `super@${centerConfig.email.split('@')[1]}`, role: "super_admin", status: "active", lastLogin: "2024-07-31T10:00:00Z" },
    { id: "user002", name: "Meena Srinivasan", email: `meena.s@${centerConfig.email.split('@')[1]}`, role: "admin", branchId: "BR001", status: "active", lastLogin: "2024-07-31T09:30:00Z" },
    { id: "user003", name: "Ganesh Kumar", email: `ganesh.k@${centerConfig.email.split('@')[1]}`, role: "admin", branchId: "BR002", status: "active", lastLogin: "2024-07-30T15:45:00Z"},
    { id: "user004", name: "Rajesh Kumar", email: `rajesh.k@${centerConfig.email.split('@')[1]}`, role: "teacher", branchId: "BR001", status: "active", lastLogin: "2024-07-31T08:00:00Z" },
    { id: "user005", name: "Arjun Kumar", email: "student.arjun@example.com", role: "student", branchId: "BR001", status: "active", lastLogin: "2024-07-29T11:00:00Z" },
    { id: "user006", name: "Inactive Teacher", email: "inactive.teacher@example.com", role: "teacher", branchId: "BR002", status: "inactive", lastLogin: "2024-05-20T11:00:00Z" },
];

// Alias expected by settings page
export const mockUsers = sampleUsers;
