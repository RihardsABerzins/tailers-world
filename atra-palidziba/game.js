// Ātrā palīdzība 112 – pilsēta no putna lidojuma. Brauc ar ātro palīdzību (kursorsvira / bultiņas), satiksme, luksofori, sastrēgumi.
// Izsaukums → brauc pie pacienta → noskaidro (jautājumi) → kas noticis → palīdzība no somas (+ sirds masāža ritmā) → uz slimnīcu vai uz vietas → rezultāts %.
// Teksti latviski. Dati Firebase: ap/saves/{uid}; nauda – kopīgais maciņš (TW.wallet); izskats – users/{uid}/look.
'use strict';
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const mini = document.getElementById('mini'), mctx = mini.getContext('2d');
const $ = id => document.getElementById(id);
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
if (!isTouch) document.body.classList.add('kb');
// ja tomēr pieskaras ekrānam (piem. skārienjūtīgs dators) – rāda kursorsviru
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') document.body.classList.remove('kb'); }, true);
let W = innerWidth, H = innerHeight, DPR = Math.min(2, devicePixelRatio || 1);
function resize() { W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; }
addEventListener('resize', resize); resize();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ================= Pilsēta =================
const G = 440, RW = 124, LANE = 31, N = 14, S = (N - 1) * G, SWK = 18; // ielu solis, ielas platums, joslas nobīde, ielu skaits, pilsētas izmērs, ietve
const H_NAMES = ['Brīvības', 'Krasta', 'Saules', 'Liepu', 'Ozolu', 'Skolas', 'Dzirnavu', 'Parka', 'Ābeļu', 'Jūras', 'Stacijas', 'Lazdu', 'Priežu', 'Upes'];
const V_NAMES = ['Tilta', 'Lāčplēša', 'Bērzu', 'Rūpniecības', 'Kalna', 'Vējā', 'Rožu', 'Avotu', 'Meža', 'Pils', 'Ostas', 'Dārza', 'Kļavu', 'Ezera'];
const RNG = mulberry(112);
const HOSP = { i: 6, j: 5 };
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
    lots.forEach(([a, c, d, e]) => { const m = 7; b.items.push({ t: 'bld', x0: a + m, y0: c + m, x1: d - m, y1: e - m, col: ROOF[(RNG() * ROOF.length) | 0], h: 36 + RNG() * RNG() * 150, win: RNG() * 1e9 | 0, det: Array.from({ length: 1 + (RNG() * 3 | 0) }, () => ({ u: RNG(), v: RNG(), k: RNG() })) }); });
  } else if (b.kind === 'park') { // parks: zāles laukumi, līkumoti celiņi, dīķis, puķu dobes, soliņi, lapu koki un egles
    const W_ = ix1 - ix0, H_ = iy1 - iy0, P = b.park = { patches: [], paths: [], benches: [], beds: [] };
    for (let k = 0; k < 9; k++) P.patches.push({ x: ix0 + RNG() * W_, y: iy0 + RNG() * H_, rx: 30 + RNG() * 50, ry: 20 + RNG() * 40, a: RNG() * 3, c: ['#7fc062', '#8acb6c', '#76b65a', '#93cf74'][(RNG() * 4) | 0] });
    const ent = [[ix0, iy0 + H_ * (.3 + RNG() * .4)], [ix1, iy0 + H_ * (.3 + RNG() * .4)], [ix0 + W_ * (.3 + RNG() * .4), iy0], [ix0 + W_ * (.3 + RNG() * .4), iy1]], mid = [ix0 + W_ * (.4 + RNG() * .2), iy0 + H_ * (.4 + RNG() * .2)];
    ent.forEach(e => { if (RNG() < .8) P.paths.push([e, [(e[0] + mid[0]) / 2 + (RNG() - .5) * 60, (e[1] + mid[1]) / 2 + (RNG() - .5) * 60], mid]); });
    if (!P.paths.length) P.paths.push([ent[0], [(ent[0][0] + mid[0]) / 2, mid[1] - 40], mid]);
    P.paths.forEach(pp => { if (RNG() < .7) { const t_ = .45 + RNG() * .2, q = [lerp(lerp(pp[0][0], pp[1][0], t_), lerp(pp[1][0], pp[2][0], t_), t_), lerp(lerp(pp[0][1], pp[1][1], t_), lerp(pp[1][1], pp[2][1], t_), t_)]; P.benches.push({ x: q[0] + 14, y: q[1] + 10, a: RNG() < .5 ? 0 : Math.PI / 2 }); } });
    P.mid = mid;
    if (RNG() < .65) { const q = [ix0 + 40 + RNG() * (W_ - 80), iy0 + 40 + RNG() * (H_ - 80)]; if (Math.hypot(q[0] - mid[0], q[1] - mid[1]) > 70) b.items.push({ t: 'pond', x: q[0], y: q[1], r: 34 + RNG() * 24, lil: Array.from({ length: 4 }, () => [RNG() - .5, RNG() - .5]) }); }
    for (let k = 0; k < 3; k++) P.beds.push({ x: ix0 + 30 + RNG() * (W_ - 60), y: iy0 + 30 + RNG() * (H_ - 60), r: 12 + RNG() * 10, c: ['#ff5a7a', '#ffd34d', '#b388ff', '#ff8a3d'][(RNG() * 4) | 0] });
    for (let k = 0; k < 18; k++) { const x = ix0 + 16 + RNG() * (W_ - 32), y = iy0 + 16 + RNG() * (H_ - 32);
      if (Math.hypot(x - mid[0], y - mid[1]) < 40) continue; b.trees.push({ x, y, r: 13 + RNG() * 13, fir: RNG() < .3, tint: RNG() }); }
  } else if (b.kind === 'parking') {
    for (let k = 0; k < 10; k++) if (RNG() < .7) b.items.push({ t: 'pcar', x: ix0 + 30 + (k % 5) * ((ix1 - ix0 - 60) / 4), y: k < 5 ? iy0 + 50 : iy1 - 50, col: ['#e74c3c', '#3498db', '#f1c40f', '#ecf0f1', '#2c3e50', '#9b59b6'][(RNG() * 6) | 0] });
  }
  if (b.kind === 'hospital') b.items.push({ t: 'bld', hosp: true, x0: ix0 + 14, y0: iy0 + 6, x1: ix1 - 14, y1: iy1 - 96, col: '#f4f6fa', h: 120, win: 7, det: [] });
  // koki uz ietves
  for (let k = 0; k < 6; k++) { const s = RNG(), side = (RNG() * 4) | 0, p = .1 + s * .8;
    const tx = side < 2 ? lerp(x0, x1, p) : side === 2 ? x0 + 9 : x1 - 9, ty = side >= 2 ? lerp(y0, y1, p) : side === 0 ? y0 + 9 : y1 - 9;
    if (b.kind !== 'hospital') b.trees.push({ x: tx, y: ty, r: 11 + RNG() * 5, side: true }); }
  blocks.push(b);
}
// benzīntanki (degviela maksā naudu)
[[1, 6], [7, 1], [6, 9], [11, 3], [10, 11]].forEach(([i, j]) => { const b = blocks.find(q => q.i === i && q.j === j); if (b && b.kind !== 'hospital') { b.kind = 'fuel'; b.trees = b.trees.filter(t => t.side); const cx = (b.x0 + b.x1) / 2, by = b.y1 - SWK;
  b.items = [{ t: 'bld', fuel: true, x0: cx - 110, y0: by - 160, x1: cx + 110, y1: by - 60, col: '#f4f6fa', h: 30, win: 3, det: [] }]; } });
