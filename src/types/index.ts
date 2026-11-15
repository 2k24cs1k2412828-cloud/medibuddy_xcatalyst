// Core User Roles
export type UserRole = 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT';

// Navigation Item
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string | number;
  description?: string;
}

// Stat Card Metric
export interface StatCardMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

// Medication Preview Model
export interface MedicationPreview {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  timeSlot: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'As Needed';
  time: string;
  status: 'PENDING' | 'TAKEN' | 'MISSED' | 'SKIPPED';
  withFood: boolean;
}

// Appointment Preview Model
export interface AppointmentPreview {
  id: string;
  doctorName: string;
  specialty: string;
  clinicHospital: string;
  date: string;
  time: string;
  status: 'SCHEDULED' | 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED';
  isTelehealth?: boolean;
}

// Daily Routine Preview Model
export interface RoutinePreview {
  id: string;
  title: string;
  category: 'HYDRATION' | 'EXERCISE' | 'DIET' | 'WELLNESS';
  targetTime: string;
  isCompleted: boolean;
}

// Assistance Request Preview Model
export interface AssistanceRequestPreview {
  id: string;
  patientName: string;
  category: 'MEDICATION_CLARIFICATION' | 'UNAVAILABLE_MEDICINE' | 'APPOINTMENT_HELP' | 'EMERGENCY_HELP' | 'GENERAL_CARE';
  urgency: 'NORMAL' | 'URGENT';
  message: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
}

// Patient Profile Preview for Caretaker/Admin
export interface PatientProfilePreview {
  id: string;
  fullName: string;
  age: number;
  primaryCondition: string;
  todayAdherenceRate: number; // 0 - 100
  pendingDosesCount: number;
  openRequestsCount: number;
  nextDoseTime?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
}
