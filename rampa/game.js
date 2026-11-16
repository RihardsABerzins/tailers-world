// Mega rampa – 3D skats no aizmugures: darbnīca → slīdi lejā pa milzu rampu → atlec, lido/planē pāri pilsētai → nosēšanās vai avārija
// → attālums = nauda (kopīgais maciņš TW.wallet) + XP → uzlabojumi → atkal. Fizika – physics.js (RP), zīmēšana – three.js r128.
// Teksti latviski. Dati Firebase: rampa/saves/{uid}; medaļas – grupa 'rampa'; tēls – users/{uid}/look.
'use strict';
const $ = id => document.getElementById(id);
const T3 = THREE, { VEH, RAMPS, Sim, stats, rampProfile, rampAt, surfAt, indexWorld, DT, D2R, clamp, wrap } = RP;
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const levelOf = xp => { let l = 1, need = 120; while (xp >= need) { xp -= need; l++; need = 120 + 60 * (l - 1); } return { l, cur: xp, need }; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
let W = innerWidth, H = innerHeight;

// ================= Saglabāšana =================
let save = { xp: 0, flights: 0, veh: 'plane', ramp: 0, own: { plane: { wheel: 0, wing: 0, eng: 0, long: 0 } }, best: { plane: 0, scoot: 0, car: 0 }, st: { landP: 0, landS: 0, landC: 0, crash: 0, flips: 0, roofs: 0 }, first: 0 };
let OPT = { help: true, streaks: true }; try { Object.assign(OPT, JSON.parse(localStorage.getItem('rpOpt')) || {}); } catch (e) {}
const saveOpt = () => { try { localStorage.setItem('rpOpt', JSON.stringify(OPT)); } catch (e) {} };
let LOOK = { skin: '#f2c9a0', hood: 'auto', hat: 'cap', cap: '#1b1b1f', mask: 'none', pants: '#2b3a67' };

// ================= Pilsēta (vienāda katru reizi – sēkla) =================
const BLK = 70, RD = 14, NZ = 100, NX = 10, CITY_Z = NZ * BLK;
const PAL = [0xf2e6d0, 0xe8c9a8, 0xd9a07a, 0xc7d3e0, 0xf6f1e7, 0xe3b9b0, 0xb9c8b0, 0xd0c4e4, 0xf3d68c, 0xa9c3d9, 0xe0e0e0, 0xcfb79a];
function genCity() {
  const R = mulberry(20261116), lots = [], parks = [], obs = [], tan26 = Math.tan(26 * D2R);
  for (let k = -8; k < NZ; k++) for (let j = -NX; j <= NX; j++) {
    const cx = j * BLK, z0 = k * BLK + RD / 2, z1 = (k + 1) * BLK - RD / 2, x0 = cx - BLK / 2 + RD / 2, x1 = cx + BLK / 2 - RD / 2, cz = (z0 + z1) / 2;
    const r0 = R(), r1 = R(), r2 = R(), r3 = R();
    if (j === 0 && k <= 0) continue; // rampa un nolaišanās rampa
    if (r0 < .15) { parks.push({ x0, x1, z0, z1 }); continue; }
    const xs = r1 < .6 ? [x0, cx + (r2 * 28 - 14), x1] : [x0, x1], zs = r3 < .5 ? [z0, cz + (R() * 24 - 12), z1] : [z0, z1];
    for (let a = 0; a < xs.length - 1; a++) for (let b = 0; b < zs.length - 1; b++) {
      const L = { x0: xs[a] + 1.5, x1: xs[a + 1] - 1.5, z0: zs[b] + 1.5, z1: zs[b + 1] - 1.5, col: PAL[Math.floor(R() * PAL.length)] };
      let h = 7 + R() * R() * 34 + (R() < .07 ? 30 + R() * 70 : 0); if (k < 5) h = Math.min(h, 9 + Math.max(0, k) * 5);
      const onPath = L.x0 < 1.5 && L.x1 > -1.5;
      if (onPath && k < 30) h = Math.min(h, 14 + k * 1.2);
      L.h = h;
      if (onPath && L.z1 - L.z0 >= 18 && R() < .24) { const w = Math.min(h * .55, (L.z1 - L.z0) * tan26); if (h - w >= 4) L.w = w; }
      lots.push(L); if (onPath) obs.push(L);
    }
  }
  obs.sort((a, b) => a.z0 - b.z0);
  const landing = { z0: 3, z1: 3 + 22 / Math.tan(28 * D2R), h: 22, landing: true };
  return { lots, parks, world: indexWorld({ obs, landing }) };
}
const CITY = genCity(), WORLD = CITY.world;

// ================= three.js aina =================
const renderer = new T3.WebGLRenderer({ canvas: $('cv'), antialias: (devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputEncoding = T3.sRGBEncoding;
const scene = new T3.Scene(); scene.background = new T3.Color(0x9fd3ff); scene.fog = new T3.Fog(0xbfe3ff, 260, 1500);
const camera = new T3.PerspectiveCamera(62, 1, .3, 1800);
scene.add(new T3.HemisphereLight(0xeaf6ff, 0x6a7d5a, .95)); const sun = new T3.DirectionalLight(0xfff4e0, .75); sun.position.set(-.6, 1, -.4); scene.add(sun);
const tex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); if (rep) { t.wrapS = t.wrapT = T3.RepeatWrapping; } t.anisotropy = 4; return t; };
const MATS = {}; const mat = (c, o) => { const k = c + JSON.stringify(o || {}); return MATS[k] || (MATS[k] = new T3.MeshLambertMaterial(Object.assign({ color: c }, o || {}))); };
const m4 = new T3.Matrix4(), q0 = new T3.Quaternion(), v3 = new T3.Vector3(), col = new T3.Color();

function buildCity() {
  // zeme: ielas + ietves (tekstūra viena kvartāla izmērā)
  const gt = tex(256, 256, (g, w) => { const s = w / BLK, r = RD / 2 * s; g.fillStyle = '#4c515c'; g.fillRect(0, 0, w, w); g.fillStyle = '#cfc8bb'; g.fillRect(r, r, w - 2 * r, w - 2 * r);
    g.fillStyle = '#bdb6a8'; g.fillRect(r + 5, r + 5, w - 2 * r - 10, w - 2 * r - 10); g.fillStyle = '#f2f2f2';
    for (let i = 0; i < w; i += 22) { g.fillRect(i, -1, 11, 2); g.fillRect(i, w - 1, 11, 2); g.fillRect(-1, i, 2, 11); g.fillRect(w - 1, i, 2, 11); }
    g.fillStyle = '#e8e8e8'; for (let i = r + 4; i < w - r - 4; i += 8) { g.fillRect(i, r - 9, 4, 7); } }, true);
  const GX = 21 * BLK, GZ0 = -8 * BLK, GZ = CITY_Z - GZ0 + 600;
  gt.repeat.set(GX / BLK, GZ / BLK); gt.offset.set(.5, 0);
  const ground = new T3.Mesh(new T3.PlaneGeometry(GX, GZ), new T3.MeshLambertMaterial({ map: gt })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, GZ0 + GZ / 2); scene.add(ground);
  const far = new T3.Mesh(new T3.PlaneGeometry(9000, 12000), mat(0x8fbf6a)); far.rotation.x = -Math.PI / 2; far.position.set(0, -.3, 4000); scene.add(far);
  // mājas – logi zīmēti šeiderī pēc pasaules koordinātām (nav jāstiepj tekstūra)
  const bm = new T3.MeshLambertMaterial({ color: 0xffffff });
  bm.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vWp; varying float vNy;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * instanceMatrix * vec4(position,1.)).xyz; vNy = normal.y;');
    s.fragmentShader = 'varying vec3 vWp; varying float vNy;\n' + s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      if (vNy < .5 && vWp.y > 1.2) { vec2 c = vec2(fract((vWp.x + vWp.z) / 3.6), fract(vWp.y / 3.3)); float w = step(.2, c.x) * step(c.x, .8) * step(.28, c.y) * step(c.y, .86);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.42, .55, .68) + .12 * fract(sin(dot(floor(vWp.xy / 3.4), vec2(12.9, 78.2))) * 437.5), w * .9); }
      if (vNy > .5) diffuseColor.rgb *= .78;`); };
  const box = new T3.BoxGeometry(1, 1, 1).translate(0, .5, .5);
  const L = CITY.lots, bI = new T3.InstancedMesh(box, bm, L.length);
  L.forEach((b, i) => { bI.setMatrixAt(i, m4.compose(v3.set((b.x0 + b.x1) / 2, 0, b.z0), q0, new T3.Vector3(b.x1 - b.x0, b.h - (b.w || 0), b.z1 - b.z0))); bI.setColorAt(i, col.set(b.col)); });
  scene.add(bI);
  // slīpie jumti (nolaišanās rampas uz jumtiem) un lielā nolaišanās rampa
  const wedge = wedgeGeo(), wl = L.filter(b => b.w), wI = new T3.InstancedMesh(wedge, new T3.MeshLambertMaterial({ map: rampTex() }), wl.length + 1);
  wl.forEach((b, i) => wI.setMatrixAt(i, m4.compose(v3.set((b.x0 + b.x1) / 2, b.h - b.w, b.z0), q0, new T3.Vector3(b.x1 - b.x0, b.w, b.z1 - b.z0))));
  const LR = WORLD.landing; wI.setMatrixAt(wl.length, m4.compose(v3.set(0, 0, LR.z0), q0, new T3.Vector3(22, LR.h, LR.z1 - LR.z0))); scene.add(wI);
  // parki un koki
  const P = CITY.parks, pI = new T3.InstancedMesh(new T3.BoxGeometry(1, .3, 1), mat(0x7cbf5a), P.length); const trees = [], R = mulberry(77);
  P.forEach((p, i) => { pI.setMatrixAt(i, m4.compose(v3.set((p.x0 + p.x1) / 2, .15, (p.z0 + p.z1) / 2), q0, new T3.Vector3(p.x1 - p.x0, 1, p.z1 - p.z0)));
    for (let n = 0; n < 9; n++) trees.push([p.x0 + 3 + R() * (p.x1 - p.x0 - 6), p.z0 + 3 + R() * (p.z1 - p.z0 - 6), 2.5 + R() * 2.5, R()]); });
  scene.add(pI);
  const tr = new T3.InstancedMesh(new T3.CylinderGeometry(.3, .4, 3, 5).translate(0, 1.5, 0), mat(0x6b4a2e), trees.length), cr = new T3.InstancedMesh(new T3.IcosahedronGeometry(1, 0), mat(0xffffff), trees.length);
  trees.forEach(([x, z, r, t], i) => { tr.setMatrixAt(i, m4.compose(v3.set(x, 0, z), q0, new T3.Vector3(1, 1, 1))); cr.setMatrixAt(i, m4.compose(v3.set(x, 3 + r * .8, z), q0, new T3.Vector3(r, r * 1.2, r))); cr.setColorAt(i, col.set(t < .5 ? 0x4a9a3c : 0x5d8f2f)); });
  scene.add(tr); scene.add(cr);
  // mašīnas ielās
  const RC = mulberry(5), cars = []; for (let i = 0; i < 600; i++) { const along = RC() < .5, lane = RC() < .5 ? -3.5 : 3.5; let x, z, ry;
    if (along) { x = (Math.floor(RC() * 20) - 10) * BLK + BLK / 2 + lane; z = -500 + RC() * (CITY_Z + 500); ry = 0; } else { x = (RC() - .5) * 1400; z = Math.floor(RC() * NZ) * BLK + lane; ry = Math.PI / 2; }
    cars.push([x, z, ry, pick([0xe53935, 0x1e88e5, 0xfdd835, 0xffffff, 0x37474f, 0x43a047, 0xfb8c00])]); }
  const cb = new T3.InstancedMesh(new T3.BoxGeometry(1.8, .9, 4.2).translate(0, .75, 0), mat(0xffffff), cars.length), cc = new T3.InstancedMesh(new T3.BoxGeometry(1.6, .6, 2.2).translate(0, 1.5, -.2), mat(0x2b3440), cars.length);
  const qy = new T3.Quaternion(); cars.forEach(([x, z, ry, c], i) => { qy.setFromAxisAngle(new T3.Vector3(0, 1, 0), ry); m4.compose(v3.set(x, 0, z), qy, new T3.Vector3(1, 1, 1)); cb.setMatrixAt(i, m4); cc.setMatrixAt(i, m4); cb.setColorAt(i, col.set(c)); });
  scene.add(cb); scene.add(cc);
  // mākoņi
  const cl = new T3.InstancedMesh(new T3.IcosahedronGeometry(1, 1), new T3.MeshLambertMaterial({ color: 0xffffff, emissive: 0x9aa7b5 }), 70), RM = mulberry(9);
  for (let i = 0; i < 70; i++) { const s = 18 + RM() * 30; cl.setMatrixAt(i, m4.compose(v3.set((RM() - .5) * 1600, 160 + RM() * 160, -300 + RM() * (CITY_Z + 600)), q0, new T3.Vector3(s * 2, s * .55, s * 1.4))); }
  scene.add(cl);
  // attāluma zīmes ik pēc 100 m
  for (let z = 100; z <= CITY_Z; z += 100) { const sp = label(`${z} m`, '#ffffff', '#1b2140cc', 26); sp.position.set(-35, 15, z); sp.scale.set(10, 3.4, 1); scene.add(sp);
    const pole = new T3.Mesh(POLE, mat(0x8a8f99)); pole.position.set(-35, 6.5, z); scene.add(pole); }
}
const POLE = new T3.CylinderGeometry(.15, .15, 13, 5);
function label(text, fg, bg, size) { const t = tex(256, 88, (g, w, h) => { g.fillStyle = bg; const r = 26; g.beginPath(); g.moveTo(r, 4); g.arcTo(w - 4, 4, w - 4, h - 4, r); g.arcTo(w - 4, h - 4, 4, h - 4, r); g.arcTo(4, h - 4, 4, 4, r); g.arcTo(4, 4, w - 4, 4, r); g.fill();
  g.fillStyle = fg; g.font = `900 ${size * 2}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2); });
  return new T3.Sprite(new T3.SpriteMaterial({ map: t, depthWrite: false, fog: false })); }