const FUEL = blocks.filter(b => b.kind === 'fuel').map(b => ({ x: (b.x0 + b.x1) / 2, y: b.y1 + 34, b }));
const hospBlock = blocks.find(b => b.kind === 'hospital');
const LAMPS = []; blocks.forEach(b => { [[b.x0 + 8, b.y0 + 8], [b.x1 - 8, b.y0 + 8], [b.x0 + 8, b.y1 - 8], [b.x1 - 8, b.y1 - 8], [(b.x0 + b.x1) / 2, b.y0 + 8], [(b.x0 + b.x1) / 2, b.y1 - 8], [b.x0 + 8, (b.y0 + b.y1) / 2], [b.x1 - 8, (b.y0 + b.y1) / 2]].forEach(([x, y]) => LAMPS.push({ x, y })); });
const HOSP_BAY = { x: (hospBlock.x0 + hospBlock.x1) / 2, y: hospBlock.y1 + 34 }; // uzbrauktuve uz ielas pie slimnīcas
// sastrēgumu posmi (ielas daļa starp krustojumiem): tur mašīnas brauc lēni un to ir daudz
const jams = new Set();
while (jams.size < 12) { const ax = RNG() < .5 ? 'h' : 'v', idx = 1 + (RNG() * (N - 2) | 0), seg = (RNG() * (N - 1)) | 0; jams.add(`${ax}${idx}_${seg}`); }
const isJam = (ax, idx, s) => jams.has(`${ax}${idx}_${Math.floor(clamp(s, 0, S - 1) / G)}`);
// luksofors krustojumā (i,j): 20 s cikls – horizontālā iela zaļa 0–7.5, dzeltena 7.5–9.5, abas sarkanas līdz 10; vertikālā 10–17.5 zaļa, 17.5–19.5 dzeltena
const lightOff = (i, j) => ((i * 7 + j * 13) % 20);
function lightState(i, j, ax, t) { if (typeof isNight === 'function' && isNight()) return 'f'; const p = (t + lightOff(i, j)) % 20, q = ax === 'h' ? p : (p + 10) % 20; return q < 7.5 ? 'g' : q < 9.5 ? 'y' : 'r'; }
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
function spawnCar(ax, idx, s, dir) { const c = { k: cars.length, off: false, ax, idx, s, dir, v: 0, max: 150 + Math.random() * 80, col: CAR_COLS[(Math.random() * CAR_COLS.length) | 0], pull: 0, stun: 0, ang: angOf(ax, dir), len: 50 + Math.random() * 12, plan: null, turn: null, brake: false };
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
  const night = isNight();
  for (const c of cars) {
    // naktī ~60% mašīnu nav uz ielām (pazūd/parādās tikai ārpus redzesloka)
    const wantOff = night && c.k % 5 < 3; if (wantOff !== c.off && Math.hypot(c.x - cam.x, c.y - cam.y) > 900) c.off = wantOff; if (c.off) continue;
    if (c.stun > 0) { c.stun -= dt; c.v = 0; c.brake = true; continue; }
    // pret „mūžīgo” gaidīšanu: stāv >3 s pie pagrieziena – izvēlas citu virzienu; iestrēdzis >12 s ārpus redzesloka – parādās citur
    c.wait = c.v < 2 ? (c.wait || 0) + dt : 0;
    if (c.wait > 12 && Math.hypot(c.x - cam.x, c.y - cam.y) > 900) { for (let k2 = 0; k2 < 20; k2++) { const ax = Math.random() < .5 ? 'h' : 'v', idx = (Math.random() * N) | 0, ss = 60 + Math.random() * (S - 120), dir = Math.random() < .5 ? 1 : -1, tmp = { ax, idx, s: ss, dir, pull: 0 }, q = laneXY(tmp);
        if (Math.hypot(q.x - cam.x, q.y - cam.y) > 900 && !cars.some(o => o !== c && Math.hypot(o.x - q.x, o.y - q.y) < 140)) { Object.assign(c, { ax, idx, s: ss, dir, x: q.x, y: q.y, ang: angOf(ax, dir), turn: null, plan: null, v: 0, wait: 0 }); break; } } continue; }
    // ---- pagrieziens pa līkni krustojumā ----
    if (c.turn) { const T_ = c.turn; let block = false;
      for (const o of cars) if (o !== c && !o.off && Math.hypot(o.x - c.x, o.y - c.y) < 58) { const fx = Math.cos(c.ang), fy = Math.sin(c.ang); if ((o.x - c.x) * fx + (o.y - c.y) * fy > 10) block = true; }
      if (!amb.heli && Math.hypot(amb.x - c.x, amb.y - c.y) < 70) block = true;
      c.v = lerp(c.v, block ? 0 : 95, Math.min(1, dt * 3)); T_.t = Math.min(1, T_.t + c.v * dt / T_.len); const p = bez(T_.p0, T_.p1, T_.p2, T_.t), p2 = bez(T_.p0, T_.p1, T_.p2, Math.min(1, T_.t + .02));
      c.x = p.x; c.y = p.y; if (T_.t < .99) c.ang = Math.atan2(p2.y - p.y, p2.x - p.x); c.brake = block;
      if (T_.t >= 1) { c.ax = T_.ax; c.idx = T_.idx; c.dir = T_.dir; c.s = T_.s; c.turn = null; c.plan = null; c.ang = angOf(c.ax, c.dir); }
      continue; }
    let target = isJam(c.ax, c.idx, c.s) ? 50 : c.max;
    if (c.ahead && !c.ahead.off) { const gap = (c.ahead.s - c.s) * c.dir; if (gap < 66) target = 0; else if (gap < 140) target = Math.min(target, c.ahead.v * .9 + (gap - 66)); }
    // jebkura mašīna tieši priekšā (arī tā, kas tikko nogriezās šajā joslā) – nebrauc tai cauri
    { const fx = Math.cos(c.ang), fy = Math.sin(c.ang); for (const o of cars) { if (o === c || o.off) continue; const dx = o.x - c.x, dy = o.y - c.y; if (Math.abs(dx) > 120 || Math.abs(dy) > 120) continue;
      const fwd = dx * fx + dy * fy, lat = Math.abs(-dx * fy + dy * fx); if (fwd > 0 && lat < 24) { if (fwd < 62) { target = 0; if (fwd < 50) c.v = 0; } else if (fwd < 120) target = Math.min(target, o.v * .9 + (fwd - 62)); } } }
    // nākamais krustojums, stop līnija, luksofors (dzeltenajā apstājas, ja var paspēt)
    const next = c.dir > 0 ? Math.ceil((c.s + 1) / G) * G : Math.floor((c.s - 1) / G) * G, ni = Math.round(next / G), stop = next - c.dir * (RW / 2 + 14), d = (stop - c.s) * c.dir;
    if (!c.plan && d < 170) c.plan = planAt(c, next);
    if (ni > 0 && ni < N - 1 && d > 0 && d < 120) { const [li, lj] = c.ax === 'h' ? [ni, c.idx] : [c.idx, ni], L = lightState(li, lj, c.ax, t);
      if (L === 'r' || (L === 'y' && d > 30)) target = Math.min(target, d < 6 ? 0 : d * 1.6); else if (L === 'f') target = Math.min(target, 110); }
    if (c.plan && c.plan !== 's' && d < 110) target = Math.min(target, 110);
    // ātrā palīdzība priekšā – nebrauc virsū; ar sirēnu – nobrauc malā un palaiž garām
    const fx = Math.cos(c.ang), fy = Math.sin(c.ang), dx = amb.x - c.x, dy = amb.y - c.y, dd = Math.hypot(dx, dy);
    if (!amb.heli && dd < 110 && (dx * fx + dy * fy) > 20) target = 0;
    let wantPull = 0;
    if (amb.siren && !amb.heli && dd < 320) { const ax_ = Math.cos(amb.a), ay_ = Math.sin(amb.a); if (-(dx * ax_ + dy * ay_) > -40) { wantPull = 1; target = Math.min(target, 30); } }
    c.pull = lerp(c.pull, wantPull, Math.min(1, dt * 2.5));
    c.brake = target < c.v - 8; c.v = lerp(c.v, target, Math.min(1, dt * (target < c.v ? 3.4 : .9)));
    const ps = c.s; c.s += c.dir * c.v * dt;
    // iebrauc krustojumā: taisni turpina, pagriezienam – līkne līdz jaunās ielas joslai
    const entry = next - c.dir * (RW / 2 + 4);
    if ((ps - entry) * (c.s - entry) <= 0 && ps !== entry && c.plan && c.plan !== 's') {
      const here = c.idx * G, rd = c.ax === 'h' ? c.dir : -c.dir, nd = c.plan === 'r' ? rd : -rd, nax = c.ax === 'h' ? 'v' : 'h', nidx = ni;
      const p0 = { x: c.x, y: c.y }, exitS = here + nd * (RW / 2 + 4), lo = laneOff(nax, nd);
      const p2 = nax === 'h' ? { x: exitS, y: nidx * G + lo } : { x: nidx * G + lo, y: exitS }, p1 = c.ax === 'h' ? { x: p2.x, y: p0.y } : { x: p0.x, y: p2.y };
      if (cars.some(o => o !== c && !o.off && Math.hypot(o.x - p2.x, o.y - p2.y) < 70)) { c.s = ps; c.v = 0; c.brake = true; if (c.wait > 3) { c.plan = planAt(c, next); c.wait = 0; } const q0 = laneXY(c); c.x = q0.x; c.y = q0.y; continue; } // izbrauktuve aizņemta – gaida
      c.turn = { p0, p1, p2, t: 0, len: Math.hypot(p1.x - p0.x, p1.y - p0.y) + Math.hypot(p2.x - p1.x, p2.y - p1.y), ax: nax, idx: nidx, dir: nd, s: exitS }; c.pull = 0; continue; }
    if ((ps - next) * (c.s - next) <= 0 && ps !== next) c.plan = null; // taisni cauri krustojumam
    if (c.s < -RW / 2 || c.s > S + RW / 2) { c.dir *= -1; c.s = clamp(c.s, 0, S); c.plan = null; }
    const q = laneXY(c); c.x = c.ax === 'h' ? q.x : lerp(c.x, q.x, Math.min(1, dt * 8)); c.y = c.ax === 'v' ? q.y : lerp(c.y, q.y, Math.min(1, dt * 8));
    c.ang += wrapA(angOf(c.ax, c.dir) - c.ang) * Math.min(1, dt * 8);
  }
}

// ================= Vadība =================
addEventListener('keydown', e => { const k = e.key.toLowerCase(); keys[k] = true; if (k.startsWith('arrow') || k === ' ') e.preventDefault();
  if (k === 's' && !e.repeat && !document.activeElement.matches('input')) toggleSiren(); if ((k === 'e' || k === 'enter') && !e.repeat && !$('ov').classList.contains('on')) act(); if (k === 'v' && !e.repeat && !amb.heli) FP.toggle(); if (k === 'h' && !e.repeat && !$('ov').classList.contains('on')) { if (!save.heli) heliShop(); else toggleHeli(); } });
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
// ⚙ iestatījumi: radio (kopīgs visām spēlēm), mūzikas un efektu skaļums
$('gear').onclick = e => { e.stopPropagation(); audioInit(); if ($('ov').classList.contains('on')) { toast('⚙ Iestatījumi – kad aizver šo logu'); return; }
  sheet(`<h2>⚙ Iestatījumi</h2><div class="setBox"><div class="step">📻 Radio un dziesmas</div><div id="radioC">${window.TWRadio ? TWRadio.controlsHTML() : ''}</div></div>
    <div class="setBox"><label class="setRow">🔔 Efekti (sirēna, dzinējs) <input id="fxV" type="range" min="0" max="100" value="${Math.round(FXV * 100)}"></label></div>
    <div class="setBox"><button class="main ghostB" id="howTo">❓ Kā spēlēt</button></div>
    <p style="color:#9fb0ff;font-size:13.5px">Radio un Papīra Lidmašīnu dziesmas skan visās Tailers World spēlēs.</p><button class="main" id="setOk">✔ Gatavs</button>`);
  $('howTo').onclick = () => { closeSheet(); showIntro(true); };
  if (window.TWRadio) TWRadio.wire($('radioC'));
  $('fxV').oninput = () => { FXV = $('fxV').value / 100; try { localStorage.setItem('apFx', FXV); } catch (e) {} sfx('tick'); };
  $('setOk').onclick = closeSheet; };
$('bSiren').addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); toggleSiren(); });
// karte: uzspied – lielā karte pa vidu ekrāna, vēlreiz (vai blakus) – atpakaļ
{ const sh = document.createElement('div'); sh.id = 'mapShade'; document.body.appendChild(sh); const tg = () => { const b = !mini.classList.contains('big'); mini.classList.toggle('big', b); sh.classList.toggle('on', b); };
  mini.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); tg(); }); sh.addEventListener('pointerdown', e => { e.preventDefault(); tg(); }); }
$('bView').addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); if (amb.heli) { toast('🛞 Stūres skats ir tikai mašīnai'); return; } FP.toggle(); setTimeout(() => $('bView').classList.toggle('on', FP.on), 50); });
$('bAct').addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); act(); });
function toggleSiren() { amb.siren = !amb.siren; $('bSiren').classList.toggle('on', amb.siren); buzz(15); }
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

