# Firebase Studio Prompts — Bharath Academy
## Complete Sequential Prompts for Firebase Setup, Migration & White-Label Configuration

---

## HOW TO USE THIS FILE

1. Open your project in **Firebase Studio**
2. Copy each prompt **one at a time** in sequence
3. Paste it into the Firebase Studio AI chat
4. Review the changes, test, then move to the next prompt
5. Do NOT skip prompts — they build on each other

---

## PHASE 1: FIREBASE PROJECT SETUP & SDK INSTALLATION

---

### PROMPT F1: Install Firebase SDK

```
Install Firebase SDK in this project. Run the following:

npm install firebase

After installation, confirm the package was added to package.json dependencies.
```

---

### PROMPT F2: Create Firebase Configuration File

```
Create a new file at src/config/firebase.js with the following content:

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
if (missingKeys.length > 0) {
  console.error('Missing Firebase config: ' + missingKeys.join(', ') + '. Check your .env file.');
}

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
```

---

### PROMPT F3: Create Environment Variables Template

```
Create two files in the project root:

FILE 1: .env.example (template for reference)
FILE 2: .env (actual config file)

Both should have this structure — .env should have the REAL Firebase values from my Firebase Console, .env.example should have placeholder values:

# Firebase Config
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Center Details
VITE_CENTER_NAME="Bharath Academy"
VITE_CENTER_TAGLINE="Excellence in Education"
VITE_CENTER_LOGO="/logo.png"
VITE_CENTER_PHONE="+91 9876543210"
VITE_CENTER_EMAIL="info@bharathacademy.com"
VITE_CENTER_ADDRESS="Your Address Here"
VITE_CENTER_CITY="Chennai"
VITE_CENTER_STATE="Tamil Nadu"
VITE_CENTER_PINCODE="600001"

# Theme
VITE_THEME_PRIMARY="#1a73e8"
VITE_THEME_SECONDARY="#34a853"
VITE_THEME_ACCENT="#ea4335"
VITE_THEME_BG="#f5f5f5"
VITE_THEME_SIDEBAR="#1e293b"

# Currency & Locale
VITE_CURRENCY="INR"
VITE_CURRENCY_SYMBOL="₹"
VITE_DATE_FORMAT="DD/MM/YYYY"

# Feature Toggles
VITE_FEATURE_ATTENDANCE="true"
VITE_FEATURE_FEES="true"
VITE_FEATURE_EXPENSES="true"
VITE_FEATURE_REPORTS="true"
VITE_FEATURE_STAFF="true"
VITE_FEATURE_SMS="false"
VITE_FEATURE_PAYMENT="false"
VITE_FEATURE_PARENT_PORTAL="false"
VITE_FEATURE_TIMETABLE="true"
VITE_FEATURE_EXAMS="true"

# Receipt Settings
VITE_RECEIPT_PREFIX="RCP"
VITE_RECEIPT_FOOTER="Thank you for your payment!"

Also add .env to the .gitignore file if it's not already there.
```

---

### PROMPT F4: Create White-Label Center Config

