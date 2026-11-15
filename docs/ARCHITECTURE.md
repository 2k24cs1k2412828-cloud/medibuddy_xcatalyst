# MediCare Connect — System Architecture & Technical Specifications

## 1. System Overview

**MediCare Connect** is a collaborative, accessible healthcare platform architected specifically for elderly care ecosystems. It bridges the critical communication and adherence gap between **Elderly Patients**, **Clinical Caretakers**, **Family Members**, and **Healthcare Administrators**.

The application is built on **Next.js 15 (App Router)** with **TypeScript**, powered by a hardened **Supabase (PostgreSQL 15)** database backend, and orchestrated with an automated **Resend transactional email & notification worker engine**.

---

## 2. Architectural Principles

1. **Defense-in-Depth Security**: Every sensitive mutation is verified at multiple levels: Next.js middleware, authenticated Server Actions with input validation, and PostgreSQL Row-Level Security (RLS) enforcement at the storage tier.
2. **Elderly-First Accessibility**: The patient user interface departs from dense SaaS paradigms in favor of tactile ergonomics: 20px+ base typography, 60px tactile touch targets, 4-digit PIN authentication, and high-contrast color ratios exceeding 7:1 following WCAG 2.1 accessibility guidelines.
3. **Immutable Clinical Auditing**: Patient dose logs, assistance calls, and administrative access records utilize append-only database triggers (`PREVENT_UPDATE` and `PREVENT_DELETE`) to provide an tamper-proof clinical trail.
4. **Resilient Notification Delivery**: Notification dispatch follows an at-least-once model using database worker leases, bounded exponential backoff, and cryptographic idempotency keys (`X-Entity-Ref-ID`) to eliminate duplicate reminders.

---

