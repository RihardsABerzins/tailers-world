// Mega rampa – 3D skats no aizmugures: darbnīca → slīdi lejā pa milzu rampu → atlec, lido/planē pāri pilsētai → nosēšanās vai avārija
// → attālums = nauda (kopīgais maciņš TW.wallet) + XP → uzlabojumi → atkal. Fizika – physics.js (RP), zīmēšana – three.js r128.
// Teksti latviski. Dati Firebase: rampa/saves/{uid}; medaļas – grupa 'rampa'; tēls – users/{uid}/look.
'use strict';
const $ = id => document.getElementById(id);
const T3 = THREE, { VEH, RAMPS, Sim, stats, rampProfile, rampAt, surfAt, roofH, inside, indexWorld, DT, D2R, clamp, wrap } = RP;
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
      if (Math.abs(cx) <= 140 && L.z1 - L.z0 >= 18 && R() < .2) { const w = Math.min(h * .55, (L.z1 - L.z0) * tan26); if (h - w >= 4) L.w = w; }
      L.roof = R(); lots.push(L); obs.push(L);
    }
  }
  const landing = { z0: 3, z1: 3 + 15 / Math.tan(28 * D2R), h: 15, landing: true };
  return { lots, parks, world: indexWorld({ obs, landing }) };
}
const CITY = genCity(), WORLD = CITY.world;

// ================= three.js aina =================
const renderer = new T3.WebGLRenderer({ canvas: $('cv'), antialias: (devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(matchMedia('(pointer:coarse)').matches ? 1.5 : 2, devicePixelRatio || 1)); renderer.outputEncoding = T3.sRGBEncoding;
const scene = new T3.Scene(); scene.background = new T3.Color(0x9fd3ff); scene.fog = new T3.Fog(0xbfe3ff, 240, 1250);
const camera = new T3.PerspectiveCamera(62, 1, .3, 1350);
const hemi = new T3.HemisphereLight(0xeaf6ff, 0x6a7d5a, .95); scene.add(hemi); const sun = new T3.DirectionalLight(0xfff4e0, .75); sun.position.set(-.6, 1, -.4); scene.add(sun);
const tex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); if (rep) { t.wrapS = t.wrapT = T3.RepeatWrapping; } t.anisotropy = 4; return t; };
const MATS = {}; const mat = (c, o) => { const k = c + JSON.stringify(o || {}); return MATS[k] || (MATS[k] = new T3.MeshLambertMaterial(Object.assign({ color: c }, o || {}))); };
const m4 = new T3.Matrix4(), q0 = new T3.Quaternion(), v3 = new T3.Vector3(), col = new T3.Color();

