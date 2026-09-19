/**
 * Sequential student application numbers: BCC-2026-2032, BCC-2026-2033, …
 *
 * The next number lives in `counters/studentAppNo`. It is read and advanced in
 * the same transaction that creates the student documents, so two admins
 * enrolling at once can never get the same number, and a failed save never
 * burns one.
 */

import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { logAuditAuto } from "@/lib/auditLogger";

const APP_NO_PREFIX = "BCC-2026-";
const FIRST_APP_NO = 2032;

const counterRef = () => doc(db, "counters", "studentAppNo");

/** Firestore allows 500 writes per transaction; one is the counter. */
const PER_TRANSACTION = 499;

export const formatAppNo = (n: number) => `${APP_NO_PREFIX}${n}`;

/**
 * Creates student documents, giving each one without an `appNo` the next
 * number in sequence (a row that already carries one keeps it). Returns the
 * new ids and application numbers in input order.
 */
export async function addStudentsWithAppNos(
  students: DocumentData[]
): Promise<{ id: string; appNo: string }[]> {
  const created: { id: string; appNo: string }[] = [];

  for (let i = 0; i < students.length; i += PER_TRANSACTION) {
    const chunk = students.slice(i, i + PER_TRANSACTION);

    const result = await runTransaction(db, async tx => {
      const counter = await tx.get(counterRef());
      let next = Number(counter.data()?.next) || FIRST_APP_NO;
      const out: { id: string; appNo: string }[] = [];

      chunk.forEach(data => {
        const appNo = data.appNo ? String(data.appNo) : formatAppNo(next++);
        const ref = doc(collection(db, "students"));
        tx.set(ref, {
          ...data,
          appNo,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        out.push({ id: ref.id, appNo });
      });

      tx.set(counterRef(), { next, updatedAt: serverTimestamp() }, { merge: true });
      return out;
    });

    created.push(...result);
  }

  if (created.length > 0) {
    logAuditAuto(
      "Create",
      "students",
      created.length === 1
        ? `Created student ${created[0].appNo} (id: ${created[0].id})`
        : `Created ${created.length} students (${created[0].appNo} … ${created[created.length - 1].appNo})`
    );
  }
  return created;
}

export async function addStudentWithAppNo(data: DocumentData) {
  const [created] = await addStudentsWithAppNos([{ ...data, appNo: undefined }]);
  return created;
}

/**
 * Orders application numbers naturally, so BCC-2026-2040 follows
 * BCC-2026-2039 rather than sorting by string. Missing numbers go last.
 */
export const compareAppNo = (a?: string, b?: string) => {
  if (!a) return b ? 1 : 0;
  if (!b) return -1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
};