## 3. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer["Client & Kiosk Layer"]
        ElderlyKiosk["Patient Kiosk (Tablet/Touch)
        - 4-Digit Numeric PIN
        - Tactile 60px Actions"]
        WebClinician["Clinical Dashboard
        - Caretaker Operations
        - Admin Console
        - Family Circle"]
    end

    subgraph EdgeLayer["Edge & Next.js 15 App Router (Vercel)"]
        Middleware["Edge Middleware
        - Session Token Validation
        - Role Route Gating
        - Kiosk HMAC Validation"]
        
        subgraph ServerRuntime["Server Components & Actions"]
            ServerActions["Server Actions ('use server')
            - Dose Logging & Skip Rationale
            - Appointment Scheduling
            - SOS Assistance Handling"]
            
            CronRoute["Route Handler
            /api/cron/process-reminders
            - Bearer CRON_SECRET Auth"]
        end
    end

    subgraph DataLayer["Supabase Backend (PostgreSQL 15)"]
        SupabaseAuth["Supabase Auth
        - JWT Verification
        - Password Hashing (Bcrypt)"]
        
        RLS["PostgreSQL Row-Level Security
        - Granular Table Isolation
        - Caretaker/Patient Access Helper"]
        
        Tables["Core Relational Tables
        - patients, prescriptions
        - dose_logs, appointments
        - assistance_requests, audit_logs"]
        
        Triggers["Database Triggers & RPCs
        - verify_kiosk_pin()
        - record_dose_action()
        - Append-only Audit Enforcer"]
    end

    subgraph NotificationLayer["Messaging & Alert Pipeline"]
        NotificationQueue["notification_queue (PostgreSQL)
        - Atomic Worker Lease
        - Bounded Exponential Backoff"]
        
        ResendAPI["Resend Email API
        - Idempotency: X-Entity-Ref-ID
        - Caregiver Alerts & Reminders"]
    end

    ElderlyKiosk -->|HTTPS / HMAC Session| Middleware
    WebClinician -->|HTTPS / Supabase JWT| Middleware
    Middleware --> ServerActions
    ServerActions -->|Service Role / User JWT| SupabaseAuth
    ServerActions --> RLS
    RLS --> Tables
    Tables --> Triggers
    
    CronRoute -->|Atomic Claim RPC| NotificationQueue
    NotificationQueue -->|Dispatched Alerts| ResendAPI
```

---

## 4. Next.js 15 App Router Structure

MediCare Connect leverages the Next.js 15 App Router with distinct architectural boundaries:

```
src/app/
├── (auth)/
│   └── login/                 # Unified Supabase Auth + Kiosk PIN entry
├── (dashboard)/
│   ├── admin/                 # Administrator system governance portal
│   ├── caretaker/             # Caretaker clinical operations console
│   ├── family/                # Family circle adherence & updates portal
│   └── patient/               # High-accessibility elderly patient kiosk
├── api/
│   └── cron/
│       └── process-reminders/ # Secured scheduled notification worker endpoint
├── layout.tsx                 # Root layout with global metadata, canonical, & OG tags
├── page.tsx                   # Public marketing & clinical overview landing page
├── robots.ts                  # Search crawler directives (disallows private routes)
├── sitemap.ts                 # Dynamic public sitemap generator
└── opengraph-image.tsx        # Dynamic @vercel/og social preview card generator
```

### Component Responsibility Separation
- **Server Components (Default)**: Perform initial data prefetching, static HTML streaming, and strict metadata rendering.
- **Client Components (`'use client'`)**: Confined to interactive UI terminals (e.g., numeric PIN keypad, quick dose confirmation toggles, modal dialogs).
- **Server Actions (`'use server'`)**: Self-contained RPC routines handling authentication, dose tracking, and patient assistance requests without exposing raw database queries to the client.

---

## 5. Security & Authentication Architecture

### 1. Dual-Track Authentication
- **Staff & Family Users**: Authenticate via Supabase Auth using email and passwords. Successful authentication produces standard secure HTTP-only session cookies.
- **Elderly Patient Kiosks**: Authenticate using an on-screen 4-digit PIN against Bcrypt password hashes stored in `patients.kiosk_pin_hash`. Upon validation, an HMAC-SHA256 signed cookie (`medicare_kiosk_session`) is issued with an explicit expiration timestamp.

### 2. Kiosk Session Cryptographic Verification
```mermaid
sequenceDiagram
    autonumber
    actor Patient as Elderly Patient
    participant Client as Kiosk UI (Client)
    participant Action as verifyPinAction (Server)
    participant DB as PostgreSQL (Supabase)
    participant Edge as Edge Middleware

    Patient->>Client: Enters 4-digit numeric PIN
    Client->>Action: verifyPinAction(patientId, pin)
    Action->>DB: Call verify_kiosk_pin RPC
    Note over DB: Constant-time Bcrypt verify<br/>Enforce 5-attempt rate limit<br/>Check 15-min lockout window
    DB-->>Action: Success / Failure result
    Action->>Action: Sign HMAC-SHA256 token (patientId:expiresAt)
    Action-->>Client: Set HTTP-only 'medicare_kiosk_session' cookie
    Client->>Edge: Request /patient dashboard
    Edge->>Edge: Verify HMAC-SHA256 signature using Web Crypto API
    Edge-->>Client: Allow /patient access
```

---

## 6. Notification & Reminder Pipeline

The reminder engine operates an at-least-once delivery cycle driven by scheduled worker executions:

1. **Trigger Phase**: The external scheduler triggers `GET /api/cron/process-reminders` accompanied by the `Authorization: Bearer <CRON_SECRET>` header.
2. **Claiming Phase**: Worker calls `claim_notifications(batch_size, lease_duration)` which uses `SELECT ... FOR UPDATE SKIP LOCKED` to atomically claim pending notifications without race conditions.
3. **Dispatch Phase**: Sends emails via Resend with the `X-Entity-Ref-ID` header set to the notification ID.
4. **Retry Timing Phase**: Unsuccessful attempts enter an exponential backoff sequence:
   - Attempt 1: 10 minutes (`5m * 2^1`)
   - Attempt 2: 20 minutes (`5m * 2^2`)
   - Attempt 3: 40 minutes (`5m * 2^3`)
   - Attempt 4: 80 minutes (`5m * 2^4`)
   - Max attempts reached (3 for routine, 5 for SOS) transitions status to `FAILED`.
