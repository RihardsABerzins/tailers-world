// Ātrā palīdzība 112 – pilsēta no putna lidojuma. Brauc ar ātro palīdzību (kursorsvira / bultiņas), satiksme, luksofori, sastrēgumi.
// Izsaukums → brauc pie pacienta → noskaidro (jautājumi) → kas noticis → palīdzība no somas (+ sirds masāža ritmā) → uz slimnīcu vai uz vietas → rezultāts %.
// Teksti latviski. Dati Firebase: ap/saves/{uid}; nauda – kopīgais maciņš (TW.wallet); izskats – users/{uid}/look.
'use strict';
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const mini = document.getElementById('mini'), mctx = mini.getContext('2d');
const $ = id => document.getElementById(id);
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
if (!isTouch) document.body.classList.add('kb');
let W = innerWidth, H = innerHeight, DPR = Math.min(2, devicePixelRatio || 1);
function resize() { W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; }
addEventListener('resize', resize); resize();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ================= Pilsēta =================
const G = 440, RW = 124, LANE = 31, N = 10, S = (N - 1) * G, SWK = 18; // ielu solis, ielas platums, joslas nobīde, ielu skaits, pilsētas izmērs, ietve
const H_NAMES = ['Brīvības', 'Krasta', 'Saules', 'Liepu', 'Ozolu', 'Skolas', 'Dzirnavu', 'Parka', 'Ābeļu', 'Jūras'];
const V_NAMES = ['Tilta', 'Lāčplēša', 'Bērzu', 'Rūpniecības', 'Kalna', 'Vējā', 'Rožu', 'Avotu', 'Meža', 'Pils'];
const RNG = mulberry(112);
const HOSP = { i: 4, j: 3 };
const ROOF = ['#e9dcc8', '#d8c6b0', '#c8d5df', '#b9c6d8', '#e4caa8', '#dcae92', '#aebda4', '#d2c9e2', '#e8e3d6', '#c2a98f', '#f0d9b5', '#b7cfc7'];
const blocks = [];
for (let i = 0; i < N - 1; i++) for (let j = 0; j < N - 1; j++) {
  const x0 = i * G + RW / 2, y0 = j * G + RW / 2, x1 = (i + 1) * G - RW / 2, y1 = (j + 1) * G - RW / 2;
  const b = { i, j, x0, y0, x1, y1, kind: 'city', items: [], trees: [] };
  const r = RNG();
  if (i === HOSP.i && j === HOSP.j) b.kind = 'hospital';
  else if (r < .14) b.kind = 'park'; else if (r < .2) b.kind = 'parking'; else if (r < .25) b.kind = 'plaza';
  const ix0 = x0 + SWK, iy0 = y0 + SWK, ix1 = x1 - SWK, iy1 = y1 - SWK;
  if (b.kind === 'city') { // sadala zemes gabalos, katrā māja
    const lots = [[ix0, iy0, ix1, iy1]];
    for (let k = 0; k < 3; k++) { const L = lots.shift(), [a, c, d, e] = L, w = d - a, h = e - c;
      if (w < 120 && h < 120) { lots.push(L); continue; }
      if (w >= h) { const m = a + w * (.35 + RNG() * .3); lots.push([a, c, m, e], [m, c, d, e]); } else { const m = c + h * (.35 + RNG() * .3); lots.push([a, c, d, m], [a, m, d, e]); } }
    lots.forEach(([a, c, d, e]) => { const m = 7; b.items.push({ t: 'bld', x0: a + m, y0: c + m, x1: d - m, y1: e - m, col: ROOF[(RNG() * ROOF.length) | 0], h: 8 + RNG() * 16, det: Array.from({ length: 1 + (RNG() * 3 | 0) }, () => ({ u: RNG(), v: RNG(), k: RNG() })) }); });
  } else if (b.kind === 'park') {
    if (RNG() < .5) b.items.push({ t: 'pond', x: (ix0 + ix1) / 2 + (RNG() - .5) * 60, y: (iy0 + iy1) / 2 + (RNG() - .5) * 60, r: 50 + RNG() * 30 });
    for (let k = 0; k < 14; k++) b.trees.push({ x: ix0 + 20 + RNG() * (ix1 - ix0 - 40), y: iy0 + 20 + RNG() * (iy1 - iy0 - 40), r: 16 + RNG() * 12 });
  } else if (b.kind === 'parking') {
    for (let k = 0; k < 10; k++) if (RNG() < .7) b.items.push({ t: 'pcar', x: ix0 + 30 + (k % 5) * ((ix1 - ix0 - 60) / 4), y: k < 5 ? iy0 + 50 : iy1 - 50, col: ['#e74c3c', '#3498db', '#f1c40f', '#ecf0f1', '#2c3e50', '#9b59b6'][(RNG() * 6) | 0] });
  }
  // koki uz ietves
  for (let k = 0; k < 6; k++) { const s = RNG(), side = (RNG() * 4) | 0, p = .1 + s * .8;
    const tx = side < 2 ? lerp(x0, x1, p) : side === 2 ? x0 + 9 : x1 - 9, ty = side >= 2 ? lerp(y0, y1, p) : side === 0 ? y0 + 9 : y1 - 9;
    if (b.kind !== 'hospital') b.trees.push({ x: tx, y: ty, r: 11 + RNG() * 5, side: true }); }
  blocks.push(b);
}
// benzīntanki (degviela maksā naudu)
[[1, 6], [7, 1], [6, 7]].forEach(([i, j]) => { const b = blocks.find(q => q.i === i && q.j === j); if (b && b.kind !== 'hospital') { b.kind = 'fuel'; b.items = []; b.trees = b.trees.filter(t => t.side); } });
const FUEL = blocks.filter(b => b.kind === 'fuel').map(b => ({ x: (b.x0 + b.x1) / 2, y: b.y1 + 34, b }));
const hospBlock = blocks.find(b => b.kind === 'hospital');
const HOSP_BAY = { x: (hospBlock.x0 + hospBlock.x1) / 2, y: hospBlock.y1 + 34 }; // uzbrauktuve uz ielas pie slimnīcas
// sastrēgumu posmi (ielas daļa starp krustojumiem): tur mašīnas brauc lēni un to ir daudz
const jams = new Set();
while (jams.size < 7) { const ax = RNG() < .5 ? 'h' : 'v', idx = 1 + (RNG() * (N - 2) | 0), seg = (RNG() * (N - 1)) | 0; jams.add(`${ax}${idx}_${seg}`); }
const isJam = (ax, idx, s) => jams.has(`${ax}${idx}_${Math.floor(clamp(s, 0, S - 1) / G)}`);
// luksofors krustojumā (i,j): 20 s cikls – horizontālā iela zaļa 0–7.5, dzeltena 7.5–9.5, abas sarkanas līdz 10; vertikālā 10–17.5 zaļa, 17.5–19.5 dzeltena
const lightOff = (i, j) => ((i * 7 + j * 13) % 20);
function lightState(i, j, ax, t) { const p = (t + lightOff(i, j)) % 20, q = ax === 'h' ? p : (p + 10) % 20; return q < 7.5 ? 'g' : q < 9.5 ? 'y' : 'r'; }
const lightGreen = (i, j, ax, t) => lightState(i, j, ax, t) === 'g';

