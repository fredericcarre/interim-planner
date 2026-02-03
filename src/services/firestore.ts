import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type {
  UserSettings,
  Establishment,
  WorkEntry,
  EstablishmentFormData,
  WorkEntryFormData,
} from '@/types';
import { DEFAULT_NET_COEFFICIENT } from '@/utils/calculations';

// Helper to get current user ID
function getUserId(): string {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.uid;
}

// Helper to convert Firestore timestamps to Dates
function toDate(timestamp: Timestamp | Date): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
}

// ============ USER SETTINGS ============

/**
 * Get user settings, creating defaults if they don't exist
 */
export async function getUserSettings(): Promise<UserSettings> {
  const uid = getUserId();
  const docRef = doc(db, 'users', uid, 'settings', 'main');
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserSettings;
  }

  // Create default settings
  const defaultSettings: UserSettings = {
    netCoefficient: DEFAULT_NET_COEFFICIENT,
    currency: 'EUR',
  };

  await setDoc(docRef, defaultSettings);
  return defaultSettings;
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  settings: Partial<UserSettings>
): Promise<void> {
  const uid = getUserId();
  const docRef = doc(db, 'users', uid, 'settings', 'main');
  await updateDoc(docRef, settings);
}

// ============ ESTABLISHMENTS ============

/**
 * Get all establishments for the current user
 */
export async function getEstablishments(): Promise<Establishment[]> {
  const uid = getUserId();
  const collRef = collection(db, 'users', uid, 'establishments');
  const q = query(collRef, orderBy('name', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    updatedAt: toDate(doc.data().updatedAt),
  })) as Establishment[];
}

/**
 * Get a single establishment by ID
 */
export async function getEstablishment(id: string): Promise<Establishment | null> {
  const uid = getUserId();
  const docRef = doc(db, 'users', uid, 'establishments', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as Establishment;
}

/**
 * Create a new establishment
 */
export async function createEstablishment(
  data: EstablishmentFormData
): Promise<string> {
  const uid = getUserId();
  const collRef = collection(db, 'users', uid, 'establishments');
  const docRef = doc(collRef);

  const now = Timestamp.now();
  await setDoc(docRef, {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

/**
 * Update an establishment
 */
export async function updateEstablishment(
  id: string,
  data: Partial<EstablishmentFormData>
): Promise<void> {
  const uid = getUserId();
  const docRef = doc(db, 'users', uid, 'establishments', id);

  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete an establishment
 */
export async function deleteEstablishment(id: string): Promise<void> {
  const uid = getUserId();
  const docRef = doc(db, 'users', uid, 'establishments', id);
  await deleteDoc(docRef);
}

// ============ WORK ENTRIES ============

/**
 * Get work entries for a specific month
 */
export async function getWorkEntriesForMonth(
  month: string // YYYY-MM format
): Promise<WorkEntry[]> {
  const uid = getUserId();
  const collRef = collection(db, 'users', uid, 'workEntries');

  // Query entries where date starts with the month
  const startDate = `${month}-01`;
  const endDate = `${month}-31`;

  const q = query(
    collRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    updatedAt: toDate(doc.data().updatedAt),
  })) as WorkEntry[];
}

/**
 * Get all work entries for the current user
 */
export async function getAllWorkEntries(): Promise<WorkEntry[]> {
  const uid = getUserId();
  const collRef = collection(db, 'users', uid, 'workEntries');
  const q = query(collRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    updatedAt: toDate(doc.data().updatedAt),
  })) as WorkEntry[];
}

/**
 * Get a single work entry by ID
 */
export async function getWorkEntry(id: string): Promise<WorkEntry | null> {
  const uid = getUserId();
  const docRef = doc(db, 'users', uid, 'workEntries', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as WorkEntry;
}

/**
 * Create a new work entry
 */
export async function createWorkEntry(
  data: WorkEntryFormData,
  establishmentName: string
): Promise<string> {
  const uid = getUserId();
  const collRef = collection(db, 'users', uid, 'workEntries');
  const docRef = doc(collRef);

  const now = Timestamp.now();
  await setDoc(docRef, {
    ...data,
    establishmentNameSnapshot: establishmentName,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

/**
 * Update a work entry
 */
export async function updateWorkEntry(
  id: string,
  data: Partial<WorkEntryFormData>,
  establishmentName?: string
): Promise<void> {
  const uid = getUserId();
  const docRef = doc(db, 'users', uid, 'workEntries', id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  if (establishmentName !== undefined) {
    updateData.establishmentNameSnapshot = establishmentName;
  }

  await updateDoc(docRef, updateData);
}

/**
 * Delete a work entry
 */
export async function deleteWorkEntry(id: string): Promise<void> {
  const uid = getUserId();
  const docRef = doc(db, 'users', uid, 'workEntries', id);
  await deleteDoc(docRef);
}

// ============ GDPR / DATA EXPORT ============

/**
 * Export all user data
 */
export async function exportAllUserData(): Promise<{
  settings: UserSettings | null;
  establishments: Establishment[];
  workEntries: WorkEntry[];
}> {
  const [settings, establishments, workEntries] = await Promise.all([
    getUserSettings().catch(() => null),
    getEstablishments(),
    getAllWorkEntries(),
  ]);

  return { settings, establishments, workEntries };
}

/**
 * Delete all user data (for GDPR compliance)
 */
export async function deleteAllUserData(): Promise<void> {
  const uid = getUserId();
  const batch = writeBatch(db);

  // Delete settings
  batch.delete(doc(db, 'users', uid, 'settings', 'main'));

  // Delete all establishments
  const establishmentsSnap = await getDocs(
    collection(db, 'users', uid, 'establishments')
  );
  establishmentsSnap.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete all work entries
  const entriesSnap = await getDocs(
    collection(db, 'users', uid, 'workEntries')
  );
  entriesSnap.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}
