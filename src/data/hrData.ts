
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

export type AttendanceStatus = "Present" | "Absent" | "Half Day" | "Leave";

export interface StaffAttendance {
  id: string;
  staffId: string;
  date: string;       // "YYYY-MM-DD"
  status: AttendanceStatus;
  inTime?: string;
  outTime?: string;
  branchId: string;
}

export const staffData: Staff[] = [
  { id: "EMP001", staffId: "STF-001", name: "Meena Srinivasan", role: "Admin",    branch: "Trichy",  branchId: "Trichy",  contact: "9876543210", email: `meena.s@${domain}`,  status: "Active",   salary: 35000, phone: "9876543210", subjects: ["Admin"],                         classes: [],                       joinDate: "2020-06-01", gender: "Female", qualification: "MBA", experience: 6 },
  { id: "EMP002", staffId: "STF-002", name: "Rajesh Kumar",    role: "Teacher",   branch: "Trichy",  branchId: "Trichy",  contact: "9876543211", email: `rajesh.k@${domain}`,  status: "Active",   salary: 28000, phone: "9876543211", subjects: ["Physics", "Mathematics"],        classes: ["Class 11", "Class 12"], joinDate: "2021-07-15", gender: "Male",   qualification: "M.Sc Physics",   experience: 5 },
  { id: "EMP003", staffId: "STF-003", name: "Anitha Das",      role: "Teacher",   branch: "Trichy",  branchId: "Trichy",  contact: "9876543212", email: `anitha.d@${domain}`,  status: "Active",   salary: 28000, phone: "9876543212", subjects: ["Chemistry"],              classes: ["Class 11", "Class 12"], joinDate: "2021-07-15", gender: "Female", qualification: "M.Sc Chemistry", experience: 5 },
  { id: "EMP004", staffId: "STF-004", name: "Suresh Gupta",    role: "Admin",     branch: "Chennai", branchId: "Chennai", contact: "9876543213", email: `suresh.g@${domain}`,  status: "Active",   salary: 30000, phone: "9876543213", subjects: [],                                classes: [],                       joinDate: "2019-03-01", gender: "Male",   qualification: "B.Com",          experience: 7 },
  { id: "EMP005", staffId: "STF-005", name: "Priya Mohan",     role: "Support",   branch: "Trichy",  branchId: "Trichy",  contact: "9876543214", email: `priya.m@${domain}`,   status: "Active",   salary: 25000, phone: "9876543214", subjects: [],                                classes: [],                       joinDate: "2022-01-10", gender: "Female", qualification: "B.A",            experience: 4 },
  { id: "EMP006", staffId: "STF-006", name: "Kavita Singh",    role: "Teacher",   branch: "Chennai", branchId: "Chennai", contact: "9876543215", email: `kavita.s@${domain}`,  status: "Inactive", salary: 28000, phone: "9876543215", subjects: ["Biology"],                classes: ["Class 11"],             joinDate: "2020-08-01", gender: "Female", qualification: "M.Sc Biology",   experience: 5 },
  { id: "EMP007", staffId: "STF-007", name: "Arun Pandian",    role: "Support",   branch: "Trichy",  branchId: "Trichy",  contact: "9876543216", email: `arun.p@${domain}`,    status: "Active",   salary: 22000, phone: "9876543216", subjects: [],                                classes: [],                       joinDate: "2023-02-01", gender: "Male",   qualification: "Diploma",        experience: 3 },
  { id: "EMP008", staffId: "STF-008", name: "Divya Nair",      role: "Teacher",   branch: "Trichy",  branchId: "Trichy",  contact: "9876543217", email: `divya.n@${domain}`,   status: "Active",   salary: 26000, phone: "9876543217", subjects: ["English", "Economics"],  classes: ["Class 10", "Class 11"], joinDate: "2022-06-01", gender: "Female", qualification: "M.A English",    experience: 4 },
];

