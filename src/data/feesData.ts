
// src/data/feesData.ts

export interface FeeInstallment {
    id: string;
    installmentName: string; // e.g., "First Term", "Monthly - July"
    dueDate: string; // YYYY-MM-DD
    amount: number;
    status: "Paid" | "Pending" | "Overdue";
    paymentDate?: string; // YYYY-MM-DD
    paymentId?: string;
}

export interface FeeStructure {
    studentId: string;
    totalAnnualFee: number;
    scholarshipAmount: number;
    netPayable: number;
    installments: FeeInstallment[];
    branchId: string;
}

// Mock data for Arjun Kumar (STU001)
export const mockFeeData: FeeStructure = {
    studentId: "STU001",
    totalAnnualFee: 120000,
    scholarshipAmount: 20000,
    netPayable: 100000,
    branchId: "BR001",
    installments: [
        {
            id: "FEE001",
            installmentName: "First Installment",
            dueDate: "2024-04-10",
            amount: 25000,
            status: "Paid",
            paymentDate: "2024-04-08",
            paymentId: "PAY123456"
        },
        {
            id: "FEE002",
            installmentName: "Second Installment",
            dueDate: "2024-07-10",
            amount: 25000,
            status: "Paid",
            paymentDate: "2024-07-05",
            paymentId: "PAY123789"
        },
        {
            id: "FEE003",
            installmentName: "Third Installment",
            dueDate: "2024-10-10",
            amount: 25000,
            status: "Pending",
        },
        {
            id: "FEE004",
            installmentName: "Fourth Installment",
            dueDate: "2025-01-10",
            amount: 25000,
            status: "Pending",
        },
         {
            id: "FEE005",
            installmentName: "Previous Overdue", // Example of overdue
            dueDate: "2024-05-10",
            amount: 5000, // Maybe a miscellaneous fee
            status: "Overdue",
        },
    ]
};

export type PaymentMode = "Cash" | "UPI" | "Cheque" | "NEFT";

export interface Instalment {
  amount: number;
  date: string;
  collected: boolean;
  mode?: PaymentMode;
  paymentDate?: string;
}

export interface FeeRecord {
  id: string;
  billNo: string;
  studentId: string;
  studentName: string;
  class: string;
  board: string;
  subjects?: string[];
  feeType: string;
  totalFee: number;
  instalments: { i1?: Instalment; i2?: Instalment; i3?: Instalment; i4?: Instalment };
  collected: number;
  balance: number;
  nextPaymentDate?: string;
  notes?: string;
  branchId: string;
}

