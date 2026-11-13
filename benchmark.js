/**
 * benchmark.js
 *
 * Port of benchmark.py.
 * Compares squareSearch (Yamata) against linear and binary search
 * on both sorted and unsorted arrays.
 *
 * performance.now() returns milliseconds; we convert to microseconds.
 */

import { performance } from 'perf_hooks';
import { squareSearch } from './square_search.js';
import { mulberry32, seededSample } from './utils.js';

// ── Search implementations ────────────────────────────────────────────────────

function linearSearch(haystack, needle) {
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i] === needle) return i;
  }
  return -1;
}

function bisectLeft(arr, val) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < val) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function binarySearchSorted(haystack, needle) {
  const idx = bisectLeft(haystack, needle);
  return (idx < haystack.length && haystack[idx] === needle) ? idx : -1;
}

function binarySearchUnsorted(haystack, needle) {
  const s   = haystack.slice().sort((a, b) => a - b);
  const idx = bisectLeft(s, needle);
  return (idx < s.length && s[idx] === needle) ? idx : -1;
}

// ── Benchmark runner ──────────────────────────────────────────────────────────

function benchmark(fn, haystack, needle, iterations = 10000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn(haystack, needle);
  return (performance.now() - start) / iterations * 1000;  // µs
}

// ── Formatting helpers ────────────────────────────────────────────────────────

const pi = (v, w) => String(v).padStart(w);
const pf = (v, d, w) => v.toFixed(d).padStart(w);

const SIZES      = [4, 9, 16, 25, 49, 64, 100, 225, 400, 625, 900];
const ITERATIONS = 10000;

const HEADER = `${'Size'.padStart(5)} | ${'Needle'.padStart(8)} | ${'Linear µs'.padStart(10)} | ${'Yamata µs'.padStart(10)} | ${'Binary µs'.padStart(10)} | ${'Winner'.padStart(8)}`;
const DIVIDER = '-'.repeat(HEADER.length);

// ── Sorted arrays ─────────────────────────────────────────────────────────────

console.log('SORTED ARRAYS');
console.log('(Binary search has no sorting cost here)\n');
console.log(HEADER);
console.log(DIVIDER);

for (const size of SIZES) {
  const arr   = Array.from({ length: size }, (_, i) => i);
  const cases = [
    ['first',   arr[0]],
    ['middle',  arr[Math.floor(size / 2)]],
    ['last',    arr[size - 1]],
    ['missing', size + 1],
  ];
  for (const [label, needle] of cases) {
    const tLinear = benchmark(linearSearch,       arr, needle, ITERATIONS);
    const tYamata = benchmark(squareSearch,        arr, needle, ITERATIONS);
    const tBinary = benchmark(binarySearchSorted,  arr, needle, ITERATIONS);
    const winner  = tLinear <= tYamata && tLinear <= tBinary ? 'Linear'
                  : tYamata <= tBinary ? 'Yamata' : 'Binary';
    console.log(`${pi(size,5)} | ${pi(label,8)} | ${pf(tLinear,3,10)} | ${pf(tYamata,3,10)} | ${pf(tBinary,3,10)} | ${pi(winner,8)}`);
  }
  console.log();
}

// ── Unsorted arrays ───────────────────────────────────────────────────────────

console.log('\nUNSORTED ARRAYS');
console.log('(Binary search includes sorting cost)\n');
console.log(HEADER);
console.log(DIVIDER);

const rng = mulberry32(42);

for (const size of SIZES) {
  const arr   = seededSample(rng, size * 10, size);
  const cases = [
    ['first',   arr[0]],
    ['middle',  arr[Math.floor(size / 2)]],
    ['last',    arr[size - 1]],
    ['missing', size * 10 + 1],
  ];
  for (const [label, needle] of cases) {
    const tLinear = benchmark(linearSearch,         arr, needle, ITERATIONS);
    const tYamata = benchmark(squareSearch,          arr, needle, ITERATIONS);
    const tBinary = benchmark(binarySearchUnsorted,  arr, needle, ITERATIONS);
    const winner  = tLinear <= tYamata && tLinear <= tBinary ? 'Linear'
                  : tYamata <= tBinary ? 'Yamata' : 'Binary';
    console.log(`${pi(size,5)} | ${pi(label,8)} | ${pf(tLinear,3,10)} | ${pf(tYamata,3,10)} | ${pf(tBinary,3,10)} | ${pi(winner,8)}`);
  }
  console.log();
}
