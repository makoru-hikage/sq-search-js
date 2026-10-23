/**
 * test_coverage.js
 *
 * Port of test_coverage.py.
 * Exhaustively verifies every cell is reachable across multiple bases,
 * including non-perfect-square sizes.
 */

import { squareSearch } from './square_search.js';

const failures = [];

// Every cell in perfect-square arrays across odd and even bases
for (const base of [3, 5, 7, 9, 10, 15, 25, 30]) {
  const arr = Array.from({ length: base * base }, (_, i) => i);
  for (let cell = 0; cell < base * base; cell++) {
    const result = squareSearch(arr, cell);
    if (result !== cell) {
      failures.push(`base=${base} cell=${cell}: got ${result}`);
    }
  }
}

// Non-perfect-square sizes
for (const size of [7, 24, 50, 80]) {
  const arr = Array.from({ length: size }, (_, i) => i);
  for (const val of arr) {
    const result = squareSearch(arr, val);
    if (arr[result] !== val) {
      failures.push(`size=${size} val=${val}: got index ${result}`);
    }
  }
  if (squareSearch(arr, size + 1) !== -1) {
    failures.push(`size=${size}: missing should be -1`);
  }
}

console.log('Coverage test (every cell, multiple bases):');
if (failures.length > 0) {
  console.log(`  FAILED: ${failures.length} case(s)`);
  for (const f of failures.slice(0, 10)) console.log(`  ${f}`);
} else {
  console.log('  All cells found correctly across all bases. Centre-column fix verified.');
}
