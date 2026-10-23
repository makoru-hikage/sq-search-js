/**
 * trace_25.js
 *
 * Port of trace_25.py.
 * Manually walks the base=5 (25-element) traversal and prints which cells
 * are visited at each step, along with comparison counts.
 */

const base       = 5;
const baseMiddle = 3;
const b2         = 25;
let iteration    = 0;
let comparisons  = 0;

for (let k = 0; k < baseMiddle; k++) {
  // Diagonal block
  const diagCell = k * base + k;
  const c1 = diagCell;
  const c2 = base*k + base - k - 1;
  const c3 = b2 - diagCell - 1;
  const c4 = base*(base - k - 1) + k;
  iteration++;
  comparisons += 4;
  const diagSet = [...new Set([c1, c2, c3, c4])].sort((a, b) => a - b);
  console.log(`k=${k} diagonal   -> cells ${JSON.stringify(diagSet)} (${diagSet.length} unique, 4 comparisons)`);

  const last = baseMiddle - k - 1;

  for (let offset = 1; offset < last; offset++) {
    const q    = k;
    const r    = k + offset;
    const cell = q * base + r;
    const cells = [
      cell,
      base*r + base - q - 1,
      b2 - cell - 1,
      base*(base - r - 1) + q,
      base*q - r + base - 1,
      base*(base - q - 1) + r,
      b2 - base*r - q - 1,
      base*r + q,
    ];
    iteration++;
    comparisons += 8;
    const cellSet = [...new Set(cells)].sort((a, b) => a - b);
    console.log(`k=${k} offset=${offset}     -> cells ${JSON.stringify(cellSet)} (${cellSet.length} unique, 8 comparisons)`);
  }

  if (last > 0) {
    const q    = k;
    const r    = k + last;
    const cell = q * base + r;
    const l1 = cell;
    const l2 = base*r + base - q - 1;
    const l3 = b2 - cell - 1;
    const l4 = base*(base - r - 1) + q;
    iteration++;
    comparisons += 4;  // odd base: only 4
    const lastSet = [...new Set([l1, l2, l3, l4])].sort((a, b) => a - b);
    console.log(`k=${k} last step -> cells ${JSON.stringify(lastSet)} (${lastSet.length} unique, 4 comparisons)`);
  }
}

console.log();
console.log(`Total loop body executions : ${iteration}`);
console.log(`Total == comparisons       : ${comparisons}`);