// ================= Ātrā palīdzība =================
const amb = { x: HOSP_BAY.x, y: HOSP_BAY.y, a: 0, v: 0, siren: false, bumpT: 0, fuel: 100 };
const keys = {}; let stick = { x: 0, y: 0, on: false };
const cam = { x: amb.x, y: amb.y, z: 1, shake: 0 };
const skids = [];
// ================= Satiksme =================
const CAR_COLS = ['#e74c3c', '#3498db', '#f1c40f', '#ecf0f1', '#2c3e50', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6', '#c0392b', '#2980b9', '#16a085'];
const cars = [];
function laneXY(c) { const off = (c.ax === 'h' ? c.dir : -c.dir) * (LANE + 20 * c.pull); return c.ax === 'h' ? { x: c.s, y: c.idx * G + off } : { x: c.idx * G + off, y: c.s }; }
const laneOff = (ax, dir) => (ax === 'h' ? dir : -dir) * LANE;
const angOf = (ax, dir) => ax === 'h' ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
function spawnCar(ax, idx, s, dir) { const c = { ax, idx, s, dir, v: 0, max: 150 + Math.random() * 80, col: CAR_COLS[(Math.random() * CAR_COLS.length) | 0], pull: 0, stun: 0, ang: angOf(ax, dir), len: 50 + Math.random() * 12, plan: null, turn: null, brake: false };
  const p = laneXY(c); c.x = p.x; c.y = p.y; cars.push(c); return c; }
for (let k = 0; k < 70; k++) { const ax = Math.random() < .5 ? 'h' : 'v', idx = (Math.random() * N) | 0, dir = Math.random() < .5 ? 1 : -1;
  let s = Math.random() * S; if (cars.some(o => o.ax === ax && o.idx === idx && o.dir === dir && Math.abs(o.s - s) < 90)) continue; spawnCar(ax, idx, s, dir); }
jams.forEach(key => { const ax = key[0], idx = +key.slice(1, key.indexOf('_')), seg = +key.slice(key.indexOf('_') + 1), dir = Math.random() < .5 ? 1 : -1;
  for (let k = 0; k < 4; k++) spawnCar(ax, idx, seg * G + RW / 2 + 40 + k * 72, dir); });
// kur mašīna var nogriezties nākamajā krustojumā: 's' taisni, 'r' pa labi, 'l' pa kreisi (pilsētas malā – tikai iespējamie)
function planAt(c, next) { const opts = [], atEdge = (next <= 0 && c.dir < 0) || (next >= S && c.dir > 0), here = c.idx * G, rd = c.ax === 'h' ? c.dir : -c.dir;
  if (!atEdge) opts.push('s', 's', 's'); if (!((here <= 0 && rd < 0) || (here >= S && rd > 0))) opts.push('r', 'r'); if (!((here <= 0 && -rd < 0) || (here >= S && -rd > 0))) opts.push('l');
  return opts[(Math.random() * opts.length) | 0] || 's'; }
const bez = (p0, p1, p2, t) => ({ x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x, y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y });
function updateCars(dt, t) {
  const lanes = {}; cars.forEach(c => { if (c.turn) return; const k = c.ax + c.idx + (c.dir > 0 ? '+' : '-'); (lanes[k] = lanes[k] || []).push(c); });
  Object.values(lanes).forEach(arr => { arr.sort((a, b) => (a.s - b.s) * a.dir); arr.forEach((c, n) => { c.ahead = arr[n + 1] || null; }); });
  for (const c of cars) {
    if (c.stun > 0) { c.stun -= dt; c.v = 0; c.brake = true; continue; }
    // ---- pagrieziens pa līkni krustojumā ----
    if (c.turn) { const T_ = c.turn; let block = false;
      for (const o of cars) if (o !== c && Math.hypot(o.x - c.x, o.y - c.y) < 46) { const fx = Math.cos(c.ang), fy = Math.sin(c.ang); if ((o.x - c.x) * fx + (o.y - c.y) * fy > 10) block = true; }
      if (Math.hypot(amb.x - c.x, amb.y - c.y) < 70) block = true;
      c.v = lerp(c.v, block ? 0 : 95, Math.min(1, dt * 3)); T_.t = Math.min(1, T_.t + c.v * dt / T_.len); const p = bez(T_.p0, T_.p1, T_.p2, T_.t), p2 = bez(T_.p0, T_.p1, T_.p2, Math.min(1, T_.t + .02));
      c.x = p.x; c.y = p.y; if (T_.t < .99) c.ang = Math.atan2(p2.y - p.y, p2.x - p.x); c.brake = block;
      if (T_.t >= 1) { c.ax = T_.ax; c.idx = T_.idx; c.dir = T_.dir; c.s = T_.s; c.turn = null; c.plan = null; c.ang = angOf(c.ax, c.dir); }
      continue; }
    let target = isJam(c.ax, c.idx, c.s) ? 50 : c.max;
    if (c.ahead) { const gap = (c.ahead.s - c.s) * c.dir; if (gap < 64) target = 0; else if (gap < 140) target = Math.min(target, c.ahead.v * .9 + (gap - 64)); }
    // nākamais krustojums, stop līnija, luksofors (dzeltenajā apstājas, ja var paspēt)
    const next = c.dir > 0 ? Math.ceil((c.s + 1) / G) * G : Math.floor((c.s - 1) / G) * G, ni = Math.round(next / G), stop = next - c.dir * (RW / 2 + 14), d = (stop - c.s) * c.dir;
    if (!c.plan && d < 170) c.plan = planAt(c, next);
    if (ni > 0 && ni < N - 1 && d > 0 && d < 120) { const [li, lj] = c.ax === 'h' ? [ni, c.idx] : [c.idx, ni], L = lightState(li, lj, c.ax, t);
      if (L === 'r' || (L === 'y' && d > 30)) target = Math.min(target, d < 6 ? 0 : d * 1.6); }
    if (c.plan && c.plan !== 's' && d < 110) target = Math.min(target, 110);
    // ātrā palīdzība priekšā – nebrauc virsū; ar sirēnu – nobrauc malā un palaiž garām
    const fx = Math.cos(c.ang), fy = Math.sin(c.ang), dx = amb.x - c.x, dy = amb.y - c.y, dd = Math.hypot(dx, dy);
    if (dd < 110 && (dx * fx + dy * fy) > 20) target = 0;
    let wantPull = 0;
    if (amb.siren && dd < 320) { const ax_ = Math.cos(amb.a), ay_ = Math.sin(amb.a); if (-(dx * ax_ + dy * ay_) > -40) { wantPull = 1; target = Math.min(target, 30); } }
    c.pull = lerp(c.pull, wantPull, Math.min(1, dt * 2.5));
    c.brake = target < c.v - 8; c.v = lerp(c.v, target, Math.min(1, dt * (target < c.v ? 3.4 : .9)));
    const ps = c.s; c.s += c.dir * c.v * dt;
    // iebrauc krustojumā: taisni turpina, pagriezienam – līkne līdz jaunās ielas joslai
    const entry = next - c.dir * (RW / 2 + 4);
    if ((ps - entry) * (c.s - entry) <= 0 && ps !== entry && c.plan && c.plan !== 's') {
      const here = c.idx * G, rd = c.ax === 'h' ? c.dir : -c.dir, nd = c.plan === 'r' ? rd : -rd, nax = c.ax === 'h' ? 'v' : 'h', nidx = ni;
      const p0 = { x: c.x, y: c.y }, exitS = here + nd * (RW / 2 + 4), lo = laneOff(nax, nd);
      const p2 = nax === 'h' ? { x: exitS, y: nidx * G + lo } : { x: nidx * G + lo, y: exitS }, p1 = c.ax === 'h' ? { x: p2.x, y: p0.y } : { x: p0.x, y: p2.y };
      c.turn = { p0, p1, p2, t: 0, len: Math.hypot(p1.x - p0.x, p1.y - p0.y) + Math.hypot(p2.x - p1.x, p2.y - p1.y), ax: nax, idx: nidx, dir: nd, s: exitS }; c.pull = 0; continue; }
    if ((ps - next) * (c.s - next) <= 0 && ps !== next) c.plan = null; // taisni cauri krustojumam
    if (c.s < -RW / 2 || c.s > S + RW / 2) { c.dir *= -1; c.s = clamp(c.s, 0, S); c.plan = null; }
    const q = laneXY(c); c.x = c.ax === 'h' ? q.x : lerp(c.x, q.x, Math.min(1, dt * 8)); c.y = c.ax === 'v' ? q.y : lerp(c.y, q.y, Math.min(1, dt * 8));
    c.ang += wrapA(angOf(c.ax, c.dir) - c.ang) * Math.min(1, dt * 8);
  }
}

// ================= Vadība =================
addEventListener('keydown', e => { const k = e.key.toLowerCase(); keys[k] = true; if (k.startsWith('arrow') || k === ' ') e.preventDefault();
  if (k === 's' && !e.repeat && !document.activeElement.matches('input')) toggleSiren(); if ((k === 'e' || k === 'enter') && !e.repeat && !$('ov').classList.contains('on')) act(); });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
// kursorsvira: pieskaries jebkur uz kartes – tur parādās kursorsvira, un no tā punkta velc uz braukšanas pusi
{ const st = $('stick'), kn = $('knob'); let id = null, ox = 0, oy = 0; const R = 70;
  const home = () => { st.classList.remove('live'); st.style.left = ''; st.style.top = ''; kn.style.transform = ''; };
  const mv = e => { let dx = e.clientX - ox, dy = e.clientY - oy; const m = Math.hypot(dx, dy); if (m > R) { dx *= R / m; dy *= R / m; } kn.style.transform = `translate(${dx}px,${dy}px)`; stick = { x: dx / R, y: dy / R, on: true }; };
  const down = e => { if (id !== null || $('ov').classList.contains('on')) return; id = e.pointerId; ox = e.clientX; oy = e.clientY; audioInit();
    st.classList.add('live'); st.style.left = (ox - R) + 'px'; st.style.top = (oy - R) + 'px'; mv(e); };
  cv.addEventListener('pointerdown', down); st.addEventListener('pointerdown', down);
  addEventListener('pointermove', e => { if (e.pointerId === id) mv(e); });
  const up = e => { if (e.pointerId !== id) return; id = null; stick = { x: 0, y: 0, on: false }; home(); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up); }
$('bSiren').addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); toggleSiren(); });
$('bAct').addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); act(); });
function toggleSiren() { amb.siren = !amb.siren; $('bSiren').classList.toggle('on', amb.siren); buzz(15); }
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