function buildCity() { const n0 = scene.children.length; buildCity0(); chunkCity(scene.children.slice(n0)); }
function buildCity0() {
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
  bm.onBeforeCompile = s => { s.uniforms.uNight = UNIGHT; s.vertexShader = 'varying vec3 vWp; varying float vNy;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * instanceMatrix * vec4(position,1.)).xyz; vNy = normal.y;');
    s.fragmentShader = 'uniform float uNight; varying vec3 vWp; varying float vNy;\n' + s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += winLit * uNight * vec3(1., .78, .42);').replace('#include <color_fragment>', `#include <color_fragment>
      float winLit = 0.;
      if (vNy < .5 && vWp.y > 1.2) { vec2 c = vec2(fract((vWp.x + vWp.z) / 3.6), fract(vWp.y / 3.3)); float w = step(.2, c.x) * step(c.x, .8) * step(.28, c.y) * step(c.y, .86);
        float rn = fract(sin(dot(floor(vec2(vWp.x + vWp.z, vWp.y) / vec2(3.6, 3.3)), vec2(12.9, 78.2))) * 437.5);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.42, .55, .68) + .12 * rn, w * .9); winLit = w * step(.5, rn) * (.6 + .4 * rn); }
      if (vNy > .5) diffuseColor.rgb *= .78; else diffuseColor.rgb *= mix(.62, 1., smoothstep(0., 7., vWp.y));`); };
  const box = new T3.BoxGeometry(1, 1, 1).translate(0, .5, .5);
  const L = CITY.lots, bI = new T3.InstancedMesh(box, bm, L.length);
  L.forEach((b, i) => { bI.setMatrixAt(i, m4.compose(v3.set((b.x0 + b.x1) / 2, 0, b.z0), q0, new T3.Vector3(b.x1 - b.x0, b.h - (b.w || 0), b.z1 - b.z0))); bI.setColorAt(i, col.set(b.col)); });
  scene.add(bI);
  // jumta mala (dzega) un jumta detaļas – kondicionieri, ūdens tvertnes, izejas būdiņas
  const flat = L.filter(b => !b.w), cI = new T3.InstancedMesh(new T3.BoxGeometry(1, 1, 1).translate(0, .5, .5), mat(0xf4f1ea), flat.length);
  flat.forEach((b, i) => cI.setMatrixAt(i, m4.compose(v3.set((b.x0 + b.x1) / 2, b.h - .15, b.z0 - .35), q0, new T3.Vector3(b.x1 - b.x0 + .7, .55, b.z1 - b.z0 + .7)))); scene.add(cI);
  const RR = mulberry(31), ac = [], tank = [];
  flat.forEach(b => { if (b.roof < .55) for (let n = 0; n < 1 + Math.floor(RR() * 3); n++) ac.push([b.x0 + 2 + RR() * (b.x1 - b.x0 - 4), b.h, b.z0 + 2 + RR() * (b.z1 - b.z0 - 4), 1 + RR() * 2.2, .8 + RR() * 1.6]);
    else if (b.roof < .75 && b.h > 14) tank.push([b.x0 + 3 + RR() * (b.x1 - b.x0 - 6), b.h, b.z0 + 3 + RR() * (b.z1 - b.z0 - 6), 1.4 + RR()]); });
  const aI = new T3.InstancedMesh(new T3.BoxGeometry(1, 1, 1).translate(0, .5, 0), mat(0xb7bcc4), ac.length);
  ac.forEach(([x, y, z, s, h], i) => aI.setMatrixAt(i, m4.compose(v3.set(x, y, z), q0, new T3.Vector3(s, h, s * .8)))); scene.add(aI);
  const tI = new T3.InstancedMesh(new T3.CylinderGeometry(1, 1, 2.2, 12).translate(0, 2.6, 0), mat(0x8d6e63), tank.length), tL = new T3.InstancedMesh(new T3.CylinderGeometry(.08, .08, 1.6, 4).translate(0, .8, 0), mat(0x555a63), tank.length * 3);
  const tC = new T3.InstancedMesh(new T3.ConeGeometry(1.1, .8, 12).translate(0, 4.1, 0), mat(0x6d4c41), tank.length);
  tank.forEach(([x, y, z, s], i) => { m4.compose(v3.set(x, y, z), q0, new T3.Vector3(s, 1, s)); tI.setMatrixAt(i, m4); tC.setMatrixAt(i, m4); for (let k = 0; k < 3; k++) tL.setMatrixAt(i * 3 + k, m4.compose(v3.set(x + Math.cos(k * 2.1) * s * .7, y, z + Math.sin(k * 2.1) * s * .7), q0, new T3.Vector3(1, 1, 1))); });
  scene.add(tI); scene.add(tC); scene.add(tL);
  // slīpie jumti (nolaišanās rampas uz jumtiem) un lielā nolaišanās rampa
  const wedge = wedgeGeo(), wl = L.filter(b => b.w), wI = new T3.InstancedMesh(wedge, new T3.MeshLambertMaterial({ map: rampTex() }), wl.length + 1);
  wl.forEach((b, i) => wI.setMatrixAt(i, m4.compose(v3.set((b.x0 + b.x1) / 2, b.h - b.w, b.z0), q0, new T3.Vector3(b.x1 - b.x0, b.w, b.z1 - b.z0))));
  const LR = WORLD.landing; wI.setMatrixAt(wl.length, m4.compose(v3.set(0, 0, LR.z0), q0, new T3.Vector3(22, LR.h, LR.z1 - LR.z0))); scene.add(wI);
  // parki: zāliens, dzīvžogs, celiņi krustā, soliņi, dīķi; koki – Kenney CC0 modeļi (ja ielādēti)
  const P = CITY.parks, pI = new T3.InstancedMesh(new T3.BoxGeometry(1, .3, 1), mat(0x7cbf5a), P.length); const trees = [], R = mulberry(77), paths = [], hedges = [], benches = [], ponds = [];
  P.forEach((p, i) => { const cx = (p.x0 + p.x1) / 2, cz = (p.z0 + p.z1) / 2, w = p.x1 - p.x0, d = p.z1 - p.z0;
    pI.setMatrixAt(i, m4.compose(v3.set(cx, .15, cz), q0, new T3.Vector3(w, 1, d)));
    paths.push([cx, cz, 3, d - 2], [cx, cz, w - 2, 3]);
    hedges.push([cx, p.z0 + .6, w, 1.2], [cx, p.z1 - .6, w, 1.2], [p.x0 + .6, cz, 1.2, d], [p.x1 - .6, cz, 1.2, d]);
    benches.push([cx + 3, cz + 6, 0], [cx - 3, cz - 6, Math.PI], [cx + 6, cz - 3, Math.PI / 2]);
    const pond = R() < .35; if (pond) ponds.push([cx + w * .22, cz + d * .22, 5 + R() * 3]);
    for (let n = 0; n < 10; n++) { const x = p.x0 + 4 + R() * (w - 8), z = p.z0 + 4 + R() * (d - 8); if (Math.abs(x - cx) < 3 || Math.abs(z - cz) < 3) continue; if (pond && Math.hypot(x - cx - w * .22, z - cz - d * .22) < 9) continue; trees.push([x, z, 5 + R() * 4, R()]); } });
  scene.add(pI);
  const flatI = (list, geo, c, y) => { const m = new T3.InstancedMesh(geo, mat(c), list.length); list.forEach(([x, z, sx, sz], i) => m.setMatrixAt(i, m4.compose(v3.set(x, y, z), q0, new T3.Vector3(sx, 1, sz)))); scene.add(m); };
  flatI(paths, new T3.BoxGeometry(1, .06, 1), 0xe6d8b8, .32); flatI(hedges, new T3.BoxGeometry(1, 1.1, 1).translate(0, .55, 0), 0x3f8a3a, .3);
  { const pm = new T3.InstancedMesh(new T3.CylinderGeometry(1, 1, .1, 18), mat(0x4aa3df), ponds.length); ponds.forEach(([x, z, r], i) => pm.setMatrixAt(i, m4.compose(v3.set(x, .34, z), q0, new T3.Vector3(r, 1, r)))); scene.add(pm);
    const bg = new T3.BoxGeometry(1.8, .12, .5).translate(0, .5, 0), bI2 = new T3.InstancedMesh(bg, mat(0x9b6b3d), benches.length), qq = new T3.Quaternion(), up = new T3.Vector3(0, 1, 0);
    benches.forEach(([x, z, r], i) => bI2.setMatrixAt(i, m4.compose(v3.set(x, .3, z), qq.setFromAxisAngle(up, r), new T3.Vector3(1, 1, 1)))); scene.add(bI2); }
  // ielu koki gar ietvēm (dažos kvartālos)
  const RT = mulberry(41); CITY.lots.forEach(b => { if (RT() < .12 && Math.abs(b.x0) < 400) trees.push([b.x0 - 1.2, b.z0 + RT() * (b.z1 - b.z0), 4 + RT() * 2, RT()]); });
  if (TREES.length) { const qq = new T3.Quaternion(), up = new T3.Vector3(0, 1, 0), groups = TREES.map(() => []); trees.forEach((t, i) => groups[Math.floor(t[3] * TREES.length) % TREES.length].push(t));
    TREES.forEach((parts, k) => parts.forEach(pt => { const im = new T3.InstancedMesh(pt.geo, pt.mat, groups[k].length); groups[k].forEach(([x, z, h], i) => im.setMatrixAt(i, m4.compose(v3.set(x, .3, z), qq.setFromAxisAngle(up, (x * 7 + z * 13) % 6.28), new T3.Vector3(h, h, h)))); scene.add(im); })); }
  else { const tr = new T3.InstancedMesh(new T3.CylinderGeometry(.3, .4, 3, 5).translate(0, 1.5, 0), mat(0x6b4a2e), trees.length), cr = new T3.InstancedMesh(new T3.IcosahedronGeometry(1, 0), mat(0xffffff), trees.length);
    trees.forEach(([x, z, h, t], i) => { const r = h * .45; tr.setMatrixAt(i, m4.compose(v3.set(x, 0, z), q0, new T3.Vector3(1, 1, 1))); cr.setMatrixAt(i, m4.compose(v3.set(x, 3 + r * .8, z), q0, new T3.Vector3(r, r * 1.2, r))); cr.setColorAt(i, col.set(t < .5 ? 0x4a9a3c : 0x5d8f2f)); });
    scene.add(tr); scene.add(cr); }
  // cilvēki: ietvēs, parkos un skatītāji pie nolaišanās rampas (vienkārši low-poly – instancēti, 4 krāsu slāņi)
  { const people = [], RP2 = mulberry(99);
    CITY.lots.forEach(b => { if (Math.abs(b.x0) < 300 && RP2() < .35) people.push([b.x0 - .8, b.z0 + RP2() * (b.z1 - b.z0), RP2() * 6.28]); });
    P.forEach(p => { if (Math.abs(p.x0) < 400) for (let n = 0; n < 4; n++) people.push([(p.x0 + p.x1) / 2 + (RP2() - .5) * 2, p.z0 + 4 + RP2() * (p.z1 - p.z0 - 8), RP2() * 6.28]); });
    for (let n = 0; n < 46; n++) { const sx = n % 2 ? 1 : -1; people.push([sx * (15 + RP2() * 9), -10 + RP2() * 70, sx > 0 ? -Math.PI / 2 : Math.PI / 2]); }
    const SK = [0xf2c9a0, 0xe0ac80, 0xc68642, 0x8d5524, 0xffdbac], SH = [0xe53935, 0x1e88e5, 0x43a047, 0xfdd835, 0xec407a, 0xfb8c00, 0x8e24aa, 0x26c6da, 0xffffff], PA = [0x2b3a67, 0x37474f, 0x5d4037, 0x212121, 0x1565c0];
    const Cy = (r, h, y, x) => new T3.CylinderGeometry(r, r * .9, h, 6).translate(x || 0, y, 0);
    const layers = [[mergeGeos([new T3.SphereGeometry(.17, 7, 5).translate(0, 1.5, 0)]), SK], [mergeGeos([Cy(.2, .55, 1.08), Cy(.06, .5, 1.05, -.27), Cy(.06, .5, 1.05, .27)]), SH], [mergeGeos([Cy(.08, .78, .4, -.1), Cy(.08, .78, .4, .1)]), PA]];
    const qq = new T3.Quaternion(), up = new T3.Vector3(0, 1, 0);
    layers.forEach(([g, pal], L) => { const im = new T3.InstancedMesh(g, mat(0xffffff), people.length); people.forEach(([x, z, r], i) => { const s = .9 + (i * 37 % 10) / 40; im.setMatrixAt(i, m4.compose(v3.set(x, 0, z), qq.setFromAxisAngle(up, r), new T3.Vector3(s, s, s))); im.setColorAt(i, col.set(pal[(i * (7 + L * 3)) % pal.length])); }); scene.add(im); }); }
  // ielu lampas (naktī spīd)
  { const lamps = []; for (let z = -400; z < CITY_Z; z += 35) for (let j = -4; j <= 4; j++) lamps.push([j * BLK + BLK / 2 - 5.5, z]);
    const pole = new T3.InstancedMesh(new T3.CylinderGeometry(.09, .12, 6, 5).translate(0, 3, 0), mat(0x5a6170), lamps.length), head = new T3.InstancedMesh(new T3.SphereGeometry(.38, 8, 6).translate(0, 6.1, 0), LAMPM, lamps.length);
    lamps.forEach(([x, z], i) => { m4.compose(v3.set(x, 0, z), q0, new T3.Vector3(1, 1, 1)); pole.setMatrixAt(i, m4); head.setMatrixAt(i, m4); }); scene.add(pole); scene.add(head); }
  // mašīnas ielās
  const RC = mulberry(5), cars = []; for (let i = 0; i < 220; i++) { const along = RC() < .5, lane = RC() < .5 ? -3.5 : 3.5; let x, z, ry;
    if (along) { x = (Math.floor(RC() * 8) - 4) * BLK + BLK / 2 + lane; z = -300 + RC() * 2600; ry = 0; } else { x = (RC() - .5) * 560; z = Math.floor(RC() * 36) * BLK + lane; ry = Math.PI / 2; }
    cars.push([x, z, ry, pick([0xe53935, 0x1e88e5, 0xfdd835, 0xffffff, 0x37474f, 0x43a047, 0xfb8c00])]); }
  // stāvošās mašīnas – tas pats Blendera modelis, kas spēlētāja mašīnai (instancēts)
  const gB = geoOf('CBody', 'paint') || new T3.BoxGeometry(1.8, .9, 4.2).translate(0, .75, 0), gC = geoOf('CCabin', 'glass') || new T3.BoxGeometry(1.6, .6, 2.2).translate(0, 1.5, -.2), gD = geoOf('CBody', 'dark');
  const cb = new T3.InstancedMesh(gB, mat(0xffffff), cars.length), cc = new T3.InstancedMesh(gC, mat(0x3a4a5c), cars.length), cd = gD && new T3.InstancedMesh(gD, mat(0x222222), cars.length);
  const cw = new T3.InstancedMesh(new T3.CylinderGeometry(.36, .36, .3, 6).rotateZ(Math.PI / 2).translate(0, .36, 0), mat(0x1d1d1d), cars.length * 4);
  const qy = new T3.Quaternion(), wv = new T3.Vector3(); cars.forEach(([x, z, ry, c], i) => { qy.setFromAxisAngle(new T3.Vector3(0, 1, 0), ry); m4.compose(v3.set(x, 0, z), qy, new T3.Vector3(1, 1, 1)); cb.setMatrixAt(i, m4); cc.setMatrixAt(i, m4); if (cd) cd.setMatrixAt(i, m4); cb.setColorAt(i, col.set(c));
    [[-.86, -1.3], [.86, -1.3], [-.86, 1.3], [.86, 1.3]].forEach(([wx, wz], k) => { wv.set(wx, 0, wz).applyQuaternion(qy); cw.setMatrixAt(i * 4 + k, m4.compose(v3.set(x + wv.x, 0, z + wv.z), qy, new T3.Vector3(1, 1, 1))); }); });
  scene.add(cb); scene.add(cc); scene.add(cw); if (cd) scene.add(cd);
  // mākoņi
  const cl = new T3.InstancedMesh(new T3.IcosahedronGeometry(1, 1), CLOUDM, 70), RM = mulberry(9);
  for (let i = 0; i < 70; i++) { const s = 18 + RM() * 30; cl.setMatrixAt(i, m4.compose(v3.set((RM() - .5) * 1600, 160 + RM() * 160, -300 + RM() * (CITY_Z + 600)), q0, new T3.Vector3(s * 2, s * .55, s * 1.4))); }
  scene.add(cl);
  // attāluma zīmes ik pēc 100 m
  for (let z = 100; z <= CITY_Z; z += 100) { const sp = label(`${z} m`, '#ffffff', '#1b2140cc', 26); sp.position.set(-35, 15, z); sp.scale.set(10, 3.4, 1); scene.add(sp);
    const pole = new T3.Mesh(POLE, mat(0x8a8f99)); pole.position.set(-35, 6.5, z); scene.add(pole); }
}
const POLE = new T3.CylinderGeometry(.15, .15, 13, 5);
// ---- diena un nakts (kā citās spēlēs: 6 min diennakts, sākas 10:00; naktī 21–6) ----
const DAYLEN = 360; let DAYT = 0; const DAY0 = 10 / 24 * DAYLEN;
const hourNow = () => ((DAYT + DAY0) % DAYLEN) / DAYLEN * 24, isNight = () => { const h = hourNow(); return h >= 21 || h < 6; };
function dayLight() { const h = hourNow(); if (h >= 7 && h < 19) return 1; if (h >= 21 || h < 5) return 0; return h < 12 ? (h - 5) / 2 : 1 - (h - 19) / 2; }
const UNIGHT = { value: 0 }, CLOUDM = new T3.MeshLambertMaterial({ color: 0xffffff, emissive: 0x9aa7b5 }), SKY = [new T3.Color(0x0b1430), new T3.Color(0x9fd3ff), new T3.Color(0xff9a6a)], FOGC = [new T3.Color(0x1a2440), new T3.Color(0xbfe3ff)];
const STARS = (() => { const n = 700, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, t = Math.random() * 6.28, r = Math.sqrt(1 - u * u); a[i * 3] = r * Math.cos(t) * 1200; a[i * 3 + 1] = Math.abs(u) * 1200 + 60; a[i * 3 + 2] = r * Math.sin(t) * 1200; }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(a, 3)); const s = new T3.Points(g, new T3.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); s.frustumCulled = false; scene.add(s); return s; })();
let dayKey = -1;
function applyDay() { const d = dayLight(), k = Math.round(d * 60) + (isNight() ? 1000 : 0); if (k === dayKey) return; dayKey = k;
  const dusk = d > 0 && d < 1 ? 1 - Math.abs(d - .5) * 2 : 0;
  scene.background.copy(SKY[0]).lerp(SKY[1], d).lerp(SKY[2], dusk * .5); scene.fog.color.copy(FOGC[0]).lerp(FOGC[1], d).lerp(SKY[2], dusk * .35);
  hemi.intensity = .3 + .65 * d; sun.intensity = .1 + .65 * d; sun.color.setHex(dusk > .3 ? 0xffb27a : 0xfff4e0);
  UNIGHT.value = 1 - d; CLOUDM.emissive.setHex(d > .5 ? 0x9aa7b5 : 0x2a3348); LAMPM.color.setHex(d < .5 ? 0xffd27a : 0xd8dde6); STARS.material.opacity = Math.max(0, 1 - d * 2.5); hudKey = ''; }
const TREES = [], LAMPM = new T3.MeshBasicMaterial({ color: 0xd8dde6 });
function mergeGeos(list) { const pos = [], nor = []; list.forEach(g => { g = g.index ? g.toNonIndexed() : g; pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); });
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); return g; }
// pilsētas instancētos objektus sadala 350 m gabalos pa z un zīmē tikai tuvos gabalus (telefonā mazāk trijstūru → neraustās)
const CHUNKS = [], CH = 350;
function chunkCity(list) { for (const m of list) { if (!m.isInstancedMesh) continue; const groups = new Map(), mt = new T3.Matrix4(), c = new T3.Color();
  for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, mt); const k = Math.floor(mt.elements[14] / CH); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i); }
  if (groups.size < 2) continue; scene.remove(m);
  groups.forEach((ids, k) => { const s = new T3.InstancedMesh(m.geometry, m.material, ids.length); s.frustumCulled = false;
    ids.forEach((i, j) => { m.getMatrixAt(i, mt); s.setMatrixAt(j, mt); if (m.instanceColor) { m.getColorAt(i, c); s.setColorAt(j, c); } });
    scene.add(s); CHUNKS.push({ s, z0: k * CH - 80, z1: (k + 1) * CH + 80 }); }); } }
function cullChunks() { const z = camera.position.z, fz = Math.cos(camera.rotation.y) >= 0 ? 1 : -1; for (const c of CHUNKS) c.s.visible = c.z1 > z - 220 && c.z0 < z + 1300; }
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
  g.fillStyle = '#ffffff88'; for (let y = 0; y < h; y += 64) g.fillRect(w / 2 - 2, y, 4, 36); g.fillStyle = '#ffd34dcc'; g.fillRect(w * .31, 0, 3, h); g.fillRect(w * .69 - 3, 0, 3, h); }, true)); }

// ---- milzu rampa (U formas šķērsgriezums) ----
let RAMP = null, rampGroup = null, GATE = null, gateA = 0, leverK = 0;
function buildRamp(H) {
  if (rampGroup) { scene.remove(rampGroup); rampGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  RAMP = rampProfile(H); rampGroup = new T3.Group(); scene.add(rampGroup);
  const cs = []; const FW = 5, RR = 8; cs.push([-FW - RR - 1.6, RR]); cs.push([-FW - RR, RR]);
  for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 * (1 - i / 8); cs.push([-FW - RR * Math.cos(Math.PI / 2 - a) + 0 * a, RR - RR * Math.sin(Math.PI / 2 - a)]); }
  // pārrēķina: ceturtdaļaplis no sienas augšas līdz grīdai
  cs.length = 0; cs.push([-FW - RR - 1.6, RR]); for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI / 2; cs.push([-FW - RR * Math.cos(a), RR - RR * Math.sin(a)]); }
  const half = cs.slice(), full = half.concat(half.slice().reverse().map(([x, y]) => [-x, y]));
  const pts = RAMP.pts.filter((p, i) => i % 3 === 0 || i === RAMP.pts.length - 1), pos = [], uv = [], idx = [], n = full.length;
  let ux = [0]; for (let j = 1; j < n; j++) ux.push(ux[j - 1] + Math.hypot(full[j][0] - full[j - 1][0], full[j][1] - full[j - 1][1]));
  const um = ux[n - 1] / 2; pts.forEach(p => full.forEach(([x, y], j) => { pos.push(x, p.y + y, p.z); uv.push((ux[j] - um) / 28 + .5, p.s / 12); }));
  for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < n - 1; j++) { const a = i * n + j, b = a + 1, c = a + n, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const rt = rampTex(); const rm = new T3.MeshLambertMaterial({ map: rt, side: T3.DoubleSide }); rampGroup.add(new T3.Mesh(g, rm));
  // margas pa malām (gludas caurules) + apakšpuse tumšāka
  const rail = pts.filter((p, i) => i % 2 === 0).map(p => new T3.Vector3(0, p.y + RR + 1.05, p.z));
  [-1, 1].forEach(sx => { const c = new T3.CatmullRomCurve3(rail.map(v => new T3.Vector3(sx * (FW + RR + 1.1), v.y, v.z)));
    rampGroup.add(new T3.Mesh(new T3.TubeGeometry(c, Math.min(400, rail.length * 2), .16, 6, false), mat(0xd9dde3)));
    const posts = rail.filter((v, i) => i % 3 === 0), pI = new T3.InstancedMesh(new T3.CylinderGeometry(.07, .07, 1.05, 5).translate(0, -.52, 0), mat(0x9aa0aa), posts.length);
    posts.forEach((v, i) => pI.setMatrixAt(i, m4.compose(v3.set(sx * (FW + RR + 1.1), v.y, v.z), q0, new T3.Vector3(1, 1, 1)))); rampGroup.add(pI); });
  const under = new T3.Mesh(g, new T3.MeshLambertMaterial({ color: 0x6f5a40, side: T3.BackSide })); under.position.y = -.25; rampGroup.add(under);
  rm.side = T3.FrontSide;
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
// ---- Blendera modeļi (models.glb; avots models_src.blend): katrs objekts – atsevišķa daļa, materiālu nosaukumi nosaka krāsu ----
const MODELS = {};
function loadModels(cb) {
  const go2 = () => { try { const ld = new T3.GLTFLoader(), get = u => new Promise(r => ld.load(u, g => r(g.scene), undefined, () => r(null)));
    (async () => { const g = await get('models.glb?v=1'); if (g) g.children.forEach(o => { MODELS[o.name] = o; });
      for (const n of ['tree_oak', 'tree_default', 'tree_fat', 'tree_pineRoundA']) { const sc = await get('../atra-palidziba/models/nature/' + n + '.glb'); if (sc) TREES.push(treeParts(sc)); }
      cb(); })(); } catch (e) { cb(); } };
  if (T3.GLTFLoader) return go2();
  const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js'; s.onload = go2; s.onerror = () => cb(); document.head.appendChild(s);
}
const GLASS = {};
// Kenney koks → daļas ar augstumu 1 (mērogo instancēs)
function treeParts(sc) { sc.updateMatrixWorld(true); const box = new T3.Box3().setFromObject(sc), sz = box.getSize(new T3.Vector3()), c = box.getCenter(new T3.Vector3()), out = [];
  sc.traverse(o => { if (!o.isMesh) return; const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); g.translate(-c.x, -box.min.y, -c.z); g.scale(1 / sz.y, 1 / sz.y, 1 / sz.y); out.push({ geo: g, mat: mat(o.material.color.getHex()) }); });
  return out; }
// klons ar Lambert materiāliem; tint – { materiāla_nosaukums: krāsa }
function mdl(name, tint) { const src = MODELS[name]; if (!src) return null; const o = src.clone(true);
  o.traverse(m => { if (!m.isMesh) return; const mm = m.material, nm = mm.name, c = tint && tint[nm] != null ? tint[nm] : mm.color.getHex();
    if (nm === 'glass') m.material = GLASS[c] || (GLASS[c] = new T3.MeshLambertMaterial({ color: c, transparent: true, opacity: .55, depthWrite: false }));
    else m.material = mat(c); });
  return o; }
function geoOf(name, matName) { const src = MODELS[name]; if (!src) return null; let g = null; src.traverse(m => { if (m.isMesh && m.material.name === matName && !g) g = m.geometry.clone().applyMatrix4(new T3.Matrix4().makeTranslation(...src.position.toArray())); }); return g; }
function makePerson(pose) { if (MODELS.Torso) return makePerson2(pose); const c = LOOKC(), g = new T3.Group(), B = (w, h, d) => new T3.BoxGeometry(w, h, d);
  const legs = new T3.Group(); [-.1, .1].forEach(x => { const l = new T3.Mesh(B(.16, .6, .18).translate(0, -.3, 0), mat(c.pants)); l.position.x = x; legs.add(l); }); legs.position.y = .6; g.add(legs);
  const torso = new T3.Mesh(B(.44, .52, .28).translate(0, .26, 0), mat(c.body)); torso.position.y = .6; g.add(torso);
  const arms = []; [-.29, .29].forEach(x => { const a = new T3.Mesh(B(.12, .46, .14).translate(0, -.23, 0), mat(c.body)); a.position.set(x, 1.08, 0); g.add(a); arms.push(a); });
  const head = new T3.Mesh(new T3.SphereGeometry(.17, 12, 9), mat(c.skin)); head.position.y = 1.32; g.add(head);
  const helm = new T3.Mesh(new T3.SphereGeometry(.205, 14, 8, 0, Math.PI * 2, 0, Math.PI * .55), mat(c.helm)); helm.position.y = 1.34; g.add(helm);
  const strip = new T3.Mesh(new T3.BoxGeometry(.06, .05, .42), mat(c.stripe)); strip.position.set(0, 1.53, 0); g.add(strip);
  const visor = new T3.Mesh(new T3.BoxGeometry(.3, .07, .06), mat(0x223047)); visor.position.set(0, 1.36, .17); g.add(visor);
  g.userData = { legs, torso, arms, head };
  setPose(g, pose); return g; }
function makePerson2(pose) { const c = LOOKC(), t = { skin: c.skin, body: c.body, pants: c.pants, helm: c.helm }, g = new T3.Group();
  const legs = new T3.Group(); legs.position.y = .6; g.add(legs); ['LegL', 'LegR'].forEach(n => { const l = mdl(n, t); l.position.y = 0; legs.add(l); });
  const torso = mdl('Torso', t); g.add(torso); const arms = ['ArmL', 'ArmR'].map(n => { const a = mdl(n, t); g.add(a); return a; });
  const head = mdl('Head', t); g.add(head); const helm = mdl('Helmet', t); g.add(helm);
  g.userData = { legs, torso, arms, head }; setPose(g, pose); return g; }
function setPose(p, pose) { const u = p.userData; u.legs.rotation.x = pose === 'sit' ? -Math.PI / 2 : 0; u.legs.position.y = pose === 'sit' ? .62 : .6; u.torso.rotation.x = pose === 'crouch' ? .45 : 0;
  u.arms.forEach(a => { a.rotation.x = pose === 'sit' ? -1.1 : pose === 'crouch' ? -1.2 : pose === 'wave' ? 0 : -.3; a.rotation.z = pose === 'wave' ? (a.position.x > 0 ? -2.6 : .2) : pose === 'chute' ? (a.position.x > 0 ? -2.8 : 2.8) : 0; });
  if (pose === 'crouch') { u.legs.scale.y = .8; } else u.legs.scale.y = 1; }

const WING_C = [0, 0xc9a26b, 0xe0c08a, 0xff6b8a, 0x4fc3f7, 0xffffff];
// ---- braucamrīki no Blendera modeļiem: katra daļa atsevišķi (avārijā lido pati) ----
function buildVehicle2(vid, sel, st) {
  const g = new T3.Group(), parts = [], V = { g, parts, spin: null, flames: [], pilot: null, body: null, len: 4 }; g.rotation.order = 'YXZ';
  const put = (o, x, y, z, kind) => { if (!o) return null; o.position.x += x; o.position.y += y; o.position.z += z; g.add(o); parts.push(o); o.userData.kind = kind || 'p'; return o; };
  const add = (geo, m, x, y, z, kind) => put(new T3.Mesh(geo, m), x, y, z, kind), Cyl = (r1, r2, h, n) => new T3.CylinderGeometry(r1, r2, h, n || 16);
  if (vid === 'plane') {
    // šasija: 0 – kartupelis, tad kartona kaste, saplākšņa, alumīnija, sacīkšu, reaktīvā (aug līdz ar līmeni)
    const bL = sel.body || 0, bT = bL ? VEH.plane.slots.body.lv[bL].tier : -1, s = .74 + bL * .012, hb = (sel.wheel ? .84 : .53) * (.6 + .4 * s);
    const af = new T3.Group(); af.position.set(0, hb, 0); af.scale.setScalar(s); g.add(af);
    const putA = (o, kind) => { if (!o) return null; af.add(o); parts.push(o); o.userData.kind = kind || 'p'; return o; };
    const CARD = 0xc9a26b, pc = [0xe0c08a, 0xb8c0cc, 0xe8483e, 0x3d5afe][Math.max(0, bT - 1)] || 0xe8483e;
    if (bT < 0) { // kartupelis ar acīm
      const pg = new T3.SphereGeometry(1, 20, 14), pp = pg.attributes.position; for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), k = 1 + .09 * Math.sin(x * 5 + z * 3) * Math.cos(y * 4 - z * 2) + .05 * Math.sin(z * 9); pp.setXYZ(i, x * k * .55, y * k * .48, z * k * 1.15); }
      pg.computeVertexNormals(); V.body = putA(new T3.Mesh(pg, mat(0xb5884e)), 'body');
      [-.2, .2].forEach(x => { const e = putA(new T3.Mesh(new T3.SphereGeometry(.11, 10, 8), mat(0xffffff))); e.position.set(x, .18, 1.02); const pu = new T3.Mesh(new T3.SphereGeometry(.055, 8, 6), mat(0x111111)); pu.position.set(0, 0, .08); e.add(pu); });
      for (let i = 0; i < 6; i++) { const d = putA(new T3.Mesh(new T3.SphereGeometry(.05, 6, 4), mat(0x7a5530))); d.position.set(Math.sin(i * 2.3) * .5, Math.cos(i * 1.7) * .4, -.8 + i * .3); }
    } else if (bT === 0) { // kartona kaste ar līmlenti
      V.body = putA(new T3.Mesh(new T3.BoxGeometry(1.05, .95, 3.4), mat(CARD)), 'body'); const tp = putA(new T3.Mesh(new T3.BoxGeometry(.28, .97, 3.42), mat(0xe8d9a8))); tp.position.y = .005;
      [-1, 1].forEach(sx => { const fl = putA(new T3.Mesh(new T3.BoxGeometry(.5, .03, 1.2), mat(0xb8915c))); fl.position.set(sx * .5, .55, -.6); fl.rotation.z = sx * .5; });
    } else { V.body = putA(mdl('Body', { paint: pc }), 'body'); if (bT >= 3) putA(mdl('Nose')); if (bT >= 2) putA(mdl('Canopy')); else putA(mdl('Nose', { white: CARD })); }
    // izmēri šasijas telpā: priekšgals, aizmugure, augša, apakša – lai propelleris, aste un pilots ir piestiprināti
    const D = bT < 0 ? { f: 1.12, b: -1.05, t: .44, u: -.44, fy: -.12 } : bT === 0 ? { f: 1.7, b: -1.7, t: .475, u: -.475, fy: 0 } : { f: 2.32, b: -1.85, t: .55, u: -.5, fy: 0 };
    [putA(mdl('Fin', { paint: bT <= 0 ? CARD : pc })), putA(mdl('HStab', { white: bT <= 0 ? CARD : 0xf5f5f5 }))].forEach(o => { o.position.z += D.b + 1.85; o.position.y += D.fy; });
    if (st.S) { const b = st.span, c = st.chord; ['WingL', 'WingR'].forEach(n => { const w = put(mdl(n, { wing: WING_C[sel.wing ? VEH.plane.slots.wing.lv[sel.wing].tier + 1 : 0] }), 0, hb, 0, 'wing'); w.scale.set(b / 2, Math.min(1.4, c * 1.2), c); }); }
    if (sel.wheel) { const wr = .2 + sel.wheel * .004; [-.55, .55].forEach(x => { const w = put(mdl('Wheel'), x, wr, .45); w.scale.setScalar(wr); add(Cyl(.035, .035, hb - wr - .2, 6), mat(0x9aa0aa), x * .8, wr + (hb - wr - .2) / 2, .45); });
      const tw = put(mdl('Wheel'), 0, .1, D.b * s * .85); tw.scale.setScalar(.1); }
    const e = sel.eng ? [1, 2, 3, 3, 4][VEH.plane.slots.eng.lv[sel.eng].tier] : 0;
    if (e === 1 || e === 2) { const pr = putA(mdl('Prop')); pr.scale.setScalar(e === 1 ? .42 : .95); pr.position.z = D.f + .06; V.spin = pr; if (e === 1) { const ring = putA(new T3.Mesh(new T3.TorusGeometry(.44, .035, 8, 24), mat(0xdddddd))); ring.position.z = D.f + .06; } }
    if (e === 3) { const ry = D.u - .16; putA(new T3.Mesh(Cyl(.2, .2, 1.2).rotateX(Math.PI / 2), mat(0xd23c2c))).position.set(0, ry, -.3); putA(new T3.Mesh(new T3.ConeGeometry(.2, .35, 16).rotateX(Math.PI / 2), mat(0xf5f5f5))).position.set(0, ry, .47); V.flames.push([0, hb + ry * s, -.95 * s, .5]); }
    if (e === 4) { const jy = D.t + .2; putA(new T3.Mesh(Cyl(.3, .22, 1.7).rotateX(Math.PI / 2), mat(0x8c939e))).position.set(0, jy, D.b * .35); putA(new T3.Mesh(new T3.TorusGeometry(.3, .05, 8, 20), mat(0x555a63))).position.set(0, jy, D.b * .35 + .85); V.flames.push([0, hb + jy * s, (D.b * .35 - .9) * s, .7]); }
    const p = makePerson('sit'); p.scale.setScalar(.72); p.position.set(0, bT < 2 ? hb + D.t * s * .92 - .43 : hb - .3 * s, bT < 2 ? -.15 * s : .32 * s); g.add(p); V.pilot = p;
    V.len = 4.7 * s; V.flow = { ax: .55 * s, ay: .55 * s, az: 2.3 * s, cy: hb + .05, cz: 0, blunt: [.65, .85, .45, .3, .22, .15][bT + 1], drag: .5, wing: st.S ? { b: st.span, c: st.chord, y: hb, z: .25 } : null };
  } else if (vid === 'scoot') {
    const wr = .11 + (sel.wheel || 0) * .0018;
    V.body = put(mdl('SDeck'), 0, wr - .11, 0, 'body'); put(mdl('SStem'), 0, wr - .11, 0);
    [-.42, .42].forEach(z => { const w = put(mdl('Wheel'), 0, wr, z); w.scale.setScalar(wr); });
    const aero = sel.aero || 0, p = makePerson(aero ? 'crouch' : 'stand'); p.position.set(0, wr + .08, -.06); g.add(p); V.pilot = p;
    if (sel.eng) { [-.12, .12].forEach(x => add(Cyl(.09, .09, .5), mat(0xd23c2c), x, wr + 1.05 - (aero ? .08 : 0), -.3)); V.flames.push([-.12, wr + .75, -.3, .35, true], [.12, wr + .75, -.3, .35, true]); }
    V.len = 1.4; V.flow = { ax: .35, ay: .8, az: .45, cy: .95, cz: 0, blunt: clamp((st.cda - .1) / .22, 0, 1), drag: clamp(st.cda / .3, .4, 1), wing: null };
  } else {
    const wr = .36 + (sel.wheel || 0) * .008, lift = wr - .36, cc = 0x1e88e5;
    V.body = put(mdl('CBody', { paint: cc }), 0, lift, 0, 'body'); put(mdl('CCabin', { paint: cc }), 0, lift, 0);
    [-1, 1].forEach(sx => [-1.3, 1.3].forEach(z => { const w = put(mdl('Wheel'), sx * .84, wr, z); w.scale.setScalar(wr); }));
    if (sel.aero >= 1) { add(new T3.BoxGeometry(1.75, .06, .38), mat(0x111111), 0, 1.45 + lift, -1.85); [-.6, .6].forEach(x => add(new T3.BoxGeometry(.06, .3, .1), mat(0x111111), x, 1.28 + lift, -1.85)); }
    if (sel.aero >= 15) add(new T3.BoxGeometry(1.86, .12, 4.0), mat(0x111111), 0, .3 + lift, 0);
    if (sel.eng) { [-.5, .5].forEach(x => { add(Cyl(.12, .12, .5).rotateX(Math.PI / 2), mat(0x8c939e), x, .45 + lift, -2.15); V.flames.push([x, .45 + lift, -2.5, .5]); }); }
    const p = makePerson('sit'); p.scale.setScalar(.85); p.position.set(-.38, .22 + lift, .15); g.add(p); V.pilot = p;
    V.len = 4.4; V.flow = { ax: .95, ay: .7, az: 2.1, cy: .85 + lift, cz: 0, blunt: clamp((st.cda - .3) / .5, 0, 1), drag: clamp(st.cda / .8, .4, 1), wing: null };
  }
  V.flameM = V.flames.map(([x, y, z, s, down]) => { const f = new T3.Mesh(new T3.ConeGeometry(.16 * s / .5, 1.2 * s / .5, 12).rotateX(down ? Math.PI : -Math.PI / 2), new T3.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: .9 })); f.position.set(x, down ? y - .35 : y, down ? z : z - .5 * s / .5); f.visible = false; g.add(f); return f; });
  return V;
}

// ================= Gaisa plūsmas līnijas (kā vēja tunelī) =================
// Līnijas aprēķina katrā kadrā no vienkārša plūsmas lauka ap braucamrīku (elipsoīds + spārns + virpuļi + turbulenta vaga).
// Krāsa: gaiši dzeltena – brīva plūsma, balta – gaiss paātrinās (pāri spārnam), oranža/sarkana – sitas pret neveiklu priekšgalu, zilganā – virpuļojoša vaga.
// Pa līnijām skrien „komētas” (tekstūra slīd), ātrumā garākas un ātrākas. Bez spēku bultām.
const STRK = { grp: null, mesh: null, N: 24, K: 26, t: 0, seeds: [] };
function initStreaks() {
  const { N, K } = STRK, nv = N * K * 2, g = new T3.BufferGeometry(), idx = [];
  g.setAttribute('position', new T3.BufferAttribute(new Float32Array(nv * 3), 3)); g.setAttribute('color', new T3.BufferAttribute(new Float32Array(nv * 4), 4)); g.setAttribute('uv', new T3.BufferAttribute(new Float32Array(nv * 2), 2));
  for (let i = 0; i < N; i++) for (let k = 0; k < K - 1; k++) { const a = (i * K + k) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  g.setIndex(idx);
  const dash = tex(128, 16, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.7, 'rgba(255,255,255,.95)'); gr.addColorStop(.78, 'rgba(255,255,255,1)'); gr.addColorStop(.8, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.fillRect(0, 3, w, h - 6); c.globalAlpha = .5; c.fillRect(0, 1, w, 2); c.fillRect(0, h - 3, w, 2); }, true);
  STRK.mat = new T3.MeshBasicMaterial({ map: dash, vertexColors: true, transparent: true, opacity: .9, depthWrite: false, side: T3.DoubleSide, fog: false });
  STRK.mesh = new T3.Mesh(g, STRK.mat); STRK.mesh.frustumCulled = false; STRK.grp = new T3.Group(); STRK.grp.add(STRK.mesh);
}
function streakSeeds(V) { const F = V.flow, R = mulberry(11), S = []; const wx = F.wing ? F.wing.b / 2 + 1.2 : F.ax + 1.6, hy = F.ay + 1.3;
  for (let i = 0; i < STRK.N; i++) { const near = i < STRK.N * .45; S.push({ x: (R() * 2 - 1) * (near ? F.ax + .6 : wx), y: F.cy + (R() * 2 - 1) * (near ? F.ay + .5 : hy), ph: R(), sp: .8 + R() * .5 }); }
  STRK.seeds = S; }
const CF = [new T3.Color(0xffe066), new T3.Color(0xffffff), new T3.Color(0xff7a1a), new T3.Color(0xff2a14), new T3.Color(0x5fe3ff)];
const fu = [0, 0, 0];
function flowAt(F, x, y, z, t, cl, out) {
  const qx = x / F.ax, qy = (y - F.cy) / F.ay, qz = (z - F.cz) / F.az, r2 = Math.max(1, qx * qx + qy * qy + qz * qz), r = Math.sqrt(r2), k = .5 / (r2 * r);
  let ux = 3 * k * qz * qx / r2, uy = 3 * k * qz * qy / r2, uz = -(1 + k) + 3 * k * qz * qz / r2;
  // vaga aiz braucamrīka: lēnāka un virpuļojoša (jo neveiklāks, jo platāka)
  const wk = clamp((-qz - .7) / .8, 0, 1) * Math.exp(-(qx * qx + qy * qy) / (1 + Math.max(0, -qz - 1) * .35)) * F.drag;
  if (wk > .01) { uz *= 1 - .35 * wk; ux += wk * .32 * Math.sin(z * 1.7 + t * 7 + y * 2.3); uy += wk * .32 * Math.cos(z * 1.3 - t * 6 + x * 2.1); }
  let fast = 0;
  if (F.wing && cl) { const W = F.wing, dz = z - W.z, dy = y - W.y, ax = Math.abs(x), m = clamp((W.b / 2 + .3 - ax) / .6, 0, 1);
    if (m > 0) { const ny = Math.exp(-(dy * dy) / (W.c * W.c * .5)); uy += cl * .45 * m * ny * (Math.exp(-(((dz - W.c * .7) / W.c) ** 2)) - (dz < 0 ? .8 * Math.exp(dz / (5 * W.c)) : 0));
      if (Math.abs(dz) < W.c * .8) { fast = m * ny * (dy > 0 ? 1 : .3) * Math.min(1, Math.abs(cl)); uz *= 1 + .35 * fast; } }
    // spārnu galu virpuļi (ārpusē augšup, iekšpusē lejup)
    if (dz < -W.c * .4) for (const s of [-1, 1]) { const dx = x - s * W.b / 2, dyy = y - W.y + dz * .03, rr = dx * dx + dyy * dyy + .04, G2 = s * cl * W.c * .35 * Math.min(1, -dz / 2);
      ux += -G2 * dyy / rr; uy += G2 * dx / rr; } }
  out[0] = ux; out[1] = uy; out[2] = uz; out[3] = Math.hypot(ux, uy, uz); out[4] = wk; out[5] = fast; out[6] = qz > 0 ? clamp(1 - out[3] / .85, 0, 1) * F.blunt * Math.exp(-(qx * qx + qy * qy) * .8) : 0; return out;
}
const tc = new T3.Vector3(), ftmp = [0, 0, 0, 0, 0, 0, 0];
function updateStreaks(V, dt, sp, alpha, cl, on) {
  const geo = STRK.mesh.geometry; if (!on || sp < 3 || !V.flow) { geo.setDrawRange(0, 0); return; }
  if (STRK.vref !== V) { streakSeeds(V); STRK.vref = V; }
  STRK.grp.rotation.x = alpha; STRK.t += dt; STRK.mat.map.offset.x -= dt * Math.min(sp, 40) * .09; STRK.mat.opacity = clamp((sp - 3) / 10, 0, 1);
  const F = V.flow, { N, K } = STRK, pos = geo.attributes.position.array, cc = geo.attributes.color.array, uv = geo.attributes.uv.array, t = STRK.t;
  const zf = F.az + 2.5 + V.len * .25 + Math.min(3, sp * .05), zb = -(F.az + 2.5 + Math.min(5, sp * .1)), h = (zf - zb) / (K - 1);
  STRK.grp.updateMatrixWorld(); tc.copy(camera.position); STRK.grp.worldToLocal(tc);
  const P = [], wd = .055 + Math.min(.06, sp * .0014);
  for (let i = 0; i < N; i++) { const s = STRK.seeds[i]; let x = s.x + Math.sin(t * .6 + s.ph * 9) * .03, y = s.y + Math.cos(t * .5 + s.ph * 7) * .03, z = zf; let L = s.ph * 6;
    for (let k = 0; k < K; k++) { const f = flowAt(F, x, y, z, t, cl, ftmp), b = (i * K + k);
      P[k * 3] = x; P[k * 3 + 1] = y; P[k * 3 + 2] = z;
      // krāsa
      col.copy(CF[0]); if (f[5] > 0) col.lerp(CF[1], Math.min(1, f[5] * 1.2)); if (f[6] > 0) col.lerp(f[6] > .5 ? CF[3] : CF[2], Math.min(1, f[6] * 2.2)); if (f[4] > 0) col.lerp(CF[4], Math.min(1, f[4] * 1.4));
      const fade = Math.sin(Math.PI * k / (K - 1)) ** .7; cc[b * 8] = cc[b * 8 + 4] = col.r; cc[b * 8 + 1] = cc[b * 8 + 5] = col.g; cc[b * 8 + 2] = cc[b * 8 + 6] = col.b; cc[b * 8 + 3] = cc[b * 8 + 7] = fade;
      uv[b * 4] = uv[b * 4 + 2] = L * s.sp / 2.2; uv[b * 4 + 1] = 0; uv[b * 4 + 3] = 1;
      const iz = 1 / Math.max(.35, -f[2]); x += clamp(f[0] * iz, -.7, .7) * h; y += clamp(f[1] * iz, -.7, .7) * h; z -= h; L += h; }
    // lente pret kameru
    for (let k = 0; k < K; k++) { const a = Math.max(0, k - 1), c2 = Math.min(K - 1, k + 1), tx = P[c2 * 3] - P[a * 3], ty = P[c2 * 3 + 1] - P[a * 3 + 1], tz = P[c2 * 3 + 2] - P[a * 3 + 2];
      const vx = tc.x - P[k * 3], vy = tc.y - P[k * 3 + 1], vz = tc.z - P[k * 3 + 2]; let sx = ty * vz - tz * vy, sy = tz * vx - tx * vz, sz = tx * vy - ty * vx; const sl = Math.hypot(sx, sy, sz) || 1, w = wd * (.5 + .5 * Math.sin(Math.PI * k / (K - 1)));
      sx *= w / sl; sy *= w / sl; sz *= w / sl; const b = (i * K + k) * 6;
      pos[b] = P[k * 3] - sx; pos[b + 1] = P[k * 3 + 1] - sy; pos[b + 2] = P[k * 3 + 2] - sz; pos[b + 3] = P[k * 3] + sx; pos[b + 4] = P[k * 3 + 1] + sy; pos[b + 5] = P[k * 3 + 2] + sz; } }
  geo.setDrawRange(0, N * (K - 1) * 6); geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = geo.attributes.uv.needsUpdate = true;
}

// ================= Efekti: dzirksteles, dūmi, putekļi, stikli, dakstiņi =================
const FX = { puffs: [], sparks: [], bits: [], decals: [] };
const PUFF = tex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, '#ffffffff'); r.addColorStop(.6, '#ffffff99'); r.addColorStop(1, '#ffffff00'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const spPool = []; for (let i = 0; i < 70; i++) { const s = new T3.Sprite(new T3.SpriteMaterial({ map: PUFF, transparent: true, depthWrite: false })); s.visible = false; scene.add(s); spPool.push(s); }
const SPK = { n: 260, pos: new Float32Array(260 * 3) }; { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(SPK.pos, 3)); SPK.pts = new T3.Points(g, new T3.PointsMaterial({ color: 0xffc040, size: .32, blending: T3.AdditiveBlending, transparent: true, depthWrite: false })); SPK.pts.frustumCulled = false; scene.add(SPK.pts); }
const BITS = new T3.InstancedMesh(new T3.BoxGeometry(1, 1, 1), new T3.MeshLambertMaterial({ color: 0xffffff }), 220); BITS.count = 0; BITS.frustumCulled = false; scene.add(BITS);
function puff(p, kind, n) { for (let i = 0; i < n; i++) { const s = spPool.find(x => !x.visible); if (!s) return; s.visible = true; s.position.set(p.x + rnd(-1, 1), p.y + rnd(0, 1), p.z + rnd(-1, 1));
  const c = kind === 'smoke' ? [.35, .36, .4] : kind === 'dust' ? [.78, .7, .58] : [.95, .95, .95]; s.material.color.setRGB(...c); s.material.opacity = kind === 'smoke' ? .75 : .8;
  const tr = kind === 'trail'; if (tr) { s.material.color.setRGB(.3, .3, .33); s.material.opacity = .6; }
  FX.puffs.push({ s, v: tr ? new T3.Vector3(rnd(-.3, .3), rnd(.2, .6), rnd(-.3, .3)) : new T3.Vector3(rnd(-2, 2), kind === 'smoke' ? rnd(1.5, 3.5) : rnd(.3, 2.5), rnd(-2, 2)), life: 0, max: tr ? rnd(1.2, 1.8) : kind === 'smoke' ? rnd(2.5, 4) : rnd(1.2, 2.2), s0: tr ? .35 : kind === 'smoke' ? 1.2 : kind === 'white' ? .5 : 1.6, grow: tr ? .9 : kind === 'smoke' ? 2.2 : kind === 'white' ? .8 : 3, op: s.material.opacity }); } }
function sparks(p, n, v) { for (let i = 0; i < n && FX.sparks.length < SPK.n; i++) FX.sparks.push({ p: p.clone(), v: new T3.Vector3(rnd(-6, 6), rnd(2, 10), (v || 0) * rnd(.1, .5) + rnd(-5, 5)), life: rnd(.4, 1) }); }
function bits(p, n, kind, v) { for (let i = 0; i < n && FX.bits.length < 220; i++) { const glass = kind === 'glass', fe = kind === 'feather';
  if (fe) { FX.bits.push({ p: p.clone().add(new T3.Vector3(rnd(-.5, .5), rnd(-.3, .3), rnd(-.5, .5))), v: new T3.Vector3(rnd(-2, 2), rnd(0, 2), rnd(-2, 2)), r: new T3.Euler(rnd(0, 6), rnd(0, 6), 0), rv: rnd(-4, 4), s: new T3.Vector3(.08, .015, .26), c: 0xffffff, life: 0, rest: false, fl: true }); continue; }
  FX.bits.push({ p: p.clone().add(new T3.Vector3(rnd(-1.5, 1.5), rnd(-1, 1), 0)), v: new T3.Vector3(rnd(-5, 5), rnd(1, 7), (v || 0) * rnd(-.2, .25) + rnd(-3, 1)), r: new T3.Euler(rnd(0, 6), rnd(0, 6), 0), rv: rnd(-9, 9),
    s: glass ? new T3.Vector3(rnd(.15, .4), rnd(.15, .4), .03) : new T3.Vector3(.5, .08, .35), c: glass ? 0xbfe6ff : pick([0xa34a2a, 0x8c3b22, 0xb85a35]), life: 0, rest: false }); } }
function decal(b, y, x, z) { // logu caurums uz tās sienas, kurai trāpīja
  let px = x, pz = z, ry = 0; if (z <= b.z0 + .1) { pz = b.z0 - .06; ry = Math.PI; } else if (z >= b.z1 - .1) { pz = b.z1 + .06; } else if (x <= b.x0 + .1) { px = b.x0 - .06; ry = -Math.PI / 2; } else { px = b.x1 + .06; ry = Math.PI / 2; }
  const d = new T3.Mesh(new T3.PlaneGeometry(2.6, 2.2), new T3.MeshBasicMaterial({ color: 0x1d232c })); d.position.set(px, y, pz); d.rotation.y = ry; scene.add(d); FX.decals.push(d);
  const cr = new T3.Mesh(new T3.PlaneGeometry(4.5, .25), new T3.MeshBasicMaterial({ color: 0x2a2a2a })); cr.position.set(px, y + .9, pz); cr.position.x += Math.sin(ry) * .01; cr.rotation.set(0, ry, .5); scene.add(cr); FX.decals.push(cr); }
function clearFX() { FX.puffs.forEach(f => f.s.visible = false); FX.puffs = []; FX.sparks = []; FX.bits = []; BITS.count = 0; FX.decals.forEach(d => scene.remove(d)); FX.decals = []; }
const GR = 9.81, dq = new T3.Quaternion(), de = new T3.Euler();
function floorAt(x, z) { return surfAt(WORLD, x, z).h; }
function updateFX(dt) {
  for (let i = FX.puffs.length - 1; i >= 0; i--) { const f = FX.puffs[i]; f.life += dt; const k = f.life / f.max; if (k >= 1) { f.s.visible = false; FX.puffs.splice(i, 1); continue; }
    f.s.position.addScaledVector(f.v, dt); f.v.multiplyScalar(1 - dt * .8); const sc = f.s0 + f.grow * Math.sqrt(k) * 2; f.s.scale.set(sc, sc, 1); f.s.material.opacity = f.op * (1 - k); }
  let n = 0; for (let i = FX.sparks.length - 1; i >= 0; i--) { const s = FX.sparks[i]; s.life -= dt; if (s.life <= 0) { FX.sparks.splice(i, 1); continue; } s.v.y -= GR * dt; s.p.addScaledVector(s.v, dt); const fl = floorAt(s.p.x, s.p.z); if (s.p.y < fl) { s.p.y = fl; s.v.y *= -.4; s.v.x *= .6; s.v.z *= .6; } }
  FX.sparks.forEach(s => { SPK.pos[n * 3] = s.p.x; SPK.pos[n * 3 + 1] = s.p.y; SPK.pos[n * 3 + 2] = s.p.z; n++; }); SPK.pts.geometry.setDrawRange(0, n); SPK.pts.geometry.attributes.position.needsUpdate = true;
  FX.bits.forEach((b, i) => { if (!b.rest) { if (b.fl) { b.v.multiplyScalar(1 - dt * 2); b.v.y -= GR * .08 * dt; b.r.z = Math.sin(performance.now() / 300 + i) * .6; } else b.v.y -= GR * dt; b.p.addScaledVector(b.v, dt); b.r.x += b.rv * dt; b.r.y += b.rv * .7 * dt; const fl = floorAt(b.p.x, b.p.z) + .03;
      if (b.p.y < fl) { b.p.y = fl; b.v.multiplyScalar(.35); b.v.y = Math.abs(b.v.y) * .3; b.rv *= .5; if (b.v.length() < .4) { b.rest = true; b.r.x = Math.PI / 2; } } }
    BITS.setMatrixAt(i, m4.compose(b.p, dq.setFromEuler(b.r), b.s)); BITS.setColorAt(i, col.set(b.c)); });
  BITS.count = FX.bits.length; BITS.instanceMatrix.needsUpdate = true; if (BITS.instanceColor) BITS.instanceColor.needsUpdate = true;
}

// ---- avārijas daļas ----
let DEB = [];
function crumple(o, k) { o.traverse(m => { if (m.isMesh) crumple1(m, k); }); }
function crumple1(mesh, k) { const g = mesh.geometry.clone(), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i), f = clamp((z + .5) / 2, 0, 1) * k;
  p.setXYZ(i, p.getX(i) * (1 + rnd(-.15, .15) * f), p.getY(i) * (1 - .35 * f) + rnd(-.05, .05) * f, z * (1 - .3 * f)); } g.computeVertexNormals(); mesh.geometry = g; }
function breakApart(V, vel, wall) {
  DEB = []; const parts = V.parts.slice();
  parts.forEach((o, i) => { scene.attach(o); const main = o === V.body, keep = main ? (wall ? -.12 : .55) : (wall ? rnd(-.25, .15) : rnd(.25, .75));
    if (main) crumple(o, wall ? 1 : .6);
    else if (o.userData.kind === 'wing') { o.rotation.z += rnd(-.6, .6); o.rotation.x += rnd(-.4, .4); }
    DEB.push({ o, v: new T3.Vector3(vel.x * keep + rnd(-3, 3) * (main ? .3 : 1), Math.abs(vel.y) * .2 + rnd(main ? 1 : 2, main ? 3 : 8), vel.z * keep), w: new T3.Vector3(rnd(-6, 6), rnd(-6, 6), rnd(-6, 6)).multiplyScalar(main ? .4 : 1), main, r: main ? .5 : .2, rest: 0 }); });
  V.flameM.forEach(f => f.visible = false);
}
function updateDebris(dt) {
  for (const d of DEB) { if (d.rest > 1) continue; d.v.y -= GR * dt; d.o.position.addScaledVector(d.v, dt); d.o.rotation.x += d.w.x * dt; d.o.rotation.y += d.w.y * dt; d.o.rotation.z += d.w.z * dt;
    const op = d.o.position, s = surfAt(WORLD, op.x, op.z), fl = s.h;
    if (s.b && !s.b.landing && op.y < roofH(s.b, op.z) - .5) { const px = op.x - d.v.x * dt, pz = op.z - d.v.z * dt; if (!inside(s.b, px, op.z)) d.v.x *= -.25; if (!inside(s.b, op.x, pz)) d.v.z *= -.25; op.x = px; op.z = pz; continue; }
    if (d.o.position.y < fl + d.r) { d.o.position.y = fl + d.r; const hard = Math.abs(d.v.y) + Math.abs(d.v.z) * .3; if (hard > 6 && FX.sparks.length < 200) sparks(d.o.position, 4, d.v.z);
      d.v.y = Math.abs(d.v.y) * (d.main ? .15 : .3); d.v.x *= .7; d.v.z *= d.main ? .82 : .7; d.w.multiplyScalar(.6); if (d.v.length() < .6) { d.rest += dt * 4; if (d.rest > 1) { d.v.set(0, 0, 0); d.o.rotation.x = Math.round(d.o.rotation.x / Math.PI) * Math.PI * (d.main ? 1 : 0) || d.o.rotation.x; } } } }
}
function disposeDebris() { DEB.forEach(d => { scene.remove(d.o); }); DEB = []; }

// ---- putni (kaijas) – lido bariņos pa ceļam; ja ietriecas, putns apjūk, nobirst spalvas un tas aizlido (nekas ļauns).
// Ja putns trāpa dzinējā – dzinējs apstājas (dūmo), turbo vairs nedarbojas.
const BIRDS = []; let birdsHit = 0;
function makeBird() { const g = new T3.Group(), b = mdl('BBody'), wl = mdl('BWingL'), wr = mdl('BWingR');
  if (b) { b.position.set(0, 0, 0); wl.position.set(-.06, .03, 0); wr.position.set(.06, .03, 0); g.add(b, wl, wr); }
  else { g.add(new T3.Mesh(new T3.SphereGeometry(.15, 8, 6), mat(0xffffff))); }
  g.scale.setScalar(1.7); g.visible = false; scene.add(g); return { g, wl, wr, p: g.position, v: new T3.Vector3(), ph: Math.random() * 6, hit: 0, on: false }; }
function resetBirds() { if (!BIRDS.length) for (let i = 0; i < 15; i++) BIRDS.push(makeBird()); BIRDS.forEach(b => { b.on = false; b.g.visible = false; b.hit = 0; }); birdsHit = 0; }
function spawnFlock(i0) { const hx = Math.sin(sim.psi), hz = Math.cos(sim.psi), d = rnd(140, 380), lat = rnd(-30, 30), y = clamp(sim.y + rnd(-14, 22), 14, 220), dir = rnd(0, Math.PI * 2), sp = rnd(4, 8);
  for (let k = 0; k < 3; k++) { const b = BIRDS[i0 + k]; if (!b) return; b.on = true; b.hit = 0; b.g.visible = true; b.done = false;
    b.p.set(sim.x + hx * d + hz * lat + rnd(-3, 3), y + rnd(-1.5, 1.5), sim.z + hz * d - hx * lat + rnd(-3, 3)); b.v.set(Math.sin(dir) * sp, 0, Math.cos(dir) * sp); b.g.rotation.set(0, dir, 0); } }
function updateBirds(dt) {
  if (!BIRDS.length || !sim) return; const t = performance.now() / 1000, hx = Math.sin(sim.psi), hz = Math.cos(sim.psi), P = VEHM.g.position;
  for (let i = 0; i < BIRDS.length; i += 3) { const b = BIRDS[i]; const rel = b.on ? (b.p.x - P.x) * hx + (b.p.z - P.z) * hz : -1e9;
    if (sim.mode !== 'ramp' && sim.air > 1.2 && (!b.on || rel < -40 || rel > 600)) spawnFlock(i); }
  const span = ST.S ? ST.span / 2 + .3 : VEHM.len < 2 ? .5 : .95, cy = P.y + (VEHM.flow ? VEHM.flow.cy : 1);
  for (const b of BIRDS) { if (!b.on) continue;
    if (b.hit > 0) { b.hit -= dt; b.v.y -= 4 * dt; b.g.rotation.x += dt * 9; b.g.rotation.z += dt * 6; if (b.hit <= 0) { b.v.set(rnd(-6, 6), 7, rnd(-6, 6)); b.g.rotation.set(-.4, Math.atan2(b.v.x, b.v.z), 0); b.done = true; } }
    b.p.addScaledVector(b.v, dt); const f = Math.sin(t * (b.hit > 0 ? 25 : b.done ? 18 : 9) + b.ph) * .7; if (b.wl) { b.wl.rotation.z = -f; b.wr.rotation.z = f; }
    if (b.hit > 0 || b.done || sim.mode === 'ramp') continue;
    const dx = b.p.x - P.x, dy = b.p.y - cy, dz = b.p.z - P.z, fwd = dx * hx + dz * hz, lat = dx * hz - dz * hx;
    if (Math.abs(fwd) < VEHM.len / 2 + .5 && Math.abs(dy) < 1.1 && Math.abs(lat) < span) birdHit(b, fwd > 0 && Math.abs(lat) < .8);
  }
}
function birdHit(b, front) { const engine = front && ST.T && !sim.engDead; sim.birdHit(engine); birdsHit++;
  b.hit = 1.3; b.v.set(Math.sin(sim.psi) * sim.speed * .4, 3, Math.cos(sim.psi) * sim.speed * .4); bits(b.p, 14, 'feather', 0); puff(b.p, 'white', 2); camShake = .4; sfx('bird');
  if (engine) { toast('🐦💥 Putns dzinējā! Dzinējs apstājās'); sfx('sputter'); $('turbo').classList.remove('on'); inp.turbo = false; } else toast('🐦 Bonk! Putns!'); }

// ---- izpletnis ----
let PIL = null; // izšautais pilots { o, v, t, landed }

// ================= Spēles stāvoklis =================
let state = 'boot', sim = null, VEHM = null, ST = null, prev = null, acc = 0, crashT = 0, runT = 0, endInfo = null, inp = { pitch: 0, roll: 0, turbo: false }, lastT = performance.now(), shopT = 0, camShake = 0;
const shadow = new T3.Mesh(new T3.CircleGeometry(1, 20).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .28, depthWrite: false })); scene.add(shadow);
const own = vid => save.own[vid];
// nopirktais līmenis o[k]; lietotais o['u_' + k] (var pārslēgt uz jebkuru jau nopirktu); spārni vienmēr garie
const selOf = vid => { const o = own(vid) || {}, s = { wheel: 0, wing: 0, eng: 0, aero: 0, long: 1 };
  for (const k of Object.keys(VEH[vid].slots)) s[k] = Math.min(o[k] || 0, o['u_' + k] ?? (o[k] || 0)); return s; };
let BEST = null; // rekorda bāka
function placeBest() { if (BEST) { scene.remove(BEST); BEST = null; } const b = save.best[save.veh] || 0; if (b < 20) return; BEST = new T3.Group();
  const beam = new T3.Mesh(new T3.CylinderGeometry(.35, .35, 140, 8, 1, true), new T3.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: .2, depthWrite: false, fog: false })); beam.position.y = 70; BEST.add(beam);
  const l = label(`🏆 ${Math.round(b)} m`, '#2b1a00', '#ffd34d', 26); l.position.y = 42; l.scale.set(7, 2.4, 1); BEST.add(l); BEST.position.set(0, 0, b); scene.add(BEST); }

function setVehicle() {
  if (VEHM) { scene.remove(VEHM.g); }
  disposeDebris(); if (PIL) { scene.remove(PIL.o); PIL = null; }
  const vid = save.veh, sel = selOf(vid); ST = stats(vid, sel); VEHM = buildVehicle2(vid, sel, ST); scene.add(VEHM.g); VEHM.g.add(STRK.grp);
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
  sim = new Sim(ST, RAMP, WORLD); prev = { z: sim.z, y: sim.y, x: 0, phi: sim.phi, psi: 0, bank: 0 }; camPsi = 0; camSnap = true; resetBirds(); ejected = false; runId++; $('eject').classList.remove('on'); acc = 0; runT = 0; crashT = 0; endInfo = null; state = 'ready'; document.body.classList.add('run'); viewOffset();
  gateA = 0; leverK = 0; setLever(0); $('lever').classList.add('on'); $('dist').classList.add('on'); $('dM').textContent = '0 m'; $('dSub').textContent = VEH[save.veh].i + ' ' + VEH[save.veh].n;
}
// svira: velc rokturi lejā līdz galam → barjera atveras un brauciens sākas
function setLever(k) { leverK = k; $('knob').style.transform = `translateY(${k * 128}px)`; $('lever').style.setProperty('--k', k); }
function release() { if (state !== 'ready') return; state = 'run'; setLever(1); $('lever').classList.remove('on'); sfx('clunk'); setTimeout(() => sfx('go'), 150);
  $('turbo').classList.toggle('on', !!ST.T); hints(true); if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(30);
 }
{ const kn = $('knob'); let drag = null;
  kn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); if (state !== 'ready') return; drag = { y: e.clientY, k: leverK }; try { kn.setPointerCapture(e.pointerId); } catch (x) {} sfx('tick'); });
  kn.addEventListener('pointermove', e => { if (!drag || state !== 'ready') return; const k = clamp(drag.k + (e.clientY - drag.y) / 128, 0, 1); setLever(k); if (k > .92) { drag = null; release(); } });
  const up = () => { if (!drag) return; drag = null; if (state === 'ready') { const k0 = leverK, t0 = performance.now(); const back = () => { const f = Math.min(1, (performance.now() - t0) / 200); if (state === 'ready') { setLever(k0 * (1 - f)); if (f < 1) requestAnimationFrame(back); } }; back(); } };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => kn.addEventListener(ev, up)); }
function hints(on) { const fl = !(ST && ST.S); $('padL').innerHTML = fl ? '↺' : '⬆'; $('padR').innerHTML = fl ? '↻' : '⬇'; $('padL').classList.toggle('on', on); $('padR').classList.toggle('on', on); }
function handleEvents() {
  for (const e of sim.ev) { const k = e[0];
    if (k === 'launch') sfx('whoosh');

    else if (k === 'flip') { toast(`🤸 Salto ×${e[1]}!`); sfx('coin'); }
    else if (k === 'bounce') { puff(VEHM.g.position, 'dust', 3); camShake = .3; sfx('bump'); if (e[2]) toast('🏠 Lēciens pa jumtu!'); }
    else if (k === 'touch') { puff(VEHM.g.position, 'dust', 4); sfx('bump'); }
    else if (k === 'bonk') { sfx('bump'); camShake = .3; }
    else if (k === 'crash') startCrash(e[1], e[2]);
    else if (k === 'done') { if (!ejected) finish(e[1] === 'land' ? 'land' : 'stop'); } }
  sim.ev.length = 0;
}
function startCrash(kind, v) {
  state = 'crash'; crashT = 0; camShake = 1; joyReset(); $('eject').classList.remove('on'); $('turbo').classList.remove('on'); hints(false); inp.turbo = false; const p = VEHM.g.position.clone(), vel = new T3.Vector3(Math.sin(sim.psi) * sim.vz, sim.vy, Math.cos(sim.psi) * sim.vz), wall = kind === 'wall', b = wall ? sim.wall : surfAt(WORLD, sim.x, sim.z).b;
  breakApart(VEHM, vel, wall); updateStreaks(VEHM, 0, 0, 0, 0, false);
  sparks(p.clone().add(new T3.Vector3(0, .5, 0)), 60, sim.vz); puff(p, 'dust', 10); puff(p, 'smoke', 4);
  if (b && !b.landing) { const y = wall ? clamp(p.y + 1, 2, b.h - 1) : b.h; if (wall) { bits(new T3.Vector3(p.x, y, p.z), 34, 'glass', -sim.vz); decal(b, y, p.x, p.z); } if (!wall || p.y > b.h - 5) bits(new T3.Vector3(p.x, b.h, p.z + (wall ? 1 : 0)), 26, 'tile', sim.vz); }
  sfx('crash'); if (b && !b.landing) setTimeout(() => sfx('glass'), 120);
  if (!ejected) endInfo = { kind: 'crash', dist: Math.max(0, sim.maxZ) };
}
// 🪂 katapulta: pilots izšaujas kā lode uz priekšu, pēc brīža sāk krist ātrāk un tad atver izpletni; braucamrīks lido tālāk viens
let ejected = false, runId = 0;
function eject() { if (state !== 'run' || ejected || !sim || sim.mode !== 'air') return; ejected = true; joyReset(); inp.turbo = false; $('turbo').classList.remove('on'); $('eject').classList.remove('on'); hints(false);
  const hx = Math.sin(sim.psi), hz = Math.cos(sim.psi), pil = VEHM.pilot; scene.attach(pil); setPose(pil, 'stand'); pil.rotation.set(-1.2, sim.psi, 0);
  PIL = { o: pil, v: new T3.Vector3(hx * (sim.vz + 5), Math.max(sim.vy, 0) + 10, hz * (sim.vz + 5)), t: 0, landed: false, eject: true };
  puff(pil.position, 'white', 3); sparks(pil.position.clone(), 14, sim.vz); sfx('eject'); camShake = .5; if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(40);  }
function updatePilot(dt) { if (!PIL || PIL.landed) return; const P = PIL, o = P.o; P.t += dt;
  // izšautais pilots lido kā lode un krīt; pieskaroties zemei/jumtam – lidojums beidzas
  P.v.y -= GR * 1.35 * dt; o.rotation.order = 'YXZ'; o.rotation.set(Math.atan2(Math.hypot(P.v.x, P.v.z), P.v.y), Math.atan2(P.v.x, P.v.z), 0);
  o.position.addScaledVector(P.v, dt); const fl = floorAt(o.position.x, o.position.z);
  if (o.position.y <= fl) { o.position.y = fl; P.landed = true; o.rotation.set(0, Math.PI, 0); setPose(o, 'wave'); puff(o.position, 'dust', 4); sfx('bump'); camShake = .4; } }
function finish(kind) {
  if (state === 'end') return;
  const landed = kind === 'land', ej = ejected, dist = Math.max(0, Math.round(ej && PIL ? PIL.o.position.z : endInfo ? endInfo.dist : sim.maxZ)), vid = save.veh, old = save.best[vid] || 0, rec = dist > old && dist >= 5;
  const parts = [['🎢 Par lēcienu', '€5'], ['📏 Attālums', '€' + Math.round(dist / 5)]]; let money = 5 + Math.round(dist / 5);
  if (landed) { const b = Math.round(dist / 20) + 3; money += b; parts.push(['🛬 Nolaidies', '+€' + b]); }
  if (ej) { money += 3; parts.push(['🚀 Katapulta', '+€3']); }
  if (sim.flips) { money += sim.flips * 2; parts.push([`🤸 Salto ×${sim.flips}`, '+€' + sim.flips * 2]); }
  if (sim.roofs) { money += sim.roofs * 2; parts.push([`🏠 Jumti ×${sim.roofs}`, '+€' + sim.roofs * 2]); }
  if (rec) { const b = 5 + Math.round((dist - old) / 10); money += b; parts.push(['🏆 Jauns rekords', '+€' + b]); }
  if (!save.first) { save.first = 1; money += 25; parts.push(['🎁 Pirmais lēciens', '+€25']); }
  const xp = Math.round(dist / 10) + (landed ? 5 : 0) + 2, lv0 = levelOf(save.xp).l;
  save.xp += xp; save.flights++; if (rec) save.best[vid] = dist;
  const S = save.st; if (landed) S[{ plane: 'landP', scoot: 'landS', car: 'landC' }[vid]]++; else S.crash++; S.flips += sim.flips; S.roofs += sim.roofs; S.birds = (S.birds || 0) + birdsHit;
  walletAdd(money); persist(); medals(); hud(); placeBest();
  const lv1 = levelOf(save.xp).l;
  endInfo = { dist, money, xp, rec, landed };
  state = 'end'; $('eject').classList.remove('on'); document.body.classList.remove('run'); $('dist').classList.remove('on'); $('turbo').classList.remove('on'); hints(false); inp.turbo = false;
  const rid = ++runId; setTimeout(() => { if (state !== 'end' || rid !== runId) return;
    sheet(`<h2 style="text-align:center">${landed ? '🛬' : ej ? '🚀🧍' : '💥'} ${VEH[vid].i}</h2>
      <div class="big">${dist} m</div>${rec ? '<p style="text-align:center;font-weight:900;color:#ffd34d">🏆 Rekords!</p>' : `<p style="text-align:center;color:#c9d2ff">🏆 ${Math.round(old)} m</p>`}
      <div class="res"><div class="part"><span>💰</span><b>+€${money}</b></div><div class="part"><span>⭐</span><b>+${xp}</b></div></div>
      ${lv1 > lv0 ? `<p style="text-align:center;font-weight:900;color:#7dffa8">⬆ ${lv1}. līmenis!</p>` : ''}
      <div class="row2"><button class="main ghostB" id="toShop">🔧</button><button class="main green" id="again">🔁 Vēlreiz</button></div>`);
    $('again').onclick = () => go(); $('toShop').onclick = () => { closeSheet(); openShop(); };
    sfx(rec ? 'win' : 'coin');
  }, landed ? 450 : 250);
}

// ================= Darbnīca =================
function rampSpeed(st) { const s = new Sim(st, RAMP, WORLD); for (let i = 0; i < 120 * 40 && s.mode === 'ramp'; i++) s.step({ pitch: 0 }); return s.mode === 'ramp' ? s.v : (s.ev[0] || [0, s.v])[1]; }
function openShop() {
  camSnap = true;
  state = 'shop'; ejected = false; $('eject').classList.remove('on'); $('lever').classList.remove('on'); document.body.classList.remove('run'); closeSheet(); $('dist').classList.remove('on'); $('turbo').classList.remove('on'); hints(false); clearFX(); setVehicle(); renderShop(); $('shop').classList.add('on'); viewOffset();
}
function renderShop() {
  const vid = save.veh, V = VEH[vid], o = own(vid), sh = $('shop');
  let h = `<h3>🔧 Darbnīca <small>💰 €${wallet}</small></h3><div class="vtabs">${Object.keys(VEH).map(k => `<button data-v="${k}" class="${k === vid ? 'on' : ''}"><i>${VEH[k].i}</i>${VEH[k].n}${own(k) ? '' : `<em>🔒 €${VEH[k].p}</em>`}</button>`).join('')}</div>`;
  if (!o) { h += `<div class="vlock"><div style="font-size:54px">${V.i}</div><button class="buy ${wallet < V.p ? 'no' : ''}" id="buyV" style="width:100%;min-height:54px;font-size:17px">Nopirkt €${V.p}</button></div>`; sh.innerHTML = h; wireShop(); return; }
  const sel = selOf(vid);
  for (const [k, S] of Object.entries(V.slots)) { const lv = sel[k], have = o[k] || 0, nx = S.lv[have + 1];
    h += `<div class="slot"><i>${S.lv[lv].i || S.i}</i><div><b>${S.n} <span class="lvn">${lv}/${RP.NL}</span></b><small>${S.lv[lv].n}</small>
      <div class="lvs"><button data-k="${k}" data-l="${lv - 1}" ${lv > 0 ? '' : 'disabled'}>◀</button><div class="lvbar"><i style="width:${have / RP.NL * 100}%"></i><u style="width:${lv / RP.NL * 100}%"></u></div><button data-k="${k}" data-l="${lv + 1}" ${lv < have ? '' : 'disabled'}>▶</button></div></div>
      ${nx ? `<button class="buy ${wallet < nx.p ? 'no' : ''}" data-buy="${k}">+1<br>€${nx.p}</button>` : '<button class="buy max" disabled>MAX</button>'}</div>`; }
  const r = RAMPS[save.ramp], rn = RAMPS[save.ramp + 1];
  h += `<div class="slot"><i>🏗️</i><div><b>Rampa <span class="lvn">${save.ramp}/${RP.NL}</span></b><small>${r.h} m</small><div class="lvs"><div class="lvbar"><i style="width:${save.ramp / RP.NL * 100}%"></i><u style="width:${save.ramp / RP.NL * 100}%"></u></div></div></div>
    ${rn ? `<button class="buy ${wallet < rn.p ? 'no' : ''}" data-buy="ramp">+1<br>€${rn.p}</button>` : '<button class="buy max" disabled>MAX</button>'}</div>
    <p style="margin:6px 0 0;font-size:13px;color:#c9d2ff">🏆 <b style="color:#ffd34d">${Math.round(save.best[vid] || 0)} m</b></p>
    <button id="go">🚀 Aiziet!</button>`;
  sh.innerHTML = h; wireShop();
}
function wireShop() { const sh = $('shop');
  sh.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { save.veh = b.dataset.v; persist(); setVehicle(); renderShop(); sfx('tick'); });
  const bv = $('buyV'); if (bv) bv.onclick = () => { const V = VEH[save.veh]; if (wallet < V.p) { toast(`💰 Vēl €${V.p - wallet}`); sfx('bad'); return; } walletAdd(-V.p); save.own[save.veh] = { wheel: 0, aero: 0, eng: 0 }; persist(); setVehicle(); renderShop(); sfx('win'); };
  sh.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { own(save.veh)['u_' + b.dataset.k] = +b.dataset.l; persist(); setVehicle(); renderShop(); sfx('tick'); });
  sh.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const k = b.dataset.buy;
    if (k === 'ramp') { const rn = RAMPS[save.ramp + 1]; if (wallet < rn.p) { toast(`💰 Vēl €${rn.p - wallet}`); sfx('bad'); return; } walletAdd(-rn.p); save.ramp++; persist(); buildRamp(RAMPS[save.ramp].h); setVehicle(); renderShop(); sfx('win'); return; }
    const o = own(save.veh), S = VEH[save.veh].slots[k], nx = S.lv[(o[k] || 0) + 1]; if (wallet < nx.p) { toast(`💰 Vēl €${nx.p - wallet}`); sfx('bad'); return; }
    walletAdd(-nx.p); o[k] = (o[k] || 0) + 1; o['u_' + k] = o[k]; persist(); setVehicle(); renderShop(); sfx('win'); });
  const g = $('go'); if (g) g.onclick = () => go(); }

// ================= Kamera un kadrs =================
const camT = new T3.Vector3(), camL = new T3.Vector3(), tmp = new T3.Vector3(), camOff = new T3.Vector3(); let camPsi = 0, camSnap = true;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = clamp((now - lastT) / 1000, 0, .25); lastT = now; if (document.hidden) return;
  DAYT += dt; applyDay(); STARS.position.copy(camera.position); if ((DAYT * 2 | 0) !== hudSec) { hudSec = DAYT * 2 | 0; hudKey = ''; hud(); }
  const paused = $('ov').classList.contains('on') && state === 'run';
  if (state === 'run' && !paused) {
    acc += dt; runT += dt; const ip = ejected ? { pitch: 0, roll: 0, turbo: false, help: true } : { pitch: inp.pitch, roll: inp.roll, turbo: inp.turbo, help: OPT.help };
    if (ejected) { updatePilot(dt); if (PIL && PIL.landed) { finish('eject'); } }
    $('eject').classList.toggle('on', state === 'run' && !ejected && sim.mode === 'air' && sim.air > .4);
    while (acc >= DT && state === 'run' && sim.mode !== 'done') { prev.z = sim.z; prev.y = sim.y; prev.x = sim.x; prev.phi = sim.phi; prev.psi = sim.psi; prev.bank = sim.bank; sim.step(ip); acc -= DT; handleEvents(); }
    const a = state === 'run' ? acc / DT : 1, L2 = (k) => prev[k] + (sim[k] - prev[k]) * a, z = L2('z'), y = L2('y'), x = L2('x'), ph = prev.phi + wrap(sim.phi - prev.phi) * a;
    VEHM.g.position.set(x, y, z); VEHM.g.rotation.set(-ph, L2('psi'), -L2('bank'));
    if (state === 'run') updateBirds(dt);
    if (state === 'run') { const sp = sim.speed; if (VEHM.spin) VEHM.spin.rotation.z += dt * (sim.thr ? 60 : 8 + sp * .5);
      VEHM.flameM.forEach(f => { f.visible = sim.thr; if (sim.thr) f.scale.setScalar(.8 + Math.random() * .5); });
      updateStreaks(VEHM, dt, sp, sim.mode === 'air' ? sim.alpha : 0, sim.mode === 'air' ? sim.cl : 0, OPT.streaks);
      $('dM').textContent = Math.max(0, Math.round(ejected && PIL ? PIL.o.position.z : sim.maxZ)) + ' m'; $('dSub').textContent = `⬆ ${Math.max(0, Math.round(sim.y - surfAt(WORLD, sim.x, sim.z).h))} m · ${Math.round(sp * 3.6)} km/h`;
      if (ST.T) $('turbo').style.setProperty('--f', (sim.fuel / ST.fuel * 100) + '%');
      if (!sim.stall) $('warn').classList.remove('on');
      wind(sp); engine(sim.thr);
      const fx = Math.sin(sim.psi), fz = Math.cos(sim.psi);
      if (sim.thr && VEHM.flames.length && Math.random() < dt * 12) puff(tmp.set(x - fx * (VEHM.len * .7), y + .4, z - fz * (VEHM.len * .7)), 'trail', 1);
      if (sim.engDead && Math.random() < dt * 14) puff(tmp.set(x + fx * VEHM.len * .4, y + .7, z + fz * VEHM.len * .4), 'trail', 1); }
  } else if (state === 'shop') { shopT += dt; wind(0); engine(false); }
  if (GATE) { gateA += ((state === 'shop' || state === 'ready' ? 0 : 1) - gateA) * Math.min(1, dt * 6); GATE.userData.bar.rotation.z = gateA * 1.45 + (state === 'ready' ? leverK * .06 : 0); }
  if (state === 'crash' || state === 'end') { crashT += dt; updateDebris(dt); updatePilot(dt); wind(0); engine(false);
    if (state === 'crash' && crashT < 3 && Math.random() < dt * 8 && DEB[0]) puff(DEB[0].o.position, 'smoke', 1);
    if (state === 'crash' && (ejected ? (PIL && PIL.landed) || crashT > 8 : crashT > .9)) finish('crash'); }
  updateFX(dt);
  // ēna
  const vp = state === 'shop' || state === 'run' ? VEHM.g.position : PIL ? PIL.o.position : VEHM.g.position, sh = state === 'run' && sim && sim.mode !== 'ramp' ? surfAt(WORLD, vp.x, vp.z).h : -9;
  shadow.visible = sh > -1 && vp.y - sh < 60; if (shadow.visible) { const k = clamp(1 - (vp.y - sh) / 60, .2, 1); shadow.position.set(vp.x, sh + .08, vp.z); shadow.scale.setScalar(VEHM.len * .45 * (1.4 - k * .4)); shadow.material.opacity = .3 * k; }
  // kamera
  const port = W < H;
  if (state === 'shop') { const p = VEHM.g.position, a = Math.sin(shopT * .25) * .6 + .75, r = VEHM.len * 1.3 + 4;
    camT.set(p.x + Math.sin(a) * r, p.y + 2.2 + r * .15, p.z + Math.cos(a) * r); camL.set(p.x, p.y + .9, p.z); if (camSnap) { camera.position.copy(camT); camSnap = false; } else camera.position.lerp(camT, 1 - Math.exp(-dt * 3)); }
  else if (state === 'run' || state === 'ready') { const p = ejected && PIL ? PIL.o.position : VEHM.g.position, sp = state === 'ready' ? 0 : ejected && PIL ? Math.min(25, PIL.v.length()) : sim.speed, back = (port ? 6.5 : 5.2) + VEHM.len * .95 + sp * .045, up = 1.7 + VEHM.len * .32 + sp * .018;
    const onR = !ejected && (state === 'ready' || sim.mode === 'ramp' || p.z < 0); camPsi += wrap(sim.psi - camPsi) * Math.min(1, dt * 2.5); const hx = Math.sin(camPsi), hz = Math.cos(camPsi);
    let cy = p.y + up, cz = p.z - back * hz, cx = p.x - back * hx;
    if (onR) { const rs0 = (sim.mode === 'ramp' ? sim.s : RAMP.len) - back, rp = rampAt(RAMP, Math.max(0, rs0)); cy = Math.max(cy, rp.y + up + 1); cz = rp.z + Math.min(0, rs0); cx = p.x; }
    if (state === 'ready') { cy = p.y + 2.2 + VEHM.len * .15; cz = p.z - (3.5 + VEHM.len * .9); cx = p.x; }
    // kamera piesieta braucamrīkam (bez atpalikšanas ātrumā → neraustās); gludi mainās tikai nobīde
    camOff.lerp(tmp.set(cx - p.x, cy - p.y, cz - p.z), camSnap ? 1 : 1 - Math.exp(-dt * 3)); camSnap = false; camera.position.copy(p).add(camOff);
    const la = 10 + sp * .25; camL.set(p.x + hx * la, p.y + 1 + (state === 'ready' ? -2.5 : 0), p.z + hz * la); }
  else { const tgt = PIL && crashT > 1.4 ? PIL.o.position : DEB[0] ? DEB[0].o.position : VEHM.g.position;
    camT.set(tgt.x + 8 + Math.min(6, crashT), tgt.y + 5 + Math.min(4, crashT), tgt.z - 14); camL.copy(tgt); camL.y += 1.5; camera.position.lerp(camT, 1 - Math.exp(-dt * 2)); }
  camera.lookAt(camL);
  cullChunks();
  if (camShake > 0) { camShake = Math.max(0, camShake - dt * 1.6); camera.position.x += rnd(-.3, .3) * camShake; camera.position.y += rnd(-.3, .3) * camShake; }
  renderer.render(scene, camera);
}

// ================= Vadība =================
// vadība: ekrāns sadalīts uz pusēm – turi kreisajā pusē = deguns augšup, labajā = lejup (bez spārniem – griešanās);
// turot pavelc pirkstu ⬅➡ – stūrē. Tastatūra – bultiņas.
const TOUCH = new Map(); let kUp = 0, kDn = 0, kL = 0, kR = 0;
function recalcInput() { let tp = 0, tr = 0, last = null; TOUCH.forEach(t => { tp += t.side; last = t; }); if (last) tr = clamp((last.x - last.x0) / 70, -1, 1);
  inp.pitch = clamp(tp + kUp - kDn, -1, 1); inp.roll = clamp(tr + kR - kL, -1, 1); padDraw(); }
function padDraw() { let l = 0, r = 0; TOUCH.forEach(t => t.side > 0 ? l = 1 : r = 1); $('padL').classList.toggle('hit', !!l); $('padR').classList.toggle('hit', !!r); }
$('cv').addEventListener('pointerdown', e => { audioInit(); if (state !== 'run') return; TOUCH.set(e.pointerId, { side: e.clientX < W / 2 ? 1 : -1, x0: e.clientX, x: e.clientX }); try { $('cv').setPointerCapture(e.pointerId); } catch (x) {} recalcInput(); });
$('cv').addEventListener('pointermove', e => { const t = TOUCH.get(e.pointerId); if (!t) return; t.x = e.clientX; recalcInput(); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => $('cv').addEventListener(ev, e => { if (TOUCH.delete(e.pointerId)) recalcInput(); }));
function joyReset() { TOUCH.clear(); recalcInput(); }
const tb = $('turbo');
tb.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); inp.turbo = true; tb.classList.add('on'); try { tb.setPointerCapture(e.pointerId); } catch (x) {} if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(15); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => tb.addEventListener(ev, () => { inp.turbo = false; }));
addEventListener('keydown', e => { if (e.repeat) return; if (e.key === 'ArrowUp' || e.key === 'w') kUp = 1; else if (e.key === 'ArrowDown' || e.key === 's') kDn = 1; else if (e.key === 'ArrowLeft' || e.key === 'a') kL = 1; else if (e.key === 'ArrowRight' || e.key === 'd') kR = 1; else if (e.key === ' ') { inp.turbo = true; e.preventDefault(); if (state === 'ready') release(); } else if (e.key === 'Enter' && (state === 'shop' || state === 'end')) go(); else if (e.key === 'Enter' && state === 'ready') release(); recalcInput(); });
addEventListener('keyup', e => { if (e.key === 'ArrowUp' || e.key === 'w') kUp = 0; else if (e.key === 'ArrowDown' || e.key === 's') kDn = 0; else if (e.key === 'ArrowLeft' || e.key === 'a') kL = 0; else if (e.key === 'ArrowRight' || e.key === 'd') kR = 0; else if (e.key === ' ') inp.turbo = false; recalcInput(); });
addEventListener('contextmenu', e => e.preventDefault());
$('quit').addEventListener('click', e => { e.stopPropagation(); if (state === 'ready' || state === 'run' || state === 'crash') { inp.turbo = false; joyReset(); openShop(); } });
$('eject').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); eject(); });

// ================= UI palīgi =================
function sheet(html) { $('sheet').innerHTML = html; $('ov').classList.add('on'); }
function closeSheet() { $('ov').classList.remove('on'); }
let toastT = 0; function toast(t) { const el = $('toast'); el.innerHTML = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2400); }
let banT = 0; function banner(t, s) { const el = $('banner'); el.innerHTML = t; el.classList.add('on'); clearTimeout(banT); banT = setTimeout(() => el.classList.remove('on'), (s || 3) * 1000); }
let warnT = 0; function warn(t) { const el = $('warn'); el.textContent = t; el.classList.add('on'); clearTimeout(warnT); warnT = setTimeout(() => el.classList.remove('on'), 1200); }
let hudKey = '', hudSec = 0;
function hud() { const lv = levelOf(save.xp), key = [lv.l, lv.cur, wallet, Math.floor(hourNow() * 6)].join('|'); if (key === hudKey) return; hudKey = key;
  const hh = hourNow(); $('sLv').textContent = `🛫 ${lv.l}. līm. · ${isNight() ? '🌙' : '☀️'} ${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor(hh % 1 * 60)).padStart(2, '0')}`; $('sXp').style.width = (lv.cur / lv.need * 100) + '%';
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
  else if (k === 'bird') { tone(1500, 900, .12, 'triangle', .07); tone(1400, 800, .14, 'triangle', .06, .14); noise(.12, .2, 2500); }
  else if (k === 'sputter') for (let i = 0; i < 6; i++) { tone(90, 60, .08, 'sawtooth', .08, i * .13); noise(.08, .2, 600, i * .13); }
  else if (k === 'eject') { noise(.35, .4, 2500); tone(300, 900, .25, 'square', .06); }
 }

// ================= Saglabāšana, nauda, medaļas =================
const ONLINE = location.protocol === 'https:'; let UID = null, NAME = '', NICK = '', wallet = 0;
const LKEY = () => 'rpSave' + (UID ? ':' + UID : '');
function persist() { try { localStorage.setItem(LKEY(), JSON.stringify(save)); } catch (e) {} if (UID) firebase.database().ref('rampa/saves/' + UID).set(save).catch(() => {}); }
function walletAdd(m) { wallet = wallet + m; hudKey = ''; hud(); if (UID) TW.wallet.add(UID, m).then(v => { wallet = v; hudKey = ''; hud(); }).catch(() => {}); else try { localStorage.setItem('rpWalletDev', wallet); } catch (e) {} }
function medals() { if (!UID || !window.TWA) return; const S = save.st, b = save.best;
  TWA.sync(UID, { rpFlights: save.flights, rpPlane: b.plane || 0, rpLandP: S.landP, rpScoot: b.scoot || 0, rpLandS: S.landS, rpFlip: S.flips, rpCar: b.car || 0, rpRoof: S.roofs, rpCrash: S.crash, rpBird: S.birds || 0, rpLevel: levelOf(save.xp).l })
    .then(n => n.forEach((m, i) => setTimeout(() => toast(`🏅 Jauna medaļa!<br><span style="font-size:28px">${m.i}</span> ${TWA.title ? TWA.title(m) : m.t}`), 3600 * i + 2500))).catch(() => {}); }
function fixSave() { const d = { plane: 0, scoot: 0, car: 0 }; save.best = Object.assign(d, save.best || {}); save.st = Object.assign({ landP: 0, landS: 0, landC: 0, crash: 0, flips: 0, roofs: 0 }, save.st || {});
  save.own = save.own || {}; if (!save.own.plane) save.own.plane = { wheel: 0, wing: 0, eng: 0, long: 0 }; if (!VEH[save.veh] || !save.own[save.veh]) save.veh = 'plane'; save.ramp = clamp(save.ramp || 0, 0, RAMPS.length - 1); }
function start() { loadModels(start2); }
function start2() { const ld = $('loading'); if (ld) ld.remove(); fixSave(); initStreaks(); buildCity(); buildRamp(RAMPS[save.ramp].h); resize(); openShop(); hud(); requestAnimationFrame(frame);
 }
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
    if (window.TW && !TW.isStaff(UID)) { loadModels(() => { fixSave(); initStreaks(); buildCity(); buildRamp(RAMPS[0].h); resize(); state = 'shop'; setVehicle(); requestAnimationFrame(frame); });
      sheet(`<h2>🛫 Mega rampa</h2><p>Drīzumā! Spēle vēl top. 🔒</p><a class="main" style="display:block;text-align:center;text-decoration:none" href="../index.html">← Uz sākumlapu</a>`); return; }
    if (window.TW) TW.heartbeat(UID, () => ({ game: 'Mega rampa', where: state === 'run' || state === 'ready' ? `Lido ${VEH[save.veh].i} ${Math.round(sim ? sim.maxZ : 0)} m` : `Darbnīcā (līm. ${levelOf(save.xp).l})`, name: NAME, nick: NICK }));
    db.ref('kicks/' + UID).on('value', s => { const k = s.val(); if (k && k.until > TW.now()) { alert('Tevi uz laiku izmeta no spēles. Spēlē draudzīgi! 🙂'); location.href = '../index.html'; } }, () => {});
    if (window.TWA && TWA.load) TWA.load(UID).catch(() => {});
    start();
  });
} else start();
