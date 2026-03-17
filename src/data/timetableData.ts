
// src/data/timetableData.ts

export interface TimeSlot {
    time: string; // e.g., "09:00 - 10:00"
    subject: string;
    teacher: string;
}

export interface DailySchedule {
    day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
    schedule: TimeSlot[];
}

export interface ClassTimetable {
    class: string; // e.g., "12"
    timetable: DailySchedule[];
    branchId: string;
}

// Mock Timetable for Class 12
export const mockTimetableData: ClassTimetable = {
    class: "12",
    branchId: "BR001",
    timetable: [
        {
            day: "Monday",
            schedule: [
                { time: "09:00 - 10:00", subject: "Physics", teacher: "Mr. Sharma" },
                { time: "10:00 - 11:00", subject: "Mathematics", teacher: "Mr. Singh" },
                { time: "11:00 - 12:00", subject: "Chemistry", teacher: "Mrs. Gupta" },
                { time: "12:00 - 01:00", subject: "Break", teacher: "" },
                { time: "01:00 - 02:00", subject: "English", teacher: "Ms. Davis" },
            ]
        },
        {
            day: "Tuesday",
            schedule: [
                { time: "09:00 - 10:00", subject: "Chemistry", teacher: "Mrs. Gupta" },
                { time: "10:00 - 11:00", subject: "Physics", teacher: "Mr. Sharma" },
                { time: "11:00 - 12:00", subject: "Mathematics", teacher: "Mr. Singh" },
                { time: "12:00 - 01:00", subject: "Break", teacher: "" },
                { time: "01:00 - 02:00", subject: "Biology", teacher: "Dr. Verma" },
            ]
        },
        {
            day: "Wednesday",
            schedule: [
                { time: "09:00 - 10:00", subject: "Mathematics", teacher: "Mr. Singh" },
                { time: "10:00 - 11:00", subject: "English", teacher: "Ms. Davis" },
                { time: "11:00 - 12:00", subject: "Physics", teacher: "Mr. Sharma" },
                { time: "12:00 - 01:00", subject: "Break", teacher: "" },
                { time: "01:00 - 02:00", subject: "Chemistry", teacher: "Mrs. Gupta" },
            ]
        },
        // Populate other days similarly
        {
            day: "Thursday",
            schedule: [
                { time: "09:00 - 10:00", subject: "Biology", teacher: "Dr. Verma" },
                { time: "10:00 - 11:00", subject: "Physics", teacher: "Mr. Sharma" },
                { time: "11:00 - 12:00", subject: "Mathematics", teacher: "Mr. Singh" },
                { time: "12:00 - 01:00", subject: "Break", teacher: "" },
                { time: "01:00 - 02:00", subject: "English", teacher: "Ms. Davis" },
            ]
        },
        {
            day: "Friday",
            schedule: [
                { time: "09:00 - 10:00", subject: "Chemistry", teacher: "Mrs. Gupta" },
                { time: "10:00 - 11:00", subject: "Mathematics", teacher: "Mr. Singh" },
                { time: "11:00 - 12:00", subject: "Physics", teacher: "Mr. Sharma" },
                { time: "12:00 - 01:00", subject: "Break", teacher: "" },
                { time: "01:00 - 02:00", subject: "Lab Session", teacher: "Lab Assistant" },
            ]
        },
        {
            day: "Saturday",
            schedule: [
                { time: "09:00 - 11:00", subject: "Special Test Session", teacher: "Mr. Sharma" },
                { time: "11:00 - 12:00", subject: "Doubt Clearing", teacher: "All Teachers" },
            ]
        }
    ]
};