function wedgeGeo() { // prizma: aizmugurē augstums 1, uz priekšu (z) slīpi lejā līdz 0
  const p = [-.5, 0, 0, .5, 0, 0, .5, 1, 0, -.5, 1, 0, -.5, 0, 1, .5, 0, 1], f = [[3, 2, 5], [3, 5, 4], [0, 1, 2], [0, 2, 3], [0, 4, 5], [0, 5, 1], [0, 3, 4], [1, 5, 2]], pos = [], uv = [];
  const U = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 1], [1, 1]];
  f.forEach(tri => tri.forEach(i => { pos.push(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]); uv.push(U[i][0], i >= 4 ? 4 : i >= 2 ? 0 : 0); }));
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g; }
let RTEX = null;
function rampTex() { return RTEX || (RTEX = tex(128, 256, (g, w, h) => { g.fillStyle = '#c9a272'; g.fillRect(0, 0, w, h); g.strokeStyle = '#9c784a99'; g.lineWidth = 2;
  for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = '#00000014'; for (let i = 0; i < 40; i++) g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 8 + Math.random() * 30);
  g.fillStyle = '#ffffff55'; g.fillRect(w / 2 - 2, 0, 4, h); }, true)); }

// ---- milzu rampa (U formas šķērsgriezums) ----
let RAMP = null, rampGroup = null, GATE = null, gateA = 0, leverK = 0;
function buildRamp(H) {
  if (rampGroup) { scene.remove(rampGroup); rampGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  RAMP = rampProfile(H); rampGroup = new T3.Group(); scene.add(rampGroup);
  const cs = []; const FW = 5, RR = 8; cs.push([-FW - RR - 1.6, RR]); cs.push([-FW - RR, RR]);
  for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 * (1 - i / 8); cs.push([-FW - RR * Math.cos(Math.PI / 2 - a) + 0 * a, RR - RR * Math.sin(Math.PI / 2 - a)]); }
  // pārrēķina: ceturtdaļaplis no sienas augšas līdz grīdai
  cs.length = 0; cs.push([-FW - RR - 1.6, RR]); for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; cs.push([-FW - RR * Math.cos(a), RR - RR * Math.sin(a)]); }
  const half = cs.slice(), full = half.concat(half.slice().reverse().map(([x, y]) => [-x, y]));
  const pts = RAMP.pts.filter((p, i) => i % 3 === 0 || i === RAMP.pts.length - 1), pos = [], uv = [], idx = [], n = full.length;
  let ux = [0]; for (let j = 1; j < n; j++) ux.push(ux[j - 1] + Math.hypot(full[j][0] - full[j - 1][0], full[j][1] - full[j - 1][1]));
  const um = ux[n - 1] / 2; pts.forEach(p => full.forEach(([x, y], j) => { pos.push(x, p.y + y, p.z); uv.push((ux[j] - um) / 28 + .5, p.s / 12); }));
  for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < n - 1; j++) { const a = i * n + j, b = a + 1, c = a + n, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const rt = rampTex(); const rm = new T3.MeshLambertMaterial({ map: rt, side: T3.DoubleSide }); rampGroup.add(new T3.Mesh(g, rm));
  // balsti
  const sup = pts.filter((p, i) => i % 4 === 0), sI = new T3.InstancedMesh(new T3.BoxGeometry(1, 1, 1).translate(0, .5, 0), mat(0x8a8f99), sup.length * 2);
  sup.forEach((p, i) => [-11, 11].forEach((x, k) => sI.setMatrixAt(i * 2 + k, m4.compose(v3.set(x, 0, p.z), q0, new T3.Vector3(1.1, Math.max(.1, p.y - .3), 1.1))))); rampGroup.add(sI);
  // starta platforma ar darbnīcu
  const p0 = RAMP.pts[0], plat = new T3.Mesh(new T3.BoxGeometry(34, 2, 26), mat(0x5c6270)); plat.position.set(0, p0.y - 1, p0.z - 12); rampGroup.add(plat);
  const gar = new T3.Mesh(new T3.BoxGeometry(16, 8, 10), mat(0xe8c9a8)); gar.position.set(0, p0.y + 4, p0.z - 20); rampGroup.add(gar);
  const door = new T3.Mesh(new T3.BoxGeometry(9, 5.5, .2), mat(0x3d4552)); door.position.set(0, p0.y + 2.75, p0.z - 14.9); rampGroup.add(door);
  const sign = label('🔧 DARBNĪCA', '#2b1a00', '#ffd34d', 22); sign.position.set(0, p0.y + 9.6, p0.z - 14.8); sign.scale.set(9, 3.1, 1); rampGroup.add(sign);
  // starta barjera – atveras, kad novelk sviru
  GATE = new T3.Group(); GATE.position.set(-7, p0.y, p0.z + 4.2); rampGroup.add(GATE);
  [-7, 7].forEach(x => { const post = new T3.Mesh(new T3.BoxGeometry(.4, 3.2, .4).translate(0, 1.6, 0), mat(0x3d4552)); post.position.set(x, p0.y, p0.z + 4.2); rampGroup.add(post); });
  const bt = tex(128, 16, (g2, w) => { for (let i = 0; i < 8; i++) { g2.fillStyle = i % 2 ? '#ffffff' : '#e53935'; g2.fillRect(i * w / 8, 0, w / 8, 16); } });
  const bar = new T3.Mesh(new T3.BoxGeometry(14, .22, .18).translate(7, 0, 0), new T3.MeshLambertMaterial({ map: bt })); bar.position.y = 2.1; GATE.add(bar); GATE.userData.bar = bar;
  const tower = new T3.Mesh(new T3.BoxGeometry(30, 1, 22).translate(0, .5, 0), mat(0x7d838e)); tower.scale.y = p0.y - 2; tower.position.set(0, 0, p0.z - 12); rampGroup.add(tower);
}

// ================= Braucamrīki un tēls =================
const LOOKC = () => ({ skin: LOOK.skin || '#f2c9a0', body: LOOK.hood && LOOK.hood !== 'auto' ? LOOK.hood : '#e53935', pants: LOOK.pants || '#2b3a67', helm: LOOK.hood && LOOK.hood !== 'auto' && LOOK.hood !== '#eceff1' ? '#f5f5f5' : '#ffd34d', stripe: LOOK.cap || '#1b1b1f' });
function makePerson(pose) { const c = LOOKC(), g = new T3.Group(), B = (w, h, d) => new T3.BoxGeometry(w, h, d);
  const legs = new T3.Group(); [-.1, .1].forEach(x => { const l = new T3.Mesh(B(.16, .6, .18).translate(0, -.3, 0), mat(c.pants)); l.position.x = x; legs.add(l); }); legs.position.y = .6; g.add(legs);
  const torso = new T3.Mesh(B(.44, .52, .28).translate(0, .26, 0), mat(c.body)); torso.position.y = .6; g.add(torso);
  const arms = []; [-.29, .29].forEach(x => { const a = new T3.Mesh(B(.12, .46, .14).translate(0, -.23, 0), mat(c.body)); a.position.set(x, 1.08, 0); g.add(a); arms.push(a); });
  const head = new T3.Mesh(new T3.SphereGeometry(.17, 12, 9), mat(c.skin)); head.position.y = 1.32; g.add(head);
  const helm = new T3.Mesh(new T3.SphereGeometry(.205, 14, 8, 0, Math.PI * 2, 0, Math.PI * .55), mat(c.helm)); helm.position.y = 1.34; g.add(helm);
  const strip = new T3.Mesh(new T3.BoxGeometry(.06, .05, .42), mat(c.stripe)); strip.position.set(0, 1.53, 0); g.add(strip);
  const visor = new T3.Mesh(new T3.BoxGeometry(.3, .07, .06), mat(0x223047)); visor.position.set(0, 1.36, .17); g.add(visor);
  g.userData = { legs, torso, arms, head };
  setPose(g, pose); return g; }