```
Create a new file at src/config/centerConfig.js

This file is the single source of truth for all center-specific branding and settings. Every value should be pulled from environment variables with sensible defaults:

const centerConfig = {
  centerName: import.meta.env.VITE_CENTER_NAME || "Academy Name",
  tagline: import.meta.env.VITE_CENTER_TAGLINE || "Excellence in Education",
  logo: import.meta.env.VITE_CENTER_LOGO || "/logo.png",
  favicon: import.meta.env.VITE_CENTER_FAVICON || "/favicon.ico",

  phone: import.meta.env.VITE_CENTER_PHONE || "+91 XXXXXXXXXX",
  altPhone: import.meta.env.VITE_CENTER_ALT_PHONE || "",
  email: import.meta.env.VITE_CENTER_EMAIL || "info@academy.com",
  address: import.meta.env.VITE_CENTER_ADDRESS || "Address here",
  city: import.meta.env.VITE_CENTER_CITY || "Chennai",
  state: import.meta.env.VITE_CENTER_STATE || "Tamil Nadu",
  pincode: import.meta.env.VITE_CENTER_PINCODE || "600001",
  website: import.meta.env.VITE_CENTER_WEBSITE || "",

  theme: {
    primaryColor: import.meta.env.VITE_THEME_PRIMARY || "#1a73e8",
    secondaryColor: import.meta.env.VITE_THEME_SECONDARY || "#34a853",
    accentColor: import.meta.env.VITE_THEME_ACCENT || "#ea4335",
    backgroundColor: import.meta.env.VITE_THEME_BG || "#f5f5f5",
    sidebarColor: import.meta.env.VITE_THEME_SIDEBAR || "#1e293b",
    fontFamily: import.meta.env.VITE_THEME_FONT || "'Inter', sans-serif",
  },

  currency: import.meta.env.VITE_CURRENCY || "INR",
  currencySymbol: import.meta.env.VITE_CURRENCY_SYMBOL || "₹",
  dateFormat: import.meta.env.VITE_DATE_FORMAT || "DD/MM/YYYY",
  timezone: import.meta.env.VITE_TIMEZONE || "Asia/Kolkata",

  academicYearStart: import.meta.env.VITE_ACADEMIC_YEAR_START || "June",
  academicYearEnd: import.meta.env.VITE_ACADEMIC_YEAR_END || "April",

  features: {
    attendance: (import.meta.env.VITE_FEATURE_ATTENDANCE || "true") === "true",
    feeManagement: (import.meta.env.VITE_FEATURE_FEES || "true") === "true",
    expenseTracking: (import.meta.env.VITE_FEATURE_EXPENSES || "true") === "true",
    reportCards: (import.meta.env.VITE_FEATURE_REPORTS || "true") === "true",
    staffManagement: (import.meta.env.VITE_FEATURE_STAFF || "true") === "true",
    smsNotifications: (import.meta.env.VITE_FEATURE_SMS || "false") === "true",
    onlinePayment: (import.meta.env.VITE_FEATURE_PAYMENT || "false") === "true",
    parentPortal: (import.meta.env.VITE_FEATURE_PARENT_PORTAL || "false") === "true",
    timetable: (import.meta.env.VITE_FEATURE_TIMETABLE || "true") === "true",
    examManagement: (import.meta.env.VITE_FEATURE_EXAMS || "true") === "true",
  },

  receipt: {
    prefix: import.meta.env.VITE_RECEIPT_PREFIX || "RCP",
    footer: import.meta.env.VITE_RECEIPT_FOOTER || "Thank you for your payment!",
    showLogo: (import.meta.env.VITE_RECEIPT_SHOW_LOGO || "true") === "true",
  },
};

export default centerConfig;
```

---

## PHASE 2: FIRESTORE SERVICE LAYER

---

### PROMPT F5: Create Firestore Service with CRUD Operations

