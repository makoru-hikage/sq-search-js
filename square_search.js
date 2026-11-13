/**
 * square_search.js
 *
 * Square Search (Yamata) algorithm — ESM JavaScript port of square_search.py.
 *
 * The algorithm maps a 1-D haystack onto a virtual √n × √n grid and exploits
 * the D₄ symmetry group to check up to 8 cells per inner iteration, reducing
 * the worst-case comparison count from n to roughly √n / 2.
 *
 * Reference: ~/projects/sasquare-docs/sasquare.pdf
 * Section references (§) point to chapters in the SASQUARE paper:
 *   §8    The Opposites — Chapter 8; each section is one D₄ transform
 *   §8.1  The Opposite Index     — base formula used by all transforms below
 *   §8.2  Rotation 0°            — identity; the canonical (q, r) cell itself
 *   §8.3  Rotation 90°           — quarter-turn clockwise
 *   §8.4  Rotation 180°          — half-turn; point reflection through centre
 *   §8.5  Rotation 270°          — quarter-turn counter-clockwise
 *   §8.6  Horizontal Opposite    — reflect across the vertical axis
 *   §8.7  Vertical Opposite      — reflect across the horizontal axis
 *   §8.8  Antidiagonal Opposite  — reflect across the anti-diagonal
 *   §8.9  Diagonal Opposite      — reflect across the main diagonal
 */

// ── Helper utilities ─────────────────────────────────────────────────────────

/**
 * Returns the ceiling of √n: the smallest integer b such that b² >= n.
 *
 * @param {number} n
 * @returns {number}
 */
export function findNearestSquareRoot(n) {
  const b = Math.floor(Math.sqrt(n));
  return b * b >= n ? b : b + 1;
}

/** @param {number} base @param {number} cellIndex @returns {number} */
export function getRowIndex(base, cellIndex) {
  return Math.floor(cellIndex / base) + 1;
}

/** @param {number} base @param {number} cellIndex @returns {number} */
export function getColumnIndex(base, cellIndex) {
  return (cellIndex % base) + 1;
}

/** @param {number} base @param {number} rowIndex @param {number} columnIndex @returns {number} */
export function getIntersectionIndex(base, rowIndex, columnIndex) {
  return base * (rowIndex - 1) + (columnIndex - 1);
}

/** @param {number} length @param {number} index @returns {number} */
export function getOppositeIndex(length, index) {
  return length + 1 - index;
}

/** @param {number} base @returns {number} */
export function getTopLeftQuadrantLastCell(base) {
  const baseMiddle = Math.floor((base + 1) / 2);
  return (base + 1) * (baseMiddle - 1);
}

// ── Core search ──────────────────────────────────────────────────────────────

/**
 * Search for needle in haystack using the Square Search (Yamata) algorithm.
 *
 * @param {any[]} haystack - array to search (any element type)
 * @param {any}   needle   - value to find
 * @returns {number} index of needle, or -1 if not found
 */