function setPose(p, pose) { const u = p.userData; u.legs.rotation.x = pose === 'sit' ? -Math.PI / 2 : 0; u.legs.position.y = pose === 'sit' ? .62 : .6; u.torso.rotation.x = pose === 'crouch' ? .45 : 0;
  u.arms.forEach(a => { a.rotation.x = pose === 'sit' ? -1.1 : pose === 'crouch' ? -1.2 : pose === 'wave' ? 0 : -.3; a.rotation.z = pose === 'wave' ? (a.position.x > 0 ? -2.6 : .2) : pose === 'chute' ? (a.position.x > 0 ? -2.8 : 2.8) : 0; });
  if (pose === 'crouch') { u.legs.scale.y = .8; } else u.legs.scale.y = 1; }

const WING_C = [0, 0xc9a26b, 0xe0c08a, 0xff6b8a, 0x4fc3f7, 0xffffff];
// braucamrīks no atsevišķām daļām (avārijā katra daļa lido pati); seeds – gaisa strīpu sākumpunkti
function buildVehicle(vid, sel, st) {
  const g = new T3.Group(), parts = [], add = (geo, m, x, y, z, kind) => { const o = new T3.Mesh(geo, m); o.position.set(x, y, z); g.add(o); parts.push(o); o.userData.kind = kind || 'p'; return o; };
  const V = { g, parts, seeds: [], tips: null, spin: null, flames: [], pilot: null, body: null, len: 4 };
  const Cyl = (r1, r2, h, n) => new T3.CylinderGeometry(r1, r2, h, n || 10), B = (w, h, d) => new T3.BoxGeometry(w, h, d);
  if (vid === 'plane') {
    const hb = sel.wheel ? .78 : .45;
    V.body = add(Cyl(.42, .28, 3.4).rotateX(Math.PI / 2), mat(0xe8483e), 0, hb, 0, 'body');
    add(new T3.ConeGeometry(.42, .7, 10).rotateX(Math.PI / 2), mat(0xf5f5f5), 0, hb, 2.05);
    add(B(.06, .78, .62), mat(0xe8483e), 0, hb + .45, -1.45); add(B(1.7, .05, .46), mat(0xf5f5f5), 0, hb + .08, -1.5);
    const wc = mat(WING_C[sel.wing || 0] || 0xffffff);
    if (st.S) { const b = st.span, c = st.chord; [-1, 1].forEach(s => { const w = add(B(b / 2, .07, c), wc, s * (b / 4 + .2), hb + .05, .35, 'wing'); w.rotation.z = s * .05; });
      V.tips = [[-b / 2 - .2, hb + .1, .35 - c / 2], [b / 2 + .2, hb + .1, .35 - c / 2]];
      for (let i = 0; i < 7; i++) { const x = (i / 6 - .5) * b * .9; if (Math.abs(x) < .5) continue; V.seeds.push({ x, y: hb + .22, sev: .05, amp: .08, zc: .35, len: c, down: 1 }, { x, y: hb - .14, sev: .08, amp: -.05, zc: .35, len: c, down: 1 }); } }
    if (sel.wheel) { const wr = .2 + sel.wheel * .02; [-.5, .5].forEach(x => { add(Cyl(wr, wr, .14, 12).rotateZ(Math.PI / 2), mat(0x222222), x, wr, .55); add(B(.05, hb - wr, .05), mat(0x777777), x, wr + (hb - wr) / 2, .55); }); add(Cyl(.1, .1, .08, 8).rotateZ(Math.PI / 2), mat(0x222222), 0, .1, -1.55); }
    const e = sel.eng || 0;
    if (e === 1 || e === 2) { const sp = new T3.Group(); sp.position.set(0, hb, 2.42); g.add(sp); const len = e === 1 ? .7 : 1.7; [0, 1].forEach(k => { const bl = new T3.Mesh(B(len, .12, .04), mat(e === 1 ? 0x9fd8ff : 0x5a3a22)); bl.rotation.z = k * Math.PI / 2 * (e === 1 ? 1 : 2); sp.add(bl); }); if (e === 1) { const ring = new T3.Mesh(new T3.TorusGeometry(.42, .04, 6, 16), mat(0xdddddd)); sp.add(ring); } V.spin = sp; parts.push(sp); sp.userData.kind = 'p'; }
    if (e === 3) { add(Cyl(.2, .2, 1.2).rotateX(Math.PI / 2), mat(0xd23c2c), 0, hb - .48, -.4); V.flames.push([0, hb - .48, -1.05, .5]); }
    if (e === 4) { add(Cyl(.3, .24, 1.7).rotateX(Math.PI / 2), mat(0x8c939e), 0, hb + .58, -.7); V.flames.push([0, hb + .58, -1.6, .7]); }
    const p = makePerson('sit'); p.scale.setScalar(.75); p.position.set(0, hb - .1, .35); g.add(p); V.pilot = p;
    V.seeds.push(...[[-.35, hb + .1], [.35, hb + .1], [0, hb + .45], [0, hb - .4], [-.2, hb + .3], [.2, hb - .25]].map(([x, y]) => ({ x, y, sev: st.S ? .35 : .45, amp: Math.sign(y - hb) * .3 || .3, zc: 1.8, len: 1.2, down: 0, side: x })));
    V.seeds.push({ x: 0, y: hb + 1.05, sev: .55, amp: .25, zc: .4, len: .5, down: 0 }); // galva ar ķiveri
    V.len = 4.2;
  } else if (vid === 'scoot') {
    const wr = .11 + (sel.wheel || 0) * .012;
    V.body = add(B(.2, .06, .95), mat(0x26c6da), 0, wr + .05, 0, 'body');
    [-.44, .44].forEach(z => add(Cyl(wr, wr, .07, 12).rotateZ(Math.PI / 2), mat(0x222222), 0, wr, z));
    const stem = add(Cyl(.025, .025, .95, 6), mat(0xb0bec5), 0, .58, .43); stem.rotation.x = -.12; add(B(.52, .04, .04), mat(0x333333), 0, 1.05, .48);
    const aero = sel.aero || 0, p = makePerson(aero ? 'crouch' : 'stand'); p.position.set(0, wr + .08, -.08); g.add(p); V.pilot = p;
    if (sel.eng) { add(Cyl(.09, .09, .5), mat(0xd23c2c), -.12, wr + 1.05 - aero * .08, -.3); add(Cyl(.09, .09, .5), mat(0xd23c2c), .12, wr + 1.05 - aero * .08, -.3); V.flames.push([-.12, wr + .75, -.3, .35, true], [.12, wr + .75, -.3, .35, true]); }
    const sev = clamp((st.cda - .1) / .22, 0, 1);
    for (let i = 0; i < 9; i++) { const y = .35 + i * .14; V.seeds.push({ x: (i % 2 ? -1 : 1) * (.15 + (i % 3) * .1), y, sev: sev * (y > .9 ? 1 : .8), amp: .25, zc: 0, len: .5, down: 0, side: 1 }); }
    V.len = 1.2;
  } else {
    const wr = .36 + (sel.wheel || 0) * .07, lift = wr - .36;
    V.body = add(B(1.8, .56, 4).translate(0, 0, 0), mat(0x1e88e5), 0, .62 + lift, 0, 'body');
    add(B(1.55, .5, 2).translate(0, 0, 0), mat(0x2b3440), 0, 1.15 + lift, -.25); add(B(1.6, .07, 1.8), mat(0x1e88e5), 0, 1.42 + lift, -.3);
    [-1, 1].forEach(sx => [-1.3, 1.3].forEach(z => add(Cyl(wr, wr, .32, 12).rotateZ(Math.PI / 2), mat(0x1d1d1d), sx * .86, wr, z)));
    add(B(.5, .14, .06), mat(0xfff3b0), -.55, .72 + lift, 2.02); add(B(.5, .14, .06), mat(0xfff3b0), .55, .72 + lift, 2.02);
    if (sel.aero >= 1) { add(B(1.75, .06, .38), mat(0x111111), 0, 1.3 + lift, -1.9); add(B(.06, .3, .1), mat(0x111111), -.6, 1.12 + lift, -1.9); add(B(.06, .3, .1), mat(0x111111), .6, 1.12 + lift, -1.9); }
    if (sel.aero >= 2) { add(B(1.86, .12, 4.05), mat(0x111111), 0, .32 + lift, 0); }
    if (sel.eng) { [-.5, .5].forEach(x => { add(Cyl(.12, .12, .5).rotateX(Math.PI / 2), mat(0x8c939e), x, .45 + lift, -2.1); V.flames.push([x, .45 + lift, -2.45, .5]); }); }
    const p = makePerson('sit'); p.scale.setScalar(.85); p.position.set(-.4, .35 + lift, -.1); g.add(p); V.pilot = p;
    const sev = clamp((st.cda - .4) / .45, 0, 1);
    for (let i = 0; i < 10; i++) { const front = i < 6; V.seeds.push(front ? { x: (i - 2.5) * .32, y: .5 + lift + (i % 2) * .25, sev: .55 + sev * .45, amp: .6, zc: 2, len: .8, down: 0 } : { x: (i - 7.5) * .45, y: 1.5 + lift, sev: .2 + sev * .4, amp: .15, zc: 0, len: 1.5, down: 0 }); }
    V.len = 4.4;
  }
  // liesmas (turbo)
  V.flameM = V.flames.map(([x, y, z, s, down]) => { const f = new T3.Mesh(new T3.ConeGeometry(.16 * s / .5, 1.2 * s / .5, 8).rotateX(down ? Math.PI : -Math.PI / 2), new T3.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: .9 })); f.position.set(x, down ? y - .35 : y, down ? z : z - .5 * s / .5); f.visible = false; g.add(f); return f; });
  return V;
}

