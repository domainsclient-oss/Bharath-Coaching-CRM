
export type LeadStatus = "New" | "Contacted" | "Interested" | "Demo Scheduled" | "Admitted" | "Not Interested";

export type LeadSource = 
  | "Walk-in" 
  | "Phone Call" 
  | "WhatsApp Enquiry" 
  | "Social Media" 
  | "Student Referral" 
  | "School Reference" 
  | "Banner / Sunpack" 
  | "Pamphlet" 
  | "Google (SEO)" 
  | "Website" 
  | "Old Students";

export interface Lead {
  id: string;
  enquiryNo: string;
  name: string;
  age: number;
  classInterested: string;
  board: string;
  parentName: string;
  phone: string;
  whatsapp: string;
  email: string;
  source: LeadSource;
  referredBy?: string;
  subjects: string[];
  mode: "Online" | "Offline" | "Either";
  status: LeadStatus;
  assignedTo: string;
  followUpDate: string;
  notes: string;
  createdAt: string;
  branchId: string;
}

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Interested",
  "Demo Scheduled",
  "Admitted",
  "Not Interested"
];

export const SOURCE_COLORS: Record<LeadSource, string> = {
  "Walk-in": "bg-blue-100 text-blue-700 border-blue-200",
  "Phone Call": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "WhatsApp Enquiry": "bg-green-100 text-green-700 border-green-200",
  "Social Media": "bg-pink-100 text-pink-700 border-pink-200",
  "Student Referral": "bg-purple-100 text-purple-700 border-purple-200",
  "School Reference": "bg-amber-100 text-amber-700 border-amber-200",
  "Banner / Sunpack": "bg-orange-100 text-orange-700 border-orange-200",
  "Pamphlet": "bg-slate-100 text-slate-700 border-slate-200",
  "Google (SEO)": "bg-teal-100 text-teal-700 border-teal-200",
  "Website": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Old Students": "bg-rose-100 text-rose-700 border-rose-200"
};

export const mockLeads: Lead[] = [
  {
    id: "L001",
    enquiryNo: "ENQ-2025-0001",
    name: "Aravind Swami",
    age: 15,
    classInterested: "10",
    board: "CBSE",
    parentName: "Swami N",
    phone: "9840012345",
    whatsapp: "9840012345",
    email: "aravind@example.com",
    source: "Walk-in",
    subjects: ["Math", "Science"],
    mode: "Offline",
    status: "New",
    assignedTo: "Priya Sharma",
    followUpDate: "2025-03-15",
    notes: "Interested in evening batch.",
    createdAt: "2025-03-10",
    branchId: "Trichy"
  },
  {
    id: "L002",
    enquiryNo: "ENQ-2025-0002",
    name: "Bhavana K",
    age: 14,
    classInterested: "9",
    board: "ICSE",
    parentName: "Kumar R",
    phone: "9840054321",
    whatsapp: "9840054321",
    email: "bhavana@example.com",
    source: "WhatsApp Enquiry",
    subjects: ["English", "Math"],
    mode: "Online",
    status: "Contacted",
    assignedTo: "Rajesh Kumar",
    followUpDate: "2025-03-14",
    notes: "Called once, busy. To call back.",
    createdAt: "2025-03-11",
    branchId: "Trichy"
  },
  {
    id: "L003",
    enquiryNo: "ENQ-2025-0003",
    name: "Chandru Singh",
    age: 16,
    classInterested: "11",
    board: "State",
    parentName: "Mahendra Singh",
    phone: "9840099887",
    whatsapp: "9840099887",
    email: "chandru@example.com",
    source: "Social Media",
    subjects: ["Physics", "Chemistry"],
    mode: "Either",
    status: "Interested",
    assignedTo: "Priya Sharma",
    followUpDate: "2025-03-13",
    notes: "Saw FB ad. Wants demo class.",
    createdAt: "2025-03-12",
    branchId: "Trichy"
  },
  {
    id: "L004",
    enquiryNo: "ENQ-2025-0004",
    name: "Divya Bharathi",
    age: 15,
    classInterested: "10",
    board: "CBSE",
    parentName: "Bharathi S",
    phone: "9840011223",
    whatsapp: "9840011223",
    email: "divya@example.com",
    source: "Student Referral",
    referredBy: "Arjun Krishnan (ROLL001)",
    subjects: ["Math", "Science"],
    mode: "Offline",
    status: "Demo Scheduled",
    assignedTo: "Karthik Raja",
    followUpDate: "2025-03-16",
    notes: "Friend of Arjun. Demo on Sunday.",
    createdAt: "2025-03-09",
    branchId: "Trichy"
  },
  {
    id: "L005",
    enquiryNo: "ENQ-2025-0005",
    name: "Eshwar V",
    age: 17,
    classInterested: "12",
    board: "CBSE",
    parentName: "Venkatesh",
    phone: "9840033445",
    whatsapp: "9840033445",
    email: "eshwar@example.com",
    source: "Google (SEO)",
    subjects: ["Math"],
    mode: "Offline",
    status: "Admitted",
    assignedTo: "Suresh Raina",
    followUpDate: "2025-03-10",
    notes: "Admission confirmed. Paid registration.",
    createdAt: "2025-03-05",
    branchId: "Trichy"
  },
  {
    id: "L006",
    enquiryNo: "ENQ-2025-0006",
    name: "Fathima Begum",
    age: 14,
    classInterested: "9",
    board: "CBSE",
    parentName: "Abdul",
    phone: "9840066778",
    whatsapp: "9840066778",
    email: "fathima@example.com",
    source: "Pamphlet",
    subjects: ["Science"],
    mode: "Offline",
    status: "Not Interested",
    assignedTo: "Priya Sharma",
    followUpDate: "2025-03-08",
    notes: "Fee too high for them.",
    createdAt: "2025-03-01",
    branchId: "Trichy"
  }
];
