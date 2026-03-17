
import { BranchId } from "@/lib/branch-context";

export type PaymentMode = "Cash" | "UPI" | "Cheque" | "NEFT";

export interface Instalment {
  amount: number;
  date: string;
  mode: PaymentMode;
  collected: boolean;
}

export interface FeeRecord {
  id: string;
  billNo: string;
  studentId: string;
  studentName: string;
  class: string;
  board: string;
  subjects: string[];
  feeType: "Standard" | "OneToOne";
  totalFee: number;
  instalments: {
    i1?: Instalment;
    i2?: Instalment;
    i3?: Instalment;
  };
  collected: number;
  balance: number;
  nextPaymentDate?: string;
  notes?: string;
  branchId: BranchId;
}

export const mockFeeRecords: FeeRecord[] = [
  {
    id: "FEE001",
    billNo: "BA-2025-0001",
    studentId: "STU001",
    studentName: "Riya Sharma",
    class: "10",
    board: "CBSE",
    subjects: ["Math", "Science"],
    feeType: "Standard",
    totalFee: 12000,
    instalments: {
      i1: { amount: 6000, date: "2025-03-01", mode: "UPI", collected: true },
      i2: { amount: 6000, date: "2025-04-01", mode: "Cash", collected: false },
    },
    collected: 6000,
    balance: 6000,
    nextPaymentDate: "2025-04-01",
    branchId: "BR001",
  },
  {
    id: "FEE002",
    billNo: "BA-2025-0002",
    studentId: "STU002",
    studentName: "Kiran Raj",
    class: "9",
    board: "State",
    subjects: ["English", "Social Science"],
    feeType: "Standard",
    totalFee: 8000,
    instalments: {
      i1: { amount: 8000, date: "2025-03-05", mode: "Cash", collected: true },
    },
    collected: 8000,
    balance: 0,
    branchId: "BR001",
  },
   {
    id: "FEE003",
    billNo: "BA-2025-0003",
    studentId: "STU003",
    studentName: "Priya S",
    class: "11",
    board: "ICSE",
    subjects: ["Physics", "Chemistry", "Math"],
    feeType: "OneToOne",
    totalFee: 25000,
    instalments: {
      i1: { amount: 10000, date: "2025-03-10", mode: "NEFT", collected: true },
      i2: { amount: 10000, date: "2025-04-10", mode: "UPI", collected: false },
      i3: { amount: 5000, date: "2025-05-10", mode: "Cash", collected: false },
    },
    collected: 10000,
    balance: 15000,
    nextPaymentDate: "2025-04-10",
    branchId: "BR002",
  },
];
