
export interface Class {
  id: string;
  name: string;
  board: string;
  mode: "Online" | "Offline" | "Both";
  studentCount: number;
  branchId: string;
}

export interface Subject {
  id: string;
  name: string;
  classIds: string[];
  board: string;
  type: "Theory" | "Practical" | "Both";
  branchId: string;
}

export interface ClassTeacher {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  branchId: string;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  batch: string;
  branchId: string;
}

export interface TimetableEntry {
  id: string;
  classId: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  timeSlot: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  mode: "Online" | "Offline";
  branchId: string;
}

// ── Classes ────────────────────────────────────────────────────────────────────
export const mockClasses: Class[] = [
  { id: "C001", name: "Class 6",  board: "CBSE",  mode: "Offline", studentCount: 30, branchId: "Trichy" },
  { id: "C002", name: "Class 7",  board: "CBSE",  mode: "Offline", studentCount: 28, branchId: "Trichy" },
  { id: "C003", name: "Class 8",  board: "ICSE",  mode: "Offline", studentCount: 22, branchId: "Trichy" },
  { id: "C004", name: "Class 9",  board: "CBSE",  mode: "Offline", studentCount: 35, branchId: "Trichy" },
  { id: "C005", name: "Class 10", board: "CBSE",  mode: "Offline", studentCount: 42, branchId: "Trichy" },
  { id: "C006", name: "Class 11", board: "State", mode: "Both",    studentCount: 20, branchId: "Trichy" },
  { id: "C007", name: "Class 12", board: "State", mode: "Both",    studentCount: 18, branchId: "Trichy" },
  { id: "C008", name: "Class 11", board: "CBSE",  mode: "Online",  studentCount: 15, branchId: "Chennai" },
];

// ── Subjects ───────────────────────────────────────────────────────────────────
export const mockSubjects: Subject[] = [
  { id: "S001", name: "Mathematics",       classIds: ["C001","C002","C003","C004","C005","C006","C007"], board: "CBSE",  type: "Theory",    branchId: "Trichy" },
  { id: "S002", name: "Physics",           classIds: ["C004","C005","C006","C007"],                      board: "CBSE",  type: "Both",      branchId: "Trichy" },
  { id: "S003", name: "Chemistry",         classIds: ["C004","C005","C006","C007"],                      board: "CBSE",  type: "Both",      branchId: "Trichy" },
  { id: "S004", name: "Biology",           classIds: ["C004","C005","C006","C007"],                      board: "CBSE",  type: "Theory",    branchId: "Trichy" },
  { id: "S005", name: "English",           classIds: ["C001","C002","C003","C004","C005","C006","C007"], board: "CBSE",  type: "Theory",    branchId: "Trichy" },
  { id: "S006", name: "Social Science",    classIds: ["C001","C002","C003","C004","C005"],               board: "CBSE",  type: "Theory",    branchId: "Trichy" },
  { id: "S007", name: "Tamil",             classIds: ["C001","C002","C003","C004","C005","C006","C007"], board: "State", type: "Theory",    branchId: "Trichy" },
  { id: "S008", name: "Computer Science",  classIds: ["C004","C005","C006","C007"],                      board: "CBSE",  type: "Practical", branchId: "Trichy" },
  { id: "S009", name: "Accountancy",       classIds: ["C006","C007"],                                    board: "State", type: "Theory",    branchId: "Trichy" },
  { id: "S010", name: "Economics",         classIds: ["C006","C007"],                                    board: "State", type: "Theory",    branchId: "Trichy" },
];

// ── Class Teachers ─────────────────────────────────────────────────────────────
export const mockClassTeachers: ClassTeacher[] = [
  { id: "CT001", classId: "C001", className: "Class 6",  teacherId: "EMP005", teacherName: "Karthik Raja",    branchId: "Trichy" },
  { id: "CT002", classId: "C002", className: "Class 7",  teacherId: "EMP003", teacherName: "Meena Iyer",      branchId: "Trichy" },
  { id: "CT003", classId: "C003", className: "Class 8",  teacherId: "EMP006", teacherName: "Sudha Rajan",     branchId: "Trichy" },
  { id: "CT004", classId: "C004", className: "Class 9",  teacherId: "EMP002", teacherName: "Arun Patel",      branchId: "Trichy" },
  { id: "CT005", classId: "C005", className: "Class 10", teacherId: "EMP001", teacherName: "Lakshmi Nair",    branchId: "Trichy" },
  { id: "CT006", classId: "C007", className: "Class 12", teacherId: "EMP007", teacherName: "Vijay Anand",     branchId: "Trichy" },
];

