// =======================================================
//        CENTER-SPECIFIC CONFIGURATION
// =======================================================
// This file contains all the branding and contact details
// for the educational center. Update these values to
// white-label the application.

const centerConfig = {
  // --- Branding ---
  centerName: "Bharath Academy",
  logo: "/logo.png", // Path to the logo in the /public folder

  // --- Contact & Address ---
  phone: "+91 98765 43210",
  email: "contact@bharathacademy.com",
  address: "123 Srirangam, Trichy, Tamil Nadu 620006, India",

  // --- Theme (HSL Color Space values only - no hsl() wrapper) ---
  theme: {
    background: { h: 0, s: 0, l: 100 },
    foreground: { h: 222, s: 84, l: 4.9 },
    card: { h: 0, s: 0, l: 100 },
    "card-foreground": { h: 222, s: 84, l: 4.9 },
    popover: { h: 0, s: 0, l: 100 },
    "popover-foreground": { h: 222, s: 84, l: 4.9 },
    primary: { h: 224, s: 42, l: 20 },
    "primary-foreground": { h: 210, s: 40, l: 98 },
    secondary: { h: 189, s: 83, l: 31 },
    "secondary-foreground": { h: 210, s: 40, l: 98 },
    muted: { h: 210, s: 40, l: 96.1 },
    "muted-foreground": { h: 215, s: 16, l: 46.9 },
    accent: { h: 189, s: 83, l: 31 },
    "accent-foreground": { h: 210, s: 40, l: 98 },
    border: { h: 214, s: 32, l: 91 },
    input: { h: 214, s: 32, l: 91 },
    ring: { h: 222, s: 84, l: 4.9 },
    fontFamily: "DM Sans",
  },

  // --- Feature Flags ---
  // Enable or disable modules across the application.
  features: {
    // Admin Modules
    branches: true,       // Branch management
    leads: true,          // Lead tracking
    admissions: true,     // Admission forms and processing
    students: true,       // Student profiles and management
    staff: true,          // Staff profiles and management
    fees: true,           // Fee collection and receipts
    inventory: true,      // Inventory management
    classes: true,        // Class and batch management
    batches: true,        // Batch management within classes
    timetable: true,      // Timetable scheduling
    attendance: true,     // Attendance tracking
    examination: true,    // Exam and marksheet management
    communication: true,  // Announcements and notifications
    settings: true,       // Super admin settings

    // Student Portal Modules
    homework: true,       // Homework assignments
    tests: true,          // Online tests and exams for students
    profile: true,        // Student's own profile view
  },
};

export default centerConfig;
