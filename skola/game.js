// Skola – tu vadi stundu. Uz tāfeles jautājums, skolēni paceļ rokas ar atbildēm burbuļos – pieskaries tam, kuram pareizā.
// Daži skolēni draiskojas: pirms joka virs galvas ❗ – pieskaries laikus, un joks kļūst par jautru faktu. Zaudēt nevar.
// Teksti latviski. Dati Firebase: skola/saves/{uid}; nauda – kopīgais maciņš (TW.wallet); medaļas – grupa 'skola'.
'use strict';
const cv = document.getElementById('cv'), g = cv.getContext('2d');
const $ = id => document.getElementById(id);
let W = innerWidth, H = innerHeight, DPR = Math.min(2, devicePixelRatio || 1);

const QN = 8; // jautājumi stundā
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const levelOf = xp => { let l = 1, need = 120; while (xp >= need) { xp -= need; l++; need = 120 + 60 * (l - 1); } return { l, cur: xp, need }; };

// ================= Saturs =================
// fakti no questions.js → objekti ar stabilu id (priekšmets + kārtas numurs priekšmetā)
const Q = (() => { const n = {}; return FACTS.map(([s, gr, q, a, w, e]) => ({ id: s + (n[s] = (n[s] || 0) + 1), s, g: gr, q, a, w: w.split('|'), e })); })();
const fmt = n => String(Math.round(n * 100) / 100).replace('.', ',');
// 3 nepareizas atbildes tuvu pareizajai (vispirms tipiskās kļūdas)
function near(a, pref = []) { const st = Number.isInteger(a) ? 1 : .25, out = [];
  for (const v0 of [...pref, ...shuffle([a + st, a - st, a + 2 * st, a - 2 * st, a + 3 * st, a + 10 * st])]) { const v = Math.round(v0 * 100) / 100;
    if (Number.isFinite(v) && v !== a && v >= 0 && !out.includes(v)) out.push(v); if (out.length === 3) break; }
  return out; }
const WP = [
  () => { const n = ri(18, 30), k = ri(3, 9); return [`Klasē ir ${n} skolēni. ${k} aizgāja uz koncertu. Cik palika klasē?`, n - k, `${n} − ${k} = ${n - k}.`]; },
  () => { const b = ri(3, 6), c = ri(4, 8); return [`Katrā no ${b} kastēm ir ${c} zīmuļi. Cik zīmuļu ir pavisam?`, b * c, `${b} · ${c} = ${b * c}.`]; },
  () => { const n = ri(3, 8) * 4; return [`${n} konfektes vienādi sadala 4 draugiem. Cik dabū katrs?`, n / 4, `${n} : 4 = ${n / 4}.`]; },
  () => { const p = ri(2, 9), q = ri(11, 25); return [`Grāmata maksā €${q}, pildspalva €${p}. Cik maksā abas kopā?`, p + q, `${q} + ${p} = ${p + q}.`]; },
  () => { const h = ri(2, 5); return [`Cik minūšu ir ${h} stundās?`, h * 60, `1 stunda = 60 minūtes, ${h} · 60 = ${h * 60}.`]; },
  () => { const m = ri(2, 9); return [`Cik centimetru ir ${m} metros?`, m * 100, `1 m = 100 cm, ${m} · 100 = ${m * 100}.`]; },
];
// matemātika pēc līmeņa 1–8 (1 = saskaitīšana līdz 10 … 8 = lielāka reizināšana un decimāldaļas)
function mathQ(lv) {
  let q, a, e, w = [];
  if (lv <= 1) { const x = ri(1, 8), y = ri(1, 10 - x); a = x + y; q = `${x} + ${y} = ?`; e = `${x} + ${y} = ${a}. Var skaitīt uz pirkstiem: ${x}, un vēl ${y}.`; }
  else if (lv === 2) {
    if (Math.random() < .5) { const x = ri(3, 9), y = ri(11 - x, 9), t = 10 - x; a = x + y; q = `${x} + ${y} = ?`; e = `Vispirms līdz 10: ${x} + ${t} = 10, tad vēl ${y - t} → ${a}.`; w = [a - 10, a + 1]; }
    else { const x = ri(11, 18), y = ri(x - 9, 9), t = x - 10; a = x - y; q = `${x} − ${y} = ?`; e = `Vispirms līdz 10: ${x} − ${t} = 10, tad vēl − ${y - t} → ${a}.`; w = [a + 10, a - 1]; }
  } else if (lv === 3) { const k = Math.random();
    if (k < .35) { const x = ri(1, 8) * 10, y = ri(1, (100 - x) / 10) * 10; a = x + y; q = `${x} + ${y} = ?`; e = `${x / 10} desmiti + ${y / 10} desmiti = ${a / 10} desmiti → ${a}.`; w = [a + 10, a - 10]; }
    else if (k < .7) { const x = ri(2, 9) * 10 + ri(1, 5), y = ri(1, 9 - x % 10); a = x + y; q = `${x} + ${y} = ?`; e = `Saskaiti vieniniekus: ${x % 10} + ${y} = ${x % 10 + y}, desmiti paliek → ${a}.`; w = [a + 10, a - 10]; }
    else { const x = ri(3, 9) * 10 + ri(5, 9), y = ri(1, x % 10); a = x - y; q = `${x} − ${y} = ?`; e = `Atņem vieniniekus: ${x % 10} − ${y} = ${x % 10 - y}, desmiti paliek → ${a}.`; w = [a - 10, a + 10]; }
  } else if (lv === 4) { const x = pick([2, 3, 4, 5, 10]), y = ri(2, 10); a = x * y; q = `${x} · ${y} = ?`;
    e = y <= 5 ? `${x} · ${y} = ${Array(y).fill(x).join(' + ')} = ${a}.` : `${x} · ${y - 1} = ${x * (y - 1)}, un vēl + ${x} → ${a}.`; w = [x * (y + 1), x * (y - 1)];
  } else if (lv === 5) {
    if (Math.random() < .55) { const x = ri(3, 9), y = ri(3, 9); a = x * y; q = `${x} · ${y} = ?`; e = `Padoms: ${x} · ${y - 1} = ${x * (y - 1)}, plus ${x} → ${a}.`; w = [x * (y + 1), x * (y - 1)]; }
    else { const b = ri(2, 9), x = ri(2, 9); a = b; q = `${b * x} : ${x} = ?`; e = `Domā reizrēķinā: ${x} · ? = ${b * x}. ${x} · ${b} = ${b * x}, tātad ${b}.`; w = [b + 1, b - 1]; }
  } else if (lv === 6) {
    if (Math.random() < .45) {
      if (Math.random() < .5) { const x = ri(25, 69), y = ri(13, 29), t = Math.floor(y / 10) * 10; a = x + y; q = `${x} + ${y} = ?`; e = `${x} + ${t} = ${x + t}, tad + ${y - t} → ${a}.`; w = [a - 10, a + 10]; }
      else { const x = ri(42, 89), y = ri(13, 39), t = Math.floor(y / 10) * 10; a = x - y; q = `${x} − ${y} = ?`; e = `${x} − ${t} = ${x - t}, tad − ${y - t} → ${a}.`; w = [a + 10, a - 10]; }
    } else { const r = pick(WP)(); q = r[0]; a = r[1]; e = r[2]; const d = Math.max(1, Math.round(a / 10)); w = [a + d, a - d]; }
  } else if (lv === 7) { const k = ri(0, 3);
    if (k === 0) { const n = ri(3, 15) * 2; a = n / 2; q = `Cik ir puse no ${n}?`; e = `Puse – dala ar 2: ${n} : 2 = ${a}.`; w = [n * 2]; }
    else if (k === 1) { const n = ri(2, 10) * 4; a = n / 4; q = `Cik ir ceturtdaļa no ${n}?`; e = `Ceturtdaļa – dala ar 4: ${n} : 4 = ${a}.`; w = [n / 2]; }
    else if (k === 2) { const n = ri(2, 20) * 10; a = n / 10; q = `Cik ir 10% no ${n}?`; e = `10% ir desmitā daļa: ${n} : 10 = ${a}.`; w = [n / 2, a * 2]; }
    else { const x = ri(2, 9), y = ri(2, 6), z = ri(2, 6); a = x + y * z; q = `${x} + ${y} · ${z} = ?`; e = `Vispirms reizina: ${y} · ${z} = ${y * z}, tad ${x} + ${y * z} = ${a}.`; w = [(x + y) * z]; }
  } else { const k = ri(0, 3);
    if (k === 0) { const x = ri(12, 19), y = pick([2, 3, 4, 5]); a = x * y; q = `${x} · ${y} = ?`; e = `${x} · ${y} = 10 · ${y} + ${x - 10} · ${y} = ${10 * y} + ${(x - 10) * y} = ${a}.`; w = [a + y, a - y]; }
    else if (k === 1) { const x = pick([25, 50, 75, 125]); a = x * 4; q = `${x} · 4 = ?`; e = `· 4 ir divreiz · 2: ${x} · 2 = ${x * 2}, ${x * 2} · 2 = ${a}.`; w = [x * 2, a + 25]; }
    else if (k === 2) { const A = pick([.5, .25, .75, 1.5]), B = pick([.5, .25, 1, .75]); a = A + B; q = `${fmt(A)} + ${fmt(B)} = ?`; e = `Simtdaļās: ${A * 100} + ${B * 100} = ${a * 100} simtdaļas → ${fmt(a)}.`; w = [a + .5, a - .25]; }
    else { const n = ri(2, 10) * 4; a = n / 4; q = `Cik ir 25% no ${n}?`; e = `25% ir ceturtdaļa: ${n} : 4 = ${a}.`; w = [n / 2, a * 2]; }
  }
  return { mat: true, q, a: fmt(a), w: near(a, w).map(fmt), e };
}

// skaitļu virknes – „kas nāk tālāk?” (kā IQ testos), grūtāk ar līmeni
function logicQ(lv) {
  let seq, a, e, w = [];
  const k = lv <= 2 ? 0 : lv <= 4 ? ri(0, 2) : ri(1, 4);
  if (k === 0) { const s0 = ri(1, 10), d = ri(1, lv <= 1 ? 2 : 5); seq = [0, 1, 2, 3].map(i => s0 + d * i); a = s0 + 4 * d; e = `Katrs nākamais ir par ${d} lielāks: ${seq[3]} + ${d} = ${a}.`; w = [a + d, a - 1]; }
  else if (k === 1) { const s0 = ri(30, 60), d = ri(2, 6); seq = [0, 1, 2, 3].map(i => s0 - d * i); a = s0 - 4 * d; e = `Katrs nākamais ir par ${d} mazāks: ${seq[3]} − ${d} = ${a}.`; w = [a - d, a + d]; }
  else if (k === 2) { const s0 = ri(1, 3), m = lv <= 4 ? 2 : pick([2, 3]); seq = [0, 1, 2, 3].map(i => s0 * m ** i); a = s0 * m ** 4; e = `Katrs nākamais ir ${m} reizes lielāks: ${seq[3]} · ${m} = ${a}.`; w = [seq[3] + (seq[3] - seq[2]), a + m]; }
  else if (k === 3) { const o = ri(1, 3); seq = [0, 1, 2, 3].map(i => (i + o) ** 2); a = (4 + o) ** 2; e = `Tie ir kvadrāti: ${o}·${o}, ${o + 1}·${o + 1}… nākamais ${4 + o}·${4 + o} = ${a}.`; w = [seq[3] + (seq[3] - seq[2]), a + 1]; }
  else { const x = ri(1, 3), y = ri(1, 4); seq = [x, y]; for (let i = 2; i < 5; i++) seq.push(seq[i - 1] + seq[i - 2]); a = seq[3] + seq[4]; e = `Katrs nākamais ir divu iepriekšējo summa: ${seq[3]} + ${seq[4]} = ${a}.`; w = [seq[4] + (seq[4] - seq[3]), a + 1]; }
  return { lg: true, q: `Kurš skaitlis nāk tālāk? ${seq.join(', ')}, …`, a: String(a), w: near(a, w).map(String), e };
}

