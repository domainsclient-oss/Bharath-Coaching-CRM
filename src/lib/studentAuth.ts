/**
 * Student portal credentials.
 *
 * Students sign in with their Roll No + password, but Firebase Auth only
 * accepts email/password. We therefore map a roll number onto a deterministic
 * address inside a domain reserved exclusively for students:
 *
 *   ROLL001  ->  roll001@students.bharathacademy.local
 *
 * The mapping is pure, so the login screen never has to look a student up in
 * Firestore before authenticating (which would require opening the database to
 * unauthenticated reads). The domain is also the authority on the account's
 * role: anything signing in from it is a student, in the app *and* in
 * firestore.rules, no matter what its Firestore user document happens to say.
 *
 * NOTE: firestore.rules hardcodes this same domain. Changing the env var means
 * changing the `isStudentAccount()` helper in firestore.rules to match.
 */

export const STUDENT_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_STUDENT_LOGIN_DOMAIN || 'students.bharathacademy.local';

/** Strips formatting so "ROLL-001", "roll 001" and "Roll001" are one account. */
export function normalizeRollNo(rollNo: string): string {
  return (rollNo || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());
}

/** Roll number -> the Firebase Auth address that backs it. */
export function rollNoToEmail(rollNo: string): string {
  const normalized = normalizeRollNo(rollNo);
  if (!normalized) throw new Error('Roll number is required.');
  return `${normalized}@${STUDENT_EMAIL_DOMAIN}`;
}

/** True when an address belongs to the reserved student domain. */
export function isStudentEmail(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase().endsWith(`@${STUDENT_EMAIL_DOMAIN.toLowerCase()}`);
}

/** The roll number behind a student address, or null for any other address. */
export function rollNoFromEmail(email?: string | null): string | null {
  if (!isStudentEmail(email)) return null;
  return (email as string).trim().toLowerCase().split('@')[0];
}
