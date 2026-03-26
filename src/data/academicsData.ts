
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

export const mockClasses: Class[] = [
  { id: "C001", name: "Class 10", board: "CBSE", mode: "Offline", studentCount: 42, branchId: "Trichy" },
  { id: "C002", name: "Class 12", board: "State", mode: "Both", studentCount: 35, branchId: "Trichy" },
  { id: "C003", name: "Class 9", board: "CBSE", mode: "Offline", studentCount: 28, branchId: "Trichy" },
  { id: "C004", name: "Class 11", board: "CBSE", mode: "Online", studentCount: 15, branchId: "Chennai" },
  { id: "C005", name: "Class 8", board: "ICSE", mode: "Offline", studentCount: 22, branchId: "Trichy" },
];

export const mockSubjects: Subject[] = [
  { id: "S001", name: "Mathematics", classIds: ["C001", "C003"], board: "CBSE", type: "Theory", branchId: "Trichy" },
  { id: "S002", name: "Physics", classIds: ["C001", "C002"], board: "CBSE", type: "Both", branchId: "Trichy" },
  { id: "S003", name: "Biology", classIds: ["C001"], board: "CBSE", type: "Theory", branchId: "Trichy" },
  { id: "S004", name: "Chemistry", classIds: ["C001", "C002"], board: "CBSE", type: "Theory", branchId: "Trichy" },
  { id: "S005", name: "English", classIds: ["C001", "C002", "C003", "C005"], board: "CBSE", type: "Theory", branchId: "Trichy" },
];

export const mockTeacherAssignments: TeacherAssignment[] = [
  { id: "TA001", teacherId: "STF001", teacherName: "Priya Sharma", subjectId: "S001", subjectName: "Mathematics", classId: "C001", className: "Class 10", batch: "Evening A", branchId: "Trichy" },
  { id: "TA002", teacherId: "STF001", teacherName: "Priya Sharma", subjectId: "S001", subjectName: "Mathematics", classId: "C003", className: "Class 9", batch: "Morning B", branchId: "Trichy" },
  { id: "TA003", teacherId: "STF002", teacherName: "Rajesh Kumar", subjectId: "S002", subjectName: "Physics", classId: "C001", className: "Class 10", batch: "Evening A", branchId: "Trichy" },
];

export const mockTimetable: TimetableEntry[] = [
  { id: "T001", classId: "C001", day: "Mon", timeSlot: "4:00-5:00 PM", subjectId: "S001", subjectName: "Mathematics", teacherId: "STF001", teacherName: "Priya Sharma", mode: "Offline", branchId: "Trichy" },
  { id: "T002", classId: "C001", day: "Mon", timeSlot: "5:00-6:00 PM", subjectId: "S002", subjectName: "Physics", teacherId: "STF002", teacherName: "Rajesh Kumar", mode: "Offline", branchId: "Trichy" },
  { id: "T003", classId: "C001", day: "Tue", timeSlot: "4:00-5:00 PM", subjectId: "S004", subjectName: "Chemistry", teacherId: "STF005", teacherName: "Karthik Raja", mode: "Offline", branchId: "Trichy" },
  { id: "T004", classId: "C001", day: "Wed", timeSlot: "6:00-7:00 PM", subjectId: "S005", subjectName: "English", teacherId: "STF001", teacherName: "Priya Sharma", mode: "Online", branchId: "Trichy" },
];

export const TIME_SLOTS = [
  "10:00-11:00 AM",
  "11:00-12:00 PM",
  "4:00-5:00 PM",
  "5:00-6:00 PM",
  "6:00-7:00 PM",
  "7:00-8:00 PM"
];

export const DAYS: TimetableEntry["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
