# sq-search-js

ESM JavaScript port of the **Yamata** (Square Search) algorithm, plus an
interactive browser-based visualizer comparing Yamata against linear search.

---

## Background

A standard array search scans elements one by one - O(n) in the worst case.
Binary search cuts that to O(log n) but requires a sorted array.

**Square Search** takes a different approach. Given an unsorted array of length
n, it maps the array onto a virtual √n × √n grid and exploits the **D₄
symmetry group** of the square - four rotations and four reflections - to check
up to 8 cells per step from a single representative cell. Because those 8 cells
are spread symmetrically across all four quadrants, the algorithm only needs to
visit the **upper triangle of the top-left quadrant** to guarantee coverage of
the entire grid. This reduces the worst-case comparison count from n to roughly
√n / 2.

The traversal walks all (q, r) pairs where `0 ≤ q ≤ r < ⌈√n / 2⌉`. For each
representative cell, D₄ generates its orbit - up to 8 symmetric counterparts.
On axes of symmetry (the main diagonal, or the centre column of an odd-base
grid), some orbit members coincide and are skipped.

The algorithm works on **any unsorted array** of comparable values. It does not
require sorting or any preprocessing.

The full mathematical treatment - grid representation, D₄ group, symmetry
proofs, and derivation of all 8 orbit formulas - is in the reference paper:

> **SASQUARE** by Kurt M. Ma. Coll  
> `~/projects/sasquare-docs/sasquare.pdf`  
> Chapter 8: *The Opposites* defines the §8.x section references used in the
> source code comments.

---

## Requirements

- **Node.js** v18 or later (ESM `import`, `performance.now()`, `node:http`)
- No npm dependencies - zero `node_modules`

---

## Quick start

```sh
# Clone / enter the project
cd ~/projects/sq-search-js

# Run a demo search
npm start

# Run all correctness and coverage tests
npm run test:correctness
npm run test:coverage
```

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Demo search via `main.js` |
| `npm run test:correctness` | Hard-coded correctness cases |
| `npm run test:coverage` | Exhaustive cell coverage across multiple bases |
| `npm run benchmark` | Linear vs Yamata vs binary search (sorted + unsorted) |
| `npm run benchmark:large` | Scaled benchmark, n up to 12 100 |
| `npm run benchmark:random` | 90% hit / 10% miss mixed workload |
| `npm run audit` | D₄ head uniqueness audit across all step types |
| `npm run trace:25` | Step-by-step traversal trace for a base-5 grid |
| `npm run trace:wins` | Instrumented check counter for n=900 |
| `npm run serve` | Start the local HTTP server for the visualizer |

---

## Visualizer

The visualizer animates both Yamata and linear search side by side on the same
array and needle, one orbit step per tick.

**Start the server** (required - browsers block ESM imports over `file://`):

```sh
npm run serve
# Serving at http://localhost:3000
```

Then open **http://localhost:3000** in a browser.

### Controls

| Control | Action |
|---|---|
| Array size slider | Set n (4 - 400) |
| Speed slider | ×1 (slow) to ×10 (fast) |
| Needle input | Value to search for |
| Play / Pause | Start or pause the animation |
| Step | Advance one orbit at a time |
| Reset | Reset both grids |
| `Space` | Play / Pause |
| `→` | Step |
| `Esc` | Reset |

### Reading the visualizer

- **Yamata grid** - cells light up in orbit-cycling hues; the small white dot
  marks **e₀**, the canonical §8.2 head (top-left quadrant, above the
  diagonal) from which the other 7 orbit members are derived
- **Linear grid** - cells highlight in warm orange, left to right
- On completion, a banner shows the ratio of checks used by each algorithm

---

## File overview

| File | Purpose |
|---|---|
| `square_search.js` | Core Yamata algorithm (ESM export) |
| `utils.js` | `mulberry32` seeded PRNG, `seededSample`, `shuffle` |
| `main.js` | CLI demo |
| `test_correctness.js` | Hard-coded correctness tests |
| `test_coverage.js` | Exhaustive cell coverage tests |
| `benchmark.js` | Three-way benchmark (linear / Yamata / binary) |
| `benchmark_large.js` | Large-n benchmark |
| `benchmark_random.js` | Hit/miss mixed workload benchmark |
| `audit_heads.js` | D₄ head uniqueness audit |
| `trace_25.js` | Base-5 traversal trace |
| `trace_wins.js` | Instrumented check counter |
| `index.html` | Visualizer markup |
| `style.css` | Dark theme styles |
| `visualizer.js` | Dual-grid animation engine |
| `serve.js` | Zero-dependency static HTTP server |