export const mockFeeRecords: FeeRecord[] = [
  {
    id: "FEE_REC_001", billNo: "BA-2026-0001", studentId: "STU001",
    studentName: "Arjun Kumar", class: "12", board: "CBSE", subjects: ["Physics", "Chemistry"],
    feeType: "Standard", totalFee: 45000,
    instalments: {
      i1: { amount: 15000, date: "2026-01-10", collected: true, mode: "UPI" },
      i2: { amount: 15000, date: "2026-03-10", collected: false },
      i3: { amount: 15000, date: "2026-06-10", collected: false },
    },
    collected: 15000, balance: 30000,
    nextPaymentDate: "2026-03-10", branchId: "Trichy",
  },
  {
    id: "FEE_REC_002", billNo: "BA-2026-0002", studentId: "STU002",
    studentName: "Priya Nair", class: "10", board: "CBSE", subjects: ["Math", "Science"],
    feeType: "Standard", totalFee: 42000,
    instalments: {
      i1: { amount: 14000, date: "2026-01-05", collected: true, mode: "Cash" },
      i2: { amount: 14000, date: "2026-04-05", collected: true, mode: "UPI" },
      i3: { amount: 14000, date: "2026-07-05", collected: false },
    },
    collected: 28000, balance: 14000,
    nextPaymentDate: "2026-07-05", branchId: "Trichy",
  },
  {
    id: "FEE_REC_003", billNo: "BA-2026-0003", studentId: "STU003",
    studentName: "Rohit Sharma", class: "9", board: "CBSE", subjects: ["Math", "English"],
    feeType: "Standard", totalFee: 36000,
    instalments: {
      i1: { amount: 12000, date: "2026-01-15", collected: true, mode: "Cheque" },
      i2: { amount: 12000, date: "2026-02-15", collected: false },
    },
    collected: 12000, balance: 24000,
    nextPaymentDate: "2026-02-15", branchId: "Trichy",
    notes: "2nd instalment overdue since Feb 15",
  },
  {
    id: "FEE_REC_004", billNo: "BA-2026-0004", studentId: "STU004",
    studentName: "Deepa Menon", class: "12", board: "State", subjects: ["Biology", "Chemistry"],
    feeType: "Standard", totalFee: 40000,
    instalments: {
      i1: { amount: 20000, date: "2026-01-01", collected: true, mode: "NEFT" },
      i2: { amount: 20000, date: "2026-04-01", collected: false },
    },
    collected: 20000, balance: 20000,
    nextPaymentDate: "2026-04-01", branchId: "Trichy",
  },
  {
    id: "FEE_REC_005", billNo: "BA-2026-0005", studentId: "STU005",
    studentName: "Karthik Raja", class: "11", board: "CBSE", subjects: ["Physics", "Math"],
    feeType: "Standard", totalFee: 48000,
    instalments: {
      i1: { amount: 16000, date: "2026-01-20", collected: true, mode: "UPI" },
      i2: { amount: 16000, date: "2026-02-20", collected: true, mode: "UPI" },
      i3: { amount: 16000, date: "2026-03-20", collected: true, mode: "Cash" },
    },
    collected: 48000, balance: 0,
    branchId: "Trichy",
  },
  {
    id: "FEE_REC_006", billNo: "BA-2026-0006", studentId: "STU006",
    studentName: "Meena Sundaram", class: "8", board: "ICSE", subjects: ["Science", "English"],
    feeType: "Standard", totalFee: 32000,
    instalments: {
      i1: { amount: 16000, date: "2026-01-08", collected: false },
    },
    collected: 0, balance: 32000,
    nextPaymentDate: "2026-01-08", branchId: "Trichy",
    notes: "No payment received. Parent unresponsive.",
  },
  // Discontinued students with fee balance
  {
    id: "FEE_REC_007", billNo: "BA-2025-0091", studentId: "STU_DIS_001",
    studentName: "Vikram Anand", class: "10", board: "CBSE", subjects: ["Math"],
    feeType: "Standard", totalFee: 30000,
    instalments: {
      i1: { amount: 10000, date: "2025-06-01", collected: true, mode: "Cash" },
      i2: { amount: 10000, date: "2025-08-01", collected: false },
    },
    collected: 10000, balance: 20000,
    nextPaymentDate: "2025-08-01", branchId: "Trichy",
    notes: "Student discontinued. Balance pending.",
  },
  {
    id: "FEE_REC_008", billNo: "BA-2025-0092", studentId: "STU_DIS_002",
    studentName: "Saranya Mani", class: "9", board: "State", subjects: ["Science", "Math"],
    feeType: "Standard", totalFee: 28000,
    instalments: {
      i1: { amount: 14000, date: "2025-07-01", collected: true, mode: "UPI" },
      i2: { amount: 14000, date: "2025-09-01", collected: false },
    },
    collected: 14000, balance: 14000,
    nextPaymentDate: "2025-09-01", branchId: "Trichy",
    notes: "Relocated. Balance not cleared.",
  },
];

// Fee data for another student, should not be visible
export const mockFeeDataOther: FeeStructure = {
    studentId: "STU002",
    totalAnnualFee: 110000,
    scholarshipAmount: 10000,
    netPayable: 100000,
    branchId: "BR001",
    installments: [
        { id: "FEE006", installmentName: "First Term", dueDate: "2024-05-10", amount: 50000, status: "Paid" },
        { id: "FEE007", installmentName: "Second Term", dueDate: "2024-09-10", amount: 50000, status: "Pending" },
    ]
};
