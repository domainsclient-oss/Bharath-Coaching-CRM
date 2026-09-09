
import { auth, db, getProvisioningAuth } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { logAudit } from '../lib/auditLogger';
import { isStudentEmail, looksLikeEmail, normalizeRollNo, rollNoToEmail, rollNoFromEmail } from '../lib/studentAuth';
import type { User } from '../data/settingsData'; // Using our existing User type

// A more specific type for our application user, combining Firebase and Firestore data
export type AppUser = User & { uid: string };

/**
 * The role to assume when an account has no Firestore user document yet.
 *
 * Accounts on the reserved student domain are ALWAYS students — never let the
 * historic super_admin fallback promote one, or a student whose user document
 * is missing or deleted would silently gain full CRM access.
 */
const fallbackRoleFor = (email?: string | null): 'student' | 'super_admin' =>
  isStudentEmail(email) ? 'student' : 'super_admin';

/** A student account's role is fixed by its login domain, not by its document. */
export const effectiveRole = (email: string | null | undefined, storedRole?: string): string =>
  isStudentEmail(email) ? 'student' : (storedRole || 'super_admin');

/**
 * Logs in a user with email and password.
 * @returns A combined user object with auth and database information.
 */
export const loginUser = async (email: string, password: string): Promise<AppUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const { uid } = userCredential.user;

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const role = effectiveRole(email, userData.role);
      logAudit({ user: userData.name || email, role, action: 'Login', module: 'Auth', details: `${userData.name || email} logged in successfully.`, branchId: userData.branchId ?? '' });
      return { uid, ...userData, role };
    }
  } catch {
    // Firestore read failed (e.g. rules not yet configured) — fall through to fallback
  }

  const role = fallbackRoleFor(email);
  logAudit({ user: email, role, action: 'Login', module: 'Auth', details: `${email} logged in successfully.` });
  // Auth succeeded but no Firestore doc found — return basic profile so the app loads
  return {
    uid,
    id: uid,
    email: userCredential.user.email ?? email,
    name: userCredential.user.displayName ?? email,
    role,
  } as AppUser;
};

/**
 * Logs out the currently authenticated user.
 */
export const logoutUser = async (): Promise<void> => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() as User : null;
      logAudit({ user: userData?.name || currentUser.email || 'User', role: userData?.role || 'admin', action: 'Logout', module: 'Auth', details: `${userData?.name || currentUser.email} logged out.`, branchId: userData?.branchId ?? '' });
    } catch {
      logAudit({ user: currentUser.email || 'User', role: 'admin', action: 'Logout', module: 'Auth', details: `${currentUser.email} logged out.` });
    }
  }
  await signOut(auth);
};

/**
 * Drops keys whose value is undefined.
 *
 * Firestore rejects an undefined value with "Unsupported field value", and
 * callers naturally write optional fields as `branchId: form.branchId || undefined`.
 * An absent key means the same thing to every reader here, so strip them.
 */
const withoutUndefined = <T extends Record<string, any>>(data: T): T =>
  Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) as T;

/**
 * Finds the `students` record a roll number belongs to.
 *
 * Called while an admin is signed in, so it has full read access. Roll numbers
 * are stored as the office typed them (ROLL001, roll-001), so try the
 * obvious spellings first and fall back to a normalised scan of the collection.
 * Returns null when no record matches; the portal then has no student link and
 * falls back to the auth uid.
 */
const findStudentIdByRollNo = async (rawRollNo: string): Promise<string | null> => {
  const normalized = normalizeRollNo(rawRollNo);
  if (!normalized) return null;

  const candidates = Array.from(new Set([rawRollNo.trim(), normalized, normalized.toUpperCase()]));
  for (const value of candidates) {
    const snap = await getDocs(query(collection(db, 'students'), where('rollNo', '==', value), limit(1)));
    if (!snap.empty) return snap.docs[0].id;
  }

  const all = await getDocs(collection(db, 'students'));
  const match = all.docs.find(d => normalizeRollNo((d.data() as any)?.rollNo ?? '') === normalized);
  return match ? match.id : null;
};

