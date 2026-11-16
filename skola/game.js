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
];
// joki: ko skolēns dara un ko pastāsta, ja viņu pieķer laikus
const PRANKS = {
  plane: { i: '✈️', fact: 'Brāļi Raiti pirmo reizi pacēlās ar lidmašīnu 1903. gadā.' },
  frog: { i: '🐸', fact: 'Vardes ūdeni „dzer” caur ādu!' },
  phone: { i: '📱', fact: 'Pirmo tālruni izgudroja 1876. gadā – pirms 150 gadiem.' },
  gum: { i: '🫧', fact: 'Cilvēka mutē dienā izdalās ap litru siekalu.' },
  drum: { i: '🥁', fact: 'Bungas ir viens no senākajiem mūzikas instrumentiem.' },
  sleep: { i: '💤', fact: 'Skolēniem naktī vajag 9–12 stundas miega.' },
};
const SORRY = ['Atvainojiet, skolotāj! 😅', 'Es tikai… nekas! 🙈', 'Labi, labi! 😇', 'Hmm, pieķēra… 😬', 'Vairs nebūs! 🙏'];
// klases rotājumi (pērk par kopīgo naudu, redzami klasē)
const DECO = [
  { id: 'plant', i: '🪴', n: 'Puķupods', p: 30 },
  { id: 'globe', i: '🌍', n: 'Globuss', p: 60 },
  { id: 'fish', i: '🐠', n: 'Akvārijs', p: 120 },
  { id: 'rocket', i: '🚀', n: 'Kosmosa plakāts', p: 200 },
  { id: 'lights', i: '💡', n: 'Krāsaina virtene', p: 300 },
  { id: 'cat', i: '🐈', n: 'Klases kaķis', p: 500 },
];

let save = { xp: 0, lessons: 0, perfect: 0, caught: 0, correct: 0, band: 1, ml: 1, miss: [], seen: [], deco: {}, tut: 0, subj: 'mix' };
let kids = [], L = null, LT = 0, timers = [], fx = [], stuck = [], LY = { board: { x: 0, y: 0, w: 0, h: 0 } };
function pickKids() { kids = shuffle(KIDS.slice()).slice(0, 4).map((k, i) => Object.assign({}, k, { st: 'idle', t: 0, ans: '', ph: Math.random() * 6, i })); layout(); }
const later = (s, fn) => timers.push({ t: LT + s, fn });

// izkārtojums: tāfele augšā, 4 soli – telefonā vertikāli 2×2, citur rindā
function layout() {
  W = innerWidth; H = innerHeight; const tb = $('top').getBoundingClientRect(), top = tb.bottom + 8, land = W > H;
  const bh = land ? clamp(H * .27, 78, 180) : clamp(H * .23, 110, 230), bw = Math.min(W - 20, land ? Math.max(420, W * .6) : 680);
  LY.board = { x: (W - bw) / 2, y: top, w: bw, h: bh };
  const y0 = top + bh + 6, avail = H - y0 - 6, cols = land || W > 760 ? 4 : 2, rows = 4 / cols, cw = W / cols, ch = avail / rows;
  LY.floor = y0 + ch * .3;
  kids.forEach((k, i) => { const c = i % cols, r = Math.floor(i / cols), depth = rows > 1 && r === 0 ? .9 : 1;
    const s = Math.min(cw / 4.3, ch / 6.9, 50) * depth; k.s = s; k.x = (c + .5) * cw; k.y = y0 + r * ch + (ch - 6.7 * s) / 2 + 5.2 * s; });
}
function resize() { DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; layout(); }
addEventListener('resize', resize);

// ================= Stunda =================
function buildQs(subj) {
  if (subj === 'mat') return Array.from({ length: QN }, () => ({ mat: true }));
  const pool = Q.filter(f => (subj === 'mix' || f.s === subj) && (save.band === 2 || f.g === 1 || save.lessons > 10));
  const miss = shuffle(pool.filter(f => save.miss.includes(f.id))).slice(0, 2);
  const fresh = shuffle(pool.filter(f => !save.seen.includes(f.id) && !miss.includes(f)));
  if (save.band === 2) fresh.sort((a, b) => (b.g - a.g) + (Math.random() - .5) * 1.6);
  const old = shuffle(pool.filter(f => save.seen.includes(f.id) && !miss.includes(f)));
  const n = subj === 'mix' ? QN - 3 : QN, list = [...miss, ...fresh, ...old].slice(0, n);
  if (subj === 'mix') list.push({ mat: true }, { mat: true }, { mat: true });
  return shuffle(list);
}
const tutOn = () => !save.tut;
const warnDur = () => Math.max(.75, 1.5 - save.lessons * .05) * (save.band === 2 ? .9 : 1);
const prankGap = () => rnd(5.5, 10) * Math.max(.55, 1 - save.lessons * .03);

