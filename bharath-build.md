




BHARATH ACADEMY
CRM & Student Portal
Master Build Plan — Page by Page Prompts




Next.js App Router	Multi-Branch	Role-Based RBAC	47 Pages


Foundation complete. Build each page using the prompts in this document in order.
 
How to Use This Document
The foundation (Phase 1) is already built. This document contains one prompt per page. Paste each prompt into your AI coding tool in order. Each prompt references what was already built so the tool has full context.

Prompt Format
•	Each prompt starts with 'CONTEXT:' — what already exists in the codebase
•	Then 'BUILD:' — exactly what to build in this page/session
•	Then 'DATA:' — mock data structure the page should use
•	Then 'SPEC:' — detailed UI and functional specifications
•	Then 'CHECKLIST:' — verify these before marking done

Stack Already Established
•	Next.js 14+ with App Router (src/app directory structure)
•	TypeScript throughout
•	Tailwind CSS with HSL variables from globals.css
•	Navy #1E2A4A and Teal #0D7C8F as primary palette
•	AuthProvider in src/app/layout.tsx
•	BranchContext with Trichy as default
•	lucide-react for icons

📌  Every page prompt is self-contained. If your AI tool loses context, paste the CONTEXT block again before the BUILD block. Always test one page before moving to the next.

Role Access Key
Badge	Role	Access Level
SA	Super Admin	All branches, all modules, consolidated reports, branch switching
A	Admin	Own branch only, all modules within branch, no branch switching
T	Teacher	Own branch, academic modules only. No HR payroll, no settings
S	Student	Student portal only — resources, tests, progress, fees, notices
 
Complete Page Index — 47 Pages
Every page in the system mapped to its route and access role.

Admin CRM — 38 Pages
#	Page / Module	Next.js Route	Role Access
01	Dashboard	/dashboard	SA · A · T
02	Student List	/students	SA · A · T
03	Add Student Form	/students/add	SA · A
04	Student Profile	/students/[id]	SA · A · T
05	Online Admissions	/students/online	SA · A
06	Discontinued Students	/students/discontinued	SA · A
07	Class Management	/academics/classes	SA · A
08	Subject Management	/academics/subjects	SA · A
09	Teacher Assignment	/academics/teachers	SA · A
10	Class Timetable	/academics/class-timetable	SA · A · T
11	Teacher Timetable	/academics/teacher-timetable	SA · A · T
12	Student Attendance	/attendance/students	SA · A · T
13	Staff Attendance	/attendance/staff	SA · A
14	Attendance Reports	/attendance/reports	SA · A · T
15	Live Online Classes	/online-classes	SA · A · T
16	Online Timetable	/online-classes/timetable	SA · A · T
17	Enquiry Pipeline	/leads	SA · A
18	Add Enquiry	/leads/add	SA · A
19	Enquiry Detail	/leads/[id]	SA · A
20	Phone Call Log	/leads/phone-log	SA · A
21	Reminders	/leads/reminders	SA · A
22	Collect Fee	/fees/collect	SA · A
23	Balance Dues	/fees/balance	SA · A
24	One-to-One Fees	/fees/one-to-one	SA · A
25	Fee Search & Receipt	/fees/search	SA · A
26	Fee Analytics	/fees/analytics	SA only
27	Exam Schedule	/examination	SA · A · T
28	Mark Entry	/examination/marks	SA · A · T
29	Print Marksheet	/examination/marksheet	SA · A · T
30	Question Bank	/assessment/question-bank	SA · A · T
31	Create Online Exam	/assessment/create	SA · A · T
32	Exam Results	/assessment/results/[id]	SA · A · T
33	Staff Directory	/hr	SA · A
34	Add/Edit Staff	/hr/staff/[id]	SA · A
35	Payroll	/hr/payroll	SA · A
36	Expenditure	/expenditure	SA · A
37	Reports Hub	/reports	SA · A · T
38	Settings	/settings	SA only


Student Portal — 9 Pages
#	Page / Module	Next.js Route	Role Access
SP1	Student Dashboard	/student/dashboard	Student
SP2	Resource Library	/student/resources	Student
SP3	Video Lectures	/student/videos	Student
SP4	Question Papers	/student/question-papers	Student
SP5	My Tests (List)	/student/tests	Student
SP6	Take a Test	/student/tests/[id]/take	Student
SP7	Test Results	/student/tests/[id]/result	Student
SP8	My Progress	/student/progress	Student
SP9	Notices, Fees & Timetable	/student/notices	Student
 
01	Dashboard — Admin CRM	SA · A · T	/dashboard