// ================= Gaisa strīpas =================
// Strīpas plūst garām braucamrīkam (grupa pagriezta pa ātruma virzienu). Krāsa: balta – gaiss plūst viegli, oranža/sarkana – liela pretestība.
const STRK = { mesh: null, parts: [], max: 90 };
function initStreaks() {
  const n = STRK.max * 3 * 2 * 6, g = new T3.BufferGeometry();
  g.setAttribute('position', new T3.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('color', new T3.BufferAttribute(new Float32Array(n * 3), 3));
  STRK.mesh = new T3.Mesh(g, new T3.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .8, side: T3.DoubleSide, depthWrite: false, fog: false })); STRK.mesh.frustumCulled = false;
  STRK.grp = new T3.Group(); STRK.grp.add(STRK.mesh);
}
const SC = [new T3.Color(0xffffff), new T3.Color(0xffd27a), new T3.Color(0xff8a2a), new T3.Color(0xff2a1a)];
function sevCol(s) { s = clamp(s, 0, 1) * 3; const i = Math.min(2, Math.floor(s)); return col.copy(SC[i]).lerp(SC[i + 1], s - i); }
function streakPos(sd, u, V, out, cl) { const zf = V.len * .75 + 1.5, zb = V.len * .9 + 3.5, z = zf - u * (zf + zb), e = Math.exp(-(((z - sd.zc) / sd.len) ** 2));
  out[0] = sd.x + (sd.side ? Math.sign(sd.x) * Math.abs(sd.amp) * .6 * e : 0); out[1] = sd.y + sd.amp * e - (sd.down ? Math.max(0, sd.zc - z) * .12 * cl : 0); out[2] = z; return out; }
function updateStreaks(V, dt, sp, alpha, cl, on) {
  const pos = STRK.mesh.geometry.attributes.position.array, cc = STRK.mesh.geometry.attributes.color.array; let k = 0;
  if (!on || sp < 4) { STRK.mesh.geometry.setDrawRange(0, 0); return; }
  STRK.grp.rotation.x = alpha; // pagriež atpakaļ pa ātruma virzienu
  const seeds = V.seeds, per = Math.max(1, Math.floor((STRK.max - (V.tips ? 20 : 0)) / Math.max(1, seeds.length)));
  while (STRK.parts.length < STRK.max) STRK.parts.push({ i: STRK.parts.length, t: Math.random() });
  const lu = clamp(sp * .009, .06, .42), vel = Math.min(sp, 14) / (V.len * 2 + 6), w = .045 + Math.min(.05, sp * .0012), a = [0, 0, 0], b = [0, 0, 0];
  const quad = (p, q, c, wx, wy) => { // divas krusteniskas lentes
    for (const [dx, dy] of [[wx, 0], [0, wy]]) { const vs = [[p[0] - dx, p[1] - dy, p[2]], [p[0] + dx, p[1] + dy, p[2]], [q[0] + dx, q[1] + dy, q[2]], [p[0] - dx, p[1] - dy, p[2]], [q[0] + dx, q[1] + dy, q[2]], [q[0] - dx, q[1] - dy, q[2]]];
      for (const v of vs) { pos[k * 3] = v[0]; pos[k * 3 + 1] = v[1]; pos[k * 3 + 2] = v[2]; cc[k * 3] = c.r; cc[k * 3 + 1] = c.g; cc[k * 3 + 2] = c.b; k++; } } };
  let used = 0;
  for (let si = 0; si < seeds.length && used < STRK.max - (V.tips ? 20 : 0); si++) for (let j = 0; j < per; j++, used++) {
    const P = STRK.parts[used]; P.t += dt * vel * (1 + j * .13); if (P.t > 1) P.t -= 1 + Math.random() * .2;
    const sd = seeds[si], c = sevCol(sd.sev); if (P.t < 0) continue;
    for (let s = 0; s < 3; s++) { const u0 = P.t + lu * s / 3, u1 = P.t + lu * (s + 1) / 3; if (u1 > 1) break; streakPos(sd, u0, V, a, cl); streakPos(sd, u1, V, b, cl); quad(a, b, c, w, w); }
  }
  // virpuļi aiz spārnu galiem – stiprāki, kad liels cēlējspēks (inducētā pretestība)
  if (V.tips && Math.abs(cl) > .15) { const r = .12 + Math.min(.5, Math.abs(cl) * .35), wc = col.set(0xffffff).clone();
    for (let ti = 0; ti < 2; ti++) for (let j = 0; j < 10; j++, used++) { const P = STRK.parts[used]; P.t += dt * vel * .7; if (P.t > 1) P.t -= 1;
      const tip = V.tips[ti], sgn = ti ? -1 : 1, f = u => { const z = tip[2] - u * (4 + sp * .08), an = sgn * (u * 14 + performance.now() / 120); return [tip[0] + Math.cos(an) * r * Math.min(1, u * 4), tip[1] + Math.sin(an) * r * Math.min(1, u * 4), z]; };
      const u0 = P.t, u1 = Math.min(1, P.t + .08); quad(f(u0), f(u1), wc, w * .8, w * .8); } }
  STRK.mesh.geometry.setDrawRange(0, k); STRK.mesh.geometry.attributes.position.needsUpdate = true; STRK.mesh.geometry.attributes.color.needsUpdate = true;
}

// ================= Efekti: dzirksteles, dūmi, putekļi, stikli, dakstiņi =================
const FX = { puffs: [], sparks: [], bits: [], decals: [] };
const PUFF = tex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, '#ffffffff'); r.addColorStop(.6, '#ffffff99'); r.addColorStop(1, '#ffffff00'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const spPool = []; for (let i = 0; i < 70; i++) { const s = new T3.Sprite(new T3.SpriteMaterial({ map: PUFF, transparent: true, depthWrite: false })); s.visible = false; scene.add(s); spPool.push(s); }
const SPK = { n: 260, pos: new Float32Array(260 * 3) }; { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(SPK.pos, 3)); SPK.pts = new T3.Points(g, new T3.PointsMaterial({ color: 0xffc040, size: .32, blending: T3.AdditiveBlending, transparent: true, depthWrite: false })); SPK.pts.frustumCulled = false; scene.add(SPK.pts); }
const BITS = new T3.InstancedMesh(new T3.BoxGeometry(1, 1, 1), new T3.MeshLambertMaterial({ color: 0xffffff }), 220); BITS.count = 0; BITS.frustumCulled = false; scene.add(BITS);
function puff(p, kind, n) { for (let i = 0; i < n; i++) { const s = spPool.find(x => !x.visible); if (!s) return; s.visible = true; s.position.set(p.x + rnd(-1, 1), p.y + rnd(0, 1), p.z + rnd(-1, 1));
  const c = kind === 'smoke' ? [.35, .36, .4] : kind === 'dust' ? [.78, .7, .58] : [.95, .95, .95]; s.material.color.setRGB(...c); s.material.opacity = kind === 'smoke' ? .75 : .8;
  FX.puffs.push({ s, v: new T3.Vector3(rnd(-2, 2), kind === 'smoke' ? rnd(1.5, 3.5) : rnd(.3, 2.5), rnd(-2, 2)), life: 0, max: kind === 'smoke' ? rnd(2.5, 4) : rnd(1.2, 2.2), s0: kind === 'smoke' ? 1.2 : 1.6, grow: kind === 'smoke' ? 2.2 : 3, op: s.material.opacity }); } }
function sparks(p, n, v) { for (let i = 0; i < n && FX.sparks.length < SPK.n; i++) FX.sparks.push({ p: p.clone(), v: new T3.Vector3(rnd(-6, 6), rnd(2, 10), (v || 0) * rnd(.1, .5) + rnd(-5, 5)), life: rnd(.4, 1) }); }
function bits(p, n, kind, v) { for (let i = 0; i < n && FX.bits.length < 220; i++) { const glass = kind === 'glass';
  FX.bits.push({ p: p.clone().add(new T3.Vector3(rnd(-1.5, 1.5), rnd(-1, 1), 0)), v: new T3.Vector3(rnd(-5, 5), rnd(1, 7), (v || 0) * rnd(-.2, .25) + rnd(-3, 1)), r: new T3.Euler(rnd(0, 6), rnd(0, 6), 0), rv: rnd(-9, 9),
    s: glass ? new T3.Vector3(rnd(.15, .4), rnd(.15, .4), .03) : new T3.Vector3(.5, .08, .35), c: glass ? 0xbfe6ff : pick([0xa34a2a, 0x8c3b22, 0xb85a35]), life: 0, rest: false }); } }
function decal(b, y) { const d = new T3.Mesh(new T3.PlaneGeometry(2.6, 2.2), new T3.MeshBasicMaterial({ color: 0x1d232c })); d.position.set(rnd(-1, 1), y, b.z0 - .06); d.rotation.y = Math.PI; scene.add(d); FX.decals.push(d);
  const cr = new T3.Mesh(new T3.PlaneGeometry(4.5, .25), new T3.MeshBasicMaterial({ color: 0x2a2a2a })); cr.position.set(d.position.x + .4, y + .9, b.z0 - .07); cr.rotation.set(0, Math.PI, .5); scene.add(cr); FX.decals.push(cr); }
function clearFX() { FX.puffs.forEach(f => f.s.visible = false); FX.puffs = []; FX.sparks = []; FX.bits = []; BITS.count = 0; FX.decals.forEach(d => scene.remove(d)); FX.decals = []; }
const GR = 9.81, dq = new T3.Quaternion(), de = new T3.Euler();
function floorAt(x, z) { return Math.abs(x) < 2.2 ? surfAt(WORLD, z).h : 0; }
function updateFX(dt) {
  for (let i = FX.puffs.length - 1; i >= 0; i--) { const f = FX.puffs[i]; f.life += dt; const k = f.life / f.max; if (k >= 1) { f.s.visible = false; FX.puffs.splice(i, 1); continue; }
    f.s.position.addScaledVector(f.v, dt); f.v.multiplyScalar(1 - dt * .8); const sc = f.s0 + f.grow * Math.sqrt(k) * 2; f.s.scale.set(sc, sc, 1); f.s.material.opacity = f.op * (1 - k); }
  let n = 0; for (let i = FX.sparks.length - 1; i >= 0; i--) { const s = FX.sparks[i]; s.life -= dt; if (s.life <= 0) { FX.sparks.splice(i, 1); continue; } s.v.y -= GR * dt; s.p.addScaledVector(s.v, dt); const fl = floorAt(s.p.x, s.p.z); if (s.p.y < fl) { s.p.y = fl; s.v.y *= -.4; s.v.x *= .6; s.v.z *= .6; } }
  FX.sparks.forEach(s => { SPK.pos[n * 3] = s.p.x; SPK.pos[n * 3 + 1] = s.p.y; SPK.pos[n * 3 + 2] = s.p.z; n++; }); SPK.pts.geometry.setDrawRange(0, n); SPK.pts.geometry.attributes.position.needsUpdate = true;
  FX.bits.forEach((b, i) => { if (!b.rest) { b.v.y -= GR * dt; b.p.addScaledVector(b.v, dt); b.r.x += b.rv * dt; b.r.y += b.rv * .7 * dt; const fl = floorAt(b.p.x, b.p.z) + .03;
      if (b.p.y < fl) { b.p.y = fl; b.v.multiplyScalar(.35); b.v.y = Math.abs(b.v.y) * .3; b.rv *= .5; if (b.v.length() < .4) { b.rest = true; b.r.x = Math.PI / 2; } } }
    BITS.setMatrixAt(i, m4.compose(b.p, dq.setFromEuler(b.r), b.s)); BITS.setColorAt(i, col.set(b.c)); });
  BITS.count = FX.bits.length; BITS.instanceMatrix.needsUpdate = true; if (BITS.instanceColor) BITS.instanceColor.needsUpdate = true;
}

