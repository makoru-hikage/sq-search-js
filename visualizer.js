/**
 * visualizer.js
 *
 * Side-by-side animation: Orochi (D4 symmetry) vs. Linear search.
 * Both run simultaneously on the same array and the same needle so the
 * difference in traversal pattern and check count is immediately visible.
 *
 * Haystack is always [0..n-1], so value === index.
 * Clicking cell i sets needle = i.
 */

import { findNearestSquareRoot } from './square_search.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const ORBIT_HUES = [210, 280, 155, 35, 0, 190, 320, 55, 240, 110];
const SPEED_MS   = [2000, 1100, 580, 300, 160, 84, 44, 23, 12, 6];
const GRID_MAX   = 270;  // max px per grid (two grids side by side)

// ── Orochi step generator ─────────────────────────────────────────────────────

function* orochiSteps(arrLen, target) {
  const base       = findNearestSquareRoot(arrLen);
  const baseMiddle = Math.floor((base + 1) / 2);
  const b2         = base * base;
  const oddBase    = (base % 2) === 1;
  const isMatch    = c => c < arrLen && c === target;

  for (let k = 0; k < baseMiddle; k++) {

    const dc        = k * base + k;
    const diagCells = [...new Set([
      dc,
      base*k + base - k - 1,
      b2 - dc - 1,
      base*(base - k - 1) + k,
    ])];
    const diagFoundIdx = diagCells.findIndex(isMatch);
    const diagFound    = diagFoundIdx !== -1 ? diagCells[diagFoundIdx] : null;
    const diagComps    = diagFoundIdx !== -1 ? diagFoundIdx + 1 : diagCells.length;
    yield { k, offset: 0, phase: 'diagonal', cells: diagCells, e0: diagCells[0], found: diagFound, comps: diagComps };
    if (diagFound !== null) return;

    const last = baseMiddle - k - 1;

    for (let offset = 1; offset < last; offset++) {
      const q = k, r = k + offset, cell = q * base + r;
      const cells = [...new Set([
        cell,
        base*r + base - q - 1,
        b2 - cell - 1,
        base*(base - r - 1) + q,
        base*q - r + base - 1,
        base*(base - q - 1) + r,
        b2 - base*r - q - 1,
        base*r + q,
      ])];
      const fi    = cells.findIndex(isMatch);
      const found = fi !== -1 ? cells[fi] : null;
      const comps = fi !== -1 ? fi + 1 : cells.length;
      yield { k, offset, phase: 'orbit', cells, e0: cells[0], found, comps };
      if (found !== null) return;
    }

    if (last > 0) {
      const q = k, r = k + last, cell = q * base + r;
      const raw = [
        cell,
        base*r + base - q - 1,
        b2 - cell - 1,
        base*(base - r - 1) + q,
      ];
      if (!oddBase) raw.push(
        base*q - r + base - 1,
        base*(base - q - 1) + r,
        b2 - base*r - q - 1,
        base*r + q,
      );
      const cells = [...new Set(raw)];
      const lfi   = cells.findIndex(isMatch);
      const found = lfi !== -1 ? cells[lfi] : null;
      const comps = lfi !== -1 ? lfi + 1 : cells.length;
      yield { k, offset: last, phase: oddBase ? 'last-odd' : 'last-even', cells, e0: cells[0], found, comps };
      if (found !== null) return;
    }
  }

  yield { k: -1, offset: -1, phase: 'miss', cells: [], e0: null, found: null, comps: 0 };
}

// ── Linear step generator ─────────────────────────────────────────────────────

function* linearSteps(arrLen, target) {
  for (let i = 0; i < arrLen; i++) {
    const found = i === target ? i : null;
    yield { cell: i, found };
    if (found !== null) return;
  }
  yield { cell: -1, phase: 'miss', found: null };
}

// ── Grid state ────────────────────────────────────────────────────────────────