// ── Teacher–Subject Assignments ────────────────────────────────────────────────
export const mockTeacherAssignments: TeacherAssignment[] = [
  { id: "TA001", teacherId: "EMP001", teacherName: "Lakshmi Nair",  subjectId: "S001", subjectName: "Mathematics", classId: "C005", className: "Class 10", batch: "Evening A", branchId: "Trichy" },
  { id: "TA002", teacherId: "EMP001", teacherName: "Lakshmi Nair",  subjectId: "S001", subjectName: "Mathematics", classId: "C004", className: "Class 9",  batch: "Morning B", branchId: "Trichy" },
  { id: "TA003", teacherId: "EMP002", teacherName: "Arun Patel",    subjectId: "S002", subjectName: "Physics",     classId: "C005", className: "Class 10", batch: "Evening A", branchId: "Trichy" },
  { id: "TA004", teacherId: "EMP002", teacherName: "Arun Patel",    subjectId: "S002", subjectName: "Physics",     classId: "C007", className: "Class 12", batch: "Morning A", branchId: "Trichy" },
  { id: "TA005", teacherId: "EMP003", teacherName: "Meena Iyer",    subjectId: "S005", subjectName: "English",     classId: "C005", className: "Class 10", batch: "Evening A", branchId: "Trichy" },
  { id: "TA006", teacherId: "EMP003", teacherName: "Meena Iyer",    subjectId: "S005", subjectName: "English",     classId: "C006", className: "Class 11", batch: "Evening B", branchId: "Trichy" },
  { id: "TA007", teacherId: "EMP005", teacherName: "Karthik Raja",  subjectId: "S003", subjectName: "Chemistry",   classId: "C005", className: "Class 10", batch: "Evening A", branchId: "Trichy" },
  { id: "TA008", teacherId: "EMP005", teacherName: "Karthik Raja",  subjectId: "S003", subjectName: "Chemistry",   classId: "C007", className: "Class 12", batch: "Morning A", branchId: "Trichy" },
  { id: "TA009", teacherId: "EMP007", teacherName: "Vijay Anand",   subjectId: "S004", subjectName: "Biology",     classId: "C006", className: "Class 11", batch: "Morning A", branchId: "Trichy" },
  { id: "TA010", teacherId: "EMP007", teacherName: "Vijay Anand",   subjectId: "S004", subjectName: "Biology",     classId: "C007", className: "Class 12", batch: "Morning A", branchId: "Trichy" },
  { id: "TA011", teacherId: "EMP008", teacherName: "Divya Nair",    subjectId: "S008", subjectName: "Computer Science", classId: "C005", className: "Class 10", batch: "Evening A", branchId: "Trichy" },
  { id: "TA012", teacherId: "EMP008", teacherName: "Divya Nair",    subjectId: "S008", subjectName: "Computer Science", classId: "C006", className: "Class 11", batch: "Morning A", branchId: "Trichy" },
];