```
Create a new file at src/services/firestoreService.js

This is the generic data layer that replaces all localStorage usage. It should have:

1. Generic CRUD functions: addDocument, setDocument, getDocuments, getDocument, updateDocument, deleteDocument, queryDocuments
2. Real-time listener: subscribeToCollection
3. Batch operations: batchWrite
4. Domain-specific service factories using a createService helper

Here's the complete code:

import { db } from '../config/firebase';
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp,
  writeBatch, setDoc,
} from 'firebase/firestore';

const addDocument = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data };
};

const setDocument = async (collectionName, docId, data) => {
  await setDoc(doc(db, collectionName, docId), {
    ...data, updatedAt: serverTimestamp(),
  }, { merge: true });
  return { id: docId, ...data };
};

const getDocuments = async (collectionName, sortField = 'createdAt', sortDirection = 'desc') => {
  try {
    const q = query(collection(db, collectionName), orderBy(sortField, sortDirection));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};

const getDocument = async (collectionName, docId) => {
  const snap = await getDoc(doc(db, collectionName, docId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

const updateDocument = async (collectionName, docId, data) => {
  await updateDoc(doc(db, collectionName, docId), { ...data, updatedAt: serverTimestamp() });
  return { id: docId, ...data };
};

const deleteDocument = async (collectionName, docId) => {
  await deleteDoc(doc(db, collectionName, docId));
  return docId;
};

const queryDocuments = async (collectionName, conditions = [], sortField = null, limitCount = null) => {
  let constraints = conditions.map(c => where(c.field, c.operator, c.value));
  if (sortField) constraints.push(orderBy(sortField));
  if (limitCount) constraints.push(limit(limitCount));
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

const subscribeToCollection = (collectionName, callback, conditions = []) => {
  let q;
  if (conditions.length > 0) {
    const constraints = conditions.map(c => where(c.field, c.operator, c.value));
    q = query(collection(db, collectionName), ...constraints);
  } else {
    q = collection(db, collectionName);
  }
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

const batchWrite = async (operations) => {
  const batch = writeBatch(db);
  operations.forEach(op => {
    const ref = op.id ? doc(db, op.collection, op.id) : doc(collection(db, op.collection));
    if (op.type === 'delete') batch.delete(ref);
    else batch.set(ref, { ...op.data, updatedAt: serverTimestamp() }, { merge: true });
  });
  await batch.commit();
};

const createService = (collectionName) => ({
  getAll: (sortField, sortDir) => getDocuments(collectionName, sortField, sortDir),
  getById: (id) => getDocument(collectionName, id),
  add: (data) => addDocument(collectionName, data),
  update: (id, data) => updateDocument(collectionName, id, data),
  delete: (id) => deleteDocument(collectionName, id),
  query: (conditions, sortField, limitCount) => queryDocuments(collectionName, conditions, sortField, limitCount),
  subscribe: (callback, conditions) => subscribeToCollection(collectionName, callback, conditions),
  set: (id, data) => setDocument(collectionName, id, data),
});

export const studentService = createService('students');
export const staffService = createService('staff');
export const feeService = createService('fees');
export const expenseService = createService('expenses');
export const attendanceService = createService('attendance');
export const classService = createService('classes');
export const reportService = createService('reports');
export const userService = createService('users');
export const configService = createService('config');
export const examService = createService('exams');
export const timetableService = createService('timetable');
export const notificationService = createService('notifications');
export const batchService = createService('batches');
export const scheduleService = createService('schedules');
export const certificateService = createService('certificates');
export const enquiryService = createService('enquiries');
export const paymentService = createService('payments');

export {
  addDocument, setDocument, getDocuments, getDocument,
  updateDocument, deleteDocument, queryDocuments,
  subscribeToCollection, batchWrite,
};
```

---

### PROMPT F6: Create Auth Service

```
Create a new file at src/services/authService.js

This handles all authentication operations — login, logout, password reset, and user role management:

import { auth, db } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      role: userData.role || 'staff',
      name: userData.name || '',
      ...userData,
    };
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const registerUser = async (email, password, userData) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    email,
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { uid: userCredential.user.uid, email, ...userData };
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const changePassword = async (newPassword) => {
  if (auth.currentUser) {
    await updatePassword(auth.currentUser, newPassword);
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        resolve({ uid: user.uid, email: user.email, ...userData });
      } else {
        resolve(null);
      }
    });
  });
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      callback({ uid: user.uid, email: user.email, ...userData });
    } else {
      callback(null);
    }
  });
};
```

---

## PHASE 3: SCAN & REPLACE LOCALSTORAGE

---

### PROMPT F7: Scan All localStorage Usage

