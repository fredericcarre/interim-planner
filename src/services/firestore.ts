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

// Helper to remove undefined values (Firestore doesn't accept undefined)
function removeUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
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
    ...removeUndefined(data),
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
    ...removeUndefined(data),
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

// ============ SHARE LINKS ============

export interface ShareLink {
  token: string;
  userId: string;
  month: string;
  entries: Array<{
    date: string;
    establishmentName: string;
    hours: number;
    hourlyRate: number;
    note?: string;
  }>;
  summary: {
    totalHours: number;
    totalGross: number;
    totalNet: number;
    count: number;
  };
  createdAt: Date;
}

/**
 * Create a share link for a month's planning
 */
export async function createShareLink(
  month: string,
  entries: WorkEntry[],
  summary: { totalHours: number; totalGross: number; totalNet: number; count: number }
): Promise<string> {
  const uid = getUserId();

  // Generate token
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Store in public shares collection
  const docRef = doc(db, 'shares', token);
  await setDoc(docRef, {
    token,
    userId: uid,
    month,
    entries: entries.map((e) => ({
      date: e.date,
      establishmentName: e.establishmentNameSnapshot,
      hours: e.hours,
      hourlyRate: e.hourlyRate,
      note: e.note || null,
    })),
    summary,
    createdAt: Timestamp.now(),
  });

  // Store reference in user's collection
  const userShareRef = doc(db, 'users', uid, 'shares', month);
  await setDoc(userShareRef, { token, createdAt: Timestamp.now() });

  return token;
}

/**
 * Get existing share link for a month
 */
export async function getShareLink(month: string): Promise<{ token: string } | null> {
  const uid = getUserId();
  const docRef = doc(db, 'users', uid, 'shares', month);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { token: docSnap.data().token };
}

/**
 * Get shared planning by token (public access)
 */
export async function getSharedPlanning(token: string): Promise<ShareLink | null> {
  const docRef = doc(db, 'shares', token);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    ...data,
    createdAt: toDate(data.createdAt),
  } as ShareLink;
}
