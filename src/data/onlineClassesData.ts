
export interface OnlineClass {
  id: string;
  title: string;
  class: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  date: string;
  time: string;
  duration: number; // in minutes
  meetLink: string;
  status: "Scheduled" | "Live" | "Ended";
  description?: string;
  branchId: string;
}

export const mockOnlineClasses: OnlineClass[] = [
  {
    id: "OC001",
    title: "Morning Revision: Algebra Fundamentals",
    class: "10",
    subject: "Mathematics",
    teacherId: "STF001",
    teacherName: "Priya Sharma",
    date: "2025-03-12",
    time: "10:00 AM",
    duration: 60,
    meetLink: "https://meet.google.com/abc-defg-hij",
    status: "Live",
    branchId: "Trichy"
  },
  {
    id: "OC002",
    title: "Quantum Physics Introduction",
    class: "12",
    subject: "Physics",
    teacherId: "STF002",
    teacherName: "Rajesh Kumar",
    date: "2025-03-13",
    time: "04:30 PM",
    duration: 90,
    meetLink: "https://meet.google.com/xyz-qwer-tyu",
    status: "Scheduled",
    branchId: "Trichy"
  },
  {
    id: "OC003",
    title: "Chemical Bonding Workshop",
    class: "11",
    subject: "Chemistry",
    teacherId: "STF005",
    teacherName: "Karthik Raja",
    date: "2025-03-14",
    time: "11:00 AM",
    duration: 60,
    meetLink: "https://meet.google.com/mno-pjkl-vbn",
    status: "Scheduled",
    branchId: "Trichy"
  },
  {
    id: "OC004",
    title: "English Literature: The Tempest",
    class: "10",
    subject: "English",
    teacherId: "STF001",
    teacherName: "Priya Sharma",
    date: "2025-03-15",
    time: "05:00 PM",
    duration: 45,
    meetLink: "https://meet.google.com/ghi-jklm-nop",
    status: "Scheduled",
    branchId: "Trichy"
  },
  {
    id: "OC005",
    title: "Intro to Organic Chemistry",
    class: "12",
    subject: "Chemistry",
    teacherId: "STF005",
    teacherName: "Karthik Raja",
    date: "2025-03-10",
    time: "09:00 AM",
    duration: 60,
    meetLink: "https://meet.google.com/old-link-1",
    status: "Ended",
    branchId: "Trichy"
  },
  {
    id: "OC006",
    title: "Grammar & Composition",
    class: "9",
    subject: "English",
    teacherId: "STF001",
    teacherName: "Priya Sharma",
    date: "2025-03-09",
    time: "02:00 PM",
    duration: 60,
    meetLink: "https://meet.google.com/old-link-2",
    status: "Ended",
    branchId: "Trichy"
  },
  {
    id: "OC007",
    title: "Calculus Part 1",
    class: "12",
    subject: "Mathematics",
    teacherId: "STF001",
    teacherName: "Priya Sharma",
    date: "2025-03-08",
    time: "10:00 AM",
    duration: 120,
    meetLink: "https://meet.google.com/old-link-3",
    status: "Ended",
    branchId: "Trichy"
  },
  {
    id: "OC008",
    title: "World History: French Revolution",
    class: "10",
    subject: "Social Science",
    teacherId: "STF004",
    teacherName: "Suresh Raina",
    date: "2025-03-07",
    time: "04:00 PM",
    duration: 60,
    meetLink: "https://meet.google.com/old-link-4",
    status: "Ended",
    branchId: "Trichy"
  },
  {
    id: "OC009",
    title: "Light & Optics",
    class: "10",
    subject: "Physics",
    teacherId: "STF002",
    teacherName: "Rajesh Kumar",
    date: "2025-03-06",
    time: "11:30 AM",
    duration: 60,
    meetLink: "https://meet.google.com/old-link-5",
    status: "Ended",
    branchId: "Trichy"
  },
  {
    id: "OC010",
    title: "Cell Structure & Functions",
    class: "9",
    subject: "Biology",
    teacherId: "STF005",
    teacherName: "Karthik Raja",
    date: "2025-03-05",
    time: "09:00 AM",
    duration: 45,
    meetLink: "https://meet.google.com/old-link-6",
    status: "Ended",
    branchId: "Trichy"
  }
];
