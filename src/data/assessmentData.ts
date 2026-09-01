// assessmentData.ts

export type QuestionType = "MCQ" | "Short Answer" | "True/False";
export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export interface Question {
  id: string;
  subject: string;
  class: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string; // index "0-3" for MCQ, "True"/"False" for T/F, text for Short Answer
  marks: number;
  difficulty: DifficultyLevel;
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
  status: "Draft" | "Published" | "Completed";
  assignedToClass: string;
  branchId: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, string>;
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

// ── Questions ─────────────────────────────────────────────────────────────
export const mockQuestions: Question[] = [
  // Physics — Class 12
  { id: "QST001", subject: "Physics", class: "12", type: "MCQ", question: "What is the SI unit of electric current?", options: ["Volt", "Ampere", "Ohm", "Watt"], correctAnswer: "1", marks: 1, difficulty: "Easy", branchId: "Trichy" },
  { id: "QST002", subject: "Physics", class: "12", type: "MCQ", question: "Which law states that F = ma?", options: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Conservation"], correctAnswer: "1", marks: 1, difficulty: "Easy", branchId: "Trichy" },
  { id: "QST003", subject: "Physics", class: "12", type: "Short Answer", question: "State Newton's second law of motion and write its equation.", correctAnswer: "The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. F = ma.", marks: 3, difficulty: "Medium", branchId: "Trichy" },
  { id: "QST004", subject: "Physics", class: "12", type: "True/False", question: "Light travels faster in water than in air.", correctAnswer: "False", marks: 1, difficulty: "Easy", branchId: "Trichy" },
  { id: "QST005", subject: "Physics", class: "12", type: "MCQ", question: "The wavelength of visible light ranges approximately from:", options: ["100–200 nm", "200–380 nm", "380–700 nm", "700–1000 nm"], correctAnswer: "2", marks: 2, difficulty: "Medium", branchId: "Trichy" },
  { id: "QST006", subject: "Physics", class: "12", type: "Short Answer", question: "Explain the photoelectric effect briefly.", correctAnswer: "The photoelectric effect is the emission of electrons from a metal surface when electromagnetic radiation of sufficient frequency is incident on it.", marks: 4, difficulty: "Hard", branchId: "Trichy" },

  // Chemistry — Class 12
  { id: "QST007", subject: "Chemistry", class: "12", type: "MCQ", question: "What is the valency of Carbon?", options: ["1", "2", "3", "4"], correctAnswer: "3", marks: 1, difficulty: "Easy", branchId: "Trichy" },
  { id: "QST008", subject: "Chemistry", class: "12", type: "True/False", question: "Acids turn blue litmus paper red.", correctAnswer: "True", marks: 1, difficulty: "Easy", branchId: "Trichy" },
  { id: "QST009", subject: "Chemistry", class: "12", type: "Short Answer", question: "Define Avogadro's number and state its value.", correctAnswer: "Avogadro's number is the number of particles in one mole of substance, approximately 6.022 × 10²³.", marks: 2, difficulty: "Medium", branchId: "Trichy" },
  { id: "QST010", subject: "Chemistry", class: "12", type: "MCQ", question: "Which of the following is an example of an exothermic reaction?", options: ["Photosynthesis", "Dissolving ammonium chloride in water", "Combustion of carbon", "Electrolysis of water"], correctAnswer: "2", marks: 2, difficulty: "Medium", branchId: "Trichy" },

  // Mathematics — Class 12
  { id: "QST011", subject: "Mathematics", class: "12", type: "MCQ", question: "What is the derivative of x²?", options: ["2x", "x", "x²/2", "2"], correctAnswer: "0", marks: 1, difficulty: "Easy", branchId: "Trichy" },
  { id: "QST012", subject: "Mathematics", class: "12", type: "MCQ", question: "∫ sin(x) dx = ?", options: ["cos(x) + C", "-cos(x) + C", "sin(x) + C", "-sin(x) + C"], correctAnswer: "1", marks: 2, difficulty: "Medium", branchId: "Trichy" },
  { id: "QST013", subject: "Mathematics", class: "12", type: "True/False", question: "The matrix product AB is always equal to BA.", correctAnswer: "False", marks: 1, difficulty: "Medium", branchId: "Trichy" },
  { id: "QST014", subject: "Mathematics", class: "12", type: "Short Answer", question: "Find the value of lim(x→0) sin(x)/x.", correctAnswer: "The limit is 1. This is a standard limit proved using the squeeze theorem.", marks: 3, difficulty: "Hard", branchId: "Trichy" },

  // Biology — Class 11
  { id: "QST015", subject: "Biology", class: "11", type: "True/False", question: "The mitochondria is known as the powerhouse of the cell.", correctAnswer: "True", marks: 1, difficulty: "Easy", branchId: "Trichy" },
  { id: "QST016", subject: "Biology", class: "11", type: "MCQ", question: "Which organelle is responsible for protein synthesis?", options: ["Mitochondria", "Ribosome", "Golgi apparatus", "Lysosome"], correctAnswer: "1", marks: 1, difficulty: "Easy", branchId: "Trichy" },
  { id: "QST017", subject: "Biology", class: "11", type: "Short Answer", question: "What is the role of the nucleus in a cell?", correctAnswer: "The nucleus controls cell activities, contains genetic material (DNA), and regulates gene expression and protein synthesis.", marks: 3, difficulty: "Medium", branchId: "Trichy" },
  { id: "QST018", subject: "Biology", class: "11", type: "MCQ", question: "Photosynthesis takes place in which organelle?", options: ["Mitochondria", "Nucleus", "Chloroplast", "Ribosome"], correctAnswer: "2", marks: 1, difficulty: "Easy", branchId: "Trichy" },

  // Chemistry — Class 11
  { id: "QST019", subject: "Chemistry", class: "11", type: "MCQ", question: "Which gas is produced when zinc reacts with hydrochloric acid?", options: ["Oxygen", "Carbon dioxide", "Hydrogen", "Chlorine"], correctAnswer: "2", marks: 1, difficulty: "Easy", branchId: "Trichy" },
  { id: "QST020", subject: "Chemistry", class: "11", type: "Short Answer", question: "What is the periodic law? State it.", correctAnswer: "The physical and chemical properties of elements are periodic functions of their atomic numbers.", marks: 2, difficulty: "Medium", branchId: "Trichy" },

  // Mathematics — Class 10
  { id: "QST021", subject: "Mathematics", class: "10", type: "MCQ", question: "What is the sum of angles in a triangle?", options: ["90°", "180°", "270°", "360°"], correctAnswer: "1", marks: 1, difficulty: "Easy", branchId: "Trichy" },
  { id: "QST022", subject: "Mathematics", class: "10", type: "True/False", question: "Every square is a rectangle.", correctAnswer: "True", marks: 1, difficulty: "Easy", branchId: "Trichy" },
  { id: "QST023", subject: "Mathematics", class: "10", type: "Short Answer", question: "State the Pythagoras theorem.", correctAnswer: "In a right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides: a² + b² = c².", marks: 2, difficulty: "Medium", branchId: "Trichy" },
];

// ── Online Exams ──────────────────────────────────────────────────────────
export const mockOnlineExams: OnlineExam[] = [
  {
    id: "OEX001",
    title: "Physics Unit Test — Waves & Optics",
    class: "12",
    subject: "Physics",
    teacherId: "EMP002",
    dateTime: "2026-04-20T10:00:00",
    durationMins: 30,
    instructions: "Read all questions carefully. No negative marking. Submit before time runs out.",
    questionIds: ["QST001", "QST002", "QST004", "QST005"],
    totalMarks: 5,
    status: "Published",
    assignedToClass: "12",
    branchId: "Trichy",
  },
  {
    id: "OEX002",
    title: "Chemistry Mid-Term Quiz",
    class: "12",
    subject: "Chemistry",
    teacherId: "EMP003",
    dateTime: "2026-04-22T09:00:00",
    durationMins: 45,
    instructions: "All questions are mandatory. Write clearly for short answers.",
    questionIds: ["QST007", "QST008", "QST009", "QST010"],
    totalMarks: 6,
    status: "Published",
    assignedToClass: "12",
    branchId: "Trichy",
  },
  {
    id: "OEX003",
    title: "Mathematics Chapter 6 Test",
    class: "12",
    subject: "Mathematics",
    teacherId: "EMP002",
    dateTime: "2026-04-25T11:00:00",
    durationMins: 60,
    instructions: "Show all steps for short answer questions.",
    questionIds: ["QST011", "QST012", "QST013", "QST014"],
    totalMarks: 7,
    status: "Draft",
    assignedToClass: "12",
    branchId: "Trichy",
  },
  {
    id: "OEX004",
    title: "Biology Cell Structure Quiz",
    class: "11",
    subject: "Biology",
    teacherId: "EMP008",
    dateTime: "2026-04-18T10:00:00",
    durationMins: 20,
    instructions: "This is a quick quiz. All the best!",
    questionIds: ["QST015", "QST016", "QST018"],
    totalMarks: 3,
    status: "Completed",
    assignedToClass: "11",
    branchId: "Trichy",
  },
];

// ── Exam Results ──────────────────────────────────────────────────────────
export const mockExamResults: ExamResult[] = [
  { id: "RES001", examId: "OEX004", studentId: "STU009", studentName: "Kiran Raj", answers: { QST015: "True", QST016: "1", QST018: "2" }, startTime: "2026-04-18T10:00:10Z", endTime: "2026-04-18T10:17:30Z", score: 3, totalMarks: 3, correct: 3, wrong: 0, skipped: 0, percentage: 100, grade: "A+", branchId: "Trichy" },
  { id: "RES002", examId: "OEX004", studentId: "STU001", studentName: "Arjun Krishnan", answers: { QST015: "True", QST016: "0", QST018: "2" }, startTime: "2026-04-18T10:01:00Z", endTime: "2026-04-18T10:18:00Z", score: 2, totalMarks: 3, correct: 2, wrong: 1, skipped: 0, percentage: 67, grade: "B+", branchId: "Trichy" },
  { id: "RES003", examId: "OEX004", studentId: "STU005", studentName: "Nisha Menon", answers: { QST015: "True", QST016: "1" }, startTime: "2026-04-18T10:00:30Z", endTime: "2026-04-18T10:15:00Z", score: 2, totalMarks: 3, correct: 2, wrong: 0, skipped: 1, percentage: 67, grade: "B+", branchId: "Trichy" },
  { id: "RES004", examId: "OEX001", studentId: "STU001", studentName: "Arjun Krishnan", answers: { QST001: "1", QST002: "1", QST004: "False" }, startTime: "2026-04-20T10:00:15Z", endTime: "2026-04-20T10:25:00Z", score: 3, totalMarks: 5, correct: 3, wrong: 0, skipped: 1, percentage: 60, grade: "B", branchId: "Trichy" },
];
