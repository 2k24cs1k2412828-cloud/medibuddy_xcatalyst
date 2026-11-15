# MediCare Connect — Production Deployment & Runbook

## 1. Hosting Architecture Overview

MediCare Connect is designed for cloud deployment combining:
- **Next.js 15 (App Router)** hosted on **Vercel** (Serverless and Edge runtimes).
- **Supabase (PostgreSQL 15)** for database storage, Auth, and Row-Level Security.
- **Resend** for transactional email notifications.
- **External Scheduler** (e.g., cron-job.org or GitHub Actions) triggering periodic medication reminders.

- **Production Live URL**: [https://medibuddyxcatalyst.vercel.app/](https://medibuddyxcatalyst.vercel.app/)
- **GitHub Repository**: [https://github.com/2k24cs1k2412828-cloud/medibuddy_xcatalyst](https://github.com/2k24cs1k2412828-cloud/medibuddy_xcatalyst)

---

## 2. Environment Variables Checklist

Configure the following variables in **Vercel Project Settings -> Environment Variables**:

| Variable Name | Exposure Scope | Purpose | Format / Example |
|---|:---:|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client | Supabase project API gateway endpoint | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public / Client | Public anonymous key for client sessions | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only | Privileged secret key bypassing RLS for administrative RPCs | `eyJhbGciOi...` |
| `KIOSK_SESSION_SECRET` | Server-Only | 64-character high-entropy secret for HMAC kiosk tokens | High-entropy random string |
| `CRON_SECRET` | Server-Only | Bearer token authenticating reminder worker requests | High-entropy random string |
| `RESEND_API_KEY` | Server-Only | Resend API key for outbound transactional emails | `re_123456789...` |
| `RESEND_FROM_EMAIL` | Server-Only | Verified sender email address | `MediCare Connect <alerts@yourdomain.com>` |

> [!CAUTION]
> Never commit actual values for these variables to Git. Placeholders only are provided in [.env.example](file:///home/mayanksoni/Downloads/catalyst_medibuddy/.env.example).

---

## 3. Database Migration Runbook (Supabase)

Before launching the Next.js application, apply the SQL migrations in `supabase/migrations/` in numerical order via the Supabase SQL Editor:

1. `001_create_core_tables.sql` — Creates the 11 core tables (`users`, `patient_profiles`, `patient_access`, `medications`, `medication_logs`, `appointments`, `healthcare_routines`, `routine_logs`, `assistance_requests`, `notifications`, `activity_logs`).
2. `002_create_relationships_and_indexes.sql` — Configures foreign keys, cascading constraints, and performance indexes.
3. `003_create_authorization_helpers.sql` — Defines `is_admin()` and `has_patient_access()` helper functions.
4. `004_enable_rls_and_create_policies.sql` — Enables RLS and establishes granular role-based policies on every table.
5. `005_create_triggers_and_state_validation.sql` — Implements `enforce_append_only_audit` and dose status validation triggers.
6. `006_create_secure_rpc_functions.sql` — Installs `patient_record_dose_kiosk`, `record_failed_pin_attempt`, and `unlock_patient_passcode`.
7. `007_create_notification_foundation.sql` — Installs `claim_notifications_batch`, `complete_notification_delivery`, and `fail_notification_delivery`.
8. `008_add_audit_constraints_and_permissions.sql` — Configures `handle_new_auth_user` trigger linking `auth.users` to `public.users`.
9. `009_seed_baseline_data.sql` — *(Optional)* Seeds initial baseline synthetic patient and user fixtures for testing.

---

## 4. Scheduled Reminder Configuration

Medication and appointment reminders require periodic execution of the route handler:
`GET /api/cron/process-reminders`

> [!IMPORTANT]
> The **Vercel Hobby** plan supports only once-daily scheduled crons. For clinical medication reminders, an execution cadence of **every 5 minutes** (`*/5 * * * *`) is recommended.

### Setting Up a 5-Minute External Cron Worker
Using an external cron service (such as [cron-job.org](https://cron-job.org), **Zeplo**, or a scheduled **GitHub Actions workflow**):

- **Target URL**: `https://medibuddyxcatalyst.vercel.app/api/cron/process-reminders`
- **HTTP Method**: `GET` (or `POST`)
- **Schedule**: `*/5 * * * *` (Every 5 minutes)
- **Headers**:
  ```http
  Authorization: Bearer <YOUR_CRON_SECRET>
  User-Agent: MediCareConnect-Worker/1.0
  ```

---

## 5. Post-Deployment Verification Checklist

After deploying a new release to production, execute the following checks:

```bash
# 1. Verify HTTP Security Headers
curl -I https://medibuddyxcatalyst.vercel.app/
# Expect:
#   x-frame-options: DENY
#   x-content-type-options: nosniff
#   content-security-policy: default-src 'self'...

# 2. Verify Robots Configuration
curl -s https://medibuddyxcatalyst.vercel.app/robots.txt
# Expect:
#   Disallow: /admin/
#   Disallow: /caretaker/
#   Disallow: /family/
#   Disallow: /patient/
#   Disallow: /api/

# 3. Verify Public Sitemap
curl -s https://medibuddyxcatalyst.vercel.app/sitemap.xml
# Expect valid XML listing public URLs only (/ and /login)

# 4. Verify Cron Route Protection
curl -I https://medibuddyxcatalyst.vercel.app/api/cron/process-reminders
# Expect: HTTP 401 Unauthorized (when called without Bearer token)
```

---

## 6. Secret Rotation Procedure

1. **`CRON_SECRET`**:
   - Generate a new high-entropy string (`openssl rand -hex 32`).
   - Update `CRON_SECRET` in Vercel Project Settings.
   - Update the Bearer token in your external cron service.
   - Trigger a manual deployment in Vercel to load the new environment variable.
2. **`KIOSK_SESSION_SECRET`**:
   - Rotating this secret invalidates all active kiosk sessions immediately.
   - Update `KIOSK_SESSION_SECRET` in Vercel and redeploy.
   - Patient tablets will prompt for PIN re-entry on their next action.