function startLesson(subj) {
  closeSheet(); audioInit(); save.subj = subj; timers = []; fx = []; stuck = []; pickKids();
  L = { subj, qs: buildQs(subj), n: -1, ok: 0, mood: 70, caught: 0, missed: 0, st: 'wait', wrong: 0, qT: LT, np: Infinity, qp: 0, cur: null };
  sfx('bell'); hud(); later(.9, nextQ);
}
function nextQ() {
  L.n++; stuck = []; if (L.n >= QN) { endLesson(); return; }
  let q = L.qs[L.n]; if (q.mat) q = L.qs[L.n] = mathQ(Math.floor(save.ml));
  L.cur = q; L.st = 'q'; L.qT = LT; L.qp = 0;
  if (q.id) { save.seen = save.seen.filter(x => x !== q.id).concat(q.id).slice(-80); }
  const opts = shuffle([q.a, ...q.w.slice(0, 3)]);
  kids.forEach((k, i) => { k.ans = opts[i]; k.st = 'hand'; k.t = LT + .5 + i * .14 + Math.random() * .25; k.pk = null; k.say = ''; });
  // joki: pirmajā mācību stundā 1. jautājumā nav, 2. jautājumā viens lēns
  if (tutOn() && L.n === 0) { L.np = Infinity; banner('👆 Pieskaries skolēnam, kuram ir PAREIZĀ atbilde!'); }
  else if (tutOn() && L.n === 1) { L.np = LT + 2; }
  else L.np = Math.random() < Math.min(.85, .5 + save.lessons * .03) ? LT + rnd(1.2, 3) : LT + rnd(4.5, 8);
  sfx('chalk'); hud();
}
function startPlot(k) {
  k.st = 'plot'; k.t = LT; k.pk = pick(Object.keys(PRANKS)); k.warn = warnDur(); L.qp++;
  if (tutOn() && !L.tutPrank) { L.tutPrank = 1; k.warn = 3.2; banner('❗ Kāds grib draiskoties – ātri pieskaries viņam!'); }
  sfx('sneak');
}
function catchKid(k) {
  const early = k.st === 'plot'; k.st = 'caught'; k.t = LT; k.say = pick(SORRY); L.caught++; mood(early ? 6 : 3); sfx('catch'); buzz(25);
  addFx(k.x, k.y - 4.6 * k.s, early ? '👀 Pieķerts laikus!' : '👀 Pieķerts!', '#ffd34d');
  toast(`${PRANKS[k.pk].i} 💡 ${PRANKS[k.pk].fact}`); L.np = LT + prankGap();
  if (L.tutPrank === 1) { L.tutPrank = 2; banner('👏 Lieliski! Pieķer draiskuļus laikus – klasei būs labs noskaņojums.', 3500); }
}
function prankDone(k) {
  k.st = 'hand'; k.t = LT; L.missed++; mood(-10); sfx('laugh'); buzz([30, 40, 30]);
  kids.forEach(o => { if (o !== k) o.lol = LT + 1.6; });
  addFx(W / 2, LY.board.y + LY.board.h + 20, '😂 Ha-ha-ha!', '#fff');
  if (k.pk === 'plane') stuck.push({ x: LY.board.x + LY.board.w * rnd(.2, .8), y: LY.board.y + LY.board.h * rnd(.3, .7), r: rnd(-.5, .5) });
  if (k.pk === 'gum') k.splat = LT + 3;
  L.np = LT + prankGap();
  if (L.tutPrank === 1) { L.tutPrank = 2; banner('Nekas! Nākamreiz pieskaries, tiklīdz redzi ❗', 3500); }
}
function answer(k) {
  const q = L.cur, right = k.ans === q.a; banner('');
  kids.forEach(o => { if (o.st === 'plot' || o.st === 'prank') { o.st = 'hand'; o.t = LT; } });
  if (right) {
    k.st = 'happy'; k.t = LT; L.ok++; mood(4); sfx('good'); buzz(15); addFx(k.x, k.y - 4.6 * k.s, '✅ Pareizi!', '#7dffa8');
    kids.forEach(o => { if (o !== k) { o.st = 'idle'; o.t = LT; } });
    if (q.mat) save.ml = Math.min(8.99, save.ml + .34); else save.miss = save.miss.filter(x => x !== q.id);
    L.st = 'wait'; later(1.2, nextQ);
  } else {
    k.st = 'sad'; k.t = LT; L.wrong++; mood(-2); sfx('bad'); buzz([20, 40, 20]);
    if (q.mat) save.ml = Math.max(1, save.ml - .5); else if (!save.miss.includes(q.id)) save.miss = save.miss.concat(q.id).slice(-30);
    L.st = 'explain'; later(.7, () => explain(k));
  }
  hud();
}
// mācību brīdis: kāpēc pareizi ir tā – bez soda, bez steigas
function explain(k) {
  const q = L.cur;
  sheet(`<div class="step">Mācību brīdis</div><h2>🤔 Ne gluži!</h2><p>${esc(k.n)} teica „${esc(k.ans)}”, bet pareizi ir:</p>
    <div class="ansBox">✅ ${esc(q.a)}</div><div class="fact">💡 ${esc(q.e)}</div><button class="main green" id="goOn">Saprotu →</button>`);
  $('goOn').onclick = () => { closeSheet(); sfx('tick'); kids.forEach(o => { if (o.ans === q.a) { o.st = 'happy'; o.t = LT; } else if (o.st !== 'sad') { o.st = 'idle'; o.t = LT; } }); L.st = 'wait'; later(1, nextQ); };
}
function mood(d) { L.mood = clamp(L.mood + d, 0, 100); if (d < 0) { const m = document.querySelector('.mood'); m.classList.remove('hit'); void m.offsetWidth; m.classList.add('hit'); } hud(); }
function endLesson() {
  L.st = 'end'; banner(''); kids.forEach(k => { k.st = 'idle'; k.t = LT; k.lol = LT + 2; }); sfx('bell');
  const ok = L.ok, perfect = ok === QN, stars = ok >= 7 ? 3 : ok >= 5 ? 2 : 1, md = Math.round(L.mood);
  const money = 3 + ok * 2 + L.caught + (md >= 80 ? 5 : 0) + (perfect ? 5 : 0), xp = ok * 10 + L.caught * 5 + (perfect ? 20 : 0);
  const lv0 = levelOf(save.xp).l; save.xp += xp; save.lessons++; save.correct += ok; save.caught += L.caught; if (perfect) save.perfect++; save.tut = 1;
  const lv1 = levelOf(save.xp).l; persist(); walletAdd(money); medals(); hud();
  const praise = perfect ? '🏆 Izcila stunda!' : stars === 3 ? '🌟 Lieliska stunda!' : stars === 2 ? '👍 Laba stunda!' : '🙂 Stunda pabeigta!';
  const tot = L.caught + L.missed;
  later(.8, () => {
    sheet(`<div class="step">🔔 Zvans! Stunda beigusies</div><h2>${praise}</h2><div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <div class="parts"><div class="part">✅ Pareizas atbildes <b>${ok}/${QN}</b></div>${tot ? `<div class="part">👀 Pieķerti draiskuļi <b>${L.caught}/${tot}</b></div>` : ''}<div class="part">😊 Klases noskaņojums <b>${md}%</b></div></div>
      <div class="big">+€${money} · +${xp} XP</div>${lv1 > lv0 ? `<div class="fact" style="text-align:center">🎉 Jauns līmenis – <b>${lv1}.</b>!</div>` : ''}
      ${L.wrong ? `<div class="fact">📌 Jautājumus, kuros kļūdījies, atkārtosim nākamajās stundās – tā tie labāk paliek atmiņā.</div>` : ''}
      <button class="main green" id="again">▶ Nākamā stunda (${SUBJ[L.subj].i} ${SUBJ[L.subj].n})</button>
      <div class="row2"><button class="main ghostB" id="other">📚 Cits priekšmets</button><button class="main ghostB" id="shopB">🛍 Klases rotājumi</button></div>`);
    $('again').onclick = () => startLesson(L.subj); $('other').onclick = lobby; $('shopB').onclick = () => shop(lobby);
  });
}

