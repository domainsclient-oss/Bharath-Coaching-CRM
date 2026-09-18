// One-off: renumber every student's application number to BCC-2026-2028,
// BCC-2026-2029, … in the order the students were added (oldest first).
//
// Signs in with a staff account, so Firestore rules apply as they do in the app.
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... node scripts/renumber-app-nos.mjs          # preview only
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... node scripts/renumber-app-nos.mjs --apply  # write

import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";

const PREFIX = "BCC-2026-";
const FIRST = 2028;
const EXPECTED_COUNT = 10;

const apply = process.argv.includes("--apply");
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (a staff login for the CRM).");
  process.exit(1);
}

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
await signInWithEmailAndPassword(getAuth(app), ADMIN_EMAIL, ADMIN_PASSWORD);
const db = getFirestore(app);

const snap = await getDocs(collection(db, "students"));
const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

const undated = students.filter((s) => !s.createdAt?.toMillis);
if (undated.length) {
  console.error("These students have no createdAt, so their order is unknown:");
  undated.forEach((s) => console.error(`  ${s.id}  ${s.name}  ${s.appNo ?? "—"}`));
  process.exit(1);
}
if (students.length !== EXPECTED_COUNT) {
  console.error(`Expected ${EXPECTED_COUNT} students, found ${students.length}. Nothing changed.`);
  process.exit(1);
}

students.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
const plan = students.map((s, i) => ({ ...s, newAppNo: `${PREFIX}${FIRST + i}` }));

console.table(
  plan.map((s) => ({
    added: s.createdAt.toDate().toISOString().slice(0, 16).replace("T", " "),
    name: s.name,
    current: s.appNo ?? "—",
    new: s.newAppNo,
  }))
);

if (!apply) {
  console.log("Preview only. Re-run with --apply to write these numbers.");
  process.exit(0);
}

const batch = writeBatch(db);
plan.forEach((s) => batch.update(doc(db, "students", s.id), { appNo: s.newAppNo }));
await batch.commit();
console.log(`Updated ${plan.length} students.`);
process.exit(0);