function updateAmb(dt) {
  const ov = $('ov').classList.contains('on');
  let thr = 0, ta = null, steer = 0;
  if (!ov) {
    if (stick.on && Math.hypot(stick.x, stick.y) > .18) { thr = Math.min(1, Math.hypot(stick.x, stick.y)); ta = Math.atan2(stick.y, stick.x); }
    const up = keys.arrowup || keys.w, dn = keys.arrowdown, lf = keys.arrowleft || keys.a, rt = keys.arrowright || keys.d;
    if (up) thr = 1; if (dn) thr = -1; steer = (rt ? 1 : 0) - (lf ? 1 : 0);
  }
  const MAX = amb.fuel > 0 ? 430 : 90, turnK = Math.min(1, (Math.abs(amb.v) + 110) / 220);
  let target = 0;
  if (ta !== null) { const d = wrapA(ta - amb.a);
    if (Math.abs(d) > 2.3 && amb.v < 80) { target = -170 * thr; amb.a += clamp(wrapA(ta + Math.PI - amb.a), -2.2 * dt, 2.2 * dt) * turnK; } // atpakaļgaitā
    else { target = MAX * thr * (Math.abs(d) > 1.1 ? .45 : 1); amb.a += clamp(d, -2.9 * dt * turnK, 2.9 * dt * turnK); if (Math.abs(d) > .55 && amb.v > 250) skid(); } }
  else { target = thr > 0 ? MAX : thr < 0 ? (amb.v > 10 ? 0 : -170) : 0; amb.a += steer * 2.7 * dt * turnK * (amb.v < 0 ? -1 : 1); if (Math.abs(steer) && amb.v > 300) skid(); }
  const acc = target > amb.v ? (amb.v < 0 ? 900 : 360) : (target === 0 ? 420 : 820);
  amb.v += clamp(target - amb.v, -acc * dt, acc * dt);
  amb.x += Math.cos(amb.a) * amb.v * dt; amb.y += Math.sin(amb.a) * amb.v * dt;
  const f0 = amb.fuel; amb.fuel = Math.max(0, amb.fuel - Math.abs(amb.v) * dt / 380); // degviela
  if (f0 >= 20 && amb.fuel < 20) toast('⛽ Maz degvielas! Brauc uz benzīntanku (⛽ kartē).'); if (f0 > 0 && amb.fuel <= 0) toast('⛽ Degviela beigusies – mašīna velkas lēni. Uz benzīntanku!');
  // sadursmes ar kvartāliem (mājas, ietves) un pilsētas malu
  const R = 24;
  for (const b of blocks) { if (amb.x < b.x0 - R || amb.x > b.x1 + R || amb.y < b.y0 - R || amb.y > b.y1 + R) continue;
    const ix = clamp(amb.x, b.x0 + 4, b.x1 - 4), iy = clamp(amb.y, b.y0 + 4, b.y1 - 4), dx = amb.x - ix, dy = amb.y - iy, d = Math.hypot(dx, dy);
    if (d < R) { const nx = d ? dx / d : 0, ny = d ? dy / d : -1; amb.x = ix + nx * R; amb.y = iy + ny * R;
      // slīd gar sienu: ja brauc tieši virsū – atsitas, ja slīpi – pagriežas gar to un turpina
      const hx = Math.cos(amb.a) * Math.sign(amb.v || 1), hy = Math.sin(amb.a) * Math.sign(amb.v || 1), into = -(hx * nx + hy * ny);
      if (into > 0) { bump(Math.abs(amb.v) * into > 170); if (into > .85) amb.v *= -.3; else { const tx = -ny, ty = nx, sg = (hx * tx + hy * ty) >= 0 ? 1 : -1, ta = Math.atan2(ty * sg, tx * sg) + (amb.v < 0 ? Math.PI : 0); amb.a += wrapA(ta - amb.a) * .25; amb.v *= .9; } } } }
  amb.x = clamp(amb.x, -RW / 2 + R, S + RW / 2 - R); amb.y = clamp(amb.y, -RW / 2 + R, S + RW / 2 - R);
  // sadursmes ar mašīnām
  for (const c of cars) { const dx = amb.x - c.x, dy = amb.y - c.y, d = Math.hypot(dx, dy);
    if (d < 44) { const nx = dx / (d || 1), ny = dy / (d || 1); amb.x = c.x + nx * 44; amb.y = c.y + ny * 44; c.stun = 1.2; bump(Math.abs(amb.v) > 90, true); amb.v *= -.3; } }
  amb.bumpT = Math.max(0, amb.bumpT - dt);
}
function skid() { if (skids.length > 500) skids.splice(0, 40); const bx = Math.cos(amb.a), by = Math.sin(amb.a), px = -by, py = bx;
  skids.push({ x: amb.x - bx * 22 + px * 13, y: amb.y - by * 22 + py * 13, a: amb.a }, { x: amb.x - bx * 22 - px * 13, y: amb.y - by * 22 - py * 13, a: amb.a }); }
function bump(hard, car) { if (amb.bumpT > 0) return; amb.bumpT = .7; if (!hard) return; cam.shake = 9; sfx('bump'); buzz(40); walletAdd(-3); repairs += 3;
  if (M.state === 'toPatient' || M.state === 'toHospital') { M.bumps++; if (M.state === 'toHospital') M.cond = Math.max(5, M.cond - 6); toast((car ? '💥 Avārija! Remonts −€3' : '💥 Uzmanīgi! Remonts −€3') + (wallet < 0 ? '<br><small>Tu esi mīnusos – nopelni ar izsaukumiem!</small>' : '')); } else toast('💥 Remonts −€3'); }

// ================= Maršruts (īsākais pa ielām, sastrēgumus apiet) =================
function attach(px, py) { // tuvākā iela → divi krustojumi un attālumi līdz tiem
  const row = clamp(Math.round(py / G), 0, N - 1), col = clamp(Math.round(px / G), 0, N - 1), dh = Math.abs(py - row * G), dv = Math.abs(px - col * G);
  if (dh <= dv) { const a = clamp(Math.floor(px / G), 0, N - 2); return [{ i: a, j: row, d: Math.abs(px - a * G) }, { i: a + 1, j: row, d: Math.abs((a + 1) * G - px) }]; }
  const a = clamp(Math.floor(py / G), 0, N - 2); return [{ i: col, j: a, d: Math.abs(py - a * G) }, { i: col, j: a + 1, d: Math.abs((a + 1) * G - py) }]; }
function route(fx, fy, tx, ty) {
  const dist = new Float32Array(N * N).fill(1e9), prev = new Int32Array(N * N).fill(-1), done = new Uint8Array(N * N), id = (i, j) => i * N + j;
  attach(fx, fy).forEach(n => { dist[id(n.i, n.j)] = Math.min(dist[id(n.i, n.j)], n.d); });
  for (let it = 0; it < N * N; it++) { let u = -1, best = 1e9; for (let k = 0; k < N * N; k++) if (!done[k] && dist[k] < best) { best = dist[k]; u = k; } if (u < 0) break; done[u] = 1;
    const ui = (u / N) | 0, uj = u % N;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([di, dj]) => { const vi = ui + di, vj = uj + dj; if (vi < 0 || vj < 0 || vi >= N || vj >= N) return;
      const jam = di ? isJam('h', uj, Math.min(ui, vi) * G + 1) : isJam('v', ui, Math.min(uj, vj) * G + 1), w = G * (jam ? 3 : 1), v = id(vi, vj);
      if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } }); }
  let bestEnd = null, bc = 1e9; attach(tx, ty).forEach(n => { const c = dist[id(n.i, n.j)] + n.d; if (c < bc) { bc = c; bestEnd = n; } });
  const pts = [{ x: tx, y: ty }]; let u = id(bestEnd.i, bestEnd.j); while (u >= 0) { pts.push({ x: ((u / N) | 0) * G, y: (u % N) * G }); u = prev[u]; }
  pts.push({ x: fx, y: fy }); pts.reverse();
  let len = 0; for (let k = 1; k < pts.length; k++) len += Math.abs(pts[k].x - pts[k - 1].x) + Math.abs(pts[k].y - pts[k - 1].y);
  return { pts, len }; }
const streetOf = (x, y) => { const row = Math.round(y / G), col = Math.round(x / G); return Math.abs(y - row * G) <= Math.abs(x - col * G) ? H_NAMES[clamp(row, 0, N - 1)] + ' iela' : V_NAMES[clamp(col, 0, N - 1)] + ' iela'; };

// ================= Izsaukumi =================
let save = { xp: 0, calls: 0, saved: 0, cpr: 0, perfect: 0, best: 0, last: [] };
const levelOf = xp => { let l = 1, need = 120; while (xp >= need) { xp -= need; l++; need = 120 + 60 * (l - 1); } return { l, cur: xp, need }; };
const M = { state: 'idle', c: null, px: 0, py: 0, t: 0, bumps: 0, route: null, rt: 0, cond: 100, sc: {}, expect: 0 };
function newCall() {
  const lv = levelOf(save.xp).l, pool = CASES.filter(c => c.lv <= lv && !save.last.includes(c.id));
  const c = (pool.length ? pool : CASES.filter(c => c.lv <= lv))[(Math.random() * (pool.length || 1)) | 0] || CASES[0];
  save.last = [c.id, ...(save.last || [])].slice(0, 2);
  // pacients uz ietves pie kāda kvartāla, ne pārāk tuvu
  let b, side, px, py, tries = 0;
  do { b = blocks[(Math.random() * blocks.length) | 0]; side = (Math.random() * 4) | 0; const p = .2 + Math.random() * .6;
    px = side < 2 ? lerp(b.x0, b.x1, p) : side === 2 ? b.x0 + 6 : b.x1 - 6; py = side >= 2 ? lerp(b.y0, b.y1, p) : side === 0 ? b.y0 + 6 : b.y1 - 6; tries++; }
  while ((b.kind === 'hospital' || Math.hypot(px - amb.x, py - amb.y) < 1300) && tries < 60);
  const rx = side === 2 ? px - 44 : side === 3 ? px + 44 : px, ry = side === 0 ? py - 44 : side === 1 ? py + 44 : py; // vieta uz ielas, kur apstāties
  Object.assign(M, { state: 'call', c, px, py, rx, ry, t: 0, bumps: 0, cond: 100, sc: {}, asked: new Set(), picked: new Set(), cprScore: null, decision: null, t2: 0, bumps1: 0 });
  M.route = route(amb.x, amb.y, rx, ry); M.expect = M.route.len / 300 + 6;
  sfx('call'); buzz([60, 80, 60]);
  sheet(`<div class="step">📞 Izsaukums</div><h2>${c.who} ${c.call}</h2><p>📍 <b>${streetOf(rx, ry)}</b> · ${Math.round(M.route.len / 10)} m</p>
    <p style="color:#9fb0ff">Ieslēdz sirēnu 🚨 – mašīnas palaidīs garām. Sarkanie ceļi kartē ir sastrēgumi.</p>
    <button class="main red" id="go">🚑 Braucam!</button>`);
  $('go').onclick = () => { closeSheet(); M.state = 'toPatient'; if (!amb.siren) toggleSiren(); };
}
function act() {
  if (nearFuel() && Math.abs(amb.v) < 70 && M.state !== 'scene') { amb.v = 0; refuel(); return; }
  if (M.state === 'toPatient' && near(M.rx, M.ry, 130) && Math.abs(amb.v) < 70) { amb.v = 0; startScene(); }
  else if (M.state === 'toHospital' && near(HOSP_BAY.x, HOSP_BAY.y, 140) && Math.abs(amb.v) < 70) { amb.v = 0; arriveHospital(); }
  else if (M.state === 'toPatient' || M.state === 'toHospital') toast('Piebrauc tuvāk un apstājies pie mērķa 📍');
}
const near = (x, y, r) => Math.hypot(amb.x - x, amb.y - y) < r;
let repairs = 0;
const nearFuel = () => FUEL.find(f => near(f.x, f.y, 130));
const fuelCost = () => Math.ceil((100 - amb.fuel) * .2); // pilna bāka €20
function refuel() { const cost = fuelCost(); if (cost <= 0) { toast('⛽ Bāka jau pilna!'); return; }
  if (wallet <= 0) { toast('💰 Nav naudas degvielai – palīdzi pacientiem, lai nopelnītu!'); return; }
  const pay = Math.min(cost, wallet), add = pay / .2; amb.fuel = Math.min(100, amb.fuel + add); walletAdd(-pay); save.fuel = amb.fuel; persist(); sfx('good'); toast(`⛽ Uzpildīts! ${Math.round(amb.fuel)}% · −€${pay}`); }