// ================= Atjaunošana =================
function update(dt) {
  for (let i = 0; i < timers.length; i++) if (LT >= timers[i].t) { const f = timers[i].fn; timers.splice(i--, 1); f(); }
  fx = fx.filter(f => LT - f.t0 < f.d);
  if (!L || L.st !== 'q') return;
  const busy = kids.some(k => k.st === 'plot' || k.st === 'prank');
  if (!busy && LT > L.np && L.qp < 2) { const c = kids.filter(k => k.st === 'hand' && LT > k.t); if (c.length) startPlot(pick(c)); else L.np = LT + 1; }
  for (const k of kids) {
    if (k.st === 'plot' && LT - k.t > k.warn) { k.st = 'prank'; k.t = LT; k.snd = 0; }
    else if (k.st === 'prank') { const tt = LT - k.t;
      if (tt > k.snd) { k.snd = tt + ({ phone: .45, drum: .18, sleep: 1.1, frog: .55, plane: 9, gum: 9 }[k.pk]); sfx(k.pk); }
      if (tt > 2.6) prankDone(k); }
    else if (k.st === 'caught' && LT - k.t > 1.8) { k.st = 'hand'; k.t = LT; k.say = ''; }
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
  const b = LY.board, fl = LY.floor;
  let gr = g.createLinearGradient(0, 0, 0, fl); gr.addColorStop(0, '#f8ead0'); gr.addColorStop(1, '#efd9b2'); g.fillStyle = gr; g.fillRect(0, 0, W, fl);
  g.fillStyle = '#d6ae7c'; g.fillRect(0, fl - 26, W, 26); g.fillStyle = '#c29567'; g.fillRect(0, fl - 26, W, 4);
  gr = g.createLinearGradient(0, fl, 0, H); gr.addColorStop(0, '#c08a58'); gr.addColorStop(1, '#a8743f'); g.fillStyle = gr; g.fillRect(0, fl, W, H - fl);
  g.strokeStyle = '#00000018'; g.lineWidth = 2; for (let y = fl + 22, i = 0; y < H; y += 22 + i * 4, i++) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // logi sānos, ja ir vieta
  const side = b.x - 16;
  if (side > 70) for (const x of [10, W - 10 - Math.min(side, 150)]) { const w = Math.min(side - 4, 150), y = b.y + 6, h = Math.min(b.h + 30, fl - y - 34);
    rr(x, y, w, h, 8); fs('#bfe6ff'); g.save(); rr(x, y, w, h, 8); g.clip(); g.fillStyle = '#ffffffaa'; circ(x + w * .3, y + h * .35, w * .16); g.fill(); circ(x + w * .45, y + h * .32, w * .2); g.fill(); g.fillStyle = '#7cc46a'; g.fillRect(x, y + h * .78, w, h); g.restore();
    g.strokeStyle = '#8a5a2b'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke(); rr(x, y, w, h, 8); g.lineWidth = 6; g.stroke(); }
  // tāfele
  rr(b.x - 4, b.y - 4, b.w + 8, b.h + 8, 12); fs('#8a5a2b', 3);
  rr(b.x + 4, b.y + 4, b.w - 8, b.h - 8, 8); gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, '#2f6a4f'); gr.addColorStop(1, '#24533d'); fs(gr, 0);
  g.fillStyle = '#ffffff0c'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(b.x + b.w * (.15 + i * .24), b.y + b.h * (.3 + (i % 2) * .4), b.w * .1, b.h * .12, .3, 0, 7); g.fill(); }
  rr(b.x + b.w * .1, b.y + b.h - 2, b.w * .8, 8, 3); fs('#a0703f', 2); g.fillStyle = '#fff'; g.fillRect(b.x + b.w * .7, b.y + b.h - 4, 14, 4); g.fillStyle = '#ffd34d'; g.fillRect(b.x + b.w * .76, b.y + b.h - 4, 10, 4);
  for (const p of stuck) emoji('✈️', p.x, p.y, Math.max(18, b.h * .18), p.r);
  boardText();
  drawDeco();
}
function boardText() {
  const b = LY.board, pad = 14, iw = b.w - pad * 2;
  g.fillStyle = '#ffffffaa'; g.font = `700 ${clamp(b.h * .11, 11, 15)}px ${CHALK}`; g.textAlign = 'left'; g.textBaseline = 'top';
  if (!L || !L.cur) { g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${clamp(b.h * .24, 18, 40)}px ${CHALK}`;
    g.fillText(L ? 'Sākam stundu! ✏️' : 'Labdien, klase! 👋', b.x + b.w / 2, b.y + b.h / 2); return; }
  g.fillText(`${SUBJ[L.subj].i} ${SUBJ[L.subj].n} · ${Math.min(L.n + 1, QN)}/${QN}`, b.x + pad, b.y + 9);
  const top = b.y + 9 + clamp(b.h * .11, 11, 15) + 4, ih = b.h - (top - b.y) - 12;
  let f = clamp(b.h * .27, 16, 40), lines;
  for (; f > 12; f--) { g.font = `700 ${f}px ${CHALK}`; lines = wrap(L.cur.q, iw); if (lines.length * f * 1.18 <= ih) break; }
  let left = (L.st === 'q' && LT - L.qT < 3) ? Math.floor((LT - L.qT) * 55) : 1e9;
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; const y0 = top + ih / 2 - (lines.length - 1) * f * 1.18 / 2;
  lines.forEach((ln, i) => { if (left <= 0) return; const shown = ln.slice(0, left); left -= ln.length + 1;
    const fw = g.measureText(ln).width; g.textAlign = 'left'; g.fillText(shown, b.x + b.w / 2 - fw / 2, y0 + i * f * 1.18); });
}
function drawDeco() {
  const d = save.deco, b = LY.board, fl = LY.floor, u = clamp(Math.min(W, H) * .07, 26, 56);
  if (d.lights) { const n = Math.max(6, Math.floor(b.w / 34)); g.strokeStyle = '#3a3a3a'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i <= n; i++) { const x = b.x + b.w * i / n, y = b.y - 10 + Math.sin(i / n * Math.PI) * 10; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    for (let i = 0; i <= n; i++) { const x = b.x + b.w * i / n, y = b.y - 10 + Math.sin(i / n * Math.PI) * 10, on = (Math.floor(LT * 2) + i) % 3;
      circ(x, y + 6, 5); g.fillStyle = ['#ff5a6a', '#ffd34d', '#4cd97b', '#3d8bff'][i % 4] + (on ? 'ff' : '88'); g.fill(); } }
  if (d.rocket) { const x = b.x + b.w - u * .9, y = b.y - u * .55; g.save(); g.translate(x, y); g.rotate(.06); rr(-u * .45, -u * .6, u * .9, u * 1.2, 4); fs('#1b2140', 2); emoji('🚀', 0, -u * .1, u * .6); emoji('✨', u * .2, u * .35, u * .25); g.restore(); }
  if (d.cat) { const x = b.x + u * .9, y = b.y - u * .2; emoji('🐈', x, y, u * .9); if (Math.floor(LT / 2) % 3 === 0) emoji('💤', x + u * .5, y - u * .5 - (LT % 2) * 4, u * .35); }
  if (d.globe) emoji('🌍', b.x - (b.x > u * 1.2 ? u * .6 : -u * .5), b.y + b.h - u * .35, u * .8);
  if (d.plant) emoji('🪴', u * .55, fl - u * .45, u * 1.0);
  if (d.fish) { const x = W - u * .9, y = fl - u * .55; rr(x - u * .7, y - u * .45, u * 1.4, u * .9, 6); g.fillStyle = '#7fd3ffaa'; g.fill(); g.lineWidth = 2; g.strokeStyle = OL; g.stroke(); emoji('🐠', x + Math.sin(LT) * u * .35, y, u * .45, 0); }
}

function hairCap(k, hx, hy, s) {
  g.save(); g.beginPath(); g.rect(hx - s * 1.4, hy - s * 1.6, s * 2.8, s * (k.hs === 'buzz' ? 1.12 : 1.3)); g.clip(); circ(hx, hy, s * 1.06); fs(k.hair, 2.4); g.restore();
}
function drawKid(k) {
  const { x, y, s } = k, tt = LT - k.t, st = k.st, bob = Math.sin(LT * 2.2 + k.ph) * .04 * s;
  const raised = (st === 'hand' && tt > 0) || st === 'happy';
  const pk = (st === 'plot' || st === 'prank') ? k.pk : null, sleeping = st === 'prank' && pk === 'sleep';
  const hx = x + (sleeping ? s * .35 : 0), hy = y - 2.55 * s + bob + (sleeping ? s * .55 : 0) + (st === 'happy' ? -Math.abs(Math.sin(tt * 9)) * s * .12 * (tt < 1 ? 1 : 0) : 0);
  // krēsla atzveltne
  rr(x - 1.3 * s, y - 2.3 * s, 2.6 * s, 1.2 * s, .3 * s); fs('#7a4f2c', 2);
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
  // sols priekšā
  rr(x - 1.95 * s, y - .05 * s, 3.9 * s, .34 * s, .1 * s); fs('#e0a96d', 2.4);
  rr(x - 1.75 * s, y + .27 * s, 3.5 * s, 1.15 * s, .12 * s); fs('#b57a45', 2.4);
  rr(x - 1.3 * s, y - .2 * s, .9 * s, .18 * s, .05 * s); fs(['#ff5a6a', '#3d8bff', '#4cd97b', '#ffb020'][k.i % 4], 1.6);
  // rokas uz sola
  if (!raised) { const dx = pk === 'drum' && st === 'prank' ? Math.sin(LT * 30) * .15 * s : 0; circ(x - .75 * s, y + .05 * s - Math.abs(dx), .3 * s); fs(k.skin, 2); circ(x + .75 * s, y + .05 * s - Math.abs(dx * .7), .3 * s); fs(k.skin, 2); }
  else { circ(x - .6 * s, y + .05 * s, .3 * s); fs(k.skin, 2); }
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
  else if (st === 'plot') { g.moveTo(hx - .25 * s, my + .04 * s); g.quadraticCurveTo(hx + .05 * s, my + .18 * s, hx + .3 * s, my - .1 * s); g.stroke(); }
  else if (st === 'sad') { g.arc(hx, my + .2 * s, .2 * s, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
  else if (st === 'caught') { circ(hx, my + .05 * s, .1 * s); fs('#8a2f3a', 2); }
  else if (st === 'prank' && pk === 'sleep') { circ(hx, my + .05 * s, .07 * s + Math.sin(LT * 3) * .03 * s); g.stroke(); }
  else if (!(st === 'prank' && pk === 'gum')) { g.arc(hx, my - .12 * s, .24 * s, Math.PI * .2, Math.PI * .8); g.stroke(); }
}
function prankFx(k, tt, hx, hy) {
  const { x, y, s } = k, p = clamp(tt / 2.6, 0, 1);
  if (k.pk === 'plane') { const b = LY.board, tx = b.x + b.w * (.3 + (k.i % 3) * .2), ty = b.y + b.h * .5, sx = x + 1.3 * s, sy = y - 2.6 * s;
    const px = sx + (tx - sx) * p, py = sy + (ty - sy) * p - Math.sin(p * Math.PI) * s * 2.5; emoji('✈️', px, py, s * .9, Math.atan2(ty - sy, tx - sx) + .8 - p * .6); }
  else if (k.pk === 'frog') { const dir = k.x < W / 2 ? 1 : -1, px = x + dir * p * W * .45, py = y - .2 * s - Math.abs(Math.sin(p * Math.PI * 4)) * s * 1.4 + p * s * 1.2; emoji('🐸', px, py, s * .9); }
  else if (k.pk === 'phone') { emoji('📱', x + .9 * s, y - .5 * s + Math.sin(LT * 30) * 2, s * .8); for (let i = 0; i < 3; i++) { const q = (tt * .9 + i / 3) % 1; g.globalAlpha = 1 - q; emoji(i % 2 ? '🎵' : '🎶', x + 1.2 * s + Math.sin(q * 6 + i) * s * .4, y - 1 * s - q * s * 2.4, s * .55); } g.globalAlpha = 1; }
  else if (k.pk === 'gum') { const r = .15 * s + p * 1.0 * s; circ(hx, hy + .55 * s + r * .6, r); g.fillStyle = '#ff9ad5dd'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#d0569a'; g.stroke(); circ(hx - r * .35, hy + .55 * s + r * .3, r * .2); g.fillStyle = '#ffffffaa'; g.fill(); }
  else if (k.pk === 'drum') { emoji('🥁', x, y - .35 * s, s * 1.0); emoji('✏️', x - .7 * s, y - .9 * s - Math.abs(Math.sin(LT * 18)) * s * .4, s * .5, -.8); emoji('✏️', x + .7 * s, y - .9 * s - Math.abs(Math.cos(LT * 18)) * s * .4, s * .5, .8); }
  else if (k.pk === 'sleep') { for (let i = 0; i < 3; i++) { const q = (tt * .5 + i / 3) % 1; g.globalAlpha = 1 - q; g.fillStyle = '#3d4a8a'; g.font = `900 ${s * (.4 + q * .4)}px system-ui`; g.textAlign = 'center'; g.fillText('z', hx + s * (.9 + q * .9), hy - s * (.6 + q * 1.6)); } g.globalAlpha = 1; }
}
// burbuļi: atbildes, ❗, atvainošanās – zīmē pēc visiem skolēniem, lai būtu virspusē
function drawBubble(k) {
  const { x, y, s, st } = k, tt = LT - k.t; k.hit = { x0: x - 2 * s, x1: x + 2 * s, y0: y - 5.4 * s, y1: y + 1.45 * s };
  if (st === 'plot') { const by = y - 4.3 * s + Math.sin(LT * 14) * s * .12, r = .55 * s + 6; circ(x, by, r); fs('#ff3b4e', 3);
    g.fillStyle = '#fff'; g.font = `900 ${r * 1.4}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', x, by + 1);
    if (k.warn > 1.8) { g.lineWidth = 4; g.strokeStyle = '#ffd34d'; g.beginPath(); g.arc(x, by, r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - tt / k.warn)); g.stroke(); } return; }
  let txt = '', bg = '#fff', col = '#1d1a22';
  if (st === 'caught') { txt = k.say; bg = '#fff6cf'; }
  else if ((st === 'hand' && tt > .15) || st === 'happy' || st === 'sad') { txt = k.ans; if (st === 'happy') { bg = '#d6ffe3'; txt = '✅ ' + txt; } if (st === 'sad') { bg = '#ffe0e4'; txt = '❌ ' + txt; } }
  if (!txt || (L && L.st === 'end')) return;
  const f = clamp(s * .58, 13, 22); g.font = `800 ${f}px system-ui,sans-serif`;
  let lines = wrap(txt, 3.7 * s); if (lines.length > 2) { g.font = `800 ${f * .82}px system-ui,sans-serif`; lines = wrap(txt, 3.9 * s); }
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
function draw() {
  g.setTransform(DPR, 0, 0, DPR, 0, 0); drawRoom();
  for (const k of kids) drawKid(k);
  for (const k of kids) drawBubble(k);
  drawFx();
}