```
Search the entire project codebase and list every file that uses localStorage. 

For each file found, list:
1. The file path
2. The exact localStorage key being used (e.g., localStorage.getItem('students'))
3. Whether it's a getItem, setItem, or removeItem call
4. What data structure is being stored (array of objects, single object, string, etc.)

Present this as a complete table/list. Do NOT make any changes yet — just audit and report.
```

---

### PROMPT F8: Create Migration Mapping

```
Based on the localStorage audit from the previous step, create a migration mapping file at src/utils/migrationMap.js

This file should export a constant that maps each localStorage key to its corresponding Firestore collection name:

const migrationMap = {
  // Format: 'localStorageKey': 'firestoreCollectionName'
  // Example:
  // 'students': 'students',
  // 'staffMembers': 'staff',
  // 'feeRecords': 'fees',
  // 'expenses': 'expenses',
  // 'attendanceData': 'attendance',
  // ... map ALL keys found in the audit
};

export default migrationMap;

Fill in the actual mappings based on what was found in the localStorage audit. Use clean, consistent Firestore collection names.
```

---

### PROMPT F9: Create Data Migration Utility

```
Create a new file at src/utils/migrateData.js

This utility will migrate all existing localStorage data to Firestore. It should:

1. Import the migrationMap from ./migrationMap
2. Import db from ../config/firebase
3. For each entry in migrationMap:
   a. Read the data from localStorage using the key
   b. Parse the JSON data
   c. If it's an array, batch-write all items to the Firestore collection
   d. If it's a single object, write it as a single document
   e. Add createdAt and updatedAt timestamps
   f. Log progress for each collection
4. Export a function called migrateAllData that runs the full migration
5. Export a function called clearLocalStorage that removes all migrated keys
6. Include error handling and a summary at the end showing what was migrated

Also create a simple migration page/component at src/pages/MigrationPage.jsx that:
- Has a "Start Migration" button
- Shows progress as each collection is migrated
- Shows a success/failure summary
- Has a "Clear Old Data" button to remove localStorage after confirming migration worked

This page is temporary — we'll remove it after migration is complete.
```

---

## PHASE 4: REPLACE LOCALSTORAGE IN EACH PAGE

---

### PROMPT F10: Replace localStorage in Student Management Pages

```
Now replace all localStorage usage in the student-related pages/components with Firestore calls.

For every file that deals with students:

1. Remove all localStorage.getItem('students') calls
2. Remove all localStorage.setItem('students', ...) calls
3. Import { studentService } from '../services/firestoreService'
4. Replace read operations:
   - OLD: const students = JSON.parse(localStorage.getItem('students')) || []
   - NEW: Use useEffect with async function to call studentService.getAll() and set state
5. Replace write operations:
   - OLD: localStorage.setItem('students', JSON.stringify(updatedStudents))
   - NEW: Use studentService.add(newStudent) for new entries
   - NEW: Use studentService.update(id, updatedData) for edits
   - NEW: Use studentService.delete(id) for deletions
6. Add loading states (show a spinner while data loads from Firestore)
7. Add error handling with try-catch blocks
8. Make sure all CRUD operations work: Create, Read, Update, Delete

Do NOT change any UI/styling — only replace the data layer.
Show me each file you changed and what was changed.
```

---

### PROMPT F11: Replace localStorage in Staff Management Pages

```
Now replace all localStorage usage in staff/teacher-related pages/components with Firestore calls.

For every file that deals with staff or teachers:

1. Import { staffService } from '../services/firestoreService'
2. Replace all localStorage.getItem calls related to staff with staffService.getAll()
3. Replace all localStorage.setItem calls with staffService.add(), staffService.update(), or staffService.delete()
4. Use useEffect + useState + async/await pattern for loading data
5. Add loading states and error handling
6. Preserve all existing UI — only change the data layer

Show me each file changed.
```

---

### PROMPT F12: Replace localStorage in Fee Management Pages

