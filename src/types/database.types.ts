export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          role: 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          role?: 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          role?: 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      patient_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          dob: string;
          gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
          blood_group: string | null;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          medical_conditions: string[];
          allergies: string[];
          passcode_hash: string | null;
          failed_passcode_attempts: number;
          passcode_locked_until: string | null;
          last_failed_attempt_at: string | null;
          status: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          dob: string;
          gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
          blood_group?: string | null;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          medical_conditions?: string[];
          allergies?: string[];
          passcode_hash?: string | null;
          failed_passcode_attempts?: number;
          passcode_locked_until?: string | null;
          last_failed_attempt_at?: string | null;
          status?: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          dob?: string;
          gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
          blood_group?: string | null;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          medical_conditions?: string[];
          allergies?: string[];
          passcode_hash?: string | null;
          failed_passcode_attempts?: number;
          passcode_locked_until?: string | null;
          last_failed_attempt_at?: string | null;
          status?: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
        };
      };
      patient_access: {
        Row: {
          id: string;
          patient_id: string;
          user_id: string;
          relationship: 'PRIMARY_CARETAKER' | 'CARETAKER' | 'FAMILY' | 'DOCTOR' | 'SELF';
          permissions: {
            is_primary_caregiver?: boolean;
            can_manage_medications?: boolean;
            can_manage_appointments?: boolean;
            can_manage_routines?: boolean;
            can_resolve_assistance?: boolean;
            can_manage_access?: boolean;
            can_edit_profile?: boolean;
            can_manage_notifications?: boolean;
            can_view_audit?: boolean;
          };
          status: 'ACTIVE' | 'PENDING' | 'REVOKED';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          user_id: string;
          relationship?: 'PRIMARY_CARETAKER' | 'CARETAKER' | 'FAMILY' | 'DOCTOR' | 'SELF';
          permissions?: Json;
          status?: 'ACTIVE' | 'PENDING' | 'REVOKED';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          user_id?: string;
          relationship?: 'PRIMARY_CARETAKER' | 'CARETAKER' | 'FAMILY' | 'DOCTOR' | 'SELF';
          permissions?: Json;
          status?: 'ACTIVE' | 'PENDING' | 'REVOKED';
          created_at?: string;
          updated_at?: string;
        };
      };
      medications: {
        Row: {
          id: string;
          patient_id: string;
          name: string;
          generic_name: string | null;
          dosage: string;
          form: 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'INHALER' | 'DROPS' | 'PATCH' | 'OTHER';
          instructions: string | null;
          frequency_type: 'DAILY' | 'INTERVAL_DAYS' | 'SPECIFIC_WEEKDAYS' | 'AS_NEEDED_PRN';
          frequency_config: Json;
          reminder_times: string[];
          timezone: string;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          name: string;
          generic_name?: string | null;
          dosage: string;
          form?: 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'INHALER' | 'DROPS' | 'PATCH' | 'OTHER';
          instructions?: string | null;
          frequency_type?: 'DAILY' | 'INTERVAL_DAYS' | 'SPECIFIC_WEEKDAYS' | 'AS_NEEDED_PRN';
          frequency_config?: Json;
          reminder_times?: Json;
          timezone?: string;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          name?: string;
          generic_name?: string | null;
          dosage?: string;
          form?: 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'INHALER' | 'DROPS' | 'PATCH' | 'OTHER';
          instructions?: string | null;
          frequency_type?: 'DAILY' | 'INTERVAL_DAYS' | 'SPECIFIC_WEEKDAYS' | 'AS_NEEDED_PRN';
          frequency_config?: Json;
          reminder_times?: Json;
          timezone?: string;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      medication_logs: {
        Row: {
          id: string;
          medication_id: string;
          patient_id: string;
          dose_event_id: string;
          scheduled_time: string;
          actual_action_time: string | null;
          status: 'PENDING' | 'TAKEN' | 'MISSED' | 'SKIPPED';
          skip_reason: string | null;
          notes: string | null;
          recorded_by: string | null;
          recorded_by_role: 'PATIENT' | 'CARETAKER' | 'FAMILY' | 'SYSTEM';
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          medication_id: string;
          patient_id: string;
          dose_event_id: string;
          scheduled_time: string;
          actual_action_time?: string | null;
          status?: 'PENDING' | 'TAKEN' | 'MISSED' | 'SKIPPED';
          skip_reason?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          recorded_by_role?: 'PATIENT' | 'CARETAKER' | 'FAMILY' | 'SYSTEM';
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          medication_id?: string;
          patient_id?: string;
          dose_event_id?: string;
          scheduled_time?: string;
          actual_action_time?: string | null;
          status?: 'PENDING' | 'TAKEN' | 'MISSED' | 'SKIPPED';
          skip_reason?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          recorded_by_role?: 'PATIENT' | 'CARETAKER' | 'FAMILY' | 'SYSTEM';
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          title: string;
          doctor_name: string;
          specialty: string | null;
          clinic_hospital: string;
          location_address: string | null;
          appointment_date: string;
          instructions: string | null;
          status: 'SCHEDULED' | 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED';
          assistance_requested: boolean;
          patient_notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          title: string;
          doctor_name: string;
          specialty?: string | null;
          clinic_hospital: string;
          location_address?: string | null;
          appointment_date: string;
          instructions?: string | null;
          status?: 'SCHEDULED' | 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED';
          assistance_requested?: boolean;
          patient_notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          title?: string;
          doctor_name?: string;
          specialty?: string | null;
          clinic_hospital?: string;
          location_address?: string | null;
          appointment_date?: string;
          instructions?: string | null;
          status?: 'SCHEDULED' | 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED';
          assistance_requested?: boolean;
          patient_notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      healthcare_routines: {
        Row: {
          id: string;
          patient_id: string;
          title: string;
          description: string | null;
          category: 'HYDRATION' | 'EXERCISE' | 'DIET' | 'WELLNESS' | 'CUSTOM';
          target_time: string | null;
          frequency: 'DAILY' | 'WEEKDAYS' | 'WEEKENDS' | 'AS_NEEDED';
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          title: string;
          description?: string | null;
          category?: 'HYDRATION' | 'EXERCISE' | 'DIET' | 'WELLNESS' | 'CUSTOM';
          target_time?: string | null;
          frequency?: 'DAILY' | 'WEEKDAYS' | 'WEEKENDS' | 'AS_NEEDED';
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          title?: string;
          description?: string | null;
          category?: 'HYDRATION' | 'EXERCISE' | 'DIET' | 'WELLNESS' | 'CUSTOM';
          target_time?: string | null;
          frequency?: 'DAILY' | 'WEEKDAYS' | 'WEEKENDS' | 'AS_NEEDED';
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
      };
      routine_logs: {
        Row: {
          id: string;
          routine_id: string;
          patient_id: string;
          log_date: string;
          completed: boolean;
          completed_at: string | null;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          routine_id: string;
          patient_id: string;
          log_date?: string;
          completed?: boolean;
          completed_at?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          routine_id?: string;
          patient_id?: string;
          log_date?: string;
          completed?: boolean;
          completed_at?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
      };
      assistance_requests: {
        Row: {
          id: string;
          patient_id: string;
          category: 'MEDICATION_CLARIFICATION' | 'UNAVAILABLE_MEDICINE' | 'APPOINTMENT_HELP' | 'SCHEDULE_CHANGE' | 'EMERGENCY_HELP' | 'GENERAL_CARE';
          urgency: 'NORMAL' | 'URGENT';
          message: string;
          status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
          resolution_notes: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          category?: 'MEDICATION_CLARIFICATION' | 'UNAVAILABLE_MEDICINE' | 'APPOINTMENT_HELP' | 'SCHEDULE_CHANGE' | 'EMERGENCY_HELP' | 'GENERAL_CARE';
          urgency?: 'NORMAL' | 'URGENT';
          message: string;
          status?: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
          resolution_notes?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          category?: 'MEDICATION_CLARIFICATION' | 'UNAVAILABLE_MEDICINE' | 'APPOINTMENT_HELP' | 'SCHEDULE_CHANGE' | 'EMERGENCY_HELP' | 'GENERAL_CARE';
          urgency?: 'NORMAL' | 'URGENT';
          message?: string;
          status?: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
          resolution_notes?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          event_identifier: string;
          external_id: string | null;
          recipient_email: string;
          recipient_id: string | null;
          patient_id: string;
          notification_type: 'UPCOMING_DOSE' | 'MISSED_DOSE' | 'APPOINTMENT_REMINDER' | 'ASSISTANCE_ALERT' | 'SCHEDULE_CHANGE';
          subject: string;
          message_snippet: string | null;
          status: 'PENDING' | 'CLAIMED' | 'SENT' | 'FAILED';
          claimed_by: string | null;
          claimed_at: string | null;
          lease_expires_at: string | null;
          delivery_attempts: number;
          max_attempts: number;
          next_retry_at: string | null;
          error_log: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_identifier: string;
          external_id?: string | null;
          recipient_email: string;
          recipient_id?: string | null;
          patient_id: string;
          notification_type: 'UPCOMING_DOSE' | 'MISSED_DOSE' | 'APPOINTMENT_REMINDER' | 'ASSISTANCE_ALERT' | 'SCHEDULE_CHANGE';
          subject: string;
          message_snippet?: string | null;
          status?: 'PENDING' | 'CLAIMED' | 'SENT' | 'FAILED';
          claimed_by?: string | null;
          claimed_at?: string | null;
          lease_expires_at?: string | null;
          delivery_attempts?: number;
          max_attempts?: number;
          next_retry_at?: string | null;
          error_log?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_identifier?: string;
          external_id?: string | null;
          recipient_email?: string;
          recipient_id?: string | null;
          patient_id?: string;
          notification_type?: 'UPCOMING_DOSE' | 'MISSED_DOSE' | 'APPOINTMENT_REMINDER' | 'ASSISTANCE_ALERT' | 'SCHEDULE_CHANGE';
          subject?: string;
          message_snippet?: string | null;
          status?: 'PENDING' | 'CLAIMED' | 'SENT' | 'FAILED';
          claimed_by?: string | null;
          claimed_at?: string | null;
          lease_expires_at?: string | null;
          delivery_attempts?: number;
          max_attempts?: number;
          next_retry_at?: string | null;
          error_log?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          actor_type: 'USER' | 'PATIENT' | 'SYSTEM';
          actor_user_id: string | null;
          actor_patient_id: string | null;
          actor_name: string;
          actor_role: 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT' | 'SYSTEM';
          patient_id: string;
          entity_type: 'MEDICATION' | 'DOSE' | 'APPOINTMENT' | 'ROUTINE' | 'ASSISTANCE' | 'ACCESS' | 'AUTH' | 'NOTIFICATION';
          entity_id: string;
          action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'AUTH_ATTEMPT' | 'LOCKOUT' | 'PASSCODE_RESET' | 'MANUAL_RETRY';
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_type?: 'USER' | 'PATIENT' | 'SYSTEM';
          actor_user_id?: string | null;
          actor_patient_id?: string | null;
          actor_name?: string;
          actor_role?: 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT' | 'SYSTEM';
          patient_id: string;
          entity_type: 'MEDICATION' | 'DOSE' | 'APPOINTMENT' | 'ROUTINE' | 'ASSISTANCE' | 'ACCESS' | 'AUTH' | 'NOTIFICATION';
          entity_id: string;
          action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'AUTH_ATTEMPT' | 'LOCKOUT' | 'PASSCODE_RESET' | 'MANUAL_RETRY';
          details?: Json;
          created_at?: string;
        };
        Update: {
          // Updates are forbidden by trigger and RLS
          never?: never;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      has_patient_access: {
        Args: {
          p_patient_id: string;
          p_permission: string;
        };
        Returns: boolean;
      };
      patient_record_dose_kiosk: {
        Args: {
          p_patient_id: string;
          p_dose_log_id: string;
          p_status: string;
          p_skip_reason?: string | null;
          p_notes?: string | null;
        };
        Returns: boolean;
      };
      retry_failed_notification: {
        Args: {
          p_notification_id: string;
        };
        Returns: boolean;
      };
      unlock_patient_passcode: {
        Args: {
          p_patient_id: string;
        };
        Returns: boolean;
      };
      record_failed_pin_attempt: {
        Args: {
          p_patient_id: string;
        };
        Returns: Json;
      };
      claim_notifications_batch: {
        Args: {
          p_worker_id: string;
          p_limit?: number;
        };
        Returns: Database['public']['Tables']['notifications']['Row'][];
      };
    };
  };
}
