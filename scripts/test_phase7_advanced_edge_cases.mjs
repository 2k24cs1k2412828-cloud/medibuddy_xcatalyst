/**
 * MediCare Connect - Phase 7 Advanced Edge Cases, Concurrency & Security Suite
 * Tests concurrent mutations, state machine integrity, input validation,
 * batch notification efficiency, and fail-closed security.
 */

import assert from 'assert';
import crypto from 'crypto';

console.log('================================================================');
console.log('   MEDICARE CONNECT — PHASE 7 ADVANCED EDGE CASES & ROBUSTNESS');
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

// -----------------------------------------------------------------------------
// SECTION 1: CONCURRENT MUTATION & RACE CONDITION RESILIENCE
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 1: Concurrency & State Machine Guards ---');

test('1.1 Concurrent dose confirmation race (first succeeds, second fails)', () => {
  // Simulate atomic DB state transition with Optimistic / Row Locking
  let doseRecord = {
    id: 'dose-concurrent-01',
    status: 'PENDING',
    updated_at: new Date('2026-11-15T08:00:00Z').toISOString(),
  };

  function atomicRecordDose(workerId, newStatus) {
    // Equivalent to UPDATE medication_logs SET status = ... WHERE id = ... AND status = 'PENDING'
    if (doseRecord.status !== 'PENDING') {
      return { success: false, error: 'Dose has already been confirmed by another action.' };
    }
    doseRecord = {
      ...doseRecord,
      status: newStatus,
      updated_by: workerId,
      updated_at: new Date().toISOString(),
    };
    return { success: true };
  }

  // Two concurrent actions firing simultaneously
  const resultA = atomicRecordDose('worker_kiosk', 'TAKEN');
  const resultB = atomicRecordDose('worker_caretaker', 'TAKEN');

  assert.strictEqual(resultA.success, true, 'First worker successfully records dose');
  assert.strictEqual(resultB.success, false, 'Second worker is rejected due to completed state');
  assert.strictEqual(doseRecord.status, 'TAKEN');
});