CONTEXT — What already exists
Bharath Academy CRM — Next.js App Router, TypeScript, Tailwind CSS.
Foundation is built: AuthProvider, BranchContext (default: Trichy branch), AdminLayout with sidebar and header, 27+ placeholder routes established.
Navy (#1E2A4A) / Teal (#0D7C8F) design system in globals.css with HSL variables.
Branch switcher is in the header (super_admin only). BranchContext provides currentBranch and isAllBranches.

BUILD — What to build in this session
Build the full Dashboard page at src/app/(admin)/dashboard/page.tsx.
This is the first real page after login. All data is mocked — no API calls yet.
Branch-aware: all stats and lists must filter through currentBranch.id.
Super admin in "All Branches" mode sees consolidated totals across all branches.

DATA — Mock data structure
// Mock data to define in src/data/dashboardData.ts
export const mockStats = {
  totalStudents: 248,
  activeStaff: 18,
  feesCollectedThisMonth: 182500,
  pendingDues: 43200,
  todayStudentAttendance: { present: 192, total: 210 },
  todayStaffAttendance: { present: 16, total: 18 },
}
export const mockMonthlyFees = [
  { month:"Sep", collected:145000 },
  { month:"Oct", collected:162000 },
  { month:"Nov", collected:158000 },
  { month:"Dec", collected:172000 },
  { month:"Jan", collected:168000 },
  { month:"Feb", collected:182500 },
]
export const mockLeadSources = [
  { name:"Walk-in", value:32 }, { name:"WhatsApp", value:28 },
  { name:"Referral", value:18 }, { name:"Social Media", value:14 },
  { name:"Others", value:8 },
]
export const mockFeeAlerts = [
  { name:"Riya Sharma", class:"10", amount:4500, dueDate:"2025-03-15" },
  { name:"Kiran Raj", class:"9", amount:3200, dueDate:"2025-03-10" },
  { name:"Priya S", class:"8", amount:6000, dueDate:"2025-03-08" },
]
export const mockRecentEnquiries = [
  { name:"Arun Kumar", source:"WhatsApp", class:"10", status:"New", date:"2025-03-12" },
  { name:"Lakshmi D", source:"Walk-in", class:"9", status:"Contacted", date:"2025-03-11" },
  { name:"Vikram T", source:"Referral", class:"11", status:"Interested", date:"2025-03-10" },
]

SPEC — Detailed UI & functional specification
Layout — 3 row grid, full width, responsive

ROW 1 — KPI Cards (4 cards, equal width):
Each card: white bg, rounded-xl, subtle shadow, p-5
  Card 1: Total Students — count number, "+12 this month" sub-text, Users icon (teal)
  Card 2: Active Staff — count, role breakdown hint, UserCheck icon (navy)
  Card 3: Fees Collected — ₹ formatted (toLocaleString "en-IN"), "This Month" label, IndianRupee icon (green)
  Card 4: Pending Dues — ₹ formatted, shown in amber/red if > 0, AlertCircle icon
Each card has a subtle left border (4px) in the card's accent color.
Animate cards in on mount (staggered fade-up using Tailwind animate or framer-motion if available).

ROW 2 — Charts (2 columns, 60/40 split):
Left: Monthly Fee Collection Bar Chart
  Use recharts BarChart. X=month, Y=₹ amount (formatted).
  Bar color: teal (#0D7C8F). Tooltip shows exact amount.
  Title: "Fee Collection — Last 6 Months"
Right: Lead Source Pie Chart
  recharts PieChart with custom legend below.
  Colors: teal, navy, gold, green, gray variants.
  Title: "Lead Sources This Month"

ROW 3 — Two columns (50/50):
Left: Today's Attendance
  Two progress rings (or large horizontal bars) side by side:
    Students: 192 / 210 = 91% (green ring)
    Staff: 16 / 18 = 89% (teal ring)
  Below: "Mark Attendance" quick action button

Right: Fee Due Alerts
  Table-style list: Name | Class | ₹ Amount | Due Date | [Remind] button
  Overdue rows: red left border, amber background tint
  "Remind" button: outline style, shows WhatsApp icon
  "View All Dues" link at bottom

ROW 4 — Two columns (50/50):
Left: Recent Enquiries
  List of 3 cards: Name | Source badge (color per source) | Class | Status badge | Date
  "View All Leads" link
Right: Quick Actions
  Grid of 6 icon buttons (2x3):
  + Add Student | ₹ Collect Fee | ✓ Attendance
  📞 New Enquiry | 📝 Schedule Exam | 📊 Reports

Branch header bar (below page title, above row 1):
If isAllBranches: show gold banner "Viewing: All Branches — Consolidated Data"
Else: show teal banner "Viewing: [Branch Name] — [Location]"

CHECKLIST — Verify before marking done
•	Dashboard loads without errors
•	KPI cards show correct mocked values
•	Fee collection bar chart renders correctly
•	Lead source pie chart renders correctly
•	Attendance rings/bars show correct percentages
•	Fee due alerts table renders with overdue styling
•	Recent enquiries list renders with source badges
•	Quick action buttons are present and styled
•	Branch banner shows correct branch name
•	Super admin in All Branches mode shows consolidated banner
•	Page is responsive (stacks to 1 col on mobile)


 
02	Student List	SA · A · T	/students

CONTEXT — What already exists
Bharath Academy CRM. Foundation + Dashboard (Page 01) are built.
useBranchData() hook filters all data by currentBranch.id.
Students data will be stored in src/data/studentsData.ts and filtered via useBranchData.

BUILD — What to build in this session
Build the Student List page at src/app/(admin)/students/page.tsx.
This is the master list of all enrolled students. It supports filtering, searching, and links to individual student profiles.
Also build src/data/studentsData.ts with 15 mock students (spread across branches BR001-BR003).

DATA — Mock data structure
// src/data/studentsData.ts — seed 15 students
export interface Student {
  id: string; appNo: string; name: string; class: string;
  board: "CBSE"|"ICSE"|"State"|"IB"; school: string;
  subjects: string[]; phone: string; whatsapp: string;
  parentName: string; mode: "Online"|"Offline";
  status: "Active"|"Discontinued"|"Alumni";
  branchId: string; admissionDate: string;
  rollNo: string; photo?: string;
}
// Create 15 students: 6 in BR001, 5 in BR002, 4 in BR003
// Mix of classes 8-12, boards CBSE and State, various subjects

SPEC — Detailed UI & functional specification
Page Layout:

HEADER ROW:
  Left: Page title "Students" + breadcrumb "Dashboard > Students"
  Right: [+ Add Student] button (navy bg, white text, UserPlus icon)
         [Export CSV] button (outline style)

FILTER BAR (card with p-4, below header):
  Row of filter inputs:
  Class (select: All / 8 / 9 / 10 / 11 / 12)
  Board (select: All / CBSE / ICSE / State / IB)
  Mode (select: All / Online / Offline)
  Status (select: All / Active / Discontinued)
  Search input (placeholder: "Search by name or app number...")
  [Search] button (teal) | [Reset] link
  Show: "Showing 12 of 15 students" count text

RESULTS TABLE (white card, rounded-xl):
  Columns:
  App No | Student Name + photo avatar | Class | Board | School | Subjects (chips) | Mode | Status | Actions

  Student Name cell: avatar circle (initials, teal bg) + name bold + parent name muted below
  Subjects: show first 2 as small chips, "+N more" if more
  Mode: Online = teal badge, Offline = navy badge
  Status: Active = green badge, Discontinued = red, Alumni = gray

  Actions column (3 icon buttons):
    Eye icon → link to /students/[id]
    Pencil icon → link to /students/[id]/edit
    X icon (red) → "Mark Discontinued" with confirmation dialog

  Row hover: subtle bg highlight
  Sorted by: admission date desc by default

PAGINATION:
  20 rows per page. Prev / Next buttons + "Page 1 of 3" text.
  Page size selector: [20] [50] [100]

Empty state: illustration placeholder + "No students found matching your filters."

CHECKLIST — Verify before marking done
•	Student list renders 15 mock students
•	useBranchData filters students to current branch
•	Class / Board / Mode / Status filters work
•	Search filters by name and app number
•	Student avatar shows initials correctly
•	Subject chips show correctly with +N overflow
•	Mode and Status badges have correct colors
•	Eye icon links to /students/[id]
•	Export CSV button is present
•	Add Student button links to /students/add
•	Pagination renders (even if only 1 page with 15 students)


 
03	Add / Edit Student Form	SA · A	/students/add

CONTEXT — What already exists
Bharath Academy CRM. Student List (Page 02) is built with studentsData.ts.
useBranchId() returns currentBranch.id for tagging new records.
The form saves to a React Context store (StudentsContext) or directly to the mock data array for now.

BUILD — What to build in this session
Build the student add/edit form at:
  src/app/(admin)/students/add/page.tsx
  src/app/(admin)/students/[id]/edit/page.tsx (reuse same form component)
Create a shared component: src/components/students/StudentForm.tsx
On submit, generate Application No (APP-YYYY-NNNN), save to students store, redirect to /students/[id].

DATA — Mock data structure
// Form fields and their types:
{
  // Personal
  name: string, dob: string, gender: "Male"|"Female"|"Other",
  photo: File|null,
  // Contact
  parentName: string, phone: string, whatsapp: string,
  email: string, address: string, city: string, pincode: string,
  // Academic
  school: string, class: string, board: string, medium: string,
  // Enrollment
  subjects: string[], mode: "Online"|"Offline",
  batchPreference: string,
  // Documents — checkboxes
  docs: { reportCard: boolean, idProof: boolean, photo: boolean },
  // Fee
  feeType: "Standard"|"OneToOne",
  totalFee: number, instalmentPlan: "Full"|"2 Parts"|"3 Parts",
}

SPEC — Detailed UI & functional specification
Multi-step form with 5 tabs/steps across the top:
Step indicators: [1 Personal] [2 Contact] [3 Academic] [4 Enrollment] [5 Fee Plan]
Active step: teal bg + white text. Completed: green checkmark. Upcoming: gray.
Progress bar across the top (20% per step).

Step 1 — Personal Details:
  Full Name (required), Date of Birth (date picker), Gender (radio: Male/Female/Other)
  Photo upload: dashed border upload area, shows preview if selected
  "Next →" button

Step 2 — Contact:
  Parent/Guardian Name (required)
  Phone Number | WhatsApp Number (checkbox: "Same as phone")
  Email Address
  Full Address (textarea), City, PIN Code

Step 3 — Academic:
  School/College Name
  Class (select 1–12 + dropdwon)
  Board (CBSE/ICSE/State/IB)
  Medium (English/Tamil/Hindi)

Step 4 — Enrollment:
  Subjects (multi-select tag input — type to add, click chip to remove)
  Suggested subjects based on class: e.g. Class 10 → Math, Science, Social, English, Tamil
  Mode: large toggle card — [🏫 Offline] [💻 Online]
  Batch Preference (text input, optional)
  Documents checklist: Report Card ☐ | ID Proof ☐ | Photo ☐

Step 5 — Fee Plan:
  Fee Type: [Standard Batch] [One-to-One] toggle
  Total Fee Amount (₹ number input)
  Instalment Plan: [Full Payment] [2 Instalments] [3 Instalments]
  Fee Due Date (date picker for first instalment)

Bottom of each step:
  "← Back" (gray) | "Next →" (teal) | "Save & Finish" on last step

On Save:
  Generate App No: APP-{year}-{4-digit-padded-index}
  Tag with branchId from useBranchId()
  Add to students store
  Show success toast: "Student Added — APP-2025-0016"
  Redirect to /students/[newId]

Validation:
  Required fields marked with *. Show inline red error on blur.
  Cannot proceed to next step if required fields empty.

CHECKLIST — Verify before marking done
•	5-step progress indicator renders correctly
•	Step navigation (Next/Back) works
•	Cannot advance with empty required fields
•	Photo upload shows preview
•	Subject multi-select tag input works
•	Online/Offline mode toggle cards work
•	Fee plan instalment selector works
•	On submit: App No is generated (APP-2025-XXXX format)
•	New student is tagged with correct branchId
•	Success toast appears after save
•	Edit mode pre-fills all fields from existing student data


 
04	Student Profile	SA · A · T	/students/[id]

CONTEXT — What already exists
Bharath Academy CRM. Student List and Add Form (Pages 02-03) are built.
studentsData.ts has 15 mock students. Student profile reads from that store by id.

BUILD — What to build in this session
Build the student profile page at src/app/(admin)/students/[id]/page.tsx.
This is the single view for all student information, organized into tabs.
Also seed mock attendance, fees, marks, and activity log data for ROLL001.

DATA — Mock data structure
// Extend studentsData.ts or create separate files:
// mockAttendance[studentId] — array of { date, status: "Present"|"Absent"|"Leave" }
// mockStudentFees[studentId] — array of fee records (from fees data)
// mockStudentMarks[studentId] — array of { subject, exam, maxMarks, obtained, grade }
// mockActivityLog[studentId] — array of { date, action, by }

SPEC — Detailed UI & functional specification
Page Layout:

PROFILE HEADER (full-width card, navy gradient bg):
  Left: Large avatar (80px, initials or photo), name (24px white bold), App No (muted white)
  Right top: Status badge (Active/Discontinued) + Mode badge (Online/Offline)
  Below name: Class | Board | School | Branch name
  Top-right corner: [Edit Profile] button (outline white) | [Print] icon

TAB BAR (5 tabs below header):
  [Profile] [Fees] [Attendance] [Marks] [Activity Log]

Tab 1 — Profile:
  Two-column grid of labeled fields:
  Personal: Name, DOB, Gender, Age (calculated)
  Contact: Parent Name, Phone, WhatsApp, Email, Address
  Academic: School, Class, Board, Medium, Subjects (chips), Mode, Batch
  Documents: checkboxes showing which docs are collected

Tab 2 — Fees:
  Summary row: Total Fees | Collected | Balance (large numbers, color-coded)
  Fee records table: Bill No | Subjects | Total | Inst-I | Inst-II | Inst-III | Balance | Next Due
  [Collect Fee] button links to /fees/collect?studentId=[id]
  [Print Receipt] per row

Tab 3 — Attendance:
  Month/Year selector
  Calendar grid (4 weeks, Mon-Sun columns):
    Green circle = Present, Red = Absent, Amber = Leave, Gray = No class
  Summary below: Present: 18 | Absent: 3 | Leave: 1 | Attendance: 86%

Tab 4 — Marks:
  Exam selector dropdown
  Table: Subject | Max Marks | Obtained | % | Grade
  Total row. Pass/Fail status.

Tab 5 — Activity Log:
  Timeline list: date-time | action | by whom
  e.g. "Fee collected ₹3,500 — by Admin on 10 Mar 2025"

CHECKLIST — Verify before marking done
•	Profile header shows correct student data
•	All 5 tabs render without errors
•	Profile tab shows all form fields correctly
•	Fees tab shows fee records table
•	Attendance calendar grid renders with correct colors
•	Attendance summary calculates percentage correctly
•	Marks tab shows subject-wise marks table
•	Activity log timeline renders
•	Edit Profile button links to /students/[id]/edit
•	Collect Fee button passes studentId in URL


 
05-06	Online Admissions & Discontinued Students	SA · A	/students/online · /students/discontinued

CONTEXT — What already exists
Bharath Academy CRM. Student pages 02-04 are built. studentsData.ts has branchId, status fields.

BUILD — What to build in this session
Build two sub-pages:
A) src/app/(admin)/students/online/page.tsx — Online admission enquiries from website
B) src/app/(admin)/students/discontinued/page.tsx — Students who left mid-year
Both pages filter data via useBranchData().

