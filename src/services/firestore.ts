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
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type {
  UserSettings,
  Establishment,
  WorkEntry,
  EstablishmentFormData,
  WorkEntryFormData,
  PlanningInvitation,
  PlanningViewer,
  SharedPlanning,
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

// ============ LIVE PLANNING SHARING ============

function getUserLabel(): { displayName: string; email: string } {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return {
    displayName: user.displayName || user.email?.split('@')[0] || 'Utilisateur',
    email: user.email || '',
  };
}

function generateToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, '0')).join('');
}

export async function getPlanningInvitation(): Promise<PlanningInvitation | null> {
  const uid = getUserId();
  const ref = doc(db, 'users', uid, 'planningShare', 'main');
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  const invitation = await getPlanningInvitationByToken(snapshot.data().token);
  return invitation?.active ? invitation : null;
}

export async function getPlanningInvitationByToken(token: string): Promise<PlanningInvitation | null> {
  const snapshot = await getDoc(doc(db, 'planningInvitations', token));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return { ...data, createdAt: toDate(data.createdAt) } as PlanningInvitation;
}

export async function createPlanningInvitation(): Promise<PlanningInvitation> {
  const uid = getUserId();
  const { displayName, email } = getUserLabel();
  const existing = await getPlanningInvitation();
  if (existing) return existing;

  const token = generateToken();
  const createdAt = Timestamp.now();
  const invitation = {
    token,
    ownerId: uid,
    ownerName: displayName || email,
    active: true,
    createdAt,
  };
  const batch = writeBatch(db);
  batch.set(doc(db, 'planningInvitations', token), invitation);
  batch.set(doc(db, 'users', uid, 'planningShare', 'main'), { token, createdAt });
  await batch.commit();
  return { ...invitation, createdAt: createdAt.toDate() };
}

export async function disablePlanningInvitation(token: string): Promise<void> {
  const uid = getUserId();
  const batch = writeBatch(db);
  batch.update(doc(db, 'planningInvitations', token), { active: false });
  batch.delete(doc(db, 'users', uid, 'planningShare', 'main'));
  await batch.commit();
}

export async function acceptPlanningInvitation(token: string): Promise<SharedPlanning> {
  const uid = getUserId();
  const invitation = await getPlanningInvitationByToken(token);
  if (!invitation || !invitation.active) throw new Error('INVITATION_INVALID');
  if (invitation.ownerId === uid) throw new Error('OWN_INVITATION');

  const { displayName, email } = getUserLabel();
  const createdAt = Timestamp.now();
  const access = {
    userId: uid,
    displayName,
    email,
    invitationToken: token,
    active: true,
    createdAt,
  };
  const saved = {
    ownerId: invitation.ownerId,
    ownerName: invitation.ownerName,
    invitationToken: token,
    active: true,
    createdAt,
  };
  const batch = writeBatch(db);
  batch.set(doc(db, 'shareAccess', invitation.ownerId, 'viewers', uid), access);
  batch.set(doc(db, 'users', uid, 'sharedPlannings', invitation.ownerId), saved);
  await batch.commit();
  return { ...saved, createdAt: createdAt.toDate() };
}

export async function getPlanningViewers(): Promise<PlanningViewer[]> {
  const uid = getUserId();
  const snapshot = await getDocs(collection(db, 'shareAccess', uid, 'viewers'));
  return snapshot.docs.map((item) => {
    const data = item.data();
    return { ...data, userId: item.id, createdAt: toDate(data.createdAt) } as PlanningViewer;
  });
}

export async function revokePlanningViewer(viewerId: string): Promise<void> {
  const ownerId = getUserId();
  await deleteDoc(doc(db, 'shareAccess', ownerId, 'viewers', viewerId));
}

export async function getSharedPlannings(): Promise<SharedPlanning[]> {
  const uid = getUserId();
  const snapshot = await getDocs(collection(db, 'users', uid, 'sharedPlannings'));
  return snapshot.docs.map((item) => {
    const data = item.data();
    return { ...data, ownerId: item.id, createdAt: toDate(data.createdAt) } as SharedPlanning;
  });
}

export async function leaveSharedPlanning(ownerId: string): Promise<void> {
  const uid = getUserId();
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', uid, 'sharedPlannings', ownerId));
  batch.delete(doc(db, 'shareAccess', ownerId, 'viewers', uid));
  await batch.commit();
}

export function subscribeToSharedWorkEntries(
  ownerId: string,
  month: string,
  onData: (entries: WorkEntry[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const collRef = collection(db, 'users', ownerId, 'workEntries');
  const q = query(
    collRef,
    where('date', '>=', `${month}-01`),
    where('date', '<=', `${month}-31`),
    orderBy('date', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    onData(snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as WorkEntry;
    }));
  }, (error) => onError(error));
}