// ---- avārijas daļas ----
let DEB = [];
function crumple(mesh, k) { const g = mesh.geometry.clone(), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i), f = clamp((z + .5) / 2, 0, 1) * k;
  p.setXYZ(i, p.getX(i) * (1 + rnd(-.15, .15) * f), p.getY(i) * (1 - .35 * f) + rnd(-.05, .05) * f, z * (1 - .3 * f)); } g.computeVertexNormals(); mesh.geometry = g; }
function breakApart(V, vel, wall) {
  DEB = []; const parts = V.parts.slice();
  parts.forEach((o, i) => { scene.attach(o); const main = o === V.body, keep = main ? (wall ? -.12 : .55) : (wall ? rnd(-.25, .15) : rnd(.25, .75));
    if (main && o.isMesh) crumple(o, wall ? 1 : .6);
    else if (o.userData.kind === 'wing' && o.isMesh) { o.rotation.z += rnd(-.6, .6); o.rotation.x += rnd(-.4, .4); }
    DEB.push({ o, v: new T3.Vector3(rnd(-3, 3) * (main ? .3 : 1), Math.abs(vel.y) * .2 + rnd(main ? 1 : 2, main ? 3 : 8), vel.z * keep), w: new T3.Vector3(rnd(-6, 6), rnd(-6, 6), rnd(-6, 6)).multiplyScalar(main ? .4 : 1), main, r: main ? .5 : .2, rest: 0 }); });
  V.flameM.forEach(f => f.visible = false);
}
function updateDebris(dt) {
  for (const d of DEB) { if (d.rest > 1) continue; d.v.y -= GR * dt; d.o.position.addScaledVector(d.v, dt); d.o.rotation.x += d.w.x * dt; d.o.rotation.y += d.w.y * dt; d.o.rotation.z += d.w.z * dt;
    const s = surfAt(WORLD, d.o.position.z), fl = Math.abs(d.o.position.x) < 2.2 ? s.h : 0;
    if (Math.abs(d.o.position.x) < 2.2 && s.b && !s.b.landing && d.o.position.y < s.b.h - .5 && d.v.z > 0 && d.o.position.z - d.v.z * dt < s.b.z0) { d.o.position.z = s.b.z0 - .3; d.v.z *= -.25; }
    if (d.o.position.y < fl + d.r) { d.o.position.y = fl + d.r; const hard = Math.abs(d.v.y) + Math.abs(d.v.z) * .3; if (hard > 6 && FX.sparks.length < 200) sparks(d.o.position, 4, d.v.z);
      d.v.y = Math.abs(d.v.y) * (d.main ? .15 : .3); d.v.x *= .7; d.v.z *= d.main ? .82 : .7; d.w.multiplyScalar(.6); if (d.v.length() < .6) { d.rest += dt * 4; if (d.rest > 1) { d.v.set(0, 0, 0); d.o.rotation.x = Math.round(d.o.rotation.x / Math.PI) * Math.PI * (d.main ? 1 : 0) || d.o.rotation.x; } } } }
}
function disposeDebris() { DEB.forEach(d => { scene.remove(d.o); }); DEB = []; }

// ---- izpletnis ----
function makeChute() { const g = new T3.Group(), cols = [0xff5a5a, 0xffffff, 0xffd34d, 0x3d8bff];
  for (let i = 0; i < 8; i++) { const seg = new T3.Mesh(new T3.SphereGeometry(2.2, 4, 6, i * Math.PI / 4, Math.PI / 4, 0, Math.PI / 2.4), new T3.MeshLambertMaterial({ color: cols[i % 4], side: T3.DoubleSide })); seg.scale.y = .55; g.add(seg); }
  const lm = new T3.LineBasicMaterial({ color: 0x333333 }); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, lg = new T3.BufferGeometry().setFromPoints([new T3.Vector3(Math.cos(a) * 1.8, .45, Math.sin(a) * 1.8), new T3.Vector3(0, -3.2, 0)]); g.add(new T3.Line(lg, lm)); }
  return g; }
let PIL = null; // { o, v, chute, t, landed }

// ================= Spēles stāvoklis =================
let state = 'boot', sim = null, VEHM = null, ST = null, prev = null, acc = 0, crashT = 0, runT = 0, endInfo = null, inp = { pitch: 0, turbo: false }, lastT = performance.now(), shopT = 0, camShake = 0;
const shadow = new T3.Mesh(new T3.CircleGeometry(1, 20).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .28, depthWrite: false })); scene.add(shadow);
const own = vid => save.own[vid];
const selOf = vid => Object.assign({ wheel: 0, wing: 0, eng: 0, aero: 0, long: 0 }, own(vid) || {});
let BEST = null; // rekorda bāka
function placeBest() { if (BEST) { scene.remove(BEST); BEST = null; } const b = save.best[save.veh] || 0; if (b < 20) return; BEST = new T3.Group();
  const beam = new T3.Mesh(new T3.CylinderGeometry(.35, .35, 140, 8, 1, true), new T3.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: .2, depthWrite: false, fog: false })); beam.position.y = 70; BEST.add(beam);
  const l = label(`🏆 ${Math.round(b)} m`, '#2b1a00', '#ffd34d', 26); l.position.y = 42; l.scale.set(7, 2.4, 1); BEST.add(l); BEST.position.set(0, 0, b); scene.add(BEST); }

function setVehicle() {
  if (VEHM) { scene.remove(VEHM.g); }
  disposeDebris(); if (PIL) { scene.remove(PIL.o); if (PIL.chute) scene.remove(PIL.chute); PIL = null; }
  const vid = save.veh, sel = selOf(vid); ST = stats(vid, sel); VEHM = buildVehicle(vid, sel, ST); scene.add(VEHM.g); VEHM.g.add(STRK.grp);
  const p = RAMP.pts[0]; VEHM.g.position.set(0, p.y, p.z); VEHM.g.rotation.set(0, 0, 0); placeBest();
}
function resize() { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.fov = W < H ? 72 : 58; camera.updateProjectionMatrix(); viewOffset(); }
function viewOffset() { if (state === 'shop') { const land = W > H, sh = $('shop').getBoundingClientRect();
    if (land) camera.setViewOffset(W, H, (W - sh.left + 8) / 2 * .9, 0, W, H); else camera.setViewOffset(W, H, 0, Math.min(H * .3, (H - sh.top + 8) / 2), W, H); }
  else camera.clearViewOffset(); }
addEventListener('resize', () => { resize(); });

// ---- lidojums ----
function go() {
  if (state !== 'shop' && state !== 'end') return;
  audioInit(); closeSheet(); $('shop').classList.remove('on'); setVehicle(); clearFX();
  sim = new Sim(ST, RAMP, WORLD); prev = { z: sim.z, y: sim.y, phi: sim.phi }; acc = 0; runT = 0; crashT = 0; endInfo = null; state = 'ready'; document.body.classList.add('run'); viewOffset();
  gateA = 0; leverK = 0; setLever(0); $('lever').classList.add('on'); $('dist').classList.add('on'); $('dM').textContent = '0 m'; $('dSub').textContent = VEH[save.veh].i + ' ' + VEH[save.veh].n;
  if (save.flights < 3) banner('⬇ Novelc sviru lejā, lai atvērtu barjeru!', 3.5);
}
// svira: velc rokturi lejā līdz galam → barjera atveras un brauciens sākas
function setLever(k) { leverK = k; $('knob').style.transform = `translateY(${k * 128}px)`; $('lever').style.setProperty('--k', k); }
function release() { if (state !== 'ready') return; state = 'run'; setLever(1); setTimeout(() => $('lever').classList.remove('on'), 350); sfx('clunk'); setTimeout(() => sfx('go'), 150);
  $('turbo').classList.toggle('on', !!ST.T); hints(save.flights < 3); if (navigator.vibrate) navigator.vibrate(30);
  if (save.flights === 0) banner(ST.S ? '⬅ Turi kreisajā pusē – deguns augšup, labajā – lejup ➡' : '⬅ Turi kreisajā vai labajā pusē, lai grieztos ➡', 4.5); }
{ const kn = $('knob'); let drag = null;
  kn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); if (state !== 'ready') return; drag = { y: e.clientY, k: leverK }; try { kn.setPointerCapture(e.pointerId); } catch (x) {} sfx('tick'); });
  kn.addEventListener('pointermove', e => { if (!drag || state !== 'ready') return; const k = clamp(drag.k + (e.clientY - drag.y) / 128, 0, 1); setLever(k); if (k > .92) { drag = null; release(); } });
  const up = () => { if (!drag) return; drag = null; if (state === 'ready') { const k0 = leverK, t0 = performance.now(); const back = () => { const f = Math.min(1, (performance.now() - t0) / 200); if (state === 'ready') { setLever(k0 * (1 - f)); if (f < 1) requestAnimationFrame(back); } }; back(); } };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => kn.addEventListener(ev, up)); }
function hints(on) { $('hintL').classList.toggle('on', on); $('hintR').classList.toggle('on', on);
  const fl = ST && !ST.S; $('hintL').innerHTML = fl ? '↺<small>Turi – griezies atpakaļ</small>' : '⬆<small>Turi – deguns augšup</small>'; $('hintR').innerHTML = fl ? '↻<small>Turi – griezies uz priekšu</small>' : '⬇<small>Turi – deguns lejup</small>'; }
