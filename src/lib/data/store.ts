import bcrypt from 'bcryptjs';
import { UserRole } from '@/types';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  patientId?: string;
  pin?: string;
  createdAt: string;
}

export interface PatientRecord {
  id: string;
  fullName: string;
  dob: string;
  age: number;
  gender: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalConditions: string[];
  allergies: string[];
  pin: string;
  adherenceRate: number;
  caretakerUserId?: string;
  createdAt: string;
}

export interface MedicationRecord {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  form: string;
  schedule: string;
  mealInstruction: string;
  status: 'PENDING' | 'TAKEN' | 'SKIPPED';
  statusText: string;
  takenAt?: string;
  skipReason?: string;
  createdAt: string;
}

export interface AppointmentRecord {
  id: string;
  patientId: string;
  doctorName: string;
  clinic: string;
  scheduledAt: string;
  visitType: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  createdAt: string;
}

export interface AssistanceRecord {
  id: string;
  patientId: string;
  patientName: string;
  type: 'EMERGENCY_SOS' | 'MEDICATION_HELP' | 'REFILL_REQUEST';
  message: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
}

export interface EncouragementRecord {
  id: string;
  patientId: string;
  fromName: string;
  message: string;
  sentAt: string;
}

export interface AuditRecord {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  timestamp: string;
  details: string;
}

// Global In-Memory Store ensuring fast, responsive, zero-latency real-time collaboration
class DataStore {
  private users: Map<string, UserAccount> = new Map();
  private patients: Map<string, PatientRecord> = new Map();
  private medications: Map<string, MedicationRecord> = new Map();
  private appointments: Map<string, AppointmentRecord> = new Map();
  private assistanceRequests: Map<string, AssistanceRecord> = new Map();
  private encouragements: Map<string, EncouragementRecord> = new Map();
  private auditLogs: AuditRecord[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // Default Admin
    const adminPassHash = bcrypt.hashSync('password123', 10);
    const adminId = '00000000-0000-0000-0000-000000000001';
    this.users.set('admin@medicareconnect.com', {
      id: adminId,
      email: 'admin@medicareconnect.com',
      passwordHash: adminPassHash,
      fullName: 'System Administrator',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
    });

    this.logAudit('System', 'SYSTEM', 'INITIALIZATION', 'PLATFORM', 'Healthcare platform data store initialized.');
  }

