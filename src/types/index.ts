export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  RECORDS_OFFICER = 'records_officer',
  VIEWER = 'viewer',
}

export interface User {
  id: string;
  facilityId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Patient {
  id: string; // Patient ID / MRN
  facilityId: string;
  fullName: string;
  idNumber?: string;
  dateOfBirth?: string;
  age?: number;
  phoneNumber?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  consentCaptured: boolean;
  consentTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Admission {
  id: string;
  patientId: string;
  facilityId: string;
  admissionNumber: string;
  admittedAt: string;
  ward: string;
  gravida: number;
  para: number;
  gestationWeeks: number;
  edd?: string;
  obstetricHistory?: string;
  riskFactors?: string[];
  status: 'active' | 'discharged' | 'transferred';
  dischargedAt?: string;
}

export interface Referral {
  id: string;
  admissionId: string;
  patientId: string;
  facilityId: string; // Origin
  vicarialFacilityName: string; // Destination
  referralReason: string;
  clinicalSummary: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  transportMode: string;
  referredAt: string;
  referredBy: string;
  status: 'pending' | 'accepted' | 'completed';
}

export interface PartographEntry {
  id: string;
  admissionId: string;
  patientId: string;
  recordedAt: string;
  recordedBy: string;
  // Cervicogram
  cervicalDilation: number; // 0-10 cm
  fetalHeadDescent: number; // 0-5 fifths
  // FHR & Liquor
  fetalHeartRate: number;
  liquor: 'I' | 'C' | 'M1' | 'M2' | 'B' | 'A'; // Intact, Clear, Meconium, Blood, Absent
  moulding: 0 | 1 | 2 | 3;
  caput: 0 | 1 | 2 | 3;
  // Contractions (per 10 min)
  contractionsCount: number;
  contractionsDuration: number; // seconds
  contractionStrength: 'mild' | 'moderate' | 'strong';
  // Vitals
  systolicBP: number;
  diastolicBP: number;
  pulse: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSat: number;
  // Fluids/Meds
  oxytocinDose?: string;
  ivFluids?: string;
  medications?: string;
  urineVolume?: number;
  urineProtein?: string;
  urineGlucose?: string;
  urineKetones?: string;
  notes?: string;
  // Meta
  syncStatus?: 'pending' | 'synced' | 'failed';
}

export interface Delivery {
  id: string;
  admissionId: string;
  patientId?: string;
  facilityId: string;
  deliveryDateTime: string;
  deliveryType: string;
  outcome: string;
  bloodLoss: number;
  perineum: string;
  oxytocinGiven: boolean;
  notes?: string;
  recordedBy: string;
}

export interface Infant {
  id: string;
  motherId: string;
  admissionId: string;
  deliveryId?: string;
  fullName?: string;
  sex: 'Male' | 'Female' | 'Ambiguous';
  weight: number;
  recordedAt: string;
  apgar1: number;
  apgar5: number;
  apgar10?: number;
  resuscitationRequired: boolean;
  bcgGiven: boolean;
  polioGiven: boolean;
  vitaminKGiven: boolean;
  notes?: string;
}

export enum AlertLevel {
  WATCH = 'watch',
  ALERT = 'alert',
  EMERGENCY = 'emergency',
}

export interface ClinicalAlert {
  id: string;
  admissionId: string;
  type: string; // e.g. "Alert Line Breach"
  level: AlertLevel;
  message: string;
  recommendation: string;
  createdAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface HandoverRecord {
  id: string;
  facilityId: string;
  ward: string;
  outgoingNurseId: string;
  outgoingNurseName: string;
  incomingNurseName?: string;
  timestamp: string;
  criticalCases: {
    patientId: string;
    patientName: string;
    reason: string;
    status: 'stable' | 'unstable' | 'emergency';
  }[];
  generalNotes: string;
  suppliesAlert?: string;
  isAcknowledged: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  role: UserRole;
}

export interface SyncQueueItem {
  id: string;
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  localTimestamp: string;
  deviceId: string;
  retryCount: number;
  status: 'pending' | 'synced' | 'failed';
}
