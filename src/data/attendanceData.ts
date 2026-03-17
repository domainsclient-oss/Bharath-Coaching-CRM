
export interface AttendanceRecord {
  id: string;
  entityId: string; // studentId or staffId
  entityType: "student" | "staff";
  date: string;
  status: "Present" | "Absent" | "Leave" | "Half-Day";
  notes?: string;
  markedBy: string;
  branchId: string;
}

// Mock seed data: 30 days of attendance for Class 10 students (STU001, STU002, STU005, STU011, STU013)
const generateMockAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const studentIds = ["STU001", "STU002", "STU005", "STU011", "STU013"];
  const branchId = "Trichy";
  
  // Generate for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Skip Sundays
    if (date.getDay() === 0) continue;

    studentIds.forEach(id => {
      // Random status with high probability of being Present
      const rand = Math.random();
      let status: AttendanceRecord["status"] = "Present";
      if (rand > 0.95) status = "Absent";
      else if (rand > 0.92) status = "Leave";

      records.push({
        id: `ATT-${dateStr}-${id}`,
        entityId: id,
        entityType: "student",
        date: dateStr,
        status,
        markedBy: "Admin User",
        branchId
      });
    });
  }
  return records;
};

export const mockAttendanceRecords = generateMockAttendance();
