
import centerConfig from '../config/centerConfig';

const domain = centerConfig.email.split('@')[1];

export interface Staff {
  id: string;
  staffId: string;
  name: string;
  role: string;
  branch: string;
  branchId: string;
  contact: string;
  email: string;
  status: string;
  salary: number;
  photo?: string;
  avatar?: string;
  phone?: string;
  subjects?: string[];
  classes?: string[];
  address?: string;
  dob?: string;
  gender?: string;
  qualification?: string;
  experience?: number;
  bankName?: string;
  accountNo?: string;
  joinDate?: string;
}

export interface Payroll {
  id: string;
  staffId: string;
  monthYear: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: "Paid" | "Unpaid";
  branchId: string;
  processedDate?: string;
}

export const staffData: Staff[] = [
    { id: "EMP001", staffId: "STF-001", name: "Meena Srinivasan", role: "Admin", branch: "Trichy", branchId: "Trichy", contact: "9876543210", email: `meena.s@${domain}`, status: "Active", salary: 35000, phone: "9876543210", subjects: ["Admin"], classes: [], joinDate: "2020-06-01" },
    { id: "EMP002", staffId: "STF-002", name: "Rajesh Kumar", role: "Teacher", branch: "Trichy", branchId: "Trichy", contact: "9876543211", email: `rajesh.k@${domain}`, status: "Active", salary: 28000, phone: "9876543211", subjects: ["Physics", "Mathematics"], classes: ["Class 11", "Class 12"], joinDate: "2021-07-15" },
    { id: "EMP003", staffId: "STF-003", name: "Anitha Das", role: "Teacher", branch: "Trichy", branchId: "Trichy", contact: "9876543212", email: `anitha.d@${domain}`, status: "Active", salary: 28000, phone: "9876543212", subjects: ["Chemistry"], classes: ["Class 11", "Class 12"], joinDate: "2021-07-15" },
    { id: "EMP004", staffId: "STF-004", name: "Suresh Gupta", role: "Admin", branch: "Chennai", branchId: "Chennai", contact: "9876543213", email: `suresh.g@${domain}`, status: "Active", salary: 30000, phone: "9876543213", subjects: [], classes: [], joinDate: "2019-03-01" },
    { id: "EMP005", staffId: "STF-005", name: "Priya Mohan", role: "Support", branch: "Trichy", branchId: "Trichy", contact: "9876543214", email: `priya.m@${domain}`, status: "Active", salary: 25000, phone: "9876543214", subjects: [], classes: [], joinDate: "2022-01-10" },
    { id: "EMP006", staffId: "STF-006", name: "Kavita Singh", role: "Teacher", branch: "Chennai", branchId: "Chennai", contact: "9876543215", email: `kavita.s@${domain}`, status: "Inactive", salary: 28000, phone: "9876543215", subjects: ["Biology"], classes: ["Class 11"], joinDate: "2020-08-01" },
    { id: "EMP007", staffId: "STF-007", name: "Arun Pandian", role: "Support", branch: "Trichy", branchId: "Trichy", contact: "9876543216", email: `arun.p@${domain}`, status: "Active", salary: 22000, phone: "9876543216", subjects: [], classes: [], joinDate: "2023-02-01" },
];

export const mockPayroll: Payroll[] = [
    { id: "PAY001", staffId: "EMP001", monthYear: "2026-02", baseSalary: 35000, bonus: 0, deductions: 0, netSalary: 35000, status: "Paid", branchId: "Trichy", processedDate: "2026-02-28T10:00:00Z" },
    { id: "PAY002", staffId: "EMP002", monthYear: "2026-02", baseSalary: 28000, bonus: 2000, deductions: 0, netSalary: 30000, status: "Paid", branchId: "Trichy", processedDate: "2026-02-28T10:00:00Z" },
    { id: "PAY003", staffId: "EMP003", monthYear: "2026-02", baseSalary: 28000, bonus: 0, deductions: 500, netSalary: 27500, status: "Paid", branchId: "Trichy", processedDate: "2026-02-28T10:00:00Z" },
];

// Alias used by page components
export const mockStaff = staffData;