function makeGS() {
  return {
    cellEls:    [],
    cellStates: [],
    cellHues:   [],
    gen:        null,
    prevCells:  [],
    isDone:     false,
    stepIndex:  0,
    totalComps: 0,
  };
}

const O = makeGS();  // Orochi state
const L = makeGS();  // Linear state

// ── Shared layout vars (updated whenever n or cellPx changes) ─────────────────

let n      = 25;
let base   = 5;
let b2     = 25;
let needle = 12;
let cellPx = 40;

let timer     = null;
let isRunning = false;

// ── DOM refs ──────────────────────────────────────────────────────────────────

const oGridEl      = document.getElementById('grid-orochi');
const lGridEl      = document.getElementById('grid-linear');
const sizeSlider   = document.getElementById('size-slider');
const sizeDisplay  = document.getElementById('size-display');
const speedSlider  = document.getElementById('speed-slider');
const speedDisplay = document.getElementById('speed-display');
const needleInput  = document.getElementById('needle-input');
const btnPlay      = document.getElementById('btn-play');
const btnStep      = document.getElementById('btn-step');
const btnReset     = document.getElementById('btn-reset');
const statusMsg    = document.getElementById('status-msg');
const oSteps       = document.getElementById('o-steps');
const oComps       = document.getElementById('o-comps');
const oResult      = document.getElementById('o-result');
const lComps       = document.getElementById('l-comps');
const lResult      = document.getElementById('l-result');

// ── Grid management ───────────────────────────────────────────────────────────

function buildGrid(gridEl, gs) {
  gridEl.style.setProperty('--cell-px', `${cellPx}px`);
  gridEl.style.gridTemplateColumns = `repeat(${base}, ${cellPx}px)`;
  gridEl.innerHTML = '';

  gs.cellEls    = [];
  gs.cellStates = [];
  gs.cellHues   = new Array(b2).fill(null);

  for (let i = 0; i < b2; i++) {
    const isPad = i >= n;
    const el    = document.createElement('div');

    el.className   = `cell cell--${isPad ? 'padded' : 'unchecked'}`;
    el.textContent = isPad ? '\u00B7' : (cellPx >= 26 ? String(i) : '');
    el.title       = isPad ? 'padding' : `cell ${i}`;

    if (!isPad) el.addEventListener('click', () => onCellClick(i));

    gridEl.appendChild(el);
    gs.cellEls.push(el);
    gs.cellStates.push(isPad ? 'padded' : 'unchecked');
  }

  markNeedle(gs);
}

function buildAllGrids() {
  base   = findNearestSquareRoot(n);
  b2     = base * base;
  cellPx = Math.max(12, Math.min(48, Math.floor(GRID_MAX / base)));
  buildGrid(oGridEl, O);
  buildGrid(lGridEl, L);
}

/** Set a cell's visual state; hue is the CSS --orbit-hue value. */
function setCellState(gs, i, state, hue, isE0 = false) {
  if (i < 0 || i >= b2) return;
  gs.cellStates[i] = state;
  const el       = gs.cellEls[i];
  const isNeedle = i === needle && state !== 'found' && state !== 'padded';
  el.className   = `cell cell--${state}${isNeedle ? ' cell--needle' : ''}${isE0 ? ' cell--e0' : ''}`;
  if (hue != null) {
    gs.cellHues[i] = hue;
    el.style.setProperty('--orbit-hue', hue);
  }
}

function markNeedle(gs) {
  for (let i = 0; i < n; i++) {
    if (gs.cellStates[i] === 'found') {
      gs.cellEls[i].classList.remove('cell--needle');
    } else {
      gs.cellEls[i].classList.toggle('cell--needle', i === needle);
    }
  }
}

