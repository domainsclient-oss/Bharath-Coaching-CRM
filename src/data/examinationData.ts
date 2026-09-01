export interface Exam {
  id: string;
  name: string;
  class: string;
  board: string;
  subject: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  maxMarks: number;
  passMarks: number;
  examiner?: string;
  status: "Scheduled" | "Completed";
  branchId: string;
}

export const mockExams: Exam[] = [
  {
    id: "EXM001", name: "Unit Test 1 — Physics",
    class: "12", board: "CBSE", subject: "Physics",
    date: "2026-04-15", startTime: "10:00", endTime: "11:30",
    maxMarks: 100, passMarks: 35, examiner: "Rajesh Kumar",
    status: "Scheduled", branchId: "Trichy",
  },
  {
    id: "EXM002", name: "Quarterly Exam — Mathematics",
    class: "10", board: "CBSE", subject: "Mathematics",
    date: "2026-03-20", startTime: "14:00", endTime: "16:00",
    maxMarks: 100, passMarks: 40, examiner: "Priya Sharma",
    status: "Completed", branchId: "Trichy",
  },
  {
    id: "EXM003", name: "Mid-Term — Chemistry",
    class: "11", board: "CBSE", subject: "Chemistry",
    date: "2026-04-20", startTime: "10:00", endTime: "12:00",
    maxMarks: 70, passMarks: 25, examiner: "Karthik Raja",
    status: "Scheduled", branchId: "Trichy",
  },
  {
    id: "EXM004", name: "Unit Test 1 — Biology",
    class: "12", board: "CBSE", subject: "Biology",
    date: "2026-04-18", startTime: "10:00", endTime: "11:00",
    maxMarks: 50, passMarks: 18, examiner: "Priya Sharma",
    status: "Scheduled", branchId: "Trichy",
  },
  {
    id: "EXM005", name: "Half-Yearly — Mathematics",
    class: "9", board: "CBSE", subject: "Mathematics",
    date: "2026-03-05", startTime: "09:00", endTime: "11:00",
    maxMarks: 100, passMarks: 35, examiner: "Suresh Raina",
    status: "Completed", branchId: "Trichy",
  },
  {
    id: "EXM006", name: "Unit Test 1 — English",
    class: "10", board: "CBSE", subject: "English",
    date: "2026-04-22", startTime: "10:00", endTime: "11:00",
    maxMarks: 50, passMarks: 20, examiner: "Priya Sharma",
    status: "Scheduled", branchId: "Trichy",
  },
];
