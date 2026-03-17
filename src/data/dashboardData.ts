
export const mockStats = {
  totalStudents: 248,
  activeStaff: 18,
  feesCollectedThisMonth: 182500,
  pendingDues: 43200,
  todayStudentAttendance: { present: 192, total: 210 },
  todayStaffAttendance: { present: 16, total: 18 },
};

export const mockMonthlyFees = [
  { month: "Sep", collected: 145000 },
  { month: "Oct", collected: 162000 },
  { month: "Nov", collected: 158000 },
  { month: "Dec", collected: 172000 },
  { month: "Jan", collected: 168000 },
  { month: "Feb", collected: 182500 },
];

export const mockLeadSources = [
  { name: "Walk-in", value: 32 },
  { name: "WhatsApp", value: 28 },
  { name: "Referral", value: 18 },
  { name: "Social Media", value: 14 },
  { name: "Others", value: 8 },
];

export const mockFeeAlerts = [
  { name: "Riya Sharma", class: "10", amount: 4500, dueDate: "2025-03-15", overdue: false },
  { name: "Kiran Raj", class: "9", amount: 3200, dueDate: "2025-03-10", overdue: true },
  { name: "Priya S", class: "8", amount: 6000, dueDate: "2025-03-08", overdue: true },
];

export const mockRecentEnquiries = [
  { name: "Arun Kumar", source: "WhatsApp", class: "10", status: "New", date: "2025-03-12" },
  { name: "Lakshmi D", source: "Walk-in", class: "9", status: "Contacted", date: "2025-03-11" },
  { name: "Vikram T", source: "Referral", class: "11", status: "Interested", date: "2025-03-10" },
];
