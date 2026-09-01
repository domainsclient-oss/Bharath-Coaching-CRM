import { db } from "@/config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type AuditAction   = "Login" | "Logout" | "Create" | "Update" | "Delete" | "Export" | "Permission Change";
export type AuditSeverity = "Info" | "Warning" | "Critical";

export interface AuditEventInput {
  user: string;
  role: string;
  action: AuditAction;
  module: string;
  details: string;
  severity?: AuditSeverity;
  branchId?: string;
}

// Module-level current user so firestoreService can log without prop-drilling
let _currentUser: { name: string; role: string; branchId: string } | null = null;

export function setAuditUser(user: { name: string; role: string; branchId: string } | null) {
  _currentUser = user;
}

export function getAuditUser() {
  return _currentUser;
}

const COLLECTION_MODULE: Record<string, string> = {
  fees:              "Fees",
  students:          "Students",
  staff:             "Staff",
  enquiries:         "Leads",
  attendance:        "Attendance",
  staffAttendance:   "Staff Attendance",
  studentAttendance: "Attendance",
  exams:             "Exams",
  marks:             "Marks",
  expenses:          "Expenses",
  payments:          "Payments",
  classes:           "Academics",
  subjects:          "Academics",
  timetable:         "Timetable",
  users:             "Users",
  branches:          "Settings",
};

export function moduleFromCollection(col: string): string {
  return COLLECTION_MODULE[col] ?? col.charAt(0).toUpperCase() + col.slice(1);
}

function defaultSeverity(action: AuditAction): AuditSeverity {
  if (action === "Delete") return "Warning";
  if (action === "Permission Change") return "Critical";
  return "Info";
}

export async function logAudit(event: AuditEventInput): Promise<void> {
  try {
    await addDoc(collection(db, "auditLogs"), {
      ...event,
      severity:  event.severity ?? defaultSeverity(event.action),
      branchId:  event.branchId ?? "",
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Never let audit logging crash the main flow
  }
}

// Convenience: log using the currently signed-in user from module state
export async function logAuditAuto(
  action: AuditAction,
  collection: string,
  details: string,
  overrides?: Partial<AuditEventInput>
): Promise<void> {
  const u = _currentUser;
  await logAudit({
    user:    u?.name     ?? "System",
    role:    u?.role     ?? "unknown",
    branchId: u?.branchId ?? "",
    action,
    module:  moduleFromCollection(collection),
    details,
    ...overrides,
  });
}