function handleEvents() {
  for (const e of sim.ev) { const k = e[0];
    if (k === 'launch') { sfx('whoosh'); if (save.flights < 3) setTimeout(() => hints(false), 6000); }
    else if (k === 'stall') { warn('Deguns par augstu!'); sfx('stall'); }
    else if (k === 'flip') { toast(`🤸 Salto ×${e[1]}!`); sfx('coin'); }
    else if (k === 'bounce') { puff(VEHM.g.position, 'dust', 3); camShake = .3; sfx('bump'); if (e[2]) toast('🏠 Lēciens pa jumtu!'); }
    else if (k === 'touch') { puff(VEHM.g.position, 'dust', 4); sfx('bump'); }
    else if (k === 'bonk') { sfx('bump'); camShake = .3; }
    else if (k === 'crash') startCrash(e[1], e[2]);
    else if (k === 'done') finish('land'); }
  sim.ev.length = 0;
}
function startCrash(kind, v) {
  state = 'crash'; crashT = 0; camShake = 1; $('turbo').classList.remove('on'); hints(false); inp.turbo = false; const p = VEHM.g.position.clone(), vel = new T3.Vector3(0, sim.vy, sim.vz), wall = kind === 'wall', b = wall ? sim.wall : surfAt(WORLD, sim.z).b;
  if (VEHM.spin) VEHM.spin.rotation.z += 0;
  // tēls izlec ar izpletni
  const pil = VEHM.pilot; scene.attach(pil); setPose(pil, 'stand'); PIL = { o: pil, v: new T3.Vector3(rnd(-1, 1), 13 + Math.min(8, Math.abs(sim.vz) * .1), wall ? -2 : Math.max(2, sim.vz * .35)), t: 0, chute: null, landed: false, spin: rnd(-4, 4) };
  breakApart(VEHM, vel, wall); updateStreaks(VEHM, 0, 0, 0, 0, false);
  sparks(p.clone().add(new T3.Vector3(0, .5, 0)), 60, sim.vz); puff(p, 'dust', 10); puff(p, 'smoke', 4);
  if (b && !b.landing) { const y = wall ? clamp(p.y + 1, 2, b.h - 1) : b.h; if (wall) { bits(new T3.Vector3(0, y, b.z0 - .3), 34, 'glass', -sim.vz); decal(b, y); } if (!wall || p.y > b.h - 5) bits(new T3.Vector3(0, b.h, wall ? b.z0 + 1 : p.z), 26, 'tile', sim.vz); }
  sfx('crash'); if (b && !b.landing) setTimeout(() => sfx('glass'), 120);
  endInfo = { kind: 'crash', dist: Math.max(0, sim.maxZ) };
}
function updatePilot(dt) { if (!PIL) return; const P = PIL; P.t += dt; const o = P.o;
  if (!P.landed) {
    if (P.t > .6 && !P.chute) { P.chute = makeChute(); P.chute.scale.setScalar(.05); scene.add(P.chute); setPose(o, 'chute'); sfx('chute'); }
    if (P.chute) { const k = Math.min(1, (P.t - .6) / .5); P.chute.scale.setScalar(.05 + .95 * k); P.v.y += (-3.2 - P.v.y) * Math.min(1, dt * 2.2 * k + dt * .2); P.v.z += (2 - P.v.z) * dt * .8; P.v.x *= 1 - dt; o.rotation.set(0, 0, Math.sin(P.t * 1.6) * .12); }
    else { P.v.y -= GR * dt; o.rotation.x += P.spin * dt; }
    o.position.addScaledVector(P.v, dt); const fl = floorAt(o.position.x, o.position.z);
    if (P.chute) P.chute.position.set(o.position.x, o.position.y + 1.5 + 3.4, o.position.z);
    if (o.position.y <= fl) { o.position.y = fl; P.landed = true; P.lt = P.t; o.rotation.set(0, Math.PI, 0); setPose(o, 'wave'); puff(o.position, 'dust', 3); sfx('bump'); }
  } else { if (P.chute) { const k = Math.min(1, (P.t - P.lt) / 1.2); P.chute.scale.set(1 + k * .3, Math.max(.05, 1 - k), 1 + k * .3); P.chute.position.y = o.position.y + Math.max(.2, (1 - k) * 4.9); P.chute.position.z = o.position.z + 1 + k * 1.5; }
    const u = o.userData; u.arms.forEach(a => { if (a.position.x > 0) a.rotation.z = -2.6 + Math.sin(P.t * 9) * .4; }); }
}
function finish(kind) {
  if (state === 'end') return;
  const landed = kind === 'land', dist = Math.max(0, Math.round(endInfo ? endInfo.dist : sim.maxZ)), vid = save.veh, old = save.best[vid] || 0, rec = dist > old && dist >= 5;
  const parts = [['📏 Attālums', '€' + Math.round(dist / 5)]]; let money = Math.round(dist / 5);
  if (landed) { const b = Math.round(dist / 20) + 3; money += b; parts.push(['🛬 Nolaidies', '+€' + b]); }
  if (sim.flips) { money += sim.flips * 2; parts.push([`🤸 Salto ×${sim.flips}`, '+€' + sim.flips * 2]); }
  if (sim.roofs) { money += sim.roofs * 2; parts.push([`🏠 Jumti ×${sim.roofs}`, '+€' + sim.roofs * 2]); }
  if (rec) { const b = 5 + Math.round((dist - old) / 10); money += b; parts.push(['🏆 Jauns rekords', '+€' + b]); }
  if (!save.first) { save.first = 1; money += 25; parts.push(['🎁 Pirmais lēciens', '+€25']); }
  const xp = Math.round(dist / 10) + (landed ? 5 : 0) + 2, lv0 = levelOf(save.xp).l;
  save.xp += xp; save.flights++; if (rec) save.best[vid] = dist;
  const S = save.st; if (landed) S[{ plane: 'landP', scoot: 'landS', car: 'landC' }[vid]]++; else S.crash++; S.flips += sim.flips; S.roofs += sim.roofs;
  walletAdd(money); persist(); medals(); hud(); placeBest();
  const lv1 = levelOf(save.xp).l;
  endInfo = { dist, money, xp, rec, landed };
  state = 'end'; document.body.classList.remove('run'); $('dist').classList.remove('on'); $('turbo').classList.remove('on'); hints(false); inp.turbo = false;
  setTimeout(() => {
    sheet(`<div class="step">${VEH[vid].i} ${VEH[vid].n}</div><h2>${landed ? '🛬 Nolaidies!' : '🪂 Avārija – bet tēls izlēca!'}</h2>
      <div class="big">${dist} m</div>${rec ? '<p style="text-align:center;font-weight:900;color:#ffd34d">🏆 Jauns rekords!</p>' : `<p style="text-align:center;color:#c9d2ff">Rekords: ${Math.round(old)} m</p>`}
      <div class="parts">${parts.map(([a, b]) => `<div class="part"><span>${a}</span><b>${b}</b></div>`).join('')}<div class="part"><span>💰 Kopā</span><b>€${money}</b></div><div class="part"><span>⭐ XP</span><b>+${xp}</b></div></div>
      ${lv1 > lv0 ? `<p style="text-align:center;font-weight:900;color:#7dffa8">⬆ ${lv1}. līmenis!</p>` : ''}
      <div class="row2"><button class="main ghostB" id="toShop">🔧 Darbnīca</button><button class="main green" id="again">🔁 Vēlreiz</button></div>`);
    $('again').onclick = () => go(); $('toShop').onclick = () => { closeSheet(); openShop(); };
    sfx(rec ? 'win' : 'coin');
  }, landed ? 900 : 300);
}

// ================= Darbnīca =================
function rampSpeed(st) { const s = new Sim(st, RAMP, WORLD); for (let i = 0; i < 120 * 40 && s.mode === 'ramp'; i++) s.step({ pitch: 0 }); return s.mode === 'ramp' ? s.v : (s.ev[0] || [0, s.v])[1]; }
function openShop() {
  state = 'shop'; $('lever').classList.remove('on'); document.body.classList.remove('run'); closeSheet(); $('dist').classList.remove('on'); $('turbo').classList.remove('on'); hints(false); clearFX(); setVehicle(); renderShop(); $('shop').classList.add('on'); viewOffset();
}
function renderShop() {
  const vid = save.veh, V = VEH[vid], o = own(vid), sh = $('shop');
  let h = `<h3>🔧 Darbnīca <small>💰 €${wallet}</small></h3><div class="vtabs">${Object.keys(VEH).map(k => `<button data-v="${k}" class="${k === vid ? 'on' : ''}"><i>${VEH[k].i}</i>${VEH[k].n}${own(k) ? '' : `<em>🔒 €${VEH[k].p}</em>`}</button>`).join('')}</div>`;
  if (!o) { h += `<div class="vlock"><div style="font-size:54px">${V.i}</div><p>${V.d}</p><button class="buy ${wallet < V.p ? 'no' : ''}" id="buyV" style="width:100%;min-height:54px;font-size:17px">Nopirkt par €${V.p}</button></div>`; sh.innerHTML = h; wireShop(); return; }
  const sel = selOf(vid), st = ST;
  for (const [k, S] of Object.entries(V.slots)) { const lv = sel[k] || 0, cur = S.lv[lv], nx = S.lv[lv + 1];
    h += `<div class="slot"><i>${S.i}</i><div><b>${S.n}</b><small>${cur.n}</small><div class="pips">${S.lv.map((_, i) => `<u class="${i <= lv ? 'on' : ''}"></u>`).join('')}</div>
      ${k === 'wing' && lv > 0 ? `<div class="lr"><button data-long="0" class="${sel.long ? '' : 'on'}">Īsie – veikli</button><button data-long="1" class="${sel.long ? 'on' : ''}">Garie – tālu</button></div>` : ''}</div>
      ${nx ? `<button class="buy ${wallet < nx.p ? 'no' : ''}" data-buy="${k}">${esc(nx.n.split(' ')[0])}<br>€${nx.p}</button>` : '<button class="buy max" disabled>MAX</button>'}</div>`; }
  const r = RAMPS[save.ramp], rn = RAMPS[save.ramp + 1];
  h += `<div class="slot"><i>🏗️</i><div><b>Rampa (visiem)</b><small>${r.n} – ${r.h} m</small><div class="pips">${RAMPS.map((_, i) => `<u class="${i <= save.ramp ? 'on' : ''}"></u>`).join('')}</div></div>
    ${rn ? `<button class="buy ${wallet < rn.p ? 'no' : ''}" data-buy="ramp">${rn.h} m<br>€${rn.p}</button>` : '<button class="buy max" disabled>MAX</button>'}</div>`;
  const vs = rampSpeed(st);
  h += `<div class="bars"><span>🏁 Ātrums rampā ${Math.round(vs * 3.6)} km/h</span><div><i style="width:${clamp(vs / 60, .05, 1) * 100}%"></i></div>
    ${st.S ? `<span>🪽 Planēšana 1:${st.LD.toFixed(0)}</span><div><i style="width:${clamp(st.LD / 16, .05, 1) * 100}%"></i></div>` : `<span>🪽 Neplanē</span><div><i style="width:3%"></i></div>`}
    <span>⚖️ Svars ${Math.round(st.m)} kg</span><div><i style="width:${clamp(st.m / 1200, .05, 1) * 100}%"></i></div>
    ${st.T ? `<span>🔥 Turbo ${st.fuel} s</span><div><i style="width:${clamp(st.T * st.fuel / st.m / 70, .05, 1) * 100}%"></i></div>` : ''}</div>
    <p style="margin:6px 0 0;font-size:13px;color:#c9d2ff">🏆 Rekords: <b style="color:#ffd34d">${Math.round(save.best[vid] || 0)} m</b> · Lēcieni: ${save.flights}</p>
    <button id="go">🚀 Aiziet!</button>`;
  sh.innerHTML = h; wireShop();
}
function wireShop() { const sh = $('shop');
  sh.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { save.veh = b.dataset.v; persist(); setVehicle(); renderShop(); sfx('tick'); });
  const bv = $('buyV'); if (bv) bv.onclick = () => { const V = VEH[save.veh]; if (wallet < V.p) { toast(`💰 Vēl jānopelna €${V.p - wallet}`); sfx('bad'); return; } walletAdd(-V.p); save.own[save.veh] = { wheel: 0, aero: 0, eng: 0 }; persist(); setVehicle(); renderShop(); sfx('win'); toast(`${V.i} ${V.n} ir tavā darbnīcā!`); };
  sh.querySelectorAll('[data-long]').forEach(b => b.onclick = () => { own(save.veh).long = +b.dataset.long; persist(); setVehicle(); renderShop(); sfx('tick'); });
  sh.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const k = b.dataset.buy;
    if (k === 'ramp') { const rn = RAMPS[save.ramp + 1]; if (wallet < rn.p) { toast(`💰 Vēl jānopelna €${rn.p - wallet}`); sfx('bad'); return; } walletAdd(-rn.p); save.ramp++; persist(); buildRamp(RAMPS[save.ramp].h); setVehicle(); renderShop(); sfx('win'); toast(`🏗️ ${rn.n} – ${rn.h} m!`); return; }
    const o = own(save.veh), S = VEH[save.veh].slots[k], nx = S.lv[(o[k] || 0) + 1]; if (wallet < nx.p) { toast(`💰 Vēl jānopelna €${nx.p - wallet}`); sfx('bad'); return; }
    walletAdd(-nx.p); o[k] = (o[k] || 0) + 1; if (k === 'wing' && o[k] === 1) o.long = 1; persist(); setVehicle(); renderShop(); sfx('win'); toast(`${S.i} ${nx.n}!`); });
  const g = $('go'); if (g) g.onclick = () => go(); }