```
Now replace all localStorage usage in fee/payment-related pages/components with Firestore calls.

For every file that deals with fees, payments, receipts, or billing:

1. Import { feeService } from '../services/firestoreService'
2. Replace all localStorage.getItem calls related to fees with feeService.getAll() or feeService.query()
3. Replace all localStorage.setItem calls with feeService.add(), feeService.update()
4. For fee queries (like "get fees for a specific student"), use:
   feeService.query([{ field: 'studentId', operator: '==', value: studentId }])
5. Add loading states and error handling
6. Preserve all existing UI

Show me each file changed.
```

---

### PROMPT F13: Replace localStorage in Attendance Pages

```
Now replace all localStorage usage in attendance-related pages/components with Firestore calls.

For every file that deals with attendance:

1. Import { attendanceService } from '../services/firestoreService'
2. Replace all localStorage operations with attendanceService methods
3. For date-based queries, use:
   attendanceService.query([{ field: 'date', operator: '==', value: selectedDate }])
4. For saving daily attendance, use attendanceService.set(dateString, attendanceData) so each date has one document
5. Add loading states and error handling
6. Preserve all existing UI

Show me each file changed.
```

---

### PROMPT F14: Replace localStorage in Expense Management Pages

```
Now replace all localStorage usage in expense-related pages/components with Firestore calls.

For every file that deals with expenses:

1. Import { expenseService } from '../services/firestoreService'
2. Replace all localStorage operations with expenseService methods
3. For filtered queries (by date range, category, etc.), use expenseService.query() with appropriate conditions
4. Add loading states and error handling
5. Preserve all existing UI

Show me each file changed.
```

---

### PROMPT F15: Replace localStorage in Exam & Report Pages

```
Now replace all localStorage usage in exam, marks, report card, and assessment pages/components with Firestore calls.

For every file that deals with exams, marks, or reports:

1. Import { examService, reportService } from '../services/firestoreService'
2. Replace all localStorage operations with the appropriate service methods
3. Add loading states and error handling
4. Preserve all existing UI

Show me each file changed.
```

---

### PROMPT F16: Replace localStorage in Class/Batch & Timetable Pages

```
Now replace all localStorage usage in class, batch, section, timetable, and schedule pages/components with Firestore calls.

For every file that deals with classes, batches, or timetables:

1. Import { classService, timetableService, batchService, scheduleService } from '../services/firestoreService'
2. Replace all localStorage operations with appropriate service methods
3. Add loading states and error handling
4. Preserve all existing UI

Show me each file changed.
```

---

### PROMPT F17: Replace localStorage in ALL Remaining Pages

```
Scan the ENTIRE project one more time for any remaining localStorage usage.

Check every single file — pages, components, utils, hooks, context — for any localStorage.getItem, localStorage.setItem, localStorage.removeItem, or localStorage.clear calls that have NOT been migrated yet.

For each one found:
1. Replace with the appropriate Firestore service call
2. Add loading and error handling
3. Import the correct service from firestoreService.js

If there are localStorage calls for non-data purposes (like theme preference, sidebar state, or UI settings), those can STAY in localStorage — only migrate actual application data.

List every file that still had localStorage and what you changed.
Confirm when there are ZERO remaining application-data localStorage calls.
```

---

## PHASE 5: WHITE-LABEL BRANDING REPLACEMENT

---

### PROMPT F18: Replace All Hardcoded Center Names

```
Search the ENTIRE project codebase for any hardcoded references to "Bharath Academy", "Bharath", "bharath", "BHARATH", or any variation of the center name.

For EVERY occurrence found:

1. Import centerConfig from the appropriate relative path: import centerConfig from '../config/centerConfig'
   (or '../../config/centerConfig' depending on file depth)

2. Replace the hardcoded text:
   - "Bharath Academy" → centerConfig.centerName
   - Any hardcoded phone number → centerConfig.phone
   - Any hardcoded email → centerConfig.email
   - Any hardcoded address → centerConfig.address

3. For HTML title tags or meta tags, use centerConfig.centerName

4. For the sidebar/header component, use centerConfig.centerName and centerConfig.logo

List every file and line where a replacement was made.
After all replacements, confirm there are ZERO hardcoded center-specific strings remaining.
```