  // --- USER AUTHENTICATION & MANAGEMENT ---
  public registerUser(user: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    patientId?: string;
    pin?: string;
  }): UserAccount {
    const cleanEmail = user.email.trim().toLowerCase();
    const existing = this.users.get(cleanEmail);
    if (existing) {
      // Update details if re-registering
      existing.fullName = user.fullName.trim();
      existing.passwordHash = bcrypt.hashSync(user.password, 10);
      existing.role = user.role;
      if (user.patientId) existing.patientId = user.patientId;
      if (user.pin) existing.pin = user.pin;
      this.logAudit(existing.fullName, user.role, 'USER_UPDATED', cleanEmail, `Account credentials updated for ${cleanEmail}`);
      return existing;
    }

    const id = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(user.password, 10);
    const account: UserAccount = {
      id,
      email: cleanEmail,
      passwordHash,
      fullName: user.fullName.trim(),
      role: user.role,
      patientId: user.patientId,
      pin: user.pin,
      createdAt: new Date().toISOString(),
    };

    this.users.set(cleanEmail, account);
    this.logAudit(account.fullName, user.role, 'USER_REGISTERED', cleanEmail, `New ${user.role} account created.`);
    return account;
  }

  public getUserByEmail(email: string): UserAccount | undefined {
    return this.users.get(email.trim().toLowerCase());
  }

  public getUserById(id: string): UserAccount | undefined {
    for (const u of this.users.values()) {
      if (u.id === id) return u;
    }
    return undefined;
  }

  public verifyUserCredentials(email: string, password: string): UserAccount | null {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    const match = bcrypt.compareSync(password, user.passwordHash);
    if (match) return user;
    return null;
  }

  public getAllUsers(): UserAccount[] {
    return Array.from(this.users.values());
  }

  // --- PATIENTS ---
  public addPatient(patient: {
    fullName: string;
    dob: string;
    gender: string;
    bloodGroup?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    medicalConditions: string[];
    allergies: string[];
    pin?: string;
    caretakerUserId?: string;
  }): PatientRecord {
    const id = crypto.randomUUID();
    const birthYear = new Date(patient.dob).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = isNaN(birthYear) ? 75 : Math.max(0, currentYear - birthYear);

    const record: PatientRecord = {
      id,
      fullName: patient.fullName.trim(),
      dob: patient.dob,
      age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup || 'O+',
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      medicalConditions: patient.medicalConditions,
      allergies: patient.allergies,
      pin: patient.pin || '1234',
      adherenceRate: 100,
      caretakerUserId: patient.caretakerUserId,
      createdAt: new Date().toISOString(),
    };

    this.patients.set(id, record);
    this.logAudit(
      patient.caretakerUserId ? `Caretaker (${patient.caretakerUserId})` : 'System',
      'CARETAKER',
      'PATIENT_REGISTERED',
      record.fullName,
      `Registered new patient ${record.fullName} (Age ${age})`
    );
    return record;
  }

  public getPatients(caretakerUserId?: string): PatientRecord[] {
    const all = Array.from(this.patients.values());
    if (!caretakerUserId) return all;
    // Return all patients or assigned patients
    const assigned = all.filter((p) => !p.caretakerUserId || p.caretakerUserId === caretakerUserId);
    return assigned.length > 0 ? assigned : all;
  }

  public getPatientById(id: string): PatientRecord | undefined {
    return this.patients.get(id);
  }

  public getPatientByPin(pin: string): PatientRecord | undefined {
    for (const p of this.patients.values()) {
      if (p.pin === pin) return p;
    }
    return undefined;
  }

  // --- MEDICATIONS ---
  public addMedication(med: {
    patientId: string;
    name: string;
    dosage: string;
    form: string;
    schedule: string;
    mealInstruction?: string;
  }): MedicationRecord {
    const id = crypto.randomUUID();
    const record: MedicationRecord = {
      id,
      patientId: med.patientId,
      name: med.name.trim(),
      dosage: med.dosage.trim(),
      form: med.form || 'Tablet',
      schedule: med.schedule || 'Morning, 8:00 AM',
      mealInstruction: med.mealInstruction || 'Take with water after meal',
      status: 'PENDING',
      statusText: `Scheduled: ${med.schedule || 'Today'}`,
      createdAt: new Date().toISOString(),
    };

    this.medications.set(id, record);
    this.recalculateAdherence(med.patientId);

    const patient = this.getPatientById(med.patientId);
    this.logAudit(
      'Caretaker',
      'CARETAKER',
      'MEDICATION_PRESCRIBED',
      patient?.fullName || med.patientId,
      `Prescribed ${record.name} ${record.dosage} (${record.schedule})`
    );
    return record;
  }

  public getMedications(patientId: string): MedicationRecord[] {
    return Array.from(this.medications.values()).filter((m) => m.patientId === patientId);
  }

  public updateMedicationStatus(
    medicationId: string,
    status: 'TAKEN' | 'SKIPPED' | 'PENDING',
    skipReason?: string
  ): MedicationRecord | null {
    const med = this.medications.get(medicationId);
    if (!med) return null;

    med.status = status;
    if (status === 'TAKEN') {
      med.takenAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      med.statusText = `Taken at ${med.takenAt}`;
      med.skipReason = undefined;
    } else if (status === 'SKIPPED') {
      med.takenAt = undefined;
      med.skipReason = skipReason || 'Patient omitted dose';
      med.statusText = `Skipped: ${med.skipReason}`;
    } else {
      med.takenAt = undefined;
      med.skipReason = undefined;
      med.statusText = `Scheduled: ${med.schedule}`;
    }

    this.recalculateAdherence(med.patientId);
    const patient = this.getPatientById(med.patientId);
    this.logAudit(
      patient?.fullName || 'Patient',
      'PATIENT',
      status === 'TAKEN' ? 'DOSE_CONFIRMED' : 'DOSE_SKIPPED',
      med.name,
      status === 'TAKEN' ? `Confirmed taken at ${med.takenAt}` : `Skipped reason: ${skipReason}`
    );
    return med;
  }

  private recalculateAdherence(patientId: string) {
    const meds = this.getMedications(patientId);
    if (meds.length === 0) return;
    const taken = meds.filter((m) => m.status === 'TAKEN').length;
    const totalDecided = meds.filter((m) => m.status === 'TAKEN' || m.status === 'SKIPPED').length;
    const patient = this.patients.get(patientId);
    if (patient) {
      patient.adherenceRate = totalDecided === 0 ? 100 : Math.round((taken / totalDecided) * 100);
    }
  }

  // --- APPOINTMENTS ---
  public addAppointment(appt: {
    patientId: string;
    doctorName: string;
    clinic: string;
    scheduledAt: string;
    visitType?: string;
    notes?: string;
  }): AppointmentRecord {
    const id = crypto.randomUUID();
    const record: AppointmentRecord = {
      id,
      patientId: appt.patientId,
      doctorName: appt.doctorName.trim(),
      clinic: appt.clinic.trim(),
      scheduledAt: appt.scheduledAt,
      visitType: appt.visitType || 'Clinical Follow-up',
      status: 'CONFIRMED',
      notes: appt.notes,
      createdAt: new Date().toISOString(),
    };
    this.appointments.set(id, record);
    const patient = this.getPatientById(appt.patientId);
    this.logAudit(
      'Caretaker',
      'CARETAKER',
      'APPOINTMENT_SCHEDULED',
      patient?.fullName || appt.patientId,
      `Scheduled visit with ${record.doctorName} at ${record.clinic} for ${record.scheduledAt}`
    );
    return record;
  }

  public getAppointments(patientId: string): AppointmentRecord[] {
    return Array.from(this.appointments.values()).filter((a) => a.patientId === patientId);
  }

  // --- ASSISTANCE & SOS REQUESTS ---
  public createAssistanceRequest(req: {
    patientId: string;
    type: 'EMERGENCY_SOS' | 'MEDICATION_HELP' | 'REFILL_REQUEST';
    message: string;
  }): AssistanceRecord {
    const id = crypto.randomUUID();
    const patient = this.getPatientById(req.patientId);
    const patientName = patient?.fullName || 'Patient';
    const record: AssistanceRecord = {
      id,
      patientId: req.patientId,
      patientName,
      type: req.type,
      message: req.message,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    this.assistanceRequests.set(id, record);
    this.logAudit(
      patientName,
      'PATIENT',
      req.type === 'EMERGENCY_SOS' ? 'EMERGENCY_SOS_TRIGGERED' : 'ASSISTANCE_REQUESTED',
      patientName,
      req.message
    );
    return record;
  }

  public getAssistanceRequests(patientId?: string): AssistanceRecord[] {
    const all = Array.from(this.assistanceRequests.values());
    if (!patientId) return all;
    return all.filter((r) => r.patientId === patientId);
  }

  public resolveAssistanceRequest(id: string): AssistanceRecord | null {
    const req = this.assistanceRequests.get(id);
    if (!req) return null;
    req.status = 'RESOLVED';
    req.resolvedAt = new Date().toISOString();
    this.logAudit('Caretaker', 'CARETAKER', 'ASSISTANCE_RESOLVED', req.patientName, `Resolved: ${req.message}`);
    return req;
  }

  // --- ENCOURAGEMENTS ---
  public sendEncouragement(msg: {
    patientId: string;
    fromName: string;
    message: string;
  }): EncouragementRecord {
    const id = crypto.randomUUID();
    const record: EncouragementRecord = {
      id,
      patientId: msg.patientId,
      fromName: msg.fromName.trim(),
      message: msg.message.trim(),
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.encouragements.set(id, record);
    this.logAudit(
      record.fromName,
      'FAMILY',
      'ENCOURAGEMENT_SENT',
      msg.patientId,
      `Sent: "${record.message}"`
    );
    return record;
  }

  public getEncouragements(patientId: string): EncouragementRecord[] {
    return Array.from(this.encouragements.values()).filter((e) => e.patientId === patientId);
  }

  // --- AUDIT TRAIL ---
  public logAudit(actor: string, role: string, action: string, target: string, details: string) {
    const record: AuditRecord = {
      id: crypto.randomUUID(),
      actor,
      role,
      action,
      target,
      timestamp: new Date().toISOString(),
      details,
    };
    this.auditLogs.unshift(record);
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  public getAuditLogs(limit: number = 50): AuditRecord[] {
    return this.auditLogs.slice(0, limit);
  }
}

// Global Singleton
const globalForStore = globalThis as unknown as { __dataStoreInstance?: DataStore };
export const dataStore = globalForStore.__dataStoreInstance || new DataStore();
if (process.env.NODE_ENV !== 'production') {
  globalForStore.__dataStoreInstance = dataStore;
}