// ── Timetable ──────────────────────────────────────────────────────────────────
export const mockTimetable: TimetableEntry[] = [
  // Class 10 (C005)
  { id: "T001", classId: "C005", day: "Mon", timeSlot: "4:00-5:00 PM", subjectId: "S001", subjectName: "Mathematics",     teacherId: "EMP001", teacherName: "Lakshmi Nair",  mode: "Offline", branchId: "Trichy" },
  { id: "T002", classId: "C005", day: "Mon", timeSlot: "5:00-6:00 PM", subjectId: "S002", subjectName: "Physics",         teacherId: "EMP002", teacherName: "Arun Patel",    mode: "Offline", branchId: "Trichy" },
  { id: "T003", classId: "C005", day: "Tue", timeSlot: "4:00-5:00 PM", subjectId: "S003", subjectName: "Chemistry",       teacherId: "EMP005", teacherName: "Karthik Raja",  mode: "Offline", branchId: "Trichy" },
  { id: "T004", classId: "C005", day: "Tue", timeSlot: "5:00-6:00 PM", subjectId: "S005", subjectName: "English",         teacherId: "EMP003", teacherName: "Meena Iyer",    mode: "Online",  branchId: "Trichy" },
  { id: "T005", classId: "C005", day: "Wed", timeSlot: "4:00-5:00 PM", subjectId: "S001", subjectName: "Mathematics",     teacherId: "EMP001", teacherName: "Lakshmi Nair",  mode: "Offline", branchId: "Trichy" },
  { id: "T006", classId: "C005", day: "Wed", timeSlot: "5:00-6:00 PM", subjectId: "S008", subjectName: "Computer Science",teacherId: "EMP008", teacherName: "Divya Nair",    mode: "Offline", branchId: "Trichy" },
  { id: "T007", classId: "C005", day: "Thu", timeSlot: "4:00-5:00 PM", subjectId: "S002", subjectName: "Physics",         teacherId: "EMP002", teacherName: "Arun Patel",    mode: "Offline", branchId: "Trichy" },
  { id: "T008", classId: "C005", day: "Thu", timeSlot: "5:00-6:00 PM", subjectId: "S003", subjectName: "Chemistry",       teacherId: "EMP005", teacherName: "Karthik Raja",  mode: "Offline", branchId: "Trichy" },
  { id: "T009", classId: "C005", day: "Fri", timeSlot: "4:00-5:00 PM", subjectId: "S004", subjectName: "Biology",         teacherId: "EMP007", teacherName: "Vijay Anand",   mode: "Offline", branchId: "Trichy" },
  { id: "T010", classId: "C005", day: "Fri", timeSlot: "5:00-6:00 PM", subjectId: "S001", subjectName: "Mathematics",     teacherId: "EMP001", teacherName: "Lakshmi Nair",  mode: "Offline", branchId: "Trichy" },
  { id: "T011", classId: "C005", day: "Sat", timeSlot: "10:00-11:00 AM", subjectId: "S005", subjectName: "English",       teacherId: "EMP003", teacherName: "Meena Iyer",    mode: "Online",  branchId: "Trichy" },

  // Class 9 (C004)
  { id: "T012", classId: "C004", day: "Mon", timeSlot: "10:00-11:00 AM", subjectId: "S001", subjectName: "Mathematics",   teacherId: "EMP001", teacherName: "Lakshmi Nair",  mode: "Offline", branchId: "Trichy" },
  { id: "T013", classId: "C004", day: "Mon", timeSlot: "11:00-12:00 PM", subjectId: "S005", subjectName: "English",       teacherId: "EMP003", teacherName: "Meena Iyer",    mode: "Offline", branchId: "Trichy" },
  { id: "T014", classId: "C004", day: "Wed", timeSlot: "10:00-11:00 AM", subjectId: "S002", subjectName: "Physics",       teacherId: "EMP002", teacherName: "Arun Patel",    mode: "Offline", branchId: "Trichy" },
  { id: "T015", classId: "C004", day: "Fri", timeSlot: "10:00-11:00 AM", subjectId: "S003", subjectName: "Chemistry",     teacherId: "EMP005", teacherName: "Karthik Raja",  mode: "Offline", branchId: "Trichy" },

  // Class 12 (C007)
  { id: "T016", classId: "C007", day: "Mon", timeSlot: "6:00-7:00 PM", subjectId: "S001", subjectName: "Mathematics",     teacherId: "EMP001", teacherName: "Lakshmi Nair",  mode: "Offline", branchId: "Trichy" },
  { id: "T017", classId: "C007", day: "Tue", timeSlot: "6:00-7:00 PM", subjectId: "S002", subjectName: "Physics",         teacherId: "EMP002", teacherName: "Arun Patel",    mode: "Offline", branchId: "Trichy" },
  { id: "T018", classId: "C007", day: "Wed", timeSlot: "6:00-7:00 PM", subjectId: "S003", subjectName: "Chemistry",       teacherId: "EMP005", teacherName: "Karthik Raja",  mode: "Offline", branchId: "Trichy" },
  { id: "T019", classId: "C007", day: "Thu", timeSlot: "6:00-7:00 PM", subjectId: "S004", subjectName: "Biology",         teacherId: "EMP007", teacherName: "Vijay Anand",   mode: "Offline", branchId: "Trichy" },
  { id: "T020", classId: "C007", day: "Sat", timeSlot: "10:00-11:00 AM", subjectId: "S005", subjectName: "English",       teacherId: "EMP003", teacherName: "Meena Iyer",    mode: "Online",  branchId: "Trichy" },
];

export const TIME_SLOTS = [
  "10:00-11:00 AM",
  "11:00-12:00 PM",
  "4:00-5:00 PM",
  "5:00-6:00 PM",
  "6:00-7:00 PM",
  "7:00-8:00 PM",
];

export const DAYS: TimetableEntry["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
