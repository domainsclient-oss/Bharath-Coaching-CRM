// ──────────────────────────────────────────────
//  Website Download Center — Mock Data
// ──────────────────────────────────────────────

// ── Upload / Materials ────────────────────────
export type UploadCategory = "Notes" | "Past Papers" | "Worksheets" | "Syllabus" | "Other";
export type FileType = "PDF" | "DOC" | "PPT" | "ZIP" | "XLSX";

export interface WebsiteUpload {
  id: string;
  title: string;
  category: UploadCategory;
  subject: string;
  class: string;
  fileName: string;
  fileType: FileType;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  isPublic: boolean;
  downloadCount: number;
  branchId: string;
}

export const mockUploads: WebsiteUpload[] = [
  { id: "UPL001", title: "Physics Chapter 1 Notes", category: "Notes", subject: "Physics", class: "Class 11", fileName: "physics_ch1_notes.pdf", fileType: "PDF", fileSize: "1.8 MB", uploadedBy: "Rajesh Kumar", uploadedAt: "2026-03-10", isPublic: true,  downloadCount: 142, branchId: "Trichy" },
  { id: "UPL002", title: "Chemistry Past Papers 2025", category: "Past Papers", subject: "Chemistry", class: "Class 12", fileName: "chem_past_2025.pdf", fileType: "PDF", fileSize: "3.2 MB", uploadedBy: "Anitha Das", uploadedAt: "2026-03-15", isPublic: true,  downloadCount: 210, branchId: "Trichy" },
  { id: "UPL003", title: "Mathematics Worksheets Set A", category: "Worksheets", subject: "Mathematics", class: "Class 10", fileName: "math_ws_setA.pdf", fileType: "PDF", fileSize: "0.9 MB", uploadedBy: "Rajesh Kumar", uploadedAt: "2026-03-18", isPublic: true,  downloadCount: 88,  branchId: "Trichy" },
  { id: "UPL004", title: "English Grammar Guide", category: "Notes", subject: "English", class: "Class 9", fileName: "english_grammar.pdf", fileType: "PDF", fileSize: "2.1 MB", uploadedBy: "Divya Nair", uploadedAt: "2026-03-20", isPublic: false, downloadCount: 0,   branchId: "Trichy" },
  { id: "UPL005", title: "Biology Syllabus CBSE 2026", category: "Syllabus", subject: "Biology", class: "Class 12", fileName: "bio_syllabus_2026.pdf", fileType: "PDF", fileSize: "0.5 MB", uploadedBy: "Meena Srinivasan", uploadedAt: "2026-04-01", isPublic: true,  downloadCount: 305, branchId: "Trichy" },
  { id: "UPL006", title: "Physics Formula Sheet", category: "Notes", subject: "Physics", class: "Class 12", fileName: "physics_formula.pdf", fileType: "PDF", fileSize: "0.7 MB", uploadedBy: "Rajesh Kumar", uploadedAt: "2026-04-05", isPublic: true,  downloadCount: 197, branchId: "Trichy" },
  { id: "UPL007", title: "Mathematics Practice Set B", category: "Worksheets", subject: "Mathematics", class: "Class 11", fileName: "math_ws_setB.pdf", fileType: "PDF", fileSize: "1.2 MB", uploadedBy: "Rajesh Kumar", uploadedAt: "2026-04-08", isPublic: true,  downloadCount: 63,  branchId: "Trichy" },
  { id: "UPL008", title: "Economics Study Material", category: "Notes", subject: "Economics", class: "Class 12", fileName: "eco_study.pdf", fileType: "PDF", fileSize: "2.8 MB", uploadedBy: "Divya Nair", uploadedAt: "2026-04-09", isPublic: false, downloadCount: 0,   branchId: "Trichy" },
];

// ── Gallery ───────────────────────────────────
export type GalleryCategory = "Events" | "Campus" | "Students" | "Achievements" | "Facilities" | "Celebration";

export interface GalleryItem {
  id: string;
  title: string;
  caption?: string;
  imageUrl: string;
  category: GalleryCategory;
  uploadedAt: string;
  isPublished: boolean;
  branchId: string;
}