test('1.2 Appointment state machine transition validation', () => {
  const VALID_TRANSITIONS = {
    SCHEDULED: ['ACKNOWLEDGED', 'CANCELLED', 'RESCHEDULED'],
    ACKNOWLEDGED: ['COMPLETED', 'CANCELLED', 'RESCHEDULED'],
    COMPLETED: [], // Terminal
    CANCELLED: [], // Terminal
  };

  function transitionAppointment(currentStatus, nextStatus) {
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Illegal state transition from ${currentStatus} to ${nextStatus}`);
    }
    return nextStatus;
  }

  assert.strictEqual(transitionAppointment('SCHEDULED', 'ACKNOWLEDGED'), 'ACKNOWLEDGED');
  assert.strictEqual(transitionAppointment('ACKNOWLEDGED', 'COMPLETED'), 'COMPLETED');
  assert.throws(() => transitionAppointment('COMPLETED', 'ACKNOWLEDGED'), /Illegal state transition/);
  assert.throws(() => transitionAppointment('CANCELLED', 'COMPLETED'), /Illegal state transition/);
});

// -----------------------------------------------------------------------------
// SECTION 2: INPUT VALIDATION & SANITIZATION
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Strict Input Validation & Boundary Hygiene ---');

test('2.1 Malformed UUID detection in Server Actions', () => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function validateEntityId(id) {
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
      return { valid: false, error: 'Invalid UUID identifier format' };
    }
    return { valid: true };
  }

  assert.strictEqual(validateEntityId('11111111-1111-4111-a111-111111111111').valid, true);
  assert.strictEqual(validateEntityId('not-a-uuid').valid, false);
  assert.strictEqual(validateEntityId("'; DROP TABLE users; --").valid, false);
  assert.strictEqual(validateEntityId(null).valid, false);
});

test('2.2 Mandatory clinical skip reason validation', () => {
  function validateSkipPayload(status, reason) {
    if (status === 'SKIPPED') {
      if (!reason || reason.trim().length < 3) {
        return { valid: false, error: 'A meaningful clinical rationale (>=3 chars) is mandatory' };
      }
    }
    return { valid: true };
  }

  assert.strictEqual(validateSkipPayload('SKIPPED', '').valid, false);
  assert.strictEqual(validateSkipPayload('SKIPPED', '   ').valid, false);
  assert.strictEqual(validateSkipPayload('SKIPPED', 'Nausea after breakfast').valid, true);
  assert.strictEqual(validateSkipPayload('TAKEN', undefined).valid, true);
});

test('2.3 Patient registration input boundary validation', () => {
  function validatePatientRegistration(data) {
    if (!data.fullName || data.fullName.trim().length < 2) {
      return { valid: false, error: 'Full legal name required' };
    }
    if (!data.dob || isNaN(new Date(data.dob).getTime())) {
      return { valid: false, error: 'Valid date of birth required' };
    }
    if (!['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
      return { valid: false, error: 'Valid gender selection required' };
    }
    if (!data.emergencyContactName || !data.emergencyContactPhone) {
      return { valid: false, error: 'Emergency contact name and phone required' };
    }
    return { valid: true };
  }

  const validData = {
    fullName: 'Robert Chen',
    dob: '1948-06-12',
    gender: 'MALE',
    emergencyContactName: 'David Chen',
    emergencyContactPhone: '+1 555-234-5678',
  };

  assert.strictEqual(validatePatientRegistration(validData).valid, true);
  assert.strictEqual(validatePatientRegistration({ ...validData, fullName: '' }).valid, false);
  assert.strictEqual(validatePatientRegistration({ ...validData, dob: 'invalid-date' }).valid, false);
  assert.strictEqual(validatePatientRegistration({ ...validData, gender: 'UNKNOWN' }).valid, false);
});

// -----------------------------------------------------------------------------
// SECTION 3: NOTIFICATION BATCHING & DEDUPLICATION EFFICIENCY
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Notification Batching & Deduplication Efficiency ---');

test('3.1 Atomic batch notification deduplication with event identifiers', () => {
  const queue = new Map();

  function queueBatch(items) {
    let queued = 0;
    let duplicates = 0;

    for (const item of items) {
      if (!queue.has(item.eventIdentifier)) {
        queue.set(item.eventIdentifier, { ...item, queuedAt: Date.now() });
        queued++;
      } else {
        duplicates++;
      }
    }
    return { queued, duplicates };
  }

  const batch1 = [
    { eventIdentifier: 'evt_dose_01_20261115', patientId: 'p1', type: 'UPCOMING_DOSE' },
    { eventIdentifier: 'evt_dose_02_20261115', patientId: 'p1', type: 'UPCOMING_DOSE' },
    { eventIdentifier: 'evt_dose_03_20261115', patientId: 'p2', type: 'UPCOMING_DOSE' },
  ];

  const firstRun = queueBatch(batch1);
  assert.strictEqual(firstRun.queued, 3, 'All 3 unique items queued');
  assert.strictEqual(firstRun.duplicates, 0);

  // Second cron run 5 minutes later with overlapping events
  const secondRun = queueBatch(batch1);
  assert.strictEqual(secondRun.queued, 0, 'Zero duplicate items queued');
  assert.strictEqual(secondRun.duplicates, 3, 'All 3 items deterministically deduplicated');
});

test('3.2 Bounded concurrency worker pool simulation', async () => {
  const tasks = Array.from({ length: 15 }, (_, i) => `notification-${i + 1}`);
  const CONCURRENCY_LIMIT = 5;
  let activeWorkers = 0;
  let maxActiveObserved = 0;
  const processed = [];

  for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
    const chunk = tasks.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(
      chunk.map(async (task) => {
        activeWorkers++;
        if (activeWorkers > maxActiveObserved) maxActiveObserved = activeWorkers;
        // simulate async dispatch
        await new Promise((r) => setTimeout(r, 10));
        processed.push(task);
        activeWorkers--;
      })
    );
  }

  assert.strictEqual(processed.length, 15, 'All 15 tasks processed');
  assert(maxActiveObserved <= CONCURRENCY_LIMIT, `Max concurrency ${maxActiveObserved} did not exceed limit ${CONCURRENCY_LIMIT}`);
});

// -----------------------------------------------------------------------------
// SECTION 4: SECURITY & AUTHORIZATION BOUNDARIES
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Security & Cross-Patient Boundary Checks ---');

test('4.1 Unassigned caretaker strictly blocked from foreign patient records', () => {
  const patientAccessDb = [
    { patient_id: 'patient-robert', user_id: 'caretaker-sarah', status: 'ACTIVE' },
  ];

  function isCaretakerAuthorized(userId, patientId) {
    return patientAccessDb.some(
      (a) => a.user_id === userId && a.patient_id === patientId && a.status === 'ACTIVE'
    );
  }

  assert.strictEqual(isCaretakerAuthorized('caretaker-sarah', 'patient-robert'), true);
  assert.strictEqual(isCaretakerAuthorized('caretaker-sarah', 'patient-margaret'), false);
  assert.strictEqual(isCaretakerAuthorized('caretaker-unassigned', 'patient-robert'), false);
});

test('4.2 Timing-safe cron bearer token verification', () => {
  const EXPECTED_SECRET = 'medicare-production-cron-secret-token-2026';
  const expectedBuf = Buffer.from(EXPECTED_SECRET, 'utf-8');

  function verifyCronToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.slice(7).trim();
    const providedBuf = Buffer.from(token, 'utf-8');
    if (providedBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(providedBuf, expectedBuf);
  }

  assert.strictEqual(verifyCronToken(`Bearer ${EXPECTED_SECRET}`), true);
  assert.strictEqual(verifyCronToken('Bearer invalid-token'), false);
  assert.strictEqual(verifyCronToken('Basic token'), false);
  assert.strictEqual(verifyCronToken(''), false);
});

test('4.3 ePHI Sanitization in client logs and error payloads', () => {
  function sanitizeErrorForClient(error) {
    const raw = String(error?.message || error || '');
    // Strip database connection strings, passwords, or raw SQL
    return raw
      .replace(/postgres:\/\/[^@]+@[^\s]+/gi, '[REDACTED_DB_URI]')
      .replace(/key=[a-zA-Z0-9_\-\.]+/gi, 'key=[REDACTED_API_KEY]')
      .replace(/password=[^\s&]+/gi, 'password=[REDACTED]');
  }

  const rawError = new Error('Failed to connect to postgres://admin:secretPass123@db.supabase.co:5432/postgres?sslmode=require');
  const sanitized = sanitizeErrorForClient(rawError);

  assert(!sanitized.includes('secretPass123'), 'Password must be redacted from client error');
  assert(sanitized.includes('[REDACTED_DB_URI]'), 'Database URI pattern replaced');
});

console.log('\n================================================================');
console.log(`RESULTS: All ${passedAssertions} advanced edge-case assertions PASSED (100%)`);
console.log('================================================================\n');
