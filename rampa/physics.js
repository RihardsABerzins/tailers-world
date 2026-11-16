// Mega rampa – fizika (bez three.js, lai var testēt ar node). Viss notiek vertikālā plaknē: z – uz priekšu, y – augšup (metri).
// Viena fizika visiem braucamrīkiem, atšķiras tikai parametri (stats). Fiksēts solis DT, spēki: svars lejup,
// cēlējspēks perpendikulāri ātrumam, pretestība pretēji ātrumam, vilce deguna virzienā.
'use strict';
(function (root) {
  const G = 9.81, RHO = 1.225, DT = 1 / 120, D2R = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

  // ---- rampas (kopīgas visiem braucamrīkiem) ----
  // ---- uzlabojumi: katrai pozīcijai 35 līmeņi (0 = sākums). Efekts aug pakāpeniski, cena ~×1,15 katrā līmenī ----
  const NL = 35, TIER = L => Math.min(4, Math.floor((L - 1) / 7)), price = (base, L) => Math.round(base * Math.pow(1.15, L - 1) / 5) * 5 || 5;
  // efekts aug strauji pirmajos līmeņos (EASE < 1) – katrs pirkums jūtams; vēlāk lēnāk
  const EASE = .5, ef = L => Math.pow((L - 1) / (NL - 1), EASE);
  const lin = (a, b, L) => a + (b - a) * ef(L), expo = (a, b, L) => a * Math.pow(b / a, ef(L));
  // ic – ikonas: [0. līmenim, 5 pakāpēm] – darbnīcā rāda to, kas tiešām uzlikts
  function slot(i, n, zero, tiers, base, f, ic) { ic = ic || []; const lv = [Object.assign({ n: zero, i: ic[0] || i }, f(0))];
    for (let L = 1; L <= NL; L++) lv.push(Object.assign({ n: tiers[TIER(L)] + ' ' + ((L - 1) % 7 + 1), p: price(base, L), tier: TIER(L), i: ic[TIER(L) + 1] || i }, f(L)));
    return { i, n, lv }; }
  const RAMPS = []; for (let L = 0; L <= NL; L++) { const h = Math.round(55 + 165 * Math.pow(L / NL, .6)); RAMPS.push({ h, n: h + ' m', p: L ? price(25, L) : 0 }); }
  const LIP = 18, EXIT = 30 * D2R, SLOPE = 42 * D2R, R1 = 10, R2 = 48, FLAT = 3;
  // rampas profils: plakans starts → izliekums → taisns slīpums → liels izliekums → atlēciena mala z=0, y=LIP, leņķis EXIT
  function rampProfile(H) {
    const drop = R1 * (1 - Math.cos(SLOPE)) + R2 * (1 - Math.cos(SLOPE)) - R2 * (1 - Math.cos(EXIT));
    const L = Math.max(10, (H - LIP - drop) / Math.sin(SLOPE));
    const segs = [[FLAT, 0, 0], [R1 * SLOPE, 0, -SLOPE], [L, -SLOPE, -SLOPE], [R2 * (SLOPE + EXIT), -SLOPE, EXIT]];
    const pts = []; let z = 0, y = 0, s = 0; const ds = .5;
    for (const [len, a0, a1] of segs) { const n = Math.max(1, Math.round(len / ds)), k = (a1 - a0) / len;
      for (let i = 0; i < n; i++) { const th = a0 + (a1 - a0) * (i + .5) / n; pts.push({ s, z, y, th: a0 + (a1 - a0) * i / n, k }); z += Math.cos(th) * len / n; y += Math.sin(th) * len / n; s += len / n; } }
    pts.push({ s, z, y, th: EXIT, k: 0 });
    const dz = -z, dy = LIP - y; pts.forEach(p => { p.z += dz; p.y += dy; });
    return { pts, len: s, H: pts[0].y };
  }
  function rampAt(R, s) { const p = R.pts; let lo = 0, hi = p.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (p[m].s <= s) lo = m; else hi = m - 1; }
    const i = lo, a = p[i], b = p[i + 1], f = clamp((s - a.s) / ((b.s - a.s) || 1), 0, 1);
    return { z: a.z + (b.z - a.z) * f, y: a.y + (b.y - a.y) * f, th: a.th + (b.th - a.th) * f, k: a.k }; }

  // ---- braucamrīki un uzlabojumi ----
  // wheel: mu – berze rampā, roll – ripošana pa zemi; wing: S laukums, ar [īsie, garie]; eng: T vilce (N), f degviela (s); aero: cda
  const VEH = {
    plane: { i: '✈️', n: 'Lidmašīna', p: 0, m: 80, cda: .3, crashV: 8,
      slots: {
        body: slot('🥔', 'Virsbūve', 'Kartupelis', ['Kartona kaste', 'Saplākšņa', 'Alumīnija', 'Sacīkšu', 'Reaktīvā'], 15, L => L ? { cda: lin(.38, .14, L), m: lin(28, 55, L), crashV: lin(7, 11.5, L) } : { cda: .5, m: 20, crashV: 6 }, ['🥔', '📦', '🪵', '🔩', '🏎️', '🛩️']),
        wheel: slot('🛞', 'Riteņi', 'Nav', ['Ratiņu', 'Velo', 'Skrituļu', 'Sacīkšu', 'Gultņu'], 12, L => ({ mu: L ? expo(.045, .01, L) : .07, roll: .1 }), ['🚫', '🛒', '🚲', '🛼', '🏁', '⚙️']),
        wing: slot('🪽', 'Spārni', 'Nav', ['Kartona', 'Saplākšņa', 'Pūķa', 'Deltaplāna', 'Planiera'], 10, L => L ? { S: lin(7.5, 13, L), ar: lin(5.5, 18, L), cd0: lin(.032, .014, L), m: lin(8, 19, L) } : { S: 0 }, ['🚫', '📦', '🪵', '🪁', '🦅', '🪽']),
        eng: slot('🔥', 'Dzinējs', 'Nav', ['Ventilators', 'Propelleris', 'Raķete', 'Lielā raķete', 'Reaktīvais'], 50, L => L ? { T: lin(220, 1300, L), f: lin(3, 9, L), m: lin(4, 22, L) } : {}, ['🚫', '🌀', '✈️', '🚀', '🎆', '🔥']),
      } },
    scoot: { i: '🛴', n: 'Skūteris', p: 150, m: 70, cda: .3, crashV: 15, flips: true,
      slots: {
        wheel: slot('🛞', 'Riteņi', 'Parastie', ['Gumijas', 'Sporta', 'Sacīkšu', 'Keramikas', 'Super'], 15, L => ({ mu: L ? expo(.025, .002, L) : .06, roll: .05 }), ['⚫', '🛞', '🏃', '🏁', '💎', '⭐']),
        aero: slot('🪖', 'Aerodinamika', 'Stāvus', ['Pieliecies', 'Ķivere', 'Tērps', 'Aero tērps', 'Raķete'], 18, L => ({ cda: L ? lin(.2, .05, L) : .3 }), ['🧍', '🙇', '⛑️', '🥋', '🏎️', '🚀']),
        eng: slot('🚀', 'Raķešu soma', 'Nav', ['Mazā', 'Raķete', 'Dubultā', 'Turbo', 'Super'], 70, L => L ? { T: lin(200, 650, L), f: lin(2, 5, L), m: lin(3, 8, L) } : {}, ['🚫', '🎇', '🚀', '🚀', '💥', '🌟']),
      } },
    car: { i: '🚗', n: 'Mašīna', p: 500, m: 1100, cda: .8, crashV: 30, bounce: true, flips: true,
      slots: {
        wheel: slot('🛞', 'Riteņi', 'Parastie', ['Sporta', 'Rallija', 'Bezceļu', 'Monstru', 'Lēcēju'], 50, L => ({ mu: L ? expo(.026, .008, L) : .03, roll: .02, rest: L ? lin(.34, .72, L) : .3 }), ['🛞', '🏎️', '🏁', '🛻', '👹', '🦘']),
        aero: slot('🏁', 'Aerodinamika', 'Kaste', ['Spoilers', 'Sporta', 'Sacīkšu', 'Aero', 'Raķetes forma'], 80, L => ({ cda: L ? lin(.75, .4, L) : .8 }), ['📦', '🪽', '🚙', '🏎️', '💨', '🚀']),
        // mazi spārniņi sānos: nedaudz cēlējspēka (ilgāk planē), bet mašīna paliek mašīna (bez lidmašīnas vadības)
        wing: slot('🪽', 'Spārniņi', 'Nav', ['Kartona', 'Plastmasas', 'Sporta', 'Karbona', 'Raķešu'], 60, L => L ? { Sw: lin(2, 9, L), m: lin(10, 35, L) } : {}, ['🚫', '📦', '🪁', '🏎️', '🦅', '🚀']),
        eng: slot('💨', 'Nitro', 'Nav', ['Nitro', 'Super', 'Mega', 'Ultra', 'Raķete'], 250, L => L ? { T: lin(3000, 9000, L), f: lin(2, 5, L), m: lin(15, 35, L) } : {}, ['🚫', '💨', '🔥', '⚡', '☄️', '🚀']),
      } },
  };
  function stats(vid, sel) {
    const V = VEH[vid], S = V.slots, lv = k => S[k] ? S[k].lv[clamp(sel[k] || 0, 0, S[k].lv.length - 1)] : null;
    const w = lv('wheel'), wi = lv('wing'), e = lv('eng'), a = lv('aero'), bo = lv('body');
    const st = { vid, m: V.m, cda: a ? a.cda : V.cda, mu: w.mu, roll: w.roll, rest: w.rest || 0, crashV: V.crashV, S: 0, AR: 0, cd0: 0, T: 0, fuel: 0, flips: !!V.flips, bounce: !!V.bounce, wheels: (sel.wheel || 0) > 0 || vid !== 'plane', pitchK: 1, brake: { plane: .35, scoot: .3, car: .14 }[vid] };
    if (wi && wi.Sw) { st.Sw = wi.Sw; st.m += wi.m; }
    if (wi && wi.S) { st.S = wi.S; st.AR = wi.ar; st.cd0 = wi.cd0; st.m += wi.m; st.pitchK = .85; st.span = Math.sqrt(st.S * st.AR); st.chord = st.S / st.span; }
    if (e && e.T) { st.T = e.T; st.fuel = e.f; st.m += e.m; }
    if (bo) { st.cda = bo.cda; st.m += bo.m; st.crashV = bo.crashV; }
    if (vid === 'plane' && !st.wheels) st.crashV *= .8;
    st.aSlope = st.AR ? 2 * Math.PI * st.AR / (st.AR + 2) : 0; // cēlējspēka līknes slīpums (1/rad)
    // labākais planēšanas leņķis (max L/D): CL* = sqrt(CD0 · π e AR)
    if (st.S) { const cd0t = st.cd0 + st.cda / st.S, cl = Math.sqrt(cd0t * Math.PI * .8 * st.AR); st.aBest = clamp(cl / st.aSlope, 2 * D2R, 12 * D2R); st.LD = .5 * Math.sqrt(Math.PI * .8 * st.AR / cd0t); }
    return st;
  }
  const STALL = 15 * D2R;
  function CL(st, a) { if (!st.S) return 0; const s = Math.sign(a), x = Math.abs(a); return x < STALL ? st.aSlope * a : s * st.aSlope * STALL * .6; }
  function forces(st, vz, vy, phi, thrust, cb) { if (cb == null) cb = 1;
    const v = Math.hypot(vz, vy) || 1e-6, gam = Math.atan2(vy, vz), a = wrap(phi - gam), q = .5 * RHO * v * v, cl = CL(st, a);
    let cd = st.cda; if (st.S) { cd += st.S * (st.cd0 + cl * cl / (Math.PI * .8 * st.AR)); if (Math.abs(a) > STALL) cd += st.S * 1.1 * Math.sin(Math.abs(a) - STALL + .2); }
    // mašīnas spārniņi: paši nostājas pret plūsmu (neatkarīgi no mašīnas sasvēruma), krītot nes vairāk – ilgāk planē
    const clw = st.Sw ? clamp(.35 + 2 * Math.max(0, -gam), 0, .9) : 0; if (st.Sw) cd += st.Sw * (.04 + clw * clw / 7.5);
    const L = q * (st.S * cl + (st.Sw || 0) * clw), D = q * cd, T = thrust ? st.T : 0;
    return { az: (-D * Math.cos(gam) - L * cb * Math.sin(gam) + T * Math.cos(phi)) / st.m, ay: (-D * Math.sin(gam) + L * cb * Math.cos(gam) + T * Math.sin(phi)) / st.m - G, a, cl, L, D, stall: st.S && Math.abs(a) > STALL };
  }

  // ---- pilsēta: visas ēkas {x0, x1, z0, z1, h, w (slīps jumts: nolaišanās rampa)}; tīkls pa 20 m ----
  // world.obs – visas ēkas; world.landing – liela nolaišanās rampa aiz atlēciena malas (x ±11).
  const CELL = 20, key = (i, j) => (i + 500) * 100000 + (j + 500);
  const inside = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
  function roofH(b, z) { return b.w ? b.h - b.w * (z - b.z0) / (b.z1 - b.z0) : b.h; }
  function surfAt(W, x, z) {
    let best = { h: 0, b: null, slope: 0 };
    const L = W.landing; if (Math.abs(x) <= L.hw && z >= L.z0 && z <= L.z1) best = { h: L.h * (1 - (z - L.z0) / (L.z1 - L.z0)), b: L, slope: -Math.atan(L.h / (L.z1 - L.z0)) };
    const arr = W.grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
    if (arr) for (const b of arr) if (inside(b, x, z)) { const h = roofH(b, z); if (h > best.h) best = { h, b, slope: b.w ? -Math.atan(b.w / (b.z1 - b.z0)) : 0 }; }
    return best;
  }
  function indexWorld(W) { W.grid = new Map(); W.landing.hw = W.landing.hw || 11;
    for (const b of W.obs) for (let i = Math.floor(b.x0 / CELL); i <= Math.floor(b.x1 / CELL); i++) for (let j = Math.floor(b.z0 / CELL); j <= Math.floor(b.z1 / CELL); j++) { const k = key(i, j); if (!W.grid.has(k)) W.grid.set(k, []); W.grid.get(k).push(b); }
    return W; }

  // ---- simulācija ----
  // z/x – pozīcija, psi – kurss (x += v·sin psi), bank – sānsvere (tikai lidmašīnai ar spārniem: stūrē ar kursorsviru)
  class Sim {
    constructor(st, ramp, world) { this.st = st; this.R = ramp; this.W = world; this.mode = 'ramp'; this.s = 0; this.v = 6; this.z = ramp.pts[0].z; this.y = ramp.pts[0].y; this.x = 0; this.vz = 0; this.vy = 0;
      this.psi = 0; this.bank = 0; this.phi = 0; this.w = 0; this.fuel = st.fuel; this.t = 0; this.ev = []; this.maxZ = 0; this.maxY = 0; this.rot = 0; this.flips = 0; this.air = 0; this.roofs = 0; this.vmax = 0; this.stall = false; this.alpha = 0; this.cl = 0; this.thr = false; this.engDead = false; }
    get speed() { return this.mode === 'ramp' || this.mode === 'ground' ? Math.abs(this.v) : Math.hypot(this.vz, this.vy); }
    energy() { return .5 * this.st.m * this.speed ** 2 + this.st.m * G * this.y; }
    step(inp) { // inp: { pitch: -1..1 (1 = deguns augšup), roll: -1..1 (1 = pa labi), turbo: bool, help: bool }
      const st = this.st; this.t += DT; this.thr = !!(inp.turbo && this.fuel > 0 && st.T && !this.engDead); if (this.thr) this.fuel = Math.max(0, this.fuel - DT);
      if (this.mode === 'ramp') return this.rampStep();
      if (this.mode === 'air') return this.airStep(inp);
      if (this.mode === 'ground') return this.groundStep(inp);
    }
    // putns: dzinējā – dzinējs apstājas; citādi – mazliet zaudē ātrumu
    birdHit(engine) { if (engine && this.st.T && !this.engDead) { this.engDead = true; this.fuel = 0; this.thr = false; } this.vz *= .93; if (this.mode === 'ground' || this.mode === 'ramp') this.v *= .93; }
    rampStep() { const st = this.st, p = rampAt(this.R, this.s), v = this.v;
      const N = G * Math.cos(p.th) + v * v * p.k, D = .5 * RHO * v * v * st.cda / st.m;
      this.v += (-G * Math.sin(p.th) - st.mu * Math.max(0, N) - D + (this.thr ? st.T / st.m : 0)) * DT; this.v = Math.max(this.v, .5);
      this.s += this.v * DT; const q = rampAt(this.R, this.s); this.z = q.z; this.y = q.y; this.phi = q.th; this.vmax = Math.max(this.vmax, this.v);
      if (this.s >= this.R.len) { this.mode = 'air'; this.vz = this.v * Math.cos(EXIT); this.vy = this.v * Math.sin(EXIT); this.phi = EXIT; this.ev.push(['launch', this.v]); this.w = 0; } }
    airStep(inp) { const st = this.st, z0 = this.z, y0 = this.y, x0 = this.x;
      const gam = Math.atan2(this.vy, this.vz), sp0 = Math.hypot(this.vz, this.vy);
      // sānsvere un pagrieziens (koordinēts pagrieziens: psi' = g·tan(bank)/v)
      if (st.S) { const tb = clamp(-(inp.roll || 0), -1, 1) * 45 * D2R; this.bank += clamp(tb - this.bank, -2.6 * DT, 2.6 * DT);
        this.psi = clamp(this.psi + G * Math.tan(this.bank) / Math.max(8, sp0) * DT, -80 * D2R, 80 * D2R); }
      else { // bez spārniem – neliela stūrēšana gaisā (kā spēlēs)
        this.bank += (-(inp.roll || 0) * 14 * D2R - this.bank) * Math.min(1, DT * 5); this.psi = clamp(this.psi - (inp.roll || 0) * .45 * DT, -60 * D2R, 60 * D2R); }
      const cb = Math.cos(this.bank);
      if (st.S) { const per = .5 * RHO * sp0 * sp0 * st.S * st.aSlope + 1, mg = st.m * G;
        // augšup – līdz 3g (lēnā ātrumā tas nozīmē > 15° → cēlējspēks krīt); lejup – līdz −0,5g; palīgs – 1g lidojums (ar sānsveri vairāk), bet ne virs labākā planēšanas leņķa
        const at = inp.pitch > 0 ? Math.min(13.5 * D2R, (1 + 3 * inp.pitch) * mg / per) : inp.pitch < 0 ? Math.max(-10 * D2R, (1 + 2 * inp.pitch) * mg * .6 / per) : inp.help !== false ? Math.min(st.aBest * 1.3, mg * clamp((Math.cos(gam) + 1.2 * (-Math.atan(1 / st.LD) - gam) * sp0 / G) / cb, 0, 2.5) / per) : wrap(this.phi - gam);
        const want = wrap(gam + at - this.phi), rate = 2.6 * st.pitchK; this.w = clamp(want * 3, -rate, rate); this.phi += this.w * DT; }
      else { const acc = inp.pitch ? inp.pitch * (st.flips ? 9 : 6) : 0; this.w += (acc - this.w * (inp.pitch ? .4 : 1.6)) * DT;
        if (!inp.pitch && inp.help !== false && !st.flips) this.w += wrap(gam - this.phi) * 1.5 * DT; // lidmašīna bez spārniem lēnām nostājas pa vējam
        if (!inp.pitch && inp.help !== false && st.flips) this.w += wrap(gam * .5 - this.phi) * 2.2 * DT;
        this.phi += this.w * DT; this.rot += this.w * DT; if (Math.abs(this.rot) >= 2 * Math.PI) { this.rot -= Math.sign(this.rot) * 2 * Math.PI; this.flips++; this.ev.push(['flip', this.flips]); } }
      // midpoint integrācija (stabila enerģijai); ar sānsveri vertikāli darbojas tikai L·cos(bank)
      const f1 = forces(st, this.vz, this.vy, this.phi, this.thr, cb), mz = this.vz + f1.az * DT / 2, my = this.vy + f1.ay * DT / 2, f2 = forces(st, mz, my, this.phi, this.thr, cb);
      this.vz += f2.az * DT; this.vy += f2.ay * DT; const sp = Math.hypot(this.vz, this.vy); if (sp > 140) { this.vz *= 140 / sp; this.vy *= 140 / sp; }
      this.z += mz * Math.cos(this.psi) * DT; this.x += mz * Math.sin(this.psi) * DT; this.y += my * DT; this.alpha = f2.a; this.cl = f2.cl; this.air += DT;
      if (f2.stall && !this.stall) this.ev.push(['stall']); this.stall = !!f2.stall;
      this.maxZ = Math.max(this.maxZ, this.z); this.maxY = Math.max(this.maxY, this.y); this.vmax = Math.max(this.vmax, sp);
      this.contact(x0, z0, y0); }
    contact(x0, z0, y0) { const st = this.st, s = surfAt(this.W, this.x, this.z); if (this.y >= s.h) return;
      const b = s.b;
      // no sāniem (iepriekš ārpus ēkas vai zem jumta) – siena
      if (b && b !== this.W.landing && (!inside(b, x0, z0) || y0 < roofH(b, this.z) - .3)) return this.hitWall(b, Math.max(0, this.vz), x0, z0);
      const be = s.slope, nz = -Math.sin(be), ny = Math.cos(be), vn = -(this.vz * nz + this.vy * ny), vt = this.vz * Math.cos(be) + this.vy * Math.sin(be);
      const err = Math.abs(wrap(this.phi - be)), maxErr = st.flips ? 50 * D2R : 40 * D2R;
      this.y = s.h;
      if (vn > st.crashV || (err > maxErr && !st.bounce) || (st.bounce && err > 100 * D2R && vn > 6) || Math.abs(this.bank) > 30 * D2R && vn > 3) return this.crash('hit', vn);
      if (st.bounce && vn > 3) { const r = st.rest; this.vz = vt * Math.cos(be) * .9 + vn * r * nz; this.vy = vt * Math.sin(be) * .9 + vn * r * ny; this.phi = be + wrap(this.phi - be) * .3; this.w *= -.3;
        if (b && b !== this.W.landing) this.roofs++; this.ev.push(['bounce', vn, b && b !== this.W.landing]); return; }
      // pēc katapultas mašīna/skūteris bez vadītāja aizripo pa zemi un apstājas
      if (this.coast && st.wheels && err < 60 * D2R) { this.mode = 'ground'; this.v = Math.max(0, vt); this.phi = be; this.w = 0; this.ev.push(['touch', vn, !!b && b !== this.W.landing]); return; }
      // pieskāriens zemei vai jumtam – lidojums beidzas uzreiz (bez ripošanas)
      this.phi = be; this.w = 0; this.ev.push(['touch', vn, !!b && b !== this.W.landing]); this.done('land'); }
    hitWall(b, v, x0, z0) { const st = this.st; this.x = x0; this.z = z0; this.wall = b;
      if (v > (st.bounce ? 14 : 7)) return this.crash('wall', v);
      this.vz = 0; this.v = 0; this.vy = Math.min(this.vy, 0); this.ev.push(['bonk', v]); this.done('stop'); }
    groundStep(inp) { const st = this.st, s = surfAt(this.W, this.x, this.z), be = s.slope, v = this.v;
      const D = .5 * RHO * v * v * st.cda / st.m;
      this.bank *= 1 - DT * 4;
      // pēc piezemēšanās – bremzes (lai nav jāgaida lēna ripošana), stūrē arī pa zemi
      this.v += (-G * Math.sin(be) - (st.roll + st.brake * (this.coast ? 3 : 1)) * G * Math.cos(be) - D + (this.thr ? st.T / st.m : 0)) * DT;
      this.psi = clamp(this.psi - (inp.roll || 0) * .7 * Math.min(1, this.v / 5) * DT, -80 * D2R, 80 * D2R);
      if (this.v <= 1.2) { this.v = 0; return this.done('stop'); }
      const z0 = this.z, x0 = this.x; this.z += this.v * Math.cos(be) * Math.cos(this.psi) * DT; this.x += this.v * Math.cos(be) * Math.sin(this.psi) * DT; this.maxZ = Math.max(this.maxZ, this.z);
      const s2 = surfAt(this.W, this.x, this.z);
      if (s2.b && s2.b !== s.b && s2.h > this.y + .6 && s2.b !== this.W.landing) return this.hitWall(s2.b, this.v, x0, z0);
      if (s2.h < this.y - .6) { this.mode = 'air'; this.vz = this.v * Math.cos(be); this.vy = this.v * Math.sin(be); this.ev.push(['edge']); return; }
      this.y = s2.h; this.phi += (s2.slope - this.phi) * .2; this.vz = this.v * Math.cos(s2.slope); this.vy = this.v * Math.sin(s2.slope); }
    crash(kind, v) { this.mode = 'crash'; this.ev.push(['crash', kind, v]); }
    done(k) { this.mode = 'done'; this.ev.push(['done', k]); }
  }

  const P = { G, RHO, DT, D2R, NL, RAMPS, VEH, LIP, EXIT, rampProfile, rampAt, stats, forces, CL, surfAt, roofH, inside, indexWorld, Sim, wrap, clamp };
  if (typeof module !== 'undefined') module.exports = P; else root.RP = P;
})(this);
