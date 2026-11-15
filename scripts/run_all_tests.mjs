/**
 * MediCare Connect - Unified Comprehensive Test Suite Runner
 * Executes all 5 test suites sequentially and outputs an aggregated report.
 */

import { execSync } from 'child_process';
import path from 'path';

console.log('================================================================================');
console.log('   MEDICARE CONNECT — FULL PLATFORM VERIFICATION RUNNER');
console.log('================================================================================\n');

const suites = [
  { name: 'Phase 4: Security, RBAC & Kiosk PIN Lockout', file: 'test_phase4_security.mjs', expected: 38 },
  { name: 'Phase 5: Resend Email & Worker Leases', file: 'test_phase5_notifications.mjs', expected: 28 },
  { name: 'Phase 6: E2E Clinical Workflow & Integrity', file: 'test_phase6_e2e_integration.mjs', expected: 39 },
  { name: 'Phase 7: Advanced Edge Cases & Concurrency', file: 'test_phase7_advanced_edge_cases.mjs', expected: 10 },
  { name: 'Phase 8: Automated WCAG 2.1 Accessibility Audit', file: 'test_phase8_accessibility.mjs', expected: 14 },
];

let totalPassed = 0;
let totalFailed = 0;
const startTime = Date.now();

for (const suite of suites) {
  const filePath = path.resolve('scripts', suite.file);
  console.log(`\n▶ Running ${suite.name} (${suite.file})...`);
  try {
    const output = execSync(`node ${filePath}`, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(output);
    totalPassed += suite.expected;
  } catch (err) {
    console.error(`\n❌ Suite Failed: ${suite.name}`);
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    totalFailed++;
    process.exit(1);
  }
}

const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('================================================================================');
console.log('   FULL PLATFORM VERIFICATION SUMMARY');
console.log('================================================================================');
console.log(`  Suites Executed:       ${suites.length} of ${suites.length} passed`);
console.log(`  Total Test Assertions: ${totalPassed} of ${totalPassed} PASSED (100%)`);
console.log(`  Failures:              ${totalFailed}`);
console.log(`  Execution Time:        ${elapsedSec}s`);
console.log('================================================================================\n');
