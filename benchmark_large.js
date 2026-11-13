/**
 * benchmark_large.js
 *
 * Port of benchmark_large.py.
 * Extends the benchmark to large array sizes, scaling down iteration counts
 * to keep total runtime sane.
 */

import { performance } from 'perf_hooks';
import { squareSearch, findNearestSquareRoot } from './square_search.js';
import { mulberry32, seededSample } from './utils.js';

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

function binarySearchUnsorted(haystack, needle) {
  const s   = haystack.slice().sort((a, b) => a - b);
  const idx = bisectLeft(s, needle);
  return (idx < s.length && s[idx] === needle) ? idx : -1;
}

function benchmark(fn, haystack, needle, iterations = 10000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn(haystack, needle);
  return (performance.now() - start) / iterations * 1000;  // µs
}

function itersFor(size) {
  if (size <= 900)  return 10000;
  if (size <= 3600) return 2000;
  return 500;
}

const SIZES = [
  4, 9, 16, 25, 49, 64, 100, 225, 400, 625, 900,
  1024, 1600, 2500, 3600, 4900, 6400, 8100, 10000, 12100,
];

const pi = (v, w) => String(v).padStart(w);
const pf = (v, d, w) => v.toFixed(d).padStart(w);

console.log('UNSORTED ARRAYS');
console.log('(Binary search includes sorting cost)\n');

const HEADER = `${'Size'.padStart(6)} | ${'b'.padStart(4)} | ${'Needle'.padStart(8)} | ${'Linear µs'.padStart(10)} | ${'Yamata µs'.padStart(10)} | ${'Binary µs'.padStart(10)} | ${'Winner'.padStart(8)}`;
console.log(HEADER);
console.log('-'.repeat(HEADER.length));

const rng = mulberry32(42);

for (const size of SIZES) {
  const b    = findNearestSquareRoot(size);
  const arr  = seededSample(rng, size * 10, size);
  const it   = itersFor(size);
  const cases = [
    ['first',   arr[0]],
    ['middle',  arr[Math.floor(size / 2)]],
    ['last',    arr[size - 1]],
    ['missing', size * 10 + 1],
  ];
  for (const [label, needle] of cases) {
    const tLinear = benchmark(linearSearch,         arr, needle, it);
    const tYamata = benchmark(squareSearch,          arr, needle, it);
    const tBinary = benchmark(binarySearchUnsorted,  arr, needle, it);
    const winner  = tLinear <= tYamata && tLinear <= tBinary ? 'Linear'
                  : tYamata <= tBinary ? 'Yamata' : 'Binary';
    console.log(`${pi(size,6)} | ${pi(b,4)} | ${pi(label,8)} | ${pf(tLinear,3,10)} | ${pf(tYamata,3,10)} | ${pf(tBinary,3,10)} | ${pi(winner,8)}`);
  }
  console.log();
}
