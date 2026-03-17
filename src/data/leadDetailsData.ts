
export interface TimelineEntry {
  id: string;
  date: string;
  action: string;
  by: string;
  details?: string;
}

export interface LeadNote {
  id: string;
  date: string;
  content: string;
  by: string;
}

export interface CallLog {
  id: string;
  date: string;
  type: "Incoming" | "Outgoing";
  duration: string;
  outcome: string;
  by: string;
}

export const mockLeadTimeline: Record<string, TimelineEntry[]> = {
  "L001": [
    { id: "T1", date: "2025-03-12 11:00 AM", action: "Status changed to Contacted", by: "Priya Sharma" },
    { id: "T2", date: "2025-03-10 09:30 AM", action: "Enquiry Created", by: "System", details: "Source: Walk-in" }
  ],
  "L004": [
    { id: "T3", date: "2025-03-14 04:00 PM", action: "Demo Scheduled", by: "Karthik Raja", details: "Scheduled for Sunday 10 AM" },
    { id: "T4", date: "2025-03-12 02:15 PM", action: "Status changed to Interested", by: "Karthik Raja" },
    { id: "T5", date: "2025-03-09 10:00 AM", action: "Enquiry Created", by: "System", details: "Source: Student Referral" }
  ]
};

export const mockLeadNotes: Record<string, LeadNote[]> = {
  "L001": [
    { id: "N1", date: "2025-03-12", content: "Parent is very concerned about evening travel safety. Informed them about our shuttle service.", by: "Priya Sharma" },
    { id: "N2", date: "2025-03-10", content: "Student seems strong in Science but weak in Math fundamentals.", by: "Priya Sharma" }
  ],
  "L004": [
    { id: "N3", date: "2025-03-14", content: "Confirmed demo class. They requested a focus on Physics kinematics.", by: "Karthik Raja" }
  ]
};

export const mockLeadCalls: Record<string, CallLog[]> = {
  "L001": [
    { id: "C1", date: "2025-03-12 10:45 AM", type: "Outgoing", duration: "5m 20s", outcome: "Spoke to father. Interested.", by: "Priya Sharma" }
  ],
  "L002": [
    { id: "C2", date: "2025-03-11 03:00 PM", type: "Outgoing", duration: "0m 45s", outcome: "No answer. Left voicemail.", by: "Rajesh Kumar" }
  ]
};
