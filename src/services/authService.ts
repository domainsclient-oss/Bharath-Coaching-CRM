
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
import type { User } from '../data/settingsData'; // Using our existing User type

// A more specific type for our application user, combining Firebase and Firestore data
export type AppUser = User & { uid: string };

/**
 * Logs in a user with email and password.
 * @returns A combined user object with auth and database information.
 */
export const loginUser = async (email: string, password: string): Promise<AppUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    if (!userDoc.exists()) {
      throw new Error('User data not found in database.');
    }
    
    const userData = userDoc.data() as User;

    return {
      uid: userCredential.user.uid,
      ...userData,
    };
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

/**
 * Logs out the currently authenticated user.
 */
export const logoutUser = async (): Promise<void> => {
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
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        callback({ uid: user.uid, ...(userDoc.data() as User) });
      } else {
        // This case might happen if a user is deleted from Firestore but not Auth.
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};
