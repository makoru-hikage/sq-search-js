/**
 * benchmark_random.js
 *
 * Port of benchmark_random.py.
 * Benchmarks squareSearch vs linear search on a mixed workload:
 * 90 % hit queries + 10 % miss queries, averaged over N_QUERIES.
 */

import { performance } from 'perf_hooks';
import { squareSearch, findNearestSquareRoot } from './square_search.js';
import { mulberry32, seededSample, shuffle } from './utils.js';

function linearSearch(haystack, needle) {
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i] === needle) return i;
  }
  return -1;
}

function timedBatch(fn, arr, needles) {
  const start = performance.now();
  for (const n of needles) fn(arr, n);
  return (performance.now() - start) / needles.length * 1000;  // µs
}

const N_QUERIES   = 2000;
const FOUND_RATIO = 0.9;
const SIZES       = [900, 10000, 65536];

const pi = (v, w) => String(v).padStart(w);
const pf = (v, d, w) => v.toFixed(d).padStart(w);

console.log(`RANDOM NEEDLE BENCHMARK  (${N_QUERIES} queries: ${Math.round(FOUND_RATIO * 100)}% hit  ${Math.round((1 - FOUND_RATIO) * 100)}% miss)\n`);
console.log(`${'n'.padStart(8)} | ${'b'.padStart(5)} | ${'Linear µs'.padStart(10)} | ${'Orochi µs'.padStart(10)} | ${'ratio'.padStart(6)}`);
console.log('-'.repeat(52));

const rng = mulberry32(42);

for (const size of SIZES) {
  const b    = findNearestSquareRoot(size);
  const pool = size * 4;
  const arr  = seededSample(rng, pool, size);

  const nFound   = Math.floor(N_QUERIES * FOUND_RATIO);
  const nMiss    = N_QUERIES - nFound;

  const foundNeedles   = Array.from({ length: nFound }, () => arr[Math.floor(rng() * size)]);
  const missingNeedles = Array.from({ length: nMiss  }, (_, i) => pool + i);
  const needles        = [...foundNeedles, ...missingNeedles];
  shuffle(rng, needles);

  const tLi = timedBatch(linearSearch, arr, needles);
  const tOr = timedBatch(squareSearch,  arr, needles);

  console.log(`${pi(size,8)} | ${pi(b,5)} | ${pf(tLi,3,10)} | ${pf(tOr,3,10)} | ${(tLi / tOr).toFixed(2).padStart(6)}x`);
}