export const mockPayroll: Payroll[] = [
  { id: "PAY001", staffId: "EMP001", monthYear: "2026-02", baseSalary: 35000, bonus: 0,    deductions: 0,   netSalary: 35000, status: "Paid",   branchId: "Trichy", processedDate: "2026-02-28T10:00:00Z" },
  { id: "PAY002", staffId: "EMP002", monthYear: "2026-02", baseSalary: 28000, bonus: 2000, deductions: 0,   netSalary: 30000, status: "Paid",   branchId: "Trichy", processedDate: "2026-02-28T10:00:00Z" },
  { id: "PAY003", staffId: "EMP003", monthYear: "2026-02", baseSalary: 28000, bonus: 0,    deductions: 500, netSalary: 27500, status: "Paid",   branchId: "Trichy", processedDate: "2026-02-28T10:00:00Z" },
  { id: "PAY004", staffId: "EMP005", monthYear: "2026-02", baseSalary: 25000, bonus: 0,    deductions: 0,   netSalary: 25000, status: "Paid",   branchId: "Trichy", processedDate: "2026-02-28T10:00:00Z" },
  { id: "PAY005", staffId: "EMP007", monthYear: "2026-02", baseSalary: 22000, bonus: 0,    deductions: 0,   netSalary: 22000, status: "Unpaid", branchId: "Trichy" },
  { id: "PAY006", staffId: "EMP008", monthYear: "2026-02", baseSalary: 26000, bonus: 1000, deductions: 0,   netSalary: 27000, status: "Paid",   branchId: "Trichy", processedDate: "2026-02-28T10:00:00Z" },
  // March 2026
  { id: "PAY007", staffId: "EMP001", monthYear: "2026-03", baseSalary: 35000, bonus: 0,    deductions: 0,   netSalary: 35000, status: "Paid",   branchId: "Trichy", processedDate: "2026-03-31T10:00:00Z" },
  { id: "PAY008", staffId: "EMP002", monthYear: "2026-03", baseSalary: 28000, bonus: 0,    deductions: 0,   netSalary: 28000, status: "Paid",   branchId: "Trichy", processedDate: "2026-03-31T10:00:00Z" },
  { id: "PAY009", staffId: "EMP003", monthYear: "2026-03", baseSalary: 28000, bonus: 0,    deductions: 0,   netSalary: 28000, status: "Paid",   branchId: "Trichy", processedDate: "2026-03-31T10:00:00Z" },
  { id: "PAY010", staffId: "EMP005", monthYear: "2026-03", baseSalary: 25000, bonus: 0,    deductions: 0,   netSalary: 25000, status: "Paid",   branchId: "Trichy", processedDate: "2026-03-31T10:00:00Z" },
  { id: "PAY011", staffId: "EMP007", monthYear: "2026-03", baseSalary: 22000, bonus: 0,    deductions: 0,   netSalary: 22000, status: "Paid",   branchId: "Trichy", processedDate: "2026-03-31T10:00:00Z" },
  { id: "PAY012", staffId: "EMP008", monthYear: "2026-03", baseSalary: 26000, bonus: 0,    deductions: 0,   netSalary: 26000, status: "Unpaid", branchId: "Trichy" },
];

// ---------- Staff Attendance ----------
// Generate realistic attendance for March + April 2026 for Trichy staff
function makeAtt(id: string, staffId: string, date: string, status: AttendanceStatus, branchId: string = "Trichy"): StaffAttendance {
  const times: Record<AttendanceStatus, { inTime?: string; outTime?: string }> = {
    Present:  { inTime: "09:00", outTime: "18:00" },
    "Half Day": { inTime: "09:00", outTime: "13:30" },
    Absent:   {},
    Leave:    {},
  };
  return { id, staffId, date, status, branchId, ...times[status] };
}

