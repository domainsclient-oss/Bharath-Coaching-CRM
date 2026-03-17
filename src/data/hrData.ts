
export interface Staff {
  id: string;
  staffId: string;
  name: string;
  role: "Teacher" | "Admin" | "Support";
  phone: string;
  email: string;
  status: "Active" | "Inactive";
  branchId: string;
  avatar?: string;
}

export const mockStaff: Staff[] = [
  { id: "STF001", staffId: "T-001", name: "Priya Sharma", role: "Teacher", phone: "9876543210", email: "priya@example.com", status: "Active", branchId: "Trichy" },
  { id: "STF002", staffId: "T-002", name: "Rajesh Kumar", role: "Teacher", phone: "9876543211", email: "rajesh@example.com", status: "Active", branchId: "Trichy" },
  { id: "STF003", staffId: "T-003", name: "Anjali Devi", role: "Teacher", phone: "9876543212", email: "anjali@example.com", status: "Active", branchId: "Chennai" },
  { id: "STF004", staffId: "A-001", name: "Suresh Raina", role: "Admin", phone: "9876543213", email: "suresh@example.com", status: "Active", branchId: "Trichy" },
  { id: "STF005", staffId: "T-004", name: "Karthik Raja", role: "Teacher", phone: "9876543214", email: "karthik@example.com", status: "Active", branchId: "Trichy" },
];
