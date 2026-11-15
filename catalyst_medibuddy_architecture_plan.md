# MEDICARE CONNECT — PHASE 1: PROJECT FOUNDATION IMPLEMENTATION

You are working on MediCare Connect, an elderly-care and medication-management platform for patients, caretakers, family members, and administrators.

Your task is to IMPLEMENT PHASE 1 directly in the existing Next.js project.

This is a coding task, not an architecture-planning task.

## 1. First inspect the existing project

Before changing anything:

- Inspect package.json and the installed dependencies.
- Inspect the existing Next.js version and App Router configuration.
- Inspect the existing directory structure.
- Inspect existing components, pages, styles, and configuration.
- Identify whether Tailwind CSS and shadcn/ui are already configured.
- Preserve useful existing implementation.
- Do not recreate or overwrite the project.

Do not delete existing files without a clear implementation reason.

## 2. Technology stack

Target architecture:

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- React Server Components by default

If the existing project uses a compatible newer Next.js version, retain it rather than downgrading.

Avoid unnecessary dependencies.

Do not configure Supabase, authentication, Resend, or database migrations in this phase.

## 3. Establish the project structure

Create or organize the following structure, adapting it to the existing project:

app/
  layout.tsx
  page.tsx
  globals.css
  (auth)/
    login/
      page.tsx
  (dashboard)/
    admin/
      layout.tsx
      page.tsx
    caretaker/
      layout.tsx
      page.tsx
    family/
      layout.tsx
      page.tsx
    patient/
      layout.tsx
      page.tsx

components/
  layout/
    app-sidebar.tsx
    app-header.tsx
    page-container.tsx
  dashboard/
    dashboard-stat-card.tsx
    welcome-section.tsx
  ui/

lib/
  utils.ts
  constants.ts

types/
  index.ts

Keep the structure modular and scalable.

## 4. Design system

Create a professional healthcare interface.

Design characteristics:

- Light background with a subtle neutral palette.
- Deep teal or medical green as the primary accent.
- Strong text contrast.
- Clean typography.
- Consistent spacing and rounded corners.
- Minimal shadows.
- No unnecessary gradients.
- No excessive animations.
- Avoid generic AI-style visual patterns.

Accessibility requirements:

- Minimum 20px body text in patient-facing screens.
- Minimum 48px interactive touch targets.
- Primary patient actions should be at least 60px tall.
- Clearly visible focus states.
- Proper semantic HTML.
- Accessible form labels.
- Keyboard navigation support.
- Do not communicate status through color alone.

Use design tokens through CSS variables and Tailwind-compatible styles.

## 5. Implement application layouts

Create reusable application shells:

A. Admin:
- Overview
- Patient management
- Care team management
- Activity monitoring
- Settings

B. Caretaker:
- Overview
- Patients
- Medications
- Appointments
- Daily routines
- Assistance requests
- Notifications

C. Family:
- Overview
- Assigned patients
- Medication adherence
- Appointments
- Care updates

D. Patient:
- My day
- My medicines
- Appointments
- Daily routines
- Request assistance
- My care circle

These are navigation placeholders only in Phase 1. Do not implement fake backend functionality.

## 6. Implement the landing and login interfaces

Landing page:
- MediCare Connect branding.
- Clear description of the elderly-care platform.
- Patient-centered messaging.
- A professional entry point to the login page.

Login page:
- Email field.
- Password field.
- Remember-me interface.
- Login button.
- Accessible validation-ready form structure.

Do not implement authentication yet. Make the interface clearly ready for future Supabase Auth integration.

## 7. Dashboard previews

Create attractive, responsive dashboard shells for all four roles.

Use clearly labeled sample/demo information only.

Include:
- Welcome section.
- Summary cards.
- Relevant navigation.
- Empty states where data is not yet connected.

Patient dashboard must be especially simple and elderly-friendly, with large readable text and prominent medication and appointment sections.

Do not invent real patient information or imply that demo data is live healthcare data.

## 8. TypeScript and code quality

- Use strict TypeScript.
- Avoid `any`.
- Use reusable components.
- Keep server components by default.
- Use client components only when interaction requires them.
- Keep UI, domain types, and utility functions separate.
- Avoid duplicated navigation definitions.
- Ensure mobile responsiveness.
- Ensure there are no broken imports or dead links.

## 9. Implementation verification

After implementation:

1. Run the existing package manager's appropriate build command.
2. Run linting if configured.
3. Resolve TypeScript errors.
4. Resolve broken imports.
5. Verify all dashboard routes.
6. Verify responsive layouts.
7. Verify accessibility basics.

Do not claim a check passed unless you actually ran it.

## 10. Final output

After coding, provide:

- Summary of implemented files.
- Final project structure.
- Dependencies added or changed.
- Routes created.
- Build and lint results.
- Known issues.
- Exact next steps for Phase 2.

IMPORTANT RULES:

- Implement directly in the existing project.
- Do not merely generate another architecture document.
- Do not create mock authentication.
- Do not expose secrets.
- Do not modify unrelated files.
- Do not start Phase 2.
- Do not stop after inspection; complete the Phase 1 implementation.