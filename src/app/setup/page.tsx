"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, writeBatch, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { CheckCircle2, Circle, Loader2, AlertCircle, Database, User, Shield, Rocket } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = "pending" | "active" | "done" | "error";

interface SetupStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: StepStatus;
}

// ─── Demo seed data ────────────────────────────────────────────────────────────

const BRANCH_ID = "Trichy";

const DEMO_STUDENTS = [
  { id: "stud_01", name: "Kavya Sharma", standard: "10", section: "A", branchId: BRANCH_ID, admissionDate: "2023-04-15", status: "Active", email: "kavya@demo.com", phone: "9000000001", board: "CBSE" },
  { id: "stud_02", name: "Arun Kumar", standard: "12", section: "B", branchId: BRANCH_ID, admissionDate: "2023-03-20", status: "Active", email: "arun@demo.com", phone: "9000000002", board: "CBSE" },
  { id: "stud_03", name: "Priya Venkatesh", standard: "11", section: "A", branchId: BRANCH_ID, admissionDate: "2023-05-01", status: "Active", email: "priya@demo.com", phone: "9000000003", board: "State Board" },
  { id: "stud_04", name: "Suresh Menon", standard: "10", section: "B", branchId: BRANCH_ID, admissionDate: "2023-04-18", status: "Active", email: "suresh@demo.com", phone: "9000000004", board: "CBSE" },
  { id: "stud_05", name: "Anitha Rajan", standard: "9", section: "C", branchId: BRANCH_ID, admissionDate: "2023-06-10", status: "Active", email: "anitha@demo.com", phone: "9000000005", board: "State Board" },
  { id: "stud_06", name: "Riya Sharma", standard: "10", section: "A", branchId: BRANCH_ID, admissionDate: "2023-07-01", status: "Active", email: "riya@demo.com", phone: "9000000006", board: "CBSE" },
  { id: "stud_07", name: "Kiran Raj", standard: "9", section: "B", branchId: BRANCH_ID, admissionDate: "2023-08-01", status: "Active", email: "kiran@demo.com", phone: "9000000007", board: "State Board" },
];

const DEMO_FEES = [
  { id: "fee_01", studentId: "stud_01", studentName: "Kavya Sharma", branchId: BRANCH_ID, totalFee: 45000, collected: 40000, balance: 5000, nextPaymentDate: "2026-03-20", status: "Partial" },
  { id: "fee_02", studentId: "stud_02", studentName: "Arun Kumar", branchId: BRANCH_ID, totalFee: 52000, collected: 52000, balance: 0, status: "Paid" },
  { id: "fee_03", studentId: "stud_03", studentName: "Priya Venkatesh", branchId: BRANCH_ID, totalFee: 48000, collected: 30000, balance: 18000, nextPaymentDate: "2026-03-15", status: "Partial" },
  { id: "fee_04", studentId: "stud_04", studentName: "Suresh Menon", branchId: BRANCH_ID, totalFee: 45000, collected: 45000, balance: 0, status: "Paid" },
  { id: "fee_05", studentId: "stud_05", studentName: "Anitha Rajan", branchId: BRANCH_ID, totalFee: 40000, collected: 0, balance: 40000, nextPaymentDate: "2026-03-10", status: "Pending" },
  { id: "fee_06", studentId: "stud_06", studentName: "Riya Sharma", branchId: BRANCH_ID, totalFee: 45000, collected: 40500, balance: 4500, nextPaymentDate: "2026-03-15", status: "Partial" },
  { id: "fee_07", studentId: "stud_07", studentName: "Kiran Raj", branchId: BRANCH_ID, totalFee: 40000, collected: 36800, balance: 3200, nextPaymentDate: "2026-03-10", status: "Partial" },
];

