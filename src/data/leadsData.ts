
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
  },
  {
    id: "L007", enquiryNo: "ENQ-2025-0007", name: "Gokul Raj", age: 15,
    classInterested: "10", board: "CBSE", parentName: "Rajendran G",
    phone: "9841100001", whatsapp: "9841100001", email: "gokul@example.com",
    source: "Phone Call", subjects: ["Math", "Physics"], mode: "Offline",
    status: "Interested", assignedTo: "Rajesh Kumar", followUpDate: "2025-03-18",
    notes: "Called to enquire about Class 10 batch timings.", createdAt: "2025-03-13", branchId: "Trichy"
  },
  {
    id: "L008", enquiryNo: "ENQ-2025-0008", name: "Harini Suresh", age: 13,
    classInterested: "8", board: "ICSE", parentName: "Suresh M",
    phone: "9841100002", whatsapp: "9841100002", email: "harini@example.com",
    source: "Website", subjects: ["English", "Science"], mode: "Online",
    status: "New", assignedTo: "Priya Sharma", followUpDate: "2025-03-19",
    notes: "Filled website contact form. Wants online batch.", createdAt: "2025-03-14", branchId: "Trichy"
  },
  {
    id: "L009", enquiryNo: "ENQ-2025-0009", name: "Ismail Khan", age: 16,
    classInterested: "11", board: "State", parentName: "Ibrahim Khan",
    phone: "9841100003", whatsapp: "9841100003", email: "ismail@example.com",
    source: "Banner / Sunpack", subjects: ["Chemistry", "Biology"], mode: "Offline",
    status: "Contacted", assignedTo: "Karthik Raja", followUpDate: "2025-03-20",
    notes: "Saw banner near school. Called for details.", createdAt: "2025-03-12", branchId: "Trichy"
  },
  {
    id: "L010", enquiryNo: "ENQ-2025-0010", name: "Jayalakshmi P", age: 17,
    classInterested: "12", board: "CBSE", parentName: "Prakash P",
    phone: "9841100004", whatsapp: "9841100004", email: "jaya@example.com",
    source: "School Reference", subjects: ["Math", "Physics"], mode: "Offline",
    status: "Demo Scheduled", assignedTo: "Suresh Raina", followUpDate: "2025-03-17",
    notes: "Referred by Class 12 school teacher.", createdAt: "2025-03-11", branchId: "Trichy"
  },
  {
    id: "L011", enquiryNo: "ENQ-2025-0011", name: "Kiran Babu", age: 14,
    classInterested: "9", board: "CBSE", parentName: "Babu K",
    phone: "9841100005", whatsapp: "9841100005", email: "kiran@example.com",
    source: "Old Students", subjects: ["Science"], mode: "Offline",
    status: "Admitted", assignedTo: "Priya Sharma", followUpDate: "2025-03-10",
    notes: "Elder sibling studied here. Came back for younger child.", createdAt: "2025-03-08", branchId: "Trichy"
  },
  {
    id: "L012", enquiryNo: "ENQ-2025-0012", name: "Lavanya Sri", age: 15,
    classInterested: "10", board: "State", parentName: "Srikanth L",
    phone: "9841100006", whatsapp: "9841100006", email: "lavanya@example.com",
    source: "WhatsApp Enquiry", subjects: ["Math", "English"], mode: "Online",
    status: "Contacted", assignedTo: "Rajesh Kumar", followUpDate: "2025-03-21",
    notes: "Sent message on WhatsApp group. Wants online class details.", createdAt: "2025-03-15", branchId: "Trichy"
  },
  {
    id: "L013", enquiryNo: "ENQ-2025-0013", name: "Manikandan R", age: 16,
    classInterested: "11", board: "CBSE", parentName: "Rajesh R",
    phone: "9841100007", whatsapp: "9841100007", email: "mani@example.com",
    source: "Social Media", subjects: ["Physics", "Math"], mode: "Either",
    status: "New", assignedTo: "Karthik Raja", followUpDate: "2025-03-22",
    notes: "Commented on Instagram post. Wants to know fee structure.", createdAt: "2025-03-14", branchId: "Trichy"
  },
  {
    id: "L014", enquiryNo: "ENQ-2025-0014", name: "Nithya Devi", age: 13,
    classInterested: "8", board: "CBSE", parentName: "Devi S",
    phone: "9841100008", whatsapp: "9841100008", email: "nithya@example.com",
    source: "Pamphlet", subjects: ["English", "Science"], mode: "Offline",
    status: "Interested", assignedTo: "Priya Sharma", followUpDate: "2025-03-23",
    notes: "Got pamphlet from school gate distribution.", createdAt: "2025-03-13", branchId: "Trichy"
  },
  {
    id: "L015", enquiryNo: "ENQ-2025-0015", name: "Omar Farouk", age: 17,
    classInterested: "12", board: "State", parentName: "Farouk A",
    phone: "9841100009", whatsapp: "9841100009", email: "omar@example.com",
    source: "Student Referral", referredBy: "Chandru Singh (ENQ-2025-0003)",
    subjects: ["Chemistry", "Biology"], mode: "Offline",
    status: "New", assignedTo: "Suresh Raina", followUpDate: "2025-03-24",
    notes: "Friend of Chandru. Both want to join together.", createdAt: "2025-03-15", branchId: "Trichy"
  },
  {
    id: "L016", enquiryNo: "ENQ-2025-0016", name: "Preethi Anand", age: 15,
    classInterested: "10", board: "CBSE", parentName: "Anand P",
    phone: "9841100010", whatsapp: "9841100010", email: "preethi@example.com",
    source: "Google (SEO)", subjects: ["Math", "Science"], mode: "Offline",
    status: "Contacted", assignedTo: "Rajesh Kumar", followUpDate: "2025-03-25",
    notes: "Found us through Google search. Visited website and called.", createdAt: "2025-03-16", branchId: "Trichy"
  },
  {
    id: "L017", enquiryNo: "ENQ-2025-0017", name: "Ragul Krishnan", age: 16,
    classInterested: "11", board: "CBSE", parentName: "Krishnan A",
    phone: "9841100011", whatsapp: "9841100011", email: "ragul@example.com",
    source: "Walk-in", subjects: ["Physics", "Chemistry"], mode: "Offline",
    status: "Demo Scheduled", assignedTo: "Karthik Raja", followUpDate: "2025-03-26",
    notes: "Walked in during evening. Wants to see facility before enrolling.", createdAt: "2025-03-16", branchId: "Trichy"
  }
];
