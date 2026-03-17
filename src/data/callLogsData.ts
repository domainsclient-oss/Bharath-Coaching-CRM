
export interface CallLogEntry {
  id: string;
  date: string;
  time: string;
  name: string;
  number: string;
  type: "Incoming" | "Outgoing";
  duration: string;
  outcome: string;
  enquiryId?: string;
  enquiryNo?: string;
  branchId: string;
  loggedBy: string;
}

export const mockCallLogs: CallLogEntry[] = [
  {
    id: "CL001",
    date: "2025-03-12",
    time: "10:45 AM",
    name: "Aravind Swami",
    number: "9840012345",
    type: "Outgoing",
    duration: "5m 20s",
    outcome: "Spoke to father. Interested in evening batch. Demo requested.",
    enquiryId: "L001",
    enquiryNo: "ENQ-2025-0001",
    branchId: "Trichy",
    loggedBy: "Priya Sharma"
  },
  {
    id: "CL002",
    date: "2025-03-11",
    time: "03:00 PM",
    name: "Bhavana K",
    number: "9840054321",
    type: "Outgoing",
    duration: "0m 45s",
    outcome: "No answer. Left voicemail regarding demo class.",
    enquiryId: "L002",
    enquiryNo: "ENQ-2025-0002",
    branchId: "Trichy",
    loggedBy: "Rajesh Kumar"
  },
  {
    id: "CL003",
    date: "2025-03-11",
    time: "11:30 AM",
    name: "Rahul Sharma",
    number: "9887766554",
    type: "Incoming",
    duration: "12m 15s",
    outcome: "Called to enquire about Class 10 Foundation batch. Strong lead.",
    enquiryId: "OA001",
    enquiryNo: "WEB-2025-001",
    branchId: "Trichy",
    loggedBy: "Suresh Raina"
  },
  {
    id: "CL004",
    date: "2025-03-10",
    time: "09:15 AM",
    name: "Unknown Caller",
    number: "9000011111",
    type: "Incoming",
    duration: "2m 30s",
    outcome: "Enquired about fees. Refused to give name. To follow up.",
    branchId: "Trichy",
    loggedBy: "Priya Sharma"
  },
  {
    id: "CL005",
    date: "2025-03-09",
    time: "04:20 PM",
    name: "Divya Bharathi",
    number: "9840011223",
    type: "Outgoing",
    duration: "8m 40s",
    outcome: "Confirmed Sunday demo. Parent requested Physics focus.",
    enquiryId: "L004",
    enquiryNo: "ENQ-2025-0004",
    branchId: "Trichy",
    loggedBy: "Karthik Raja"
  }
];