---

### PROMPT F19: Apply Theme Colors from Config

```
Update the project's theme/styling to use colors from centerConfig instead of hardcoded values.

1. Find the main CSS file, Tailwind config, or theme provider
2. Create CSS custom properties (variables) that read from centerConfig:

In the main App.jsx or layout component, add a useEffect that sets CSS variables:

useEffect(() => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', centerConfig.theme.primaryColor);
  root.style.setProperty('--color-secondary', centerConfig.theme.secondaryColor);
  root.style.setProperty('--color-accent', centerConfig.theme.accentColor);
  root.style.setProperty('--color-bg', centerConfig.theme.backgroundColor);
  root.style.setProperty('--color-sidebar', centerConfig.theme.sidebarColor);
  root.style.setProperty('--font-family', centerConfig.theme.fontFamily);
}, []);

3. Replace any hardcoded color values in CSS/Tailwind with these CSS variables where feasible
4. Update the document title: document.title = centerConfig.centerName

This ensures changing the .env theme values automatically rebrands the entire app.
```

---

### PROMPT F20: Add Feature Toggle Support to Navigation

```
Update the sidebar/navigation component to conditionally show/hide menu items based on centerConfig.features.

For example:
- Only show "Attendance" menu item if centerConfig.features.attendance is true
- Only show "Fee Management" if centerConfig.features.feeManagement is true
- Only show "Expenses" if centerConfig.features.expenseTracking is true
- Only show "Timetable" if centerConfig.features.timetable is true
- Only show "Exams" if centerConfig.features.examManagement is true

Import centerConfig and wrap each navigation item in a conditional:

{centerConfig.features.attendance && (
  <NavItem to="/attendance" icon={...} label="Attendance" />
)}

Also update the router/routes to only register routes for enabled features.
This way, disabling a feature in .env completely removes it from the app.
```

---

## PHASE 6: AUTHENTICATION & SECURITY

---

### PROMPT F21: Add Login Page with Firebase Auth

```
Create a login page at src/pages/LoginPage.jsx that:

1. Has a clean, professional login form with email and password fields
2. Shows the center logo and name from centerConfig at the top
3. Uses the loginUser function from src/services/authService.js
4. On successful login, stores user data in React context/state and redirects to dashboard
5. On failure, shows appropriate error messages:
   - "Invalid email or password" for auth/wrong-password or auth/user-not-found
   - "Too many attempts. Try again later." for auth/too-many-requests
6. Has a "Forgot Password?" link that calls resetPassword from authService
7. Shows a loading spinner during authentication
8. Uses the theme colors from centerConfig

Style it professionally — this is the first screen users see.
```

---

### PROMPT F22: Add Auth Context and Route Protection

```
Create an authentication context and protect all routes:

1. Create src/context/AuthContext.jsx that:
   - Uses React Context to store the current user
   - On app load, checks if user is already logged in using onAuthChange from authService
   - Provides user data, login, logout functions to all components
   - Tracks loading state while checking auth

2. Create src/components/ProtectedRoute.jsx that:
   - Wraps around routes that require authentication
   - If user is not logged in, redirects to /login
   - If user is logged in, renders the child component
   - Shows a loading spinner while checking auth state

3. Update App.jsx / router to:
   - Wrap the app in AuthProvider
   - Make /login the public route
   - Wrap all other routes in ProtectedRoute
   - Add a logout button in the header/sidebar that calls logoutUser

4. Create src/components/RoleBasedAccess.jsx that:
   - Accepts an allowedRoles prop (e.g., ['admin', 'manager'])
   - Only renders children if the current user's role is in allowedRoles
   - Otherwise shows "Access Denied" or hides the content
```

