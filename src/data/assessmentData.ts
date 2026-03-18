
// assessmentData.ts

export interface Question {
  id: string;
  subject: string;
  class: string;
  type: "MCQ" | "Short Answer" | "True/False";
  question: string;
  options?: string[]; // For MCQ
  correctAnswer: string; // Index (0-3) for MCQ, "True"/"False" for T/F, or answer text for Short Answer
  marks: number;
  difficulty: "Easy" | "Medium" | "Hard";
  branchId: string;
}

export interface OnlineExam {
  id: string;
  title: string;
  class: string;
  subject: string;
  teacherId: string;
  dateTime: string;
  durationMins: number;
  instructions?: string;
  questionIds: string[];
  totalMarks: number;
  status: "Draft" | "Published";
  assignedToClass: string;
  branchId: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string; // Denormalized for display
  answers: { [questionId: string]: string };
  startTime: string;
  endTime: string;
  score: number;
  totalMarks: number;
  correct: number;
  wrong: number;
  skipped: number;
  percentage: number;
  grade: string;
  branchId: string;
}

export const mockQuestions: Question[] = [
  {
    id: "QST001",
    subject: "Physics",
    class: "12",
    type: "MCQ",
    question: "What is the unit of electric current?",
    options: ["Volt", "Ampere", "Ohm", "Watt"],
    correctAnswer: "1", // Index of "Ampere"
    marks: 1,
    difficulty: "Easy",
    branchId: "BR001",
  },
  {
    id: "QST002",
    subject: "Chemistry",
    class: "11",
    type: "Short Answer",
    question: "Define Avogadro's number and state its value.",
    correctAnswer: "The number of constituent particles (atoms, molecules, ions) that are contained in one mole of a substance, approximately 6.022 x 10^23.",
    marks: 2,
    difficulty: "Medium",
    branchId: "BR001",
  },
  {
    id: "QST003",
    subject: "Biology",
    class: "10",
    type: "True/False",
    question: "The mitochondria is the powerhouse of the cell.",
    correctAnswer: "True",
    marks: 1,
    difficulty: "Easy",
    branchId: "BR002",
  },
  {
    id: "QST004",
    subject: "Mathematics",
    class: "12",
    type: "MCQ",
    question: "What is the derivative of x^2?",
    options: ["2x", "x", "x^2/2", "2"],
    correctAnswer: "0",
    marks: 1,
    difficulty: "Easy",
    branchId: "BR001",
  },
  {
    id: "QST005",
    subject: "Physics",
    class: "12",
    type: "Short Answer",
    question: "State Newton's second law of motion.",
    correctAnswer: "The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass (F=ma).",
    marks: 3,
    difficulty: "Medium",
    branchId: "BR003",
  },
    {
    id: "QST006",
    subject: "History",
    class: "10",
    type: "True/False",
    question: "The first World War ended in 1920.",
    correctAnswer: "False",
    marks: 1,
    difficulty: "Easy",
    branchId: "BR001",
  },
];

export const mockOnlineExams: OnlineExam[] = [
    {
        id: "OEX001",
        title: "Physics Unit Test 1",
        class: "12",
        subject: "Physics",
        teacherId: "TCHR001",
        dateTime: "2025-06-15T10:00:00",
        durationMins: 30,
        instructions: "Read all questions carefully. There is no negative marking.",
        questionIds: ["QST001", "QST004", "QST005"],
        totalMarks: 5,
        status: "Published",
        assignedToClass: "12",
        branchId: "BR001",
    }
];

export const mockExamResults: ExamResult[] = [
  {
    id: "RES001",
    examId: "OEX001",
    studentId: "ROLL001", // Arjun Kumar
    studentName: "Arjun Kumar",
    answers: { QST001: "1", QST004: "0", QST005: "Some answer" },
    startTime: "2025-06-15T10:00:10Z",
    endTime: "2025-06-15T10:25:30Z",
    score: 5,
    totalMarks: 5,
    correct: 3,
    wrong: 0,
    skipped: 0,
    percentage: 100,
    grade: "A+",
    branchId: "BR001",
  },
  {
    id: "RES002",
    examId: "OEX001",
    studentId: "ROLL002", // Priya Sharma
    studentName: "Priya Sharma",
    answers: { QST001: "1", QST004: "1", QST005: "Some answer" },
    startTime: "2025-06-15T10:01:00Z",
    endTime: "2025-06-15T10:28:00Z",
    score: 2,
    totalMarks: 5,
    correct: 2,
    wrong: 1,
    skipped: 0,
    percentage: 40,
    grade: "D",
    branchId: "BR001",
  },
  {
    id: "RES003",
    examId: "OEX001",
    studentId: "ROLL003", // Sanjay Patel
    studentName: "Sanjay Patel",
    answers: { QST001: "1", QST004: "0" },
    startTime: "2025-06-15T10:00:30Z",
    endTime: "2025-06-15T10:15:00Z",
    score: 2,
    totalMarks: 5,
    correct: 2,
    wrong: 0,
    skipped: 1,
    percentage: 40,
    grade: "D",
    branchId: "BR001",
  },
    {
    id: "RES004",
    examId: "OEX001",
    studentId: "ROLL005", // David Miller
    studentName: "David Miller",
    answers: { QST001: "1", QST004: "0", QST005: "Some answer" },
    startTime: "2025-06-15T10:00:15Z",
    endTime: "2025-06-15T10:22:00Z",
    score: 4,
    totalMarks: 5,
    correct: 2,
    wrong: 1,
    skipped: 0,
    percentage: 80,
    grade: "A",
    branchId: "BR003", // This one is in another branch, so it shouldn't show up
  },
];