function updateAmb(dt) {
  const ov = $('ov').classList.contains('on');
  let thr = 0, ta = null, steer = 0;
  if (!ov) {
    if (window.FP && FP.on) { if (stick.on) { thr = Math.abs(stick.y) > .15 ? -stick.y : 0; steer = Math.abs(stick.x) > .12 ? stick.x : 0; } } // stūres skats: pa kreisi/labi – stūrē, augšup – gāze
    else if (stick.on && Math.hypot(stick.x, stick.y) > .18) { thr = Math.min(1, Math.hypot(stick.x, stick.y)); ta = Math.atan2(stick.y, stick.x);
      const ax = Math.round(ta / (Math.PI / 2)) * (Math.PI / 2); if (Math.abs(wrapA(ta - ax)) < .45) ta = ax; } // palīgs: gandrīz taisni → tieši pa ielu
    const up = keys.arrowup || keys.w, dn = keys.arrowdown, lf = keys.arrowleft || keys.a, rt = keys.arrowright || keys.d;
    if (up) thr = 1; if (dn) thr = -1; if (lf || rt) steer = (rt ? 1 : 0) - (lf ? 1 : 0);
  }
  if (amb.heli) { // helikopters: lido virs mājām uz to pusi, kur rāda kursorsvira/bultiņas (ekrāna virzieni), bez sadursmēm
    let ix = 0, iy = 0; if (!ov) { if (stick.on && Math.hypot(stick.x, stick.y) > .18) { ix = stick.x; iy = stick.y; }
      const up = keys.arrowup || keys.w, dn = keys.arrowdown, lf = keys.arrowleft || keys.a, rt = keys.arrowright || keys.d; if (up || dn || lf || rt) { ix = (rt ? 1 : 0) - (lf ? 1 : 0); iy = (dn ? 1 : 0) - (up ? 1 : 0); } }
    const m = Math.min(1, Math.hypot(ix, iy)), n = Math.hypot(ix, iy) || 1, HM = amb.fuel > 0 ? 620 : 120;
    const kk = Math.min(1, dt * (m > .1 ? 1.8 : 4.5)); amb.vx = lerp(amb.vx || 0, ix / n * m * HM, kk); amb.vy = lerp(amb.vy || 0, iy / n * m * HM, kk); // atlaižot – ātri apstājas (karājas gaisā)
    amb.v = Math.hypot(amb.vx, amb.vy); if (amb.v > 25) amb.a += wrapA(Math.atan2(amb.vy, amb.vx) - amb.a) * Math.min(1, dt * 3.5);
    amb.x = clamp(amb.x + amb.vx * dt, -RW / 2, S + RW / 2); amb.y = clamp(amb.y + amb.vy * dt, -RW / 2, S + RW / 2);
    const f0 = amb.fuel; amb.fuel = Math.max(0, amb.fuel - (amb.v + 40) * dt / 420); if (f0 >= 20 && amb.fuel < 20) toast('⛽ Maz degvielas! Nolaidies pie benzīntanka.');
    amb.bumpT = Math.max(0, amb.bumpT - dt); return; }
  const MAX = amb.fuel > 0 ? 430 : 90, turnK = Math.min(1, (Math.abs(amb.v) + 110) / 220);
  let target = 0;
  if (ta !== null) { const d = wrapA(ta - amb.a);
    if (Math.abs(d) > 1.9 && amb.v < 160) { target = 130 * thr; amb.a += clamp(d, -3.2 * dt, 3.2 * dt); } // pretējā virzienā – apgriežas uz vietas (U-pagrieziens), nevis brauc atpakaļgaitā
    else { target = MAX * thr * (Math.abs(d) > 1.1 ? .45 : 1); amb.a += clamp(d, -2.9 * dt * turnK, 2.9 * dt * turnK); if (Math.abs(d) > .55 && amb.v > 250) skid(); } }
  else { if (window.FP) FP.steer = steer; target = thr > 0 ? MAX * thr : thr < 0 ? (amb.v > 10 ? 0 : -170) : 0; amb.a += steer * 2.7 * dt * turnK * (thr < 0 && amb.v < -15 ? -1 : 1); if (Math.abs(steer) && amb.v > 300) skid(); }
  // palīgi bērniem: 1) mašīna tieši priekšā – piebremzē pats; 2) ielas vidū turas joslā, neberž apmali
  { const fx = Math.cos(amb.a), fy = Math.sin(amb.a);
    for (const c of cars) { if (c.off) continue; const dx = c.x - amb.x, dy = c.y - amb.y; if (Math.abs(dx) > 180 || Math.abs(dy) > 180) continue; const fw = dx * fx + dy * fy, lat = Math.abs(-dx * fy + dy * fx);
      if (fw > 0 && lat < 34 && fw < 170) target = Math.min(target, Math.max((c.v || 0) * .9, (fw - 55) * 2.6, 110)); // nekad pilnībā neapstājas – var lēnām apbraukt
      // krustojumā no sāniem: ja tuvākajā ~0.8 s būsim vienā vietā – piebremzē
      const wx = Math.cos(c.ang) * (c.v || 0) - fx * amb.v, wy = Math.sin(c.ang) * (c.v || 0) - fy * amb.v, w2 = wx * wx + wy * wy;
      if (w2 > 100) { const tc = -(dx * wx + dy * wy) / w2; if (tc > 0 && tc < .8 && Math.hypot(dx + wx * tc, dy + wy * tc) < 50) target = Math.min(target, 120); } }
    // māju stūri: ja priekšā (≈50 px) ir kvartāls – samazina ātrumu, lai nesatriektos
    if (amb.v > 200) { const px = amb.x + fx * 52, py = amb.y + fy * 52; if (blocks.some(b => px > b.x0 - 18 && px < b.x1 + 18 && py > b.y0 - 18 && py < b.y1 + 18)) target = Math.min(target, 190); }
    if (amb.v > 40) { const hz = Math.abs(fx) > .85, vt = Math.abs(fy) > .85, row = Math.round(amb.y / G) * G, col = Math.round(amb.x / G) * G;
      if (hz && Math.abs(amb.x - col) > RW / 2 + 20) { const off = amb.y - row, lim = RW / 2 - 26; if (Math.abs(off) > lim && Math.abs(off) < RW / 2 + 10) amb.y -= Math.sign(off) * Math.min(Math.abs(off) - lim, 90 * dt); }
      if (vt && Math.abs(amb.y - row) > RW / 2 + 20) { const off = amb.x - col, lim = RW / 2 - 26; if (Math.abs(off) > lim && Math.abs(off) < RW / 2 + 10) amb.x -= Math.sign(off) * Math.min(Math.abs(off) - lim, 90 * dt); } } }
  const acc = target > amb.v ? (amb.v < 0 ? 900 : 360) : (target === 0 ? 420 : 820);
  amb.v += clamp(target - amb.v, -acc * dt, acc * dt);
  amb.x += Math.cos(amb.a) * amb.v * dt; amb.y += Math.sin(amb.a) * amb.v * dt;
  const f0 = amb.fuel; amb.fuel = Math.max(0, amb.fuel - Math.abs(amb.v) * dt / 380); // degviela
  if (f0 >= 20 && amb.fuel < 20) toast('⛽ Maz degvielas! Brauc uz benzīntanku (⛽ kartē).'); if (f0 > 0 && amb.fuel <= 0) toast('⛽ Degviela beigusies – mašīna velkas lēni. Uz benzīntanku!');
  // sadursmes ar kvartāliem (mājas, ietves) un pilsētas malu
  const R = 21;
  for (const b of blocks) { if (amb.x < b.x0 - R || amb.x > b.x1 + R || amb.y < b.y0 - R || amb.y > b.y1 + R) continue;
    const ix = clamp(amb.x, b.x0 + 4, b.x1 - 4), iy = clamp(amb.y, b.y0 + 4, b.y1 - 4), dx = amb.x - ix, dy = amb.y - iy, d = Math.hypot(dx, dy);
    if (d < R) { const nx = d ? dx / d : 0, ny = d ? dy / d : -1; amb.x = ix + nx * R; amb.y = iy + ny * R;
      // slīd gar sienu: ja brauc tieši virsū – atsitas, ja slīpi – pagriežas gar to un turpina
      const hx = Math.cos(amb.a) * Math.sign(amb.v || 1), hy = Math.sin(amb.a) * Math.sign(amb.v || 1), into = -(hx * nx + hy * ny);
      if (into > 0) { bump(Math.abs(amb.v) * into > 230); if (into > .85) amb.v = -Math.min(40, Math.abs(amb.v) * .15); else if (steer || ta !== null) amb.v *= .85; else { const tx = -ny, ty = nx, sg = (hx * tx + hy * ty) >= 0 ? 1 : -1, ta = Math.atan2(ty * sg, tx * sg) + (amb.v < 0 ? Math.PI : 0); amb.a += wrapA(ta - amb.a) * .25; amb.v *= .9; } } } }
  amb.x = clamp(amb.x, -RW / 2 + R, S + RW / 2 - R); amb.y = clamp(amb.y, -RW / 2 + R, S + RW / 2 - R);
  // sadursmes ar mašīnām
  for (const c of cars) { const dx = amb.x - c.x, dy = amb.y - c.y, d = Math.hypot(dx, dy);
    if (d < 44) { const nx = dx / (d || 1), ny = dy / (d || 1); amb.x = c.x + nx * 44; amb.y = c.y + ny * 44; c.stun = 1.2; bump(Math.abs(amb.v) > 150, true); amb.v *= -.3; } }
  amb.bumpT = Math.max(0, amb.bumpT - dt);
}
function skid() { if (skids.length > 500) skids.splice(0, 40); const bx = Math.cos(amb.a), by = Math.sin(amb.a), px = -by, py = bx;
  skids.push({ x: amb.x - bx * 22 + px * 13, y: amb.y - by * 22 + py * 13, a: amb.a }, { x: amb.x - bx * 22 - px * 13, y: amb.y - by * 22 - py * 13, a: amb.a }); }
function bump(hard, car) { if (amb.bumpT > 0) return; amb.bumpT = .7; if (!hard) return; cam.shake = 9; sfx('bump'); buzz(40); walletAdd(-1); repairs += 1;
  if (M.state === 'toPatient' || M.state === 'toHospital') { M.bumps++; if (M.state === 'toHospital') M.cond = Math.max(5, M.cond - 6); toast((car ? '💥 Avārija! Remonts −€1' : '💥 Uzmanīgi! Remonts −€1') + (wallet < 0 ? '<br><small>Tu esi mīnusos – nopelni ar izsaukumiem!</small>' : '')); } else toast('💥 Remonts −€1'); }

// ================= Maršruts (īsākais pa ielām, sastrēgumus apiet) =================
function attach(px, py) { // tuvākā iela → divi krustojumi un attālumi līdz tiem
  const row = clamp(Math.round(py / G), 0, N - 1), col = clamp(Math.round(px / G), 0, N - 1), dh = Math.abs(py - row * G), dv = Math.abs(px - col * G);
  if (dh <= dv) { const a = clamp(Math.floor(px / G), 0, N - 2); return [{ i: a, j: row, d: Math.abs(px - a * G) }, { i: a + 1, j: row, d: Math.abs((a + 1) * G - px) }]; }
  const a = clamp(Math.floor(py / G), 0, N - 2); return [{ i: col, j: a, d: Math.abs(py - a * G) }, { i: col, j: a + 1, d: Math.abs((a + 1) * G - py) }]; }
