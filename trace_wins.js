/**
 * trace_wins.js
 *
 * Port of trace_wins.py.
 * Traces how many checks squareSearch performs to find the first, middle,
 * and last elements of a 900-element array, and compares to linear scan cost.
 *
 * Note: seeded arrays differ from the Python original (mulberry32 vs CPython
 * random), so specific needle values and check counts will differ, but the
 * structural comparison (Orochi vs linear) is preserved.
 */

import { findNearestSquareRoot } from './square_search.js';
import { mulberry32, seededSample } from './utils.js';

const SIZE = 900;
const BASE = findNearestSquareRoot(SIZE);  // 30
const BM   = Math.floor((BASE + 1) / 2);  // 15
const B2   = BASE * BASE;

const rng = mulberry32(42);
const arr = seededSample(rng, SIZE * 10, SIZE);

const first  = arr[0];
const middle = arr[Math.floor(SIZE / 2)];
const last   = arr[SIZE - 1];

console.log(`base=${BASE}  base_middle=${BM}  b²=${B2}`);
console.log(`needle 'first'  = ${first}  (value at cell 0)`);
console.log(`needle 'middle' = ${middle}  (value at cell ${Math.floor(SIZE / 2)})`);
console.log(`needle 'last'   = ${last}  (value at cell ${SIZE - 1})`);
console.log();

// ── Instrumented trace ────────────────────────────────────────────────────────

function traceSearch(haystack, needle, label) {
  const n          = haystack.length;
  const base       = findNearestSquareRoot(n);
  const baseMiddle = Math.floor((base + 1) / 2);
  const b2         = base * base;
  // SIZE is a perfect square — no padding needed
  const padded     = haystack;

  let checks = 0;

  for (let k = 0; k < baseMiddle; k++) {
    const diagCell = k * base + k;

    function chk(idx, section) {
      checks++;
      if (padded[idx] === needle) {
        console.log(`  [${label}] found at outer k=${k}, offset=0, head=${section}, cell=${idx}  after ${checks} checks`);
        return true;
      }
      return false;
    }

    if (chk(diagCell,                    '§8.2')) return checks;
    if (chk(base*k + base - k - 1,       '§8.3')) return checks;
    if (chk(b2 - diagCell - 1,           '§8.4')) return checks;
    if (chk(base*(base - k - 1) + k,     '§8.5')) return checks;

    for (let offset = 1; offset < baseMiddle - k; offset++) {
      const q    = k;
      const r    = k + offset;
      const cell = q * base + r;

      function chk8(idx, section) {
        checks++;
        if (padded[idx] === needle) {
          console.log(`  [${label}] found at outer k=${k}, offset=${offset}, head=${section}, cell=${idx}  after ${checks} checks`);
          return true;
        }
        return false;
      }

      if (chk8(cell,                       '§8.2')) return checks;
      if (chk8(base*r + base - q - 1,      '§8.3')) return checks;
      if (chk8(b2 - cell - 1,              '§8.4')) return checks;
      if (chk8(base*(base - r - 1) + q,    '§8.5')) return checks;
      if (chk8(base*q - r + base - 1,      '§8.6')) return checks;
      if (chk8(base*(base - q - 1) + r,    '§8.7')) return checks;
      if (chk8(b2 - base*r - q - 1,        '§8.8')) return checks;
      if (chk8(base*r + q,                 '§8.9')) return checks;
    }
  }

  console.log(`  [${label}] NOT FOUND after ${checks} checks`);
  return checks;
}

const cFirst  = traceSearch(arr, first,  'first');
const cMiddle = traceSearch(arr, middle, 'middle');
const cLast   = traceSearch(arr, last,   'last');

console.log();
console.log('── How many checks Orochi does vs linear scan position ──────────────────');
console.log(`  first:  Orochi=${cFirst} checks  |  linear scans to position 0  (1 comparison)`);
console.log(`  middle: Orochi=${cMiddle} checks  |  linear scans to position ${Math.floor(SIZE/2)}  (~${Math.floor(SIZE/2)+1} comparisons)`);
console.log(`  last:   Orochi=${cLast} checks  |  linear scans to position ${SIZE-1}  (~${SIZE} comparisons)`);
