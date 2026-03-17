
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

  // --- Theme (HSL Color Space) ---
  theme: {
    // ... (theme properties as defined before) ...
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
