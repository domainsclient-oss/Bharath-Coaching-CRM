
// expenditureData.ts

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: "Utilities" | "Salaries" | "Rent" | "Maintenance" | "Equipment" | "Marketing" | "Other";
  vendor?: string;
  description: string;
  amount: number;
  paymentMethod: "Cash" | "Bank Transfer" | "Cheque" | "Online";
  status: "Paid" | "Pending";
  receiptUrl?: string;
  branchId: string;
}

export const mockExpenses: Expense[] = [
  {
    id: "EXP001",
    date: "2024-07-25",
    category: "Utilities",
    description: "Electricity Bill - July 2024",
    amount: 15000,
    paymentMethod: "Online",
    status: "Paid",
    vendor: "TNEB",
    branchId: "BR001",
  },
  {
    id: "EXP002",
    date: "2024-07-28",
    category: "Maintenance",
    description: "Air Conditioner Servicing for 3 units",
    amount: 4500,
    paymentMethod: "Cash",
    status: "Paid",
    vendor: "Cool Services Trichy",
    branchId: "BR001",
  },
  {
    id: "EXP003",
    date: "2024-07-30",
    category: "Rent",
    description: "Building Rent - August 2024",
    amount: 75000,
    paymentMethod: "Bank Transfer",
    status: "Pending",
    vendor: "K. Ramasamy",
    branchId: "BR002",
  },
  {
    id: "EXP004",
    date: "2024-07-15",
    category: "Marketing",
    description: "Newspaper Ad for Admissions",
    amount: 8000,
    paymentMethod: "Cheque",
    status: "Paid",
    vendor: "The Hindu Group",
    branchId: "BR001",
  },
  {
    id: "EXP005",
    date: "2024-08-01",
    category: "Equipment",
    description: "Purchase of 50 new classroom chairs",
    amount: 40000,
    paymentMethod: "Bank Transfer",
    status: "Pending",
    vendor: "National Furniture",
    branchId: "BR003",
  },
  {
    id: "EXP006",
    date: "2024-06-20",
    category: "Other",
    description: "Staff team lunch",
    amount: 3500,
    paymentMethod: "Cash",
    status: "Paid",
    vendor: "Sangeetha Restaurant",
    branchId: "BR001",
  },
  {
    id: "EXP007",
    date: "2024-06-25",
    category: "Utilities",
    description: "Internet Bill - June 2024",
    amount: 2500,
    paymentMethod: "Online",
    status: "Paid",
    vendor: "Jio Fiber",
    branchId: "BR002",
  },
];
