
import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  setDoc,
  CollectionReference,
  DocumentData,
  Query,
  QueryConstraint,
  Unsubscribe,
  Timestamp,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase/firestore';

// --- Type Definitions ---

export interface BaseDoc {
  id: string;
}

export interface TimestampedDoc extends BaseDoc {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QueryCondition {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

export interface BatchOperation {
  type: 'set' | 'update' | 'delete';
  collection: string;
  id?: string; 
  data?: DocumentData;
}

// --- Generic CRUD Functions ---

export const addDocument = async <T extends DocumentData>(collectionName: string, data: T): Promise<T & BaseDoc> => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data } as T & BaseDoc;
};

export const setDocument = async <T extends DocumentData>(collectionName: string, docId: string, data: T): Promise<T & BaseDoc> => {
  await setDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return { id: docId, ...data } as T & BaseDoc;
};

export const getDocuments = async <T extends DocumentData>(
  collectionName: string,
  sortField: string = 'createdAt',
  sortDirection: OrderByDirection = 'desc'
): Promise<Array<T & BaseDoc>> => {
  try {
    const q = query(collection(db, collectionName), orderBy(sortField, sortDirection));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as T & BaseDoc));
  } catch (error) {
    console.warn(`Query failed with orderBy('${sortField}'). This may be due to a missing Firestore index. Falling back to an unsorted query.`, error);
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as T & BaseDoc));
  }
};

export const getDocument = async <T extends DocumentData>(collectionName: string, docId: string): Promise<(T & BaseDoc) | null> => {
  const snap = await getDoc(doc(db, collectionName, docId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as T & BaseDoc : null;
};

export const updateDocument = async <T extends DocumentData>(collectionName: string, docId: string, data: Partial<T>): Promise<Partial<T> & { id: string }> => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return { id: docId, ...data };
};

export const deleteDocument = async (collectionName: string, docId: string): Promise<string> => {
  await deleteDoc(doc(db, collectionName, docId));
  return docId;
};

export const queryDocuments = async <T extends DocumentData>(
  collectionName: string,
  conditions: QueryCondition[] = [],
  sortOptions?: { field: string; direction?: OrderByDirection },
  limitCount?: number
): Promise<Array<T & BaseDoc>> => {
    const constraints: QueryConstraint[] = conditions.map(c => where(c.field, c.operator, c.value));
    if (sortOptions) {
        constraints.push(orderBy(sortOptions.field, sortOptions.direction));
    }
    if (limitCount) {
        constraints.push(limit(limitCount));
    }

  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T & BaseDoc));
};

export const subscribeToCollection = <T extends DocumentData>(
    collectionName: string,
    callback: (data: Array<T & BaseDoc>) => void,
    conditions: QueryCondition[] = []
): Unsubscribe => {
    let q: Query | CollectionReference = collection(db, collectionName);
    if (conditions.length > 0) {
        const constraints = conditions.map(c => where(c.field, c.operator, c.value));
        q = query(q, ...constraints);
    }

    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as T & BaseDoc));
        callback(data);
    });
};

export const batchWrite = async (operations: BatchOperation[]): Promise<void> => {
  const batch = writeBatch(db);
  operations.forEach(op => {
    const ref = op.id ? doc(db, op.collection, op.id) : doc(collection(db, op.collection));
    switch (op.type) {
        case 'delete':
            batch.delete(ref);
            break;
        case 'set':
            batch.set(ref, { ...op.data, updatedAt: serverTimestamp() }, { merge: true });
            break;
        case 'update':
             batch.update(ref, { ...op.data, updatedAt: serverTimestamp() });
             break;
    }
  });
  await batch.commit();
};

// --- Service Factory ---

const createService = <T extends DocumentData>(collectionName: string) => ({
  getAll: (sortField?: string, sortDir?: OrderByDirection) => getDocuments<T>(collectionName, sortField, sortDir),
  getById: (id: string) => getDocument<T>(collectionName, id),
  add: (data: T) => addDocument<T>(collectionName, data),
  update: (id: string, data: Partial<T>) => updateDocument<T>(collectionName, id, data),
  delete: (id: string) => deleteDocument(collectionName, id),
  query: (conditions: QueryCondition[], sortOptions?: { field: string; direction?: OrderByDirection }, limitCount?: number) =>
    queryDocuments<T>(collectionName, conditions, sortOptions, limitCount),
  subscribe: (callback: (data: Array<T & BaseDoc>) => void, conditions?: QueryCondition[]) =>
    subscribeToCollection<T>(collectionName, callback, conditions),
  set: (id: string, data: T) => setDocument<T>(collectionName, id, data),
});

// --- Domain-Specific Services ---

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

// --- Migrated Data Services ---
export const studentHomeworkService = createService('studentHomework');
export const studentVideoHistoryService = createService('studentVideoHistory');
export const studentVideoBookmarksService = createService('studentVideoBookmarks');


export {
    addDocument, setDocument, getDocuments, getDocument,
    updateDocument, deleteDocument, queryDocuments,
    subscribeToCollection, batchWrite,
  };
