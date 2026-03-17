
// src/data/attendanceData.ts

export interface AttendanceRecord {
    id: string;
    studentId: string;
    date: string; // YYYY-MM-DD
    status: 'Present' | 'Absent';
    branchId: string;
}

// Mock data for Arjun Kumar (STU001)
export const mockAttendanceData: AttendanceRecord[] = [
    // Recent Month (e.g., August 2024)
    { id: "ATT001", studentId: "STU001", date: "2024-08-01", status: "Present", branchId: "BR001" },
    { id: "ATT002", studentId: "STU001", date: "2024-08-02", status: "Present", branchId: "BR001" },
    { id: "ATT003", studentId: "STU001", date: "2024-08-03", status: "Absent", branchId: "BR001" }, // Saturday, assuming 6-day week
    { id: "ATT004", studentId: "STU001", date: "2024-08-05", status: "Present", branchId: "BR001" },
    { id: "ATT005", studentId: "STU001", date: "2024-08-06", status: "Present", branchId: "BR001" },
    { id: "ATT006", studentId: "STU001", date: "2024-08-07", status: "Present", branchId: "BR001" }, // Streak starts here
    { id: "ATT007", studentId: "STU001", date: "2024-08-08", status: "Present", branchId: "BR001" },
    { id: "ATT008", studentId: "STU001", date: "2024-08-09", status: "Present", branchId: "BR001" },

    // Previous Month (e.g., July 2024)
    { id: "ATT009", studentId: "STU001", date: "2024-07-29", status: "Absent", branchId: "BR001" },
    { id: "ATT010", studentId: "STU001", date: "2024-07-30", status: "Present", branchId: "BR001" },
    { id: "ATT011", studentId: "STU001", date: "2024-07-31", status: "Present", branchId: "BR001" },

    // Some other student's data that should be filtered out
    { id: "ATT012", studentId: "STU002", date: "2024-08-01", status: "Present", branchId: "BR001" },

    // Data for yearly calculation
    ...Array.from({ length: 100 }).map((_, i) => ({
        id: `ATT${100 + i}`,
        studentId: "STU001",
        date: new Date(new Date().getFullYear(), 0, i + 1).toISOString().split('T')[0],
        status: Math.random() > 0.15 ? 'Present' as const : 'Absent' as const,
        branchId: "BR001",
    }))
];