// ================= Klase =================
const KIDS = [
  { n: 'Markuss', skin: '#f2c9a0', hair: '#5a3a22', hs: 'short', shirt: '#3d8bff' },
  { n: 'Elza', skin: '#f6d3b3', hair: '#e0b04a', hs: 'pony', shirt: '#ff6b8a' },
  { n: 'Rūdis', skin: '#e9b48a', hair: '#c2552b', hs: 'curly', shirt: '#2ecc71' },
  { n: 'Paula', skin: '#f2c9a0', hair: '#2b2024', hs: 'long', shirt: '#a66bff' },
  { n: 'Kārlis', skin: '#c98f63', hair: '#1e1a1a', hs: 'buzz', shirt: '#ffb020' },
  { n: 'Līva', skin: '#f6d3b3', hair: '#8a5a2b', hs: 'bun', shirt: '#20c4c4' },
  { n: 'Emīls', skin: '#f0c39a', hair: '#d9a441', hs: 'spiky', shirt: '#ff7a3d' },
  { n: 'Sofija', skin: '#8d5b3e', hair: '#1e1a1a', hs: 'puffs', shirt: '#e8c43a' },
  { n: 'Jēkabs', skin: '#f2c9a0', hair: '#a0522d', hs: 'spiky', shirt: '#5b6cff' },
  { n: 'Marta', skin: '#f6d3b3', hair: '#d9a441', hs: 'long', shirt: '#ff8fc8' },
  { n: 'Roberts', skin: '#e9b48a', hair: '#3a2a20', hs: 'short', shirt: '#2ecc71' },
  { n: 'Alise', skin: '#f2c9a0', hair: '#c2552b', hs: 'pony', shirt: '#3d8bff' },
  { n: 'Daniels', skin: '#8d5b3e', hair: '#1e1a1a', hs: 'curly', shirt: '#ff5a6a' },
  { n: 'Katrīna', skin: '#f6d3b3', hair: '#5a3a22', hs: 'bun', shirt: '#ffb020' },
  { n: 'Gustavs', skin: '#f0c39a', hair: '#e0b04a', hs: 'buzz', shirt: '#a66bff' },
  { n: 'Estere', skin: '#c98f63', hair: '#2b2024', hs: 'puffs', shirt: '#20c4c4' },
];
// joki: ko skolēns dara un ko pastāsta, ja viņu pieķer laikus
const PRANKS = {
  plane: { i: '✈️', fact: 'Brāļi Raiti pirmo reizi pacēlās ar lidmašīnu 1903. gadā.' },
  frog: { i: '🐸', fact: 'Vardes ūdeni „dzer” caur ādu!' },
  phone: { i: '📱', fact: 'Pirmo tālruni izgudroja 1876. gadā – pirms 150 gadiem.' },
  gum: { i: '🫧', fact: 'Cilvēka mutē dienā izdalās ap litru siekalu.' },
  drum: { i: '🥁', fact: 'Bungas ir viens no senākajiem mūzikas instrumentiem.' },
  sleep: { i: '💤', fact: 'Skolēniem naktī vajag 9–12 stundas miega.' },
  spit: { i: '🥤', fact: 'Papīru izgudroja Ķīnā gandrīz pirms 2000 gadiem.' },
  throw: { i: '📄', fact: 'Pirmais basketbola grozs bija augļu grozs – bumba palika iekšā!' },
  note: { i: '📝', fact: 'Vārds „papīrs” cēlies no papirusa – uz tā rakstīja senie ēģiptieši.' },
};
const SORRY = ['Atvainojiet, skolotāj! 😅', 'Es tikai… nekas! 🙈', 'Labi, labi! 😇', 'Hmm, pieķēra… 😬', 'Vairs nebūs! 🙏'];
// klases rotājumi (pērk par kopīgo naudu, redzami klasē)
// tāfeles krāsas (pērk veikalā, izvēlas savu)
const BOARDS = [
  { id: 'green', n: 'Zaļa', c: ['#2f6a4f', '#24533d'], ink: '#ffffff', p: 0 },
  { id: 'black', n: 'Melna', c: ['#383c42', '#212428'], ink: '#ffffff', p: 25 },
  { id: 'blue', n: 'Zila', c: ['#2d5684', '#1f3d63'], ink: '#ffffff', p: 25 },
  { id: 'wine', n: 'Ķiršu', c: ['#7a3442', '#5a2430'], ink: '#fff4e0', p: 40 },
  { id: 'white', n: 'Baltā', c: ['#fbfbf8', '#e6e9e3'], ink: '#1f3a8a', p: 60 },
];
const boardC = () => BOARDS.find(b => b.id === save.board) || BOARDS[0];
// skolas diena: 4 stundas, pēc 2. – pusdienas
const DAY = [[8, 30], [9, 20], [10, 40], [11, 30]];
const DECO = [
  { id: 'plant', i: '🪴', n: 'Puķupods', p: 30 },
  { id: 'globe', i: '🌍', n: 'Globuss', p: 60 },
  { id: 'fish', i: '🐠', n: 'Akvārijs', p: 120 },
  { id: 'rocket', i: '🚀', n: 'Kosmosa plakāts', p: 200 },
  { id: 'lights', i: '💡', n: 'Krāsaina virtene', p: 300 },
  { id: 'cat', i: '🐈', n: 'Klases kaķis', p: 500 },
];

let save = { xp: 0, lessons: 0, perfect: 0, caught: 0, correct: 0, ml: 1, miss: [], seen: [], deco: {}, tut: 0, board: 'green', boards: { green: 1 }, day: 0, en: 100 };
let kids = [], L = null, LT = 0, timers = [], fx = [], stuck = [], splats = [], LY = { board: { x: 0, y: 0, w: 0, h: 0 } };
function pickKids() { kids = shuffle(KIDS.slice()).map((k, i) => Object.assign({}, k, { st: 'idle', t: 0, ans: '', ph: Math.random() * 6, i })); layout(); }
const later = (s, fn) => timers.push({ t: LT + s, fn });

// izkārtojums: 3D klase no skolotāja galda – aizmugurējā siena ar tāfeli, grīda perspektīvā,
// 10 skolēni 3 rindās (4+3+3, tālākie mazāki), apakšā skolotāja galds ar kafijas krūzi
function layout() {
  W = innerWidth; H = innerHeight; const land = W > H, sr = $('stat').getBoundingClientRect(), tr = $('task').getBoundingClientRect();
  const gap = W - 2 * Math.max(sr.right, W - tr.left) - 16;
  if (land && gap >= 300) { const bw = Math.min(gap, 560), bh = clamp(H * .28, 80, 150); LY.board = { x: (W - bw) / 2, y: sr.top + 2, w: bw, h: bh }; }
  else { const top = Math.max(sr.bottom, tr.bottom) + 10, bh = land ? clamp(H * .25, 78, 170) : clamp(H * .19, 104, 200), bw = Math.min(W * .8, land ? Math.max(420, W * .56) : 620);
    LY.board = { x: (W - bw) / 2, y: top, w: bw, h: bh }; }
  const b = LY.board, hy = b.y + b.h * .45, fy = b.y + b.h + (land ? 16 : 30), wx0 = Math.max(W * .07, b.x - (land ? 70 : 26));
  const dh = clamp(H * .11, 46, 84);
  LY.room = { hy, fy, wx0, wx1: W - wx0, top: Math.max(-40, b.y - b.h * .35) };
  LY.td = { y: H - dh, h: dh }; LY.hudB = Math.max(sr.bottom, tr.bottom); LY.hudL = sr.right; LY.hudR = tr.left;
  $('banner').style.bottom = $('toast').style.bottom = `calc(${Math.round(dh + 8)}px + env(safe-area-inset-bottom))`;
  // 4×4 soli ar ejām starp tiem; pirmā rinda atstatus no skolotāja galda
  const rows = [4, 4, 4, 4], U = [-1.5, -.5, .5, 1.5], fr = [.22, .47, .73, 1];
  const hv = hy - (fy - hy) * 1.3; // tēliem maigāka perspektīva nekā telpai
  const s = Math.min(40, (H - dh - fy) / 8.2, (W / 2 - 4) / (1.5 * 5.4 + 2.05)), yf = H - dh - 1.9 * s, X = Math.min((W / 2 - 2.05 * s) / 1.5, s * 7);
  let i = 0;
  rows.forEach((cnt, r) => { const y = fy + (yf - fy) * fr[r], k = (y - hv) / (yf - hv);
    for (let c = 0; c < cnt; c++, i++) { const kd = kids[i]; if (!kd) continue; kd.r = r; kd.c = c; kd.s = s * k; kd.x = W / 2 + U[c] * X * k; kd.y = y; } });
  LY.u0 = s * (fy - hv) / (yf - hv); // mērogs pie aizmugurējās sienas
  LY.order = kids.slice().sort((a, b) => a.y - b.y);
  LY.mug = { x: W - clamp(W * .14, 50, 120), y: H - dh * .5, r: dh * .3 };
  LY.folder = { x: clamp(W * .08, 14, 70), y: H - dh * .82, w: dh * 1.1, h: dh * .66 };
}
function resize() { DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; layout(); }
addEventListener('resize', resize);

