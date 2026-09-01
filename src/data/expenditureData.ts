export type ExpenseCategory =
  | "Rent"
  | "Electricity"
  | "Water"
  | "Internet"
  | "Salary"
  | "Stationery"
  | "Maintenance"
  | "Staff Refreshment"
  | "Marketing"
  | "Furniture"
  | "Equipment"
  | "Miscellaneous";

export type ExpensePaymentMode = "Cash" | "UPI" | "Cheque" | "NEFT" | "Card";

export interface Expense {
  id: string;
  date: string;         // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMode: ExpensePaymentMode;
  paidTo: string;
  billNo?: string;
  notes?: string;
  createdBy: string;
  branchId: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Rent", "Electricity", "Water", "Internet", "Salary",
  "Stationery", "Maintenance", "Staff Refreshment",
  "Marketing", "Furniture", "Equipment", "Miscellaneous",
];

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  "Rent":              "bg-blue-100 text-blue-700",
  "Electricity":       "bg-yellow-100 text-yellow-700",
  "Water":             "bg-cyan-100 text-cyan-700",
  "Internet":          "bg-indigo-100 text-indigo-700",
  "Salary":            "bg-green-100 text-green-700",
  "Stationery":        "bg-slate-100 text-slate-700",
  "Maintenance":       "bg-orange-100 text-orange-700",
  "Staff Refreshment": "bg-pink-100 text-pink-700",
  "Marketing":         "bg-purple-100 text-purple-700",
  "Furniture":         "bg-amber-100 text-amber-700",
  "Equipment":         "bg-teal-100 text-teal-700",
  "Miscellaneous":     "bg-rose-100 text-rose-700",
};

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  "Rent":              "🏠",
  "Electricity":       "⚡",
  "Water":             "💧",
  "Internet":          "🌐",
  "Salary":            "💵",
  "Stationery":        "📝",
  "Maintenance":       "🔧",
  "Staff Refreshment": "☕",
  "Marketing":         "📢",
  "Furniture":         "🪑",
  "Equipment":         "💻",
  "Miscellaneous":     "📦",
};

export const mockExpenses: Expense[] = [
  {
    id: "EXP001", date: "2026-01-05", category: "Rent",
    description: "January office rent", amount: 25000,
    paymentMode: "Cheque", paidTo: "Ramesh Landlord",
    billNo: "RENT-JAN-2026", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP002", date: "2026-01-10", category: "Electricity",
    description: "EB bill for December 2025", amount: 4800,
    paymentMode: "UPI", paidTo: "TNEB",
    billNo: "EB-DEC-2025", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP003", date: "2026-01-12", category: "Internet",
    description: "Broadband monthly bill", amount: 1500,
    paymentMode: "UPI", paidTo: "BSNL",
    billNo: "NET-JAN-2026", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP004", date: "2026-01-15", category: "Stationery",
    description: "A4 paper, pens, markers for classrooms", amount: 2200,
    paymentMode: "Cash", paidTo: "Senthil Stationery",
    billNo: "STN-001", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP005", date: "2026-01-20", category: "Maintenance",
    description: "AC servicing — 3 units", amount: 3600,
    paymentMode: "Cash", paidTo: "Cool Service Centre",
    billNo: "MAINT-001", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP006", date: "2026-01-22", category: "Staff Refreshment",
    description: "Tea, coffee, snacks for staff monthly", amount: 1800,
    paymentMode: "Cash", paidTo: "Canteen",
    createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP007", date: "2026-01-25", category: "Marketing",
    description: "Pamphlet printing — 1000 copies", amount: 3500,
    paymentMode: "UPI", paidTo: "Star Printers",
    billNo: "PRT-2026-01", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP008", date: "2026-02-01", category: "Rent",
    description: "February office rent", amount: 25000,
    paymentMode: "Cheque", paidTo: "Ramesh Landlord",
    billNo: "RENT-FEB-2026", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP009", date: "2026-02-05", category: "Equipment",
    description: "Projector lamp replacement", amount: 4200,
    paymentMode: "NEFT", paidTo: "TechZone Electronics",
    billNo: "EQ-001", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP010", date: "2026-02-08", category: "Electricity",
    description: "EB bill for January 2026", amount: 5200,
    paymentMode: "UPI", paidTo: "TNEB",
    billNo: "EB-JAN-2026", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP011", date: "2026-02-14", category: "Stationery",
    description: "Answer sheets for exam", amount: 1200,
    paymentMode: "Cash", paidTo: "Senthil Stationery",
    billNo: "STN-002", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP012", date: "2026-03-01", category: "Rent",
    description: "March office rent", amount: 25000,
    paymentMode: "Cheque", paidTo: "Ramesh Landlord",
    billNo: "RENT-MAR-2026", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP013", date: "2026-03-05", category: "Marketing",
    description: "Social media ad campaign — March", amount: 5000,
    paymentMode: "Card", paidTo: "Facebook Ads",
    billNo: "MKT-MAR-001", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP014", date: "2026-03-10", category: "Furniture",
    description: "New study chairs — 10 units", amount: 12000,
    paymentMode: "NEFT", paidTo: "Home Centre",
    billNo: "FURN-001", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP015", date: "2026-03-15", category: "Miscellaneous",
    description: "Postage and courier charges", amount: 450,
    paymentMode: "Cash", paidTo: "DTDC",
    createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP016", date: "2026-03-20", category: "Water",
    description: "Water tanker supply — March", amount: 2000,
    paymentMode: "Cash", paidTo: "Murugan Water Supply",
    createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP017", date: "2026-04-01", category: "Rent",
    description: "April office rent", amount: 25000,
    paymentMode: "Cheque", paidTo: "Ramesh Landlord",
    billNo: "RENT-APR-2026", createdBy: "Admin", branchId: "Trichy",
  },
  {
    id: "EXP018", date: "2026-04-05", category: "Electricity",
    description: "EB bill for March 2026", amount: 5800,
    paymentMode: "UPI", paidTo: "TNEB",
    billNo: "EB-MAR-2026", createdBy: "Admin", branchId: "Trichy",
  },
];