// ---- pie pacienta: 1) jautājumi 2) kas noticis 3) palīdzība 4) (sirds masāža) 5) lēmums ----
function startScene() {
  M.state = 'scene'; M.t1 = M.t; M.bumps1 = M.bumps; if (amb.siren) toggleSiren(); sfx('door');
  const c = M.c;
  const render = () => {
    if (M.tc) M.tc.destroy();
    sheet(`<div id="stg"></div><div class="step">1. solis · Noskaidro situāciju</div><h2>${c.who} ${c.name}</h2><p>${c.see}</p>
      <div class="opts">${c.q.map((q, k) => `<button class="opt${M.asked.has(k) ? ' asked' : ''}" data-q="${k}">❓ ${q.t}${M.asked.has(k) ? `<span class="ans">💬 ${q.a}</span>` : ''}</button>`).join('')}</div>
      <button class="main" id="next" ${M.asked.size ? '' : 'disabled'}>Es saprotu, kas noticis →</button>`);
    M.tc = Treat.mount($('stg'), c, {});
    document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const k = +b.dataset.q; if (M.asked.has(k)) return; M.asked.add(k); sfx('tick'); render(); });
    $('next').onclick = stepDx; };
  render();
}
function stepDx() {
  const c = M.c, good = c.q.filter(q => q.good).length, gotGood = c.q.filter((q, k) => q.good && M.asked.has(k)).length, bad = c.q.filter((q, k) => !q.good && M.asked.has(k)).length;
  M.sc.ask = clamp(Math.round(gotGood / good * 100 - bad * 15), 0, 100);
  const opts = [...c.dx].sort(() => Math.random() - .5);
  sheet(`<div class="step">2. solis · Kas noticis?</div><h2>Kā tu domā – kas notika ar ${c.name.split(',')[0]}?</h2>
    <div class="opts">${opts.map((d, k) => `<button class="opt" data-d="${k}">🩺 ${d.t}</button>`).join('')}</div>`);
  document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const d = opts[+b.dataset.d]; M.sc.dx = d.ok ? 100 : 0;
    document.querySelectorAll('[data-d]').forEach(x => { const o = opts[+x.dataset.d]; x.disabled = true; if (o.ok) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
    sfx(d.ok ? 'good' : 'bad'); setTimeout(stepTools, d.ok ? 700 : 1500); });
}
// 3. solis: palīdzība – rīkus velk no somas uz pacienta ķermeņa daļu
function stepTools() {
  const c = M.c; if (M.tc) M.tc.destroy();
  sheet(`<div class="step">3. solis · Palīdzība</div><h2>🧰 Velc no somas uz pacientu <small style="font-size:13.5px;color:#9fb0ff">– tur, kur vajag</small></h2>
    <div id="stg"></div><button class="main green" id="next" disabled>✔ Esmu palīdzējis</button>`);
  const tc = M.tc = Treat.mount($('stg'), c, { interactive: true, sfx,
    onChange: st => { $('next').disabled = !st.applied.size; },
    onCpr: done => cprGame(done), onShock: () => { cam.shake = 14; buzz([80, 40, 80]); save.cpr = (save.cpr || 0) + 1; } });
  $('next').onclick = () => { const st = tc.st, need = c.need, right = need.filter(id => st.applied.has(id)).length, wrong = st.wrong.size, bonus = (c.bonus || []).filter(id => st.applied.has(id)).length;
    M.picked = st.applied; M.sc.help = clamp(Math.round(right / need.length * 100 - wrong * 25 + bonus * 10), 0, 100);
    if (c.cpr) M.sc.cpr = st.cprScore || 0;
    if (right < need.length) { const miss = need.filter(id => !st.applied.has(id)).map(id => TOOLS[id].i + ' ' + TOOLS[id].n).join(', '); tc.hint(`🤔 Vēl vajadzēja: <b>${miss}</b>`, true); sfx('bad'); $('next').disabled = true; setTimeout(stepDecide, 2600); return; }
    sfx('good'); stepDecide(); };
}
// sirds masāža: 30 spiedieni ritmā 100–120 reizes minūtē (starp spiedieniem ~0,5–0,6 s); atveras virs ainas
function cprGame(done) {
  let taps = [], goodN = 0, n = 0, t0 = performance.now(), raf = 0; const ov = document.createElement('div'); ov.className = 'cprOv';
  ov.innerHTML = `<div class="cprBox"><h2>❤️ Spied ritmā!</h2><p>Spied, kad sarkanais punkts ir zaļajā zonā. Īstā dzīvē – 100–120 reizes minūtē, stipri krūškurvja vidū.</p>
    <div class="cpr"><div class="beat"><div class="zone"></div><div class="dot"></div></div><button class="press">❤️</button><div class="cprInfo">0 / 30</div></div></div>`;
  document.body.appendChild(ov); const dot = ov.querySelector('.dot'), info = ov.querySelector('.cprInfo'), per = 545;
  const loop = () => { const ph = ((performance.now() - t0) % per) / per; dot.style.left = (8 + 84 * (ph < .5 ? ph * 2 : 2 - ph * 2)) + '%'; raf = requestAnimationFrame(loop); }; loop();
  ov.querySelector('.press').addEventListener('pointerdown', e => { e.preventDefault(); const now = performance.now(); n++; sfx('beat'); buzz(20);
    if (taps.length) { const dtp = now - taps[taps.length - 1]; const ok = dtp > 470 && dtp < 660; if (ok) goodN++; info.textContent = `${n} / 30 · ${ok ? '👍 Labi!' : dtp <= 470 ? '⏩ Par ātru' : '⏪ Par lēnu'}`; } else info.textContent = `${n} / 30`;
    taps.push(now); if (n >= 30) { cancelAnimationFrame(raf); const sc = Math.round(goodN / 29 * 100); setTimeout(() => { ov.remove(); done(sc); }, 400); } });
}
function stepDecide() {
  if (M.tc) { M.tc.destroy(); M.tc = null; }
  sheet(`<div class="step">4. solis · Ko tālāk?</div><h2>Vai ${M.c.name.split(',')[0]} jāved uz slimnīcu?</h2>
    <div class="row2"><button class="main red" id="dH">🏥 Vest uz slimnīcu</button><button class="main green" id="dS">🏠 Palīdzēts uz vietas</button></div>`);
  const pick = go => { M.decision = go; M.sc.decide = go === M.c.go ? 100 : 0;
    if (go) { M.state = 'toHospital'; M.t2 = 0; M.bumps2 = M.bumps; M.cond = clamp(55 + (M.sc.help || 0) * .45, 40, 100); M.route = route(amb.x, amb.y, HOSP_BAY.x, HOSP_BAY.y); M.expect2 = M.route.len / 300 + 6;
      closeSheet(); toast(M.c.go ? '🚑 Pacients mašīnā – brauc uz slimnīcu! Mediķis viņu stabilizē.' : '🚑 Labi, vedam pārbaudīt uz slimnīcu.'); if (!amb.siren && M.c.go) toggleSiren(); sfx('door'); }
    else finish(); };
  $('dH').onclick = () => pick(true); $('dS').onclick = () => pick(false);
}
function arriveHospital() { sfx('door'); if (amb.siren) toggleSiren(); finish(); }
function finish() {
  const c = M.c, S1 = M.sc;
  const drive1 = clamp(Math.round(100 - Math.max(0, M.t1 - M.expect) * 1.6 - M.bumps1 * 8), 0, 100);
  let drive = drive1;
  if (M.decision) { const t2 = M.t2, b2 = M.bumps - (M.bumps2 || 0); drive = Math.round((drive1 + clamp(100 - Math.max(0, t2 - M.expect2) * 1.6 - b2 * 8, 0, 100)) / 2); }
  if (!M.decision && c.go) S1.decide = 0;
  const parts = [['🔎 Noskaidroji', S1.ask || 0, 1], ['🩺 Kas noticis', S1.dx || 0, 1], ['🧰 Palīdzība', S1.help || 0, 1.5], ...(c.cpr ? [['❤️ Sirds masāža', S1.cpr || 0, 1]] : []), ['🏥 Lēmums', S1.decide || 0, 1], ['🚑 Brauciens', drive, 1]];
  if (M.decision) parts.push(['🫀 Pacienta stāvoklis', Math.round(M.cond), .8]);
  const wsum = parts.reduce((a, p) => a + p[2], 0), pct = Math.round(parts.reduce((a, p) => a + p[1] * p[2], 0) / wsum);
  const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 45 ? 1 : 0, xp = Math.round(20 + pct * .7), money = Math.round(8 + pct * .25);
  const lv0 = levelOf(save.xp).l; save.xp += xp; save.calls++; if (pct >= 60) save.saved++; if (pct >= 95) save.perfect++; save.best = Math.max(save.best || 0, pct);
  const lv1 = levelOf(save.xp).l; persist(); walletAdd(money); medals();
  M.state = 'result'; $('pBar').classList.remove('on'); sfx(stars >= 2 ? 'win' : 'good');
  const col = v => v >= 80 ? '#2ecc71' : v >= 50 ? '#ffb020' : '#ff3b4e';
  sheet(`<div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><div class="score" style="color:${col(pct)}">${pct}%</div>
    <p style="text-align:center;font-weight:800">${pct >= 90 ? 'Izcils darbs, glābēj! 🦸' : pct >= 70 ? 'Labs darbs! 👍' : pct >= 45 ? 'Pacientam palīdzēts, bet var labāk.' : 'Nākamreiz izdosies labāk! 💪'}</p>
    <div class="parts">${parts.map(([n, v]) => `<div class="part"><span style="width:150px">${n}</span><div class="pb"><i style="width:${v}%;background:${col(v)}"></i></div><em>${v}%</em></div>`).join('')}</div>
    ${M.c.go !== M.decision ? `<div class="fact">${M.c.go ? '🏥 Šim pacientam vajadzēja uz slimnīcu.' : '🏠 Šim pacientam pietika ar palīdzību uz vietas.'}</div>` : ''}
    <div class="fact"><b>💡 Vai zināji?</b><br>${c.fact}<br><small style="color:#9fb0ff">Īstā dzīvē nelaimes gadījumā zvani <b>112</b>.</small></div>
    <p style="text-align:center;font-weight:800">+${xp} XP · <span style="color:#ffd34d">+€${money}</span>${lv1 > lv0 ? ` · 🎉 ${lv1}. līmenis – jauni izsaukumi!` : ''}</p>
    <button class="main red" id="nx">📞 Nākamais izsaukums</button>`);
  $('nx').onclick = () => { closeSheet(); M.state = 'idle'; setTimeout(newCall, 1200); };
}

