
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

// Check for missing required environment variables on the client side
// This ensures developers are aware of missing configuration.
if (typeof window !== 'undefined') {
    const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
    const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

    if (missingKeys.length > 0) {
        console.error(`Missing Firebase client config keys: ${missingKeys.join(', ')}. Check your .env.local file and ensure they are prefixed with NEXT_PUBLIC_.`);
    }
}

// Initialize Firebase App — singleton pattern prevents re-init on hot-reloads
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
console.log("Firebase connected");

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