// ================= Stunda =================
// grūtība aug ar skolotāja līmeni: faktu pakāpes (1–3), matemātikas minimums, draiskuļu skaits un ātrums
const tLv = () => levelOf(save.xp).l;
// jautājumu grūtība = klase (1.–9.): aug ar līmeni, bet žurnāla mapītē var izvēlēties zemāku
const autoGrade = () => clamp(1 + Math.floor((tLv() - 1) / 2), 1, 9);
const grade = () => save.grade ? Math.min(save.grade, autoGrade()) : autoGrade();
const maxTier = () => grade() >= 5 ? 3 : grade() >= 2 ? 2 : 1;
const mathFloor = () => Math.min(7, grade());
const maxBusy = () => 1 + (tLv() >= 4) + (tLv() >= 8);
const maxPerQ = () => Math.min(4, 2 + Math.floor((tLv() - 1) / 3));
// stunda: 5 fakti (visi priekšmeti + loģikas mīklas), 2 matemātika, 1 skaitļu virkne
function buildQs() {
  const mt = maxTier(), pool = Q.filter(f => f.g <= mt);
  const miss = shuffle(pool.filter(f => save.miss.includes(f.id))).slice(0, 2);
  const fresh = shuffle(pool.filter(f => !save.seen.includes(f.id) && !miss.includes(f)));
  if (mt > 1) fresh.sort((a, b) => (b.g - a.g) + (Math.random() - .5) * 1.6);
  const old = shuffle(pool.filter(f => save.seen.includes(f.id) && !miss.includes(f)));
  const list = [...miss, ...fresh, ...old].slice(0, QN - 3);
  list.push({ mat: true }, { mat: true }, { lg: true });
  return shuffle(list);
}
const tutOn = () => !save.tut;
// laiks vienam jautājumam: garākam tekstam vairāk, augstākā līmenī mazāk
const qDur = q => clamp(16 + q.q.length * .12 - (grade() - 1) * 1.1, 10, 30) * (tutOn() ? 1.5 : 1);
// skolotāja enerģija: krīt stundas laikā, kafija +40, pusdienas – pilna
let energy = 100, mugAt = -99;
const mugFull = () => LT - mugAt > 35;
function drinkCoffee() {
  if (!mugFull()) { toast('☕ Krūze tukša – jaunā kafija drīz būs gatava'); sfx('tick'); return; }
  mugAt = LT; energy = Math.min(100, energy + 40); sfx('slurp'); buzz(20); addFx(LY.mug.x - 30, LY.mug.y - 50, '☕ +40 ⚡', '#ffd34d'); hud();
  if (L.tutCoffee === 1) { L.tutCoffee = 2; banner(''); }
}
const clockMin = () => { const d = DAY[save.day % 4], p = L && L.st !== 'end' ? clamp((L.n + clamp((LT - L.qT) / (L.qd || 20), 0, 1)) / QN, 0, 1) : 0; return d[0] * 60 + d[1] + p * 40; };
const clockTxt = () => { const m = Math.floor(clockMin()); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
// tualete: kāds paceļ roku – laist vai nē? Šmaucējs smīn un kabatā telefons; tiešām vajag – dīdās un svīst
function wcStart() {
  const c = kids.filter(k => k.st === 'idle' && !k.out); if (!c.length) return; const k = pick(c);
  k.st = 'wc'; k.t = LT; k.fake = Math.random() < .45; L.wcN++; sfx('tick');
  if (!save.wcTut) { save.wcTut = 1; banner('🚽 Kāds grib uz tualeti! Vai viņam tiešām vajag? Paskaties uzmanīgi 👀', 4500); }
}
function wcDecide(k, yes) {
  const good = yes !== k.fake; k.wcBtn = null;
  if (good) { L.wcOk++; mood(4); sfx('good'); addFx(k.x, k.y - 4.4 * k.s, yes ? '👍 Pareizi!' : '🕵️ Pieķerts šmaucoties!', '#7dffa8'); }
  else { L.wcBad++; mood(-6); sfx('bad'); addFx(k.x, k.y - 4.4 * k.s, yes ? '😏 Viņš šmaucās!' : '😣 Viņam tiešām vajadzēja…', '#ffb0b8'); }
  if (yes) { k.st = 'idle'; k.out = LT + 10; k.ans = ''; } else { k.st = k.fake ? 'caught' : 'sad'; k.say = k.fake ? 'Labi, labi… 😅' : ''; k.back = 'idle'; k.t = LT; if (!k.fake) later(1.5, () => { if (k.st === 'sad') k.st = 'idle'; }); }
  hud();
}
const warnDur = () => Math.max(.55, 1.5 - (tLv() - 1) * .07) * (energy < 30 ? .7 : 1);
const prankGap = () => rnd(4.5, 9) * Math.max(.5, 1 - (tLv() - 1) * .05);

function startLesson() {
  closeSheet(); audioInit(); timers = []; fx = []; stuck = []; splats = []; pickKids();
  L = { qs: buildQs(), n: -1, ok: 0, mood: 70, caught: 0, missed: 0, st: 'wait', wrong: 0, qT: LT, np: Infinity, qp: 0, cur: null, wcN: 0, wcOk: 0, wcBad: 0,
    wcAt: !tutOn() && Math.random() < .75 ? LT + rnd(10, 60) : Infinity };
  kids.forEach(k => { k.out = 0; });
  sfx('bell'); hud(); later(.9, nextQ);
}
function nextQ() {
  L.n++; stuck = []; if (L.n >= QN) { endLesson(); return; }
  let q = L.qs[L.n]; const ml = clamp(Math.floor(save.ml), mathFloor(), Math.min(8, grade() + 2)); if (q.mat) q = L.qs[L.n] = mathQ(ml); else if (q.lg) q = L.qs[L.n] = logicQ(ml);
  L.cur = q; L.st = 'q'; L.qT = LT; L.qp = 0; L.qd = qDur(q);
  if (q.id) { save.seen = save.seen.filter(x => x !== q.id).concat(q.id).slice(-80); }
  const opts = shuffle([q.a, ...q.w.slice(0, 3)]);
  const ans = pickAnswerers();
  kids.forEach(k => { const i = ans.indexOf(k); if (k.st === 'wc') return; k.pk = null; k.say = ''; k.ouch = 0;
    if (i >= 0) { k.ans = opts[i]; k.st = 'hand'; k.t = LT + .5 + i * .14 + Math.random() * .25; } else { k.ans = ''; k.st = 'idle'; k.t = LT; } });
  // joki: pirmajā mācību stundā 1. jautājumā nav, 2. jautājumā viens lēns
  if (tutOn() && L.n === 0) { L.np = Infinity; banner('👆 Pieskaries skolēnam, kuram ir PAREIZĀ atbilde!'); }
  else if (tutOn() && L.n === 1) { L.np = LT + 2; }
  else L.np = Math.random() < Math.min(.9, .5 + tLv() * .04) ? LT + rnd(1, 2.6) : LT + rnd(4, 7);
  sfx('chalk'); hud();
}
function pickAnswerers() {
  const b = LY.board, ok = kids.filter(k => !k.out && k.st !== 'wc' && k.y - 5.4 * k.s >= b.y + b.h - 10), pool = ok.length >= 4 ? ok : kids.filter(k => !k.out && k.st !== 'wc');
  const far = (a, c) => a.r !== c.r ? Math.abs(a.x - c.x) > Math.max(a.s, c.s) * 1.6 : Math.abs(a.x - c.x) > Math.max(a.s, c.s) * 4.2;
  for (let t = 0; t < 80; t++) { const c = shuffle(pool.slice()).slice(0, 4); if (c.every(a => c.every(o => a === o || far(a, o)))) return c; }
  return shuffle(pool.slice()).slice(0, 4);
}
// laiks beidzās – mācību brīdis bez soda
function timeUp() {
  const q = L.cur; banner(''); kids.forEach(o => { if (o.st === 'plot' || o.st === 'prank' || o.st === 'caught') { o.st = o.back || 'idle'; o.t = LT; o.say = ''; } });
  L.wrong++; mood(-3); sfx('bad'); if (q.mat || q.lg) save.ml = Math.max(1, save.ml - .5); else if (!save.miss.includes(q.id)) save.miss = save.miss.concat(q.id).slice(-30);
  L.st = 'explain'; later(.3, () => explain(null));
}
function startPlot(k) {
  k.back = k.st; k.st = 'plot'; k.t = LT; k.pk = pick(Object.keys(PRANKS)); k.warn = warnDur(); L.qp++;
  L.np = LT + prankGap() * (maxBusy() > 1 ? .35 : 1);
  if (tutOn() && !L.tutPrank) { L.tutPrank = 1; k.warn = 3.2; banner('❗ Kāds grib draiskoties – ātri pieskaries viņam!'); }
  sfx('sneak');
}
function catchKid(k) {
  const early = k.st === 'plot'; k.st = 'caught'; k.t = LT; k.say = pick(SORRY); L.caught++; mood(early ? 6 : 3); sfx('catch'); buzz(25);
  addFx(k.x, k.y - 4.6 * k.s, early ? '👀 Pieķerts laikus!' : '👀 Pieķerts!', '#ffd34d');
  toast(`${PRANKS[k.pk].i} 💡 ${PRANKS[k.pk].fact}`); L.np = Math.max(L.np, LT + prankGap() * .6);
  if (L.tutPrank === 1) { L.tutPrank = 2; banner('👏 Lieliski! Pieķer draiskuļus laikus – klasei būs labs noskaņojums.', 3500); }
}
function prankDone(k) {
  k.st = k.back || 'idle'; k.t = LT; L.missed++; mood(-10); energy = Math.max(0, energy - 4); sfx('laugh'); buzz([30, 40, 30]);
  kids.forEach(o => { if (o !== k) o.lol = LT + 1.6; });
  addFx(W / 2, LY.board.y + LY.board.h + 20, '😂 Ha-ha-ha!', '#fff');
  if (k.pk === 'plane') stuck.push({ x: LY.board.x + LY.board.w * rnd(.2, .8), y: LY.board.y + LY.board.h * rnd(.3, .7), r: rnd(-.5, .5) });
  if (k.pk === 'gum') k.splat = LT + 3;
  L.np = Math.max(L.np, LT + prankGap() * .6);
  if (L.tutPrank === 1) { L.tutPrank = 2; banner('Nekas! Nākamreiz pieskaries, tiklīdz redzi ❗', 3500); }
}
function answer(k) {
  const q = L.cur, right = k.ans === q.a; banner('');
  kids.forEach(o => { if (o.st === 'plot' || o.st === 'prank' || o.st === 'caught') { o.st = o.back || 'idle'; o.t = LT; o.say = ''; } });
  if (right) {
    k.st = 'happy'; k.t = LT; L.ok++; mood(4); sfx('good'); buzz(15); addFx(k.x, k.y - 4.6 * k.s, '✅ Pareizi!', '#7dffa8');
    kids.forEach(o => { if (o !== k) { o.st = 'idle'; o.t = LT; } });
    if (q.mat || q.lg) save.ml = Math.min(8.99, save.ml + .34); else save.miss = save.miss.filter(x => x !== q.id);
    L.st = 'wait'; later(1.2, nextQ);
  } else {
    k.st = 'sad'; k.t = LT; L.wrong++; mood(-2); sfx('bad'); buzz([20, 40, 20]);
    if (q.mat || q.lg) save.ml = Math.max(1, save.ml - .5); else if (!save.miss.includes(q.id)) save.miss = save.miss.concat(q.id).slice(-30);
    L.st = 'explain'; later(.7, () => explain(k));
  }
  hud();
}
// mācību brīdis: kāpēc pareizi ir tā – bez soda, bez steigas
function explain(k) {
  const q = L.cur;
  sheet(`<div class="step">Mācību brīdis</div><h2>${k ? '🤔 Ne gluži!' : '⏰ Laiks beidzās!'}</h2><p>${k ? `${esc(k.n)} teica „${esc(k.ans)}”, bet pareizi ir:` : 'Pareizā atbilde bija:'}</p>
    <div class="ansBox">✅ ${esc(q.a)}</div><div class="fact">💡 ${esc(q.e)}</div><button class="main green" id="goOn">Saprotu →</button>`);
  $('goOn').onclick = () => { closeSheet(); sfx('tick'); kids.forEach(o => { if (o.ans === q.a) { o.st = 'happy'; o.t = LT; } else if (o.st !== 'sad') { o.st = 'idle'; o.t = LT; } }); L.st = 'wait'; later(1, nextQ); };
}
function mood(d) { L.mood = clamp(L.mood + d, 0, 100); if (d < 0) { const m = document.querySelector('.mood'); m.classList.remove('hit'); void m.offsetWidth; m.classList.add('hit'); } hud(); }
function endLesson() {
  L.st = 'end'; banner(''); kids.forEach(k => { k.st = 'idle'; k.t = LT; k.lol = LT + 2; }); sfx('bell');
  const ok = L.ok, perfect = ok === QN, stars = ok >= 7 ? 3 : ok >= 5 ? 2 : 1, md = Math.round(L.mood);
  const lunch = save.day % 4 === 1, dayEnd = save.day % 4 === 3;
  const money = 3 + ok * 2 + L.caught + L.wcOk + (md >= 80 ? 5 : 0) + (perfect ? 5 : 0) + (dayEnd ? 10 : 0), xp = ok * 10 + L.caught * 5 + L.wcOk * 5 + (perfect ? 20 : 0);
  save.day++; save.en = Math.round(energy);
  const lv0 = levelOf(save.xp).l; save.xp += xp; save.lessons++; save.correct += ok; save.caught += L.caught; if (perfect) save.perfect++; save.tut = 1;
  const lv1 = levelOf(save.xp).l; persist(); walletAdd(money); medals(); hud();
  const praise = perfect ? '🏆 Izcila stunda!' : stars === 3 ? '🌟 Lieliska stunda!' : stars === 2 ? '👍 Laba stunda!' : '🙂 Stunda pabeigta!';
  const tot = L.caught + L.missed;
  later(.8, () => {
    sheet(`<div class="step">🔔 Zvans! Stunda beigusies</div><h2>${praise}</h2><div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <div class="parts"><div class="part">✅ Pareizas atbildes <b>${ok}/${QN}</b></div>${tot ? `<div class="part">👀 Pieķerti draiskuļi <b>${L.caught}/${tot}</b></div>` : ''}${L.wcN ? `<div class="part">🚽 Tualetes lēmumi <b>${L.wcOk}/${L.wcN}</b></div>` : ''}<div class="part">😊 Klases noskaņojums <b>${md}%</b></div></div>
      ${dayEnd ? '<div class="fact" style="text-align:center">🏠 Skolas diena beigusies! <b>+€10</b> bonuss. Rīt – jauna diena ar pilnu enerģiju.</div>' : ''}
      <div class="big">+€${money} · +${xp} XP</div>${lv1 > lv0 ? `<div class="fact" style="text-align:center">🎉 Jauns līmenis – <b>${lv1}.</b>! Jautājumi kļūs grūtāki, draiskuļi – viltīgāki.</div>` : ''}
      ${L.wrong ? `<div class="fact">📌 Jautājumus, kuros kļūdījies, atkārtosim nākamajās stundās – tā tie labāk paliek atmiņā.</div>` : ''}
      <button class="main green" id="again">${lunch ? '🍽 Pusdienu pauze' : '▶ Nākamā stunda'}</button>
      <div class="row2"><button class="main ghostB" id="other">🏫 Uz skolu</button><button class="main ghostB" id="shopB">🛍 Klase un tāfele</button></div>`);
    $('again').onclick = lunch ? lunchBreak : dayEnd ? () => { energy = 100; startLesson(); } : startLesson; if (dayEnd) energy = 100; $('other').onclick = lobby; $('shopB').onclick = () => shop(lobby);
  });
}

// 📁 klases žurnāls: līdz kurai klasei aizgājis; var izvēlēties zemāku, ja par grūtu
const GRADE_TXT = ['', 'saskaitīšana līdz 10, vienkārši fakti', 'saskaitīšana un atņemšana līdz 20', 'līdz 100, vidēji grūti fakti', 'reizrēķins', 'reizrēķins un dalīšana, grūtāki fakti', 'teksta uzdevumi', 'daļas, procenti, darbību secība', 'lielāki skaitļi, decimāldaļas', 'visgrūtākais'];
function gradeSheet() {
  const ag = autoGrade(), cur = grade(), inL = L && L.st !== 'end';
  const back = () => { closeSheet(); if (!inL) lobby(); };
  sheet(`<div class="step">📁 Klases žurnāls</div><h2>🎓 ${cur}. klase</h2>
    <p>Tu esi aizgājis līdz <b style="color:#ffd34d">${ag}. klasei</b>. Ja jautājumi par grūtu, izvēlies zemāku klasi – jaunus līmeņus atvērsi, spēlējot.</p>
    <div class="shop" style="grid-template-columns:repeat(3,1fr)">${Array.from({ length: 9 }, (_, i) => i + 1).map(n => `<button data-g="${n}" class="${n === cur ? 'own' : n > ag ? 'no' : ''}"><i>${n > ag ? '🔒' : n === cur ? '✔' : '🎓'}</i>${n}. klase<em style="font-size:11px;color:#cfd6ff">${GRADE_TXT[n]}</em></button>`).join('')}</div>
    <button class="main ghostB" id="gAuto">🔄 Automātiski (${ag}. klase)</button><button class="main" id="gOk">✔ Gatavs</button>`, back);
  document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { const n = +b.dataset.g; if (n > ag) { toast(`🔒 ${n}. klase atvērsies, kad pacelsies līmenī`); sfx('bad'); return; }
    save.grade = n === ag ? 0 : n; persist(); sfx('tick'); gradeSheet(); });
  $('gAuto').onclick = () => { save.grade = 0; persist(); sfx('tick'); gradeSheet(); };
  $('gOk').onclick = back;
}
function lunchBreak() {
  const F = [['🍲', 'Zupa'], ['🥔', 'Kartupeļi ar kotleti'], ['🥞', 'Pankūkas'], ['🥗', 'Salāti']];
  sheet(`<div class="step">🕙 10:10 – 10:40</div><h2>🍽 Pusdienu pauze</h2><p>Skolotājiem arī jāēd! Ko ēdīsi šodien?</p>
    <div class="shop">${F.map(([i, n]) => `<button data-f="${n}"><i>${i}</i>${n}<em>⚡ 100%</em></button>`).join('')}</div>`);
  document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { energy = 100; mugAt = -99; sfx('win'); toast(`😋 Garšīgi! Enerģija pilna ⚡`); startLesson(); });
}