/**
 * Registers a new user and creates their Firestore user document.
 *
 * `identifier` is an email address for staff and a roll number for students.
 */
export const registerUser = async (identifier: string, password: string, userData: Omit<User, 'id' | 'email'>): Promise<AppUser> => {
  // Students are identified by roll number, not by email, so translate the
  // identifier into the reserved student address that /student-login derives
  // from the same roll number.
  //
  // A student account ALWAYS lands on that domain, even when a real email
  // address is typed. The domain is what marks an account as a student in
  // firestore.rules, so a student sitting outside it would be treated as staff
  // by the database. A typed address is therefore read as roll-number-first.
  const isStudent = userData.role === 'student';
  const rollSource = looksLikeEmail(identifier) ? identifier.trim().split('@')[0] : identifier;
  const email = isStudent ? rollNoToEmail(rollSource) : identifier.trim();
  const rollNo = rollNoFromEmail(email);

  // Resolve the student record before touching Auth, while the caller is still
  // the admin and can read the whole collection. The portal reads this link
  // rather than querying for itself, so a student session needs no access to
  // the students collection beyond its own row.
  const studentId = rollNo ? await findStudentIdByRollNo(rollSource) : null;

  // Provision on the isolated app so the admin stays signed in, and so the
  // Firestore write below still runs with the admin's permissions.
  const provisioningAuth = getProvisioningAuth();
  let uid: string;
  try {
    const userCredential = await createUserWithEmailAndPassword(provisioningAuth, email, password);
    uid = userCredential.user.uid;
  } catch (err: any) {
    // An earlier attempt can leave an Auth account behind when the Firestore
    // write that follows it fails. Finish that account off rather than making
    // the admin delete it by hand in the Firebase console — but only when the
    // password matches, so this can never adopt somebody else's account.
    if (err?.code !== 'auth/email-already-in-use') throw err;
    const recovered = await signInWithEmailAndPassword(provisioningAuth, email, password).catch(() => null);
    if (!recovered) throw err;
    uid = recovered.user.uid;
  }
  await signOut(provisioningAuth).catch(() => {});

  const profile = {
    ...userData,
    ...(rollNo ? { rollNo, role: 'student' } : {}),
    ...(studentId ? { studentId } : {}),
  };

  const newUserDoc = withoutUndefined({
    email,
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, 'users', uid), newUserDoc, { merge: true });

  return { uid, id: uid, email, ...profile } as AppUser;
};

/**
 * Sends a password reset email to the given email address.
 */
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Changes the password for the currently authenticated user.
 */
export const changePassword = async (newPassword: string): Promise<void> => {
  if (auth.currentUser) {
    await updatePassword(auth.currentUser, newPassword);
  } else {
    throw new Error('No authenticated user found to change password for.');
  }
};

/**
 * Gets the current authenticated user data one time.
 * @returns A promise that resolves with the AppUser object or null.
 */
export const getCurrentUser = (): Promise<AppUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // We only want to check once
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          resolve({ uid: user.uid, ...(userDoc.data() as User) });
        } else {
          resolve(null); // Or handle as an error, e.g., user exists in auth but not DB
        }
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * Sets up a real-time listener for authentication state changes.
 * @param callback The function to call with the user data or null.
 * @returns The unsubscribe function from Firebase.
 */
export const onAuthChange = (callback: (user: AppUser | null) => void) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          callback({ uid: user.uid, ...userData, id: user.uid, role: effectiveRole(user.email, userData.role) });
        } else {
          // No Firestore doc yet — fall back to auth info so the app still loads
          callback({ uid: user.uid, id: user.uid, email: user.email || '', name: user.displayName || user.email || 'Admin', role: fallbackRoleFor(user.email) } as AppUser);
        }
      } catch (err: any) {
        console.warn('Firestore user doc read failed:', err?.code, '— using auth info only. Fix Firestore rules to resolve.');
        // Still call callback so loading spinner doesn't hang
        callback({ uid: user.uid, id: user.uid, email: user.email || '', name: user.displayName || user.email || 'Admin', role: fallbackRoleFor(user.email) } as AppUser);
      }
    } else {
      callback(null);
    }
  });
};
