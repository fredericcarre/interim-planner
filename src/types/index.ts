// User settings stored in Firestore
export interface UserSettings {
  netCoefficient: number;
  currency: 'EUR';
}

// Establishment (employer/client)
export interface Establishment {
  id: string;
  name: string;
  defaultHourlyRate: number;
  defaultHours?: number;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Work entry (a day worked)
export interface WorkEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  establishmentId: string;
  establishmentNameSnapshot: string; // Snapshot at creation time
  hours: number;
  hourlyRate: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Form data for creating/editing work entry
export interface WorkEntryFormData {
  date: string;
  establishmentId: string;
  hours: number;
  hourlyRate: number;
  note?: string;
}

// Form data for creating/editing establishment
export interface EstablishmentFormData {
  name: string;
  defaultHourlyRate: number;
  defaultHours?: number;
  color?: string;
}

// Monthly summary
export interface MonthlySummary {
  totalHours: number;
  totalGross: number;
  totalNet: number;
  entriesCount: number;
}

// Auth user from Firebase
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Export data structure for GDPR
export interface UserExportData {
  exportDate: string;
  user: {
    uid: string;
    email: string | null;
  };
  settings: UserSettings | null;
  establishments: Establishment[];
  workEntries: WorkEntry[];
}
