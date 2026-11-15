import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

console.log("=================================================");
console.log(" MediCare Connect - Migration Static Verification");
console.log("=================================================\n");

const expectedMigrations = [
  "001_create_core_tables.sql",
  "002_create_relationships_and_indexes.sql",
  "003_create_authorization_helpers.sql",
  "004_enable_rls_and_create_policies.sql",
  "005_create_triggers_and_state_validation.sql",
  "006_create_secure_rpc_functions.sql",
  "007_create_notification_foundation.sql",
  "008_add_audit_constraints_and_permissions.sql",
  "009_seed_baseline_data.sql",
];

const requiredTables = [
  "users",
  "patient_profiles",
  "patient_access",
  "medications",
  "medication_logs",
  "appointments",
  "healthcare_routines",
  "routine_logs",
  "assistance_requests",
  "notifications",
  "activity_logs",
];

let allPassed = true;

// 1. Verify all migration files exist
console.log("Checking migration files presence:");
expectedMigrations.forEach((file) => {
  const filePath = path.join(MIGRATIONS_DIR, file);
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    console.log(`  [OK] ${file} (${stat.size} bytes)`);
  } else {
    console.error(`  [FAIL] Missing migration file: ${file}`);
    allPassed = false;
  }
});

// 2. Read combined migrations
let combinedSQL = "";
expectedMigrations.forEach((file) => {
  const filePath = path.join(MIGRATIONS_DIR, file);
  if (fs.existsSync(filePath)) {
    combinedSQL += fs.readFileSync(filePath, "utf-8") + "\n";
  }
});

// 3. Verify all 11 tables are defined
console.log("\nVerifying 11 Relational Tables:");
requiredTables.forEach((table) => {
  const regex = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}`, "i");
  if (regex.test(combinedSQL)) {
    console.log(`  [OK] Table defined: public.${table}`);
  } else {
    console.error(`  [FAIL] Missing table definition: public.${table}`);
    allPassed = false;
  }
});

// 4. Verify RLS is enabled for all 11 tables
console.log("\nVerifying Row Level Security (RLS) Enablement:");
requiredTables.forEach((table) => {
  const regex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, "i");
  if (regex.test(combinedSQL)) {
    console.log(`  [OK] RLS enabled: public.${table}`);
  } else {
    console.error(`  [FAIL] RLS NOT enabled for: public.${table}`);
    allPassed = false;
  }
});

// 5. Verify Core Security Functions & Triggers
console.log("\nVerifying Core Security Procedures & Triggers:");
const requiredFunctions = [
  "public.is_admin",
  "public.has_patient_access",
  "public.patient_record_dose_kiosk",
  "public.record_failed_pin_attempt",
  "public.unlock_patient_passcode",
  "public.claim_notifications_batch",
  "public.retry_failed_notification",
  "public.validate_appointment_update",
  "public.validate_dose_log_update",
  "public.enforce_append_only_audit",
  "public.set_audit_actor_context",
  "public.on_patient_profile_created",
];

requiredFunctions.forEach((fn) => {
  const regex = new RegExp(`FUNCTION ${fn.replace(".", "\\.")}`, "i");
  if (regex.test(combinedSQL)) {
    console.log(`  [OK] Security Function Defined: ${fn}`);
  } else {
    console.error(`  [FAIL] Missing security function: ${fn}`);
    allPassed = false;
  }
});

// 6. Verify Search Path Security
console.log("\nVerifying SECURITY DEFINER Search Path Hardening:");
const secDefinerCount = (combinedSQL.match(/SECURITY DEFINER/gi) || []).length;
const searchPathCount = (combinedSQL.match(/SET search_path = public, pg_temp;/gi) || []).length;
console.log(`  SECURITY DEFINER instances: ${secDefinerCount}`);
console.log(`  Safe search_path statements: ${searchPathCount}`);
if (secDefinerCount === searchPathCount) {
  console.log("  [OK] All SECURITY DEFINER functions have search_path pinned!");
} else {
  console.warn("  [WARN] Mismatch between SECURITY DEFINER and search_path pinning!");
}

console.log("\n=================================================");
if (allPassed) {
  console.log(" Migration Static Verification: 100% PASSED!");
} else {
  console.error(" Migration Static Verification: FAILED!");
  process.exit(1);
}
console.log("=================================================");