// ================= Vadība =================
let last = 0;
function frame(now) { requestAnimationFrame(frame); const dt = clamp((now - last) / 1000, 0, .05); last = now; if (!$('ov').classList.contains('on')) { LT += dt; update(dt); } draw(); updateAudio(); }
cv.addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); if (!L || L.st !== 'q') return;
  const x = e.clientX, y = e.clientY;
  // vispirms tie, kas draiskojas (pieķert ir svarīgāk nekā atbildēt)
  const hit = k => k.hit && x >= k.hit.x0 && x <= k.hit.x1 && y >= k.hit.y0 && y <= k.hit.y1;
  const pr = kids.find(k => (k.st === 'plot' || k.st === 'prank') && hit(k)); if (pr) { catchKid(pr); return; }
  const k = kids.slice().reverse().find(k => hit(k)); if (!k) return;
  if (k.st === 'hand' && LT - k.t > .15) answer(k); });

// ================= Logi =================
function sheet(html, x) { $('sheet').innerHTML = (x ? '<button class="xBtn" id="xClose" aria-label="Aizvērt">✕</button>' : '') + html; $('ov').classList.add('on'); $('sheet').scrollTop = 0; if (x) $('xClose').onclick = x; }
function closeSheet() { $('ov').classList.remove('on'); }
let toastT = 0; function toast(t) { const e = $('toast'); e.innerHTML = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('on'), 3400); }
let banT = 0; function banner(t, ms) { const e = $('banner'); clearTimeout(banT); if (!t) { e.classList.remove('on'); return; } e.innerHTML = t; e.classList.add('on'); if (ms) banT = setTimeout(() => e.classList.remove('on'), ms); }
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
let hudKey = '';
function hud() {
  const lv = levelOf(save.xp), md = L ? Math.round(L.mood) : 70;
  const key = [lv.l, lv.cur, wallet, L && L.n, md, L && L.subj].join('|'); if (key === hudKey) return; hudKey = key;
  $('sLv').textContent = `🍎 ${lv.l}. līm.`; $('sXp').style.width = (lv.cur / lv.need * 100) + '%';
  $('sMoney').innerHTML = `<b style="color:${wallet < 0 ? '#ff5a6a' : '#ffd34d'};font-size:14px;display:inline">💰 €${wallet}</b>`;
  $('tTxt').textContent = L && L.st !== 'end' ? `${SUBJ[L.subj].i} ${SUBJ[L.subj].n} · ${Math.max(1, Math.min(L.n + 1, QN))}/${QN}` : '🏫 Skola';
  $('mIco').textContent = md >= 75 ? '😄' : md >= 50 ? '🙂' : md >= 25 ? '😐' : '😵‍💫';
  $('mFill').style.width = md + '%'; $('mFill').style.background = md >= 60 ? '#2ecc71' : md >= 35 ? '#ffb020' : '#ff5a6a';
}
function lobby() {
  if (L) L.st = 'end'; banner('');
  const subjB = Object.keys(SUBJ).map(id => `<button data-s="${id}" class="${save.subj === id ? 'on' : ''}"><i>${SUBJ[id].i}</i>${SUBJ[id].n}</button>`).join('');
  sheet(`<div class="step">Tailers World · Skola</div><h2>🏫 Skola</h2>
    <p>Tu vadi stundu! Uz tāfeles ir jautājums, skolēni paceļ rokas ar atbildēm. Pieskaries tam skolēnam, kuram ir <b>pareizā</b> atbilde.</p>
    <div class="fact">❗ Daži skolēni grib draiskoties. Kad virs galvas redzi <b>❗</b>, ātri pieskaries viņam!<br>😊 Pieķer draiskuļus – klasei būs labs noskaņojums un tu nopelnīsi vairāk.</div>
    <div class="step">Priekšmets</div><div class="subj">${subjB}</div>
    <div class="step">Klase</div><div class="seg" id="band"><button data-b="1" class="${save.band === 1 ? 'on' : ''}">1.–3. klase</button><button data-b="2" class="${save.band === 2 ? 'on' : ''}">4.–6. klase</button></div>
    <button class="main green" id="go">🔔 Sākt stundu</button><button class="main ghostB" id="shopB">🛍 Klases rotājumi</button>`);
  document.querySelectorAll('.subj button').forEach(b => b.onclick = () => { save.subj = b.dataset.s; document.querySelectorAll('.subj button').forEach(o => o.classList.toggle('on', o === b)); sfx('tick'); });
  bandWire(); $('go').onclick = () => startLesson(save.subj); $('shopB').onclick = () => shop(lobby);
}
function bandWire() { document.querySelectorAll('#band button').forEach(b => b.onclick = () => { setBand(+b.dataset.b); document.querySelectorAll('#band button').forEach(o => o.classList.toggle('on', o === b)); sfx('tick'); }); }
function setBand(b) { if (b === save.band) return; save.band = b; save.ml = b === 2 ? Math.max(save.ml, 4) : Math.min(save.ml, 3); persist(); }
function shop(back) {
  sheet(`<div class="step">Par kopīgo naudu</div><h2>🛍 Klases rotājumi</h2><p>Tev ir <b style="color:#ffd34d">€${wallet}</b>. Rotājumi paliek tavā klasē.</p>
    <div class="shop">${DECO.map(d => `<button data-d="${d.id}" class="${save.deco[d.id] ? 'own' : wallet < d.p ? 'no' : ''}"><i>${d.i}</i>${d.n}<em>${save.deco[d.id] ? '✔ Ir klasē' : '€' + d.p}</em></button>`).join('')}</div>
    <button class="main" id="shopOk">✔ Gatavs</button>`, back);
  document.querySelectorAll('.shop button').forEach(b => b.onclick = () => { const d = DECO.find(o => o.id === b.dataset.d); if (save.deco[d.id]) return;
    if (wallet < d.p) { toast(`💰 Vēl jānopelna €${d.p - wallet} – vadi stundas!`); sfx('bad'); return; }
    walletAdd(-d.p); save.deco[d.id] = 1; persist(); sfx('win'); toast(`${d.i} ${d.n} ir tavā klasē!`); shop(back); });
  $('shopOk').onclick = back;
}
$('gear').onclick = e => { e.stopPropagation(); audioInit(); const wasOpen = $('ov').classList.contains('on'), prev = wasOpen ? $('sheet').innerHTML : null;
  if (wasOpen) { toast('⚙ Iestatījumi – kad aizver šo logu'); return; }
  sheet(`<h2>⚙ Iestatījumi</h2><div class="setBox"><div class="step">📻 Radio un dziesmas</div><div id="radioC">${window.TWRadio ? TWRadio.controlsHTML() : ''}</div></div>
    <div class="setBox"><label class="setRow">🔔 Efekti (zvans, joki) <input id="fxV" type="range" min="0" max="100" value="${Math.round(FXV * 100)}"></label></div>
    <div class="setBox"><div class="step">Klase</div><div class="seg" id="band"><button data-b="1" class="${save.band === 1 ? 'on' : ''}">1.–3. klase</button><button data-b="2" class="${save.band === 2 ? 'on' : ''}">4.–6. klase</button></div></div>
    <p style="color:#9fb0ff;font-size:13.5px">Radio un Papīra Lidmašīnu dziesmas skan visās Tailers World spēlēs.</p><button class="main" id="setOk">✔ Gatavs</button>`);
  if (window.TWRadio) TWRadio.wire($('radioC'));
  $('fxV').oninput = () => { FXV = $('fxV').value / 100; try { localStorage.setItem('skFx', FXV); } catch (e) {} sfx('tick'); };
  bandWire(); $('setOk').onclick = () => { closeSheet(); if (!L || L.st === 'end') lobby(); }; };

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
  else if (k === 'pop') tone(900, 200, .12, 'sine', .15); }

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
    save.miss = save.miss || []; save.seen = save.seen || []; save.deco = save.deco || {};
    TW.wallet.watch(UID, v => { if (v != null) { wallet = v; hudKey = ''; hud(); } });
    if (window.TW) await TW.ready;
    // spēle vēl nav atvērta visiem – pagaidām tikai admini/moderatori var testēt
    if (window.TW && !TW.isStaff(UID)) { resize(); pickKids(); requestAnimationFrame(frame); sheet(`<h2>🏫 Skola</h2><p>Drīzumā! Spēle vēl top. 🔒</p><a class="main" style="display:block;text-align:center;text-decoration:none" href="../index.html">← Uz sākumlapu</a>`); return; }
    if (window.TW) TW.heartbeat(UID, () => ({ game: 'Skola', where: L && L.st !== 'end' ? `Stundā: ${SUBJ[L.subj].n}` : `Līm. ${levelOf(save.xp).l}`, name: NAME, nick: NICK }));
    db.ref('kicks/' + UID).on('value', s => { const k = s.val(); if (k && k.until > TW.now()) { alert('Tevi uz laiku izmeta no spēles. Spēlē draudzīgi! 🙂'); location.href = '../index.html'; } }, () => {});
    if (window.TWA && TWA.load) TWA.load(UID).catch(() => {});
    start();
  });
} else start();
