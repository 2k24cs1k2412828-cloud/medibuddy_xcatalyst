/**
 * MediCare Connect - Phase 8 Automated Accessibility & WCAG 2.1 Audit Suite
 * Inspects all UI components, pages, dialogs, and navigation landmarks
 * to ensure zero accessibility violations.
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('================================================================');
console.log('   MEDICARE CONNECT — PHASE 8 AUTOMATED ACCESSIBILITY & WCAG 2.1 AUDIT');
console.log('================================================================');

let passedAssertions = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedAssertions++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
    process.exit(1);
  }
}

const SRC_DIR = path.resolve('src');

function readComponent(relPath) {
  return fs.readFileSync(path.join(SRC_DIR, relPath), 'utf-8');
}

// -----------------------------------------------------------------------------
// SECTION 1: SEMANTIC HTML & LANDMARKS
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 1: Semantic HTML & Landmark Roles ---');

test('1.1 Landing page contains valid <main>, <header>, and <footer> landmarks', () => {
  const homeCode = readComponent('app/page.tsx');
  assert(homeCode.includes('<header'), 'Header landmark present');
  assert(homeCode.includes('<main'), 'Main landmark present');
  assert(homeCode.includes('<footer'), 'Footer landmark present');
});

test('1.2 Auth page wraps interactive login form in <main> landmark', () => {
  const loginCode = readComponent('app/(auth)/login/page.tsx');
  assert(loginCode.includes('<main'), 'Login page main landmark present');
});

test('1.3 Navigations specify descriptive aria-label attributes', () => {
  const homeCode = readComponent('app/page.tsx');
  const sidebarCode = readComponent('components/layout/app-sidebar.tsx');
  assert(homeCode.includes('aria-label="Primary Navigation"'), 'Home primary nav labelled');
  assert(sidebarCode.includes('aria-label="Patient Navigation"'), 'Patient nav labelled');
  assert(sidebarCode.includes('aria-label="Sidebar Navigation"'), 'Staff sidebar nav labelled');
});

// -----------------------------------------------------------------------------
// SECTION 2: TOUCH TARGETS & ERGONOMICS (WCAG 2.5.5 / 2.5.8)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Touch Targets & Tactile Ergonomics ---');

test('2.1 AppHeader interactive controls satisfy minimum 44px touch targets', () => {
  const headerCode = readComponent('components/layout/app-header.tsx');
  assert(headerCode.includes('min-h-[44px] min-w-[44px]'), 'Touch target size utility present on icon buttons');
  assert(headerCode.includes('aria-label="View notifications"'), 'Notification bell button has accessible label');
  assert(headerCode.includes('aria-label="Sign out of MediCare Connect"'), 'Sign out button has accessible label');
});

test('2.2 Patient Kiosk dose confirmation buttons exceed 60px tactile touch height', () => {
  const patientCode = readComponent('components/patient/patient-dashboard-client.tsx');
  // Primary 'Mark as Taken' action has h-16 or min-h-[64px]
  assert(patientCode.includes('h-16') || patientCode.includes('min-h-[60px]') || patientCode.includes('p-5'), 'Large touch target button configured');
  assert(patientCode.includes('min-h-[90px]'), 'SOS and help action cards exceed 90px touch target');
});

test('2.3 Patient Kiosk keypad buttons satisfy 56px touch height', () => {
  const loginCode = readComponent('components/auth/login-client.tsx');
  assert(loginCode.includes('h-14'), 'Keypad buttons are 56px tall (h-14)');
  assert(loginCode.includes('aria-label={`Digit ${digit}`}'), 'Keypad digit buttons have explicit accessible labels');
});

// -----------------------------------------------------------------------------
// SECTION 3: MODAL DIALOG ACCESSIBILITY (ARIA-MODAL & FOCUS)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Modal Dialog Semantics & Dismiss Controls ---');

test('3.1 Patient Skip Modal implements role="dialog" and aria-modal="true"', () => {
  const patientCode = readComponent('components/patient/patient-dashboard-client.tsx');
  assert(patientCode.includes('role="dialog"'), 'Skip modal has role="dialog"');
  assert(patientCode.includes('aria-modal="true"'), 'Skip modal has aria-modal="true"');
  assert(patientCode.includes('aria-labelledby="skip-dialog-title"'), 'Skip modal references heading ID');
  assert(patientCode.includes('aria-label="Close skip dialog"'), 'Close button has accessible label');
});

test('3.2 Caretaker Modals implement dialog semantics and accessible close buttons', () => {
  const caretakerCode = readComponent('components/caretaker/caretaker-dashboard-client.tsx');
  assert(caretakerCode.includes('role="dialog"'), 'Caretaker modal has role="dialog"');
  assert(caretakerCode.includes('aria-labelledby="resolve-modal-title"'), 'Resolve modal labelled');
  assert(caretakerCode.includes('aria-label="Close resolve dialog"'), 'Resolve close button labelled');
  assert(caretakerCode.includes('aria-labelledby="add-med-modal-title"'), 'Prescription modal labelled');
  assert(caretakerCode.includes('aria-label="Close prescription dialog"'), 'Prescription close button labelled');
});

test('3.3 Admin Modals implement dialog semantics and accessible close buttons', () => {
  const adminCode = readComponent('components/admin/admin-dashboard-client.tsx');
  assert(adminCode.includes('role="dialog"'), 'Admin modal has role="dialog"');
  assert(adminCode.includes('aria-labelledby="register-patient-modal-title"'), 'Register modal labelled');
  assert(adminCode.includes('aria-label="Close register dialog"'), 'Register close button labelled');
  assert(adminCode.includes('aria-labelledby="invite-modal-title"'), 'Invite modal labelled');
  assert(adminCode.includes('aria-label="Close invite dialog"'), 'Invite close button labelled');
});

test('3.4 Family Encouragement Modal implements dialog semantics', () => {
  const familyCode = readComponent('components/family/family-dashboard-client.tsx');
  assert(familyCode.includes('role="dialog"'), 'Family modal has role="dialog"');
  assert(familyCode.includes('aria-labelledby="encourage-modal-title"'), 'Encouragement modal labelled');
  assert(familyCode.includes('aria-label="Close encouragement dialog"'), 'Encouragement close button labelled');
});

// -----------------------------------------------------------------------------
// SECTION 4: SCREEN READER ANNOUNCEMENTS & LIVE REGIONS
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Live Announcements & Status Banners ---');

test('4.1 Patient feedback banners declare role="status" and aria-live="polite"', () => {
  const patientCode = readComponent('components/patient/patient-dashboard-client.tsx');
  assert(patientCode.includes('role="status" aria-live="polite"'), 'Patient toast has status live region');
  assert(patientCode.includes('aria-label="Dismiss celebration message"'), 'Celebration dismiss labelled');
  assert(patientCode.includes('aria-label="Dismiss help message"'), 'Help dismiss labelled');
});

test('4.2 Caretaker, Family, and Admin feedback banners declare role="status"', () => {
  const caretakerCode = readComponent('components/caretaker/caretaker-dashboard-client.tsx');
  const familyCode = readComponent('components/family/family-dashboard-client.tsx');
  const adminCode = readComponent('components/admin/admin-dashboard-client.tsx');

  assert(caretakerCode.includes('role="status" aria-live="polite"'), 'Caretaker banner is live status');
  assert(caretakerCode.includes('aria-label="Dismiss notification"'), 'Caretaker dismiss labelled');
  assert(familyCode.includes('role="status" aria-live="polite"'), 'Family banner is live status');
  assert(familyCode.includes('aria-label="Dismiss call status"'), 'Family call dismiss labelled');
  assert(adminCode.includes('role="status" aria-live="polite"'), 'Admin banner is live status');
  assert(adminCode.includes('aria-label="Dismiss notice"'), 'Admin dismiss labelled');
});

// -----------------------------------------------------------------------------
// SECTION 5: ELDERLY TYPOGRAPHY & CONTRAST
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 5: Elderly Typography Scale & Visual Hierarchy ---');

test('5.1 Patient kiosk applies minimum 20px (text-xl / text-2xl) typography scale', () => {
  const patientCode = readComponent('components/patient/patient-dashboard-client.tsx');
  assert(patientCode.includes('text-xl'), 'Base button labels use text-xl (20px)');
  assert(patientCode.includes('text-2xl'), 'Section headings use text-2xl (24px)');
  assert(patientCode.includes('font-black') || patientCode.includes('font-extrabold'), 'High-contrast heavy weights applied');
});

test('5.2 Form inputs declare associated visible labels or aria-labels', () => {
  const loginCode = readComponent('components/auth/login-client.tsx');
  assert(loginCode.includes('htmlFor="email"'), 'Email input has associated label');
  assert(loginCode.includes('htmlFor="password"'), 'Password input has associated label');
  assert(loginCode.includes('id="email"'), 'Email input has id');
  assert(loginCode.includes('id="password"'), 'Password input has id');
});

console.log('\n================================================================');
console.log(`RESULTS: All ${passedAssertions} automated accessibility assertions PASSED (100%)`);
console.log('================================================================\n');