---

## PHASE 7: FIRESTORE SECURITY RULES & INDEXES

---

### PROMPT F23: Create Firestore Security Rules

```
Create a file called firestore.rules in the project root with these security rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function — check if user is logged in
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper — check user role from their user document
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }
    
    function isStaffOrAbove() {
      return isAuthenticated() && getUserRole() in ['admin', 'manager', 'staff'];
    }

    // Config — only admins can write
    match /config/{document} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Students
    match /students/{studentId} {
      allow read: if isAuthenticated();
      allow create, update: if isStaffOrAbove();
      allow delete: if isAdmin();
    }

    // Staff
    match /staff/{staffId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Fees
    match /fees/{feeId} {
      allow read: if isAuthenticated();
      allow create, update: if isStaffOrAbove();
      allow delete: if isAdmin();
    }

    // Attendance
    match /attendance/{docId} {
      allow read: if isAuthenticated();
      allow write: if isStaffOrAbove();
    }

    // Expenses
    match /expenses/{expenseId} {
      allow read: if isAuthenticated();
      allow create, update: if isStaffOrAbove();
      allow delete: if isAdmin();
    }

    // Exams, Reports, Classes, Timetable — staff can read/write, only admin can delete
    match /{collectionName}/{docId} {
      allow read: if isAuthenticated();
      allow create, update: if isStaffOrAbove();
      allow delete: if isAdmin();
    }

    // Users — only admin can manage user accounts
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow write: if isAdmin();
    }
  }
}

Also tell me how to deploy these rules from Firebase Console:
Go to Firebase Console → Firestore Database → Rules tab → paste and publish.
```

---

### PROMPT F24: Create Firestore Indexes

```
Scan all the Firestore queries used across the project (especially in firestoreService.js and any page-level queries).

For any query that uses:
- Multiple where() clauses
- A where() clause combined with orderBy()
- Range queries (<, >, <=, >=) combined with other filters

Create a firestore.indexes.json file listing all required composite indexes.

Format:
{
  "indexes": [
    {
      "collectionGroup": "fees",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "classId", "order": "ASCENDING" }
      ]
    }
  ]
}

List all indexes needed based on actual queries in the codebase.
```

---

## PHASE 8: TESTING & DEPLOYMENT

---

### PROMPT F25: Full Integration Test

```
Do a comprehensive check of the entire application:

1. Verify Firebase connection: Add a test in App.jsx that logs "Firebase connected" on load
2. Check every page/route:
   - Does it load without errors?
   - Does it read data from Firestore (not localStorage)?
   - Do create/update/delete operations work?
   - Are loading states shown while fetching?
   - Are error states handled?
3. Check the console for any errors or warnings
4. Verify no remaining localStorage calls for app data
5. Verify no hardcoded "Bharath Academy" text
6. Verify centerConfig values appear correctly everywhere
7. Test login/logout flow
8. Test that protected routes redirect to login when not authenticated

List any issues found and fix them.
```

---

### PROMPT F26: Setup Firebase Hosting & Deploy

```
Set up Firebase Hosting for deployment:

1. Install Firebase CLI: npm install -g firebase-tools
2. Initialize hosting: firebase init hosting
   - Select the existing Firebase project
   - Set public directory to: dist (for Vite) or build (for CRA)
   - Configure as single-page app: Yes
   - Don't overwrite index.html: No
3. Build the project: npm run build
4. Deploy: firebase deploy --only hosting

Also create a deploy.sh script in the project root:

#!/bin/bash
echo "Building project..."
npm run build
echo "Deploying to Firebase..."
firebase deploy --only hosting
echo "Deployment complete!"

And update package.json scripts to add:
"deploy": "npm run build && firebase deploy --only hosting"
```

---

### PROMPT F27: Create New Client Deployment Guide

