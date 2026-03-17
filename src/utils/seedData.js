
import { db } from '../config/firebase';
import { collection, writeBatch, getDocs, doc } from 'firebase/firestore';

// NOTE: This script is for populating a fresh database for demos and testing.
// The document IDs are hardcoded to maintain consistency between seeding runs
// and to make relationships between documents (e.g., student <> fee) predictable.

const BRANCH_ID = 'trichy'; // All seeded data will belong to this branch.

// --- SAMPLE DATA ---

const sampleStudents = [
  { id: 'stud_01', name: 'Kavya Sharma', standard: '10', section: 'A', admissionDate: '2023-04-15' },
  { id: 'stud_02', name: 'Arun Kumar', standard: '12', section: 'B', admissionDate: '2023-03-20' },
  { id: 'stud_03', name: 'Priya Venkatesh', standard: '11', section: 'A', admissionDate: '2023-05-01' },
  { id: 'stud_04', name: 'Suresh Menon', standard: '10', section: 'B', admissionDate: '2023-04-18' },
  { id: 'stud_05', name: 'Anitha Rajan', standard: '9', section: 'C', admissionDate: '2023-06-10' },
];

const sampleStaff = [
  // IMPORTANT: For these staff members to log in, you must first create corresponding
  // users in Firebase Authentication. Then, replace the `uid` values below
  // with the actual UIDs from the created auth users.
  { id: 'staff_01', uid: 'REPLACE_WITH_ADMIN_AUTH_UID', name: 'Rajesh Kumar', role: 'admin', email: 'rajesh.admin@example.com', phone: '9876543210' },
  { id: 'staff_02', uid: 'REPLACE_WITH_MANAGER_AUTH_UID', name: 'Meena Iyer', role: 'manager', email: 'meena.manager@example.com', phone: '9876543211' },
  { id: 'staff_03', uid: 'REPLACE_WITH_TEACHER_AUTH_UID', name: 'Senthil Pandian', role: 'teacher', email: 'senthil.teacher@example.com', phone: '9876543212' },
];

// This collection maps a user's auth UID to their role for access control.
const sampleUsers = [
  { uid: 'REPLACE_WITH_ADMIN_AUTH_UID', role: 'admin' },
  { uid: 'REPLACE_WITH_MANAGER_AUTH_UID', role: 'manager' },
  { uid: 'REPLACE_WITH_TEACHER_AUTH_UID', role: 'teacher' },
];

const sampleFees = [
  { id: 'fee_01', studentId: 'stud_01', studentName: 'Kavya Sharma', amount: 5000, dueDate: '2024-07-10', status: 'Paid', paymentDate: '2024-07-05' },
  { id: 'fee_02', studentId: 'stud_02', studentName: 'Arun Kumar', amount: 6500, dueDate: '2024-07-10', status: 'Pending' },
  { id: 'fee_03', studentId: 'stud_03', studentName: 'Priya Venkatesh', amount: 6000, dueDate: '2024-07-10', status: 'Paid', paymentDate: '2024-07-08' },
  { id: 'fee_04', studentId: 'stud_04', studentName: 'Suresh Menon', amount: 5000, dueDate: '2024-07-10', status: 'Pending' },
  { id: 'fee_05', studentId: 'stud_01', studentName: 'Kavya Sharma', amount: 5000, dueDate: '2024-08-10', status: 'Pending' },
];

const sampleExpenses = [
  { id: 'exp_01', category: 'Stationery', amount: 2500, date: '2024-07-02', description: 'Whiteboard markers and notebooks' },
  { id: 'exp_02', category: 'Rent', amount: 25000, date: '2024-07-05', description: 'July office rent' },
  { id: 'exp_03', category: 'Utilities', amount: 3500, date: '2024-07-08', description: 'Electricity and water bill' },
];

const sampleAttendance = [
  // Day 1
  { date: '2024-07-15', standard: '10', studentId: 'stud_01', studentName: 'Kavya Sharma', status: 'Present' },
  { date: '2024-07-15', standard: '10', studentId: 'stud_04', studentName: 'Suresh Menon', status: 'Absent' },
  // Day 2
  { date: '2024-07-16', standard: '10', studentId: 'stud_01', studentName: 'Kavya Sharma', status: 'Present' },
  { date: '2024-07-16', standard: '10', studentId: 'stud_04', studentName: 'Suresh Menon', status: 'Present' },
];

const sampleBatches = [
    { id: 'batch_01', name: 'Class 10 - Maths', teacherId: 'staff_03', teacherName: 'Senthil Pandian', students: ['stud_01', 'stud_04'] },
    { id: 'batch_02', name: 'Class 12 - Physics', teacherId: 'staff_03', teacherName: 'Senthil Pandian', students: ['stud_02'] },
];

// --- CORE FUNCTIONS ---

/**
 * Writes all the sample data to Firestore using efficient batch operations.
 * Each document will be stamped with the `branchId`.
 */
export const seedDatabase = async () => {
  console.log('Starting to seed database...');
  const batch = writeBatch(db);

  const dataMap = {
    students: sampleStudents,
    staff: sampleStaff,
    users: sampleUsers,
    fees: sampleFees,
    expenses: sampleExpenses,
    batches: sampleBatches,
    attendance: sampleAttendance // Attendance uses auto-generated IDs
  };

  try {
    for (const [collectionName, data] of Object.entries(dataMap)) {
        console.log(`Preparing ${collectionName}...`);
        data.forEach(item => {
            // Use predefined ID if it exists, otherwise let Firestore generate it (for attendance)
            const docRef = item.id ? doc(db, collectionName, item.id) : doc(collection(db, collectionName));

            if (item.uid && item.uid.startsWith('REPLACE_WITH')) {
                console.warn(`Skipping user document for ${item.email} as it requires a real Auth UID.`);
                return;
            }

            batch.set(docRef, { ...item, branchId: BRANCH_ID });
        });
    }

    await batch.commit();
    console.log('✅ Database seeded successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

/**
 * Deletes all documents from all relevant collections.
 * This is a destructive operation. Be careful.
 */
export const clearDatabase = async () => {
  console.log('Starting to clear database...');
  const collectionsToDelete = ['students', 'staff', 'users', 'fees', 'expenses', 'attendance', 'batches'];

  for (const collectionName of collectionsToDelete) {
    try {
      console.log(`Clearing collection: ${collectionName}...`);
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) {
        console.log(`  -> Collection '${collectionName}' is already empty.`);
        continue;
      }
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`  -> Cleared ${snapshot.size} documents from '${collectionName}'.`);
    } catch (error) {
      console.error(`Error clearing collection ${collectionName}:`, error);
    }
  }
  console.log('Database clearing process complete.');
};