export const mockGallery: GalleryItem[] = [
  { id: "GAL001", title: "Annual Day 2026", caption: "Students performing cultural dance", imageUrl: "https://picsum.photos/seed/gal1/600/400", category: "Events", uploadedAt: "2026-03-02", isPublished: true,  branchId: "Trichy" },
  { id: "GAL002", title: "Science Exhibition", caption: "Students showcasing science projects", imageUrl: "https://picsum.photos/seed/gal2/600/400", category: "Events", uploadedAt: "2026-03-10", isPublished: true,  branchId: "Trichy" },
  { id: "GAL003", title: "Library & Reading Room", caption: "Our well-equipped library", imageUrl: "https://picsum.photos/seed/gal3/600/400", category: "Facilities", uploadedAt: "2026-03-12", isPublished: true,  branchId: "Trichy" },
  { id: "GAL004", title: "NEET Toppers 2025", caption: "Celebrating our students' achievement", imageUrl: "https://picsum.photos/seed/gal4/600/400", category: "Achievements", uploadedAt: "2026-03-20", isPublished: true,  branchId: "Trichy" },
  { id: "GAL005", title: "Campus Tour", caption: "Overview of our campus facilities", imageUrl: "https://picsum.photos/seed/gal5/600/400", category: "Campus", uploadedAt: "2026-04-01", isPublished: true,  branchId: "Trichy" },
  { id: "GAL006", title: "Teachers Day Celebration", caption: "Staff and students celebrate Teachers Day", imageUrl: "https://picsum.photos/seed/gal6/600/400", category: "Celebration", uploadedAt: "2026-04-05", isPublished: false, branchId: "Trichy" },
  { id: "GAL007", title: "JEE Results 2025", caption: "Our JEE qualifiers receiving prizes", imageUrl: "https://picsum.photos/seed/gal7/600/400", category: "Achievements", uploadedAt: "2026-04-07", isPublished: true,  branchId: "Trichy" },
  { id: "GAL008", title: "New Classroom Block", caption: "Newly built classroom wing", imageUrl: "https://picsum.photos/seed/gal8/600/400", category: "Campus", uploadedAt: "2026-04-09", isPublished: false, branchId: "Trichy" },
];

// ── Website Enquiries ─────────────────────────
export type EnquiryStatus = "New" | "Contacted" | "Converted" | "Closed";

export interface WebsiteEnquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  class: string;
  subject?: string;
  message?: string;
  source: "Website Form" | "Chat Widget" | "WhatsApp Button";
  status: EnquiryStatus;
  createdAt: string;
  branchId: string;
}

export const mockWebsiteEnquiries: WebsiteEnquiry[] = [
  { id: "WEQ001", name: "Aravind Kumar", phone: "9876501001", email: "aravind@email.com", class: "Class 11", subject: "Physics", message: "Looking for NEET coaching", source: "Website Form", status: "New", createdAt: "2026-04-10", branchId: "Trichy" },
  { id: "WEQ002", name: "Santhiya M", phone: "9876501002", class: "Class 12", subject: "Mathematics", source: "Chat Widget", status: "Contacted", createdAt: "2026-04-09", branchId: "Trichy" },
  { id: "WEQ003", name: "Rajan Pillai", phone: "9876501003", email: "rajan.p@email.com", class: "Class 10", source: "Website Form", status: "Converted", createdAt: "2026-04-08", branchId: "Trichy" },
  { id: "WEQ004", name: "Deepika S", phone: "9876501004", class: "Class 11", subject: "Chemistry", message: "Interested in weekend batch", source: "WhatsApp Button", status: "New", createdAt: "2026-04-08", branchId: "Trichy" },
  { id: "WEQ005", name: "Karthik R", phone: "9876501005", email: "karthik.r@email.com", class: "Class 12", subject: "Biology", source: "Website Form", status: "Contacted", createdAt: "2026-04-07", branchId: "Trichy" },
  { id: "WEQ006", name: "Meera Lakshmi", phone: "9876501006", class: "Class 9", source: "Chat Widget", status: "Closed", createdAt: "2026-04-05", branchId: "Trichy" },
  { id: "WEQ007", name: "Suresh T", phone: "9876501007", class: "Class 11", subject: "Physics", source: "Website Form", status: "Converted", createdAt: "2026-04-03", branchId: "Trichy" },
  { id: "WEQ008", name: "Ananya Devi", phone: "9876501008", email: "ananya.d@email.com", class: "Class 12", subject: "Mathematics", message: "Need info on JEE coaching", source: "Website Form", status: "New", createdAt: "2026-04-01", branchId: "Trichy" },
  { id: "WEQ009", name: "Praveen N", phone: "9876501009", class: "Class 10", source: "WhatsApp Button", status: "Contacted", createdAt: "2026-03-28", branchId: "Trichy" },
  { id: "WEQ010", name: "Lavanya R", phone: "9876501010", class: "Class 11", subject: "Chemistry", source: "Website Form", status: "Converted", createdAt: "2026-03-25", branchId: "Trichy" },
];

// ── Events ────────────────────────────────────
export type EventCategory = "Academic" | "Cultural" | "Sports" | "Seminar" | "Workshop" | "Holiday" | "Exam";

export interface WebsiteEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  endDate?: string;
  venue?: string;
  category: EventCategory;
  isPublished: boolean;
  branchId: string;
}