// ---- logi ----
function sheet(html) { $('sheet').innerHTML = html; $('ov').classList.add('on'); $('sheet').scrollTop = 0; }
function closeSheet() { $('ov').classList.remove('on'); }
let toastT = 0; function toast(t) { const e = $('toast'); e.innerHTML = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('on'), 3200); }

// ---- ainas attēls (vieta + pacients + tavs mediķis) ----
let LOOK = { skin: '#f2c9a0', hat: 'cap', cap: '#1b1b1f' };
// mediķis – tavs tēls no frizētavas (āda, cepure/mati), ātrās palīdzības formā
window.APmedic = (g, x, y, s) => drawMedic(g, x, y, s);
function drawMedic(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); const L = LOOK, rr = (a, b, w, h, r, c) => { g.fillStyle = c; g.beginPath(); g.roundRect(a, b, w, h, r); g.fill(); };
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 0, 13, 4, 0, 0, 7); g.fill();
  rr(-7, -16, 6, 15, 3, '#1f3a5f'); rr(1, -16, 6, 15, 3, '#1f3a5f'); rr(-8, -3, 7, 4, 2, '#222'); rr(1, -3, 7, 4, 2, '#222');
  rr(-10, -36, 20, 22, 7, '#2e8b57'); rr(-10, -28, 20, 3, 0, '#f4d03f'); rr(-10, -20, 20, 3, 0, '#f4d03f');
  g.fillStyle = '#fff'; g.font = 'bold 5px system-ui'; g.textAlign = 'center'; g.fillText('112', 0, -30);
  g.fillStyle = L.skin || '#f2c9a0'; g.beginPath(); g.arc(0, -43, 9, 0, 7); g.fill();
  g.fillStyle = L.cap || '#1b1b1f'; if (L.hat === 'hair') { g.beginPath(); g.arc(0, -45, 9.5, Math.PI * .95, .05); g.fill(); } else if (L.hat === 'beanie') { g.beginPath(); g.arc(0, -45, 9.8, Math.PI, 0); g.fill(); g.beginPath(); g.arc(0, -55, 2.6, 0, 7); g.fill(); } else { g.beginPath(); g.arc(0, -45, 9.8, Math.PI, 0); g.fill(); g.fillRect(-9, -47, 18, 3); }
  g.fillStyle = '#111'; g.beginPath(); g.arc(-3.2, -43, 1.3, 0, 7); g.arc(3.2, -43, 1.3, 0, 7); g.fill();
  g.strokeStyle = '#5d3a2a'; g.lineWidth = 1; g.beginPath(); g.arc(0, -40, 3, .15 * Math.PI, .85 * Math.PI); g.stroke();
  g.fillStyle = '#e74c3c'; g.font = '9px system-ui'; g.fillText('🩺', 12, -24); g.restore(); }