```
Create a file called DEPLOYMENT_GUIDE.md in the project root.

This guide should explain step-by-step how to deploy this same app for a completely different coaching center (not Bharath Academy). Write it so that even a junior developer can follow it:

## Deploying for a New Client

### Prerequisites
- Node.js 18+ installed
- Firebase CLI installed (npm install -g firebase-tools)
- A Google account for Firebase

### Steps

1. Clone the repository
2. Create a new Firebase project at console.firebase.google.com
3. Enable Firestore Database (asia-south1 region)
4. Enable Authentication (Email/Password)
5. Enable Storage
6. Register a web app and copy the config
7. Copy .env.example to .env
8. Fill in all values:
   - Firebase config from step 6
   - New center name, phone, email, address
   - New theme colors
   - Enable/disable features as needed
9. Replace public/logo.png with the new center's logo
10. Run: npm install
11. Run: npm run build
12. Run: firebase login
13. Run: firebase init (select the new project)
14. Run: firebase deploy
15. Create admin user in Firebase Console → Authentication
16. Create user document in Firestore: users/{uid} with role: "admin"
17. Test the deployed URL

### What Changes Per Client
- .env file (ALL center-specific values)
- public/logo.png (center logo)
- Firebase project (separate database per client)

### What NEVER Changes
- Source code
- Components
- Services
- Routing

Include all of this in the guide with clear formatting.
```

---

## PHASE 9: CLEANUP & FINAL POLISH

---

### PROMPT F28: Remove Migration Page & Clean Up

```
Now that migration is complete:

1. Remove src/pages/MigrationPage.jsx (the temporary migration page)
2. Remove the migration route from the router
3. Remove src/utils/migrateData.js
4. Remove src/utils/migrationMap.js
5. Do a final search for any TODO or FIXME comments and resolve them
6. Remove any console.log statements used for debugging (keep console.error for actual errors)
7. Make sure all imports are clean — no unused imports
8. Verify the app runs without errors: npm run dev

Confirm the app is clean and production-ready.
```

---

### PROMPT F29: Create Seed Data Script (Optional)

```
Create a file at src/utils/seedData.js that can populate a fresh Firestore database with sample data for demo/testing purposes.

Include sample data for:
- 5 sample students with different classes
- 3 sample staff members (1 admin, 1 manager, 1 teacher)
- 5 sample fee records
- 3 sample expense entries
- 2 days of attendance records
- 2 sample classes/batches

Each entry should have realistic Indian names and data appropriate for a coaching center in Tamil Nadu.

Export a seedDatabase() function that writes all this data to Firestore.
Also export a clearDatabase() function that deletes all documents from all collections.

This is useful when setting up a demo for a new client.
```

---

## SUMMARY CHECKLIST

After completing all prompts, verify:

| # | Check | Status |
|---|-------|--------|
| 1 | Firebase SDK installed | ☐ |
| 2 | firebase.js config created with env vars | ☐ |
| 3 | .env file created with real Firebase values | ☐ |
| 4 | centerConfig.js created for white-label | ☐ |
| 5 | firestoreService.js created with all CRUD ops | ☐ |
| 6 | authService.js created | ☐ |
| 7 | ALL localStorage calls replaced with Firestore | ☐ |
| 8 | ALL hardcoded "Bharath Academy" replaced | ☐ |
| 9 | Theme colors driven by config | ☐ |
| 10 | Feature toggles working in navigation | ☐ |
| 11 | Login page working with Firebase Auth | ☐ |
| 12 | Protected routes working | ☐ |
| 13 | Firestore security rules deployed | ☐ |
| 14 | App builds without errors | ☐ |
| 15 | App deploys to Firebase Hosting | ☐ |
| 16 | DEPLOYMENT_GUIDE.md created for new clients | ☐ |
| 17 | Existing data migrated to Firestore | ☐ |
| 18 | Migration utilities removed | ☐ |