// ================= Kamera un kadrs =================
const camT = new T3.Vector3(), camL = new T3.Vector3(), tmp = new T3.Vector3();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = clamp((now - lastT) / 1000, 0, .25); lastT = now; if (document.hidden) return;
  const paused = $('ov').classList.contains('on') && state === 'run';
  if (state === 'run' && !paused) {
    acc += dt; runT += dt; const ip = { pitch: inp.pitch, turbo: inp.turbo, help: OPT.help };
    while (acc >= DT && state === 'run') { prev.z = sim.z; prev.y = sim.y; prev.phi = sim.phi; sim.step(ip); acc -= DT; handleEvents(); }
    const a = state === 'run' ? acc / DT : 1, z = prev.z + (sim.z - prev.z) * a, y = prev.y + (sim.y - prev.y) * a, ph = prev.phi + wrap(sim.phi - prev.phi) * a;
    VEHM.g.position.set(0, y, z); VEHM.g.rotation.x = -ph;
    if (state === 'run') { const sp = sim.speed; if (VEHM.spin) VEHM.spin.rotation.z += dt * (sim.thr ? 60 : 8 + sp * .5);
      VEHM.flameM.forEach(f => { f.visible = sim.thr; if (sim.thr) f.scale.setScalar(.8 + Math.random() * .5); });
      updateStreaks(VEHM, dt, sp, sim.mode === 'air' ? sim.alpha : 0, sim.mode === 'air' ? sim.cl : 0, OPT.streaks);
      $('dM').textContent = Math.max(0, Math.round(sim.maxZ)) + ' m'; $('dSub').textContent = `⬆ ${Math.max(0, Math.round(sim.y - surfAt(WORLD, sim.z).h))} m · ${Math.round(sp * 3.6)} km/h`;
      if (ST.T) $('turbo').style.setProperty('--f', (sim.fuel / ST.fuel * 100) + '%');
      if (!sim.stall) $('warn').classList.remove('on');
      wind(sp); engine(sim.thr);
      if (sim.thr && VEHM.flames.length && Math.random() < dt * 12) puff(tmp.set(0, y + .4, z - VEHM.len * .8 - 3), 'smoke', 1); }
  } else if (state === 'shop') { shopT += dt; wind(0); engine(false); }
  if (GATE) { gateA += ((state === 'shop' || state === 'ready' ? 0 : 1) - gateA) * Math.min(1, dt * 6); GATE.userData.bar.rotation.z = gateA * 1.45 + (state === 'ready' ? leverK * .06 : 0); }
  if (state === 'crash' || state === 'end') { crashT += dt; updateDebris(dt); updatePilot(dt); wind(0); engine(false);
    if (state === 'crash' && crashT < 3 && Math.random() < dt * 8 && DEB[0]) puff(DEB[0].o.position, 'smoke', 1);
    if (state === 'crash' && ((PIL && PIL.landed && PIL.t - PIL.lt > 1.2) || crashT > 12)) finish('crash'); }
  updateFX(dt);
  // ēna
  const vp = state === 'shop' || state === 'run' ? VEHM.g.position : PIL ? PIL.o.position : VEHM.g.position, sh = state === 'run' && sim && sim.mode !== 'ramp' ? surfAt(WORLD, vp.z).h : -9;
  shadow.visible = sh > -1 && vp.y - sh < 60; if (shadow.visible) { const k = clamp(1 - (vp.y - sh) / 60, .2, 1); shadow.position.set(0, sh + .08, vp.z); shadow.scale.setScalar(VEHM.len * .45 * (1.4 - k * .4)); shadow.material.opacity = .3 * k; }
  // kamera
  const port = W < H;
  if (state === 'shop') { const p = VEHM.g.position, a = Math.sin(shopT * .25) * .6 + .75, r = VEHM.len * 1.3 + 4;
    camT.set(p.x + Math.sin(a) * r, p.y + 2.2 + r * .15, p.z + Math.cos(a) * r); camL.set(p.x, p.y + .9, p.z); camera.position.lerp(camT, 1 - Math.exp(-dt * 3)); }
  else if (state === 'run' || state === 'ready') { const p = VEHM.g.position, sp = state === 'ready' ? 0 : sim.speed, back = (port ? 6.5 : 5.2) + VEHM.len * .95 + sp * .045, up = 1.7 + VEHM.len * .32 + sp * .018;
    const onR = state === 'ready' || sim.mode === 'ramp' || p.z < 0; let cy = p.y + up, cz = p.z - back;
    if (onR) { const rs0 = (sim.mode === 'ramp' ? sim.s : RAMP.len) - back, rp = rampAt(RAMP, Math.max(0, rs0)); cy = Math.max(cy, rp.y + up + 1); cz = rp.z + Math.min(0, rs0); }
    camT.set(0, cy, cz); camL.set(0, p.y + 1, p.z + 10 + sp * .25);
    camera.position.lerp(camT, 1 - Math.exp(-dt * (onR ? 6 : 4))); }
  else { const tgt = PIL && crashT > 1.4 ? PIL.o.position : DEB[0] ? DEB[0].o.position : VEHM.g.position;
    camT.set(8 + Math.min(6, crashT), tgt.y + 5 + Math.min(4, crashT), tgt.z - 14); camL.copy(tgt); camL.y += 1.5; camera.position.lerp(camT, 1 - Math.exp(-dt * 2)); }
  camera.lookAt(camL);
  if (camShake > 0) { camShake = Math.max(0, camShake - dt * 1.6); camera.position.x += rnd(-.3, .3) * camShake; camera.position.y += rnd(-.3, .3) * camShake; }
  renderer.render(scene, camera);
}

// ================= Vadība =================
const ptr = new Map();
function recalcPitch() { let up = 0, dn = 0; ptr.forEach(s => { if (s > 0) up = 1; else dn = 1; }); inp.pitch = (kUp ? 1 : 0) - (kDn ? 1 : 0) + up - dn; inp.pitch = clamp(inp.pitch, -1, 1); }
let kUp = 0, kDn = 0;
$('cv').addEventListener('pointerdown', e => { audioInit(); if (state !== 'run') return; ptr.set(e.pointerId, e.clientX < W / 2 ? 1 : -1); recalcPitch(); try { $('cv').setPointerCapture(e.pointerId); } catch (x) {} });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => $('cv').addEventListener(ev, e => { ptr.delete(e.pointerId); recalcPitch(); }));
const tb = $('turbo');
tb.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); inp.turbo = true; tb.classList.add('on'); try { tb.setPointerCapture(e.pointerId); } catch (x) {} if (navigator.vibrate) navigator.vibrate(15); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => tb.addEventListener(ev, () => { inp.turbo = false; }));
addEventListener('keydown', e => { if (e.repeat) return; if (e.key === 'ArrowUp' || e.key === 'w') kUp = 1; else if (e.key === 'ArrowDown' || e.key === 's') kDn = 1; else if (e.key === ' ') { inp.turbo = true; e.preventDefault(); if (state === 'ready') release(); } else if (e.key === 'Enter' && (state === 'shop' || state === 'end')) go(); else if (e.key === 'Enter' && state === 'ready') release(); recalcPitch(); });
addEventListener('keyup', e => { if (e.key === 'ArrowUp' || e.key === 'w') kUp = 0; else if (e.key === 'ArrowDown' || e.key === 's') kDn = 0; else if (e.key === ' ') inp.turbo = false; recalcPitch(); });
addEventListener('contextmenu', e => e.preventDefault());

// ================= UI palīgi =================
function sheet(html) { $('sheet').innerHTML = html; $('ov').classList.add('on'); }
function closeSheet() { $('ov').classList.remove('on'); }
let toastT = 0; function toast(t) { const el = $('toast'); el.innerHTML = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2400); }
let banT = 0; function banner(t, s) { const el = $('banner'); el.innerHTML = t; el.classList.add('on'); clearTimeout(banT); banT = setTimeout(() => el.classList.remove('on'), (s || 3) * 1000); }
let warnT = 0; function warn(t) { const el = $('warn'); el.textContent = t; el.classList.add('on'); clearTimeout(warnT); warnT = setTimeout(() => el.classList.remove('on'), 1200); }
let hudKey = '';
function hud() { const lv = levelOf(save.xp), key = [lv.l, lv.cur, wallet].join('|'); if (key === hudKey) return; hudKey = key;
  $('sLv').textContent = `🛫 ${lv.l}. līm.`; $('sXp').style.width = (lv.cur / lv.need * 100) + '%';
  $('sMoney').innerHTML = `<b style="color:${wallet < 0 ? '#ff5a6a' : '#ffd34d'};font-size:14px;display:inline">💰 €${wallet}</b>`;
  if (state === 'shop' && $('shop').classList.contains('on')) { const s = $('shop').querySelector('h3 small'); if (s) s.textContent = `💰 €${wallet}`; } }
