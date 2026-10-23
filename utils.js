/**
 * utils.js
 *
 * Shared PRNG helpers used by benchmarks, tests, and trace scripts.
 *
 * NOTE: mulberry32(42) produces a different sequence from Python's
 * random.seed(42).  Arrays will differ from the Python originals, but
 * all correctness properties are preserved.
 */

/**
 * Mulberry32 seeded PRNG.
 * Returns a closure that yields floats in [0, 1).
 *
 * @param {number} seed - 32-bit integer seed
 * @returns {() => number}
 */
export function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Mimics Python's random.sample(range(poolSize), sampleSize).
 * Returns sampleSize unique integers from [0, poolSize) in random order.
 *
 * @param {() => number} rng
 * @param {number} poolSize
 * @param {number} sampleSize
 * @returns {number[]}
 */
export function seededSample(rng, poolSize, sampleSize) {
  const pool = Array.from({ length: poolSize }, (_, i) => i);
  for (let i = 0; i < sampleSize; i++) {
    const j = i + Math.floor(rng() * (poolSize - i));
    const tmp = pool[i];
    pool[i]   = pool[j];
    pool[j]   = tmp;
  }
  return pool.slice(0, sampleSize);
}

/**
 * In-place Fisher-Yates shuffle. Mimics Python's random.shuffle().
 *
 * @param {() => number} rng
 * @param {any[]} arr
 */
export function shuffle(rng, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j   = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i]    = arr[j];
    arr[j]    = tmp;
  }
}