export function squareSearch(haystack, needle) {
  const n          = haystack.length;
  const base       = findNearestSquareRoot(n);   // side length of the virtual √n × √n grid
  const baseMiddle = Math.floor((base + 1) / 2); // extent of the top-left quadrant (centre index + 1)
  const b2         = base * base;                // total cells in the padded grid
  const oddBase    = (base % 2) === 1;           // true when the grid has a physical centre column / row

  // Pad to a perfect square so every (row, col) address is valid.
  // null is the fill value — null === <number> is always false, so padded
  // cells can never produce a false positive.
  const padded = (b2 === n)
    ? haystack
    : [...haystack, ...new Array(b2 - n).fill(null)];

  // Walk the upper triangle of the top-left quadrant: all (q, r) pairs where
  // 0 <= q <= r < baseMiddle.  For each representative cell D₄ symmetry maps
  // (q, r) onto up to 8 cells spread across all four quadrants, so one check
  // covers the entire orbit.
  for (let k = 0; k < baseMiddle; k++) {
    // k is both the row index (q) and the starting column (r = k) for this
    // triangle row.  offset steps r rightward toward the last column.

    // ── Step 1: diagonal cell (q == r == k) ─────────────────────────────
    // The cell lies on the main diagonal — an axis of D₄ symmetry.
    // Reflections §8.6-§8.9 coincide with rotations §8.2-§8.5 here,
    // so only 4 distinct orbit members exist (not 8).
    const diagCell = k * base + k;
    if (padded[diagCell]                    === needle) return diagCell;                  // §8.2 top-left
    if (padded[base*k + base - k - 1]       === needle) return base*k + base - k - 1;    // §8.3 top-right
    if (padded[b2 - diagCell - 1]           === needle) return b2 - diagCell - 1;        // §8.4 bottom-right
    if (padded[base*(base - k - 1) + k]     === needle) return base*(base - k - 1) + k;  // §8.5 bottom-left
    // §8.6-§8.9 are proven duplicates of §8.2-§8.5 on the main diagonal — skipped

    // last = number of offsets remaining after the diagonal for this triangle row
    const last = baseMiddle - k - 1;

    // ── Step 2: full-orbit cells (q == k, r == k+1 .. k+last-1) ─────────
    // The cell is off both axes of symmetry, so all 8 D₄ orbit members are
    // distinct — every one must be checked.
    for (let offset = 1; offset < last; offset++) {
      const q    = k;
      const r    = k + offset;
      const cell = q * base + r;  // §8.2 canonical head — top-left quadrant, above the diagonal

      if (padded[cell]                    === needle) return cell;                    // §8.2 top-left,  above diagonal
      if (padded[base*r + base - q - 1]   === needle) return base*r + base - q - 1;  // §8.3 top-right
      if (padded[b2 - cell - 1]           === needle) return b2 - cell - 1;          // §8.4 bottom-right
      if (padded[base*(base - r - 1) + q] === needle) return base*(base - r - 1) + q;// §8.5 bottom-left
      if (padded[base*q - r + base - 1]   === needle) return base*q - r + base - 1;  // §8.6 top-left,  below diagonal
      if (padded[base*(base - q - 1) + r] === needle) return base*(base - q - 1) + r;// §8.7 bottom-left
      if (padded[b2 - base*r - q - 1]     === needle) return b2 - base*r - q - 1;    // §8.8 bottom-right
      if (padded[base*r + q]              === needle) return base*r + q;              // §8.9 top-right
    }

    // ── Step 3: last cell in the triangle row (q == k, r == k + last) ───
    // For odd base, r == baseMiddle - 1 lands on the centre column — a second
    // axis of D₄ symmetry.  Reflections §8.6-§8.9 collapse onto §8.2-§8.5
    // again, leaving only 4 distinct members (same situation as the diagonal).
    // For even base there is no centre column, so all 8 members remain distinct.
    if (last > 0) {
      const q    = k;
      const r    = k + last;
      const cell = q * base + r;

      if (padded[cell]                    === needle) return cell;                    // §8.2 top-left
      if (padded[base*r + base - q - 1]   === needle) return base*r + base - q - 1;  // §8.3 top-right
      if (padded[b2 - cell - 1]           === needle) return b2 - cell - 1;          // §8.4 bottom-right
      if (padded[base*(base - r - 1) + q] === needle) return base*(base - r - 1) + q;// §8.5 bottom-left
      if (!oddBase) {
        // Even base only — no centre column, so 4 more distinct heads exist.
        if (padded[base*q - r + base - 1]   === needle) return base*q - r + base - 1;  // §8.6
        if (padded[base*(base - q - 1) + r] === needle) return base*(base - q - 1) + r;// §8.7
        if (padded[b2 - base*r - q - 1]     === needle) return b2 - base*r - q - 1;    // §8.8
        if (padded[base*r + q]              === needle) return base*r + q;              // §8.9
      }
      // §8.6-§8.9 are proven duplicates of §8.2-§8.5 on the centre column — skipped for odd base
    }
  }

  return -1; // needle not found
}
