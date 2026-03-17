
import centerConfig from '../config/centerConfig';

export const initialSettings = {
  appName: centerConfig.centerName,
  contactEmail: centerConfig.email,
  defaultBranch: "BR001", // Trichy
  currency: "INR",
  address: centerConfig.address,
};

export const sampleUsers = [
    { id: "user001", name: "Super Admin", email: `super@${centerConfig.email.split('@')[1]}`, role: "super_admin", status: "active", lastLogin: "2024-07-31T10:00:00Z" },
    { id: "user002", name: "Meena Srinivasan", email: `meena.s@${centerConfig.email.split('@')[1]}`, role: "admin", branchId: "BR001", status: "active", lastLogin: "2024-07-31T09:30:00Z" },
    { id: "user003", name: "Ganesh Kumar", email: `ganesh.k@${centerConfig.email.split('@')[1]}`, role: "admin", branchId: "BR002", status: "active", lastLogin: "2024-07-30T15:45:00Z"},
    { id: "user004", name: "Rajesh Kumar", email: `rajesh.k@${centerConfig.email.split('@')[1]}`, role: "teacher", branchId: "BR001", status: "active", lastLogin: "2024-07-31T08:00:00Z" },
    { id: "user005", name: "Arjun Kumar", email: "student.arjun@example.com", role: "student", branchId: "BR001", status: "active", lastLogin: "2024-07-29T11:00:00Z" },
    { id: "user006", name: "Inactive Teacher", email: "inactive.teacher@example.com", role: "teacher", branchId: "BR002", status: "inactive", lastLogin: "2024-05-20T11:00:00Z" },
];