// ================= Zīmēšana =================
function drawWorld(t) {
  const z = cam.z, vx0 = cam.x - W / 2 / z - 80, vx1 = cam.x + W / 2 / z + 80, vy0 = cam.y - H / 2 / z - 80, vy1 = cam.y + H / 2 / z + 80;
  ctx.fillStyle = '#7dbb63'; ctx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
  // ielas
  ctx.fillStyle = '#454a56';
  for (let k = 0; k < N; k++) { const p = k * G; if (p > vy0 - RW && p < vy1 + RW) ctx.fillRect(-RW / 2, p - RW / 2, S + RW, RW); if (p > vx0 - RW && p < vx1 + RW) ctx.fillRect(p - RW / 2, -RW / 2, RW, S + RW); }
  // sastrēgumi – nedaudz sarkanīgs asfalts
  ctx.fillStyle = 'rgba(255,70,70,.10)';
  jams.forEach(key => { const ax = key[0], idx = +key.slice(1, key.indexOf('_')), seg = +key.slice(key.indexOf('_') + 1);
    if (ax === 'h') ctx.fillRect(seg * G + RW / 2, idx * G - RW / 2, G - RW, RW); else ctx.fillRect(idx * G - RW / 2, seg * G + RW / 2, RW, G - RW); });
  // ceļa līnijas, gājēju pārejas, stop līnijas
  ctx.save(); ctx.strokeStyle = '#f3f3f3cc'; ctx.lineWidth = 4; ctx.setLineDash([26, 22]);
  for (let k = 0; k < N; k++) { const p = k * G;
    for (let s = 0; s < N - 1; s++) { const a = s * G + RW / 2 + 30, b = (s + 1) * G - RW / 2 - 30;
      if (p > vy0 && p < vy1 && b > vx0 && a < vx1) { ctx.beginPath(); ctx.moveTo(a, p); ctx.lineTo(b, p); ctx.stroke(); }
      if (p > vx0 && p < vx1 && b > vy0 && a < vy1) { ctx.beginPath(); ctx.moveTo(p, a); ctx.lineTo(p, b); ctx.stroke(); } } }
  ctx.restore();
  ctx.fillStyle = '#f5f5f5d0';
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const X = i * G, Y = j * G; if (X < vx0 - G || X > vx1 + G || Y < vy0 - G || Y > vy1 + G) continue;
    for (let k = -2; k <= 2; k++) { // zebras
      if (i < N - 1) ctx.fillRect(X + RW / 2 + 6, Y + k * 22 - 6, 18, 12); if (i > 0) ctx.fillRect(X - RW / 2 - 24, Y + k * 22 - 6, 18, 12);
      if (j < N - 1) ctx.fillRect(X + k * 22 - 6, Y + RW / 2 + 6, 12, 18); if (j > 0) ctx.fillRect(X + k * 22 - 6, Y - RW / 2 - 24, 12, 18); } }
  // kvartāli
  for (const b of blocks) { if (b.x1 < vx0 || b.x0 > vx1 || b.y1 < vy0 || b.y0 > vy1) continue; drawBlock(b, t); }
  // luksofori: katrai pieejai sava krāsaina stop līnija joslas platumā + luksofors labajā stūrī (sarkans / dzeltens / zaļš)
  const LC = { r: '#ff3b3b', y: '#ffc533', g: '#36e06f' };
  for (let i = 1; i < N - 1; i++) for (let j = 1; j < N - 1; j++) { const X = i * G, Y = j * G; if (X < vx0 - 100 || X > vx1 + 100 || Y < vy0 - 100 || Y > vy1 + 100) continue;
    const hs = lightState(i, j, 'h', t), vs = lightState(i, j, 'v', t), e = RW / 2 + 14;
    const bar = (x, y, w, h, st) => { ctx.fillStyle = LC[st]; ctx.globalAlpha = .85; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; };
    bar(X - e - 6, Y + 4, 8, RW / 2 - 8, hs); bar(X + e - 2, Y - RW / 2 + 4, 8, RW / 2 - 8, hs); bar(X - RW / 2 + 4, Y - e - 6, RW / 2 - 8, 8, vs); bar(X + 4, Y + e - 2, RW / 2 - 8, 8, vs);
    const head = (x, y, st) => { ctx.fillStyle = '#5b6070'; ctx.fillRect(x - 2, y - 2, 4, 14); ctx.fillStyle = '#15171d'; ctx.beginPath(); ctx.roundRect(x - 8, y - 26, 16, 40, 5); ctx.fill();
      ['r', 'y', 'g'].forEach((k, n) => { const on = k === st; ctx.fillStyle = on ? LC[k] : '#2c2f38'; ctx.beginPath(); ctx.arc(x, y - 18 + n * 12, 5, 0, 7); ctx.fill();
        if (on) { ctx.globalAlpha = .35; ctx.beginPath(); ctx.arc(x, y - 18 + n * 12, 11, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } }); };
    head(X - e - 12, Y + e + 14, hs); head(X + e + 12, Y - e - 4, hs); head(X - e - 12, Y - e - 4, vs); head(X + e + 12, Y + e + 14, vs); }
  // bremžu pēdas
  ctx.fillStyle = 'rgba(20,20,24,.28)'; for (const s of skids) { if (s.x < vx0 || s.x > vx1 || s.y < vy0 || s.y > vy1) continue; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.fillRect(-4, -2.5, 8, 5); ctx.restore(); }
  // maršruts uz ielas
  if (M.route && (M.state === 'toPatient' || M.state === 'toHospital')) { ctx.save(); ctx.strokeStyle = M.state === 'toHospital' ? 'rgba(255,90,110,.55)' : 'rgba(255,214,70,.6)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([2, 22]); ctx.lineDashOffset = -t * 60;
    ctx.beginPath(); M.route.pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore(); }
  // pacients
  if (M.state === 'toPatient' || M.state === 'call') { const pu = (t * 1.4) % 1;
    ctx.strokeStyle = `rgba(255,59,78,${1 - pu})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(M.px, M.py, 20 + pu * 60, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,59,78,.25)'; ctx.beginPath(); ctx.arc(M.rx, M.ry, 60, 0, 7); ctx.fill();
    ctx.font = '40px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(M.c.who, M.px, M.py);
    ctx.fillStyle = '#ff3b4e'; ctx.beginPath(); ctx.arc(M.px + 22, M.py - 26, 12, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.fillText('!', M.px + 22, M.py - 25); }
  if (M.state === 'toHospital') { const pu = (t * 1.2) % 1; ctx.strokeStyle = `rgba(255,255,255,${1 - pu})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(HOSP_BAY.x, HOSP_BAY.y, 30 + pu * 50, 0, 7); ctx.stroke(); }
  // mašīnas
  for (const c of cars) { if (c.x < vx0 || c.x > vx1 || c.y < vy0 || c.y > vy1) continue; drawCar(c.x, c.y, c.ang, c.len, 27, c.col, false, t, c); }
  drawCar(amb.x, amb.y, amb.a, 72, 32, '#ffffff', true, t);
}
function drawBlock(b, t) {
  ctx.fillStyle = '#d8d2c6'; ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); // ietve
  ctx.fillStyle = '#c3bcae'; ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, 3); ctx.fillRect(b.x0, b.y1 - 3, b.x1 - b.x0, 3); ctx.fillRect(b.x0, b.y0, 3, b.y1 - b.y0); ctx.fillRect(b.x1 - 3, b.y0, 3, b.y1 - b.y0);
  const ix0 = b.x0 + SWK, iy0 = b.y0 + SWK, ix1 = b.x1 - SWK, iy1 = b.y1 - SWK;
  if (b.kind === 'park') { ctx.fillStyle = '#86c96a'; ctx.beginPath(); ctx.roundRect(ix0, iy0, ix1 - ix0, iy1 - iy0, 18); ctx.fill();
    ctx.strokeStyle = '#e7dcc4'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(ix0 + 10, (iy0 + iy1) / 2); ctx.bezierCurveTo(ix0 + 90, iy0 + 30, ix1 - 90, iy1 - 30, ix1 - 10, (iy0 + iy1) / 2); ctx.stroke(); }
  else if (b.kind === 'plaza') { ctx.fillStyle = '#e4ddcf'; ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0); ctx.strokeStyle = '#d2c9b8'; ctx.lineWidth = 2; for (let x = ix0; x < ix1; x += 26) { ctx.beginPath(); ctx.moveTo(x, iy0); ctx.lineTo(x, iy1); ctx.stroke(); }
    const cx = (ix0 + ix1) / 2, cy = (iy0 + iy1) / 2; ctx.fillStyle = '#9fc9e6'; ctx.beginPath(); ctx.arc(cx, cy, 36, 0, 7); ctx.fill(); ctx.fillStyle = '#c9e6f7'; ctx.beginPath(); ctx.arc(cx, cy, 12 + Math.sin(t * 3) * 2, 0, 7); ctx.fill(); }
  else if (b.kind === 'parking') { ctx.fillStyle = '#5a5f6b'; ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0); ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 2;
    for (let k = 0; k <= 5; k++) { const x = ix0 + 10 + k * ((ix1 - ix0 - 20) / 5); ctx.beginPath(); ctx.moveTo(x, iy0); ctx.lineTo(x, iy0 + 80); ctx.moveTo(x, iy1); ctx.lineTo(x, iy1 - 80); ctx.stroke(); } }
  else if (b.kind === 'hospital') drawHospital(b, ix0, iy0, ix1, iy1, t);
  else if (b.kind === 'fuel') { ctx.fillStyle = '#5c616d'; ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0); const cx = (ix0 + ix1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(cx - 100, iy1 - 150, 214, 100); ctx.fillStyle = '#f4f6fa'; ctx.fillRect(cx - 110, iy1 - 160, 220, 100); ctx.fillStyle = '#16a34a'; ctx.fillRect(cx - 110, iy1 - 160, 220, 14);
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#e53950'; ctx.fillRect(cx - 80 + k * 70, iy1 - 125, 20, 34); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 76 + k * 70, iy1 - 120, 12, 9); }
    ctx.fillStyle = '#16a34a'; ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⛽ DEGVIELA', cx, iy0 + 40); }
  else { ctx.fillStyle = '#9ccc82'; ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0); }
  for (const it of b.items) {
    if (it.t === 'bld') { const w = it.x1 - it.x0, h = it.y1 - it.y0;
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(it.x0 + it.h * .6, it.y0 + it.h, w, h); // ēna
      ctx.fillStyle = it.col; ctx.fillRect(it.x0, it.y0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(it.x0, it.y0, w, 4); ctx.fillRect(it.x0, it.y0, 4, h);
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(it.x0, it.y1 - 4, w, 4); ctx.fillRect(it.x1 - 4, it.y0, 4, h);
      ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; ctx.strokeRect(it.x0 + 9, it.y0 + 9, w - 18, h - 18);
      it.det.forEach(d => { const x = it.x0 + 16 + d.u * (w - 46), y = it.y0 + 16 + d.v * (h - 46);
        if (d.k < .4) { ctx.fillStyle = '#9aa3ad'; ctx.fillRect(x, y, 22, 16); ctx.fillStyle = '#7d858f'; ctx.beginPath(); ctx.arc(x + 11, y + 8, 5, 0, 7); ctx.fill(); }
        else if (d.k < .7) { ctx.fillStyle = '#2f4b7c'; ctx.fillRect(x, y, 28, 18); ctx.strokeStyle = '#8fb0e0'; ctx.lineWidth = 1; for (let q = 1; q < 4; q++) { ctx.beginPath(); ctx.moveTo(x + q * 7, y); ctx.lineTo(x + q * 7, y + 18); ctx.stroke(); } }
        else { ctx.fillStyle = '#b8b2a6'; ctx.beginPath(); ctx.arc(x + 10, y + 10, 10, 0, 7); ctx.fill(); } }); }
    else if (it.t === 'pond') { ctx.fillStyle = '#5fa8d8'; ctx.beginPath(); ctx.ellipse(it.x, it.y, it.r, it.r * .7, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(it.x - it.r * .3, it.y - it.r * .2, it.r * .3, it.r * .12, -.3, 0, 7); ctx.fill(); }
    else if (it.t === 'pcar') drawCar(it.x, it.y, Math.PI / 2, 50, 26, it.col, false, 0);
  }
  for (const tr of b.trees) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.arc(tr.x + 5, tr.y + 6, tr.r, 0, 7); ctx.fill();
    ctx.fillStyle = '#3f8f3a'; ctx.beginPath(); ctx.arc(tr.x, tr.y, tr.r, 0, 7); ctx.fill(); ctx.fillStyle = '#5bb04f'; ctx.beginPath(); ctx.arc(tr.x - tr.r * .25, tr.y - tr.r * .25, tr.r * .6, 0, 7); ctx.fill(); }
}
function drawHospital(b, ix0, iy0, ix1, iy1, t) {
  ctx.fillStyle = '#9ccc82'; ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0);
  ctx.fillStyle = '#6b7080'; ctx.fillRect(ix0 + 40, iy1 - 70, ix1 - ix0 - 80, 70); // uzbrauktuve
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(ix0 + 26, iy0 + 18, ix1 - ix0 - 40, iy1 - iy0 - 100);
  ctx.fillStyle = '#f4f6fa'; ctx.fillRect(ix0 + 14, iy0 + 6, ix1 - ix0 - 28, iy1 - iy0 - 96);
  ctx.fillStyle = '#dfe5ee'; ctx.fillRect(ix0 + 14, iy1 - 96, ix1 - ix0 - 28, 6);
  const cx = (ix0 + ix1) / 2, cy = iy0 + 6 + (iy1 - iy0 - 96) / 2;
  ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, 52, 0, 7); ctx.stroke(); // helikoptera laukums
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 58px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', cx, cy + 3);
  ctx.fillStyle = '#e53950'; ctx.fillRect(ix0 + 30, iy0 + 20, 14, 42); ctx.fillRect(ix0 + 16, iy0 + 34, 42, 14); ctx.fillRect(ix1 - 44, iy0 + 20, 14, 42); ctx.fillRect(ix1 - 58, iy0 + 34, 42, 14);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.fillText('SLIMNĪCA', cx, iy1 - 40);
}
function drawCar(x, y, a, L, Wd, col, isAmb, t, c) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.roundRect(-L / 2 + 4, -Wd / 2 + 5, L, Wd, 8); ctx.fill();
  if (isAmb && amb.siren) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const on = Math.sin(t * 16) > 0;
    const g1 = ctx.createRadialGradient(4, 0, 4, 4, 0, 110); g1.addColorStop(0, on ? 'rgba(255,40,60,.45)' : 'rgba(40,110,255,.45)'); g1.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(4, 0, 110, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-L / 2, -Wd / 2, L, Wd, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-L / 2 + 6, -Wd / 2 + 2, L - 12, 3);
  if (isAmb) {
    ctx.fillStyle = '#e53950'; ctx.fillRect(-L / 2 + 4, -Wd / 2, L - 10, 5); ctx.fillRect(-L / 2 + 4, Wd / 2 - 5, L - 10, 5);
    ctx.fillStyle = '#e53950'; ctx.fillRect(-12, -3, 22, 6); ctx.fillRect(-4, -11, 6, 22); // krusts uz jumta
    ctx.fillStyle = '#25324a'; ctx.beginPath(); ctx.roundRect(L / 2 - 20, -Wd / 2 + 4, 13, Wd - 8, 4); ctx.fill(); // vējstikls
    const on = Math.sin(t * 16) > 0; ctx.fillStyle = amb.siren ? (on ? '#ff2a43' : '#5a1520') : '#7a2a33'; ctx.fillRect(L / 2 - 30, -Wd / 2 + 2, 7, Wd / 2 - 2);
    ctx.fillStyle = amb.siren ? (!on ? '#2f7bff' : '#14244d') : '#24365a'; ctx.fillRect(L / 2 - 30, 0, 7, Wd / 2 - 2);
  } else {
    ctx.fillStyle = '#1f2633'; ctx.beginPath(); ctx.roundRect(L / 2 - 20, -Wd / 2 + 3, 11, Wd - 6, 3); ctx.fill(); ctx.beginPath(); ctx.roundRect(-L / 2 + 6, -Wd / 2 + 4, 8, Wd - 8, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.roundRect(-L / 2 + 16, -Wd / 2 + 4, L - 38, Wd - 8, 4); ctx.fill();
  }
  ctx.fillStyle = '#fff6c4'; ctx.fillRect(L / 2 - 3, -Wd / 2 + 3, 3, 6); ctx.fillRect(L / 2 - 3, Wd / 2 - 9, 3, 6);
  const br = c && c.brake; ctx.fillStyle = br ? '#ff2020' : '#a83a3a'; ctx.fillRect(-L / 2 - (br ? 1 : 0), -Wd / 2 + 3, br ? 4 : 2, 6); ctx.fillRect(-L / 2 - (br ? 1 : 0), Wd / 2 - 9, br ? 4 : 2, 6);
  if (br) { ctx.fillStyle = 'rgba(255,40,40,.25)'; ctx.beginPath(); ctx.arc(-L / 2 - 4, 0, 14, 0, 7); ctx.fill(); }
  // pagriezienu rādītāji (oranži mirgo): pa labi – labā puse (+y), pa kreisi – kreisā
  const pl = c && (c.turn ? (wrapA(angOf(c.turn.ax, c.turn.dir) - angOf(c.ax, c.dir)) > 0 ? 'r' : 'l') : c.plan);
  if ((pl === 'r' || pl === 'l') && Math.sin(t * 9) > 0) { ctx.fillStyle = '#ffae1a'; const sy = pl === 'r' ? Wd / 2 - 3 : -Wd / 2 - 1; ctx.fillRect(L / 2 - 6, sy, 6, 4); ctx.fillRect(-L / 2, sy, 6, 4); }
  ctx.restore();
}
function drawMini(t) {
  const k = 240 / (S + RW), g = mctx; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#4f7d43'; g.fillRect(0, 0, 240, 240); g.save(); g.translate(RW / 2 * k, RW / 2 * k); g.scale(k, k);
  g.strokeStyle = '#2b2f3a'; g.lineWidth = RW * .7; for (let i = 0; i < N; i++) { g.beginPath(); g.moveTo(i * G, 0); g.lineTo(i * G, S); g.moveTo(0, i * G); g.lineTo(S, i * G); g.stroke(); }
  g.strokeStyle = '#ff4d4d'; jams.forEach(key => { const ax = key[0], idx = +key.slice(1, key.indexOf('_')), seg = +key.slice(key.indexOf('_') + 1); g.beginPath(); if (ax === 'h') { g.moveTo(seg * G, idx * G); g.lineTo((seg + 1) * G, idx * G); } else { g.moveTo(idx * G, seg * G); g.lineTo(idx * G, (seg + 1) * G); } g.stroke(); });
  if (M.route && (M.state === 'toPatient' || M.state === 'toHospital')) { g.strokeStyle = '#ffd34d'; g.lineWidth = 60; g.lineJoin = 'round'; g.beginPath(); M.route.pts.forEach((p, n) => n ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke(); }
  g.fillStyle = '#fff'; g.fillRect(hospBlock.x0, hospBlock.y0, hospBlock.x1 - hospBlock.x0, hospBlock.y1 - hospBlock.y0); g.fillStyle = '#e53950'; const hx = (hospBlock.x0 + hospBlock.x1) / 2, hy = (hospBlock.y0 + hospBlock.y1) / 2; g.fillRect(hx - 40, hy - 120, 80, 240); g.fillRect(hx - 120, hy - 40, 240, 80);
  FUEL.forEach(f => { g.fillStyle = amb.fuel < 25 && Math.sin(t * 6) > 0 ? '#fff' : '#22c55e'; g.beginPath(); g.arc(f.x, f.y - 120, 110, 0, 7); g.fill(); });
  if (M.state === 'toPatient' || M.state === 'call') { g.fillStyle = Math.sin(t * 8) > 0 ? '#ff3b4e' : '#fff'; g.beginPath(); g.arc(M.px, M.py, 130, 0, 7); g.fill(); }
  g.save(); g.translate(amb.x, amb.y); g.rotate(amb.a); g.fillStyle = '#ffd34d'; g.strokeStyle = '#000'; g.lineWidth = 24; g.beginPath(); g.moveTo(170, 0); g.lineTo(-110, -110); g.lineTo(-60, 0); g.lineTo(-110, 110); g.closePath(); g.stroke(); g.fill(); g.restore();
  g.restore();
}
// bultiņa ekrāna malā, ja mērķis nav redzams
function drawPointer() { let tx, ty; if (M.state === 'toPatient') { tx = M.rx; ty = M.ry; } else if (M.state === 'toHospital') { tx = HOSP_BAY.x; ty = HOSP_BAY.y; } else return;
  const sx = (tx - cam.x) * cam.z + W / 2, sy = (ty - cam.y) * cam.z + H / 2; if (sx > 30 && sx < W - 30 && sy > 150 && sy < H - 150) return;
  const a = Math.atan2(sy - H / 2, sx - W / 2), r = Math.min(W, H) * .36, px = W / 2 + Math.cos(a) * r, py = H / 2 + Math.sin(a) * r;
  ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.fillStyle = M.state === 'toHospital' ? '#ff5a6a' : '#ffd34d'; ctx.strokeStyle = '#0008'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-12, -15); ctx.lineTo(-5, 0); ctx.lineTo(-12, 15); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); }