DATA — Mock data structure
// Online admissions — separate from main students
// mockOnlineAdmissions: { id, name, class, board, phone, email, submittedDate,
//   status:"New"|"Contacted"|"Admitted"|"Rejected", source:"Website" }
// Seed 8 records.

// Discontinued students — from main students where status="Discontinued"
// Add discontinued reason + date + fee balance fields to those records.

SPEC — Detailed UI & functional specification
A. Online Admissions Page:
Filter: Status (All/New/Contacted/Admitted/Rejected) + Date range + Search
Table: App No | Name | Class | Board | Phone | Email | Submitted | Status badge | Actions
Actions: [View] | [Convert to Student] (opens /students/add pre-filled) | [Reject]
Status badges: New=blue, Contacted=amber, Admitted=green, Rejected=red
"Convert to Student" action should pre-fill the add student form with this data.

B. Discontinued Students Page:
Filter: Class | Board | Date range + Search
Table: Name | Class | Subject | Bill No | Total Fees | Collected | Balance | Reason | Date
Balance shown in red if > 0.
[Send Reminder] button per row (WhatsApp placeholder).
Summary card at top: Total Discontinued This Year | Total Outstanding Balance

CHECKLIST — Verify before marking done
•	Online admissions table renders 8 mock records
•	Status filter works on online admissions
•	Discontinued students table renders filtered by branch
•	Balance column shows red for outstanding amounts
•	Convert to Student button is present


 
07-11	Academics Module — All 5 Pages	SA · A · T	/academics/*

CONTEXT — What already exists
Bharath Academy CRM. Student module (Pages 02-06) built. Branch filtering active.
All academics data must include branchId.

BUILD — What to build in this session
Build all 5 academics pages:
  07: src/app/(admin)/academics/classes/page.tsx
  08: src/app/(admin)/academics/subjects/page.tsx
  09: src/app/(admin)/academics/teachers/page.tsx
  10: src/app/(admin)/academics/class-timetable/page.tsx
  11: src/app/(admin)/academics/teacher-timetable/page.tsx

Create src/data/academicsData.ts with seed data for all.

DATA — Mock data structure
// Classes: { id, name:"Class 10", board:"CBSE", mode:"Offline"|"Online"|"Both",
//   studentCount:42, branchId }
// Subjects: { id, name:"Mathematics", classIds:[], board:"CBSE",
//   type:"Theory"|"Practical", branchId }
// Teachers: from HR stub — { id, name, subjects:[], classes:[], branchId }
// Timetable: { classId, day:"Mon"|...|"Sat", timeSlot:"4:00-5:00 PM",
//   subjectId, teacherId, mode:"Online"|"Offline", branchId }
// Seed: 6 classes, 8 subjects, timetable for Class 10 Mon-Sat

SPEC — Detailed UI & functional specification
**07 — Classes:** Simple table with [Add Class] modal.
Table: Class Name | Board | Mode badge | Student Count | Actions (Edit/Delete)
Add/Edit modal: Class name + Board select + Mode toggle

**08 — Subjects:** Table with [Add Subject] modal.
Table: Subject Name | Linked Classes (chips) | Board | Type | Actions
Modal: Subject name + Classes multi-select + Board + Theory/Practical toggle

**09 — Teacher Assignment:** Card grid of teachers (from HR data stub).
Each card: Avatar + Name + Assigned Subjects (chips) + [Assign] button
Assign modal: Teacher select + Subject select + Class select + Batch input

**10 — Class Timetable:** ★ Most complex in this group
Filter: Class select + Board select → [Load Timetable] button
Grid: Rows = time slots (4:00–5:00, 5:00–6:00, 6:00–7:00 PM + morning slots)
      Columns = Mon, Tue, Wed, Thu, Fri, Sat
Each cell: Subject chip + Teacher name + Mode badge
Empty cell: [+ Add] button → inline modal to add slot
[Print Timetable] button (window.print() with print-only CSS)

**11 — Teacher Timetable:** Read-only view.
Teacher select dropdown → shows weekly grid of that teacher's schedule.
Each cell: Class + Subject. Generated from class timetable data.

CHECKLIST — Verify before marking done
•	All 5 academics pages render without errors
•	Add Class modal works and saves to store
•	Add Subject modal works with class multi-select
•	Teacher cards show assigned subjects
•	Class timetable grid renders with correct time slots
•	Timetable cells show subject + teacher + mode
•	Empty cells show + Add button
•	Teacher timetable filters correctly by teacher
•	Print timetable button triggers print


 
12-14	Attendance Module — 3 Pages	SA · A · T	/attendance/*

CONTEXT — What already exists
Bharath Academy CRM. Academics module built. Students and Staff data exist in their respective stores.
Attendance marks are stored in attendanceData.ts as { studentId/staffId, date, status, branchId }.

BUILD — What to build in this session
Build 3 attendance pages:
  12: src/app/(admin)/attendance/students/page.tsx
  13: src/app/(admin)/attendance/staff/page.tsx
  14: src/app/(admin)/attendance/reports/page.tsx
Create src/data/attendanceData.ts with 30 days of mock attendance for Class 10 students.

DATA — Mock data structure
// attendanceRecord: { id, entityId, entityType:"student"|"staff",
//   date: "YYYY-MM-DD", status:"Present"|"Absent"|"Leave"|"Half-Day",
//   notes?: string, markedBy: string, branchId }
// Seed: 30 days × 6 Class 10 students = 180 records
// Seed: 30 days × 5 staff = 150 records

SPEC — Detailed UI & functional specification
12 — Student Attendance:
FILTER ROW: Date picker (default today) | Class select | Mode (Online/Offline) | [Load Students]

ATTENDANCE SHEET (full-width card):
  Header: "Class 10 — [Date]" + Already Marked? badge (if data exists for that date)
  Bulk actions: [✓ Mark All Present] [✗ Mark All Absent] buttons

  Table: # | Student Photo+Name | Roll No | [Present] [Absent] [Leave] toggle buttons
  Toggle buttons: 3 styled buttons per row, active state colored (green/red/amber)
  Notes icon per row: click to add optional absence note (popover/tooltip)

  Bottom: [Submit Attendance] button (teal, full width)
  If already submitted: show read-only view with [Edit] option

13 — Staff Attendance:
  Same layout as student attendance but:
  Columns: # | Staff Name+Role | [Present] [Absent] [Half-Day] [Leave] | Reason text input
  Reason field shows when Absent or Leave is selected

14 — Attendance Reports:
Two tabs: [Student Reports] [Staff Reports]

Student Reports tab:
  Filter: Student name search OR Class + Month/Year select → [Load Report]
  Calendar grid view: month grid (7 cols Mon-Sun), colored dots per day
  Summary row: Present: 22 | Absent: 3 | Leave: 1 | Total: 26 | 85% Attendance
  [Print Report] button

Staff Reports tab:
  Filter: Staff select + Month/Year → [Load Report]
  Table: Date | Day | Status | Notes
  Summary: Working Days | Present | Absent | Leave count

CHECKLIST — Verify before marking done
•	Student attendance sheet loads students for selected class+date
•	Toggle buttons switch between Present/Absent/Leave correctly
•	Mark All Present/Absent bulk actions work
•	Submit saves attendance records with date and branchId
•	Already-marked date shows read-only view with Edit option
•	Staff attendance has half-day and reason fields
•	Student report calendar grid renders with correct colors
•	Attendance % calculation is correct
•	Print report works


 
15-16	Online Classes — 2 Pages	SA · A · T	/online-classes/*

CONTEXT — What already exists
Bharath Academy CRM. Academics and Attendance modules built. Teacher and class data available.

BUILD — What to build in this session
Build:
  15: src/app/(admin)/online-classes/page.tsx — Live/Upcoming classes list + Create Session
  16: src/app/(admin)/online-classes/timetable/page.tsx — Online class weekly timetable
Create src/data/onlineClassesData.ts with 10 mock sessions.

DATA — Mock data structure
// OnlineClass: { id, title, class:string, subject:string, teacherId:string,
//   teacherName:string, date:string, time:string, duration:number,
//   meetLink:string, status:"Scheduled"|"Live"|"Ended",
//   description?:string, branchId:string }
// Seed 10 sessions: 3 Scheduled (future dates), 1 Live (today), 6 Ended

SPEC — Detailed UI & functional specification
15 — Live & Upcoming Classes:
PAGE HEADER: Title + [+ Schedule Class] button (opens creation modal/form)

FILTER: Date range | Class | Subject | Status
  Status tabs across top: [All] [Live Now (1)] [Scheduled (3)] [Ended (6)]
  "Live Now" tab has pulsing red dot

CLASS LIST TABLE:
  Columns: Title | Class | Subject | Teacher | Date & Time | Duration | Status | Actions
  Status badges: Live=red pulsing dot, Scheduled=blue, Ended=gray
  Actions: [Join] (opens meetLink, disabled if Ended) | [Attendance] | [Edit] | [Delete]

CREATE SESSION MODAL (trigger from + button):
  Form: Meeting Title* | Class* | Subject* | Teacher* | Date* | Time* |
        Duration (30/45/60/90/120 min) | Google Meet Link | Description
  [Generate Placeholder Link] button: sets link to "https://meet.google.com/placeholder-[random]"
  [Save Session] button

16 — Online Timetable:
Filter: Class select → updates grid
Weekly grid (same structure as class timetable):
  Cells show: Subject + Teacher + Join button (if link available and scheduled)
  Online cells: teal gradient bg
  Past classes: gray, strikethrough on join button

CHECKLIST — Verify before marking done
•	Classes list shows 10 mock sessions with correct status badges
•	Live Now tab has pulsing red dot indicator
•	Join button opens meet link (or shows disabled for Ended)
•	Create Session modal form works
•	Session saved with branchId correctly
•	Generate placeholder link works
•	Online timetable grid renders correctly
•	Class filter updates timetable grid


 
17-21	Lead Management — 5 Pages	SA · A	/leads/*

CONTEXT — What already exists
Bharath Academy CRM. All previous modules built. Branch filtering active via useBranchData().

BUILD — What to build in this session
Build 5 lead management pages:
  17: src/app/(admin)/leads/page.tsx — Enquiry Pipeline (Kanban + List)
  18: src/app/(admin)/leads/add/page.tsx — New Enquiry Form
  19: src/app/(admin)/leads/[id]/page.tsx — Enquiry Detail + History
  20: src/app/(admin)/leads/phone-log/page.tsx — Phone Call Log
  21: src/app/(admin)/leads/reminders/page.tsx — Follow-up Reminders
Create src/data/leadsData.ts with 20 mock enquiries.

DATA — Mock data structure
// Lead: { id, enquiryNo:"ENQ-2025-0001", name, age, classInterested,
//   board, parentName, phone, whatsapp, email,
//   source:"Walk-in"|"Phone Call"|"WhatsApp Enquiry"|"Social Media"|
//           "Student Referral"|"School Reference"|"Banner / Sunpack"|
//           "Pamphlet"|"Google (SEO)"|"Website"|"Old Students",
//   referredBy?:string, subjects:string[], mode:"Online"|"Offline"|"Either",
//   status:"New"|"Contacted"|"Interested"|"Demo Scheduled"|"Admitted"|"Not Interested",
//   assignedTo:string, followUpDate:string, notes:string,
//   createdAt:string, branchId:string }
// Seed 20 leads spread across statuses and lead sources

SPEC — Detailed UI & functional specification
17 — Enquiry Pipeline:
VIEW TOGGLE: [Kanban Board] [List View] buttons top-right

KANBAN VIEW (default):
  5 columns: New | Contacted | Interested | Demo Scheduled | Admitted | Not Interested
  Each column header: status name + count badge
  Cards: Student name (bold) | Class chip | Source badge (color per source) | Assigned to | Follow-up date
  Source badges: each source has a unique color (use a sourceColors map)
  [+ Add Enquiry] button in "New" column header
  Drag-to-move: use @hello-pangea/dnd or simple click-to-move for now

LIST VIEW:
  Table: ENQ No | Name | Class | Source badge | Phone | Assigned To | Follow-up | Status badge | Actions

FILTER BAR (both views): Source | Class | Assigned To | Date range

18 — New Enquiry Form:
Single page form (not multi-step), clean two-column layout:
Left col: Name* | Age | Class Interested* | Board | Parent Name* | Phone* | WhatsApp
Right col: Source* (the 11 dropdown options) | Referred By (shows if Referral selected)
           Email | Subjects (multi-tag) | Mode preference | Notes
           Follow-up Date | Assigned To (staff select)
[Save Enquiry] → generates ENQ-YYYY-NNNN, redirects to /leads/[id]

19 — Enquiry Detail:
Header: ENQ No badge | Name | Status badge | Source badge | [Edit] | [Convert to Student]
Tabs: [Details] [Timeline] [Notes] [Phone Log]
Details: all form fields read-only
Timeline: vertical timeline — date/time + action text (created, status changed, call logged, note added)
Notes: add note textarea + history list
"Convert to Student" → opens /students/add pre-filled

20 — Phone Call Log:
Quick-add form at top: Name/Number | Type (In/Out) | Duration | Outcome | Linked Enquiry | [Log Call]
Table below: Date | Time | Name | Number | In/Out badge | Duration | Outcome | Enquiry link

21 — Follow-up Reminders:
Today's Reminders (card, amber bg) | Overdue (card, red bg) | Upcoming (card, white)
Each reminder: Name | Phone | Class | Date | Notes | [Done] | [Call] | [Reschedule]

CHECKLIST — Verify before marking done
•	Kanban board renders 6 columns with correct card counts
•	Lead cards show source badges with unique colors
•	List view table renders all leads filtered by branch
•	New enquiry form saves with ENQ-YYYY-NNNN number
•	Referral field appears when 'Student Referral' source selected
•	Lead detail page tabs all render correctly
•	Timeline shows at least 'Enquiry created' entry
•	Phone call log form saves and appears in table
•	Reminders page splits into Today / Overdue / Upcoming sections
•	Convert to Student button is present on detail page


 
22-26	Fees & Payments — 5 Pages	SA · A	/fees/*

CONTEXT — What already exists
Bharath Academy CRM. Students module and Lead Management built. Student data available.
Fee records link to student records via studentId and include branchId.

BUILD — What to build in this session
Build 5 fees pages:
  22: src/app/(admin)/fees/collect/page.tsx
  23: src/app/(admin)/fees/balance/page.tsx
  24: src/app/(admin)/fees/one-to-one/page.tsx
  25: src/app/(admin)/fees/search/page.tsx — includes receipt modal
  26: src/app/(admin)/fees/analytics/page.tsx — super_admin only
Create src/data/feesData.ts with 20 mock fee records.

DATA — Mock data structure
// FeeRecord: { id, billNo:"BA-2025-0001", studentId, studentName,
//   class:string, board:string, subjects:string[], feeType:"Standard"|"OneToOne",
//   totalFee:number,
//   instalments: { i1?:{amount,date,mode}, i2?:{...}, i3?:{...} },
//   collected:number, balance:number,
//   nextPaymentDate:string, notes:string, branchId:string }
// Seed 20 records. Some with full payment, some partial, some overdue.
// Bill No format: BA-YYYY-NNNN

SPEC — Detailed UI & functional specification
22 — Collect Fee:
Step 1 — FIND STUDENT:
  Search bar with autocomplete: type name/roll no → dropdown of matching students
  On select: shows student card (photo, name, class, board)

Step 2 — FEE ENTRY FORM (shown after student selected):
  Read-only: Bill No (auto-generated) | Student Name | Class | Board | Subjects
  Editable:
    Total Fee (₹, auto-filled from fee plan, editable)
    [Instalment I]:  Amount ₹ | Date | Mode (Cash/UPI/Cheque/NEFT) [Collect]
    [Instalment II]: Amount ₹ | Date | Mode — greyed out until I collected
    [Instalment III]: same — greyed out until II collected
    Balance: auto-calculated (Total - collected amounts), shown in red if > 0
    Next Payment Date picker | Notes textarea
  [Collect] button → saves record
  Success state: shows bill no + green tick + [Print Receipt] button

23 — Balance Dues:
Filter: Name search | Class | Board | Subject | [Search]
Results table: Name | Class | Subject | Bill No | Total | Inst-I | Inst-II | Inst-III | Balance | Next Date | Actions
Overdue rows (nextPaymentDate < today): red left border + amber bg tint
Actions: [Collect] → goes to /fees/collect?studentId=X | [Remind] → WhatsApp placeholder
Summary card above table: Total Outstanding ₹ | No. of Students with Dues

24 — One-to-One Fees:
Same layout as Balance Dues but filtered to feeType="OneToOne"
Additional filter: Subject 1 + Subject 2 (optional)
Bill No prefix for display: "1-1-" prefix on one-to-one bills

25 — Search by Bill No:
Centered search: "Search Fee Record" | Bill No input | [Search] button
On result: shows full fee record card
  Student info block + fee breakdown table + collected/balance
  [Print Receipt] button → opens print-ready modal:
    Modal: center logo area + student name + bill no + subjects table + payment table + balance + signature line
    [Print] button → window.print() with receipt CSS

26 — Fee Analytics (super_admin only — show 403 for other roles):
KPI row: Total Collected YTD | This Month | Outstanding | No. of Defaulters
Charts:
  Bar chart: Monthly collection (12 months, recharts)
  Pie chart: Payment mode breakdown (Cash/UPI/Cheque/NEFT)
  Line chart: Outstanding dues trend (last 6 months)
Branch comparison table (only in All Branches mode):
  Branch Name | Total Students | Total Fees | Collected | Outstanding | Collection %

CHECKLIST — Verify before marking done
•	Student search autocomplete works on collect page
•	Fee form shows after student is selected
•	Instalment II and III are disabled until previous is collected
•	Balance auto-calculates correctly
•	Bill No generated in BA-YYYY-NNNN format
•	Balance dues table shows overdue rows in red/amber
•	Search by bill no returns correct record
•	Receipt modal prints correctly (window.print)
•	Fee analytics shows 403 / access denied for non-super-admin
•	Analytics charts render with mock data


 
27-32	Examination + Online Assessment — 6 Pages	SA · A · T	/examination/* · /assessment/*

CONTEXT — What already exists
Bharath Academy CRM. Students, Academics, Fees modules built. Student marks data links back to student profiles.

BUILD — What to build in this session
Build 6 pages:
  27: src/app/(admin)/examination/page.tsx — Exam schedule
  28: src/app/(admin)/examination/marks/page.tsx — Mark entry
  29: src/app/(admin)/examination/marksheet/page.tsx — Print marksheet
  30: src/app/(admin)/assessment/question-bank/page.tsx
  31: src/app/(admin)/assessment/create/page.tsx — Create online exam
  32: src/app/(admin)/assessment/results/[id]/page.tsx — Results view

DATA — Mock data structure
// Exam: { id, name:"Unit Test 1", class, board, subject, date, startTime, endTime,
//   maxMarks:100, passMarks:35, examiner:string, status:"Scheduled"|"Completed", branchId }
// MarkEntry: { examId, studentId, studentName, rollNo, marksObtained:number,
//   grade:string, result:"Pass"|"Fail", remarks:string }
// Grade calc: A+≥90, A≥80, B≥70, C≥60, D≥50, F<50

// Question: { id, subject, class, type:"MCQ"|"Short Answer"|"True/False",
//   question:string, options?:string[4], correctAnswer:string|number,
//   marks:number, difficulty:"Easy"|"Medium"|"Hard", branchId }
// OnlineExam: { id, title, class, subject, teacherId, dateTime, durationMins,
//   instructions:string, questionIds:string[], totalMarks:number,
//   status:"Draft"|"Published", assignedToClass:string, branchId }

SPEC — Detailed UI & functional specification
27 — Exam Schedule:
[+ Create Exam] button → modal: all fields from Exam type above
Table: Exam Name | Class | Subject | Date | Time | Max/Pass Marks | Status badge | Actions (Edit/Delete/Mark Entry)
Filter: Class | Subject | Date range | Status

28 — Mark Entry:
Filter: Select Exam (dropdown) + Class → [Load Students]
Table with inline editing:
  # | Student Name | Roll No | Marks Obtained (number input) | Max Marks | Grade (auto-colored badge) | Result (Pass/Fail auto) | Remarks
Grade auto-calc on input change. Color: A+=purple, A=blue, B=teal, C=green, D=amber, F=red
[Save Marks] button at bottom.

29 — Print Marksheet:
Filter: Class + Board → list of students → click row → preview
MARKSHEET PREVIEW (centered, A4-like container, white):
  Header: Center name + logo placeholder + "ACADEMIC YEAR 2024-25"
  Student details row: Name | Roll No | Class | Board | Exam Name
  Marks table: Subject | Max | Obtained | Grade
  Totals row + Overall % + Overall Grade + PASS/FAIL stamp
  Signature row: Class Teacher ________ | Principal ________
  [Print] button (hides all nav, prints only .marksheet-content)

30 — Question Bank:
Sidebar filter: Subject | Type | Difficulty
[+ Add Question] form (side panel or modal):
  Type selector → conditional fields (MCQ shows 4 options + correct answer radio)
  Subject | Class | Marks | Difficulty | Question text
Question list table: # | Subject | Type | Question (truncated) | Marks | Difficulty | Actions

31 — Create Online Exam:
Form: Title | Class | Subject | Teacher | Date & Time | Duration | Instructions
Question selection: filter bank → checkbox list → running total marks display
Assign to: Class (all) or specific students
[Save Draft] | [Publish]

32 — Exam Results:
Filter: Exam select → results table
Table: Student | Attempted | Correct | Wrong | Skipped | Score | % | Grade | Rank
Class topper row: gold bg
Bar chart: mark distribution (Recharts)
[Export CSV]

CHECKLIST — Verify before marking done
•	Exam schedule table renders with create modal
•	Mark entry loads students for selected exam+class
•	Grade auto-calculates and colors badge on input
•	Marksheet renders A4-style preview
•	Print marksheet hides nav and prints only content
•	Question bank add form works for MCQ/Short/TrueFalse
•	MCQ shows 4 option fields + correct answer selector
•	Create exam shows question selection from bank
•	Total marks auto-sums selected questions
•	Results table shows correct/wrong/score calculations
•	Class topper row highlighted in gold


 
33-36	HR, Payroll & Expenditure — 4 Pages	SA · A	/hr/* · /expenditure

CONTEXT — What already exists
Bharath Academy CRM. All previous modules built. Staff data from HR is used across academics, attendance, online classes.

BUILD — What to build in this session
Build:
  33: src/app/(admin)/hr/page.tsx — Staff directory
  34: src/app/(admin)/hr/staff/[id]/page.tsx — Staff profile (add/edit/view)
  35: src/app/(admin)/hr/payroll/page.tsx — Payroll
  36: src/app/(admin)/expenditure/page.tsx — Expenses

Create src/data/hrData.ts (10 staff) and src/data/expenditureData.ts (20 expenses).

DATA — Mock data structure
// Staff: { id, staffId:"STF-001", name, role:"Teacher"|"Admin"|"Support",
//   phone, whatsapp, email, address, dob, gender,
//   joinDate, qualification, experience, subjects:[], classes:[],
//   salary:number, bankName, accountNo (masked), status:"Active"|"Inactive",
//   branchId }
// Expense: { id, date, category:"Rent"|"Utilities"|"Stationery"|"Marketing"|
//   "Maintenance"|"Other", description, amount, paidTo,
//   mode:"Cash"|"UPI"|"Cheque"|"NEFT", notes, branchId }

SPEC — Detailed UI & functional specification
33 — Staff Directory:
VIEW: Card grid (3 cols) with toggle to table view
Each card: Avatar (initials, role-colored bg) | Name | Role badge | Phone | Subjects (2 chips) | Status
[+ Add Staff] button → /hr/staff/new

Table view: Staff ID | Name | Role | Subjects | Phone | Join Date | Status | Actions
Filter: Role | Status | Search

34 — Staff Profile (Add/Edit/View):
Same multi-tab approach as Student Profile:
Tabs: [Details] [Attendance] [Payroll] [Activity Log]
Details tab: all staff form fields in 2-column layout
  Personal, Contact, Professional, Assignment, Salary (account no masked: ****1234), Documents
Edit mode: all fields become inputs.

35 — Payroll:
Month+Year picker → [Generate Payroll] button
Payroll table: Name | Role | Working Days | Present | Gross | Deductions | Net | Status | [Pay] [Slip]
[Pay] action: marks as Paid, saves date
[Slip] action: opens print-ready pay slip modal (same print pattern as marksheet)
Pay slip: Center header | Staff name/ID | Month | Earnings table | Deductions table | Net Payable | Signature

36 — Expenditure:
Two-column layout:
Left (35%): Add Expense form — all fields from Expense type
[Add Expense] button
Right (65%): Expense list table
  Table: Date | Category badge | Description | Paid To | Amount | Mode | Actions(Edit/Delete)
  Filter: Category | Date range | Search
  Summary: Total this month ₹ + stacked category bar (small visual)

CHECKLIST — Verify before marking done
•	Staff directory card grid renders 10 mock staff
•	Card view and table view toggle works
•	Staff profile tabs render correctly
•	Salary account number is masked
•	Payroll generates correct calculations (Gross - Deductions = Net)
•	Pay slip modal renders print-ready format
•	Expenditure form saves expenses with branchId
•	Expense table filter by category works
•	Monthly total calculates correctly


 
37	Reports Hub	SA · A · T	/reports

CONTEXT — What already exists
Bharath Academy CRM. All CRM modules built. All data stores (students, fees, attendance, marks, HR, expenditure) are populated with mock data.

BUILD — What to build in this session
Build the Reports Hub at src/app/(admin)/reports/page.tsx.
This page links to dynamic report views. Build the hub page plus the following report pages as sub-routes:
  /reports/students, /reports/finance, /reports/attendance, /reports/examination

DATA — Mock data structure
// Reports pull from existing data stores — no new data needed.
// Each report: apply useBranchData() filter and date range filter.
// Export: generate CSV from filtered array and trigger download.

SPEC — Detailed UI & functional specification
Reports Hub Page (/reports):
Grid of report cards (3 cols, 4 rows = 12 cards):
  Each card: Large icon | Report name | Description (1 line) | [View Report] button + [Export CSV] link
  Cards: Students Info | Finance | Attendance | Examination | Online Exams |
         Lesson Plans | Human Resource | Library | Inventory | Alumni | Homework | Audit Trail

Report pages — each has the same structure:
  Page header: Report name + branch badge + date range filter + [Export CSV] button
  Summary KPI cards (3-4 relevant metrics)
  Main data table with column sorting
  [Print] button

Finance Report (/reports/finance):
  KPIs: Total Fees Billed | Total Collected | Outstanding | Collection %
  Table: Student Name | Class | Total Fees | Collected | Balance | Last Payment Date
  Chart: monthly collection bar chart (recharts)

Student Information Report (/reports/students):
  KPIs: Total Students | Online | Offline | Avg Class Size
  Table: All students with class/board/subjects/mode/status/admission date
  Filter: Class | Board | Mode | Status

Attendance Report (/reports/attendance):
  KPIs: Avg Student Attendance % | Avg Staff Attendance % | Days Recorded
  Table: Student Name | Class | Present | Absent | Leave | %
  Month picker to filter

Examination Report (/reports/examination):
  Exam selector → generates report
  Table: Student Name | subject-wise marks columns (dynamic) | Total | % | Grade | Rank

CHECKLIST — Verify before marking done
•	Reports hub page renders 12 report cards
•	Finance report shows correct KPIs from fee data
•	Finance chart renders monthly data
•	Student info report table filters correctly
•	Attendance report calculates % correctly
•	Exam report generates dynamic subject columns
•	Export CSV downloads a valid CSV file
•	All reports filtered by useBranchData()
•	Print button works on all report pages


 
38	Settings	SA only	/settings

CONTEXT — What already exists
Bharath Academy CRM. All modules built. Settings page is super_admin only — show 403 for other roles.

BUILD — What to build in this session
Build src/app/(admin)/settings/page.tsx with tabs.
Show access-denied card for non-super-admin users.

DATA — Mock data structure
// Center settings: { name, logo, tagline, address, city, state, pin,
//   phone, email, website, academicYear, boards:string[], gstNo, regNo }
// Users: from usersData.ts
// Branches: from branchesData.ts
// AuditLog: { id, timestamp, userId, userName, role, module,
//   action, recordId, details, branchId }
// Seed 20 audit log entries.

SPEC — Detailed UI & functional specification
Settings Page — 4 tabs:

Tab 1 — Center Profile:
  Logo upload area (circle, dashed border) + form with all center fields
  [Save Settings] button. Show success toast.

Tab 2 — Branch Management:
  Table: Branch Name | Location | Phone | Email | Status (Active/Inactive) | Actions
  [+ Add Branch] modal: all branch fields + color picker for branch accent color
  [Edit] [Deactivate] per row

Tab 3 — User Management:
  Table: Name | Email/RollNo | Role badge | Assigned Branch | Status | Last Login | Actions
  [+ Add User] modal: Staff select from HR + Email + Temp Password + Role + Branch
  [Edit Role] [Deactivate] per row

Tab 4 — Audit Trail:
  Filter: User | Module | Date range | Action type
  Table: Timestamp | User | Role | Module | Action | Record | Details
  Table is read-only. [Export CSV].
  Paginated: 25 rows per page.

Access Control:
If user.role !== "super_admin": show a centered card:
  Lock icon + "Access Restricted" heading + "Settings are only accessible to Super Admin." + [Go to Dashboard] button

CHECKLIST — Verify before marking done
•	Non-super-admin sees access restricted card
•	Center profile form loads and saves correctly
•	Branch management table shows 3 seed branches
•	Add Branch modal with color picker works
•	User management table shows all test users
•	Add User modal works
•	Audit trail table renders 20 mock entries
•	Audit trail filter works
•	Audit trail export CSV downloads


 
Student Portal — 9 Pages
The student portal lives inside the same Next.js codebase, under a separate layout. Students log in via the Student tab on the login page and are routed to /student/dashboard with a completely different sidebar and navigation.

📌  Build the Student Portal pages after all Admin CRM pages are complete (Pages 01-38). The student portal consumes data created by the admin side — resources, tests, timetable, fees, attendance.


SP1	Student Dashboard	Student	/student/dashboard

CONTEXT — What already exists
Bharath Academy CRM — all admin modules built. StudentLayout exists with sidebar (Resources, Videos, Tests, Progress, Notices, Fees, Timetable). Student role has branchId and class set in AuthContext.

BUILD — What to build in this session
Build src/app/(student)/dashboard/page.tsx.
All data filtered to the logged-in student's class and branchId.
Student role — read-only access to their own data only.

DATA — Mock data structure
// Pull from existing stores filtered by student.id / student.class / student.branchId:
// Attendance: filter by studentId → calculate this month %
// FeeRecord: filter by studentId → get balance
// OnlineExams: filter by class = student.class → upcoming tests
// ClassTimetable: filter by student.class → today's schedule
// Mock: { announcements: [{title, date, category}] } — 3 items

SPEC — Detailed UI & functional specification
Full-width greeting banner:
  Background: navy-to-teal gradient. White text.
  "Good Morning, Arjun! 👋" (time-aware)
  Sub: "Class 10 · CBSE · Roll No: ROLL001 · Anna Nagar Branch"
  Right: motivational quote (rotate from 5 hardcoded quotes)
  Avatar circle (initials) top-right corner

KPI Cards (4 cards):
  1. Attendance % this month — large %, colored (green≥85/amber70-84/red<70)
     Mini 5-bar sparkbar (Mon-Fri attendance this week)
  2. Next Test — subject chip + days remaining countdown + date
     "No upcoming tests" state if none
  3. Fees Due — ₹ balance OR "All Clear ✓" (green) if balance = 0
  4. Tests Completed — "4 of 7" with small radial progress

This Week's Timetable (card):
  Day tabs: Mon Tue Wed Thu Fri Sat
  Selected day: list of periods — Time | Subject | Teacher | Mode badge
  "No classes scheduled" if empty day
  "View Full Timetable" link → /student/timetable

Main 2-col grid:
Left:
  Upcoming Tests (3 cards): Subject | Test Name | Date | Duration | [Start Test] button
  Recent Results (last 3): Subject | Score/Total | Grade badge
Right:
  Latest Notices (3 items): icon + title + "New" dot + date
  Quick Access tiles (3): 📚 Resources | 🎬 Videos | 📄 Question Papers

CHECKLIST — Verify before marking done
•	Greeting is time-aware (Morning/Afternoon/Evening)
•	Attendance % calculates from mock data
•	Next test countdown shows correct days remaining
•	Fee balance shows 0 with All Clear state for paid students
•	Timetable day tabs switch correctly
•	Upcoming tests show Start Test button
•	Recent results show grade badges
•	Quick access tiles link to correct routes


 
SP2-5	Resources, Videos, Question Papers, Tests List	Student	/student/resources · /videos · /question-papers · /tests

CONTEXT — What already exists
Bharath Academy CRM. Student Dashboard (SP1) built. Admin side has data stores for resources (from website center) and online exams (from assessment module). Student reads from these filtered by class.

BUILD — What to build in this session
Build 4 student portal pages:
  SP2: src/app/(student)/resources/page.tsx
  SP3: src/app/(student)/videos/page.tsx
  SP4: src/app/(student)/question-papers/page.tsx
  SP5: src/app/(student)/tests/page.tsx
All data comes from admin-side stores, filtered to student's class and branchId.

DATA — Mock data structure
// Resources: from website center materials store, filter: visibleToStudents=true, class=student.class
// Videos: { id, title, subject, chapter, youtubeUrl, description, teacherName,
//   thumbnailUrl, class, branchId, visibleToStudents:true }
//   Seed 8 videos across 2 subjects
// QuestionPapers: from resources where type="Board Exam"|"Unit Test"|"Sample"|"Mock"
// OnlineExams: from assessment store, filter: assignedToClass=student.class, status="Published"
// localStorage keys: "ba_bookmarks_[studentId]", "ba_watchHistory_[studentId]"

SPEC — Detailed UI & functional specification
SP2 — Resources:
Filter: Subject | File Type (PDF/DOC/PPT) | Search | [My Bookmarks] toggle
Card grid (3 cols): File icon (type-colored) | Title | Subject badge | Teacher | Date | Size | [Download] [Bookmark★]
Bookmark state stored in localStorage.
Empty state: "No resources uploaded for your class yet."

SP3 — Video Lectures:
TWO-PANEL LAYOUT:
Left (35%): Subject tabs → accordion by Chapter → video list items (thumbnail + title + duration + Watched ✓)
Right (65%): Video player (YouTube iframe embed) + Title + Description + [Bookmark] [Mark Watched] [Next →]
"Continue Watching" row at top (last 3 from localStorage watchHistory)
Mobile: stacked, player on top.

SP4 — Question Papers:
Filter: Subject | Year | Type (Board/Unit/Sample/Mock) | Difficulty
Card grid: Type badge (color per type) | Subject icon | Class | Board | Year | Difficulty
[Preview] → iframe modal | [Download] | [Bookmark]
My Downloads tab (from localStorage).

SP5 — My Tests:
Three tabs: [Assigned (N)] [Completed] [Missed]
Assigned card: Subject | Test Name | Assigned By | Deadline (red if <24hrs) | Duration | Questions | [Start Test]
Completed card: same + Score bar + Grade badge + [View Results]
Missed card: greyed out, "Deadline passed" label.

CHECKLIST — Verify before marking done
•	Resources grid renders with file type icons
•	Bookmark toggles and persists in localStorage
•	Video player embeds YouTube correctly
•	Video watch history saves to localStorage
•	Question papers filter by type works
•	PDF preview modal opens
•	Tests split into Assigned/Completed/Missed tabs correctly
•	Start Test button links to /student/tests/[id]/take
•	Completed tests show score bar


 
SP6-7	Take a Test & Test Results	Student	/student/tests/[id]/take · /student/tests/[id]/result

CONTEXT — What already exists
Bharath Academy CRM. Student Tests List (SP5) built. Online exam data from assessment module includes questions.

BUILD — What to build in this session
Build two pages:
  SP6: src/app/(student)/tests/[id]/take/page.tsx — Full exam interface
  SP7: src/app/(student)/tests/[id]/result/page.tsx — Results and review
These are the most interactive student pages. SP6 has timer, question navigator, auto-submit.

DATA — Mock data structure
// Load exam by id from assessment store
// Student answers stored in localStorage during exam: "ba_exam_[examId]_[studentId]"
// Submit creates result record: { examId, studentId, answers: {questionId: answer},
//   startTime, endTime, score, totalMarks, correct, wrong, skipped }

SPEC — Detailed UI & functional specification
SP6 — Take a Test:
PRE-EXAM SCREEN (if exam not yet started):
  Centered card: Title | Subject | Duration | Questions | Instructions
  Declaration checkbox "I confirm this is my own work"
  [Start Exam] button → sets startTime, begins countdown

DURING EXAM — FULL LAYOUT:
  Fixed top bar: Test name | "Q 7 of 25" | ⏱ MM:SS countdown (red <5min, pulsing <60sec) | [Submit Test]
  
  Main question area (70% width):
    Question number + text (large, readable)
    MCQ: 4 large clickable option tiles (A/B/C/D). Selected = teal bg + white text + checkmark.
    True/False: Two large button cards.
    Short Answer: Textarea (200 words max, word counter below).
  
  Right sidebar (30% width, Question Navigator):
    Grid of numbered squares: white=unvisited, blue=answered, amber=marked, red=unanswered
    Section summary: Answered X | Not Answered Y | Marked Z
  
  Bottom: [← Previous] | [Mark for Review ⚑] | [Next →]
  
  Auto-save: every 5 seconds to localStorage.
  Auto-submit: when timer hits 0:00 — auto-submit with toast "Time's up! Submitting..."
  Submit modal: "Are you sure? X questions unanswered." [Cancel] [Submit Exam]

SP7 — Results:
Summary card (centered, max-width 600px):
  Score: 18/25 (large) | % | Grade badge (large, colored) | Time Taken
  Pass/Fail banner (green/red full-width stripe)
  
Stats row (3 boxes): Correct (green) | Wrong (red) | Skipped (gray)

Half-donut score gauge (recharts RadialBarChart).

Detailed review (expandable accordion per question):
  Question text
  Student's answer: green tick if correct, red X if wrong
  Correct answer (shown in green)
  Explanation if admin added one
  Marks: +1 / 0

[Back to My Tests] button | [Retry Test] if admin enabled retakes.

CHECKLIST — Verify before marking done
•	Pre-exam screen shows all exam info
•	Start button begins timer countdown
•	MCQ options are clickable tiles with selection state
•	Answers auto-save to localStorage every 5 seconds
•	Question navigator grid reflects answered/unanswered state
•	Timer turns red below 5 minutes
•	Auto-submit fires when timer reaches 0
•	Submit modal shows unanswered question count
•	Results page shows correct score/grade/pass-fail
•	Score gauge chart renders
•	Question review shows correct/incorrect with correct answer


 
SP8-9	My Progress & Notices/Fees/Timetable	Student	/student/progress · /student/notices · /student/fees · /student/timetable

CONTEXT — What already exists
Bharath Academy CRM. All student portal pages (SP1-SP7) built. Admin data stores for attendance, marks, fees, timetable, and announcements are populated.

BUILD — What to build in this session
Build final student portal pages:
  SP8: src/app/(student)/progress/page.tsx
  SP9a: src/app/(student)/notices/page.tsx
  SP9b: src/app/(student)/fees/page.tsx
  SP9c: src/app/(student)/timetable/page.tsx

DATA — Mock data structure
// Progress data: pull from attendanceData (by studentId), marksData (by studentId),
//   and examResults (by studentId). All filtered.
// Notices: { id, title, body, category:"General"|"Exam"|"Holiday"|"Event",
//   date, postedBy, pinned:boolean, targetClass:"All"|"10" }
//   Seed 6 notices. localStorage: "ba_read_notices_[studentId]"
// Homework: { id, subject, title, description, assignedDate, dueDate,
//   class, attachmentUrl?, branchId }
//   Seed 5 homework items.

SPEC — Detailed UI & functional specification
SP8 — My Progress:
SECTION 1: Attendance Overview
  3 stat cards: This Month % | This Year % | Current Streak
  2-month attendance calendar (same grid as admin attendance report)
  Subject-wise attendance horizontal bar chart (recharts HorizontalBarChart)
  Red dashed line at 75% minimum

SECTION 2: Test Performance
  Score trend line chart (last 8 tests): My Score vs Class Average (two lines)
  Test history table: Test Name | Subject | Date | Score | % | Grade | Class Rank

SECTION 3: Subject Radar Chart (recharts RadarChart)
  Each axis = one enrolled subject
  Two filled areas: My Avg % vs Class Avg %
  Below: Subject cards — each with avg %, "💪 Strong" if >80%, "📖 Needs Work" if <60%

SP9a — Notices & Homework:
Two tabs: [Notices] [Homework]

Notices tab:
  Pinned notices at top (amber left border)
  Regular notices as cards: Category badge | Title | Body (collapse/expand) | Date | "New" dot if unread
  Mark as read on expand (localStorage)
  Filter: Category dropdown

Homework tab:
  Status sections: Overdue (red) | Due Today (amber) | Upcoming (normal)
  Each item: Subject badge | Title | Due Date | Description | [Not Started/In Progress/Done] status toggle
  Status stored in localStorage.

SP9b — My Fees:
Summary cards: Total Fees | Paid | Balance Due (red if >0)
Fee table: Bill No | Subjects | Total | Inst I | Inst II | Inst III | Balance | Status
[Print Receipt] per row → same receipt modal as admin side

SP9c — My Timetable:
Weekly grid (same as class timetable, read-only):
  Row = time slot | Col = Mon-Sat
  Each cell: Subject | Teacher | Mode badge
  Online cells: [Join] button if meetLink set
  Today's column: subtle gold/amber bg highlight
Day strip view for mobile (tabs).
"Next class: Math at 4:00 PM in 1h 20m" countdown if class today.

CHECKLIST — Verify before marking done
•	Progress attendance calendar renders with colors
•	Subject-wise bar chart shows correct percentages
•	Score trend chart shows two lines (my score + class avg)
•	Radar chart renders with enrolled subjects as axes
•	Notices show pinned at top with amber border
•	Unread dot disappears after expanding notice
•	Homework status toggle saves to localStorage
•	My fees table reads from fee store for this student
•	Fee balance shows All Clear if 0
•	Print receipt modal works
•	Timetable shows today's column highlighted
•	Next class countdown is accurate


 

