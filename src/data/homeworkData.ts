
// src/data/homeworkData.ts

export interface Homework {
    id: string;
    subject: string;
    title: string;
    description: string;
    assignedDate: string; // YYYY-MM-DD
    dueDate: string; // YYYY-MM-DD
    assignedToClass: string; // e.g., "12"
    branchId: string;
}

export const mockHomework: Homework[] = [
    {
        id: "HW001",
        subject: "Physics",
        title: "Chapter 3: Problem Set A",
        description: "Complete all odd-numbered problems from the worksheet provided in class.",
        assignedDate: "2024-08-01",
        dueDate: "2024-08-05",
        assignedToClass: "12",
        branchId: "BR001"
    },
    {
        id: "HW002",
        subject: "Mathematics",
        title: "Integration Practice",
        description: "Solve the 10 integration problems handed out today. Show all steps.",
        assignedDate: "2024-08-01",
        dueDate: "2024-08-04",
        assignedToClass: "12",
        branchId: "BR001"
    },
    {
        id: "HW003",
        subject: "Chemistry",
        title: "Lab Report: Titration",
        description: "Write a full lab report for the acid-base titration experiment conducted on July 30th.",
        assignedDate: "2024-07-31",
        dueDate: "2024-08-07",
        assignedToClass: "12",
        branchId: "BR001"
    },
    {
        id: "HW004",
        subject: "English",
        title: "Essay: \"The Role of Technology\"",
        description: "Write a 500-word essay on the topic \"The Role of Technology in Modern Education\".",
        assignedDate: "2024-07-29",
        dueDate: "2024-08-02", // Past due date
        assignedToClass: "12",
        branchId: "BR001"
    },
    {
        id: "HW005",
        subject: "Biology",
        title: "Chapter 5 Reading",
        description: "Read Chapter 5 - Principles of Inheritance and Variation.",
        assignedDate: "2024-08-02",
        dueDate: "2024-08-03", // Due soon
        assignedToClass: "11", // Different class
        branchId: "BR001"
    }
];