// ================= Atjaunošana =================
function update(dt) {
  for (let i = 0; i < timers.length; i++) if (LT >= timers[i].t) { const f = timers[i].fn; timers.splice(i--, 1); f(); }
  fx = fx.filter(f => LT - f.t0 < f.d);
  if (!L || L.st !== 'q') return;
  splats = splats.filter(p => LT - p.t0 < 2);
  // laiks, enerģija, tualete
  const left = L.qd - (LT - L.qT); if (left <= 0) { timeUp(); return; }
  if (left < 3.2 && Math.ceil(left) !== L.tick) { L.tick = Math.ceil(left); sfx('tick'); }
  energy = Math.max(0, energy - dt * .3); if (energy <= 0) { L.mood = clamp(L.mood - dt * 1.5, 0, 100); if (!L.sleepB) { L.sleepB = 1; banner('😴 Tu snaud! Iedzer kafiju – pieskaries ☕ krūzei', 4000); } } else L.sleepB = 0;
  if (energy < 35 && mugFull() && !L.tutCoffee && !save.coffeeTut) { L.tutCoffee = 1; save.coffeeTut = 1; banner('☕ Enerģija beidzas – pieskaries kafijas krūzei uz galda!', 5000); }
  if (LT > L.wcAt) { L.wcAt = L.wcN < 1 + (tLv() >= 5) ? LT + rnd(20, 45) : Infinity; wcStart(); }
  for (const k of kids) { if (k.out && LT > k.out) { k.out = 0; k.st = 'idle'; k.t = LT; if (k.fake) { mood(-3); toast(`😏 ${esc(k.n)} gaitenī visu laiku spēlēja telefonā…`); } }
    if (k.st === 'wc' && LT - k.t > 9) { k.wcBtn = null; if (!k.fake) { mood(-5); k.st = 'sad'; k.t = LT; later(1.5, () => { if (k.st === 'sad') k.st = 'idle'; }); L.wcBad++; } else { k.st = 'idle'; k.t = LT; } } }
  hudLive(left);
  const busy = kids.filter(k => k.st === 'plot' || k.st === 'prank').length, lim = L.tutPrank === 1 ? 1 : maxBusy();
  if (busy < lim && LT > L.np && L.qp < maxPerQ()) { const c = kids.filter(k => (k.st === 'hand' || k.st === 'idle') && !k.out && LT > k.t); if (c.length) startPlot(pick(c)); else L.np = LT + 1; }
  for (const k of kids) {
    if (k.st === 'plot' && LT - k.t > k.warn) { k.st = 'prank'; k.t = LT; k.snd = 0; k.hits = 0;
      if (k.pk === 'spit') k.tg = [0, 1, 2].map(() => ({ x: rnd(W * .15, W * .85), y: rnd(H * .2, H * .75) }));
      if (k.pk === 'throw') k.tgt = pick(kids.filter(o => o !== k));
      if (k.pk === 'note') k.tgt = kids.filter(o => o !== k && o.r === k.r).sort((a, b) => Math.abs(a.c - k.c) - Math.abs(b.c - k.c))[0] || pick(kids.filter(o => o !== k)); }
    else if (k.st === 'prank') { const tt = LT - k.t;
      if (tt > k.snd) { k.snd = tt + ({ phone: .45, drum: .18, sleep: 1.1, frog: .55, plane: 9, gum: 9, spit: .87, throw: 9, note: 9 }[k.pk]); sfx(k.pk); }
      // papīra bumbiņas lido uz skolotāju – trāpa „ekrānā”
      if (k.pk === 'spit' && Math.floor(tt / .87) > k.hits && k.hits < 3) { const p = k.tg[k.hits++]; splats.push({ x: p.x, y: p.y, r: Math.min(W, H) * rnd(.045, .065), t0: LT, a: rnd(0, 6) }); sfx('splat'); buzz(15); }
      if (k.pk === 'throw' && tt > 1.6 && !k.hits) { k.hits = 1; k.tgt.ouch = LT + 1.3; sfx('splat'); }
      if (k.pk === 'note' && tt > 2 && !k.hits) { k.hits = 1; k.tgt.lol = LT + 1.4; k.lol = LT + 1.4; }
      if (tt > 2.6) prankDone(k); }
    else if (k.st === 'caught' && LT - k.t > 1.8) { k.st = k.back || 'idle'; k.t = LT; k.say = ''; }
  }
}

// ================= Zīmēšana =================
const OL = '#2a2230';
function rr(x, y, w, h, r) { w = Math.max(1, w); h = Math.max(1, h); r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function circ(x, y, r) { g.beginPath(); g.arc(x, y, Math.max(.1, r), 0, Math.PI * 2); }
function fs(fill, lw = 2.4) { g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OL; g.stroke(); } }
function emoji(t, x, y, size, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.font = `${size}px system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 0, 0); g.restore(); }
function wrap(txt, maxW) { const out = []; let line = ''; for (const w of String(txt).split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
const CHALK = '"Chalkboard SE","Comic Sans MS","Segoe Print",system-ui,sans-serif';

function drawRoom() {
  const b = LY.board, R = LY.room, { hy, fy, wx0, wx1, top } = R, cx = W / 2;
  const ex = y => hy + (y - hy) * cx / (cx - wx0); // kur stars no pazušanas punkta caur sienas stūri sasniedz ekrāna malu
  // grīda ar dēļiem perspektīvā
  let gr = g.createLinearGradient(0, fy, 0, H); gr.addColorStop(0, '#9a6a3e'); gr.addColorStop(1, '#c9905a'); g.fillStyle = gr; g.fillRect(0, fy, W, H - fy);
  g.strokeStyle = '#00000020'; g.lineWidth = 1.5; g.beginPath();
  for (let i = -16; i <= 16; i++) { const xb = cx + i * (wx1 - wx0) / 12; g.moveTo(xb, fy); g.lineTo(cx + (xb - cx) * (H - hy) / (fy - hy), H); } g.stroke();
  g.strokeStyle = '#00000012'; g.beginPath(); for (let z = .86; z > .1; z -= .14) { const y = hy + (fy - hy) / z; if (y > H) break; g.moveTo(0, y); g.lineTo(W, y); } g.stroke();
  // saules gaisma uz grīdas no logiem
  g.fillStyle = '#fff6d81c'; for (let i = 0; i < 2; i++) { const y0 = fy + (H - fy) * (.12 + i * .3); g.beginPath(); g.moveTo(0, y0); g.lineTo(W * .35, y0 + 20); g.lineTo(W * .28, y0 + (H - fy) * .22); g.lineTo(0, y0 + (H - fy) * .2); g.fill(); }
  // griesti
  g.fillStyle = '#f3ead8'; g.beginPath(); g.moveTo(0, -1); g.lineTo(W, -1); g.lineTo(W, ex(top)); g.lineTo(wx1, top); g.lineTo(wx0, top); g.lineTo(0, ex(top)); g.fill();
  // sānu sienas
  const side = (x0, xe, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(xe, ex(top)); g.lineTo(x0, top); g.lineTo(x0, fy); g.lineTo(xe, ex(fy)); g.fill();
    const wy = fy - (fy - top) * .17; g.fillStyle = '#c3976a'; g.beginPath(); g.moveTo(xe, ex(wy)); g.lineTo(x0, wy); g.lineTo(x0, fy); g.lineTo(xe, ex(fy)); g.fill(); };
  side(wx0, 0, '#e8d1a7'); side(wx1, W, '#efdab2');
  // aizmugurējā siena
  gr = g.createLinearGradient(0, top, 0, fy); gr.addColorStop(0, '#fbeccc'); gr.addColorStop(1, '#f1dbb2'); g.fillStyle = gr; g.fillRect(wx0, top, wx1 - wx0, fy - top);
  const wy = fy - (fy - top) * .17; g.fillStyle = '#cfa37a'; g.fillRect(wx0, wy, wx1 - wx0, fy - wy); g.fillStyle = '#b88a5e'; g.fillRect(wx0, wy - 3, wx1 - wx0, 4); g.fillStyle = '#7a5434'; g.fillRect(wx0, fy - 4, wx1 - wx0, 4);
  g.strokeStyle = '#00000026'; g.lineWidth = 2; g.beginPath(); g.moveTo(wx0, top); g.lineTo(wx0, fy); g.lineTo(0, ex(fy)); g.moveTo(wx1, top); g.lineTo(wx1, fy); g.lineTo(W, ex(fy)); g.moveTo(wx0, top); g.lineTo(wx1, top); g.stroke();
  // logi kreisajā sienā, durvis labajā (ja ir vieta)
  const onWall = (xa, Y) => hy + (Y - hy) * (cx - xa) / (cx - wx0);
  if (wx0 > 40) {
    for (const [a0, a1] of wx0 > 110 ? [[.12, .42], [.55, .85]] : [[.2, .8]]) { const xa = wx0 * a0, xb = wx0 * a1, Y0 = top + (fy - top) * .16, Y1 = top + (fy - top) * .66;
      g.beginPath(); g.moveTo(xa, onWall(xa, Y0)); g.lineTo(xb, onWall(xb, Y0)); g.lineTo(xb, onWall(xb, Y1)); g.lineTo(xa, onWall(xa, Y1)); g.closePath();
      gr = g.createLinearGradient(0, onWall(xa, Y0), 0, onWall(xa, Y1)); gr.addColorStop(0, '#9fd6ff'); gr.addColorStop(.7, '#d9f1ff'); gr.addColorStop(.71, '#8fcf7a'); gr.addColorStop(1, '#6fb35e'); g.fillStyle = gr; g.fill();
      g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke(); const xm = (xa + xb) / 2; g.lineWidth = 3; g.beginPath(); g.moveTo(xm, onWall(xm, Y0)); g.lineTo(xm, onWall(xm, Y1)); g.stroke(); }
    const xa = W - wx0 * .75, xb = W - wx0 * .3, onR = (x, Y) => hy + (Y - hy) * (x - cx) / (wx1 - cx), Y0 = top + (fy - top) * .3;
    g.beginPath(); g.moveTo(xa, onR(xa, Y0)); g.lineTo(xb, onR(xb, Y0)); g.lineTo(xb, onR(xb, fy)); g.lineTo(xa, onR(xa, fy)); g.closePath(); g.fillStyle = '#a8743f'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#7a5434'; g.stroke();
    circ(xa + (xb - xa) * .2, onR(xa, top + (fy - top) * .65), Math.max(2, wx0 * .025)); g.fillStyle = '#ffd34d'; g.fill();
  }
  drawClock();
  // tāfele ar rāmi, ēnu un plauktiņu
  const bc = boardC();
  rr(b.x + 3, b.y + 7, b.w, b.h, 10); g.fillStyle = '#00000030'; g.fill();
  rr(b.x - 7, b.y - 7, b.w + 14, b.h + 14, 10); gr = g.createLinearGradient(0, b.y - 7, 0, b.y + b.h + 7); gr.addColorStop(0, '#b07a45'); gr.addColorStop(1, '#7a4f2c'); fs(gr, 2.4);
  rr(b.x - 1, b.y - 1, b.w + 2, b.h + 2, 6); g.lineWidth = 2; g.strokeStyle = '#00000055'; g.stroke();
  rr(b.x, b.y, b.w, b.h, 5); gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, bc.c[0]); gr.addColorStop(1, bc.c[1]); g.fillStyle = gr; g.fill();
  g.fillStyle = bc.id === 'white' ? '#0000000a' : '#ffffff0c'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(b.x + b.w * (.15 + i * .24), b.y + b.h * (.3 + (i % 2) * .4), b.w * .1, b.h * .12, .3, 0, 7); g.fill(); }
  g.fillStyle = '#ffffff18'; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + b.w * .35, b.y); g.lineTo(b.x + b.w * .2, b.y + b.h); g.lineTo(b.x, b.y + b.h); g.fill();
  const ty = b.y + b.h + 7; g.fillStyle = '#c18c55'; g.beginPath(); g.moveTo(b.x + b.w * .05, ty); g.lineTo(b.x + b.w * .95, ty); g.lineTo(b.x + b.w * .97, ty + 6); g.lineTo(b.x + b.w * .03, ty + 6); g.fill(); g.fillStyle = '#7a4f2c'; g.fillRect(b.x + b.w * .03, ty + 6, b.w * .94, 4);
  g.fillStyle = bc.id === 'white' ? '#2d5be3' : '#fff'; g.fillRect(b.x + b.w * .7, ty + 1, 16, 4); g.fillStyle = bc.id === 'white' ? '#e33' : '#ffd34d'; g.fillRect(b.x + b.w * .76, ty + 1, 12, 4);
  for (const p of stuck) emoji('✈️', p.x, p.y, Math.max(18, b.h * .18), p.r);
  boardText();
  drawDeco();
}
// pulkstenis pie sienas – rāda stundas laiku
function drawClock() {
  const b = LY.board, R = LY.room, gapX = b.x - 7 - R.wx0, gapY = b.y - 7 - R.top;
  let x, y, r; if (gapY > 34) { r = Math.min(16, gapY * .4); x = W / 2; y = b.y - 7 - gapY / 2; } else if (gapX > 34) { r = Math.min(18, gapX * .38); x = R.wx0 + gapX / 2; y = Math.max(b.y + r + 6, LY.hudB + r + 8); if (y + r > R.fy - 24) return; } else return;
  if (y - r < LY.hudB && !(x - r > LY.hudR || x + r < LY.hudL)) return; // zem augšējās joslas – nerāda (laiks ir joslā)
  circ(x, y, r); fs('#fff', 2.4); g.strokeStyle = OL; g.lineWidth = 1.2; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(a) * r * .78, y + Math.sin(a) * r * .78); g.lineTo(x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .9); g.stroke(); }
  const m = clockMin(), ha = (m / 60 % 12) / 12 * Math.PI * 2 - Math.PI / 2, ma = (m % 60) / 60 * Math.PI * 2 - Math.PI / 2;
  g.lineCap = 'round'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ha) * r * .5, y + Math.sin(ha) * r * .5); g.stroke(); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ma) * r * .75, y + Math.sin(ma) * r * .75); g.stroke();
}
function boardText() {
  const b = LY.board, pad = 14, iw = b.w - pad * 2, ink = boardC().ink;
  g.globalAlpha = .7; g.fillStyle = ink; g.font = `700 ${clamp(b.h * .11, 11, 15)}px ${CHALK}`; g.textAlign = 'left'; g.textBaseline = 'top';
  if (!L || !L.cur) { g.globalAlpha = 1; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${clamp(b.h * .24, 18, 40)}px ${CHALK}`;
    g.fillText(L ? 'Sākam stundu! ✏️' : 'Labdien, klase! 👋', b.x + b.w / 2, b.y + b.h / 2); return; }
  g.fillText(`${(L.cur.s && SUBJ[L.cur.s]) || (L.cur.lg ? '🧩 Loģika' : '🔢 Matemātika')} · ${Math.min(L.n + 1, QN)}/${QN}`, b.x + pad, b.y + 9); g.globalAlpha = 1;
  const top = b.y + 9 + clamp(b.h * .11, 11, 15) + 4, ih = b.h - (top - b.y) - 12;
  let f = clamp(b.h * .27, 16, 40), lines;
  for (; f > 12; f--) { g.font = `700 ${f}px ${CHALK}`; lines = wrap(L.cur.q, iw); if (lines.length * f * 1.18 <= ih) break; }
  let left = (L.st === 'q' && LT - L.qT < 3) ? Math.floor((LT - L.qT) * 55) : 1e9;
  g.fillStyle = ink; g.textBaseline = 'middle'; const y0 = top + ih / 2 - (lines.length - 1) * f * 1.18 / 2;
  lines.forEach((ln, i) => { if (left <= 0) return; const shown = ln.slice(0, left); left -= ln.length + 1;
    const fw = g.measureText(ln).width; g.textAlign = 'left'; g.fillText(shown, b.x + b.w / 2 - fw / 2, y0 + i * f * 1.18); });
}
// ---- rotājumi (zīmēti, nevis emoji) ----
function cabinet(x, y, w, h) { const d = h * .22; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w, y - h); g.lineTo(x + w - d * .3, y - h - d); g.lineTo(x + d * .3, y - h - d); g.closePath(); fs('#d3a06a', 2);
  rr(x, y - h, w, h, 3); fs('#b07a45', 2); g.strokeStyle = '#00000033'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + w / 2, y - h + 3); g.lineTo(x + w / 2, y - 3); g.stroke();
  g.fillStyle = '#ffd34d'; g.fillRect(x + w / 2 - 5, y - h / 2, 3, 6); g.fillRect(x + w / 2 + 2, y - h / 2, 3, 6); return y - h - d * .5; }