// helikopteram – taisna līnija, mašīnai – pa ielām
const routeTo = (tx, ty) => amb.heli ? { pts: [{ x: amb.x, y: amb.y }, { x: tx, y: ty }], len: Math.hypot(tx - amb.x, ty - amb.y) } : route(amb.x, amb.y, tx, ty);
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
  const night = isNight(), lv = levelOf(save.xp).l + (night ? 2 : 0), okT = c => !c.time || c.time === 'any' || c.time === (night ? 'night' : 'day'), pool = CASES.filter(c => c.lv <= lv && okT(c) && !save.last.includes(c.id) && (!night || c.lv >= Math.min(3, lv - 1)));
  const c0 = (pool.length ? pool : CASES.filter(c => c.lv <= lv && okT(c)))[(Math.random() * (pool.length || 1)) | 0] || CASES[0], c = Object.assign({}, c0, { night });
  save.last = [c.id, ...(save.last || [])].slice(0, 2);
  // pacients uz ietves pie kāda kvartāla, ne pārāk tuvu
  let b, side, px, py, tries = 0;
  do { b = blocks[(Math.random() * blocks.length) | 0]; side = (Math.random() * 4) | 0; const p = .2 + Math.random() * .6;
    px = side < 2 ? lerp(b.x0, b.x1, p) : side === 2 ? b.x0 + 6 : b.x1 - 6; py = side >= 2 ? lerp(b.y0, b.y1, p) : side === 0 ? b.y0 + 6 : b.y1 - 6; tries++; }
  while ((b.kind === 'hospital' || b.kind === 'fuel' || Math.hypot(px - amb.x, py - amb.y) < 800 || Math.hypot(px - amb.x, py - amb.y) > 2600) && tries < 80);
  const rx = side === 2 ? px - 44 : side === 3 ? px + 44 : px, ry = side === 0 ? py - 44 : side === 1 ? py + 44 : py; // vieta uz ielas, kur apstāties
  Object.assign(M, { state: 'call', night, c, px, py, rx, ry, t: 0, bumps: 0, cond: 100, sc: {}, asked: new Set(), picked: new Set(), cprScore: null, decision: null, hinted: false, t2: 0, bumps1: 0 });
  M.route = routeTo(rx, ry); M.expect = M.route.len / 300 + 6;
  sfx('call'); buzz([60, 80, 60]);
  sheet(`<div class="step">📞 Izsaukums${night ? ' · 🌙 Nakts – grūtāks, bet ×1,5' : ''}</div><h2>${c.who} ${c.call}</h2><p>📍 <b>${streetOf(rx, ry)}</b> · ${Math.round(M.route.len / 10)} m</p>
    <p style="color:#9fb0ff">Ieslēdz sirēnu 🚨 – mašīnas palaidīs garām. Sarkanie ceļi kartē ir sastrēgumi.</p>
    <button class="main red" id="go">🚑 Braucam!</button><button class="main ghostB" id="skip">🚗 Ignorēt – vienkārši braukāt</button>`);
  $('go').onclick = () => { closeSheet(); M.state = 'toPatient'; if (!amb.siren) toggleSiren(); };
  $('skip').onclick = () => { closeSheet(); freeDrive(); };
}
// brīvs brauciens: izsaukumu var ignorēt; jauns pienāk pats pēc ~1 min vai uzreiz ar pogu 📞
function freeDrive() { M.state = 'idle'; M.route = null; if (amb.siren) toggleSiren(); toast('🚗 Brīvs brauciens! Nākamais izsaukums pēc ~1 min (vai spied 📞).');
  const id = M.freeId = (M.freeId || 0) + 1; setTimeout(() => { if (M.state === 'idle' && M.freeId === id) newCall(); }, 60000);
}
function act() {
  if (nearFuel() && Math.abs(amb.v) < 70 && M.state !== 'scene') { amb.v = 0; refuel(); return; }
  if (M.state === 'idle') { newCall(); return; }
  if (M.state === 'toPatient' && near(M.rx, M.ry, amb.heli ? 210 : 130) && Math.abs(amb.v) < 70) { amb.v = 0; startScene(); }
  else if (M.state === 'toHospital' && near(HOSP_BAY.x, HOSP_BAY.y, amb.heli ? 210 : 140) && Math.abs(amb.v) < 70) { amb.v = 0; arriveHospital(); }
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
// smieklīgi jautājumi – nejauši viens katrā izsaukumā (neietekmē rezultātu); smagos gadījumos (bez samaņas, sirds masāža) nav
const FUN = [['Kāda ir tava mīļākā krāsa?', 'Zaļa… bet varbūt vispirms palīdzēsi? 😅'], ['Vai tev mājās ir suns?', 'Jā, viņu sauc Bumbulis! 🐶'], ['Vai tev garšo pica?', 'Kuram gan negaršo! 🍕'],
  ['Vai tu proti dejot?', 'Šobrīd labāk ne… 🕺'], ['Kas labāks – kaķi vai suņi?', 'Abi! 🐱🐶'], ['Vai tu klausies Papīra Lidmašīnas?', 'Protams! Lido tu! ✈️'], ['Vai esi kādreiz redzējis pūķi?', 'Nē… vai TEV viss kārtībā? 🐉'],
  ['Vai tev garšo brokoļi?', 'Fui! 🥦'], ['Kāds ir tavs mīļākais dzīvnieks?', 'Pingvīns! 🐧'], ['Vai tu māki svilpot?', 'Fiū-fiū… nu, gandrīz. 😄'], ['Vai tu tici rūķīšiem?', 'Tikai Ziemassvētkos! 🎅'], ['Cik tev ir zobu?', 'Neesmu skaitījis… 🦷']];
function startScene() {
  M.state = 'scene'; M.t1 = M.t; M.bumps1 = M.bumps; if (amb.siren) toggleSiren(); sfx('door');
  const c = M.c, grave = c.cpr || c.inj.k === 'out';
  const fun = grave ? null : FUN[(Math.random() * FUN.length) | 0], qs = c.q.map((q, k) => ({ t: q.t, a: q.a, k }));
  if (fun) qs.splice((Math.random() * (qs.length + 1)) | 0, 0, { t: fun[0], a: fun[1], k: 'f' });
  const render = () => {
    if (M.tc) M.tc.destroy();
    sheet(`<div id="stg"></div><div class="step">1. solis · Noskaidro situāciju</div><h2>${c.who} ${c.name}</h2><p>${c.see}</p>
      <div class="opts">${qs.map(q => `<button class="opt${M.asked.has(q.k) ? ' asked' : ''}" data-q="${q.k}">❓ ${q.t}${M.asked.has(q.k) ? `<span class="ans">💬 ${q.a}</span>` : ''}</button>`).join('')}</div>
      <button class="main" id="next" ${M.asked.size ? '' : 'disabled'}>Es saprotu, kas noticis →</button>`);
    M.tc = Treat.mount($('stg'), c, {});
    document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const k = b.dataset.q === 'f' ? 'f' : +b.dataset.q; if (M.asked.has(k)) return; M.asked.add(k); sfx('tick'); render(); });
    $('next').onclick = stepDx; };
  render();
}
function stepDx() {
  const c = M.c, good = c.q.filter(q => q.good).length, gotGood = c.q.filter((q, k) => q.good && M.asked.has(k)).length, bad = c.q.filter((q, k) => !q.good && M.asked.has(k)).length;
  M.sc.ask = clamp(Math.round(gotGood / good * 100 - bad * 15), 0, 100);
  const opts = [...c.dx].sort(() => Math.random() - .5);
  sheet(`<div class="step">2. solis · Kas noticis?</div><h2>Kā tu domā – kas noticis?</h2><p style="color:#9fb0ff">${c.who} ${c.name} · ${c.see}</p>
    <div class="opts">${opts.map((d, k) => `<button class="opt" data-d="${k}">🩺 ${d.t}</button>`).join('')}</div>`);
  document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const d = opts[+b.dataset.d]; M.sc.dx = d.ok ? 100 : 0;
    document.querySelectorAll('[data-d]').forEach(x => { const o = opts[+x.dataset.d]; x.disabled = true; if (o.ok) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
    sfx(d.ok ? 'good' : 'bad');
    // simulētājs atmaskots – izsaukums beidzas uzreiz, palīdzēt un vest uz slimnīcu nevajag
    if (d.ok && c.fake) { M.sc.help = 100; M.sc.decide = 100; M.decision = false; setTimeout(() => finish(true), 700); return; }
    if (d.ok) { setTimeout(stepTools, 800); return; }
    // nepareizi – parāda pareizo atbildi un ļauj izlasīt savā tempā
    const right = opts.find(o => o.ok), fb = document.createElement('div'); fb.className = 'fact'; fb.innerHTML = `❌ Šoreiz nē. Pareizi ir: <b>${right.t}</b>.<br><small>Pievērs uzmanību pazīmēm aprakstā un pacienta atbildēm.</small>`;
    const nb = document.createElement('button'); nb.className = 'main'; nb.textContent = 'Saprotu, palīdzam →'; nb.onclick = stepTools; $('sheet').append(fb, nb); nb.scrollIntoView({ behavior: 'smooth', block: 'end' }); });
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
    // ja kaut kas pietrūkst – pasaka, ko vēl vajag, un ļauj to izdarīt (bērns mācās), nevis aizlec tālāk
    if (right < need.length && !M.hinted) { M.hinted = true; const miss = need.filter(id => !st.applied.has(id)).map(id => TOOLS[id].i + ' ' + TOOLS[id].n).join(', '); tc.hint(`🤔 Vēl vajag: <b>${miss}</b> – atrodi somā un uzvelc!`, true); sfx('bad'); $('next').textContent = 'Turpināt tik un tā →'; return; }
    M.picked = st.applied; M.sc.help = clamp(Math.round(right / need.length * 100 - wrong * 20 + bonus * 10 - (M.hinted ? 10 : 0)), 0, 100);
    if (c.cpr) M.sc.cpr = st.cprScore || 0;
    sfx(right < need.length ? 'bad' : 'good'); stepDecide(); };
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
    if (go) { M.state = 'toHospital'; M.t2 = 0; M.bumps2 = M.bumps; M.cond = clamp(55 + (M.sc.help || 0) * .45, 40, 100); M.route = routeTo(HOSP_BAY.x, HOSP_BAY.y); M.expect2 = M.route.len / 300 + 6;
      closeSheet(); toast(M.c.go ? '🚑 Pacients mašīnā – brauc uz slimnīcu! Mediķis viņu stabilizē.' : '🚑 Labi, vedam pārbaudīt uz slimnīcu.'); if (!amb.siren && M.c.go) toggleSiren(); sfx('door'); }
    else finish(); };
  $('dH').onclick = () => pick(true); $('dS').onclick = () => pick(false);
}
function arriveHospital() { sfx('door'); if (amb.siren) toggleSiren(); finish(); }
function finish(caught) {
  const c = M.c, S1 = M.sc;
  const drive1 = clamp(Math.round(100 - Math.max(0, M.t1 - M.expect) * 1.6 - M.bumps1 * 8), 0, 100);
  let drive = drive1;
  if (M.decision) { const t2 = M.t2, b2 = M.bumps - (M.bumps2 || 0); drive = Math.round((drive1 + clamp(100 - Math.max(0, t2 - M.expect2) * 1.6 - b2 * 8, 0, 100)) / 2); }
  if (!M.decision && c.go) S1.decide = 0;
  const parts = [['🔎 Noskaidroji', S1.ask || 0, 1], ['🩺 Kas noticis', S1.dx || 0, 1], ['🧰 Palīdzība', S1.help || 0, 1.5], ...(c.cpr ? [['❤️ Sirds masāža', S1.cpr || 0, 1]] : []), ['🏥 Lēmums', S1.decide || 0, 1], ['🚑 Brauciens', drive, 1]];
  if (M.decision) parts.push(['🫀 Pacienta stāvoklis', Math.round(M.cond), .8]);
  const wsum = parts.reduce((a, p) => a + p[2], 0), pct = Math.round(parts.reduce((a, p) => a + p[1] * p[2], 0) / wsum);
  const stars = pct >= 85 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0, xp = Math.round((20 + pct * .7) * (M.night ? 1.5 : 1)), money = Math.round((8 + pct * .25) * (M.night ? 1.5 : 1));
  const lv0 = levelOf(save.xp).l; save.xp += xp; save.calls++; if (pct >= 60) save.saved++; if (pct >= 95) save.perfect++; save.best = Math.max(save.best || 0, pct);
  const lv1 = levelOf(save.xp).l; persist(); walletAdd(money); medals();
  M.state = 'result'; $('pBar').classList.remove('on'); sfx(stars >= 2 ? 'win' : 'good');
  const col = v => v >= 80 ? '#2ecc71' : v >= 50 ? '#ffb020' : '#ff3b4e';
  if (caught) { // īss paziņojums, pēc brīža aizveras pats un spēle turpinās
    sheet(`<div class="stars" style="font-size:54px">😄</div><h2 style="text-align:center">Malacis, noķēri!</h2>
      <p style="text-align:center;font-weight:800">${c.name.split(',')[0]} tikai izlikās – palīdzība nav vajadzīga.</p>
      <div class="fact"><b>💡 Vai zināji?</b><br>${c.fact}</div>
      <p style="text-align:center;font-weight:800">+${xp} XP · <span style="color:#ffd34d">+€${money}</span>${lv1 > lv0 ? ` · 🎉 ${lv1}. līmenis!` : ''}</p>
      <button class="main red" id="nx">📞 Nākamais izsaukums</button>`);
    const done = next => { clearTimeout(M.caughtT); if (M.state !== 'result') return; closeSheet(); M.state = 'idle'; M.route = null; setTimeout(() => { if (M.state === 'idle') newCall(); }, next ? 350 : 5000); };
    $('nx').onclick = () => done(true); M.caughtT = setTimeout(() => done(false), 7000); return; }
  sheet(`<div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><div class="score" style="color:${col(pct)}">${pct}%</div>
    <p style="text-align:center;font-weight:800">${pct >= 85 ? 'Izcils darbs, glābēj! 🦸' : pct >= 60 ? 'Labs darbs! 👍' : pct >= 30 ? 'Pacientam palīdzēts! Nākamreiz vēl labāk 💪' : 'Labs mēģinājums! Izlasi padomu un mēģini vēlreiz 💪'}</p>
    <div class="parts">${parts.map(([n, v]) => `<div class="part"><span style="width:150px">${n}</span><div class="pb"><i style="width:${v}%;background:${col(v)}"></i></div><em>${v}%</em></div>`).join('')}</div>
    ${M.c.go !== M.decision ? `<div class="fact">${M.c.go ? '🏥 Šim pacientam vajadzēja uz slimnīcu.' : '🏠 Šim pacientam pietika ar palīdzību uz vietas.'}</div>` : ''}
    <div class="fact"><b>💡 Vai zināji?</b><br>${c.fact}<br><small style="color:#9fb0ff">Īstā dzīvē nelaimes gadījumā zvani <b>112</b>.</small></div>
    <p style="text-align:center;font-weight:800">+${xp} XP · <span style="color:#ffd34d">+€${money}</span>${lv1 > lv0 ? ` · 🎉 ${lv1}. līmenis – jauni izsaukumi!` : ''}</p>
    <button class="main red" id="nx">📞 Nākamais izsaukums</button>`);
  $('nx').onclick = () => { closeSheet(); M.state = 'idle'; setTimeout(newCall, 350); };
}

