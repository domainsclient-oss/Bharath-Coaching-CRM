
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
  type: "Theory" | "Practical";
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
];