function globe(x, base, u) { const r = u * 1.05, cy = base - u * .35 - r;
  g.beginPath(); g.ellipse(x, base - u * .15, u * .7, u * .2, 0, 0, 7); fs('#8a5a2b', 2); g.fillStyle = '#8a5a2b'; g.fillRect(x - u * .08, cy + r * .6, u * .16, base - cy - r * .6 - u * .1);
  circ(x, cy, r); let gr = g.createRadialGradient(x - r * .4, cy - r * .4, r * .1, x, cy, r); gr.addColorStop(0, '#7cc8ff'); gr.addColorStop(1, '#2a6fc0'); fs(gr, 2);
  g.save(); circ(x, cy, r); g.clip(); g.fillStyle = '#5fbf5a'; const o = (LT * .15) % 2;
  for (const [a, bb, rx, ry] of [[-.5, -.3, .45, .3], [.3, .2, .35, .45], [1.1, -.4, .3, .25], [-1.3, .35, .4, .3]]) { const px = x + ((a + o + 1.5) % 3 - 1.5) * r; g.beginPath(); g.ellipse(px, cy + bb * r, rx * r, ry * r, .4, 0, 7); g.fill(); }
  g.restore(); g.lineWidth = Math.max(2, u * .14); g.strokeStyle = '#d9a441'; g.beginPath(); g.arc(x, cy, r + u * .18, Math.PI * .65, Math.PI * 2.35); g.stroke();
  circ(x - r * .35, cy - r * .35, r * .18); g.fillStyle = '#ffffff66'; g.fill(); }
function aquarium(x, base, w, h) { rr(x, base - h, w, h, 4); let gr = g.createLinearGradient(0, base - h, 0, base); gr.addColorStop(0, '#9fe3ff'); gr.addColorStop(1, '#3a9bd6'); fs(gr, 2);
  g.fillStyle = '#e9c48a'; g.fillRect(x + 2, base - h * .18, w - 4, h * .18 - 2); g.strokeStyle = '#3fae5a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + w * .2, base - 2); g.quadraticCurveTo(x + w * .1 + Math.sin(LT * 2) * 3, base - h * .5, x + w * .22, base - h * .75); g.stroke();
  const fx0 = x + w * (.5 + Math.sin(LT * .8) * .3), fy0 = base - h * .5 + Math.sin(LT * 2.1) * h * .08, dir = Math.cos(LT * .8) > 0 ? 1 : -1, fr = h * .13;
  g.beginPath(); g.ellipse(fx0, fy0, fr * 1.4, fr, 0, 0, 7); fs('#ff8a3d', 1.4); g.beginPath(); g.moveTo(fx0 - dir * fr * 1.3, fy0); g.lineTo(fx0 - dir * fr * 2.3, fy0 - fr * .8); g.lineTo(fx0 - dir * fr * 2.3, fy0 + fr * .8); g.closePath(); fs('#ff8a3d', 1.4);
  circ(fx0 + dir * fr * .6, fy0 - fr * .2, fr * .18); g.fillStyle = '#222'; g.fill();
  g.fillStyle = '#ffffffaa'; for (let i = 0; i < 3; i++) { const q = (LT * .6 + i / 3) % 1; circ(x + w * .75, base - h * .2 - q * h * .7, 1.5 + i * .6); g.fill(); }
  g.fillStyle = '#ffffff33'; g.fillRect(x + 3, base - h + 3, w * .15, h - 6); }
function plant(x, base, u) { const ph = u * 1.1; g.beginPath(); g.moveTo(x - u * .6, base - ph); g.lineTo(x + u * .6, base - ph); g.lineTo(x + u * .45, base); g.lineTo(x - u * .45, base); g.closePath(); fs('#c8643b', 2);
  g.fillStyle = '#a84f2c'; g.fillRect(x - u * .62, base - ph, u * 1.24, u * .22);
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .38 + Math.sin(LT * 1.3 + i) * .04; g.save(); g.translate(x, base - ph); g.rotate(a); g.beginPath(); g.ellipse(u * .9, 0, u * .95, u * .28, 0, 0, 7); fs(i % 2 ? '#3fae5a' : '#2f8f48', 1.6); g.restore(); } }
function poster(x, y, w, h) { g.save(); g.translate(x, y); g.rotate(.03); rr(-w / 2, -h / 2, w, h, 3); fs('#1b2150', 2); g.fillStyle = '#fff';
  for (let i = 0; i < 9; i++) { circ(-w / 2 + ((i * 37) % 97) / 97 * w, -h / 2 + ((i * 53) % 89) / 89 * h, 1.1); g.fill(); }
  circ(w * .22, h * .22, w * .16); fs('#ff9a3d', 1.4); g.strokeStyle = '#ffd34d'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(w * .22, h * .22, w * .26, w * .07, -.3, 0, 7); g.stroke();
  g.rotate(-.5); g.beginPath(); g.ellipse(0, -h * .05, w * .1, h * .25, 0, 0, 7); fs('#f2f2f2', 1.4); circ(0, -h * .1, w * .045); fs('#5ab4ff', 1); g.beginPath(); g.moveTo(-w * .1, h * .12); g.lineTo(-w * .18, h * .22); g.lineTo(-w * .05, h * .17); g.moveTo(w * .1, h * .12); g.lineTo(w * .18, h * .22); g.lineTo(w * .05, h * .17); fs('#ff5a6a', 1);
  g.beginPath(); g.moveTo(-w * .05, h * .2); g.lineTo(0, h * .2 + h * (.12 + Math.sin(LT * 20) * .03)); g.lineTo(w * .05, h * .2); fs('#ffb020', 0); g.restore(); }
function cat(x, base, u) { g.beginPath(); g.ellipse(x, base - u * .4, u * 1.05, u * .48, 0, 0, 7); fs('#9a9aa5', 2);
  g.lineWidth = u * .22; g.strokeStyle = OL; g.lineCap = 'round'; g.beginPath(); g.arc(x + u * .9, base - u * .55, u * .45, -.5, 1.8); g.stroke(); g.lineWidth = u * .14; g.strokeStyle = '#9a9aa5'; g.stroke();
  const hx = x - u * .85, hy2 = base - u * .55; circ(hx, hy2, u * .42); fs('#9a9aa5', 2);
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(hx + sx * u * .32, hy2 - u * .2); g.lineTo(hx + sx * u * .28, hy2 - u * .62); g.lineTo(hx + sx * u * .05, hy2 - u * .38); g.closePath(); fs('#9a9aa5', 1.8); }
  g.lineWidth = 1.4; for (const sx of [-1, 1]) { g.beginPath(); g.arc(hx + sx * u * .16, hy2, u * .09, .2, Math.PI - .2); g.stroke(); }
  if (Math.floor(LT / 2) % 3 === 0) { g.fillStyle = '#3d4a8a'; g.font = `900 ${u * .45}px system-ui`; g.textAlign = 'center'; g.fillText('z', hx - u * .4, hy2 - u * .7 - (LT % 2) * 4); } }
function drawDeco() {
  const d = save.deco, b = LY.board, R = LY.room, u = Math.max(9, LY.u0 || 12), fy = R.fy;
  if (d.lights) { const n = Math.max(6, Math.floor(b.w / 34)); g.strokeStyle = '#3a3a3a'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i <= n; i++) { const x = b.x + b.w * i / n, y = b.y - 8 + Math.sin(i / n * Math.PI) * 10; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    for (let i = 0; i <= n; i++) { const x = b.x + b.w * i / n, y = b.y - 8 + Math.sin(i / n * Math.PI) * 10, on = (Math.floor(LT * 2) + i) % 3;
      circ(x, y + 6, 4.5); g.fillStyle = ['#ff5a6a', '#ffd34d', '#4cd97b', '#3d8bff'][i % 4] + (on ? 'ff' : '77'); g.fill(); } }
  if (d.rocket) { const sp = R.wx1 - (b.x + b.w) - 7; if (sp > 36) poster(b.x + b.w + 7 + sp / 2, b.y + b.h * .4, Math.min(sp * .8, 60), Math.min(sp * 1.05, 80)); else poster(b.x + b.w - u * 2.2, b.y - u * .3, u * 3, u * 3.8); }
  // skapīši aizmugurējos stūros
  const cw = u * 3.4, ch = u * 2.6, lx = R.wx0 + 3, rx = R.wx1 - 3 - cw;
  if (d.fish || d.cat) { const t = cabinet(lx, fy + 2, cw, ch); if (d.fish) aquarium(lx + cw * .08, t, cw * .84, u * 2); else cat(lx + cw / 2, t, u * 1.1); }
  if (d.globe) { const t = cabinet(rx, fy + 2, cw, ch); globe(rx + cw / 2, t, u); }
  if (d.cat && d.fish) cat(b.x + u * 2, b.y - 7, u);
  if (d.plant) plant(d.globe ? rx - u * 1.4 : R.wx1 - u * 1.4, fy + u * .6, u * 1.1);
}
// skolotāja galds priekšplānā – kafijas krūze, ābols, grāmatas, žurnāls
function teacherDesk() {
  const { y, h } = LY.td, m = LY.mug;
  g.fillStyle = '#00000030'; g.fillRect(0, y - 8, W, 8);
  let gr = g.createLinearGradient(0, y, 0, H); gr.addColorStop(0, '#7a4a28'); gr.addColorStop(1, '#5a341b'); g.fillStyle = gr; g.fillRect(0, y, W, h);
  g.fillStyle = '#9a6238'; g.fillRect(0, y, W, 5); g.strokeStyle = '#00000022'; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, y + h * i / 4); g.bezierCurveTo(W * .3, y + h * i / 4 + 4, W * .6, y + h * i / 4 - 4, W, y + h * i / 4); g.stroke(); }
  // žurnāls un grāmatas
  const u = h / 4, F = LY.folder; g.save(); g.translate(F.x + F.w / 2, F.y + F.h / 2); g.rotate(-.06);
  rr(-F.w / 2, -F.h / 2 - u * .3, F.w * .4, u * .5, 3); fs('#e0a830', 1.6); rr(-F.w / 2, -F.h / 2, F.w, F.h, 4); fs('#f2c14e', 2);
  g.fillStyle = '#2a2230'; g.font = `900 ${Math.max(11, F.h * .3)}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`🎓 ${grade()}. kl.`, 0, u * .1); g.restore();
  for (let i = 0; i < 3; i++) { rr(F.x + F.w + u * 1.2, y + h * .62 - i * u * .55, u * 3.2 - i * u * .3, u * .55, 2); fs(['#ff6b6b', '#ffd34d', '#4cd97b'][i], 1.6); }
  // ābols
  const ax = m.x - m.r * 3.2; circ(ax, y + h * .5, u * .9); fs('#e8343f', 2); g.strokeStyle = '#5a3a22'; g.lineWidth = 2; g.beginPath(); g.moveTo(ax, y + h * .5 - u * .8); g.lineTo(ax + u * .15, y + h * .5 - u * 1.3); g.stroke();
  g.beginPath(); g.ellipse(ax + u * .45, y + h * .5 - u * 1.15, u * .35, u * .15, -.5, 0, 7); fs('#4cd97b', 1.2);
  // kafijas krūze
  const full = mugFull(), r = m.r; g.save(); if (L && L.st === 'q' && full && energy < 35) { const k = 1 + Math.sin(LT * 8) * .06; g.translate(m.x, m.y); g.scale(k, k); g.translate(-m.x, -m.y); }
  g.lineWidth = r * .28; g.strokeStyle = OL; g.beginPath(); g.arc(m.x + r * .95, m.y + r * .1, r * .45, -1.2, 1.2); g.stroke(); g.lineWidth = r * .16; g.strokeStyle = '#ff6b8a'; g.stroke();
  rr(m.x - r, m.y - r, r * 2, r * 2, r * .3); fs('#ff6b8a', 2.4); g.beginPath(); g.ellipse(m.x, m.y - r, r, r * .28, 0, 0, 7); fs(full ? '#6b3b1f' : '#f3d4dc', 2);
  g.fillStyle = '#ffffffcc'; g.font = `900 ${r * .7}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('☕', m.x, m.y + r * .15);
  if (full) { g.strokeStyle = '#ffffff99'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { const q = (LT * .5 + i / 3) % 1; g.globalAlpha = 1 - q; g.beginPath(); g.moveTo(m.x - r * .4 + i * r * .4, m.y - r * 1.2 - q * r * 1.4); g.quadraticCurveTo(m.x - r * .2 + i * r * .4, m.y - r * 1.6 - q * r * 1.4, m.x - r * .4 + i * r * .4, m.y - r * 2 - q * r * 1.4); g.stroke(); } g.globalAlpha = 1; }
  g.restore();
}

