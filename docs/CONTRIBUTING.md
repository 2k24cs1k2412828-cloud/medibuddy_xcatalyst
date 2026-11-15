# Contributing to MediCare Connect

Thank you for contributing to MediCare Connect. We welcome contributions that improve healthcare accessibility, clinical reliability, security, and developer experience.

---

## 1. Code of Conduct & Core Standards

As a contributor to this healthcare software repository:
- **Patient Privacy**: Never commit real patient health information, live clinical records, or private identifiers. Synthetic test fixtures (such as *Robert Chen*, *Margaret Taylor*) must be used exclusively.
- **Zero Secrets in Git**: Never commit API keys, service-role tokens, or environment files. All secret variables must be handled via environment variables with placeholders in `.env.example`.
- **Honest Test Engineering**: Never alter security policies or disable linting rules to make tests pass artificially.

---

## 2. Local Development Workflow

### Prerequisites
- **Node.js**: `v20.x` or `v22.x LTS`
- **npm**: `v10.x`+
- **Git**

### Installation & Run Steps
```bash
# 1. Clone repository
git clone https://github.com/2k24cs1k2412828-cloud/medibuddy_xcatalyst.git
cd medibuddy_xcatalyst

# 2. Install dependencies
npm install

# 3. Configure local environment variables
cp .env.example .env.local
# Provide test Supabase credentials and temporary random secrets in .env.local

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Engineering Guidelines

1. **Strict TypeScript**:
   - Do not disable type checks with `@ts-ignore` or `any` without an explicit architectural justification.
   - Run `npx tsc --noEmit` before opening pull requests.
2. **Next.js 15 App Router Conventions**:
   - Use Server Components by default.
   - Confine `'use client'` strictly to interactive leaves (e.g., keypad buttons, dialogs).
   - Encapsulate database mutations within Server Actions (`'use server'`).
3. **Database Migration Guidelines**:
   - Never edit or retroactively modify existing migrations (e.g., `001_create_core_tables.sql` through `008_add_audit_constraints_and_permissions.sql`).
   - Create new sequentially numbered migrations in `supabase/migrations/` (e.g., `010_your_migration.sql`).
   - Always ensure new tables have Row-Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
4. **Accessibility (WCAG 2.1 Guidelines)**:
   - Form inputs must have an associated `<label>` linked via matching `htmlFor` and `id` attributes.
   - Kiosk touch targets must meet the minimum 48px standard, with primary actions exceeding 60px.
   - Ensure high contrast ratios (7:1 text-to-background) for patient views.

---

## 4. Verification Test Suites

Before opening a pull request, run all verification suites:

```bash
# 1. Run all 5 automated test suites (129 assertions)
npm test

# 2. TypeScript Static Typecheck
npx tsc --noEmit

# 3. ESLint Code Quality Verification
npm run lint

# 4. Next.js Production Build
npm run build
```

---

## 5. Pull Request Lifecycle

1. Branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit with conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
3. Push to your branch and open a Pull Request against `main`.
4. Include a concise summary of changes, references to any issues resolved, and verification test outputs.
