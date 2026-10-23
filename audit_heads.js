/**
 * audit_heads.js
 *
 * Port of audit_heads.py.
 * Audits all (k, offset) traversal cells across several bases.
 * For each cell, computes all 8 D₄ heads and reports how many are unique.
 * Prints any (k, offset) where unique heads < 8 — those are steps where
 * the algorithm intentionally skips redundant comparisons.
 */

function auditBase(base) {
  const baseMiddle    = Math.floor((base + 1) / 2);
  const b2            = base * base;
  const redundantSteps = [];

  for (let k = 0; k < baseMiddle; k++) {
    const offsets = [0, ...Array.from({ length: baseMiddle - k - 1 }, (_, i) => i + 1)];

    for (const offset of offsets) {
      const q    = k;
      const r    = k + offset;
      const cell = q * base + r;

      const heads = {
        '§8.2': cell,
        '§8.3': base*r + base - q - 1,
        '§8.4': b2 - cell - 1,
        '§8.5': base*(base - r - 1) + q,
        '§8.6': base*q - r + base - 1,
        '§8.7': base*(base - q - 1) + r,
        '§8.8': b2 - base*r - q - 1,
        '§8.9': base*r + q,
      };

      const values = Object.values(heads);
      const unique = new Set(values).size;

      if (unique < 8) {
        const seen  = {};
        const dupes = {};
        for (const [name, val] of Object.entries(heads)) {
          if (val in seen) dupes[name] = `== ${seen[val]}`;
          else seen[val] = name;
        }
        redundantSteps.push({ k, offset, q, r, unique, dupes });
      }
    }
  }

  return redundantSteps;
}

for (const base of [5, 7, 9, 10, 15, 30]) {
  const steps      = auditBase(base);
  const bm         = Math.floor((base + 1) / 2);
  const totalSteps = Array.from({ length: bm }, (_, k) => bm - k).reduce((a, b) => a + b, 0);

  console.log(
    `base=${base}  base_middle=${bm}  total traversal steps=${totalSteps}  ` +
    `steps with <8 unique heads=${steps.length}`
  );

  if (base <= 9) {
    for (const { k, offset, q, r, unique, dupes } of steps) {
      const label = offset === 0        ? 'diagonal'
                  : r === bm - 1        ? `last-inner (r=${r}=${bm-1})`
                  :                       'other';
      console.log(`  k=${k} offset=${offset} (q=${q},r=${r})  unique=${unique}  ${label}`);
      for (const [dname, dval] of Object.entries(dupes)) {
        console.log(`    ${dname} ${dval}`);
      }
    }
  }

  console.log();
}