function clearGrid(gs) {
  gs.cellHues = new Array(b2).fill(null);
  for (let i = 0; i < b2; i++) {
    const isPad    = i >= n;
    gs.cellStates[i] = isPad ? 'padded' : 'unchecked';
    gs.cellEls[i].className = `cell cell--${gs.cellStates[i]}`;
    gs.cellEls[i].style.removeProperty('--orbit-hue');
  }
  markNeedle(gs);
}

// ── Search management ─────────────────────────────────────────────────────────

function initSearch() {
  O.gen        = orochiSteps(n, needle);
  O.prevCells  = [];
  O.isDone     = false;
  O.stepIndex  = 0;
  O.totalComps = 0;

  L.gen        = linearSteps(n, needle);
  L.prevCells  = [];
  L.isDone     = false;
  L.stepIndex  = 0;
  L.totalComps = 0;

  syncStats();
  clearResults();
}

function resetSearch() {
  stopTimer();
  isRunning           = false;
  btnPlay.textContent = '\u25B6 Play';

  clearGrid(O);
  clearGrid(L);
  initSearch();
  setStatus('Press Play or Step to begin.', '');
}

// ── Step logic ────────────────────────────────────────────────────────────────

function stepOrochi() {
  if (!O.gen || O.isDone) return false;

  const { value: step, done } = O.gen.next();
  if (done) { O.isDone = true; return false; }

  const hue = ORBIT_HUES[Math.max(step.k, 0) % ORBIT_HUES.length];

  for (const c of O.prevCells) {
    if (O.cellStates[c] === 'checking-o') {
      setCellState(O, c, 'checked-o', O.cellHues[c] ?? hue);
    }
  }

  if (step.phase === 'miss') {
    O.prevCells = [];
    O.isDone    = true;
    setGridResult(oResult, 'miss', `Not found (${O.totalComps} checks)`);
    return false;
  }

  for (const c of step.cells) {
    setCellState(O, c, step.found === c ? 'found' : 'checking-o', hue, c === step.e0);
  }

  O.prevCells  = step.cells.slice();
  O.stepIndex += 1;
  O.totalComps += step.comps;

  if (step.found !== null) {
    O.prevCells = [];
    O.isDone    = true;
    setGridResult(oResult, 'found', `Found in ${O.totalComps} checks`);
    return false;
  }

  return true;
}

function stepLinear() {
  if (!L.gen || L.isDone) return false;

  const { value: step, done } = L.gen.next();
  if (done) { L.isDone = true; return false; }

  for (const c of L.prevCells) {
    if (L.cellStates[c] === 'checking-l') {
      setCellState(L, c, 'checked-l', null);
    }
  }

  if (step.phase === 'miss') {
    L.prevCells = [];
    L.isDone    = true;
    setGridResult(lResult, 'miss', `Not found (${L.totalComps} checks)`);
    return false;
  }

  setCellState(L, step.cell, step.found !== null ? 'found' : 'checking-l', null);
  L.prevCells   = [step.cell];
  L.stepIndex  += 1;
  L.totalComps += 1;

  if (step.found !== null) {
    L.prevCells = [];
    L.isDone    = true;
    setGridResult(lResult, 'found', `Found in ${L.totalComps} checks`);
    return false;
  }

  return true;
}

function tick() {
  const moreO = stepOrochi();
  const moreL = stepLinear();
  syncStats();

  if (!moreO && !moreL) {
    stopTimer();
    isRunning           = false;
    btnPlay.textContent = '\u25B6 Play';
    showComparison();
  }
}

function showComparison() {
  if (O.totalComps === 0 || L.totalComps === 0) return;
  if (!O.isDone || !L.isDone) return;

  const ratio = (L.totalComps / O.totalComps).toFixed(2);
  if (L.totalComps > O.totalComps) {
    setStatus(
      `Done \u2014 Orochi: ${O.totalComps} checks \u00B7 Linear: ${L.totalComps} checks \u00B7 Linear used ${ratio}\u00D7 more`,
      'found'
    );
  } else if (L.totalComps < O.totalComps) {
    setStatus(
      `Done \u2014 Orochi: ${O.totalComps} checks \u00B7 Linear: ${L.totalComps} checks \u00B7 Orochi used ${(O.totalComps / L.totalComps).toFixed(2)}\u00D7 more`,
      'miss'
    );
  } else {
    setStatus(
      `Done \u2014 Both used ${O.totalComps} checks`,
      'found'
    );
  }
}

