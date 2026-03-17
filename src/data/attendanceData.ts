
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

// Mock seed data: 30 days of attendance for Class 10 students and staff
const generateMockAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const studentIds = ["STU001", "STU002", "STU005", "STU011", "STU013"];
  const staffIds = ["STF001", "STF002", "STF004", "STF005"];
  const branchId = "Trichy";
  
  // Generate for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Skip Sundays
    if (date.getDay() === 0) continue;

    // Students
    studentIds.forEach(id => {
      const rand = Math.random();
      let status: AttendanceRecord["status"] = "Present";
      if (rand > 0.95) status = "Absent";
      else if (rand > 0.92) status = "Leave";

      records.push({
        id: `ATT-S-${dateStr}-${id}`,
        entityId: id,
        entityType: "student",
        date: dateStr,
        status,
        markedBy: "Admin User",
        branchId
      });
    });

    // Staff
    staffIds.forEach(id => {
      const rand = Math.random();
      let status: AttendanceRecord["status"] = "Present";
      if (rand > 0.98) status = "Absent";
      else if (rand > 0.96) status = "Leave";
      else if (rand > 0.94) status = "Half-Day";

      records.push({
        id: `ATT-T-${dateStr}-${id}`,
        entityId: id,
        entityType: "staff",
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
