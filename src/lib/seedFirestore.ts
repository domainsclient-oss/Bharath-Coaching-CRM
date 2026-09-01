"use client";

/**
 * Firestore Seed Utility
 * Populates all required collections with realistic demo data.
 * Safe to run multiple times — uses fixed document IDs so it only overwrites, never duplicates.
 */

import { db } from "@/config/firebase";
import { doc, writeBatch, Timestamp, collection, getDocs, query, where, limit } from "firebase/firestore";

const BRANCHES = ["Trichy", "Chennai", "Coimbatore", "Madurai"];

// ─── helpers ──────────────────────────────────────────────────────────────────

function ts(dateStr: string): Timestamp {
  return Timestamp.fromDate(new Date(dateStr));
}

function daysAgo(n: number): Timestamp {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return Timestamp.fromDate(d);
}

function monthsAgo(n: number, day = 10): Timestamp {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return Timestamp.fromDate(d);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── seed data ────────────────────────────────────────────────────────────────

const STUDENT_NAMES = [
  "Arjun Krishnan", "Priya Ramesh", "Karthik Selvam", "Nithya Devi", "Vikram Anand",
  "Shalini Murthy", "Harish Babu", "Deepa Suresh", "Manoj Kumar", "Lavanya Raj",
  "Arun Prakash", "Meenakshi Iyer", "Suresh Kannan", "Divya Pillai", "Rajesh Ravi",
  "Ananya Sharma", "Naveen Venkat", "Shruti Nair", "Gopal Sundaram", "Pavithra Das",
];

const STAFF_NAMES = [
  ["Meena Srinivasan", "Admin"],
  ["Rajesh Kumar", "Teacher"],
  ["Anitha Das", "Teacher"],
  ["Suresh Patel", "Accountant"],
  ["Kavitha Murali", "Teacher"],
];

const SOURCES = ["Walk-in", "Social Media", "Student Referral", "WhatsApp Enquiry", "Website", "Google (SEO)"];
const STATUSES = ["New", "Contacted", "Interested", "Demo Scheduled"];
const CLASSES = ["8", "9", "10", "11", "12"];
const BOARDS = ["CBSE", "ICSE", "State"];

// ─── check if already seeded ──────────────────────────────────────────────────

export async function isAlreadySeeded(): Promise<boolean> {
  try {
    const snap = await getDocs(
      query(collection(db, "students"), where("branchId", "==", "Trichy"), limit(1))
    );
    return !snap.empty;
  } catch {
    return false;
  }
}

// ─── main seed function ────────────────────────────────────────────────────────

export async function seedFirestore(onProgress?: (msg: string) => void): Promise<void> {
  const log = (msg: string) => {
    console.log(msg);
    onProgress?.(msg);
  };

  log("Starting Firestore seed...");

  // Firestore batch limit is 500 operations. We'll use multiple batches.
  let batch = writeBatch(db);
  let opCount = 0;

  async function commit() {
    if (opCount > 0) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }

  function setDoc(colName: string, docId: string, data: object) {
    batch.set(doc(db, colName, docId), data);
    opCount++;
    if (opCount >= 490) {
      // auto-flush handled by caller
    }
  }

  // ── 1. STUDENTS ──────────────────────────────────────────────────────────────
  log("Seeding students...");
  let stuIdx = 0;
  for (const branch of BRANCHES) {
    for (let i = 0; i < 5; i++) {
      const name = STUDENT_NAMES[stuIdx % STUDENT_NAMES.length];
      const id = `STU_${branch}_${i + 1}`;
      setDoc("students", id, {
        id,
        name,
        branchId: branch,
        status: "Active",
        class: CLASSES[i % CLASSES.length],
        board: BOARDS[i % BOARDS.length],
        phone: `98765${String(stuIdx).padStart(5, "0")}`,
        parentName: `Parent of ${name}`,
        mode: i % 2 === 0 ? "Offline" : "Online",
        admissionDate: `2025-0${(i % 9) + 1}-10`,
        rollNo: `ROLL${String(stuIdx + 1).padStart(3, "0")}`,
        subjects: ["Mathematics", "Physics"],
        createdAt: daysAgo(30 + i),
      });
      stuIdx++;
    }
  }
  await commit();

  // ── 2. STAFF ─────────────────────────────────────────────────────────────────
  log("Seeding staff...");
  let staffIdx = 0;
  for (const branch of BRANCHES) {
    for (const [sName, role] of STAFF_NAMES) {
      const id = `EMP_${branch}_${staffIdx % STAFF_NAMES.length + 1}`;
      setDoc("staff", id, {
        id,
        staffId: `STF-${branch.slice(0, 2).toUpperCase()}-${staffIdx + 1}`,
        name: sName,
        role,
        branchId: branch,
        branch,
        status: "Active",
        salary: role === "Admin" ? 35000 : role === "Accountant" ? 30000 : 28000,
        contact: `9876500${staffIdx}`,
        email: `${sName.toLowerCase().replace(" ", ".")}@bharathacademy.com`,
        joinDate: "2023-06-01",
        gender: staffIdx % 2 === 0 ? "Female" : "Male",
      });
      staffIdx++;
    }
  }
  await commit();

  // ── 3. FEES ──────────────────────────────────────────────────────────────────
  log("Seeding fees...");
  let feeIdx = 0;
  for (const branch of BRANCHES) {
    for (let i = 0; i < 5; i++) {
      const stuId = `STU_${branch}_${i + 1}`;
      const name  = STUDENT_NAMES[(feeIdx) % STUDENT_NAMES.length];

      // Paid fee record (payment made 1-5 months ago — for monthly chart)
      const paidMonthsAgo = (i % 5) + 1;
      setDoc("fees", `FEE_PAID_${branch}_${i}`, {
        id: `FEE_PAID_${branch}_${i}`,
        studentId: stuId,
        name,
        studentName: name,
        class: CLASSES[i % CLASSES.length],
        className: CLASSES[i % CLASSES.length],
        branchId: branch,
        totalFee: 30000,
        amountPaid: 15000,
        balance: 0,
        status: "Paid",
        paymentDate: monthsAgo(paidMonthsAgo, 10 + i),
        dueDate: monthsAgo(paidMonthsAgo + 1, 5),
        mode: "UPI",
        createdAt: monthsAgo(paidMonthsAgo + 2),
      });

      // Unpaid / overdue fee record
      setDoc("fees", `FEE_DUE_${branch}_${i}`, {
        id: `FEE_DUE_${branch}_${i}`,
        studentId: stuId,
        name,
        studentName: name,
        class: CLASSES[(i + 1) % CLASSES.length],
        className: CLASSES[(i + 1) % CLASSES.length],
        branchId: branch,
        totalFee: 30000,
        amountPaid: i % 2 === 0 ? 10000 : 0,
        balance: i % 2 === 0 ? 20000 : 30000,
        status: i % 2 === 0 ? "Partially Paid" : "Unpaid",
        paymentDate: null,
        dueDate: daysAgo(10 + i * 3),   // all overdue
        mode: null,
        createdAt: monthsAgo(2),
      });

      feeIdx++;
    }
  }
  await commit();

  // ── 4. ENQUIRIES ─────────────────────────────────────────────────────────────
  log("Seeding enquiries...");
  let enqIdx = 0;
  for (const branch of BRANCHES) {
    for (let i = 0; i < 5; i++) {
      const name   = STUDENT_NAMES[(enqIdx + 10) % STUDENT_NAMES.length];
      const source = SOURCES[enqIdx % SOURCES.length];
      const status = STATUSES[enqIdx % STATUSES.length];
      setDoc("enquiries", `ENQ_${branch}_${i}`, {
        id: `ENQ_${branch}_${i}`,
        name,
        parentName: `Parent of ${name}`,
        phone: `9865${String(enqIdx).padStart(6, "0")}`,
        class: CLASSES[i % CLASSES.length],
        className: CLASSES[i % CLASSES.length],
        branchId: branch,
        source,
        status,
        assignedTo: STAFF_NAMES[0][0],
        followUpDate: new Date(Date.now() + 86400000 * (i + 1)).toISOString().split("T")[0],
        notes: `Enquiry from ${source}`,
        createdAt: daysAgo(i * 2),      // spread over last 0-8 days (this month)
        updatedAt: daysAgo(i),
      });
      enqIdx++;
    }
  }
  await commit();

  // ── 5. ATTENDANCE (today) ────────────────────────────────────────────────────
  log("Seeding today's attendance...");
  const today = todayStr();
  const ATT_STATUSES = ["Present", "Present", "Present", "Absent", "Late"] as const;
  let attIdx = 0;
  for (const branch of BRANCHES) {
    for (let i = 0; i < 5; i++) {
      const stuId = `STU_${branch}_${i + 1}`;
      setDoc("attendance", `ATT_${branch}_${today}_${i}`, {
        id: `ATT_${branch}_${today}_${i}`,
        studentId: stuId,
        branchId: branch,
        date: today,
        status: ATT_STATUSES[attIdx % ATT_STATUSES.length],
        inTime: "09:00",
        outTime: "17:00",
        createdAt: Timestamp.now(),
      });
      attIdx++;
    }
  }
  await commit();

  // ── 6. PAST MONTHS ATTENDANCE (for history) ───────────────────────────────
  log("Seeding past attendance...");
  for (const branch of BRANCHES) {
    for (let m = 1; m <= 3; m++) {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      const dateStr = d.toISOString().split("T")[0];
      for (let i = 0; i < 5; i++) {
        const stuId = `STU_${branch}_${i + 1}`;
        setDoc("attendance", `ATT_${branch}_${dateStr}_${i}`, {
          studentId: stuId,
          branchId: branch,
          date: dateStr,
          status: ATT_STATUSES[(i + m) % ATT_STATUSES.length],
          createdAt: Timestamp.fromDate(d),
        });
        if (opCount >= 490) await commit();
      }
    }
  }
  await commit();

  log("✅ Seed complete! All collections populated.");
}
