export interface MarksRecord {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  subject: string;
  testName: string;
  date: string;           // YYYY-MM-DD
  marksObtained: number;
  maxMarks: number;
  status: "Present" | "Absent";
  grade: string | null;
  branchId: string;
}

export const mockMarksData: MarksRecord[] = [
  // EXM002 — Quarterly Math, Class 10 (Completed)
  { id: "M001", examId: "EXM002", studentId: "STU001", studentName: "Arjun Krishnan",
    subject: "Mathematics", testName: "Quarterly Exam — Mathematics",
    date: "2026-03-20", marksObtained: 82, maxMarks: 100,
    status: "Present", grade: "A", branchId: "Trichy" },
  { id: "M002", examId: "EXM002", studentId: "STU005", studentName: "Kavin Raj",
    subject: "Mathematics", testName: "Quarterly Exam — Mathematics",
    date: "2026-03-20", marksObtained: 55, maxMarks: 100,
    status: "Present", grade: "C+", branchId: "Trichy" },
  { id: "M003", examId: "EXM002", studentId: "STU011", studentName: "Harish Kumar",
    subject: "Mathematics", testName: "Quarterly Exam — Mathematics",
    date: "2026-03-20", marksObtained: 91, maxMarks: 100,
    status: "Present", grade: "A+", branchId: "Trichy" },
  { id: "M004", examId: "EXM002", studentId: "STU013", studentName: "Nithin S",
    subject: "Mathematics", testName: "Quarterly Exam — Mathematics",
    date: "2026-03-20", marksObtained: 38, maxMarks: 100,
    status: "Present", grade: "F", branchId: "Trichy" },

  // EXM005 — Half-Yearly Math, Class 9 (Completed)
  { id: "M005", examId: "EXM005", studentId: "STU002", studentName: "Meera Nair",
    subject: "Mathematics", testName: "Half-Yearly — Mathematics",
    date: "2026-03-05", marksObtained: 78, maxMarks: 100,
    status: "Present", grade: "B+", branchId: "Trichy" },
  { id: "M006", examId: "EXM005", studentId: "STU010", studentName: "Ananya Murali",
    subject: "Mathematics", testName: "Half-Yearly — Mathematics",
    date: "2026-03-05", marksObtained: 64, maxMarks: 100,
    status: "Present", grade: "B", branchId: "Trichy" },
];

// Aliases used by page components
export const mockMarks = mockMarksData;
export type Mark = MarksRecord;