export const mockEvents: WebsiteEvent[] = [
  { id: "EVT001", title: "Annual Day Celebration 2026", description: "Grand annual day with cultural performances by students. Parents are cordially invited.", date: "2026-04-20", time: "10:00 AM", venue: "Main Auditorium", category: "Cultural", isPublished: true, branchId: "Trichy" },
  { id: "EVT002", title: "NEET Orientation Seminar", description: "Detailed orientation for Class 11 students on NEET preparation strategy, syllabus and exam pattern.", date: "2026-04-18", time: "09:00 AM", venue: "Seminar Hall", category: "Seminar", isPublished: true, branchId: "Trichy" },
  { id: "EVT003", title: "Unit Test — Physics & Chemistry", description: "Monthly unit test covering chapters 1-4 for Class 12 students.", date: "2026-04-25", time: "10:00 AM", venue: "All Classrooms", category: "Exam", isPublished: true, branchId: "Trichy" },
  { id: "EVT004", title: "Parent-Teacher Meeting", description: "Quarterly PTM for all classes. Please bring your ward's progress report.", date: "2026-05-03", time: "09:00 AM", venue: "Class Rooms", category: "Academic", isPublished: true, branchId: "Trichy" },
  { id: "EVT005", title: "Science Workshop — Robotics", description: "Hands-on robotics workshop conducted by experts from IIT Madras.", date: "2026-05-10", time: "10:00 AM", venue: "Computer Lab", category: "Workshop", isPublished: false, branchId: "Trichy" },
  { id: "EVT006", title: "Summer Sports Day", description: "Inter-class sports competition including athletics, cricket, and chess.", date: "2026-05-15", time: "07:00 AM", venue: "Playground", category: "Sports", isPublished: true, branchId: "Trichy" },
];

// ── News ──────────────────────────────────────
export type NewsCategory = "Achievement" | "Announcement" | "Result" | "Admission" | "General";

export interface WebsiteNews {
  id: string;
  title: string;
  content: string;
  category: NewsCategory;
  author: string;
  publishedAt: string;
  isPublished: boolean;
  branchId: string;
}

export const mockNews: WebsiteNews[] = [
  { id: "NEWS001", title: "3 Students Score 720/720 in NEET 2025", content: "We are proud to announce that three of our students — Priya R, Arjun K, and Meena S — have secured a perfect score of 720/720 in NEET 2025. This is a historic achievement for Bharath Academy.", category: "Achievement", author: "Admin", publishedAt: "2026-03-15", isPublished: true, branchId: "Trichy" },
  { id: "NEWS002", title: "Admissions Open for 2026-27 Batch", content: "Applications are now open for the 2026-27 academic year. We offer coaching for NEET, JEE, and Board exams. Early bird discounts available until April 30.", category: "Admission", author: "Admin", publishedAt: "2026-04-01", isPublished: true, branchId: "Trichy" },
  { id: "NEWS003", title: "JEE Mains Result — 15 Students Clear", content: "Bharath Academy celebrates as 15 students cleared JEE Mains 2025 with ranks under 10,000. Special coaching sessions for JEE Advanced are now available.", category: "Result", author: "Admin", publishedAt: "2026-03-20", isPublished: true, branchId: "Trichy" },
  { id: "NEWS004", title: "New Online Class Platform Launched", content: "We have launched our new online learning platform with live classes, recorded lectures, and doubt sessions. Students can access it 24/7 on any device.", category: "Announcement", author: "Meena Srinivasan", publishedAt: "2026-04-05", isPublished: true, branchId: "Trichy" },
  { id: "NEWS005", title: "Holiday Notice — Tamil New Year", content: "The institution will remain closed on April 14, 2026 on the occasion of Tamil New Year. Classes will resume on April 15.", category: "General", author: "Admin", publishedAt: "2026-04-10", isPublished: true, branchId: "Trichy" },
  { id: "NEWS006", title: "New Chemistry Lab Equipment Installed", content: "State-of-the-art chemistry lab equipment has been installed to provide hands-on practical experience for Class 11 and 12 students.", category: "Announcement", author: "Admin", publishedAt: "2026-04-08", isPublished: false, branchId: "Trichy" },
];

// ── Banners ───────────────────────────────────
export interface WebsiteBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  position: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  branchId: string;
}

export const mockBanners: WebsiteBanner[] = [
  { id: "BAN001", title: "NEET 2026 — Enrol Now", subtitle: "Expert coaching with 15+ years of experience. Limited seats available.", imageUrl: "https://picsum.photos/seed/ban1/1200/400", linkUrl: "/admissions", position: 1, isActive: true,  startDate: "2026-04-01", endDate: "2026-06-30", branchId: "Trichy" },
  { id: "BAN002", title: "JEE Mains Coaching", subtitle: "Proven track record with 100+ selections to NITs and IITs.", imageUrl: "https://picsum.photos/seed/ban2/1200/400", linkUrl: "/courses/jee", position: 2, isActive: true,  startDate: "2026-04-01", endDate: "2026-06-30", branchId: "Trichy" },
  { id: "BAN003", title: "Annual Day 2026", subtitle: "Join us for a grand celebration on April 20th.", imageUrl: "https://picsum.photos/seed/ban3/1200/400", position: 3, isActive: true,  startDate: "2026-04-10", endDate: "2026-04-20", branchId: "Trichy" },
  { id: "BAN004", title: "Free Demo Class", subtitle: "Register now for a free demo class. No obligation.", imageUrl: "https://picsum.photos/seed/ban4/1200/400", linkUrl: "/demo", position: 4, isActive: false, branchId: "Trichy" },
];
