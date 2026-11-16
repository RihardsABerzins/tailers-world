// Gājēji un skatītāji – Quaternius „Posed Background Characters” (CC0), apstrādāti Blenderī (peds/License.txt).
// peds/peds.webp – atlants (2×, lai telefonā ass): augšā skats no augšas 128×128 (pozas Walking/Standing/Hips × M/F × 6 krāsas), apakšā skats no priekšas 160×256 (CoveringEyes/Hips/Standing × M/F × 6).
// peds/peds.glb – tās pašas pozas 3D (🛞 stūres skatam), daļas pa krāsām (Skin/Hair/Shirt/Pants/Shoes) → InstancedMesh ar krāsu katram.
// Gājēji staigā pa ietvi ap kvartālu (taisnstūris), daži stāv; pie pacienta – skatītāju pulciņš; ainā pie pacienta (ārā) – 2–3 skatītāji fonā.
'use strict';
window.PEDS = (() => {
  const BASE = new URL('peds/', document.currentScript ? document.currentScript.src : location.href).href, V = 2;
  const atlas = new Image(); atlas.src = BASE + 'peds.webp?v=' + V;
  let night = null; // tumšāka atlanta kopija naktij (ainai)
  const SKIN = ['#f2c9a0', '#e0ac80', '#c68642', '#8d5524', '#f5d6bc', '#d9a37a'];
  const VAR = { M: [['#4a90d9', '#2d3446', '#3b2a1a'], ['#e74c3c', '#4a4a52', '#1b1b1f'], ['#7fc062', '#5a4636', '#c9a24a'], ['#f1c40f', '#2c3e50', '#6b3e1f'], ['#9b59b6', '#7d8a9a', '#2a1d14'], ['#ecf0f1', '#3a3f4b', '#8a8a8a']],
    F: [['#ff7aa8', '#2d3446', '#5a3214'], ['#5ac8c8', '#4a4a52', '#d9b45a'], ['#ff9f43', '#1e2a44', '#1b1b1f'], ['#b388ff', '#5c6370', '#a0522d'], ['#2ecc71', '#3b2a1a', '#e8c97a'], ['#e74c3c', '#2c3e50', '#3b2a1a']] };
  const OUT = { street: 1, park: 1, playground: 1, concert: 1 }; // vietas ārā, kur ir skatītāji
  const SZ = 34, IN = 14; // gājēja izmērs pasaulē (no augšas), attālums no kvartāla malas (ietves vidus)
  let list = null, crowd = [], crowdKey = '';
  const R = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(4242);
  function init() {
    list = [];
    blocks.forEach(b => { const n = b.kind === 'park' || b.kind === 'plaza' ? 3 : b.kind === 'parking' || b.kind === 'fuel' ? 1 : 2;
      for (let k = 0; k < n; k++) { const walk = R() < .7; list.push({ b, s: R(), sp: walk ? (16 + R() * 12) * (R() < .5 ? 1 : -1) : 0, pose: walk ? 0 : 1 + (R() < .5 ? 1 : 0), g: R() < .5 ? 0 : 1, v: (R() * 6) | 0, ph: R() * 6, x: 0, y: 0, a: 0, push: 0 }); } });
    list.forEach(p => place(p, 0));
  }
  // vieta uz ietves taisnstūra: s ∈ [0,1) pa perimetru (augša → labā → apakša → kreisā); stūri 0 TL, 1 TR, 2 BR, 3 BL
  const rect = b => { const x0 = b.x0 + IN, y0 = b.y0 + IN, w = b.x1 - b.x0 - IN * 2, h = b.y1 - b.y0 - IN * 2; return { x0, y0, w, h, P: 2 * (w + h), C: [0, w, w + h, 2 * w + h] }; };
  const cornerXY = (b, c) => { const r = rect(b); return [[r.x0, r.y0], [r.x0 + r.w, r.y0], [r.x0 + r.w, r.y0 + r.h], [r.x0, r.y0 + r.h]][c]; };
  const BI = {}; const blockAt = (i, j) => { if (!BI.ok) { blocks.forEach(b => BI[b.i + ',' + b.j] = b); BI.ok = 1; } return BI[i + ',' + j]; };
  // pāreja pa zebru: kustības virziens pirms stūra → kaimiņu kvartāls, tā stūris un luksofors, kam jādeg sarkanam mašīnām
  const DIR = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // ietves malu virzieni, ejot pulksteņrādītāja virzienā
  function crossing(p, c) {
    const b = p.b, d = p.sp > 0 ? DIR[(c + 3) % 4] : DIR[c].map(v => -v), nb = blockAt(b.i + d[0], b.j + d[1]); if (!nb) return null;
    const right = c === 1 || c === 2, bottom = c === 2 || c === 3, ax = d[0] ? 'v' : 'h', ii = d[0] ? b.i + (d[0] > 0 ? 1 : 0) : b.i + (right ? 1 : 0), jj = d[1] ? b.j + (d[1] > 0 ? 1 : 0) : b.j + (bottom ? 1 : 0);
    if (ii < 1 || ii > N - 2 || jj < 1 || jj > N - 2) return null; // malas ielām nav luksoforu
    const nc = p.sp > 0 ? (c + 3) % 4 : (c + 1) % 4; return { nb, nc, ax, ii, jj, to: cornerXY(nb, nc), a: Math.atan2(d[1], d[0]) };
  }
  function place(p, dt) {
    let x, y, a;
    if (p.cross && p.cross.go) { const q = p.cross, dx = q.to[0] - p.x, dy = q.to[1] - p.y, L = Math.hypot(dx, dy), st = Math.abs(p.sp) * 1.25 * dt; // pāri ielai – mazliet ātrāk
      if (L <= st) { p.b = q.nb; const r = rect(q.nb); p.s = r.C[q.nc] / r.P + (p.sp > 0 ? 1e-4 : -1e-4); p.s = (p.s + 1) % 1; p.cross = null; }
      else { p.x += dx / L * st; p.y += dy / L * st; p.a = q.a; return; } }
    if (p.cross) { const L = lightState(p.cross.ii, p.cross.jj, p.cross.ax, T); if (L === 'r' || L === 'f') p.cross.go = true; return; } // gaida pie zebras
    const r = rect(p.b), dOld = p.s * r.P;
    if (p.sp) { p.s = ((p.s + p.sp * dt / r.P) % 1 + 1) % 1; const dNew = p.s * r.P;
      // vai pagāja garām stūrim? tad dažreiz iet taisni pāri ielai (pa zebru), nevis apkārt kvartālam
      for (let c = 0; c < 4; c++) { const C = r.C[c], passed = p.sp > 0 ? (dNew >= dOld ? C > dOld && C <= dNew : C > dOld || C <= dNew) : (dNew <= dOld ? C < dOld && C >= dNew : C < dOld || C >= dNew);
        if (passed && R() < .55) { const q = crossing(p, c); if (q) { p.cross = q; p.s = C / r.P; const [cx, cy] = cornerXY(p.b, c); p.x = cx; p.y = cy; p.a = q.a; return; } } } }
    let d = p.s * r.P;
    if (d < r.w) { x = r.x0 + d; y = r.y0; a = 0; } else if ((d -= r.w) < r.h) { x = r.x0 + r.w; y = r.y0 + d; a = Math.PI / 2; } else if ((d -= r.h) < r.w) { x = r.x0 + r.w - d; y = r.y0 + r.h; a = Math.PI; } else { d -= r.w; x = r.x0; y = r.y0 + r.h - d; a = -Math.PI / 2; }
    if (p.sp < 0) a += Math.PI;
    if (!p.sp) a = p.b.i * 1.7 + p.b.j + p.s * 9; // stāvošie skatās dažādos virzienos
    // ja ātrā palīdzība brauc garām pa ietvi – pakāpjas malā
    const dx = x - amb.x, dy = y - amb.y, dd = Math.hypot(dx, dy); p.push = Math.max(0, p.push - dt * 30); if (dd < 60 && !amb.heli) p.push = Math.min(24, p.push + dt * 160);
    if (p.push) { x += dx / (dd || 1) * p.push; y += dy / (dd || 1) * p.push; }
    p.x = x; p.y = y; p.a = a;
  }
  function update(dt) { if (!list) init(); list.forEach(p => place(p, dt)); crowdFor(); }
  // pulciņš pie pacienta (tikai ārā): 3 stāv uz ietves blakus un skatās uz pacientu
  function crowdFor() {
    const show = (M.state === 'call' || M.state === 'toPatient' || M.state === 'scene') && M.c && OUT[M.c.place], key = show ? M.px + ',' + M.py : '';
    if (key === crowdKey) return; crowdKey = key; crowd = [];
    if (!show) return; const b = blocks.find(q => M.px >= q.x0 - 1 && M.px <= q.x1 + 1 && M.py >= q.y0 - 1 && M.py <= q.y1 + 1);
    const along = b && (Math.abs(M.py - b.y0) < 12 || Math.abs(M.py - b.y1) < 12) ? [1, 0] : [0, 1], inw = b ? [Math.sign((b.x0 + b.x1) / 2 - M.px) * along[1], Math.sign((b.y0 + b.y1) / 2 - M.py) * along[0]] : [0, 1];
    [[-40, 4], [38, 6], [-14, 16]].forEach(([u, v], k) => { const x = M.px + along[0] * u + inw[0] * v, y = M.py + along[1] * u + inw[1] * v;
      crowd.push({ x, y, a: Math.atan2(M.py - y, M.px - x), pose: 1 + (k % 2), g: (M.px + k) % 2 | 0, v: (Math.abs(M.px * 7 + M.py) + k * 2) % 6 | 0, sp: 0, ph: k }); });
  }
  const topCell = p => { const i = (p.pose * 2 + p.g) * 6 + p.v; return [(i % 6) * 128, ((i / 6) | 0) * 128]; };
  function draw(g, t, vx0, vy0, vx1, vy1) {
    if (!list || !atlas.complete || !atlas.naturalWidth) return;
    const one = p => { if (p.x < vx0 || p.x > vx1 || p.y < vy0 || p.y > vy1) return; const [sx, sy] = topCell(p);
      g.save(); g.translate(p.x, p.y); g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(4, 5, 12, 9, 0, 0, 7); g.fill();
      g.rotate(p.a - Math.PI / 2); if (p.sp && !(p.cross && !p.cross.go) && Math.sin(t * 7 + p.ph) > 0) g.scale(-1, 1); // solis: spoguļo – otra kāja priekšā
      g.drawImage(atlas, sx, sy, 128, 128, -SZ / 2, -SZ / 2, SZ, SZ); g.restore(); };
    list.forEach(one); crowd.forEach(one);
  }
  // ---- 🛞 3D skats ----
  const POSES = ['Walking', 'Standing', 'Standing_Hips'], PARTS = ['Skin', 'Hair', 'Shirt', 'Pants', 'Shoes'];
  let fpSets = null;
  async function fpBuild(R3, scene, get) {
    const sc = await get(BASE + 'peds.glb?v=' + V); sc.updateMatrixWorld(true); const geos = {};
    sc.traverse(o => { if (o.isMesh) { const gg = o.geometry.clone(); gg.applyMatrix4(o.matrixWorld); gg.computeVertexNormals(); geos[o.name.replace(/\.\d+$/, '')] = gg; } });
    if (!list) init(); fpSets = [];
    POSES.forEach((pose, pi) => ['M', 'F'].forEach((G, gi) => {
      // vienumi: gājēja indekss vai {cs: n} – n-tais pulciņa skatītājs ar šo dzimumu (tikai „Standing” grupā)
      const items = list.map((p, i) => i).filter(i => list[i].pose === pi && list[i].g === gi).map(i => ({ i }));
      if (pi === 1) for (let n = 0; n < 3; n++) items.push({ cs: n }); if (!items.length) return;
      const meshes = PARTS.map(part => { const geo = geos[`${G}_${pose}_${part}`]; if (!geo) return null;
        const im = new R3.InstancedMesh(geo, new R3.MeshLambertMaterial({ color: 0xffffff, flatShading: true, side: R3.DoubleSide }), items.length); im.instanceMatrix.setUsage(R3.DynamicDrawUsage); const col = new R3.Color();
        items.forEach((it, j) => { const v = it.cs != null ? (it.cs * 2 + gi) % 6 : list[it.i].v, c = part === 'Skin' ? SKIN[v] : part === 'Shoes' ? '#2a2522' : VAR[G][v][{ Shirt: 0, Pants: 1, Hair: 2 }[part]]; im.setColorAt(j, col.set(c)); });
        scene.add(im); return im; }).filter(Boolean);
      fpSets.push({ gi, items, meshes }); })); }
  function fpUpdate(R3, t) {
    if (!fpSets) return; const m4 = new R3.Matrix4(), q = new R3.Quaternion(), up = new R3.Vector3(0, 1, 0), k = 6.8, pos = new R3.Vector3(), sc = new R3.Vector3();
    fpSets.forEach(set => { const cr = crowd.filter(p => p.g === set.gi);
      set.items.forEach((it, j) => { const p = it.cs != null ? cr[it.cs] : list[it.i];
        if (!p || Math.abs(p.x - amb.x) > 2600 || Math.abs(p.y - amb.y) > 2600) m4.makeScale(0, 0, 0);
        else { q.setFromAxisAngle(up, Math.PI / 2 - p.a); m4.compose(pos.set(p.x, 3, p.y), q, sc.set(p.sp && !(p.cross && !p.cross.go) && Math.sin(t * 7 + p.ph) > 0 ? -k : k, k, k)); }
        set.meshes.forEach(im => im.setMatrixAt(j, m4)); }); set.meshes.forEach(im => im.instanceMatrix.needsUpdate = true); });
  }
  // ---- aina pie pacienta: 2–3 skatītāji fonā (tikai ārā) ----
  function scene(g, c, t) {
    if (!OUT[c.place] || !atlas.complete || !atlas.naturalWidth) return;
    let im = atlas; if (c.night) { if (!night) { night = document.createElement('canvas'); night.width = atlas.naturalWidth; night.height = atlas.naturalHeight; const x = night.getContext('2d'); x.drawImage(atlas, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(20,25,60,.55)'; x.fillRect(0, 0, night.width, night.height); } im = night; }
    let h = 0; for (const ch of c.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    // tuvāk un lielāki; mediķis stāv kreisajā pusē (x≈96), ja pacients sēž, labajā (x≈440), ja guļ
    const spots = (c.pose === 'lie' ? [[52, 1.35], [128, 1.6], [462, 1.75]] : [[392, 1.35], [458, 1.55], [20, 1.6]]).slice(0, 2 + h % 2), VY = 150;
    spots.forEach(([x, z], k) => { const pose = c.fake ? 1 : (h >>> k) % 3 === 0 ? 2 : 0, gi = (h >>> (k + 3)) & 1, v = (h >>> (k * 2 + 5)) % 6, i = (pose * 2 + gi) * 6 + v;
      const gy = VY + (300 - VY) / z, H = 190 / z, Wd = H * 80 / 128, bob = Math.sin(t * 1.3 + k * 2) * .8;
      g.globalAlpha = .95; g.drawImage(im, (i % 12) * 160, 768 + ((i / 12) | 0) * 256, 160, 256, x - Wd / 2, gy - H * 120 / 128 + bob, Wd, H); g.globalAlpha = 1; });
  }
  return { update, draw, fpBuild, fpUpdate, scene };
})();