$('gear').onclick = e => { e.stopPropagation(); audioInit(); if ($('ov').classList.contains('on') && !$('setOk')) { toast('⚙ Iestatījumi – kad aizver šo logu'); return; }
  sheet(`<h2>⚙ Iestatījumi</h2><div class="setBox"><div class="step">📻 Radio un dziesmas</div><div id="radioC">${window.TWRadio ? TWRadio.controlsHTML() : ''}</div></div>
    <div class="setBox"><label class="setRow">🔔 Efekti (vējš, avārijas) <input id="fxV" type="range" min="0" max="100" value="${Math.round(FXV * 100)}"></label></div>
    <div class="setBox"><div class="step">🛫 Lidojums</div><div class="setRow" style="margin:6px 0">🧭 Palīgs izlīdzina</div><div class="seg" id="sHelp"><button data-x="1" class="${OPT.help ? 'on' : ''}">Ieslēgts</button><button data-x="0" class="${OPT.help ? '' : 'on'}">Izslēgts</button></div>
      <div class="setRow" style="margin:10px 0 6px">🌬 Gaisa strīpas</div><div class="seg" id="sStr"><button data-x="1" class="${OPT.streaks ? 'on' : ''}">Rādīt</button><button data-x="0" class="${OPT.streaks ? '' : 'on'}">Nerādīt</button></div></div>
    <p style="color:#9fb0ff;font-size:13.5px">Radio un Papīra Lidmašīnu dziesmas skan visās Tailers World spēlēs.</p><button class="main" id="setOk">✔ Gatavs</button>`);
  if (window.TWRadio) TWRadio.wire($('radioC'));
  $('fxV').oninput = () => { FXV = $('fxV').value / 100; try { localStorage.setItem('rpFx', FXV); } catch (x) {} sfx('tick'); };
  [['sHelp', 'help'], ['sStr', 'streaks']].forEach(([id, k]) => $(id).querySelectorAll('button').forEach(b => b.onclick = () => { OPT[k] = b.dataset.x === '1'; saveOpt(); $(id).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }));
  $('setOk').onclick = () => { closeSheet(); if (state === 'end') finishSheetAgain(); }; };
function finishSheetAgain() { openShop(); }

// ================= Skaņa =================
let FXV = 1; try { FXV = +(localStorage.getItem('rpFx') ?? 1); } catch (e) {}
let AC = null, windG = null, engG = null, engO = null;
function audioInit() { if (window.TWRadio) TWRadio.start(); if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); const n = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = AC.createBufferSource(); src.buffer = n; src.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = .7; windG = AC.createGain(); windG.gain.value = 0; src.connect(f); f.connect(windG); windG.connect(AC.destination); src.start(); windG.f = f;
    engO = AC.createOscillator(); engO.type = 'sawtooth'; engO.frequency.value = 90; engG = AC.createGain(); engG.gain.value = 0; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; engO.connect(lp); lp.connect(engG); engG.connect(AC.destination); engO.start(); } catch (e) {} }
function wind(sp) { if (!windG) return; windG.gain.setTargetAtTime(Math.min(.18, sp * .004) * FXV, AC.currentTime, .15); windG.f.frequency.setTargetAtTime(300 + sp * 18, AC.currentTime, .2); }
function engine(on) { if (!engG) return; engG.gain.setTargetAtTime(on ? .07 * FXV : 0, AC.currentTime, .05); if (on) engO.frequency.setTargetAtTime(110 + Math.random() * 30, AC.currentTime, .05); }
function tone(f0, f1, d, type = 'sine', vol = .12, delay = 0) { if (!AC) return; const t0 = AC.currentTime + delay, o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + d);
  gn.gain.setValueAtTime(Math.max(.0011, vol * FXV), t0); gn.gain.exponentialRampToValueAtTime(.001, t0 + d); o.connect(gn); gn.connect(AC.destination); o.start(t0); o.stop(t0 + d + .05); }
function noise(d, vol, f0, delay = 0) { if (!AC) return; const t0 = AC.currentTime + delay, n = AC.createBuffer(1, Math.floor(AC.sampleRate * d), AC.sampleRate), x = n.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / x.length) ** 2;
  const s = AC.createBufferSource(); s.buffer = n; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = f0; const g = AC.createGain(); g.gain.value = vol * FXV; s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t0); }
function sfx(k) { if (!AC) return;
  if (k === 'tick') tone(900, 1200, .06, 'sine', .08);
  else if (k === 'bad') tone(300, 200, .28, 'triangle', .1);
  else if (k === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .25, 'triangle', .12, i * .1));
  else if (k === 'coin') { tone(988, 988, .08, 'square', .05); tone(1319, 1319, .2, 'square', .05, .08); }
  else if (k === 'go') { tone(300, 600, .4, 'triangle', .08); }
  else if (k === 'clunk') { tone(160, 70, .18, 'square', .12); noise(.12, .25, 1400); }
  else if (k === 'whoosh') noise(.6, .25, 1800);
  else if (k === 'stall') tone(700, 400, .3, 'square', .05);
  else if (k === 'bump') { tone(120, 60, .15, 'triangle', .2); noise(.15, .2, 500); }
  else if (k === 'crash') { tone(90, 40, .5, 'triangle', .3); noise(.9, .5, 900); noise(.5, .3, 3000, .05); }
  else if (k === 'glass') for (let i = 0; i < 7; i++) tone(2400 + Math.random() * 2400, 1800 + Math.random() * 1200, .12, 'triangle', .05, i * .045 + Math.random() * .03);
  else if (k === 'chute') { noise(.25, .3, 1200); tone(220, 180, .2, 'sine', .08, .05); } }

// ================= Saglabāšana, nauda, medaļas =================
const ONLINE = location.protocol === 'https:'; let UID = null, NAME = '', NICK = '', wallet = 0;
const LKEY = () => 'rpSave' + (UID ? ':' + UID : '');
function persist() { try { localStorage.setItem(LKEY(), JSON.stringify(save)); } catch (e) {} if (UID) firebase.database().ref('rampa/saves/' + UID).set(save).catch(() => {}); }
function walletAdd(m) { wallet = wallet + m; hudKey = ''; hud(); if (UID) TW.wallet.add(UID, m).then(v => { wallet = v; hudKey = ''; hud(); }).catch(() => {}); else try { localStorage.setItem('rpWalletDev', wallet); } catch (e) {} }
function medals() { if (!UID || !window.TWA) return; const S = save.st, b = save.best;
  TWA.sync(UID, { rpFlights: save.flights, rpPlane: b.plane || 0, rpLandP: S.landP, rpScoot: b.scoot || 0, rpLandS: S.landS, rpFlip: S.flips, rpCar: b.car || 0, rpRoof: S.roofs, rpCrash: S.crash, rpLevel: levelOf(save.xp).l })
    .then(n => n.forEach((m, i) => setTimeout(() => toast(`🏅 Jauna medaļa!<br><span style="font-size:28px">${m.i}</span> ${TWA.title ? TWA.title(m) : m.t}`), 3600 * i + 2500))).catch(() => {}); }
function fixSave() { const d = { plane: 0, scoot: 0, car: 0 }; save.best = Object.assign(d, save.best || {}); save.st = Object.assign({ landP: 0, landS: 0, landC: 0, crash: 0, flips: 0, roofs: 0 }, save.st || {});
  save.own = save.own || {}; if (!save.own.plane) save.own.plane = { wheel: 0, wing: 0, eng: 0, long: 0 }; if (!VEH[save.veh] || !save.own[save.veh]) save.veh = 'plane'; save.ramp = clamp(save.ramp || 0, 0, RAMPS.length - 1); }
function start() { fixSave(); initStreaks(); buildCity(); buildRamp(RAMPS[save.ramp].h); resize(); openShop(); hud(); requestAnimationFrame(frame);
  if (!save.flights) setTimeout(() => banner('Uzlabo braucamrīku un spied 🚀 Aiziet!', 4), 600); }
if (!ONLINE) { try { const s = JSON.parse(localStorage.getItem('rpSave')); if (s) save = Object.assign(save, s); wallet = +(localStorage.getItem('rpWalletDev') || 0); } catch (e) {} }
if (ONLINE && window.firebase && window.TW_FIREBASE) {
  firebase.auth().onAuthStateChanged(async u => {
    if (!u) { location.href = '../index.html'; return; }
    UID = u.uid; NAME = u.email.split('@')[0]; const db = firebase.database();
    try { const v = (await db.ref('users/' + UID).get()).val() || {}; if (v.name) NAME = v.name; NICK = v.nick || ''; if (v.look) LOOK = Object.assign(LOOK, v.look); } catch (e) {}
    try { const s = (await db.ref('rampa/saves/' + UID).get()).val(); if (s) save = Object.assign(save, s); else { const l = JSON.parse(localStorage.getItem(LKEY())); if (l) save = Object.assign(save, l); } } catch (e) {}
    TW.wallet.watch(UID, v => { if (v != null) { wallet = v; hudKey = ''; hud(); } });
    if (window.TW) await TW.ready;
    // spēle vēl nav atvērta visiem – pagaidām tikai admini/moderatori var testēt
    if (window.TW && !TW.isStaff(UID)) { fixSave(); initStreaks(); buildCity(); buildRamp(RAMPS[0].h); resize(); state = 'shop'; setVehicle(); requestAnimationFrame(frame);
      sheet(`<h2>🛫 Mega rampa</h2><p>Drīzumā! Spēle vēl top. 🔒</p><a class="main" style="display:block;text-align:center;text-decoration:none" href="../index.html">← Uz sākumlapu</a>`); return; }
    if (window.TW) TW.heartbeat(UID, () => ({ game: 'Mega rampa', where: state === 'run' || state === 'ready' ? `Lido ${VEH[save.veh].i} ${Math.round(sim ? sim.maxZ : 0)} m` : `Darbnīcā (līm. ${levelOf(save.xp).l})`, name: NAME, nick: NICK }));
    db.ref('kicks/' + UID).on('value', s => { const k = s.val(); if (k && k.until > TW.now()) { alert('Tevi uz laiku izmeta no spēles. Spēlē draudzīgi! 🙂'); location.href = '../index.html'; } }, () => {});
    if (window.TWA && TWA.load) TWA.load(UID).catch(() => {});
    start();
  });
} else start();