const DEMO_ENQUIRIES = [
  { id: "enq_01", name: "Ravi Kumar", phone: "9000001001", class: "10", branchId: BRANCH_ID, source: "Walk-in", status: "New", date: new Date("2026-03-15"), followUpDate: "2026-03-22" },
  { id: "enq_02", name: "Deepa Nair", phone: "9000001002", class: "11", branchId: BRANCH_ID, source: "WhatsApp Enquiry", status: "Follow Up", date: new Date("2026-03-14"), followUpDate: "2026-03-20" },
  { id: "enq_03", name: "Sanjay Pillai", phone: "9000001003", class: "9", branchId: BRANCH_ID, source: "Referral", status: "Interested", date: new Date("2026-03-13") },
  { id: "enq_04", name: "Meera Krishnan", phone: "9000001004", class: "12", branchId: BRANCH_ID, source: "Social Media", status: "Admitted", date: new Date("2026-03-10") },
  { id: "enq_05", name: "Vijay Anand", phone: "9000001005", class: "8", branchId: BRANCH_ID, source: "Phone Call", status: "New", date: new Date("2026-03-17") },
];

const DEMO_EXPENSES = [
  { id: "exp_01", category: "Stationery", amount: 2500, date: "2026-03-02", description: "Whiteboard markers and notebooks", branchId: BRANCH_ID },
  { id: "exp_02", category: "Rent", amount: 25000, date: "2026-03-05", description: "March office rent", branchId: BRANCH_ID },
  { id: "exp_03", category: "Utilities", amount: 3500, date: "2026-03-08", description: "Electricity and water bill", branchId: BRANCH_ID },
  { id: "exp_04", category: "Maintenance", amount: 5000, date: "2026-03-12", description: "AC servicing and repairs", branchId: BRANCH_ID },
];

const DEMO_MONTHLY_FEES = [
  { id: "mf_sep", branchId: BRANCH_ID, month: "Sep", year: 2025, collected: 145000 },
  { id: "mf_oct", branchId: BRANCH_ID, month: "Oct", year: 2025, collected: 162000 },
  { id: "mf_nov", branchId: BRANCH_ID, month: "Nov", year: 2025, collected: 158000 },
  { id: "mf_dec", branchId: BRANCH_ID, month: "Dec", year: 2025, collected: 172000 },
  { id: "mf_jan", branchId: BRANCH_ID, month: "Jan", year: 2026, collected: 168000 },
  { id: "mf_feb", branchId: BRANCH_ID, month: "Feb", year: 2026, collected: 182500 },
];

const DEMO_LEAD_SOURCES = [
  { id: "ls_01", branchId: BRANCH_ID, name: "Walk-in", value: 32 },
  { id: "ls_02", branchId: BRANCH_ID, name: "WhatsApp", value: 28 },
  { id: "ls_03", branchId: BRANCH_ID, name: "Referral", value: 18 },
  { id: "ls_04", branchId: BRANCH_ID, name: "Social Media", value: 14 },
  { id: "ls_05", branchId: BRANCH_ID, name: "Others", value: 8 },
];

// ─── Seed function (runs client-side using Firebase SDK) ────────────────────

