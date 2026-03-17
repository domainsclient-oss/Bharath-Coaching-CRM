
export interface Exam {
  id: string;
  name: string;
  class: string;
  board: string;
  subject: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  maxMarks: number;
  passMarks: number;
  examiner: string;
  status: "Scheduled" | "Completed";
  branchId: string;
}

export const mockExams: Exam[] = [
  {
    id: "EXM001",
    name: "Unit Test 1 - Physics",
    class: "12",
    board: "CBSE",
    subject: "Physics",
    date: "2025-07-15",
    startTime: "10:00",
    endTime: "11:30",
    maxMarks: 100,
    passMarks: 35,
    examiner: "Dr. Evelyn Reed",
    status: "Scheduled",
    branchId: "BR001",
  },
  {
    id: "EXM002",
    name: "Quarterly Exam - Mathematics",
    class: "10",
    board: "State",
    subject: "Mathematics",
    date: "2025-06-20",
    startTime: "14:00",
    endTime: "16:00",
    maxMarks: 100,
    passMarks: 40,
    examiner: "Mr. David Chen",
    status: "Completed",
    branchId: "BR001",
  },
  {
    id: "EXM003",
    name: "Mid-Term - Chemistry",
    class: "11",
    board: "CBSE",
    subject: "Chemistry",
    date: "2025-09-10",
    startTime: "10:00",
    endTime: "12:00",
    maxMarks: 70,
    passMarks: 25,
    examiner: "Ms. Aisha Khan",
    status: "Scheduled",
    branchId: "BR002",
  },
  {
    id: "EXM004",
    name: "Unit Test 1 - Biology",
    class: "12",
    board: "ICSE",
    subject: "Biology",
    date: "2025-07-18",
    startTime: "10:00",
    endTime: "11:00",
    maxMarks: 50,
    passMarks: 18,
    examiner: "Mr. Ben Carter",
    status: "Scheduled",
    branchId: "BR001",
  },
  {
    id: "EXM005",
    name: "Final Practical Exam - Computer Science",
    class: "12",
    board: "CBSE",
    subject: "Computer Science",
    date: "2025-03-05",
    startTime: "09:00",
    endTime: "12:00",
    maxMarks: 30,
    passMarks: 10,
    examiner: "Mrs. Fiona Gall",
    status: "Completed",
    branchId: "BR003",
  },
];
