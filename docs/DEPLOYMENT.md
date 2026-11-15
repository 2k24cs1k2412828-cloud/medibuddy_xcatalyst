# MediCare Connect — Production Deployment Guide

## 1. Hosting Architecture Overview

MediCare Connect is optimized for production hosting on **Vercel** (Next.js 15 App Router Edge/Serverless runtime) paired with a managed **Supabase (PostgreSQL 15)** database backend and **Resend** transactional email infrastructure.

- **Production Live URL**: `https://medibuddyxcatalyst.vercel.app/`
- **GitHub Repository**: `https://github.com/2k24cs1k2412828-cloud/medibuddy_xcatalyst`

---

## 2. Environment Variables Checklist

Configure the following variables in **Vercel Project Settings -> Environment Variables**:

| Variable Name | Required Scope | Purpose | Example / Format |
|---|:---:|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production & Preview | Supabase project API gateway | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production & Preview | Supabase public anonymous API key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Only | Server-only key for privileged operations | `eyJhbGciOi...` |
| `KIOSK_SESSION_SECRET` | Production Only | 64-character high-entropy secret for HMAC session signing | Hex/Base64 string |
| `CRON_SECRET` | Production Only | Bearer token authenticating notification worker requests | High-entropy string |
| `RESEND_API_KEY` | Production Only | Resend API key for outbound emails | `re_123456789...` |
| `RESEND_FROM_EMAIL` | Production Only | Verified sender email address | `alerts@yourdomain.com` |

---

## 3. Database Migration Setup (Supabase)

Before launching the Next.js frontend, execute the database migrations in order:

1. Open your Supabase project dashboard -> **SQL Editor**.
2. Run the numbered migrations from `supabase/migrations/`:
   - `001_create_core_tables.sql`
   - `002_create_relationships_and_indexes.sql`
   - `003_create_authorization_helpers.sql`
   - `004_enable_rls_and_create_policies.sql`
   - `005_create_triggers_and_state_validation.sql`
   - `006_create_secure_rpc_functions.sql`
   - `007_create_notification_foundation.sql`
   - `008_add_audit_constraints_and_permissions.sql`
   - `009_seed_baseline_data.sql` *(optional seed data)*

---

## 4. Medication Reminder Scheduler Setup

Medication reminders require periodic triggering of `/api/cron/process-reminders`.

> [!IMPORTANT]
> The **Vercel Hobby** plan supports only daily scheduled cron jobs. For clinical medication reminders, an execution cadence of **every 5 minutes** is recommended.

### Setting Up a 5-Minute External Cron Worker

Use an external scheduler service (e.g., [cron-job.org](https://cron-job.org), **Zeplo**, or **GitHub Actions Scheduled Workflows**):

- **Target URL**: `https://medibuddyxcatalyst.vercel.app/api/cron/process-reminders`
- **HTTP Method**: `GET`
- **Schedule**: `*/5 * * * *` (Every 5 minutes)
- **HTTP Headers**:
  ```http
  Authorization: Bearer <YOUR_CRON_SECRET>
  User-Agent: MediCareConnect-Worker/1.0
  ```

---

## 5. Post-Deployment Verification Checklist

After deploying a new release, verify the following endpoints:

- [ ] **HTTP Headers**: Run `curl -I https://medibuddyxcatalyst.vercel.app/` and verify `x-frame-options: DENY`, `x-content-type-options: nosniff`, and `content-security-policy` are returned.
- [ ] **Robots Exclusion**: Verify `curl https://medibuddyxcatalyst.vercel.app/robots.txt` blocks `/admin/`, `/caretaker/`, `/family/`, `/patient/`.
- [ ] **Sitemap Validity**: Verify `curl https://medibuddyxcatalyst.vercel.app/sitemap.xml` returns valid XML.
- [ ] **Kiosk Access**: Navigate to `/login` -> switch to **Kiosk PIN** -> authenticate with PIN `1234` -> verify redirection to `/patient`.
- [ ] **Cron Authentication**: Verify `curl https://medibuddyxcatalyst.vercel.app/api/cron/process-reminders` returns `401 Unauthorized` without credentials.
