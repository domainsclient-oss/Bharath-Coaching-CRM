
// studentPortalData.ts

export interface StudentProfile {
  id: string; 
  name: string;
  class: string;
  branch: string;
  photoUrl?: string;
  attendancePercentage: number;
  feesDue: number;
  feesDueDate: string;
}

export interface TimetableEntry {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  time: string;
  subject: string;
  teacher: string;
  class: string;
}

export interface UpcomingTest {
  id: string;
  subject: string;
  title: string;
  date: string;
  maxMarks: number;
}

export interface RecentHomework {
  id: string;
  subject: string;
  title: string;
  assignedDate: string;
  dueDate: string;
  status: "Submitted" | "Pending" | "Overdue";
}

export interface Resource {
    id: string;
    title: string;
    subject: string;
    type: "Notes" | "Presentation" | "PDF" | "Question Bank" | "Board Exam" | "Unit Test" | "Sample Paper" | "Mock Test";
    fileUrl: string;
    class: string;
    visibleToStudents: boolean;
    branchId: string;
    year?: number; // Added for question papers
}

export interface Video {
    id: string;
    title: string;
    subject: string;
    chapter: string;
    youtubeUrl: string;
    duration: string;
    description: string;
    teacherName: string;
    thumbnailUrl: string;
    class: string;
    branchId: string;
    visibleToStudents: boolean;
}

export const mockStudentProfile: StudentProfile = {
  id: "STU001",
  name: "Arjun Kumar",
  class: "12",
  branch: "Trichy",
  attendancePercentage: 92,
  feesDue: 5000,
  feesDueDate: "2024-08-10",
  photoUrl: "/avatars/arjun.jpg",
};

// ... (other mock data remains the same) ...

export const mockResources: Resource[] = [
    // Existing Resources
    { id: "RES001", title: "Chapter 1: Electric Charges and Fields", subject: "Physics", type: "PDF", fileUrl: "/resources/phy_ch1.pdf", class: "12", visibleToStudents: true, branchId: "BR001" },
    { id: "RES003", title: "The Solid State - Presentation", subject: "Chemistry", type: "Presentation", fileUrl: "/resources/chem_ch1.pptx", class: "12", visibleToStudents: true, branchId: "BR001" },
    { id: "RES006", title: "Internal Staff Handbook", subject: "Admin", type: "PDF", fileUrl: "/resources/internal.pdf", class: "N/A", visibleToStudents: false, branchId: "BR001" },

    // New Question Papers for Class 12
    { id: "QP001", title: "CBSE Board Exam - March 2023", subject: "Physics", type: "Board Exam", fileUrl: "/resources/papers/phy_board_2023.pdf", class: "12", visibleToStudents: true, branchId: "BR001", year: 2023 },
    { id: "QP002", title: "CBSE Board Exam - March 2023", subject: "Chemistry", type: "Board Exam", fileUrl: "/resources/papers/chem_board_2023.pdf", class: "12", visibleToStudents: true, branchId: "BR001", year: 2023 },
    { id: "QP003", title: "First Unit Test", subject: "Mathematics", type: "Unit Test", fileUrl: "/resources/papers/math_ut1_2024.pdf", class: "12", visibleToStudents: true, branchId: "BR001", year: 2024 },
    { id: "QP004", title: "Half-Yearly Mock Test", subject: "Physics", type: "Mock Test", fileUrl: "/resources/papers/phy_mock_2024.pdf", class: "12", visibleToStudents: true, branchId: "BR001", year: 2024 },
    { id: "QP005", title: "Official Sample Paper 2024", subject: "Chemistry", type: "Sample Paper", fileUrl: "/resources/papers/chem_sample_2024.pdf", class: "12", visibleToStudents: true, branchId: "BR001", year: 2024 },
    { id: "QP006", title: "CBSE Board Exam - March 2022", subject: "Physics", type: "Board Exam", fileUrl: "/resources/papers/phy_board_2022.pdf", class: "12", visibleToStudents: true, branchId: "BR001", year: 2022 },

    // Question paper for another class (should be filtered out)
    { id: "QP007", title: "Final Exam 2023", subject: "Science", type: "Board Exam", fileUrl: "/resources/papers/sci_board_2023.pdf", class: "11", visibleToStudents: true, branchId: "BR001", year: 2023 }
];

// ... (rest of the mock data like videos, etc.)
export const mockVideos: Video[] = [
    { id: "VID001", title: "Introduction to Electric Charges", chapter: "Electric Charges and Fields", subject: "Physics", youtubeUrl: "https://www.youtube.com/watch?v=T3_g5-U-c_E", duration: "12:45", description: "A foundational look at electric charges.", teacherName: "Mr. Rajesh Kumar", thumbnailUrl: "/thumbnails/phys_thumb1.jpg", class: "12", branchId: "BR001", visibleToStudents: true },
    { id: "VID002", title: "Coulomb's Law Explained", chapter: "Electric Charges and Fields", subject: "Physics", youtubeUrl: "https://www.youtube.com/watch?v=jJcZt_sO-pI", duration: "18:30", description: "Detailed explanation of Coulomb's Law with examples.", teacherName: "Mr. Rajesh Kumar", thumbnailUrl: "/thumbnails/phys_thumb2.jpg", class: "12", branchId: "BR001", visibleToStudents: true },
];