export const mockStaffAttendance: StaffAttendance[] = [
  // EMP001 – Meena (March 2026, weekdays only)
  makeAtt("SA001", "EMP001", "2026-03-02", "Present"),
  makeAtt("SA002", "EMP001", "2026-03-03", "Present"),
  makeAtt("SA003", "EMP001", "2026-03-04", "Present"),
  makeAtt("SA004", "EMP001", "2026-03-05", "Present"),
  makeAtt("SA005", "EMP001", "2026-03-06", "Present"),
  makeAtt("SA006", "EMP001", "2026-03-09", "Present"),
  makeAtt("SA007", "EMP001", "2026-03-10", "Present"),
  makeAtt("SA008", "EMP001", "2026-03-11", "Leave"),
  makeAtt("SA009", "EMP001", "2026-03-12", "Present"),
  makeAtt("SA010", "EMP001", "2026-03-13", "Present"),
  makeAtt("SA011", "EMP001", "2026-03-16", "Present"),
  makeAtt("SA012", "EMP001", "2026-03-17", "Present"),
  makeAtt("SA013", "EMP001", "2026-03-18", "Present"),
  makeAtt("SA014", "EMP001", "2026-03-19", "Present"),
  makeAtt("SA015", "EMP001", "2026-03-20", "Present"),
  makeAtt("SA016", "EMP001", "2026-03-23", "Half Day"),
  makeAtt("SA017", "EMP001", "2026-03-24", "Present"),
  makeAtt("SA018", "EMP001", "2026-03-25", "Present"),
  makeAtt("SA019", "EMP001", "2026-03-26", "Present"),
  makeAtt("SA020", "EMP001", "2026-03-27", "Present"),
  makeAtt("SA021", "EMP001", "2026-03-30", "Present"),
  makeAtt("SA022", "EMP001", "2026-03-31", "Present"),
  // EMP002 – Rajesh (March 2026)
  makeAtt("SA023", "EMP002", "2026-03-02", "Present"),
  makeAtt("SA024", "EMP002", "2026-03-03", "Present"),
  makeAtt("SA025", "EMP002", "2026-03-04", "Absent"),
  makeAtt("SA026", "EMP002", "2026-03-05", "Present"),
  makeAtt("SA027", "EMP002", "2026-03-06", "Present"),
  makeAtt("SA028", "EMP002", "2026-03-09", "Present"),
  makeAtt("SA029", "EMP002", "2026-03-10", "Present"),
  makeAtt("SA030", "EMP002", "2026-03-11", "Present"),
  makeAtt("SA031", "EMP002", "2026-03-12", "Present"),
  makeAtt("SA032", "EMP002", "2026-03-13", "Leave"),
  makeAtt("SA033", "EMP002", "2026-03-16", "Present"),
  makeAtt("SA034", "EMP002", "2026-03-17", "Present"),
  makeAtt("SA035", "EMP002", "2026-03-18", "Present"),
  makeAtt("SA036", "EMP002", "2026-03-19", "Present"),
  makeAtt("SA037", "EMP002", "2026-03-20", "Present"),
  makeAtt("SA038", "EMP002", "2026-03-23", "Present"),
  makeAtt("SA039", "EMP002", "2026-03-24", "Present"),
  makeAtt("SA040", "EMP002", "2026-03-25", "Absent"),
  makeAtt("SA041", "EMP002", "2026-03-26", "Present"),
  makeAtt("SA042", "EMP002", "2026-03-27", "Present"),
  makeAtt("SA043", "EMP002", "2026-03-30", "Present"),
  makeAtt("SA044", "EMP002", "2026-03-31", "Present"),
  // EMP003 – Anitha (March 2026)
  makeAtt("SA045", "EMP003", "2026-03-02", "Present"),
  makeAtt("SA046", "EMP003", "2026-03-03", "Present"),
  makeAtt("SA047", "EMP003", "2026-03-04", "Present"),
  makeAtt("SA048", "EMP003", "2026-03-05", "Present"),
  makeAtt("SA049", "EMP003", "2026-03-06", "Half Day"),
  makeAtt("SA050", "EMP003", "2026-03-09", "Present"),
  makeAtt("SA051", "EMP003", "2026-03-10", "Present"),
  makeAtt("SA052", "EMP003", "2026-03-11", "Present"),
  makeAtt("SA053", "EMP003", "2026-03-12", "Leave"),
  makeAtt("SA054", "EMP003", "2026-03-13", "Leave"),
  makeAtt("SA055", "EMP003", "2026-03-16", "Present"),
  makeAtt("SA056", "EMP003", "2026-03-17", "Present"),
  makeAtt("SA057", "EMP003", "2026-03-18", "Present"),
  makeAtt("SA058", "EMP003", "2026-03-19", "Present"),
  makeAtt("SA059", "EMP003", "2026-03-20", "Present"),
  makeAtt("SA060", "EMP003", "2026-03-23", "Present"),
  makeAtt("SA061", "EMP003", "2026-03-24", "Present"),
  makeAtt("SA062", "EMP003", "2026-03-25", "Present"),
  makeAtt("SA063", "EMP003", "2026-03-26", "Present"),
  makeAtt("SA064", "EMP003", "2026-03-27", "Present"),
  makeAtt("SA065", "EMP003", "2026-03-30", "Absent"),
  makeAtt("SA066", "EMP003", "2026-03-31", "Present"),
  // EMP005 – Priya (March 2026)
  makeAtt("SA067", "EMP005", "2026-03-02", "Present"),
  makeAtt("SA068", "EMP005", "2026-03-03", "Present"),
  makeAtt("SA069", "EMP005", "2026-03-04", "Present"),
  makeAtt("SA070", "EMP005", "2026-03-05", "Present"),
  makeAtt("SA071", "EMP005", "2026-03-06", "Present"),
  makeAtt("SA072", "EMP005", "2026-03-09", "Absent"),
  makeAtt("SA073", "EMP005", "2026-03-10", "Absent"),
  makeAtt("SA074", "EMP005", "2026-03-11", "Present"),
  makeAtt("SA075", "EMP005", "2026-03-12", "Present"),
  makeAtt("SA076", "EMP005", "2026-03-13", "Present"),
  makeAtt("SA077", "EMP005", "2026-03-16", "Present"),
  makeAtt("SA078", "EMP005", "2026-03-17", "Half Day"),
  makeAtt("SA079", "EMP005", "2026-03-18", "Present"),
  makeAtt("SA080", "EMP005", "2026-03-19", "Present"),
  makeAtt("SA081", "EMP005", "2026-03-20", "Present"),
  makeAtt("SA082", "EMP005", "2026-03-23", "Present"),
  makeAtt("SA083", "EMP005", "2026-03-24", "Present"),
  makeAtt("SA084", "EMP005", "2026-03-25", "Present"),
  makeAtt("SA085", "EMP005", "2026-03-26", "Present"),
  makeAtt("SA086", "EMP005", "2026-03-27", "Present"),
  makeAtt("SA087", "EMP005", "2026-03-30", "Present"),
  makeAtt("SA088", "EMP005", "2026-03-31", "Present"),
  // EMP007 – Arun (March 2026)
  makeAtt("SA089", "EMP007", "2026-03-02", "Present"),
  makeAtt("SA090", "EMP007", "2026-03-03", "Present"),
  makeAtt("SA091", "EMP007", "2026-03-04", "Present"),
  makeAtt("SA092", "EMP007", "2026-03-05", "Absent"),
  makeAtt("SA093", "EMP007", "2026-03-06", "Absent"),
  makeAtt("SA094", "EMP007", "2026-03-09", "Present"),
  makeAtt("SA095", "EMP007", "2026-03-10", "Present"),
  makeAtt("SA096", "EMP007", "2026-03-11", "Present"),
  makeAtt("SA097", "EMP007", "2026-03-12", "Present"),
  makeAtt("SA098", "EMP007", "2026-03-13", "Present"),
  makeAtt("SA099", "EMP007", "2026-03-16", "Present"),
  makeAtt("SA100", "EMP007", "2026-03-17", "Present"),
  makeAtt("SA101", "EMP007", "2026-03-18", "Leave"),
  makeAtt("SA102", "EMP007", "2026-03-19", "Present"),
  makeAtt("SA103", "EMP007", "2026-03-20", "Present"),
  makeAtt("SA104", "EMP007", "2026-03-23", "Present"),
  makeAtt("SA105", "EMP007", "2026-03-24", "Present"),
  makeAtt("SA106", "EMP007", "2026-03-25", "Present"),
  makeAtt("SA107", "EMP007", "2026-03-26", "Half Day"),
  makeAtt("SA108", "EMP007", "2026-03-27", "Present"),
  makeAtt("SA109", "EMP007", "2026-03-30", "Present"),
  makeAtt("SA110", "EMP007", "2026-03-31", "Present"),
  // EMP008 – Divya (March 2026)
  makeAtt("SA111", "EMP008", "2026-03-02", "Present"),
  makeAtt("SA112", "EMP008", "2026-03-03", "Present"),
  makeAtt("SA113", "EMP008", "2026-03-04", "Present"),
  makeAtt("SA114", "EMP008", "2026-03-05", "Present"),
  makeAtt("SA115", "EMP008", "2026-03-06", "Present"),
  makeAtt("SA116", "EMP008", "2026-03-09", "Present"),
  makeAtt("SA117", "EMP008", "2026-03-10", "Present"),
  makeAtt("SA118", "EMP008", "2026-03-11", "Present"),
  makeAtt("SA119", "EMP008", "2026-03-12", "Present"),
  makeAtt("SA120", "EMP008", "2026-03-13", "Present"),
  makeAtt("SA121", "EMP008", "2026-03-16", "Absent"),
  makeAtt("SA122", "EMP008", "2026-03-17", "Present"),
  makeAtt("SA123", "EMP008", "2026-03-18", "Present"),
  makeAtt("SA124", "EMP008", "2026-03-19", "Present"),
  makeAtt("SA125", "EMP008", "2026-03-20", "Present"),
  makeAtt("SA126", "EMP008", "2026-03-23", "Present"),
  makeAtt("SA127", "EMP008", "2026-03-24", "Present"),
  makeAtt("SA128", "EMP008", "2026-03-25", "Present"),
  makeAtt("SA129", "EMP008", "2026-03-26", "Present"),
  makeAtt("SA130", "EMP008", "2026-03-27", "Present"),
  makeAtt("SA131", "EMP008", "2026-03-30", "Present"),
  makeAtt("SA132", "EMP008", "2026-03-31", "Half Day"),
  // April 2026 - EMP001
  makeAtt("SA133", "EMP001", "2026-04-01", "Present"),
  makeAtt("SA134", "EMP001", "2026-04-02", "Present"),
  makeAtt("SA135", "EMP001", "2026-04-03", "Present"),
  makeAtt("SA136", "EMP001", "2026-04-04", "Present"),
  makeAtt("SA137", "EMP001", "2026-04-07", "Present"),
  makeAtt("SA138", "EMP001", "2026-04-08", "Present"),
  makeAtt("SA139", "EMP001", "2026-04-09", "Present"),
  makeAtt("SA140", "EMP001", "2026-04-10", "Leave"),
  makeAtt("SA141", "EMP001", "2026-04-11", "Present"),
  // April 2026 - EMP002
  makeAtt("SA142", "EMP002", "2026-04-01", "Present"),
  makeAtt("SA143", "EMP002", "2026-04-02", "Present"),
  makeAtt("SA144", "EMP002", "2026-04-03", "Absent"),
  makeAtt("SA145", "EMP002", "2026-04-04", "Present"),
  makeAtt("SA146", "EMP002", "2026-04-07", "Present"),
  makeAtt("SA147", "EMP002", "2026-04-08", "Present"),
  makeAtt("SA148", "EMP002", "2026-04-09", "Present"),
  makeAtt("SA149", "EMP002", "2026-04-10", "Present"),
  makeAtt("SA150", "EMP002", "2026-04-11", "Present"),
  // April 2026 - EMP003
  makeAtt("SA151", "EMP003", "2026-04-01", "Present"),
  makeAtt("SA152", "EMP003", "2026-04-02", "Present"),
  makeAtt("SA153", "EMP003", "2026-04-03", "Present"),
  makeAtt("SA154", "EMP003", "2026-04-04", "Present"),
  makeAtt("SA155", "EMP003", "2026-04-07", "Half Day"),
  makeAtt("SA156", "EMP003", "2026-04-08", "Present"),
  makeAtt("SA157", "EMP003", "2026-04-09", "Present"),
  makeAtt("SA158", "EMP003", "2026-04-10", "Present"),
  makeAtt("SA159", "EMP003", "2026-04-11", "Present"),
  // April 2026 - EMP005
  makeAtt("SA160", "EMP005", "2026-04-01", "Present"),
  makeAtt("SA161", "EMP005", "2026-04-02", "Present"),
  makeAtt("SA162", "EMP005", "2026-04-03", "Present"),
  makeAtt("SA163", "EMP005", "2026-04-04", "Present"),
  makeAtt("SA164", "EMP005", "2026-04-07", "Present"),
  makeAtt("SA165", "EMP005", "2026-04-08", "Absent"),
  makeAtt("SA166", "EMP005", "2026-04-09", "Present"),
  makeAtt("SA167", "EMP005", "2026-04-10", "Present"),
  makeAtt("SA168", "EMP005", "2026-04-11", "Present"),
  // April 2026 - EMP007
  makeAtt("SA169", "EMP007", "2026-04-01", "Present"),
  makeAtt("SA170", "EMP007", "2026-04-02", "Present"),
  makeAtt("SA171", "EMP007", "2026-04-03", "Present"),
  makeAtt("SA172", "EMP007", "2026-04-04", "Present"),
  makeAtt("SA173", "EMP007", "2026-04-07", "Present"),
  makeAtt("SA174", "EMP007", "2026-04-08", "Present"),
  makeAtt("SA175", "EMP007", "2026-04-09", "Present"),
  makeAtt("SA176", "EMP007", "2026-04-10", "Present"),
  makeAtt("SA177", "EMP007", "2026-04-11", "Present"),
  // April 2026 - EMP008
  makeAtt("SA178", "EMP008", "2026-04-01", "Present"),
  makeAtt("SA179", "EMP008", "2026-04-02", "Present"),
  makeAtt("SA180", "EMP008", "2026-04-03", "Present"),
  makeAtt("SA181", "EMP008", "2026-04-04", "Present"),
  makeAtt("SA182", "EMP008", "2026-04-07", "Present"),
  makeAtt("SA183", "EMP008", "2026-04-08", "Present"),
  makeAtt("SA184", "EMP008", "2026-04-09", "Leave"),
  makeAtt("SA185", "EMP008", "2026-04-10", "Present"),
  makeAtt("SA186", "EMP008", "2026-04-11", "Present"),
];

// Aliases
export const mockStaff = staffData;