// ================= Cikls =================
let last = performance.now(), T = 0;
function frame(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
  updateCars(dt, T); updateAmb(dt);
  if (M.state === 'toPatient') M.t += dt; if (M.state === 'toHospital') { M.t2 += dt; M.cond = Math.max(5, M.cond - dt * (M.c.cpr ? .8 : .35)); }
  if ((M.state === 'toPatient' || M.state === 'toHospital') && (M.rt -= dt) <= 0) { M.rt = .6; M.route = M.state === 'toPatient' ? route(amb.x, amb.y, M.rx, M.ry) : route(amb.x, amb.y, HOSP_BAY.x, HOSP_BAY.y); }
  // kamera: seko ar skatu uz priekšu, ātrumā nedaudz attālinās
  const base = clamp(Math.min(W, H) / 640, .5, 1.05), zt = base * (1 - .16 * clamp(Math.abs(amb.v) / 430, 0, 1));
  cam.z = lerp(cam.z, zt, Math.min(1, dt * 2)); const lx = amb.x + Math.cos(amb.a) * amb.v * .45, ly = amb.y + Math.sin(amb.a) * amb.v * .45;
  cam.x = lerp(cam.x, lx, Math.min(1, dt * 4)); cam.y = lerp(cam.y, ly, Math.min(1, dt * 4)); cam.shake *= Math.pow(.01, dt);
  const sh = cam.shake > .3 ? (Math.random() - .5) * cam.shake : 0;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = '#7dbb63'; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(DPR * cam.z, 0, 0, DPR * cam.z, DPR * (W / 2 - cam.x * cam.z + sh), DPR * (H / 2 - cam.y * cam.z + sh)); drawWorld(T);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); drawPointer();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .45, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  drawMini(T); hud(); updateAudio();
  requestAnimationFrame(frame); }