// skolēna sols 3D: virsma uz pazušanas punktu, priekšpuse, sāns pret centru, kājas un ēna
function desk3d(x, y, s) {
  const w = 1.95 * s, d = .62 * s, h = 1.05 * s, cx = W / 2, hy = LY.room.hy, f = (y - d - hy) / (y - hy), bl = cx + (x - w - cx) * f, br = cx + (x + w - cx) * f, by = y - d;
  g.fillStyle = '#00000024'; g.beginPath(); g.ellipse(x, y + h + .4 * s, w * 1.05, .28 * s, 0, 0, 7); g.fill();
  g.fillStyle = '#4b4f57'; g.fillRect(x - w + .25 * s, y + h - .1 * s, .2 * s, .5 * s); g.fillRect(x + w - .45 * s, y + h - .1 * s, .2 * s, .5 * s);
  const sd = x < cx ? 1 : -1, e0 = x + sd * w, eb = sd > 0 ? br : bl;
  g.beginPath(); g.moveTo(e0, y); g.lineTo(eb, by); g.lineTo(eb, by + h * .55); g.lineTo(e0, y + h); g.closePath(); fs('#a26a39', 1.8);
  g.beginPath(); g.moveTo(x - w, y); g.lineTo(bl, by); g.lineTo(br, by); g.lineTo(x + w, y); g.closePath(); fs('#ebbb80', 2);
  rr(x - w, y, 2 * w, h, .08 * s); fs('#c88c55', 2); g.fillStyle = '#ffffff30'; g.fillRect(x - w + 2, y + 2, 2 * w - 4, .1 * s);
}
function hairCap(k, hx, hy, s) {
  g.save(); g.beginPath(); g.rect(hx - s * 1.4, hy - s * 1.6, s * 2.8, s * (k.hs === 'buzz' ? 1.12 : 1.3)); g.clip(); circ(hx, hy, s * 1.06); fs(k.hair, 2.4); g.restore();
}
function drawKid(k) {
  const { x, y, s } = k, tt = LT - k.t, st = k.st, bob = Math.sin(LT * 2.2 + k.ph) * .04 * s;
  const raised = (st === 'hand' && tt > 0) || st === 'happy' || st === 'wc';
  const pk = (st === 'plot' || st === 'prank') ? k.pk : null, sleeping = st === 'prank' && pk === 'sleep';
  const hx = x + (sleeping ? s * .35 : 0) + (st === 'wc' && !k.fake ? Math.sin(LT * 16) * .12 * s : 0), hy = y - 2.55 * s + bob + (sleeping ? s * .55 : 0) + (st === 'happy' ? -Math.abs(Math.sin(tt * 9)) * s * .12 * (tt < 1 ? 1 : 0) : 0);
  if (k.out) { desk3d(x, y, s); return; } // aizgājis uz tualeti – tukšs sols
  const wcw = st === 'wc' && !k.fake ? Math.sin(LT * 16) * .1 * s : 0; // tiešām vajag – dīdās
  // krēsla atzveltne
  rr(x - 1.3 * s + wcw, y - 2.3 * s, 2.6 * s, 1.2 * s, .3 * s); fs('#3d6fb0', 2);
  // ķermenis
  rr(x - 1.15 * s, y - 1.75 * s + bob, 2.3 * s, 2.1 * s, .7 * s); fs(k.shirt);
  // pacelta roka
  if (raised) { const wig = Math.sin(LT * 7 + k.ph) * .12 * s * (st === 'hand' ? 1 : 0), up = st === 'hand' ? clamp(tt / .25, 0, 1) : 1;
    const ax = x + .85 * s, ay = y - 1.35 * s + bob, hx2 = x + 1.45 * s + wig, hy2 = y - 1.35 * s - up * 2.05 * s;
    g.lineCap = 'round'; g.strokeStyle = OL; g.lineWidth = .62 * s + 4; g.beginPath(); g.moveTo(ax, ay); g.lineTo(hx2, hy2); g.stroke(); g.strokeStyle = k.shirt; g.lineWidth = .62 * s; g.stroke();
    circ(hx2, hy2 - .1 * s, .32 * s); fs(k.skin, 2.2); }
  // mati aizmugurē
  if (k.hs === 'long') { rr(hx - 1.12 * s, hy - .6 * s, 2.24 * s, 1.9 * s, .6 * s); fs(k.hair); }
  if (k.hs === 'pony') { g.beginPath(); g.ellipse(hx + 1.05 * s, hy + .1 * s + Math.sin(LT * 3 + k.ph) * .05 * s, .38 * s, .8 * s, -.4, 0, 7); fs(k.hair); }
  if (k.hs === 'bun') { circ(hx, hy - 1.05 * s, .45 * s); fs(k.hair); }
  if (k.hs === 'puffs') { circ(hx - .95 * s, hy - .6 * s, .5 * s); fs(k.hair); circ(hx + .95 * s, hy - .6 * s, .5 * s); fs(k.hair); }
  // galva
  circ(hx - 1.0 * s, hy + .05 * s, .22 * s); fs(k.skin, 2); circ(hx + 1.0 * s, hy + .05 * s, .22 * s); fs(k.skin, 2);
  circ(hx, hy, s); fs(k.skin);
  hairCap(k, hx, hy, s);
  if (k.hs === 'curly') for (let i = 0; i < 6; i++) { const a = Math.PI * (1.08 + i * .17); circ(hx + Math.cos(a) * s * .95, hy + Math.sin(a) * s * .95, .3 * s); fs(k.hair, 2); }
  if (k.hs === 'spiky') { g.beginPath(); for (let i = 0; i < 5; i++) { const a = Math.PI * (1.15 + i * .175); g.moveTo(hx + Math.cos(a - .15) * s * .95, hy + Math.sin(a - .15) * s * .95); g.lineTo(hx + Math.cos(a) * s * 1.42, hy + Math.sin(a) * s * 1.42); g.lineTo(hx + Math.cos(a + .15) * s * .95, hy + Math.sin(a + .15) * s * .95); } fs(k.hair, 2); }
  face(k, hx, hy, s, st, tt, pk);
  // sols priekšā (3D)
  desk3d(x, y, s);
  g.save(); g.translate(x - .9 * s, y - .3 * s); g.rotate(-.12); rr(-.45 * s, -.12 * s, .9 * s, .24 * s, .04 * s); fs(['#ff5a6a', '#3d8bff', '#4cd97b', '#ffb020'][k.i % 4], 1.4); g.restore();
  // tualetes pazīmes: šmaucējam telefons kabatā, tiešām vajag – sviedri
  if (st === 'wc') { if (k.fake) emoji('📱', x + 1.3 * s, y - .5 * s, s * .6, .4); else { g.fillStyle = '#7fd3ff'; g.beginPath(); g.ellipse(hx + .95 * s, hy - .45 * s + (LT * 20 % 6), .12 * s, .2 * s, 0, 0, 7); g.fill(); } }
  // rokas uz sola
  if (!raised) { const dx = pk === 'drum' && st === 'prank' ? Math.sin(LT * 30) * .15 * s : 0; circ(x - .75 * s, y - .2 * s - Math.abs(dx), .3 * s); fs(k.skin, 2); circ(x + .75 * s, y - .2 * s - Math.abs(dx * .7), .3 * s); fs(k.skin, 2); }
  else { circ(x - .6 * s, y - .2 * s, .3 * s); fs(k.skin, 2); }
  // joka priekšmeti
  if (st === 'plot') { const peek = clamp(tt / .3, 0, 1); emoji(PRANKS[pk].i, x + 1.35 * s, y - .25 * s - peek * .3 * s, s * .75, -.3); }
  if (st === 'prank') prankFx(k, tt, hx, hy);
  if (k.splat > LT) { g.globalAlpha = clamp((k.splat - LT) / .6, 0, 1); circ(hx - .3 * s, hy + .2 * s, .38 * s); g.fillStyle = '#ff8fc8'; g.fill(); circ(hx + .35 * s, hy - .1 * s, .3 * s); g.fill(); g.globalAlpha = 1; }
}
function face(k, hx, hy, s, st, tt, pk) {
  const lol = k.lol > LT, ex = .36 * s, ey = hy - .08 * s;
  const closed = (st === 'prank' && pk === 'sleep') || st === 'happy' || lol || (Math.sin(LT * .9 + k.ph * 3) > .985);
  g.lineCap = 'round'; g.strokeStyle = OL; g.lineWidth = Math.max(2, .09 * s);
  // vaigi
  g.fillStyle = st === 'caught' ? '#ff6b8a88' : '#ff9a9a44'; circ(hx - .55 * s, hy + .32 * s, .2 * s); g.fill(); circ(hx + .55 * s, hy + .32 * s, .2 * s); g.fill();
  if (closed) { for (const sx of [-1, 1]) { g.beginPath(); if (st === 'prank') { g.moveTo(hx + sx * ex - .14 * s, ey); g.lineTo(hx + sx * ex + .14 * s, ey); } else g.arc(hx + sx * ex, ey + .06 * s, .15 * s, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } }
  else { const look = st === 'plot' ? Math.sin(LT * 10) * .07 * s : 0, lookY = st === 'sad' ? .05 * s : 0;
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(hx + sx * ex, ey, .17 * s, .21 * s, 0, 0, 7); fs('#fff', 1.6); circ(hx + sx * ex + look, ey + .03 * s + lookY, .1 * s); g.fillStyle = '#2a2230'; g.fill(); }
    g.lineWidth = Math.max(2, .08 * s); // uzacis
    for (const sx of [-1, 1]) { g.beginPath(); const tilt = st === 'sad' ? .1 * s : st === 'plot' ? -.08 * s * sx : 0;
      g.moveTo(hx + sx * (ex - .16 * s), ey - .32 * s + (st === 'sad' ? -tilt * sx : tilt)); g.lineTo(hx + sx * (ex + .16 * s), ey - .32 * s + (st === 'sad' ? tilt * sx : -tilt)); g.stroke(); } }
  // mute
  const my = hy + .48 * s; g.lineWidth = Math.max(2, .09 * s); g.beginPath();
  if (st === 'happy' || lol || (st === 'prank' && pk !== 'sleep' && pk !== 'gum')) { g.moveTo(hx - .32 * s, my - .05 * s); g.quadraticCurveTo(hx, my + .45 * s, hx + .32 * s, my - .05 * s); g.closePath(); fs('#8a2f3a', Math.max(2, .08 * s)); }
  else if (st === 'plot' || (st === 'wc' && k.fake)) { g.moveTo(hx - .25 * s, my + .04 * s); g.quadraticCurveTo(hx + .05 * s, my + .18 * s, hx + .3 * s, my - .1 * s); g.stroke(); }
  else if (st === 'sad') { g.arc(hx, my + .2 * s, .2 * s, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
  else if (st === 'wc') { g.moveTo(hx - .28 * s, my); for (let i = 1; i <= 4; i++) g.lineTo(hx - .28 * s + i * .14 * s, my + (i % 2 ? -.08 : .06) * s); g.stroke(); }
  else if (st === 'caught') { circ(hx, my + .05 * s, .1 * s); fs('#8a2f3a', 2); }
  else if (st === 'prank' && pk === 'sleep') { circ(hx, my + .05 * s, .07 * s + Math.sin(LT * 3) * .03 * s); g.stroke(); }
  else if (!(st === 'prank' && pk === 'gum')) { g.arc(hx, my - .12 * s, .24 * s, Math.PI * .2, Math.PI * .8); g.stroke(); }
}
function prankFly(k, tt) {
  const { x, y, s } = k, p = clamp(tt / 2.6, 0, 1), hx = x, hy = y - 2.55 * s;
  if (k.pk === 'plane') { const b = LY.board, tx = b.x + b.w * (.3 + (k.i % 3) * .2), ty = b.y + b.h * .5, sx = x + 1.3 * s, sy = y - 2.6 * s;
    const px = sx + (tx - sx) * p, py = sy + (ty - sy) * p - Math.sin(p * Math.PI) * s * 2.5; emoji('✈️', px, py, s * .9, Math.atan2(ty - sy, tx - sx) + .8 - p * .6); }
  else if (k.pk === 'frog') { const dir = k.x < W / 2 ? 1 : -1, px = x + dir * p * W * .45, py = y - .2 * s - Math.abs(Math.sin(p * Math.PI * 4)) * s * 1.4 + p * s * 1.2; emoji('🐸', px, py, s * .9); }
  else if (k.pk === 'spit') { const n = Math.floor(tt / .87), ph = (tt % .87) / .87; if (n < 3 && k.tg) { const t = k.tg[n], e = ph * ph;
    paperBall(hx + .25 * s + (t.x - hx) * e, hy + 1.1 * s + (t.y - hy) * e, s * .14 + e * Math.min(W, H) * .05); } }
  else if (k.pk === 'throw' && k.tgt) { const q = clamp(tt / 1.6, 0, 1); if (q < 1) { const t = k.tgt, sx = x + 1.2 * s, sy = y - 2.8 * s, ex = t.x, ey = t.y - 2.6 * t.s;
    paperBall(sx + (ex - sx) * q, sy + (ey - sy) * q - Math.sin(q * Math.PI) * s * 3, s * .28); } }
  else if (k.pk === 'note' && k.tgt) { const q = clamp(tt / 2, 0, 1), t = k.tgt; emoji('📝', x + (t.x - x) * q, y - .25 * s + (t.y - y) * q - Math.abs(Math.sin(q * Math.PI * 3)) * s * .5, s * .7, Math.sin(LT * 8) * .2); }
}
function prankFx(k, tt, hx, hy) {
  const { x, y, s } = k, p = clamp(tt / 2.6, 0, 1);
  if (k.pk === 'spit') { g.strokeStyle = '#fff'; g.lineWidth = Math.max(3, .16 * s); g.beginPath(); g.moveTo(hx, hy + .5 * s); g.lineTo(hx + .25 * s, hy + 1.1 * s); g.stroke(); g.strokeStyle = '#ff5a6a'; g.lineWidth = 1.5; g.stroke(); }
  if (k.pk === 'phone') { emoji('📱', x + .9 * s, y - .5 * s + Math.sin(LT * 30) * 2, s * .8); for (let i = 0; i < 3; i++) { const q = (tt * .9 + i / 3) % 1; g.globalAlpha = 1 - q; emoji(i % 2 ? '🎵' : '🎶', x + 1.2 * s + Math.sin(q * 6 + i) * s * .4, y - 1 * s - q * s * 2.4, s * .55); } g.globalAlpha = 1; }
  else if (k.pk === 'gum') { const r = .15 * s + p * 1.0 * s; circ(hx, hy + .55 * s + r * .6, r); g.fillStyle = '#ff9ad5dd'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#d0569a'; g.stroke(); circ(hx - r * .35, hy + .55 * s + r * .3, r * .2); g.fillStyle = '#ffffffaa'; g.fill(); }
  else if (k.pk === 'drum') { emoji('🥁', x, y - .35 * s, s * 1.0); emoji('✏️', x - .7 * s, y - .9 * s - Math.abs(Math.sin(LT * 18)) * s * .4, s * .5, -.8); emoji('✏️', x + .7 * s, y - .9 * s - Math.abs(Math.cos(LT * 18)) * s * .4, s * .5, .8); }
  else if (k.pk === 'sleep') { for (let i = 0; i < 3; i++) { const q = (tt * .5 + i / 3) % 1; g.globalAlpha = 1 - q; g.fillStyle = '#3d4a8a'; g.font = `900 ${s * (.4 + q * .4)}px system-ui`; g.textAlign = 'center'; g.fillText('z', hx + s * (.9 + q * .9), hy - s * (.6 + q * 1.6)); } g.globalAlpha = 1; }
}
// ❗ virs draiskuļa – zīmē pašā virspusē, lai priekšējo burbuļi to neaizsedz
function drawAlert(k) {
  const { x, y, s } = k, tt = LT - k.t, by = y - 4.3 * s + Math.sin(LT * 14) * s * .12, r = Math.max(13, .55 * s + 6); circ(x, by, r); fs('#ff3b4e', 3);
  g.fillStyle = '#fff'; g.font = `900 ${r * 1.4}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', x, by + 1);
  if (k.warn > 1.8) { g.lineWidth = 4; g.strokeStyle = '#ffd34d'; g.beginPath(); g.arc(x, by, r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - tt / k.warn)); g.stroke(); }
}
// tualetes lūgums: burbulis ar pogām „Laist” / „Nē”
function wcBubble(k) {
  const { x, y, s } = k, f = clamp(s * .55, 13, 18); g.font = `800 ${f}px system-ui,sans-serif`;
  const t = '🚽 Var uz tualeti?', bw = Math.max(g.measureText(t).width + 18, f * 7.4), bh = f * 3.1, cx = clamp(x, bw / 2 + 4, W - bw / 2 - 4), by = y - 3.95 * s - bh;
  rr(cx - bw / 2, by, bw, bh, 12); fs('#fff6cf', 2.4); g.fillStyle = '#1d1a22'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, cx, by + f * .85);
  const bw2 = (bw - 18) / 2, yb = by + f * 1.6, hb = f * 1.25;
  rr(cx - bw / 2 + 6, yb, bw2, hb, 8); fs('#2ecc71', 1.6); rr(cx + 3, yb, bw2, hb, 8); fs('#ff5a6a', 1.6);
  g.fillStyle = '#fff'; g.font = `900 ${f * .85}px system-ui,sans-serif`; g.fillText('✅ Laist', cx - bw / 2 + 6 + bw2 / 2, yb + hb / 2); g.fillText('❌ Nē', cx + 3 + bw2 / 2, yb + hb / 2);
  k.wcBtn = { y0: yb - 4, y1: yb + hb + 4, yes: [cx - bw / 2, cx], no: [cx, cx + bw / 2] };
  const left = 1 - (LT - k.t) / 9; g.fillStyle = '#ffb020'; g.fillRect(cx - bw / 2 + 10, by + bh - 5, (bw - 20) * clamp(left, 0, 1), 3);
  k.hit.y0 = Math.min(k.hit.y0, by - 4);
}
// burbuļi: atbildes, ❗, atvainošanās – zīmē pēc visiem skolēniem, lai būtu virspusē
function drawBubble(k) {
  const { x, y, s, st } = k, tt = LT - k.t; k.hit = { x0: x - 2 * s, x1: x + 2 * s, y0: y - 5.4 * s, y1: y + 1.45 * s };
  if (k.out || st === 'plot') return;
  if (st === 'wc') { wcBubble(k); return; }
  if (k.ouch > LT) { const f0 = clamp(s * .6, 13, 20); g.font = `900 ${f0}px system-ui,sans-serif`; const t0 = 'Ei! 😠', w0 = g.measureText(t0).width + 14, bx = clamp(x + 1.6 * s, w0 / 2 + 4, W - w0 / 2 - 4), by0 = y - 3.2 * s;
    rr(bx - w0 / 2, by0 - f0 * .8, w0, f0 * 1.6, 10); fs('#ffe0e4', 2); g.fillStyle = '#1d1a22'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t0, bx, by0); }
  let txt = '', bg = '#fff', col = '#1d1a22';
  if (st === 'caught') { txt = k.say; bg = '#fff6cf'; }
  else if ((st === 'hand' && tt > .15) || st === 'happy' || st === 'sad') { txt = k.ans; if (st === 'happy') { bg = '#d6ffe3'; txt = '✅ ' + txt; } if (st === 'sad') { bg = '#ffe0e4'; txt = '❌ ' + txt; } }
  if (!txt || (L && L.st === 'end')) return;
  const f = clamp(s * .58, 13, 22); g.font = `800 ${f}px system-ui,sans-serif`;
  const mw = Math.max(3.7 * s, 86); let lines = wrap(txt, mw); if (lines.length > 2) { g.font = `800 ${f * .82}px system-ui,sans-serif`; lines = wrap(txt, mw * 1.05); }
  const lh = f * 1.12, bw = Math.max(...lines.map(l => g.measureText(l).width)) + 18, bh = lines.length * lh + 12;
  const cx = clamp(x - .15 * s, bw / 2 + 4, W - bw / 2 - 4), by = y - 3.95 * s - bh, pop = st === 'hand' ? clamp((tt - .15) / .15, 0, 1) : 1;
  g.save(); g.translate(cx, by + bh); g.scale(pop, pop); g.translate(-cx, -(by + bh));
  rr(cx - bw / 2, by, bw, bh, 12); g.fillStyle = bg; g.fill(); g.beginPath(); g.moveTo(x - .35 * s, by + bh - 1); g.lineTo(x - .05 * s, by + bh + .4 * s); g.lineTo(x + .25 * s, by + bh - 1); g.fill();
  rr(cx - bw / 2, by, bw, bh, 12); g.lineWidth = 2.4; g.strokeStyle = OL; g.stroke();
  g.fillStyle = bg; g.fillRect(x - .32 * s, by + bh - 3, .55 * s, 4); g.beginPath(); g.moveTo(x - .35 * s, by + bh); g.lineTo(x - .05 * s, by + bh + .4 * s); g.lineTo(x + .25 * s, by + bh); g.stroke();
  g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach((l, i) => g.fillText(l, cx, by + 6 + lh * (i + .5)));
  g.restore(); k.hit.y0 = Math.min(k.hit.y0, by - 4);
}
function addFx(x, y, txt, col) { fx.push({ x, y, txt, col, t0: LT, d: 1.3 }); }
function drawFx() { for (const f of fx) { const p = (LT - f.t0) / f.d; g.globalAlpha = 1 - p * p; g.font = `900 ${clamp(W * .045, 18, 28)}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const hw = g.measureText(f.txt).width / 2 + 6, fx0 = clamp(f.x, hw, W - hw);
  g.lineWidth = 5; g.strokeStyle = '#2a2230'; g.strokeText(f.txt, fx0, f.y - p * 40); g.fillStyle = f.col; g.fillText(f.txt, fx0, f.y - p * 40); } g.globalAlpha = 1; }
function paperBall(x, y, r) { const gr = g.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#d9d4c5');
  g.beginPath(); for (let i = 0; i <= 9; i++) { const a = i / 9 * Math.PI * 2, rr2 = r * (i % 2 ? .9 : 1.04); i ? g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2) : g.moveTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
  g.closePath(); fs(gr, Math.max(1.2, r * .1)); g.lineWidth = Math.max(1, r * .07); g.strokeStyle = '#a8a190';
  g.beginPath(); g.arc(x - r * .2, y - r * .1, r * .45, .3, 1.9); g.moveTo(x + r * .5, y - r * .1); g.arc(x + r * .25, y + r * .25, r * .35, -.6, 1.2); g.stroke(); }
// papīra bumbiņas, kas trāpījušas „skolotājam” (ekrāna stiklā)
function drawSplats() { for (const p of splats) { const a = clamp((2 - (LT - p.t0)) / .6, 0, 1) * .85, q = clamp((LT - p.t0) / .12, 0, 1); g.globalAlpha = a;
  g.save(); g.translate(p.x, p.y + (LT - p.t0) * 6); g.rotate(p.a); g.scale(q * 1.1, q * .9); paperBall(0, 0, p.r); g.restore(); } g.globalAlpha = 1; }
function draw() {
  g.setTransform(DPR, 0, 0, DPR, 0, 0); drawRoom();
  const order = LY.order || kids;
  for (const k of order) drawKid(k);
  for (const k of order) if (k.st === 'prank') prankFly(k, LT - k.t);
  for (const k of order) drawBubble(k);
  for (const k of order) if (k.st === 'plot') drawAlert(k);
  teacherDesk(); drawFx(); drawSplats();
  // nogurums: malas satumst, pie 0 – skolotājs snauž
  if (L && L.st !== 'end' && energy < 30) { const a = (30 - energy) / 30 * .55, gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .75);
    gr.addColorStop(0, '#0000'); gr.addColorStop(1, `rgba(10,8,30,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
}

// ================= Vadība =================
let last = 0;
function frame(now) { requestAnimationFrame(frame); const dt = clamp((now - last) / 1000, 0, .05); last = now; if (!$('ov').classList.contains('on')) { LT += dt; update(dt); } $('timer').classList.toggle('on', !!L && L.st === 'q' && !$('ov').classList.contains('on')); draw(); updateAudio(); }
cv.addEventListener('pointerdown', e => { e.preventDefault(); audioInit();
  { const F = LY.folder; if (F && e.clientX > F.x - 10 && e.clientX < F.x + F.w + 10 && e.clientY > F.y - 14 && e.clientY < F.y + F.h + 10 && !$('ov').classList.contains('on')) { gradeSheet(); return; } }
  if (!L || L.st !== 'q') return;
  const x = e.clientX, y = e.clientY, m = LY.mug;
  if (Math.hypot(x - m.x, y - m.y) < m.r * 1.8) { drinkCoffee(); return; }
  const wk = kids.find(k => k.st === 'wc' && k.wcBtn && y >= k.wcBtn.y0 && y <= k.wcBtn.y1 && x >= k.wcBtn.yes[0] && x <= k.wcBtn.no[1]); if (wk) { wcDecide(wk, x < wk.wcBtn.no[0]); return; }
  // vispirms tie, kas draiskojas (pieķert ir svarīgāk nekā atbildēt)
  const hit = k => k.hit && x >= k.hit.x0 && x <= k.hit.x1 && y >= k.hit.y0 && y <= k.hit.y1;
  const pr = kids.find(k => (k.st === 'plot' || k.st === 'prank') && hit(k)); if (pr) { catchKid(pr); return; }
  if (e.clientY > LY.td.y) return;
  const k = (LY.order || kids).slice().reverse().find(k => k.st === 'hand' && hit(k)); if (!k) return;
  if (k.st === 'hand' && LT - k.t > .15) answer(k); });

// ================= Logi =================
function sheet(html, x) { $('sheet').innerHTML = (x ? '<button class="xBtn" id="xClose" aria-label="Aizvērt">✕</button>' : '') + html; $('ov').classList.add('on'); $('sheet').scrollTop = 0; if (x) $('xClose').onclick = x; }
function closeSheet() { $('ov').classList.remove('on'); }
let toastT = 0; function toast(t) { const e = $('toast'); e.innerHTML = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('on'), 3400); }
let banT = 0; function banner(t, ms) { const e = $('banner'); clearTimeout(banT); if (!t) { e.classList.remove('on'); return; } e.innerHTML = t; e.classList.add('on'); if (ms) banT = setTimeout(() => e.classList.remove('on'), ms); }
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
let hudKey = '';
// taimeris apakšā (atjauno katru kadru, kamēr jautājums aktīvs)
let tmLast = '';
function hudLive(left) { const p = clamp(left / L.qd, 0, 1), k = Math.ceil(left) + '|' + Math.round(p * 100);
  if (k !== tmLast) { tmLast = k; $('tFill').style.width = (p * 100) + '%'; $('tFill').style.background = p > .5 ? '#2ecc71' : p > .25 ? '#ffb020' : '#ff5a6a'; $('tLbl').textContent = `⏱ ${Math.ceil(left)} s`; }
  hud(); }
function hud() {
  const lv = levelOf(save.xp), md = L ? Math.round(L.mood) : 70;
  const key = [lv.l, lv.cur, wallet, L && L.n, md, L && L.st, Math.round(energy), clockTxt()].join('|'); if (key === hudKey) return; hudKey = key;
  $('sLv').textContent = `🍎 ${lv.l}. līm.`; $('sXp').style.width = (lv.cur / lv.need * 100) + '%';
  $('sMoney').innerHTML = `<b style="color:${wallet < 0 ? '#ff5a6a' : '#ffd34d'};font-size:14px;display:inline">💰 €${wallet}</b>`;
  $('tTxt').textContent = L && L.st !== 'end' ? `🕗 ${clockTxt()} · 📝 ${Math.max(1, Math.min(L.n + 1, QN))}/${QN}` : `🏫 Skola · ${save.day % 4 + 1}. stunda`;
  $('eFill').style.width = energy + '%'; $('eFill').style.background = energy >= 50 ? '#ffd34d' : energy >= 25 ? '#ffb020' : '#ff5a6a';
  $('mIco').textContent = md >= 75 ? '😄' : md >= 50 ? '🙂' : md >= 25 ? '😐' : '😵‍💫';
  $('mFill').style.width = md + '%'; $('mFill').style.background = md >= 60 ? '#2ecc71' : md >= 35 ? '#ffb020' : '#ff5a6a';
}
const TIERS = ['', 'viegli', 'vidēji', 'grūti'];
function lobby() {
  if (L) L.st = 'end'; banner('');
  const lv = tLv();
  sheet(`<div class="step">Tailers World · Skola</div><h2>🏫 Skola</h2>
    <p>Tu vadi stundu! Uz tāfeles ir jautājums – no matemātikas, loģikas, dabas, valodām vai par Latviju. Skolēni paceļ rokas – pieskaries tam, kuram ir <b>pareizā</b> atbilde.</p>
    <div class="fact">❗ Klasē ir 10 skolēni, un daži grib draiskoties – spļauj papīra bumbiņas, met lidmašīnas, nodod zīmītes. Kad virs galvas redzi <b>❗</b>, ātri pieskaries!<br>😊 Pieķer draiskuļus – klasei būs labs noskaņojums un tu nopelnīsi vairāk.</div>
    <div class="parts"><div class="part">🍎 Tavs līmenis <b>${lv}.</b></div><div class="part">🎓 Jautājumi <b>${grade()}. klasei${save.grade ? ' (izvēlēta)' : ''}</b></div><div class="part">😈 Draiskuļi reizē <b>līdz ${maxBusy()}</b></div></div>
    <p style="color:#9fb0ff;font-size:13.5px;text-align:center">Jo augstāks līmenis, jo grūtāki jautājumi un viltīgāki draiskuļi. Ja par grūtu – pieskaries 📁 mapītei uz galda.</p>
    <button class="main green" id="go">🔔 Sākt stundu</button><button class="main ghostB" id="shopB">🛍 Klase un tāfele</button>`);
  $('go').onclick = startLesson; $('shopB').onclick = () => shop(lobby);
}
function shop(back) {
  const cur = save.board;
  sheet(`<div class="step">Par kopīgo naudu</div><h2>🛍 Klase un tāfele</h2><p>Tev ir <b style="color:#ffd34d">€${wallet}</b>. Viss paliek tavā klasē.</p>
    <div class="step">🖍 Tāfeles krāsa</div>
    <div class="shop">${BOARDS.map(b => { const own = save.boards[b.id]; return `<button data-b="${b.id}" class="${cur === b.id ? 'own' : !own && wallet < b.p ? 'no' : ''}"><i style="display:block;width:46px;height:30px;border-radius:6px;border:3px solid #8a5a2b;background:linear-gradient(${b.c[0]},${b.c[1]})"></i>${b.n}<em>${cur === b.id ? '✔ Izvēlēta' : own ? 'Izvēlēties' : '€' + b.p}</em></button>`; }).join('')}</div>
    <div class="step">🪴 Rotājumi</div>
    <div class="shop">${DECO.map(d => `<button data-d="${d.id}" class="${save.deco[d.id] ? 'own' : wallet < d.p ? 'no' : ''}"><i>${d.i}</i>${d.n}<em>${save.deco[d.id] ? '✔ Ir klasē' : '€' + d.p}</em></button>`).join('')}</div>
    <button class="main" id="shopOk">✔ Gatavs</button>`, back);
  document.querySelectorAll('[data-b]').forEach(el => el.onclick = () => { const b = BOARDS.find(o => o.id === el.dataset.b);
    if (!save.boards[b.id]) { if (wallet < b.p) { toast(`💰 Vēl jānopelna €${b.p - wallet} – vadi stundas!`); sfx('bad'); return; } walletAdd(-b.p); save.boards[b.id] = 1; sfx('win'); }
    else sfx('tick'); save.board = b.id; persist(); shop(back); });
  document.querySelectorAll('[data-d]').forEach(el => el.onclick = () => { const d = DECO.find(o => o.id === el.dataset.d); if (save.deco[d.id]) return;
    if (wallet < d.p) { toast(`💰 Vēl jānopelna €${d.p - wallet} – vadi stundas!`); sfx('bad'); return; }
    walletAdd(-d.p); save.deco[d.id] = 1; persist(); sfx('win'); toast(`${d.i} ${d.n} ir tavā klasē!`); shop(back); });
  $('shopOk').onclick = back;
}
$('gear').onclick = e => { e.stopPropagation(); audioInit(); const wasOpen = $('ov').classList.contains('on'), prev = wasOpen ? $('sheet').innerHTML : null;
  if (wasOpen) { toast('⚙ Iestatījumi – kad aizver šo logu'); return; }
  sheet(`<h2>⚙ Iestatījumi</h2><div class="setBox"><div class="step">📻 Radio un dziesmas</div><div id="radioC">${window.TWRadio ? TWRadio.controlsHTML() : ''}</div></div>
    <div class="setBox"><label class="setRow">🔔 Efekti (zvans, joki) <input id="fxV" type="range" min="0" max="100" value="${Math.round(FXV * 100)}"></label></div>
    <p style="color:#9fb0ff;font-size:13.5px">Radio un Papīra Lidmašīnu dziesmas skan visās Tailers World spēlēs.</p><button class="main" id="setOk">✔ Gatavs</button>`);
  if (window.TWRadio) TWRadio.wire($('radioC'));
  $('fxV').oninput = () => { FXV = $('fxV').value / 100; try { localStorage.setItem('skFx', FXV); } catch (e) {} sfx('tick'); };
  $('setOk').onclick = () => { closeSheet(); if (!L || L.st === 'end') lobby(); }; };

// ================= Skaņa =================
let FXV = 1; try { FXV = +(localStorage.getItem('skFx') ?? 1); } catch (e) {}
let AC = null;
function audioInit() { if (window.TWRadio) TWRadio.start(); if (AC) { if (AC.state === 'suspended') AC.resume(); return; } try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
function updateAudio() { if (window.TWRadio) TWRadio.duck(L && L.st !== 'end' ? .55 : 1); }
function tone(f0, f1, d, type = 'sine', vol = .12, delay = 0) { if (!AC) return; const t0 = AC.currentTime + delay, o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + d);
  gn.gain.setValueAtTime(Math.max(.0011, vol * FXV), t0); gn.gain.exponentialRampToValueAtTime(.001, t0 + d); o.connect(gn); gn.connect(AC.destination); o.start(t0); o.stop(t0 + d + .05); }
function sfx(k) { if (!AC) return;
  if (k === 'tick') tone(900, 1200, .06, 'sine', .08);
  else if (k === 'good') [523, 659, 784].forEach((f, i) => tone(f, f, .18, 'triangle', .1, i * .09));
  else if (k === 'bad') tone(300, 200, .28, 'triangle', .1);
  else if (k === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .25, 'triangle', .12, i * .1));
  else if (k === 'bell') for (let i = 0; i < 10; i++) tone(i % 2 ? 1180 : 1320, i % 2 ? 1180 : 1320, .08, 'square', .045, i * .08);
  else if (k === 'chalk') for (let i = 0; i < 4; i++) tone(2400 + i * 200, 1800, .04, 'sawtooth', .015, i * .07);
  else if (k === 'sneak') { tone(220, 200, .14, 'triangle', .09); tone(185, 170, .2, 'triangle', .09, .16); }
  else if (k === 'catch') { tone(700, 1500, .16, 'sine', .12); tone(1500, 1500, .1, 'sine', .08, .16); }
  else if (k === 'laugh') for (let i = 0; i < 5; i++) tone(520 - i * 40, 420 - i * 40, .09, 'triangle', .09, i * .12);
  else if (k === 'plane') tone(500, 1400, .9, 'sine', .06);
  else if (k === 'frog') { tone(260, 200, .07, 'square', .07); tone(240, 180, .09, 'square', .07, .1); }
  else if (k === 'phone') { tone(1320, 1320, .12, 'square', .045); tone(1050, 1050, .12, 'square', .045, .14); }
  else if (k === 'gum') tone(300, 900, 2.4, 'sine', .04);
  else if (k === 'drum') tone(150, 70, .1, 'triangle', .16);
  else if (k === 'sleep') tone(95, 75, .9, 'sawtooth', .03);
  else if (k === 'pop') tone(900, 200, .12, 'sine', .15);
  else if (k === 'spit') tone(1200, 300, .12, 'sine', .08);
  else if (k === 'throw') tone(400, 900, .3, 'sine', .06);
  else if (k === 'note') { tone(2000, 1600, .05, 'sine', .04); tone(1800, 1500, .05, 'sine', .04, .1); }
  else if (k === 'splat') tone(180, 60, .14, 'triangle', .14);
  else if (k === 'slurp') { tone(500, 300, .2, 'sine', .08); tone(450, 250, .2, 'sine', .08, .25); } }

// ================= Saglabāšana, nauda, medaļas =================
const ONLINE = location.protocol === 'https:'; let UID = null, NAME = '', NICK = '', wallet = 0;
const LKEY = () => 'skSave' + (UID ? ':' + UID : '');
function persist() { try { localStorage.setItem(LKEY(), JSON.stringify(save)); } catch (e) {} if (UID) firebase.database().ref('skola/saves/' + UID).set(save).catch(() => {}); }
function walletAdd(m) { wallet = wallet + m; hud(); if (UID) TW.wallet.add(UID, m).then(v => { wallet = v; hudKey = ''; hud(); }).catch(() => {}); }
function medals() { if (!UID || !window.TWA) return;
  TWA.sync(UID, { skLessons: save.lessons, skPerfect: save.perfect, skCaught: save.caught, skCorrect: save.correct, skLevel: levelOf(save.xp).l })
    .then(n => n.forEach((m, i) => setTimeout(() => toast(`🏅 Jauna medaļa!<br><span style="font-size:28px">${m.i}</span> ${TWA.title ? TWA.title(m) : m.t}`), 3600 * i + 2500))).catch(() => {}); }
try { const s = JSON.parse(localStorage.getItem('skSave')); if (s && !ONLINE) save = Object.assign(save, s); } catch (e) {}
function start() { resize(); pickKids(); hud(); requestAnimationFrame(frame); lobby(); }
if (ONLINE && window.firebase && window.TW_FIREBASE) {
  firebase.auth().onAuthStateChanged(async u => {
    if (!u) { location.href = '../index.html'; return; }
    UID = u.uid; NAME = u.email.split('@')[0]; const db = firebase.database();
    try { const v = (await db.ref('users/' + UID).get()).val() || {}; if (v.name) NAME = v.name; NICK = v.nick || ''; } catch (e) {}
    try { const s = (await db.ref('skola/saves/' + UID).get()).val(); if (s) save = Object.assign(save, s); else { const l = JSON.parse(localStorage.getItem(LKEY())); if (l) save = Object.assign(save, l); } } catch (e) {}
    save.miss = save.miss || []; save.seen = save.seen || []; save.deco = save.deco || {}; save.boards = save.boards || { green: 1 }; save.board = save.board || 'green'; save.day = save.day || 0; energy = save.en ?? 100;
    TW.wallet.watch(UID, v => { if (v != null) { wallet = v; hudKey = ''; hud(); } });
    if (window.TW) await TW.ready;
    // spēle vēl nav atvērta visiem – pagaidām tikai admini/moderatori var testēt
    if (window.TW && !TW.isStaff(UID)) { resize(); pickKids(); requestAnimationFrame(frame); sheet(`<h2>🏫 Skola</h2><p>Drīzumā! Spēle vēl top. 🔒</p><a class="main" style="display:block;text-align:center;text-decoration:none" href="../index.html">← Uz sākumlapu</a>`); return; }
    if (window.TW) TW.heartbeat(UID, () => ({ game: 'Skola', where: L && L.st !== 'end' ? `Stundā (${L.n + 1}/${QN})` : `Līm. ${levelOf(save.xp).l}`, name: NAME, nick: NICK }));
    db.ref('kicks/' + UID).on('value', s => { const k = s.val(); if (k && k.until > TW.now()) { alert('Tevi uz laiku izmeta no spēles. Spēlē draudzīgi! 🙂'); location.href = '../index.html'; } }, () => {});
    if (window.TWA && TWA.load) TWA.load(UID).catch(() => {});
    start();
  });
} else start();
