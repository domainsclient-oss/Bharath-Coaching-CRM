
// src/data/marksData.ts

export interface MarksRecord {
    id: string;
    studentId: string;
    subject: string;
    testName: string;
    date: string; // YYYY-MM-DD
    marksObtained: number;
    maxMarks: number;
    branchId: string;
    // Examination-specific fields
    examId?: string;
    studentName?: string;
    status?: "Present" | "Absent";
    grade?: string | null;
}

// Mock data for Arjun Kumar (STU001)
export const mockMarksData: MarksRecord[] = [
    {
        id: "M001",
        studentId: "STU001",
        subject: "Physics",
        testName: "Unit Test 1",
        date: "2024-06-15",
        marksObtained: 42,
        maxMarks: 50,
        branchId: "BR001"
    },
    {
        id: "M002",
        studentId: "STU001",
        subject: "Chemistry",
        testName: "Unit Test 1",
        date: "2024-06-18",
        marksObtained: 38,
        maxMarks: 50,
        branchId: "BR001"
    },
    {
        id: "M003",
        studentId: "STU001",
        subject: "Mathematics",
        testName: "Class Test - Algebra",
        date: "2024-07-02",
        marksObtained: 22,
        maxMarks: 25,
        branchId: "BR001"
    },
    {
        id: "M004",
        studentId: "STU001",
        subject: "Physics",
        testName: "Half-Yearly Exam",
        date: "2024-08-05",
        marksObtained: 65,
        maxMarks: 75,
        branchId: "BR001"
    },
    {
        id: "M005",
        studentId: "STU001",
        subject: "Chemistry",
        testName: "Half-Yearly Exam",
        date: "2024-08-08",
        marksObtained: 61,
        maxMarks: 75,
        branchId: "BR001"
    },
    // Data for another student
    {
        id: "M006",
        studentId: "STU002",
        subject: "Physics",
        testName: "Unit Test 1",
        date: "2024-06-15",
        marksObtained: 45,
        maxMarks: 50,
        branchId: "BR001"
    }
];

// Aliases used by page components
export const mockMarks = mockMarksData;
export type Mark = MarksRecord;