let hudKey = '';
function hud() {
  const L = levelOf(save.xp); let task = '', dist = 0, actOn = false, actI = '🩺', actT = 'Palīdzēt', go = false;
  if (M.state === 'toPatient') { dist = Math.round(M.route.len / 10); task = `${M.c.who} ${M.c.call}<small>📍 ${streetOf(M.rx, M.ry)} · ⏱ ${Math.floor(M.t)} s</small>`; actOn = near(M.rx, M.ry, 130) && Math.abs(amb.v) < 70; }
  else if (M.state === 'toHospital') { dist = Math.round(M.route.len / 10); task = `🏥 Ved pacientu uz slimnīcu<small>${M.c.who} ${M.c.name} · ⏱ ${Math.floor(M.t2)} s</small>`; actOn = near(HOSP_BAY.x, HOSP_BAY.y, 140) && Math.abs(amb.v) < 70; actI = '🏥'; actT = 'Nodot'; go = true; }
  else if (M.state === 'scene') task = '🩺 Palīdzi pacientam'; else task = '📻 Gaidi izsaukumu…';
  if (nearFuel() && Math.abs(amb.v) < 70 && M.state !== 'scene' && amb.fuel < 99) { actOn = true; actI = '⛽'; actT = `€${fuelCost()}`; go = true; }
  const key = [L.l, L.cur, wallet, task, dist, actOn, actI, actT, Math.round(M.cond), Math.round(amb.fuel)].join('|'); if (key === hudKey) return; hudKey = key;
  $('sLv').textContent = `🚑 ${L.l}. līmenis`; $('sXp').style.width = (L.cur / L.need * 100) + '%'; $('sMoney').innerHTML = `<b style="color:${wallet < 0 ? '#ff5a6a' : '#ffd34d'};font-size:14px;display:inline">💰 €${wallet}</b> <span style="color:${amb.fuel < 20 ? '#ff5a6a' : '#cfe'}">⛽ ${Math.round(amb.fuel)}%</span>`;
  $('task').innerHTML = (dist ? `<span class="dist">${dist} m</span>` : '') + task;
  const b = $('bAct'); b.classList.toggle('off', !actOn); b.classList.toggle('go', go); $('bActI').textContent = actI; $('bActT').textContent = actT;
  const pb = $('pBar'); pb.classList.toggle('on', M.state === 'toHospital'); if (M.state === 'toHospital') { const c = Math.round(M.cond); $('pFill').style.width = c + '%'; $('pFill').style.background = c > 60 ? '#2ecc71' : c > 30 ? '#ffb020' : '#ff3b4e'; $('pTxt').textContent = `🫀 Pacienta stāvoklis ${c}% – brauc uzmanīgi!`; }
}

// ================= Skaņa =================
let AC = null, sirO = null, sirG = null, engO = null, engG = null;
function audioInit() { if (AC) { if (AC.state === 'suspended') AC.resume(); return; } try { AC = new (window.AudioContext || window.webkitAudioContext)();
  sirO = AC.createOscillator(); sirO.type = 'triangle'; sirG = AC.createGain(); sirG.gain.value = 0; sirO.connect(sirG); sirG.connect(AC.destination); sirO.start();
  engO = AC.createOscillator(); engO.type = 'sawtooth'; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; engG = AC.createGain(); engG.gain.value = 0; engO.connect(f); f.connect(engG); engG.connect(AC.destination); engO.start(); } catch (e) {} }
function updateAudio() { if (!AC) return; const T0 = AC.currentTime;
  // Eiropas divu toņu sirēna (ī-ā)
  sirO.frequency.setTargetAtTime(Math.floor(T * 1.6) % 2 ? 640 : 880, T0, .01); sirG.gain.setTargetAtTime(amb.siren && !$('ov').classList.contains('on') ? .045 : 0, T0, .05);
  engO.frequency.setTargetAtTime(48 + Math.abs(amb.v) * .22, T0, .05); engG.gain.setTargetAtTime(.02 + Math.abs(amb.v) / 430 * .05, T0, .1); }
function tone(f0, f1, d, type = 'sine', vol = .12, delay = 0) { if (!AC) return; const t0 = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + d);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + d); o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + d + .05); }
function sfx(k) { if (!AC) return;
  if (k === 'bump') tone(140, 60, .25, 'square', .15); else if (k === 'tick') tone(900, 1200, .06, 'sine', .08); else if (k === 'good') [523, 659, 784].forEach((f, i) => tone(f, f, .18, 'triangle', .1, i * .09));
  else if (k === 'bad') tone(300, 160, .3, 'square', .08); else if (k === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .25, 'triangle', .12, i * .1));
  else if (k === 'call') [880, 660, 880, 660].forEach((f, i) => tone(f, f, .14, 'square', .07, i * .16)); else if (k === 'beat') tone(180, 90, .12, 'sine', .25);
  else if (k === 'shock') tone(1600, 80, .5, 'sawtooth', .14); else if (k === 'door') tone(220, 180, .12, 'square', .06); }

// ================= Saglabāšana, nauda, medaļas =================
const ONLINE = location.protocol === 'https:'; let UID = null, NAME = '', NICK = '', wallet = 0;
const LKEY = () => 'apSave' + (UID ? ':' + UID : '');
function persist() { save.fuel = Math.round(amb.fuel); try { localStorage.setItem(LKEY(), JSON.stringify(save)); } catch (e) {} if (UID) firebase.database().ref('ap/saves/' + UID).set(save).catch(() => {}); }
function walletAdd(m) { wallet = wallet + m; if (UID) TW.wallet.add(UID, m).then(v => { wallet = v; }).catch(() => {}); }
function medals() { if (!UID || !window.TWA) return; const L = levelOf(save.xp).l;
  TWA.sync(UID, { apCalls: save.calls, apSaved: save.saved, apCpr: save.cpr || 0, apPerfect: save.perfect || 0, apLevel: L }).then(n => n.forEach((m, i) => setTimeout(() => toast(`🏅 Jauna medaļa!<br><span style="font-size:28px">${m.i}</span> ${TWA.title ? TWA.title(m) : m.t}`), 3600 * i + 1500))).catch(() => {}); }
try { const s = JSON.parse(localStorage.getItem('apSave')); if (s && !ONLINE) save = Object.assign(save, s); } catch (e) {}
function start() { if (save.fuel != null) amb.fuel = save.fuel; requestAnimationFrame(frame); intro(); }
function intro() {
  sheet(`<div class="step">Tailers World · pilsēta</div><h2>🚑 Ātrā palīdzība 112</h2>
    <p>Tu esi ātrās palīdzības brigāde. Brauc pie pacientiem, noskaidro, kas noticis, palīdzi un, ja vajag, ved uz slimnīcu.</p>
    <div class="fact">${isTouch ? '🕹️ Pieskaries <b>jebkur uz kartes</b> un velc pirkstu uz to pusi, kur jābrauc – tur parādās kursorsvira.' : '⌨️ Brauc ar <b>bultiņām</b> (vai W A D), <b>S</b> – sirēna, <b>E</b> – palīdzēt.'}<br>🚨 <b>Sirēna</b> – mašīnas palaiž tevi garām.<br>🟡 Dzeltenā līnija rāda ceļu. Kartē sarkanie ceļi – sastrēgumi.<br>⛽ Degviela maksā – uzpildi benzīntankā. 💥 Avārija = remonts −€3.</div>
    <button class="main red" id="st">Sākt maiņu</button>`);
  $('st').onclick = () => { audioInit(); closeSheet(); setTimeout(newCall, 800); };
}
if (ONLINE && window.firebase && window.TW_FIREBASE) {
  firebase.auth().onAuthStateChanged(async u => {
    if (!u) { location.href = '../index.html'; return; }
    UID = u.uid; NAME = u.email.split('@')[0]; const db = firebase.database();
    try { const v = (await db.ref('users/' + UID).get()).val() || {}; if (v.name) NAME = v.name; NICK = v.nick || ''; if (v.look) LOOK = Object.assign(LOOK, v.look); } catch (e) {}
    try { const s = (await db.ref('ap/saves/' + UID).get()).val(); if (s) save = Object.assign(save, s); else { const l = JSON.parse(localStorage.getItem(LKEY())); if (l) save = Object.assign(save, l); } } catch (e) {}
    TW.wallet.watch(UID, v => { if (v != null) { wallet = v; hudKey = ''; } });
    if (window.TW) await TW.ready;
    // spēle vēl nav atvērta visiem – pagaidām tikai admini/moderatori var testēt
    if (window.TW && !TW.isStaff(UID)) { sheet(`<h2>🚑 Ātrā palīdzība 112</h2><p>Drīzumā! Spēle vēl top. 🔒</p><a class="main" style="display:block;text-align:center;text-decoration:none" href="../index.html">← Uz sākumlapu</a>`); return; }
    if (window.TW) { TW.heartbeat(UID, () => ({ game: 'Ātrā palīdzība', where: M.state === 'toHospital' ? 'Ved pacientu uz slimnīcu' : M.state === 'scene' ? 'Pie pacienta' : `Līm. ${levelOf(save.xp).l}`, name: NAME, nick: NICK })); }
    db.ref('kicks/' + UID).on('value', s => { const k = s.val(); if (k && k.until > TW.now()) { alert('Tevi uz laiku izmeta no spēles. Spēlē draudzīgi! 🙂'); location.href = '../index.html'; } }, () => {});
    if (window.TWA) TWA.load ? TWA.load(UID).catch(() => {}) : 0;
    start();
  });
} else start();