// ── Playback ──────────────────────────────────────────────────────────────────

function startTimer() {
  const ms = SPEED_MS[Number(speedSlider.value) - 1] ?? 100;
  timer = setInterval(tick, ms);
}

function stopTimer() {
  if (timer) { clearInterval(timer); timer = null; }
}

function togglePlay() {
  if (isRunning) {
    stopTimer();
    isRunning           = false;
    btnPlay.textContent = '\u25B6 Play';
  } else {
    const bothDone = O.isDone && L.isDone;
    if (bothDone) resetSearch();
    isRunning           = true;
    btnPlay.textContent = '\u23F8 Pause';
    startTimer();
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function setStatus(msg, state = '') {
  statusMsg.textContent   = msg;
  statusMsg.dataset.state = state;
}

function setGridResult(el, type, msg) {
  el.textContent = msg;
  el.className   = `grid-result grid-result--${type}`;
}

function clearResults() {
  oResult.textContent = '';
  oResult.className   = 'grid-result';
  lResult.textContent = '';
  lResult.className   = 'grid-result';
}

function syncStats() {
  oSteps.textContent = O.stepIndex;
  oComps.textContent = O.totalComps;
  lComps.textContent = L.totalComps;
}

function setNeedle(v) {
  needle            = Math.max(0, Math.floor(Number(v) || 0));
  needleInput.value = needle;
}

// ── Event listeners ───────────────────────────────────────────────────────────

function onCellClick(i) {
  setNeedle(i);
  resetSearch();
}

sizeSlider.addEventListener('input', () => {
  n      = Number(sizeSlider.value);
  const b = findNearestSquareRoot(n);
  sizeDisplay.innerHTML = `n=${n}&nbsp;&nbsp;(${b}&times;${b})`;

  needle = Math.min(needle, n - 1);
  needleInput.value = needle;

  stopTimer();
  isRunning           = false;
  btnPlay.textContent = '\u25B6 Play';

  buildAllGrids();
  initSearch();
  setStatus('Array resized. Press Play or Step to begin.', '');
});

speedSlider.addEventListener('input', () => {
  speedDisplay.textContent = `\u00D7${speedSlider.value}`;
  if (isRunning) { stopTimer(); startTimer(); }
});

needleInput.addEventListener('change', () => {
  setNeedle(needleInput.value);
  resetSearch();
});

btnPlay.addEventListener('click', togglePlay);

btnStep.addEventListener('click', () => {
  stopTimer();
  isRunning           = false;
  btnPlay.textContent = '\u25B6 Play';
  const bothDone = O.isDone && L.isDone;
  if (bothDone) resetSearch();
  stepOrochi();
  stepLinear();
  syncStats();
  if (O.isDone && L.isDone) showComparison();
});

btnReset.addEventListener('click', resetSearch);

document.addEventListener('keydown', e => {
  if (e.target === needleInput || e.target.tagName === 'INPUT') return;
  if (e.key === ' ')           { e.preventDefault(); togglePlay(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); btnStep.click(); }
  else if (e.key === 'Escape') { e.preventDefault(); resetSearch(); }
});

// ── Init ──────────────────────────────────────────────────────────────────────

n      = Number(sizeSlider.value);
needle = Number(needleInput.value);

const initBase = findNearestSquareRoot(n);
sizeDisplay.innerHTML = `n=${n}&nbsp;&nbsp;(${initBase}&times;${initBase})`;

buildAllGrids();
initSearch();
setStatus('Click a cell or press Play to begin.', '');
