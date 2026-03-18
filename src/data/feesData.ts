
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
    studentName: "Arjun Kumar", class: "12", board: "CBSE",
    feeType: "Standard", totalFee: 45000,
    instalments: {
      i1: { amount: 15000, date: "2026-01-10", collected: true, mode: "UPI" },
      i2: { amount: 15000, date: "2026-03-10", collected: false },
    },
    collected: 15000, balance: 30000,
    nextPaymentDate: "2026-03-10", branchId: "Trichy",
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
