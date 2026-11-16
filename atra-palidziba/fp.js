// Ātrā palīdzība – pirmās personas skats („🛞 Stūre”): tā pati pilsēta 3D ar three.js (ielādējas tikai, kad ieslēdz).
// Pasaules (x, y) → three (x, z); y – augstums. Mājas 3× augstākas nekā 2D „slīpumā”, lai no ielas izskatās pēc īstām mājām.
// FP.toggle() – ieslēdz/izslēdz; FP.on – vai ieslēgts; FP.render(t) – zīmē kadru (izsauc game.js frame()).
'use strict';
(function () {
  const FP = window.FP = { on: false, ready: false, loading: false };
  let R3, scene, camera, renderer, glCv, dash, dctx, carBody, carCab, carGlass, carWheel, carHead, carTail, navM, lightsM, beaconP, beaconH, hemi, sun, winMat, roofMat, steerVis = 0;
  const HK = 3, EYE = 34;
  function load(cb) { if (window.THREE) return cb(); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; s.onload = cb; s.onerror = () => { FP.loading = false; toast('Neizdevās ielādēt 3D skatu – pārbaudi internetu'); }; document.head.appendChild(s); }
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  function build() {
    R3 = THREE;
    glCv = document.createElement('canvas'); glCv.id = 'fp'; glCv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:var(--twH,100%);touch-action:none;display:none'; document.body.insertBefore(glCv, document.getElementById('top'));
    dash = document.createElement('canvas'); dash.id = 'fpDash'; dash.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:var(--twH,100%);pointer-events:none;display:none;z-index:2'; document.body.insertBefore(dash, document.getElementById('top')); dctx = dash.getContext('2d');
    glCv.addEventListener('pointerdown', e => cv.dispatchEvent(new PointerEvent('pointerdown', e)));
    renderer = new R3.WebGLRenderer({ canvas: glCv, antialias: true, powerPreference: 'high-performance' }); FP.pr = Math.min(2, devicePixelRatio || 1); renderer.setPixelRatio(FP.pr); FP.aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy()); renderer.outputEncoding = R3.sRGBEncoding; renderer.toneMapping = R3.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; // kā Mega rampā – dabiskākas krāsas; asums: līdz 2× pikseļi, gludas malas
    scene = new R3.Scene(); scene.fog = new R3.Fog(0xbfe3ff, 900, 3200);
    camera = new R3.PerspectiveCamera(72, 1, 4, 4000);
    hemi = new R3.HemisphereLight(0xdff2ff, 0x5a7a4a, .9); scene.add(hemi); sun = new R3.DirectionalLight(0xffffff, .8); sun.position.set(-1, 2.2, -.6); scene.add(sun);
    // zeme
    const ground = new R3.Mesh(new R3.PlaneGeometry(S + 3000, S + 3000), new R3.MeshLambertMaterial({ color: 0x7dbb63 })); ground.rotation.x = -Math.PI / 2; ground.position.set(S / 2, 0, S / 2); scene.add(ground);
    // ielas ar līnijām (tekstūra atkārtojas)
    // asfalts ar raustītu centra līniju un baltām malu līnijām (7 vienības no apmales, kā 2D)
    const roadT = tex(256, 64, (g, w, h) => { g.fillStyle = '#3a3e48'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2f2f2'; g.fillRect(0, h / 2 - 1.5, w * .5, 3); g.fillRect(0, 3, w, 2); g.fillRect(0, h - 5, w, 2); g.fillStyle = '#2e3139'; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); });
    roadT.encoding = R3.sRGBEncoding; roadT.anisotropy = FP.aniso; // līnijas tālumā neizplūst // citādi asfalts izbalē (renderer izvada sRGB)
    roadT.repeat.set((S + RW) / 220, 1); const roadM = new R3.MeshLambertMaterial({ map: roadT });
    for (let k = 0; k < N; k++) { const geo = new R3.PlaneGeometry(S + RW, RW);
      const h_ = new R3.Mesh(geo, roadM); h_.rotation.x = -Math.PI / 2; h_.position.set(S / 2, .6, k * G); scene.add(h_);
      const v_ = new R3.Mesh(geo, roadM); v_.rotation.x = -Math.PI / 2; v_.rotation.z = Math.PI / 2; v_.position.set(k * G, .7, S / 2); scene.add(v_); }
    // krustojumi bez līnijām
    const xM = new R3.MeshLambertMaterial({ color: 0x454a56 }), xG = new R3.PlaneGeometry(RW, RW), xI = new R3.InstancedMesh(xG, xM, N * N), m4 = new R3.Matrix4(), q = new R3.Quaternion().setFromEuler(new R3.Euler(-Math.PI / 2, 0, 0)), one = new R3.Vector3(1, 1, 1);
    let n = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) xI.setMatrixAt(n++, m4.compose(new R3.Vector3(i * G, .9, j * G), q, one)); scene.add(xI); xM.color.set(0x3a3e48).convertSRGBToLinear();
    // zebras (6 svītras katrai pieejai) un stop līnijas aiz tām – tās pašas vietas kā 2D
    const zs = [], sl = [], eb = RW / 2 + 38; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const X = i * G, Y = j * G;
      for (let k = 0, nz = Math.floor((RW - 14) / 19); k < nz; k++) { const o = (k - (nz - 1) / 2) * 19; if (i < N - 1) zs.push([X + RW / 2 + 16, Y + o, 20, 12]); if (i > 0) zs.push([X - RW / 2 - 16, Y + o, 20, 12]); if (j < N - 1) zs.push([X + o, Y + RW / 2 + 16, 12, 20]); if (j > 0) zs.push([X + o, Y - RW / 2 - 16, 12, 20]); }
      if (i > 0 && i < N - 1 && j > 0 && j < N - 1) sl.push([X - eb, Y + RW / 4, 5, RW / 2 - 10], [X + eb, Y - RW / 4, 5, RW / 2 - 10], [X - RW / 4, Y - eb, RW / 2 - 10, 5], [X + RW / 4, Y + eb, RW / 2 - 10, 5]); }
    const wM = new R3.MeshLambertMaterial({ color: 0xf2f2f2 }), wG = new R3.PlaneGeometry(1, 1), mk = (list, y) => { const im = new R3.InstancedMesh(wG, wM, list.length); list.forEach(([x, z, w, d], k) => im.setMatrixAt(k, m4.compose(new R3.Vector3(x, y, z), q, new R3.Vector3(w, d, 1)))); scene.add(im); };
    mk(zs, 1.1); mk(sl, 1.1);
    // kvartāli: ietve + iekšpuse (krāsa pēc veida)
    const box = new R3.BoxGeometry(1, 1, 1); box.translate(0, .5, 0);
    const bases = new R3.InstancedMesh(box, new R3.MeshLambertMaterial({ color: 0xffffff }), blocks.length * 2); n = 0; const col = new R3.Color();
    const KC = { park: 0x84c466, plaza: 0xe4ddcf, parking: 0x5a5f6b, hospital: 0x9ccc82, fuel: 0x5c616d, city: 0x9ccc82 };
    blocks.forEach(b => { const w = b.x1 - b.x0, d = b.y1 - b.y0;
      bases.setMatrixAt(n, m4.compose(new R3.Vector3((b.x0 + b.x1) / 2, 0, (b.y0 + b.y1) / 2), new R3.Quaternion(), new R3.Vector3(w, 5, d))); bases.setColorAt(n++, col.set(0xd8d2c6));
      bases.setMatrixAt(n, m4.compose(new R3.Vector3((b.x0 + b.x1) / 2, 0, (b.y0 + b.y1) / 2), new R3.Quaternion(), new R3.Vector3(w - SWK * 2, 6, d - SWK * 2))); bases.setColorAt(n++, col.set(KC[b.kind] || 0x9ccc82)); });
    scene.add(bases);
    // mājas: logu tekstūra uz sienām, jumts vienkrāsains
    const winT = tex(64, 64, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#7f93ad'; for (let y = 8; y < 64; y += 32) for (let x = 8; x < 64; x += 32) g.fillRect(x, y, 16, 18); });
    const winE = tex(64, 64, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#ffcf80'; g.fillRect(8, 8, 16, 18); g.fillStyle = '#9fd8ff'; g.fillRect(40, 40, 16, 18); g.fillStyle = '#ffb36b'; g.fillRect(40, 8, 16, 18); });
    winMat = new R3.MeshLambertMaterial({ map: winT, emissiveMap: winE, emissive: 0x000000 }); roofMat = new R3.MeshLambertMaterial({ color: 0xffffff });
    const blds = []; blocks.forEach(b => b.items.forEach(it => { if (it.t === 'bld') blds.push(it); }));
    const bg = new R3.BoxGeometry(1, 1, 1); bg.translate(0, .5, 0);
    const bI = new R3.InstancedMesh(bg, [winMat, winMat, roofMat, roofMat, winMat, winMat], blds.length);
    blds.forEach((it, i) => { const w = it.x1 - it.x0, d = it.y1 - it.y0, h = it.h * HK; bI.setMatrixAt(i, m4.compose(new R3.Vector3((it.x0 + it.x1) / 2, 0, (it.y0 + it.y1) / 2), new R3.Quaternion(), new R3.Vector3(w, h, d))); bI.setColorAt(i, col.set(it.col)); });
    scene.add(bI); FP.bI = bI; FP.blds = blds;
    // koki
    const trees = []; blocks.forEach(b => b.trees.forEach(t => trees.push(t)));
    const trunk = new R3.InstancedMesh(new R3.CylinderGeometry(3, 4, 40, 6).translate(0, 20, 0), new R3.MeshLambertMaterial({ color: 0x6b4a2e }), trees.length);
    const crown = new R3.InstancedMesh(new R3.SphereGeometry(1, 8, 6), new R3.MeshLambertMaterial({ color: 0xffffff }), trees.length);
    const firG = new R3.ConeGeometry(1, 2.4, 7); trees.forEach((t, i) => { trunk.setMatrixAt(i, m4.compose(new R3.Vector3(t.x, 0, t.y), new R3.Quaternion(), one));
      crown.setMatrixAt(i, m4.compose(new R3.Vector3(t.x, 40 + t.r * (t.fir ? 1.2 : .8), t.y), new R3.Quaternion(), new R3.Vector3(t.r * 1.3, t.r * (t.fir ? 2.2 : 1.2), t.r * 1.3))); crown.setColorAt(i, col.set(t.fir ? 0x2f6b35 : t.tint > .66 ? 0x5d8f2f : 0x4a9a3c)); });
    scene.add(trunk); scene.add(crown); FP.trunk = trunk; FP.crown = crown;
    // mašīnas (virsbūve + salons), luksofori, mērķu bākas
    // mašīna: sedana profils (izspiests sānskats ar noapaļojumu), tonēti stikli, riteņi ar diskiem, lukturi. Garums ~56, platums ~26 (mērogo pēc c.len)
    const prof = new R3.Shape(); [[-28, 3], [-28, 10], [-24, 13], [-12, 14], [12, 14], [24, 12], [28, 9], [28, 3], [22, 2], [-22, 2]].forEach(([x, y], k) => k ? prof.lineTo(x, y) : prof.moveTo(x, y)); prof.closePath();
    const bodyG = new R3.ExtrudeGeometry(prof, { depth: 22, bevelEnabled: true, bevelThickness: 2, bevelSize: 1.6, bevelSegments: 2, curveSegments: 4 }); bodyG.translate(0, 0, -11); bodyG.computeVertexNormals();
    const cabP = new R3.Shape(); [[-17, 13], [-12, 22], [6, 22], [14, 13]].forEach(([x, y], k) => k ? cabP.lineTo(x, y) : cabP.moveTo(x, y)); cabP.closePath();
    const glassG = new R3.ExtrudeGeometry(cabP, { depth: 19, bevelEnabled: true, bevelThickness: 1, bevelSize: .8, bevelSegments: 1 }); glassG.translate(0, 0, -9.5);
    const roofG = new R3.BoxGeometry(17, 1.4, 19.5).translate(-3, 22.6, 0);
    const n4 = cars.length;
    carBody = new R3.InstancedMesh(bodyG, new R3.MeshPhongMaterial({ color: 0xffffff, shininess: 90, specular: 0x555555 }), n4);
    carGlass = new R3.InstancedMesh(glassG, new R3.MeshPhongMaterial({ color: 0x1a2533, shininess: 120, specular: 0x8899aa }), n4);
    carCab = new R3.InstancedMesh(roofG, new R3.MeshPhongMaterial({ color: 0xffffff, shininess: 90, specular: 0x555555 }), n4);
    carWheel = new R3.InstancedMesh(new R3.CylinderGeometry(5.4, 5.4, 4, 12).rotateX(Math.PI / 2), new R3.MeshLambertMaterial({ color: 0x1b1b1f }), n4 * 4);
    carHead = new R3.InstancedMesh(new R3.BoxGeometry(1.2, 2.6, 5), new R3.MeshBasicMaterial({ color: 0xfff6d0 }), n4 * 2);
    carTail = new R3.InstancedMesh(new R3.BoxGeometry(1.2, 2.4, 5), new R3.MeshBasicMaterial({ color: 0xffffff }), n4 * 2);
    [carBody, carGlass, carCab, carWheel, carHead, carTail].forEach(m => { m.instanceMatrix.setUsage(R3.DynamicDrawUsage); scene.add(m); });
    cars.forEach((c, i) => { carBody.setColorAt(i, col.set(c.col)); carCab.setColorAt(i, col.set(c.col)); });
    FP.wheelOff = [[-17, 5.4, 12.6], [17, 5.4, 12.6], [-17, 5.4, -12.6], [17, 5.4, -12.6]];
    // navigācija uz ceļa: spīdošas bultiņas pa maršrutu
    const chev = new R3.Shape(); chev.moveTo(-6, -9); chev.lineTo(8, 0); chev.lineTo(-6, 9); chev.lineTo(-2, 0); chev.closePath();
    navM = new R3.InstancedMesh(new R3.ShapeGeometry(chev).rotateX(-Math.PI / 2), new R3.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: .9, depthWrite: false }), 60); navM.instanceMatrix.setUsage(R3.DynamicDrawUsage); navM.count = 0; scene.add(navM);
    const nL = (N - 2) * (N - 2) * 4; lightsM = new R3.InstancedMesh(new R3.SphereGeometry(7, 8, 6), new R3.MeshBasicMaterial({ color: 0xffffff }), nL); scene.add(lightsM);
    const poles = new R3.InstancedMesh(new R3.CylinderGeometry(2, 2, 60, 5).translate(0, 30, 0), new R3.MeshLambertMaterial({ color: 0x3d4250 }), nL); n = 0; const e = RW / 2 + 14;
    FP.lp = []; for (let i = 1; i < N - 1; i++) for (let j = 1; j < N - 1; j++) { const X = i * G, Y = j * G; [[X - e - 12, Y + e + 14, 'h'], [X + e + 12, Y - e - 4, 'h'], [X - e - 12, Y - e - 4, 'v'], [X + e + 12, Y + e + 14, 'v']].forEach(([x, y, ax]) => {
      poles.setMatrixAt(n, m4.compose(new R3.Vector3(x, 0, y), new R3.Quaternion(), one)); lightsM.setMatrixAt(n, m4.compose(new R3.Vector3(x, 66, y), new R3.Quaternion(), one)); FP.lp.push({ i, j, ax, x, y, rot: Math.atan2(X - x, Y - y) }); n++; }); }
    scene.add(poles); FP.poles = poles;
    const bm = c => new R3.Mesh(new R3.CylinderGeometry(26, 26, 900, 16, 1, true), new R3.MeshBasicMaterial({ color: c, transparent: true, opacity: .35, side: R3.DoubleSide, depthWrite: false }));
    beaconP = bm(0xff3b4e); beaconH = bm(0x5ac8ff); beaconP.position.y = beaconH.position.y = 450; scene.add(beaconP); scene.add(beaconH);
    // debesis: mākoņi (game.js SKY attēli) un tāli putni – sprite bez miglas
    const ctex = c => new R3.CanvasTexture(c), bc = document.createElement('canvas'); bc.width = 64; bc.height = 32; const bx2 = bc.getContext('2d');
    bx2.strokeStyle = '#26252d'; bx2.lineWidth = 4; bx2.lineCap = 'round'; bx2.beginPath(); bx2.moveTo(4, 10); bx2.quadraticCurveTo(18, 6, 32, 20); bx2.quadraticCurveTo(46, 6, 60, 10); bx2.stroke();
    // mākonim pelēcīgi zila apakša – citādi balts uz gaišajām debesīm nav redzams
    const cTex = SKY.img.map(p => { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const g = c.getContext('2d'); g.drawImage(p[0], 0, 0);
      g.globalCompositeOperation = 'source-atop'; const lg = g.createLinearGradient(0, 40, 0, 130); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(120,140,175,.75)'); g.fillStyle = lg; g.fillRect(0, 0, 256, 160); return ctex(c); });
    FP.clouds = [...SKY.clouds, ...SKY.clouds].map((c, i) => { const sp = new R3.Sprite(new R3.SpriteMaterial({ map: cTex[c.k], transparent: true, depthWrite: false, fog: false, opacity: .9 })); sp.scale.set(1500 * c.s, 940 * c.s, 1); scene.add(sp); return { sp, c, h: 520 + (i % 4) * 90, o: i < SKY.clouds.length ? 0 : 3000 }; });
    const bMat = new R3.SpriteMaterial({ map: ctex(bc), transparent: true, depthWrite: false, fog: false });
    FP.birds = []; SKY.flocks.forEach((f, fi) => { for (let i = 0; i < f.n; i++) { const sp = new R3.Sprite(bMat); sp.scale.set(26, 13, 1); scene.add(sp); FP.birds.push({ sp, f, fi, i }); } });
    FP.ready = true; loadModels();
  }
  // ---- 3D modeļi – KayKit (CC0): mašīnas, mājas, koki, luksofori, ielu lampas (InstancedMesh); saraksti KK_* game.js ----
  function loadModels() {
    const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
    s.onload = async () => { try {
      const L = new R3.GLTFLoader(), get = u => new Promise((ok, no) => L.load(u, g => { g.scene.traverse(o => { if (o.isMesh && o.material && o.material.map) o.material.map.anisotropy = FP.aniso; }); ok(g.scene); }, undefined, no)); // tekstūras slīpi – asas
      // modeli → [{geo (sakārtota: priekša +X, apakša y=0, izmērs vienībās), mat}] + izmērs
      const parts = (scene, len, upright) => { scene.updateMatrixWorld(true); const out = [], box = new R3.Box3().setFromObject(scene), sz = box.getSize(new R3.Vector3()), ctr = box.getCenter(new R3.Vector3());
        const along = upright ? null : (sz.z > sz.x ? 'z' : 'x'), k = upright ? len / sz.y : len / Math.max(sz.x, sz.z);
        scene.traverse(o => { if (!o.isMesh) return; const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); g.translate(-ctr.x, -box.min.y, -ctr.z); if (along === 'z') g.rotateY(Math.PI / 2); g.scale(k, k, k); out.push({ geo: g, mat: o.material }); });
        return out; };
      // ---- KayKit (CC0, Kay Lousberg): models/kk/city.glb – mājas B_A..B_H, mašīnas C_*, ielu objekti S_* (viena tekstūra); trees.glb – koki T_1..T_5 ----
      const geoms = sc => { const out = {}; sc.updateMatrixWorld(true); sc.traverse(o => { if (o.isMesh) { const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); if (!g.attributes.normal) g.computeVertexNormals(); out[o.name.replace(/\.\d+$/, '')] = { geo: g, map: o.material && o.material.map }; } }); return out; };
      const KK = geoms(await get('models/kk/city.glb?v=1')), KT = geoms(await get('models/kk/trees.glb?v=1')), m4 = new R3.Matrix4(), q = new R3.Quaternion(), up = new R3.Vector3(0, 1, 0), V = (x, y, z) => new R3.Vector3(x, y, z);
      const kmat = map => new R3.MeshLambertMaterial({ map }), CM = kmat(KK.B_A.map); // visiem pilsētas modeļiem kopīga tekstūra
      // mašīnas (priekša +Z → +X; garums ~58 vienības)
      const byModel = KK_CARS.map(() => []); cars.forEach((c, i) => byModel[KK_CARMAP[c.k % KK_CARMAP.length]].push(i));
      FP.carSets = [];
      KK_CARS.forEach((n, m) => { if (!byModel[m].length || !KK['C_' + n]) return; const g = KK['C_' + n].geo.clone(); g.rotateY(Math.PI / 2); g.scale(62, 62, 62);
        const im = new R3.InstancedMesh(g, CM, byModel[m].length); im.instanceMatrix.setUsage(R3.DynamicDrawUsage); scene.add(im); FP.carSets.push({ idx: byModel[m], meshes: [im] }); });
      [carBody, carGlass, carCab, carWheel, carHead, carTail].forEach(m => m.visible = false); // vienkāršās kastes vairs nevajag
      // koki (augstums 1 → mērogo; rāda tikai tuvumā)
      const trees = []; blocks.forEach(b => b.trees.forEach(t => trees.push(t))); const TM = kmat(KT.T_1.map); FP.treeSets = [];
      [0, 1, 2, 3].forEach(k => { const list = trees.filter(t => TREE_MODEL[t.m || 0] === k), T_ = KT['T_' + (k + 1)]; if (!list.length || !T_) return;
        const im = new R3.InstancedMesh(T_.geo, TM, list.length); im.instanceMatrix.setUsage(R3.DynamicDrawUsage); scene.add(im); FP.treeSets.push({ im, list }); });
      FP.treeT = -1;
      // mājas – pagrieztas ar priekšu (markīzes, durvis) pret tuvāko ielu, dabiskās proporcijās (it.kk, game.js); slimnīca un benzīntanki – kastes
      const zero0 = new R3.Matrix4().makeScale(0, 0, 0);
      KK_BLD.forEach((n, mi) => { const list = FP.blds.filter(it => it.kk && it.kk.m === mi); if (!list.length || !KK['B_' + n]) return;
        const im = new R3.InstancedMesh(KK['B_' + n].geo, CM, list.length);
        list.forEach((it, i) => { const k = it.kk; im.setMatrixAt(i, m4.compose(V((it.x0 + it.x1) / 2, 0, (it.y0 + it.y1) / 2), q.setFromAxisAngle(up, k.ry), V(k.sx, k.sy, k.sz))); }); scene.add(im); });
      FP.blds.forEach((it, i) => { if (it.kk) FP.bI.setMatrixAt(i, zero0); }); FP.bI.instanceMatrix.needsUpdate = true;
      FP.trunk.visible = FP.crown.visible = false;
      // luksofori – KayKit modelis; lukturi tā priekšā (−Y Blenderī → +Z), mūsu krāsainās gaismas tieši lukturos
      const TK = 77, TL = KK.S_tlight; if (TL) { const im = new R3.InstancedMesh(TL.geo, CM, FP.lp.length); FP.lp.forEach((L_, i) => im.setMatrixAt(i, m4.compose(V(L_.x, 0, L_.y), q.setFromAxisAngle(up, L_.rot - Math.PI / 2), V(TK, TK, TK)))); scene.add(im); }
      FP.poles.visible = false; lightsM.visible = false;
      FP.lamps = new R3.InstancedMesh(new R3.SphereGeometry(1.7, 8, 6), new R3.MeshBasicMaterial({ color: 0xffffff }), FP.lp.length * 3);
      FP.lp.forEach((L_, i) => { const r = L_.rot - Math.PI / 2, c = Math.cos(r), s_ = Math.sin(r), X = .0875 * TK, Z = .077 * TK; [.686, .62, .555].forEach((hz, k) => FP.lamps.setMatrixAt(i * 3 + k, m4.compose(V(L_.x + X * c + Z * s_, hz * TK, L_.y - X * s_ + Z * c), q.identity(), V(1, 1, 1)))); });
      scene.add(FP.lamps);
      // ielu lampas – roka pret ielu (augšmalas lampas → uz ziemeļiem, kreisās malas → uz rietumiem)
      const LK = 94; if (KK.S_light) { const im = new R3.InstancedMesh(KK.S_light.geo, CM, LAMPS.length); LAMPS.forEach((L_, i) => im.setMatrixAt(i, m4.compose(V(L_.x, 0, L_.y), q.setFromAxisAngle(up, i % 2 ? 0 : -Math.PI / 2), V(LK, LK, LK)))); scene.add(im); }
      // soliņi parkos, hidranti pie kvartālu stūriem
      const bn = [], hy = []; blocks.forEach(b => { if (b.park) b.park.benches.forEach(p => bn.push([p.x, p.y, p.a])); if (b.kind !== 'park') hy.push([b.x0 + TREE_IN, b.y0 + TREE_IN + 26]); });
      if (KK.S_bench) { const im = new R3.InstancedMesh(KK.S_bench.geo, CM, bn.length); bn.forEach(([x, y, a], i) => im.setMatrixAt(i, m4.compose(V(x, 6, y), q.setFromAxisAngle(up, -a), V(58, 58, 58)))); scene.add(im); }
      if (KK.S_hydrant) { const im = new R3.InstancedMesh(KK.S_hydrant.geo, CM, hy.length); hy.forEach(([x, y], i) => im.setMatrixAt(i, m4.compose(V(x, 5, y), q.identity(), V(50, 50, 50)))); scene.add(im); }
      if (window.PEDS) await PEDS.fpBuild(R3, scene, get); // gājēji (Quaternius)
      FP.models = true;
    } catch (e) { console.warn('modeļi neielādējās', e); } };
    document.head.appendChild(s); }
  const LCOL = { r: 0xff3030, y: 0xffc533, g: 0x30e070 };
  FP.render = t => {
    if (!FP.ready) return; const w = innerWidth, h = viewH();
    { const now = performance.now(), d = FP.lastT ? now - FP.lastT : 16; FP.lastT = now; FP.slow = d > 29 && d < 500 ? (FP.slow || 0) + d : Math.max(0, (FP.slow || 0) - d);
      if (FP.slow > 2000 && FP.pr > 1) { FP.pr = Math.max(1, FP.pr - .25); renderer.setPixelRatio(FP.pr); FP.slow = 0; } } // telefons netiek līdzi – mazliet mazāka izšķirtspēja
    if (glCv.width !== Math.round(w * renderer.getPixelRatio()) || glCv.height !== Math.round(h * renderer.getPixelRatio())) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = clamp(2 * Math.atan(Math.tan(37 * Math.PI / 180) / camera.aspect) * 180 / Math.PI, 66, 96); camera.updateProjectionMatrix(); dash.width = w * 2; dash.height = h * 2; } // fov: portretā platāks skats (citādi viss šķiet izstiepts uz augšu)
    // diena / nakts
    const dk = darkness() / .62, day = 1 - dk, sky = new R3.Color().setRGB(.5 * day + .06 * dk, .72 * day + .06 * dk, 1 * day + .16 * dk);
    scene.background = sky; scene.fog.color = sky; hemi.intensity = .25 + .65 * day; sun.intensity = .1 + .6 * day; winMat.emissive.setRGB(dk * .9, dk * .9, dk * .9);
    // mākoņi slīd lēni (atkārtojas ap mašīnu), naktī tumši; putnu bariņi pārlido augstu
    const SP = 6000, wr = (v, c) => c + (((v - c) % SP) + SP * 1.5) % SP - SP / 2, cv = .35 + .65 * day;
    FP.clouds.forEach(({ sp, c, h, o }) => { sp.position.set(wr(c.x + o + t * 16, amb.x), h, wr(c.y + o * .6 + t * 6, amb.y)); sp.material.color.setRGB(cv, cv, cv); sp.material.opacity = .9 - .35 * dk; });
    FP.birds.forEach(({ sp, f, fi, i }) => { const fx = Math.cos(f.a), fy = Math.sin(f.a), row = (i + 1) >> 1, side = i % 2 ? 1 : -1, ox = -row * 30, oy = i ? side * row * 22 : 0;
      sp.visible = !(dk > .3 && fi > 0); const wb = (v, c) => c + (((v - c) % 3000) + 4500) % 3000 - 1500, bx = wb(f.x + fx * f.sp * t, amb.x), by = wb(f.y + fy * f.sp * t, amb.y);
      sp.position.set(bx + fx * ox - fy * oy, 260 + fi * 70 + Math.sin(t * .7 + i) * 6, by + fy * ox + fx * oy); sp.scale.y = 13 * (.55 + .45 * Math.abs(Math.sin(t * 8 + i * 1.7))); });
    // mašīnas
    const m4 = new R3.Matrix4(), q = new R3.Quaternion(), up = new R3.Vector3(0, 1, 0);
    const zero = new R3.Matrix4().makeScale(0, 0, 0), cm = new R3.Matrix4(), part = new R3.Matrix4(), col2 = new R3.Color();
    cars.forEach((c, i) => {
      if (c.off || Math.abs(c.x - amb.x) > 2600 || Math.abs(c.y - amb.y) > 2600) { [carBody, carGlass, carCab].forEach(m => m.setMatrixAt(i, zero)); for (let k = 0; k < 4; k++) carWheel.setMatrixAt(i * 4 + k, zero); for (let k = 0; k < 2; k++) { carHead.setMatrixAt(i * 2 + k, zero); carTail.setMatrixAt(i * 2 + k, zero); } return; }
      q.setFromAxisAngle(up, -c.ang); const sx = c.len / 56; cm.compose(new R3.Vector3(c.x, 0, c.y), q, new R3.Vector3(sx, 1, 1));
      carBody.setMatrixAt(i, cm); carGlass.setMatrixAt(i, cm); carCab.setMatrixAt(i, cm);
      FP.wheelOff.forEach(([x, y, z], k) => carWheel.setMatrixAt(i * 4 + k, part.multiplyMatrices(cm, new R3.Matrix4().makeTranslation(x, y, z))));
      [-8, 8].forEach((z, k) => { carHead.setMatrixAt(i * 2 + k, part.multiplyMatrices(cm, new R3.Matrix4().makeTranslation(29.6, 8.5, z))); carTail.setMatrixAt(i * 2 + k, part.multiplyMatrices(cm, new R3.Matrix4().makeTranslation(-29.6, 9, z))); carTail.setColorAt(i * 2 + k, col2.setHex(c.brake ? 0xff1a1a : 0x8a1515)); });
    });
    if (FP.carSets) { const cm2 = new R3.Matrix4(); FP.carSets.forEach(set => set.idx.forEach((ci, j) => { const c = cars[ci], far = c.off || Math.abs(c.x - amb.x) > 2600 || Math.abs(c.y - amb.y) > 2600;
      if (far) cm2.makeScale(0, 0, 0); else { q.setFromAxisAngle(up, -c.ang); cm2.compose(new R3.Vector3(c.x, 0, c.y), q, new R3.Vector3(c.len / 56, 1, 1)); } set.meshes.forEach(im => im.setMatrixAt(j, cm2)); })); FP.carSets.forEach(set => set.meshes.forEach(im => im.instanceMatrix.needsUpdate = true)); }
    [carBody, carGlass, carCab, carWheel, carHead, carTail].forEach(m => m.instanceMatrix.needsUpdate = true); if (carTail.instanceColor) carTail.instanceColor.needsUpdate = true;
    // bultiņas pa maršrutu (līdz ~1600 vienībām uz priekšu)
    let nn = 0; if (M.route && (M.state === 'toPatient' || M.state === 'toHospital')) { const pts = M.route.pts; let acc = 0, off = (t * 90) % 70;
      for (let k = 1; k < pts.length && nn < 60 && acc < 1700; k++) { const a = pts[k - 1], b = pts[k], L = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
        for (let d = off; d < L && nn < 60; d += 70) { const x = a.x + (b.x - a.x) * d / L, y = a.y + (b.y - a.y) * d / L; if (Math.hypot(x - amb.x, y - amb.y) < 50) continue; q.setFromAxisAngle(up, -ang); navM.setMatrixAt(nn++, m4.compose(new R3.Vector3(x, 2.2, y), q, new R3.Vector3(1.6, 1, 1.6))); }
        acc += L; off = 70 - ((L - off) % 70); } navM.material.color.setHex(M.state === 'toHospital' ? 0xff5a6a : 0xffd34d); }
    navM.count = nn; navM.instanceMatrix.needsUpdate = true; if (window.PEDS) PEDS.fpUpdate(R3, t);
    const col = new R3.Color(); FP.lp.forEach((L, i) => { const st = lightState(L.i, L.j, L.ax, t); lightsM.setColorAt(i, col.setHex(st === 'f' ? (Math.sin(t * 6) > 0 ? 0xffc533 : 0x332a10) : LCOL[st]));
      if (FP.lamps) ['r', 'y', 'g'].forEach((k, n) => FP.lamps.setColorAt(i * 3 + n, col.setHex(st === k || (st === 'f' && k === 'y' && Math.sin(t * 6) > 0) ? LCOL[k] : 0x2a2a30))); });
    lightsM.instanceColor.needsUpdate = true; if (FP.lamps && FP.lamps.instanceColor) FP.lamps.instanceColor.needsUpdate = true;
    if (FP.treeSets && (t - FP.treeT > .5 || FP.treeT < 0)) { FP.treeT = t; const zero = new R3.Matrix4().makeScale(0, 0, 0), tq = new R3.Quaternion(), tv = new R3.Vector3(), ts = new R3.Vector3();
      FP.treeSets.forEach(({ im, list }) => { list.forEach((tr, i) => { if (Math.abs(tr.x - amb.x) > 1700 || Math.abs(tr.y - amb.y) > 1700) im.setMatrixAt(i, zero); else { const h = tr.side ? 66 : (tr.m === 3 ? 70 : 60) + tr.r * 3.2; tq.setFromAxisAngle(up, (tr.x * 7 + tr.y * 13) % 6.28); im.setMatrixAt(i, m4.compose(tv.set(tr.x, 0, tr.y), tq, ts.set(h, h, h))); } }); im.instanceMatrix.needsUpdate = true; }); }
    beaconP.visible = M.state === 'toPatient'; beaconP.position.x = M.px; beaconP.position.z = M.py; beaconH.visible = M.state === 'toHospital'; beaconH.position.x = HOSP_BAY.x; beaconH.position.z = HOSP_BAY.y;
    // kamera vadītāja vietā
    const sh = cam.shake > .3 ? (Math.random() - .5) * cam.shake * .6 : 0, fx = Math.cos(amb.a), fy = Math.sin(amb.a);
    camera.position.set(amb.x + fx * 6, EYE + sh, amb.y + fy * 6); camera.lookAt(amb.x + fx * 300, EYE - 8, amb.y + fy * 300);
    renderer.render(scene, camera); drawDash(t, w, h);
  };
  // panelis: motora pārsegs, stūre, spidometrs, bultiņa uz mērķi
  function drawDash(t, w, h) { const g = dctx; g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, w, h);
    const hy = h * .8; g.fillStyle = '#f4f6fa'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, hy + 20); g.quadraticCurveTo(w / 2, hy - 30, w, hy + 20); g.lineTo(w, h); g.fill(); // pārsegs
    g.fillStyle = '#e53950'; g.fillRect(w / 2 - 50, hy + 10, 100, 8);
    if (amb.siren) { const on = Math.sin(t * 16) > 0; const gr = g.createLinearGradient(0, 0, 0, h * .25); gr.addColorStop(0, on ? 'rgba(255,40,60,.35)' : 'rgba(40,110,255,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h * .25); }
    g.fillStyle = '#1b1e27'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * .9); g.quadraticCurveTo(w / 2, h * .82, w, h * .9); g.lineTo(w, h); g.fill(); // panelis
    const R = Math.min(w, h) * .2, sx = w / 2, sy = h + R * .35; steerVis = lerp(steerVis, (FP.steer || 0) * 1.4, .2);
    g.save(); g.translate(sx, sy); g.rotate(steerVis); g.strokeStyle = '#2b2f3a'; g.lineWidth = R * .16; g.beginPath(); g.arc(0, 0, R, 0, 7); g.stroke();
    g.strokeStyle = '#3b4150'; g.lineWidth = R * .1; g.beginPath(); g.moveTo(-R, 0); g.lineTo(R, 0); g.moveTo(0, 0); g.lineTo(0, R); g.stroke(); g.fillStyle = '#e53950'; g.beginPath(); g.arc(0, 0, R * .2, 0, 7); g.fill(); g.restore();
    g.fillStyle = '#0f1220cc'; g.beginPath(); g.roundRect(w / 2 - 52, h * .83 - 22, 104, 34, 12); g.fill(); g.fillStyle = '#fff'; g.font = '900 18px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(Math.round(Math.abs(amb.v) / 430 * 90) + ' km/h', w / 2, h * .83 - 5); g.textBaseline = 'alphabetic';
    let tx, ty; if (M.state === 'toPatient') { tx = M.rx; ty = M.ry; } else if (M.state === 'toHospital') { tx = HOSP_BAY.x; ty = HOSP_BAY.y; }
    if (tx != null) { const nx = M.route && M.route.pts[1] ? M.route.pts[1] : { x: tx, y: ty }, pp = M.route && M.route.pts.find((p, k) => k > 0 && Math.hypot(p.x - amb.x, p.y - amb.y) > 80) || nx;
      const a = wrapA(Math.atan2(pp.y - amb.y, pp.x - amb.x) - amb.a); g.save(); g.translate(w / 2, h * .32); g.rotate(a); g.fillStyle = M.state === 'toHospital' ? '#ff5a6a' : '#ffd34d'; g.strokeStyle = '#000a'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, -30); g.lineTo(20, 10); g.lineTo(6, 4); g.lineTo(6, 26); g.lineTo(-6, 26); g.lineTo(-6, 4); g.lineTo(-20, 10); g.closePath(); g.stroke(); g.fill(); g.restore();
      g.fillStyle = '#fff'; g.font = '900 15px system-ui'; g.fillText(Math.round(Math.hypot(tx - amb.x, ty - amb.y) / 10) + ' m', w / 2, h * .32 + 48); } }
  FP.toggle = () => { if (FP.loading) return; if (!FP.ready) { FP.loading = true; toast('🛞 Ielādē stūres skatu…'); load(() => { try { build(); } catch (e) { FP.loading = false; toast('3D skats šajā ierīcē nestrādā'); return; } FP.loading = false; FP.toggle(); }); return; }
    FP.on = !FP.on; glCv.style.display = dash.style.display = FP.on ? 'block' : 'none'; document.body.classList.toggle('fpOn', FP.on);
    toast(FP.on ? '🛞 Stūres skats: velc pa kreisi/labi – stūrē, uz augšu – gāze, uz leju – bremze' : '🗺️ Skats no augšas'); };
})();