// ---- logi ----
function sheet(html) { const quit = M.state === 'call' || M.state === 'scene';
  $('sheet').innerHTML = (quit ? '<button class="xBtn" id="xQuit" aria-label="Aizvērt">✕</button>' : '') + html; $('ov').classList.add('on'); $('sheet').scrollTop = 0;
  if (quit) $('xQuit').onclick = () => { const sc = M.state === 'scene'; if (M.tc && M.tc.destroy) M.tc.destroy(); M.tc = null; closeSheet(); freeDrive(); if (sc) setTimeout(() => toast('🚑 Pacientam palīdzēs cita brigāde. Tu vari braukāt brīvi.'), 50); }; }
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

// ================= Diena un nakts =================
// pilna diena = 6 minūtes; sāk 10:00. Naktī (21–6): tumšs, deg lampas un logi, mazāk mašīnu, luksofori mirgo dzelteni, izsaukumi grūtāki (×1.5).
const DAYLEN = 360; let DAY0 = 10 / 24 * DAYLEN;
const hourNow = () => ((T + DAY0) % DAYLEN) / DAYLEN * 24;
const isNight = () => { const h = hourNow(); return h >= 21 || h < 6; };
const darkness = () => { const h = hourNow(), sun = Math.sin((h - 6) / 12 * Math.PI); return clamp(.62 - sun * 1.4, 0, .62); };
const SHADE = {}; function shade(hex, k) { const key = hex + k; if (SHADE[key]) return SHADE[key]; const n = parseInt(hex.slice(1), 16), r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k); return SHADE[key] = `rgb(${r},${g},${b})`; }
const hash = n => { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return (n ^ (n >>> 15)) >>> 0; };

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
  const LC = { r: '#ff3b3b', y: '#ffc533', g: '#36e06f', f: Math.sin(t * 6) > 0 ? '#ffc533' : '#3a3420' };
  for (let i = 1; i < N - 1; i++) for (let j = 1; j < N - 1; j++) { const X = i * G, Y = j * G; if (X < vx0 - 100 || X > vx1 + 100 || Y < vy0 - 100 || Y > vy1 + 100) continue;
    const hs = lightState(i, j, 'h', t), vs = lightState(i, j, 'v', t), e = RW / 2 + 14;
    const bar = (x, y, w, h, st) => { ctx.fillStyle = LC[st]; ctx.globalAlpha = .85; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; };
    bar(X - e - 6, Y + 4, 8, RW / 2 - 8, hs); bar(X + e - 2, Y - RW / 2 + 4, 8, RW / 2 - 8, hs); bar(X - RW / 2 + 4, Y - e - 6, RW / 2 - 8, 8, vs); bar(X + 4, Y + e - 2, RW / 2 - 8, 8, vs);
    const head = (x, y, st) => { ctx.fillStyle = '#5b6070'; ctx.fillRect(x - 2, y - 2, 4, 14); ctx.fillStyle = '#15171d'; ctx.beginPath(); ctx.roundRect(x - 8, y - 26, 16, 40, 5); ctx.fill();
      ['r', 'y', 'g'].forEach((k, n) => { const on = k === st || (st === 'f' && k === 'y' && Math.sin(t * 6) > 0); ctx.fillStyle = on ? LC[k === 'y' ? 'y' : k] : '#2c2f38'; ctx.beginPath(); ctx.arc(x, y - 18 + n * 12, 5, 0, 7); ctx.fill();
        if (on) { ctx.globalAlpha = .35; ctx.beginPath(); ctx.arc(x, y - 18 + n * 12, 11, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } }); };
    head(X - e - 12, Y + e + 14, hs); head(X + e + 12, Y - e - 4, hs); head(X - e - 12, Y - e - 4, vs); head(X + e + 12, Y + e + 14, vs); }
  // bremžu pēdas
  ctx.fillStyle = 'rgba(20,20,24,.28)'; for (const s of skids) { if (s.x < vx0 || s.x > vx1 || s.y < vy0 || s.y > vy1) continue; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.fillRect(-4, -2.5, 8, 5); ctx.restore(); }
  // maršruts uz ielas
  if (M.route && (M.state === 'toPatient' || M.state === 'toHospital')) { ctx.save(); ctx.strokeStyle = M.state === 'toHospital' ? 'rgba(255,90,110,.55)' : 'rgba(255,214,70,.6)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([2, 22]); ctx.lineDashOffset = -t * 60;
    ctx.beginPath(); M.route.pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore(); }
  // pacients
  if (M.state === 'toPatient' || M.state === 'call') { const pu = ((t * 1.4) % 1 + 1) % 1;
    ctx.strokeStyle = `rgba(255,59,78,${1 - pu})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(M.px, M.py, 20 + pu * 60, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,59,78,.25)'; ctx.beginPath(); ctx.arc(M.rx, M.ry, 60, 0, 7); ctx.fill();
    ctx.font = '40px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(M.c.who, M.px, M.py);
    ctx.fillStyle = '#ff3b4e'; ctx.beginPath(); ctx.arc(M.px + 22, M.py - 26, 12, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.fillText('!', M.px + 22, M.py - 25); }
  if (M.state === 'toHospital') { const pu = (t * 1.2) % 1; ctx.strokeStyle = `rgba(255,255,255,${1 - pu})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(HOSP_BAY.x, HOSP_BAY.y, 30 + pu * 50, 0, 7); ctx.stroke(); }
  // mašīnas
  for (const c of cars) { if (c.off || c.x < vx0 || c.x > vx1 || c.y < vy0 || c.y > vy1) continue; drawCar(c.x, c.y, c.ang, c.len, 27, c.col, false, t, c); }
  if (!amb.heli) drawCar(amb.x, amb.y, amb.a, 72, 32, '#ffffff', true, t);
  // 3D mājas (tālākās vispirms), koku vainagi virs tām nav vajadzīgi
  const dk = darkness(), lit = [], neon = []; const bl = [];
  for (const b of blocks) { if (b.x1 < vx0 - 200 || b.x0 > vx1 + 200 || b.y1 < vy0 - 200 || b.y0 > vy1 + 200) continue; for (const it of b.items) if (it.t === 'bld') bl.push(it); }
  bl.sort((a, b) => Math.hypot((b.x0 + b.x1) / 2 - cam.x, (b.y0 + b.y1) / 2 - cam.y) - Math.hypot((a.x0 + a.x1) / 2 - cam.x, (a.y0 + a.y1) / 2 - cam.y));
  bl.forEach(it => drawBuilding(it, t, dk, lit, neon));
  if (amb.heli) drawHeli(t);
  drawSky(t, dk, vx0, vy0, vx1, vy1);
  // nakts: tumsa + gaismas (lampas, logi, lukturi, sirēna)
  if (dk > .02) {
    ctx.fillStyle = `rgba(14,10,44,${dk})`; ctx.fillRect(vx0 - 200, vy0 - 200, vx1 - vx0 + 400, vy1 - vy0 + 400);
    const nk = dk / .62; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const L of LAMPS) { if (L.x < vx0 - 100 || L.x > vx1 + 100 || L.y < vy0 - 100 || L.y > vy1 + 100) continue; const g = ctx.createRadialGradient(L.x, L.y, 1, L.x, L.y, 58); g.addColorStop(0, `rgba(190,225,255,${.17 * nk})`); g.addColorStop(1, 'rgba(190,225,255,0)'); ctx.fillStyle = g; ctx.fillRect(L.x - 58, L.y - 58, 116, 116); }
    const WC = ['255,205,120', '255,190,110', '150,215,255', '255,120,215', '170,140,255'];
    for (const q of lit) { ctx.fillStyle = `rgba(${WC[q[8]]},${.5 * nk})`; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.lineTo(q[4], q[5]); ctx.lineTo(q[6], q[7]); ctx.fill(); }
    // neona kontūras uz dažu māju jumtiem
    ctx.lineJoin = 'round'; for (const n of neon) { ctx.strokeStyle = `rgba(${n.c},${.55 * nk})`; ctx.lineWidth = 7; ctx.strokeRect(n.x, n.y, n.w, n.h); ctx.strokeStyle = `rgba(255,255,255,${.5 * nk})`; ctx.lineWidth = 1.5; ctx.strokeRect(n.x, n.y, n.w, n.h); }
    const head = (x, y, a, r) => { const fx = Math.cos(a), fy = Math.sin(a), g = ctx.createRadialGradient(x + fx * 30, y + fy * 30, 4, x + fx * 70, y + fy * 70, r); g.addColorStop(0, `rgba(255,250,220,${.32 * nk})`); g.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + fx * 70, y + fy * 70, r, 0, 7); ctx.fill(); };
    for (const c of cars) { if (c.off || c.x < vx0 || c.x > vx1 || c.y < vy0 || c.y > vy1) continue; head(c.x, c.y, c.ang, 70); }
    if (!amb.heli) head(amb.x, amb.y, amb.a, 95);
    if (amb.siren) { const on = Math.sin(t * 16) > 0, g = ctx.createRadialGradient(amb.x, amb.y, 4, amb.x, amb.y, 160); g.addColorStop(0, on ? `rgba(255,40,60,${.6 * nk})` : `rgba(40,110,255,${.6 * nk})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(amb.x, amb.y, 160, 0, 7); ctx.fill(); }
    ctx.restore(); }
}
// ---- dekorācija: lēni mākoņi ar ēnām un mazi putnu bariņi (atkārtojas ap kameru SKY.SPAN rūtī; augstāk = nedaudz paralakses) ----
const SKY = (() => { let s = 7; const R = () => (s = (s * 16807) % 2147483647) / 2147483647, SPAN = 4200;
  const img = [0, 1, 2].map(() => { const blobs = Array.from({ length: 9 }, () => [48 + R() * 160, 55 + R() * 50, 26 + R() * 32]);
    return ['255,255,255', '20,30,40'].map(col => { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const g = c.getContext('2d');
      for (const [x, y, r] of blobs) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},.85)`); gr.addColorStop(.6, `rgba(${col},.55)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
      return c; }); });
  const clouds = Array.from({ length: 8 }, (_, i) => ({ x: R() * SPAN, y: R() * SPAN, s: .8 + R() * .9, k: i % 3 }));
  const flocks = Array.from({ length: 3 }, () => { const a = R() * 6.28; return { x: R() * SPAN, y: R() * SPAN, a, n: 3 + ((R() * 3) | 0), sp: 110 + R() * 50 }; });
  return { SPAN, img, clouds, flocks }; })();
function drawSky(t, dk, vx0, vy0, vx1, vy1) {
  const SP = SKY.SPAN, wr = (v, c) => c + (((v - c) % SP) + SP * 1.5) % SP - SP / 2, vis = (x, y, r) => x + r > vx0 && x - r < vx1 && y + r > vy0 && y - r < vy1;
  // putni (zem mākoņiem): V formas siluets, spārni vicinās; naktī tikai viens bariņš
  ctx.lineCap = 'round';
  SKY.flocks.forEach((f, fi) => { if (dk > .3 && fi > 0) return; const fx = Math.cos(f.a), fy = Math.sin(f.a), bx = wr(f.x + fx * f.sp * t - cam.x * .12, cam.x), by = wr(f.y + fy * f.sp * t - cam.y * .12, cam.y);
    if (!vis(bx, by, 260)) return;
    for (let i = 0; i < f.n; i++) { const row = (i + 1) >> 1, side = i % 2 ? 1 : -1, ox = -row * 34, oy = i ? side * row * 26 : 0;
      const x = bx + fx * ox - fy * oy, y = by + fy * ox + fx * oy, fl = Math.sin(t * 9 + i * 1.7) * 5;
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(x + 70, y + 100, 9, 4, f.a, 0, 7); ctx.fill();
      // kaija no augšas: ķermenis pa lidojuma virzienu, spārni uz sāniem (balti ar tumšu kontūru – nesajaucas ar maršruta bultiņām)
      ctx.save(); ctx.translate(x, y); ctx.rotate(f.a); const wing = () => { ctx.beginPath(); ctx.moveTo(-3, -15 - fl); ctx.quadraticCurveTo(3, -9, 1, 0); ctx.quadraticCurveTo(3, 9, -3, 15 + fl); };
      ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 5; wing(); ctx.stroke(); ctx.strokeStyle = '#f7f7f2'; ctx.lineWidth = 2.6; wing(); ctx.stroke();
      ctx.fillStyle = '#f7f7f2'; ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, 0, 7, 2.6, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f2a33a'; ctx.fillRect(6.5, -.8, 2.5, 1.6); ctx.restore(); } });
  // mākoņi: ēna uz zemes + pats mākonis augstāk (caurspīdīgs, lai neaizsedz ielas)
  for (const c of SKY.clouds) { const w = 560 * c.s, h = 350 * c.s, gx = c.x + t * 16, gy = c.y + t * 6;
    const sx = wr(gx, cam.x) + 150, sy = wr(gy, cam.y) + 210; if (vis(sx, sy, w)) { ctx.globalAlpha = .16 * (1 - dk); ctx.drawImage(SKY.img[c.k][1], sx - w / 2, sy - h / 2, w, h); }
    const cx = wr(gx - cam.x * .3, cam.x), cy = wr(gy - cam.y * .3, cam.y); if (vis(cx, cy, w)) { ctx.globalAlpha = .42 - .3 * dk; ctx.drawImage(SKY.img[c.k][0], cx - w / 2, cy - h / 2, w, h); } }
  ctx.globalAlpha = 1; }
// helikopters no augšas: ēna uz zemes (lido augstu), korpuss ar sarkano krustu, astes rotors, galvenais rotors griežas
function drawHeli(t) { const x = amb.x, y = amb.y, a = amb.a, OLc = '#24222b';
  ctx.save(); ctx.translate(x, y); ctx.scale(1.3, 1.3); ctx.translate(-x, -y);
  ctx.save(); ctx.translate(x + 48, y + 64); ctx.rotate(a); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 42, 20, 0, 0, 7); ctx.fill(); ctx.fillRect(-96, -5, 56, 10); ctx.beginPath(); ctx.arc(0, 0, 74, 0, 7); ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.strokeStyle = OLc; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#4a4a55'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-26, -25); ctx.lineTo(32, -25); ctx.moveTo(-26, 25); ctx.lineTo(32, 25); ctx.stroke(); // slieces
  ctx.strokeStyle = OLc; ctx.lineWidth = 3; ctx.fillStyle = '#eef3f7'; ctx.beginPath(); ctx.roundRect(-98, -6, 66, 12, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d81b33'; ctx.beginPath(); ctx.roundRect(-104, -17, 14, 34, 4); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(-97, 20); ctx.rotate(t * 45); ctx.fillStyle = OLc; ctx.fillRect(-11, -1.6, 22, 3.2); ctx.restore();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(2, 0, 44, 23, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = '#d81b33'; ctx.fillRect(-44, -24, 14, 48); ctx.fillStyle = '#f4d03f'; ctx.fillRect(-30, -24, 5, 48); ctx.restore(); ctx.stroke();
  ctx.fillStyle = '#d81b33'; ctx.fillRect(-14, -3.5, 18, 7); ctx.fillRect(-8.5, -9, 7, 18);
  ctx.fillStyle = '#5aa9e6'; ctx.beginPath(); ctx.ellipse(27, 0, 15, 17, 0, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(31, -6, 5, 3, .4, 0, 7); ctx.fill();
  if (amb.siren) { const on = Math.sin(t * 16) > 0; ctx.fillStyle = on ? '#ff3b4e' : '#3d7bff'; ctx.beginPath(); ctx.arc(-20, 0, 5, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(40,40,50,.16)'; ctx.beginPath(); ctx.arc(0, 0, 80, 0, 7); ctx.fill();
  ctx.rotate(t * 24); ctx.fillStyle = 'rgba(36,34,43,.85)'; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.roundRect(4, -3.5, 76, 7, 3); ctx.fill(); }
  ctx.fillStyle = '#8a8f99'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill(); ctx.stroke();
  ctx.restore(); ctx.restore(); }
// helikoptera veikals (€10000 no kopējā maciņa) un pārslēgšana mašīna ↔ helikopters
const HELI_PRICE = 10000;
function heliShop() { const can = wallet >= HELI_PRICE;
  sheet(`<div class="step">🚁 Helikopters 112</div><h2>Glābšanas helikopters</h2><p>Lido pāri mājām un sastrēgumiem taisni pie pacienta un nolaižas tur, kur vajag!</p>
    <div class="fact" style="text-align:center"><div style="font-size:54px">🚁</div><b style="font-size:24px;color:#ffd34d">€${HELI_PRICE}</b><br>Tev ir €${wallet}${can ? ' ✅' : ` – vēl jānopelna €${HELI_PRICE - wallet}`}</div>
    <button class="main" id="hBuy" ${can ? '' : 'disabled'}>🚁 Pirkt helikopteru</button><button class="main ghostB" id="hNo">Vēlāk</button>`);
  $('hNo').onclick = closeSheet;
  $('hBuy').onclick = () => { if (wallet < HELI_PRICE) return; walletAdd(-HELI_PRICE); save.heli = true; persist(); closeSheet(); sfx('win'); heliBtn(); toast('🚁 Helikopters ir tavs! Spied 🚁, lai paceltos.'); }; }
function toggleHeli() {
  if (!amb.heli && Math.abs(amb.v) > 80) { toast('Vispirms apstājies'); return; }
  if (amb.heli && blocks.some(b => amb.x > b.x0 && amb.x < b.x1 && amb.y > b.y0 && amb.y < b.y1)) { toast('🚁 Nolaidies uz ielas, ne uz mājas!'); return; }
  if (window.FP && FP.on) { FP.toggle(); $('bView').classList.remove('on'); }
  amb.heli = !amb.heli; amb.v = 0; amb.vx = amb.vy = 0; M.rt = 0; sfx('door'); buzz(30); heliBtn();
  toast(amb.heli ? '🚁 Paceļamies! Lido pāri mājām taisni uz mērķi.' : '🚑 Nolaidāmies – atpakaļ mašīnā.'); }
function heliBtn() { const b = $('bHeli'); b.classList.toggle('on', !!amb.heli); b.innerHTML = save.heli ? (amb.heli ? '🚑<small>Mašīna</small>' : '🚁<small>Lidot</small>') : '🚁<small>€10k</small>'; }
$('bHeli').addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); if ($('ov').classList.contains('on')) return; if (!save.heli) heliShop(); else toggleHeli(); });
// 3D māja: sienas ar logiem pret kameru (perspektīva no ekrāna centra), jumts virsū
const PK = .0014;
const NEON = ['255,60,200', '40,230,255', '170,90,255', '90,255,140', '255,170,40'];
function drawBuilding(it, t, dk, lit, neon) {
  const f = it.h * PK, cx = cam.x, cy = cam.y, R = (x, y) => [x + (x - cx) * f, y + (y - cy) * f];
  const A = [it.x0, it.y0], B = [it.x1, it.y0], C = [it.x1, it.y1], D = [it.x0, it.y1], A2 = R(...A), B2 = R(...B), C2 = R(...C), D2 = R(...D);
  const floors = Math.max(1, Math.floor(it.h / 28)), night = dk > .25;
  const wall = (p0, p1, q1, q0, k) => { ctx.fillStyle = shade(it.col, k); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(q1[0], q1[1]); ctx.lineTo(q0[0], q0[1]); ctx.fill();
    const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), n = Math.max(1, Math.floor(len / 30)), P = (u, v) => [lerp(lerp(p0[0], p1[0], u), lerp(q0[0], q1[0], u), v), lerp(lerp(p0[1], p1[1], u), lerp(q0[1], q1[1], u), v)];
    if (it.fuel) return;
    for (let k2 = 0; k2 < floors; k2++) for (let i = 0; i < n; i++) { const u0 = (i + .28) / n, u1 = (i + .72) / n, v0 = (k2 + .3) / floors, v1 = (k2 + .72) / floors, a = P(u0, v0), b = P(u1, v0), c = P(u1, v1), d = P(u0, v1);
      const on = night && hash(it.win + i * 7 + k2 * 131 + (p0[0] | 0)) % 3 !== 0; ctx.fillStyle = on ? '#3a3220' : 'rgba(40,60,90,.55)'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.fill();
      if (on) lit.push([a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1], hash(it.win + i * 3 + k2) % 10 < 6 ? (hash(it.win + k2) & 1) : 2 + hash(it.win + i) % 3]); } };
  if (cy < it.y0) wall(A, B, B2, A2, .9); if (cy > it.y1) wall(D, C, C2, D2, .7); if (cx < it.x0) wall(A, D, D2, A2, .82); if (cx > it.x1) wall(B, C, C2, B2, .76);
  // jumts
  if (dk > .25 && !it.fuel && hash(it.win) % 4 === 0) { const k = 1 + f; neon.push({ x: cx + (it.x0 - cx) * k + 3, y: cy + (it.y0 - cy) * k + 3, w: (it.x1 - it.x0) * k - 6, h: (it.y1 - it.y0) * k - 6, c: NEON[hash(it.win + 7) % NEON.length] }); }
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1 + f, 1 + f); ctx.translate(-cx, -cy);
  const w = it.x1 - it.x0, h = it.y1 - it.y0; ctx.fillStyle = it.col; ctx.fillRect(it.x0, it.y0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(it.x0, it.y0, w, 4); ctx.fillRect(it.x0, it.y0, 4, h); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(it.x0, it.y1 - 4, w, 4); ctx.fillRect(it.x1 - 4, it.y0, 4, h);
  if (it.hosp) { const hx = (it.x0 + it.x1) / 2, hy = (it.y0 + it.y1) / 2; ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(hx, hy, 46, 0, 7); ctx.stroke(); ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 52px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', hx, hy + 3);
    ctx.fillStyle = '#e53950'; [[it.x0 + 30, it.y0 + 30], [it.x1 - 30, it.y0 + 30]].forEach(([x, y]) => { ctx.fillRect(x - 7, y - 20, 14, 40); ctx.fillRect(x - 20, y - 7, 40, 14); }); }
  else if (it.fuel) { ctx.fillStyle = '#16a34a'; ctx.fillRect(it.x0, it.y0, w, 14); ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⛽ DEGVIELA', (it.x0 + it.x1) / 2, (it.y0 + it.y1) / 2 + 6); }
  else { ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; ctx.strokeRect(it.x0 + 9, it.y0 + 9, w - 18, h - 18);
    it.det.forEach(d => { const x = it.x0 + 16 + d.u * (w - 46), y = it.y0 + 16 + d.v * (h - 46);
      if (d.k < .4) { ctx.fillStyle = '#9aa3ad'; ctx.fillRect(x, y, 22, 16); ctx.fillStyle = '#7d858f'; ctx.beginPath(); ctx.arc(x + 11, y + 8, 5, 0, 7); ctx.fill(); }
      else if (d.k < .7) { ctx.fillStyle = '#2f4b7c'; ctx.fillRect(x, y, 28, 18); ctx.strokeStyle = '#8fb0e0'; ctx.lineWidth = 1; for (let q = 1; q < 4; q++) { ctx.beginPath(); ctx.moveTo(x + q * 7, y); ctx.lineTo(x + q * 7, y + 18); ctx.stroke(); } }
      else { ctx.fillStyle = '#b8b2a6'; ctx.beginPath(); ctx.arc(x + 10, y + 10, 10, 0, 7); ctx.fill(); } }); }
  ctx.restore();
}
function drawBlock(b, t) {
  ctx.fillStyle = '#d8d2c6'; ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); // ietve
  ctx.fillStyle = '#c3bcae'; ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, 3); ctx.fillRect(b.x0, b.y1 - 3, b.x1 - b.x0, 3); ctx.fillRect(b.x0, b.y0, 3, b.y1 - b.y0); ctx.fillRect(b.x1 - 3, b.y0, 3, b.y1 - b.y0);
  const ix0 = b.x0 + SWK, iy0 = b.y0 + SWK, ix1 = b.x1 - SWK, iy1 = b.y1 - SWK;
  if (b.kind === 'park') { const P = b.park;
    ctx.fillStyle = '#4f8f3d'; ctx.beginPath(); ctx.roundRect(ix0 - 4, iy0 - 4, ix1 - ix0 + 8, iy1 - iy0 + 8, 20); ctx.fill(); // dzīvžogs
    ctx.fillStyle = '#84c466'; ctx.beginPath(); ctx.roundRect(ix0 + 6, iy0 + 6, ix1 - ix0 - 12, iy1 - iy0 - 12, 16); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(ix0 + 6, iy0 + 6, ix1 - ix0 - 12, iy1 - iy0 - 12, 16); ctx.clip();
    P.patches.forEach(q => { ctx.fillStyle = q.c; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.rx, q.ry, q.a, 0, 7); ctx.fill(); });
    ctx.lineCap = 'round'; [[16, '#cbb995'], [11, '#e6d7b4']].forEach(([w, c]) => { ctx.strokeStyle = c; ctx.lineWidth = w; P.paths.forEach(pp => { ctx.beginPath(); ctx.moveTo(pp[0][0], pp[0][1]); ctx.quadraticCurveTo(pp[1][0], pp[1][1], pp[2][0], pp[2][1]); ctx.stroke(); }); });
    ctx.fillStyle = '#e6d7b4'; ctx.beginPath(); ctx.arc(P.mid[0], P.mid[1], 22, 0, 7); ctx.fill(); ctx.strokeStyle = '#cbb995'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#9fc9e6'; ctx.beginPath(); ctx.arc(P.mid[0], P.mid[1], 9, 0, 7); ctx.fill(); // strūklaka
    P.beds.forEach(d => { ctx.fillStyle = '#6b4a2e'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); ctx.fillStyle = d.c; for (let k = 0; k < 9; k++) { const a = k * 2.4, rr_ = d.r * .65 * Math.sqrt((k + 1) / 9); ctx.beginPath(); ctx.arc(d.x + Math.cos(a) * rr_, d.y + Math.sin(a) * rr_, 2.6, 0, 7); ctx.fill(); } });
    P.benches.forEach(q => { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-11, -3, 24, 9); ctx.fillStyle = '#8e6b47'; ctx.fillRect(-12, -5, 24, 4); ctx.fillRect(-12, 0, 24, 4); ctx.restore(); });
    ctx.restore(); }
  else if (b.kind === 'plaza') { ctx.fillStyle = '#e4ddcf'; ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0); ctx.strokeStyle = '#d2c9b8'; ctx.lineWidth = 2; for (let x = ix0; x < ix1; x += 26) { ctx.beginPath(); ctx.moveTo(x, iy0); ctx.lineTo(x, iy1); ctx.stroke(); }
    const cx = (ix0 + ix1) / 2, cy = (iy0 + iy1) / 2; ctx.fillStyle = '#9fc9e6'; ctx.beginPath(); ctx.arc(cx, cy, 36, 0, 7); ctx.fill(); ctx.fillStyle = '#c9e6f7'; ctx.beginPath(); ctx.arc(cx, cy, 12 + Math.sin(t * 3) * 2, 0, 7); ctx.fill(); }
  else if (b.kind === 'parking') { ctx.fillStyle = '#5a5f6b'; ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0); ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 2;
    for (let k = 0; k <= 5; k++) { const x = ix0 + 10 + k * ((ix1 - ix0 - 20) / 5); ctx.beginPath(); ctx.moveTo(x, iy0); ctx.lineTo(x, iy0 + 80); ctx.moveTo(x, iy1); ctx.lineTo(x, iy1 - 80); ctx.stroke(); } }
  else if (b.kind === 'hospital') drawHospital(b, ix0, iy0, ix1, iy1, t);
  else if (b.kind === 'fuel') { ctx.fillStyle = '#5c616d'; ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0); const cx = (ix0 + ix1) / 2;
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#e53950'; ctx.fillRect(cx - 80 + k * 70, iy1 - 40, 20, 30); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 76 + k * 70, iy1 - 36, 12, 8); } }
  else { ctx.fillStyle = '#9ccc82'; ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0); }
  for (const it of b.items) {
    if (it.t === 'bld') { const w = it.x1 - it.x0, h = it.y1 - it.y0, sx = it.h * .32, sy = it.h * .22; // ēna uz zemes (pati māja – drawBuilding)
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.moveTo(it.x1, it.y0); ctx.lineTo(it.x1 + sx, it.y0 + sy); ctx.lineTo(it.x1 + sx, it.y1 + sy); ctx.lineTo(it.x0 + sx, it.y1 + sy); ctx.lineTo(it.x0, it.y1); ctx.lineTo(it.x1, it.y1); ctx.fill(); continue;
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(it.x0, it.y0, w, 4); ctx.fillRect(it.x0, it.y0, 4, h);
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(it.x0, it.y1 - 4, w, 4); ctx.fillRect(it.x1 - 4, it.y0, 4, h);
      ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; ctx.strokeRect(it.x0 + 9, it.y0 + 9, w - 18, h - 18);
      it.det.forEach(d => { const x = it.x0 + 16 + d.u * (w - 46), y = it.y0 + 16 + d.v * (h - 46);
        if (d.k < .4) { ctx.fillStyle = '#9aa3ad'; ctx.fillRect(x, y, 22, 16); ctx.fillStyle = '#7d858f'; ctx.beginPath(); ctx.arc(x + 11, y + 8, 5, 0, 7); ctx.fill(); }
        else if (d.k < .7) { ctx.fillStyle = '#2f4b7c'; ctx.fillRect(x, y, 28, 18); ctx.strokeStyle = '#8fb0e0'; ctx.lineWidth = 1; for (let q = 1; q < 4; q++) { ctx.beginPath(); ctx.moveTo(x + q * 7, y); ctx.lineTo(x + q * 7, y + 18); ctx.stroke(); } }
        else { ctx.fillStyle = '#b8b2a6'; ctx.beginPath(); ctx.arc(x + 10, y + 10, 10, 0, 7); ctx.fill(); } }); }
    else if (it.t === 'pond') { ctx.fillStyle = '#a8996f'; ctx.beginPath(); ctx.ellipse(it.x, it.y, it.r + 6, it.r * .7 + 6, 0, 0, 7); ctx.fill(); // krasts
      const wg = ctx.createRadialGradient(it.x, it.y, 2, it.x, it.y, it.r); wg.addColorStop(0, '#3f86b8'); wg.addColorStop(1, '#6db3dd'); ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(it.x, it.y, it.r, it.r * .7, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(it.x - it.r * .25, it.y - it.r * .15, it.r * .35, it.r * .1, -.2, 0, 3); ctx.stroke();
      (it.lil || []).forEach(([u, v]) => { ctx.fillStyle = '#4c9a43'; ctx.beginPath(); ctx.arc(it.x + u * it.r, it.y + v * it.r * .6, 5, .3, 6); ctx.lineTo(it.x + u * it.r, it.y + v * it.r * .6); ctx.fill(); });
      ctx.strokeStyle = '#557a2c'; ctx.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = 2.2 + k * .12, x = it.x + Math.cos(a) * (it.r + 2), y = it.y + Math.sin(a) * (it.r * .7 + 2); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y - 9); ctx.stroke(); } }
    else if (it.t === 'pcar') drawCar(it.x, it.y, Math.PI / 2, 50, 26, it.col, false, 0);
  }
  // ielu lampas (stabiņi)
  ctx.fillStyle = '#3d4250'; [[b.x0 + 8, b.y0 + 8], [b.x1 - 8, b.y0 + 8], [b.x0 + 8, b.y1 - 8], [b.x1 - 8, b.y1 - 8], [(b.x0 + b.x1) / 2, b.y0 + 8], [(b.x0 + b.x1) / 2, b.y1 - 8], [b.x0 + 8, (b.y0 + b.y1) / 2], [b.x1 - 8, (b.y0 + b.y1) / 2]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); });
  for (const tr of b.trees) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.arc(tr.x + 5, tr.y + 6, tr.r, 0, 7); ctx.fill();
    const f = 40 * PK, x = tr.x + (tr.x - cam.x) * f, y = tr.y + (tr.y - cam.y) * f; ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tr.x, tr.y); ctx.lineTo(x, y); ctx.stroke();
    if (tr.fir) { ctx.fillStyle = '#2f6b35'; ctx.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, rr_ = k % 2 ? tr.r * .55 : tr.r; ctx.lineTo(x + Math.cos(a) * rr_, y + Math.sin(a) * rr_); } ctx.fill(); ctx.fillStyle = '#3d8445'; ctx.beginPath(); ctx.arc(x, y, tr.r * .4, 0, 7); ctx.fill(); }
    else { const tt = tr.tint || 0, c1 = tt < .33 ? '#3f8f3a' : tt < .66 ? '#4a9a3c' : '#5d8f2f', c2 = tt < .33 ? '#5bb04f' : tt < .66 ? '#6cbf55' : '#86b347';
      ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(x, y, tr.r, 0, 7); ctx.arc(x + tr.r * .5, y + tr.r * .2, tr.r * .7, 0, 7); ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(x - tr.r * .25, y - tr.r * .25, tr.r * .55, 0, 7); ctx.fill(); } }
}
function drawHospital(b, ix0, iy0, ix1, iy1, t) {
  ctx.fillStyle = '#9ccc82'; ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0);
  ctx.fillStyle = '#6b7080'; ctx.fillRect(ix0 + 40, iy1 - 70, ix1 - ix0 - 80, 70); // uzbrauktuve
  const cx = (ix0 + ix1) / 2; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚑 SLIMNĪCA', cx, iy1 - 34);
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
  if (window.KMap && KMap.on() && KMap.draw(t)) return;
  const MW = mini.width, k = MW / (S + RW), g = mctx; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#4f7d43'; g.fillRect(0, 0, MW, MW); g.save(); g.translate(RW / 2 * k, RW / 2 * k); g.scale(k, k);
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
function frame(now) { const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; T += dt;
  updateCars(dt, T); updateAmb(dt);
  if (M.state === 'toPatient') M.t += dt; if (M.state === 'toHospital') { M.t2 += dt; M.cond = Math.max(5, M.cond - dt * (M.c.cpr ? .8 : .35)); }
  if ((M.state === 'toPatient' || M.state === 'toHospital') && (M.rt -= dt) <= 0) { M.rt = .6; M.route = M.state === 'toPatient' ? routeTo(M.rx, M.ry) : routeTo(HOSP_BAY.x, HOSP_BAY.y); }
  // kamera: seko ar skatu uz priekšu, ātrumā nedaudz attālinās
  const base = clamp(Math.min(W, H) / 640, .5, 1.05), zt = base * (amb.heli ? .8 : 1) * (1 - .16 * clamp(Math.abs(amb.v) / 430, 0, 1));
  cam.z = lerp(cam.z, zt, Math.min(1, dt * 2)); const lx = amb.x + Math.cos(amb.a) * amb.v * .45, ly = amb.y + Math.sin(amb.a) * amb.v * .45;
  cam.x = lerp(cam.x, lx, Math.min(1, dt * 4)); cam.y = lerp(cam.y, ly, Math.min(1, dt * 4)); cam.shake *= Math.pow(.01, dt);
  const sh = cam.shake > .3 ? (Math.random() - .5) * cam.shake : 0;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = '#7dbb63'; ctx.fillRect(0, 0, W, H);
  if (window.FP && FP.on && FP.ready) FP.render(T);
  else { ctx.setTransform(DPR * cam.z, 0, 0, DPR * cam.z, DPR * (W / 2 - cam.x * cam.z + sh), DPR * (H / 2 - cam.y * cam.z + sh)); drawWorld(T);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); drawPointer(); }
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .45, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  drawMini(T); hud(); updateAudio();
  requestAnimationFrame(frame); }

let hudKey = '';
function hud() {
  const L = levelOf(save.xp); let task = '', dist = 0, actOn = false, actI = '🩺', actT = 'Palīdzēt', go = false;
  if (M.state === 'toPatient') { dist = Math.round(M.route.len / 10); task = `${M.c.who} ${M.c.call}<small>📍 ${streetOf(M.rx, M.ry)} · ⏱ ${Math.floor(M.t)} s</small>`; actOn = near(M.rx, M.ry, amb.heli ? 210 : 130) && Math.abs(amb.v) < 70; }
  else if (M.state === 'toHospital') { dist = Math.round(M.route.len / 10); task = `🏥 Ved pacientu uz slimnīcu<small>${M.c.who} ${M.c.name} · ⏱ ${Math.floor(M.t2)} s</small>`; actOn = near(HOSP_BAY.x, HOSP_BAY.y, amb.heli ? 210 : 140) && Math.abs(amb.v) < 70; actI = '🏥'; actT = 'Nodot'; go = true; }
  else if (M.state === 'scene') task = '🩺 Palīdzi pacientam'; else { task = '🚗 Brīvs brauciens<small>Spied 📞, kad gribi izsaukumu</small>'; actOn = true; actI = '📞'; actT = 'Izsaukums'; go = true; }
  if (nearFuel() && Math.abs(amb.v) < 70 && M.state !== 'scene' && amb.fuel < 99) { actOn = true; actI = '⛽'; actT = `€${fuelCost()}`; go = true; }
  const key = [L.l, L.cur, wallet, Math.floor(hourNow() * 6), task, dist, actOn, actI, actT, Math.round(M.cond), Math.round(amb.fuel)].join('|'); if (key === hudKey) return; hudKey = key;
  const hh = hourNow(), clk = `${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor(hh % 1 * 60)).padStart(2, '0')}`; $('sLv').textContent = `🚑 ${L.l}. līm. · ${isNight() ? '🌙' : '☀️'} ${clk}`; $('sXp').style.width = (L.cur / L.need * 100) + '%'; $('sMoney').innerHTML = `<b style="color:${wallet < 0 ? '#ff5a6a' : '#ffd34d'};font-size:14px;display:inline">💰 €${wallet}</b> <span style="color:${amb.fuel < 20 ? '#ff5a6a' : '#cfe'}">⛽ ${Math.round(amb.fuel)}%</span>`;
  $('task').innerHTML = (dist ? `<span class="dist">${dist} m</span>` : '') + task;
  const b = $('bAct'); b.classList.toggle('off', !actOn); b.classList.toggle('go', go); $('bActI').textContent = actI; $('bActT').textContent = actT;
  const pb = $('pBar'); pb.classList.toggle('on', M.state === 'toHospital'); if (M.state === 'toHospital') { const c = Math.round(M.cond); $('pFill').style.width = c + '%'; $('pFill').style.background = c > 60 ? '#2ecc71' : c > 30 ? '#ffb020' : '#ff3b4e'; $('pTxt').textContent = `🫀 Pacienta stāvoklis ${c}% – brauc uzmanīgi!`; }
}

// ================= Skaņa =================
let FXV = 1; try { FXV = +(localStorage.getItem('apFx') ?? 1); } catch (e) {}
let AC = null, sirO = null, sirG = null, engO = null, engG = null;
function audioInit() { if (window.TWRadio) TWRadio.start(); if (AC) { if (AC.state === 'suspended') AC.resume(); return; } try { AC = new (window.AudioContext || window.webkitAudioContext)();
  sirO = AC.createOscillator(); sirO.type = 'triangle'; sirG = AC.createGain(); sirG.gain.value = 0; sirO.connect(sirG); sirG.connect(AC.destination); sirO.start();
  engO = AC.createOscillator(); engO.type = 'sawtooth'; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; engG = AC.createGain(); engG.gain.value = 0; engO.connect(f); f.connect(engG); engG.connect(AC.destination); engO.start(); } catch (e) {} }
function updateAudio() { if (!AC) return; const T0 = AC.currentTime;
  // Eiropas divu toņu sirēna (ī-ā)
  sirO.frequency.setTargetAtTime(Math.floor(T * 1.6) % 2 ? 640 : 880, T0, .01); sirG.gain.setTargetAtTime(amb.siren && !$('ov').classList.contains('on') ? .045 * FXV : 0, T0, .05);
  engO.frequency.setTargetAtTime(48 + Math.abs(amb.v) * .22, T0, .05); engG.gain.setTargetAtTime((.02 + Math.abs(amb.v) / 430 * .05) * FXV, T0, .1);
  if (window.TWRadio) TWRadio.duck(M.state === 'scene' ? .55 : amb.siren ? .75 : 1); }
function tone(f0, f1, d, type = 'sine', vol = .12, delay = 0) { if (!AC) return; const t0 = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + d);
  g.gain.setValueAtTime(Math.max(.0011, vol * FXV), t0); g.gain.exponentialRampToValueAtTime(.001, t0 + d); o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + d + .05); }
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
// instrukcija pirms spēles (kopīgais TW.intro): īsti kadri no spēles + daži vārdi; pirmajā reizē pati, vēlāk ⚙ → ❓ Kā spēlēt
const INTRO = [{ img: 'intro/1.webp', t: 'Brauc pa dzelteno līniju 🚑' }, { img: 'intro/2.webp', t: 'Uzdod pareizos jautājumus' }, { img: 'intro/3.webp', t: 'Velc rīku uz traumu' },
  { img: 'intro/4.webp', t: 'Spied ritmā – sirds masāža ❤️' }, { img: 'intro/5.webp', t: 'Noķer izlicējus! 😄' }];
const showIntro = force => window.TW && TW.intro ? TW.intro('ap', INTRO, force) : Promise.resolve();
function start() { heliBtn(); if (save.fuel != null) amb.fuel = save.fuel; requestAnimationFrame(frame); showIntro().then(intro); }
function intro() {
  sheet(`<div class="step">Tailers World · pilsēta</div><h2>🚑 Ātrā palīdzība 112</h2>
    <p>Tu esi ātrās palīdzības brigāde. Brauc pie pacientiem, noskaidro, kas noticis, palīdzi un, ja vajag, ved uz slimnīcu.</p>
    <div class="fact">${isTouch ? '🕹️ Pieskaries <b>jebkur uz kartes</b> un velc pirkstu uz to pusi, kur jābrauc – tur parādās kursorsvira.' : '⌨️ Brauc ar <b>bultiņām</b> (vai W A D), <b>S</b> – sirēna, <b>E</b> – palīdzēt.'}<br>🚨 <b>Sirēna</b> – mašīnas palaiž tevi garām.<br>🟡 Dzeltenā līnija rāda ceļu. Kartē sarkanie ceļi – sastrēgumi.<br>⛽ Degviela maksā – uzpildi benzīntankā. 💥 Avārija = remonts −€1.</div>
    <button class="main red" id="st">Sākt maiņu</button>`);
  $('st').onclick = () => { audioInit(); closeSheet(); setTimeout(newCall, 300); };
}
if (ONLINE && window.firebase && window.TW_FIREBASE) {
  firebase.auth().onAuthStateChanged(async u => {
    if (!u) { location.href = '../index.html'; return; }
    UID = u.uid; NAME = u.email.split('@')[0]; const db = firebase.database();
    try { const v = (await db.ref('users/' + UID).get()).val() || {}; if (v.name) NAME = v.name; NICK = v.nick || ''; if (v.look) LOOK = Object.assign(LOOK, v.look); } catch (e) {}
    try { const s = (await db.ref('ap/saves/' + UID).get()).val(); if (s) save = Object.assign(save, s); else { const l = JSON.parse(localStorage.getItem(LKEY())); if (l) save = Object.assign(save, l); } } catch (e) {}
    TW.wallet.watch(UID, v => { if (v != null) { wallet = v; hudKey = ''; } });
    if (window.TW) await TW.ready;
    if (window.TW) { TW.heartbeat(UID, () => ({ game: 'Ātrā palīdzība', where: M.state === 'toHospital' ? 'Ved pacientu uz slimnīcu' : M.state === 'scene' ? 'Pie pacienta' : `Līm. ${levelOf(save.xp).l}`, name: NAME, nick: NICK })); }
    db.ref('kicks/' + UID).on('value', s => { const k = s.val(); if (k && k.until > TW.now()) { alert('Tevi uz laiku izmeta no spēles. Spēlē draudzīgi! 🙂'); location.href = '../index.html'; } }, () => {});
    if (window.TWA) TWA.load ? TWA.load(UID).catch(() => {}) : 0;
    start();
  });
} else start();
