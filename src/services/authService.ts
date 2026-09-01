
import { auth, db } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { logAudit } from '../lib/auditLogger';
import type { User } from '../data/settingsData'; // Using our existing User type

// A more specific type for our application user, combining Firebase and Firestore data
export type AppUser = User & { uid: string };

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
      logAudit({ user: userData.name || email, role: userData.role || 'admin', action: 'Login', module: 'Auth', details: `${userData.name || email} logged in successfully.`, branchId: userData.branchId ?? '' });
      return { uid, ...userData };
    }
  } catch {
    // Firestore read failed (e.g. rules not yet configured) — fall through to fallback
  }

  logAudit({ user: email, role: 'super_admin', action: 'Login', module: 'Auth', details: `${email} logged in successfully.` });
  // Auth succeeded but no Firestore doc found — return basic profile so the app loads
  return {
    uid,
    id: uid,
    email: userCredential.user.email ?? email,
    name: userCredential.user.displayName ?? email,
    role: 'super_admin',
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
 * Registers a new user with email, password, and additional user data.
 * Creates both a Firebase Auth user and a Firestore user document.
 */
export const registerUser = async (email: string, password: string, userData: Omit<User, 'id' | 'email'>): Promise<AppUser> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = userCredential.user;

  const newUserDoc = {
    email,
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', uid), newUserDoc);

  return { uid, id: uid, email, ...userData };
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
          callback({ uid: user.uid, ...(userDoc.data() as User) });
        } else {
          // No Firestore doc yet — fall back to auth info so the app still loads
          callback({ uid: user.uid, id: user.uid, email: user.email || '', name: user.displayName || user.email || 'Admin', role: 'super_admin' } as AppUser);
        }
      } catch (err: any) {
        console.warn('Firestore user doc read failed:', err?.code, '— using auth info only. Fix Firestore rules to resolve.');
        // Still call callback so loading spinner doesn't hang
        callback({ uid: user.uid, id: user.uid, email: user.email || '', name: user.displayName || user.email || 'Admin', role: 'super_admin' } as AppUser);
      }
    } else {
      callback(null);
    }
  });
};
