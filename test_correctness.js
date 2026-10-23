/**
 * test_correctness.js
 *
 * Port of test_correctness.py.
 * Checks squareSearch returns the correct index for a range of inputs.
 *
 * Note: seeded random arrays will differ from the Python originals because
 * mulberry32(42) != Python random.seed(42).  The correctness invariants
 * (found index holds the needle; missing returns -1) are unchanged.
 */

import { squareSearch, findNearestSquareRoot } from './square_search.js';
import { mulberry32, seededSample } from './utils.js';

const failures = [];

function check(label, got, expected) {
  const status = got === expected ? 'PASS' : 'FAIL';
  if (status === 'FAIL') failures.push(`${label}: got ${got}, expected ${expected}`);
  console.log(`  [${status}] ${label}: ${got}`);
}

// ── findNearestSquareRoot ─────────────────────────────────────────────────────
console.log('── findNearestSquareRoot ─────────────────────────────────────────────');
check('isqrt(1)',   findNearestSquareRoot(1),   1);
check('isqrt(4)',   findNearestSquareRoot(4),   2);
check('isqrt(7)',   findNearestSquareRoot(7),   3);
check('isqrt(9)',   findNearestSquareRoot(9),   3);
check('isqrt(10)',  findNearestSquareRoot(10),  4);
check('isqrt(25)',  findNearestSquareRoot(25),  5);
check('isqrt(900)', findNearestSquareRoot(900), 30);

console.log();
console.log('── squareSearch correctness ──────────────────────────────────────────');

// needle=42 in a 24-element array (non-perfect square -> pads to 25)
const arr24 = Array.from({ length: 24 }, (_, i) => i);
arr24[18] = 42;
check('needle=42 in 24-elem (non-perfect sq), expect 18', squareSearch(arr24, 42), 18);

// Whitepaper example: h(5,16)=18
const arr25 = Array.from({ length: 25 }, (_, i) => i);
check('needle at 18 in 25-elem (perfect sq)', squareSearch(arr25, 18), 18);

// First cell
check('needle at cell 0',  squareSearch(Array.from({ length: 25 }, (_, i) => i), 0),  0);
// Last cell
check('needle at cell 24', squareSearch(Array.from({ length: 25 }, (_, i) => i), 24), 24);
// Center cell (base=5, center=12)
check('needle at cell 12 (center)', squareSearch(Array.from({ length: 25 }, (_, i) => i), 12), 12);
// Missing needle
check('missing needle returns -1', squareSearch(Array.from({ length: 25 }, (_, i) => i), 99), -1);

// b=1 edge case
check('b=1 found',   squareSearch([42], 42), 0);
check('b=1 missing', squareSearch([42],  7), -1);

// Seeded random arrays
const rng   = mulberry32(42);
const sizes = [9, 16, 25, 49, 64, 100, 225, 400, 625, 900];

for (const size of sizes) {
  const arr = seededSample(rng, size * 10, size);
  for (const [label, needle] of [['first', arr[0]], ['last', arr[arr.length - 1]], ['missing', size * 10 + 1]]) {
    const result = squareSearch(arr, needle);
    if (label === 'missing') {
      check(`size=${size} ${label}`, result, -1);
    } else {
      if (result === -1) {
        failures.push(`size=${size} ${label}: returned -1 but needle=${needle} is in array`);
        console.log(`  [FAIL] size=${size} ${label}: returned -1`);
      } else if (arr[result] !== needle) {
        failures.push(`size=${size} ${label}: arr[${result}]=${arr[result]} != needle=${needle}`);
        console.log(`  [FAIL] size=${size} ${label}: arr[${result}]=${arr[result]} != ${needle}`);
      } else {
        console.log(`  [PASS] size=${size} ${label}: found needle=${needle} at cell ${result}`);
      }
    }
  }
}

console.log();
if (failures.length > 0) {
  console.log(`FAILED: ${failures.length} test(s)`);
  for (const f of failures) console.log(`  ${f}`);
} else {
  console.log('All tests passed.');
}
