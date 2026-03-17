
// src/data/announcementsData.ts

export interface Announcement {
    id: string;
    title: string;
    body: string;
    category: "General" | "Exam" | "Holiday" | "Event";
    date: string; // YYYY-MM-DD
    postedBy: string;
    pinned: boolean;
    targetClass: "All" | "10" | "11" | "12"; // Example classes
    branchId: string;
}

export const mockAnnouncements: Announcement[] = [
    {
        id: "ANNOUNCE001",
        title: "Republic Day Holiday Announcement",
        body: "The academy will be closed on January 26th, 2025, in observance of Republic Day. Classes will resume as normal on January 27th.",
        category: "Holiday",
        date: "2025-01-24",
        postedBy: "Admin Office",
        pinned: true,
        targetClass: "All",
        branchId: "BR001"
    },
    {
        id: "ANNOUNCE002",
        title: "Upcoming Physics Mid-Term Exam Schedule",
        body: "The Physics Mid-Term examination for Class 12 is scheduled for August 5th, 2024. The syllabus will cover chapters 1 through 5. Please prepare accordingly.",
        category: "Exam",
        date: "2024-07-28",
        postedBy: "Mr. Sharma",
        pinned: false,
        targetClass: "12",
        branchId: "BR001"
    },
    {
        id: "ANNOUNCE003",
        title: "Annual Sports Day Event",
        body: "We are excited to announce the Annual Sports Day on September 15th, 2024. Students interested in participating can register at the front office.",
        category: "Event",
        date: "2024-07-25",
        postedBy: "Admin Office",
        pinned: false,
        targetClass: "All",
        branchId: "BR001"
    },
    {
        id: "ANNOUNCE004",
        title: "Fee Payment Reminder - August",
        body: "This is a reminder to please complete your fee payments for the month of August by the 10th. Payments can be made via the student portal.",
        category: "General",
        date: "2024-08-01",
        postedBy: "Accounts Dept.",
        pinned: false,
        targetClass: "All",
        branchId: "BR001"
    },
    {
        id: "ANNOUNCE005",
        title: "Chemistry Special Class for Class 11",
        body: "A special doubt-clearing session for Chemistry will be held this Saturday for Class 11 students at 11:00 AM.",
        category: "General",
        date: "2024-07-30",
        postedBy: "Mrs. Gupta",
        pinned: false,
        targetClass: "11", // Should not be visible to Class 12 student
        branchId: "BR001"
    },
    {
        id: "ANNOUNCE006",
        title: "Parent-Teacher Meeting Schedule",
        body: "The next Parent-Teacher Meeting is scheduled for Saturday, August 24th, 2024. Please inform your parents.",
        category: "Event",
        date: "2024-08-10",
        postedBy: "Admin Office",
        pinned: true,
        targetClass: "12",
        branchId: "BR001"
    }
];