async function seedFirestore(adminUid: string, adminName: string, adminEmail: string): Promise<{ seeded: string[] }> {
  const batch = writeBatch(db);
  const seeded: string[] = [];

  // Students
  DEMO_STUDENTS.forEach(s => {
    batch.set(doc(db, "students", s.id), { ...s, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
  seeded.push(`${DEMO_STUDENTS.length} students`);

  // Fees
  DEMO_FEES.forEach(f => {
    batch.set(doc(db, "fees", f.id), { ...f, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
  seeded.push(`${DEMO_FEES.length} fee records`);

  // Enquiries
  DEMO_ENQUIRIES.forEach(e => {
    batch.set(doc(db, "enquiries", e.id), { ...e, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
  seeded.push(`${DEMO_ENQUIRIES.length} enquiries`);

  // Expenses
  DEMO_EXPENSES.forEach(e => {
    batch.set(doc(db, "expenses", e.id), { ...e, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
  seeded.push(`${DEMO_EXPENSES.length} expenses`);

  // Monthly fee analytics data
  DEMO_MONTHLY_FEES.forEach(m => {
    batch.set(doc(db, "monthlyFees", m.id), { ...m, createdAt: serverTimestamp() });
  });
  seeded.push("6 months of fee analytics");

  // Lead sources data
  DEMO_LEAD_SOURCES.forEach(l => {
    batch.set(doc(db, "leadSources", l.id), { ...l, createdAt: serverTimestamp() });
  });
  seeded.push("lead source analytics");

  // Admin user document (links Firebase Auth UID to role/profile)
  batch.set(doc(db, "users", adminUid), {
    uid: adminUid,
    name: adminName,
    email: adminEmail,
    role: "super_admin",
    branchId: BRANCH_ID,
    status: "Active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  seeded.push("admin user profile");

  await batch.commit();
  return { seeded };
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();

  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupAvailable, setSetupAvailable] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);

  // Admin credentials form
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `✓ ${msg}`]);

  // Check if setup is available on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/setup/status");
        const data = await res.json();
        setSetupAvailable(data.available);
      } catch {
        setSetupAvailable(false);
      } finally {
        setCheckingSetup(false);
      }
    };
    checkStatus();
  }, []);

  const validateForm = () => {
    if (!adminName.trim()) return "Please enter the admin name.";
    if (!adminEmail.trim() || !adminEmail.includes("@")) return "Please enter a valid email address.";
    if (adminPassword.length < 8) return "Password must be at least 8 characters.";
    if (adminPassword !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const runSetup = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    setIsProcessing(true);
    setLogs([]);
    setError(null);
    setCurrentStep(3);

    try {
      // Step 1: Create Firebase Auth user
      addLog("Creating Firebase Auth account...");
      const credential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const adminUid = credential.user.uid;
      addLog(`Auth account created (UID: ${adminUid.slice(0, 8)}...)`);

      // Step 2: Seed Firestore
      addLog("Connecting to Firestore...");
      addLog("Seeding demo students (7 records)...");
      addLog("Seeding fee records (7 records)...");
      addLog("Seeding enquiries (5 records)...");
      addLog("Seeding expenses (4 records)...");
      addLog("Seeding analytics data...");

      const { seeded } = await seedFirestore(adminUid, adminName, adminEmail);
      seeded.forEach(item => addLog(`Wrote ${item}`));

      // Step 3: Mark setup complete (delete setup.lock)
      addLog("Removing setup lock file...");
      const lockRes = await fetch("/api/setup/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      const lockData = await lockRes.json();
      if (!lockData.success) {
        addLog("Warning: Could not remove lock file. Setup is still complete.");
      } else {
        addLog("Setup lock removed.");
      }

      addLog("🎉 Setup complete!");
      setCurrentStep(4);
      setSetupComplete(true);
    } catch (err: any) {
      console.error("Setup error:", err);
      const message = err.code === "auth/email-already-in-use"
        ? "This email is already registered. Use a different email or log in directly."
        : err.code === "auth/weak-password"
        ? "Password is too weak. Use at least 8 characters."
        : err.message || "An unexpected error occurred.";
      setError(message);
      setCurrentStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (checkingSetup) {
    return (
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-slate-300">Checking setup status...</p>
      </div>
    );
  }

  // ─── Already set up ─────────────────────────────────────────────────────────
  if (!setupAvailable && !setupComplete) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Setup Already Complete</h1>
        <p className="text-slate-500 mb-6">
          This application has already been configured. The setup utility is no longer available.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-[#1E2A4A] text-white py-3 rounded-xl font-semibold hover:bg-[#0D7C8F] transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // ─── Setup complete ─────────────────────────────────────────────────────────
  if (setupComplete) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Setup Complete!</h1>
        <p className="text-slate-500 mb-4">Your Bharath Academy portal is ready to use.</p>
        <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 space-y-1">
          {logs.slice(-5).map((log, i) => (
            <p key={i} className="text-xs text-slate-600 font-mono">{log}</p>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-amber-800 mb-1">Your Admin Credentials</p>
          <p className="text-sm text-amber-700">Email: <span className="font-mono font-bold">{adminEmail}</span></p>
          <p className="text-xs text-amber-600 mt-1">Keep these credentials safe. This is the only time they are shown here.</p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-[#0D7C8F] text-white py-3 rounded-xl font-semibold hover:bg-[#0a6b7c] transition-colors flex items-center justify-center gap-2"
        >
          <Rocket className="h-5 w-5" />
          Launch the Portal
        </button>
      </div>
    );
  }

  // ─── Setup wizard ───────────────────────────────────────────────────────────
  const steps = [
    { num: 1, label: "Welcome", icon: Shield },
    { num: 2, label: "Admin Account", icon: User },
    { num: 3, label: "Seeding Data", icon: Database },
    { num: 4, label: "Complete", icon: CheckCircle2 },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#1E2A4A] px-8 py-6">
        <h1 className="text-2xl font-bold text-white">First-Time Setup</h1>
        <p className="text-slate-300 text-sm mt-1">Configure your academy portal in minutes</p>
      </div>

      {/* Step indicators */}
      <div className="flex px-8 py-4 bg-slate-50 border-b gap-0">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${currentStep === step.num ? "text-[#0D7C8F]" : currentStep > step.num ? "text-green-600" : "text-slate-400"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${currentStep === step.num ? "border-[#0D7C8F] bg-[#0D7C8F]/10 text-[#0D7C8F]" : currentStep > step.num ? "border-green-600 bg-green-600 text-white" : "border-slate-300 text-slate-400"}`}>
                {currentStep > step.num ? "✓" : step.num}
              </div>
              <span className="text-xs font-medium hidden sm:block">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.num ? "bg-green-300" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="p-8">
        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Welcome!</h2>
              <p className="text-slate-500 text-sm mt-1">This wizard will set up your academy&apos;s database with demo data and create your first administrator account.</p>
            </div>
            <div className="space-y-3">
              {[
                { icon: "🔐", title: "Create Admin Account", desc: "Set up the first super admin login credentials" },
                { icon: "🗃️", title: "Seed Demo Data", desc: "Populate Firestore with students, fees, enquiries & more" },
                { icon: "🔒", title: "Lock Setup", desc: "The setup utility will be disabled after first run" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700 font-semibold">⚠️ Run this only once per Firebase project.</p>
              <p className="text-xs text-amber-600 mt-0.5">After completion, the /setup route will be permanently disabled.</p>
            </div>
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full bg-[#1E2A4A] text-white py-3 rounded-xl font-semibold hover:bg-[#0D7C8F] transition-colors"
            >
              Get Started →
            </button>
          </div>
        )}

        {/* Step 2: Admin account form */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Create Admin Account</h2>
              <p className="text-slate-500 text-sm mt-1">This will be the super admin login for the portal.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C8F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@youracademy.com"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C8F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C8F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C8F]"
                />
              </div>
            </div>

            {formError && (
              <div className="flex gap-2 items-start bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            {error && (
              <div className="flex gap-2 items-start bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={runSetup}
                disabled={isProcessing}
                className="flex-1 bg-[#0D7C8F] text-white py-3 rounded-xl font-semibold hover:bg-[#0a6b7c] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Setting up...</>
                ) : (
                  "Run Setup →"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Progress */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Setting Up...</h2>
              <p className="text-slate-500 text-sm mt-1">Please wait while we configure your database.</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 min-h-[200px] font-mono text-xs space-y-1 overflow-y-auto max-h-[250px]">
              {logs.length === 0 ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Initializing...</span>
                </div>
              ) : (
                logs.map((log, i) => (
                  <p key={i} className="text-green-400">{log}</p>
                ))
              )}
              {isProcessing && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Working...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
