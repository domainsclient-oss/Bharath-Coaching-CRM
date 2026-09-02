
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Fail fast, with a message that names the missing variables.
//
// Without this, a missing key surfaces as `FirebaseError: auth/invalid-api-key`
// from getAuth() below — thrown while prerendering /_not-found, a page that has
// nothing to do with Firebase (the root layout wraps everything in AuthProvider,
// which imports this file). That trace tells you nothing about the real cause.
//
// NEXT_PUBLIC_ is required on every one of these: the Firebase client SDK runs
// in the browser, so the values must be inlined into the bundle at build time.
// Renaming them without the prefix makes them invisible to this code.
const REQUIRED_ENV = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
} as const;

const missingEnv = Object.entries(REQUIRED_ENV)
  .filter(([key]) => !firebaseConfig[key as keyof typeof firebaseConfig])
  .map(([, envName]) => envName);

if (missingEnv.length > 0) {
  throw new Error(
    `Firebase config missing: ${missingEnv.join(', ')}.\n` +
      'Locally: check .env. On Vercel: Settings -> Environment Variables, and ' +
      'make sure each name keeps its NEXT_PUBLIC_ prefix and is enabled for the ' +
      'environment being built. Env var changes only apply to a NEW deployment.'
  );
}

// Initialize Firebase App — singleton pattern prevents re-init on hot-reloads
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
if (typeof window !== 'undefined') {
  console.log('Firebase connected');
}

// Use initializeFirestore with long-polling to avoid WebChannel teardown crash
// in React 18 Strict Mode (which double-invokes effects in development).
// Falls back to getFirestore if already initialized.
export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    // Already initialized — return existing instance
    return getFirestore(app);
  }
})();
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
