
import centerConfig from '../config/centerConfig';

const domain = centerConfig.email.split('@')[1];

export interface Staff {
  id: string;
  name: string;
  role: string;
  branch: string;
  branchId: string;
  contact: string;
  email: string;
  status: string;
  salary: number;
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
}

export const staffData: Staff[] = [
    { id: "EMP001", name: "Meena Srinivasan", role: "Admin", branch: "Trichy", branchId: "Trichy", contact: "9876543210", email: `meena.s@${domain}`, status: "Active", salary: 35000 },
    { id: "EMP002", name: "Rajesh Kumar", role: "Teacher", branch: "Trichy", branchId: "Trichy", contact: "9876543211", email: `rajesh.k@${domain}`, status: "Active", salary: 28000 },
    { id: "EMP003", name: "Anitha Das", role: "Teacher", branch: "Trichy", branchId: "Trichy", contact: "9876543212", email: `anitha.d@${domain}`, status: "Active", salary: 28000 },
    { id: "EMP004", name: "Suresh Gupta", role: "Accountant", branch: "Chennai", branchId: "Chennai", contact: "9876543213", email: `suresh.g@${domain}`, status: "Active", salary: 30000 },
    { id: "EMP005", name: "Priya Mohan", role: "Counselor", branch: "Trichy", branchId: "Trichy", contact: "9876543214", email: `priya.m@${domain}`, status: "Active", salary: 25000 },
    { id: "EMP006", name: "Kavita Singh", role: "Teacher", branch: "Chennai", branchId: "Chennai", contact: "9876543215", email: `kavita.s@${domain}`, status: "Inactive", salary: 28000 },
    { id: "EMP007", name: "Arun Pandian", role: "IT Support", branch: "Trichy", branchId: "Trichy", contact: "9876543216", email: `arun.p@${domain}`, status: "Active", salary: 22000 },
];

export const mockPayroll: Payroll[] = [
    { id: "PAY001", staffId: "EMP001", monthYear: "2026-02", baseSalary: 35000, bonus: 0, deductions: 0, netSalary: 35000, status: "Paid", branchId: "Trichy" },
    { id: "PAY002", staffId: "EMP002", monthYear: "2026-02", baseSalary: 28000, bonus: 2000, deductions: 0, netSalary: 30000, status: "Paid", branchId: "Trichy" },
    { id: "PAY003", staffId: "EMP003", monthYear: "2026-02", baseSalary: 28000, bonus: 0, deductions: 500, netSalary: 27500, status: "Paid", branchId: "Trichy" },
];

// Alias used by page components
export const mockStaff = staffData;
