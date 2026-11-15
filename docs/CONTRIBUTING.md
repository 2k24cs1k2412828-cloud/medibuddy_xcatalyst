# Contributing to MediCare Connect

Thank you for your interest in contributing to MediCare Connect. We welcome contributions that improve healthcare accessibility, clinical reliability, security, and developer experience.

---

## 1. Code of Conduct

As a contributor to this healthcare-oriented repository:
- Treat all community members with respect and professionalism.
- Prioritize patient accessibility (WCAG 2.1 AAA) and data privacy.
- Never commit fake mock shortcuts that bypass security controls or test assertions.
- Adhere strictly to secure coding guidelines: zero credentials in Git, strict server/client boundaries, and fail-closed authorization.

---

## 2. Local Development Workflow

### Prerequisites
- **Node.js**: v20+ or v22 LTS
- **npm**: v10+
- **Git**

### Installation Steps
```bash
# 1. Clone the repository
git clone https://github.com/2k24cs1k2412828-cloud/medibuddy_xcatalyst.git
cd medibuddy_xcatalyst

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Populate .env.local with your Supabase, Kiosk Secret, and Resend configuration

# 4. Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 3. Code Standards & Architecture Guidelines

1. **Strict TypeScript**: Do not use `any` unless strictly unavoidable with a detailed comment.
2. **Next.js 15 App Router Conventions**:
   - Use Server Components by default.
   - Restrict `'use client'` to interactive leaves.
   - Encapsulate mutations inside Server Actions (`'use server'`).
3. **Accessibility (WCAG 2.1 AAA)**:
   - Primary action buttons must maintain minimum 48px tactile height (patient actions 60px+).
   - Ensure all form inputs have associated `<label>` tags with matching `htmlFor`/`id`.
   - Maintain color contrast ratios of at least 7:1 for text.
4. **Security Boundaries**:
   - Never import `SUPABASE_SERVICE_ROLE_KEY` or privileged Supabase clients in client components.
   - All role-restricted actions must independently verify permissions on the server.

---

## 4. Running Verification Test Suites

Before opening a pull request, all test suites and type checks must pass:

```bash
# 1. TypeScript type check
npx tsc --noEmit

# 2. ESLint code validation
npm run lint

# 3. Next.js production build verification
npm run build

# 4. Phase 4: Authentication & Security Suite (38 tests)
node scripts/test_phase4_security.mjs

# 5. Phase 5: Notification & Resend Suite (28 tests)
node scripts/test_phase5_notifications.mjs

# 6. Phase 6: End-to-End Clinical Integration Suite (39 tests)
node scripts/test_phase6_e2e_integration.mjs
```

---

## 5. Submitting Pull Requests

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit your changes using conventional commit formatting (`feat:`, `fix:`, `docs:`, `refactor:`).
3. Push to your fork and submit a Pull Request against `main`.
4. Include a clear description of changes, screenshots for visual updates, and test results.
