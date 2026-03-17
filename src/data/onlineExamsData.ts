
// src/data/onlineExamsData.ts

export interface OnlineExamQuestion {
    id: string;
    questionText: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
    marks: number;
}

export interface OnlineExam {
    id: string;
    title: string;
    subject: string;
    assignedToClass: string; // e.g., "12"
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM (24-hour)
    duration: number; // in minutes
    maxMarks: number;
    branchId: string;
    questions: OnlineExamQuestion[];
}

export interface StudentTestAttempt {
    examId: string;
    studentId: string;
    status: 'Completed' | 'Missed';
    score?: number;
    totalCorrect?: number;
    totalAttempted?: number;
}

export const mockOnlineExams: OnlineExam[] = [
    {
        id: "EXAM001",
        title: "Physics - Monthly Test (Chapters 1-3)",
        subject: "Physics",
        assignedToClass: "12",
        date: "2024-08-20",
        startTime: "10:00",
        duration: 45,
        maxMarks: 50,
        branchId: "BR001",
        questions: [
            { id: "Q1", questionText: "What is the SI unit of electric charge?", options: [{id: "O1", text: "Ampere"}, {id: "O2", text: "Coulomb"}, {id: "O3", text: "Volt"}], correctOptionId: "O2", marks: 5 },
            { id: "Q2", questionText: "Which law governs the force between two static point charges?", options: [{id: "O1", text: "Gauss's Law"}, {id: "O2", text: "Ohm's Law"}, {id: "O3", text: "Coulomb's Law"}], correctOptionId: "O3", marks: 5 },
        ]
    },
    {
        id: "EXAM002",
        title: "Chemistry - Unit Test: The Solid State",
        subject: "Chemistry",
        assignedToClass: "12",
        date: "2024-08-25",
        startTime: "14:00",
        duration: 30,
        maxMarks: 30,
        branchId: "BR001",
        questions: [] // Questions can be empty for list view
    },
    {
        id: "EXAM003",
        title: "Mathematics - Mid-Term Mock Exam",
        subject: "Mathematics",
        assignedToClass: "12",
        date: "2024-09-05",
        startTime: "09:00",
        duration: 90,
        maxMarks: 100,
        branchId: "BR001",
        questions: []
    },
    {
        id: "EXAM004",
        title: "Chemistry - Half-Yearly Exam",
        subject: "Chemistry",
        assignedToClass: "12",
        date: "2024-07-15", // Past date
        startTime: "11:00",
        duration: 60,
        maxMarks: 75,
        branchId: "BR001",
        questions: []
    },
    {
        id: "EXAM005",
        title: "Physics - Revision Test",
        subject: "Physics",
        assignedToClass: "12",
        date: "2024-07-10", // Past date
        startTime: "15:00",
        duration: 45,
        maxMarks: 50,
        branchId: "BR001",
        questions: []
    },
    {
        id: "EXAM006",
        title: "Biology - Final Mock", // Different class
        subject: "Biology",
        assignedToClass: "11",
        date: "2024-08-30",
        startTime: "10:00",
        duration: 60,
        maxMarks: 70,
        branchId: "BR001",
        questions: []
    }
];

// Mock data representing a student's attempts
export const mockStudentTestAttempts: StudentTestAttempt[] = [
    {
        examId: "EXAM004",
        studentId: "STU001",
        status: 'Completed',
        score: 60,
        totalCorrect: 12,
        totalAttempted: 15,
    },
    {
        examId: "EXAM005",
        studentId: "STU001", // Same student
        status: 'Missed',
    }
];
