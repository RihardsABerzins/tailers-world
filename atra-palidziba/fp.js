// Ātrā palīdzība – pirmās personas skats („🛞 Stūre”): tā pati pilsēta 3D ar three.js (ielādējas tikai, kad ieslēdz).
// Pasaules (x, y) → three (x, z); y – augstums. Mājas 3× augstākas nekā 2D „slīpumā”, lai no ielas izskatās pēc īstām mājām.
// FP.toggle() – ieslēdz/izslēdz; FP.on – vai ieslēgts; FP.render(t) – zīmē kadru (izsauc game.js frame()).
'use strict';
(function () {
  const FP = window.FP = { on: false, ready: false, loading: false };
  let R3, scene, camera, renderer, glCv, dash, dctx, carBody, carCab, lightsM, beaconP, beaconH, hemi, sun, winMat, roofMat, steerVis = 0;
  const HK = 3, EYE = 34;
  function load(cb) { if (window.THREE) return cb(); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; s.onload = cb; s.onerror = () => { FP.loading = false; toast('Neizdevās ielādēt 3D skatu – pārbaudi internetu'); }; document.head.appendChild(s); }
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  function build() {
    R3 = THREE;
    glCv = document.createElement('canvas'); glCv.id = 'fp'; glCv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;touch-action:none;display:none'; document.body.insertBefore(glCv, document.getElementById('top'));
    dash = document.createElement('canvas'); dash.id = 'fpDash'; dash.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;display:none;z-index:2'; document.body.insertBefore(dash, document.getElementById('top')); dctx = dash.getContext('2d');
    glCv.addEventListener('pointerdown', e => cv.dispatchEvent(new PointerEvent('pointerdown', e)));
    renderer = new R3.WebGLRenderer({ canvas: glCv, antialias: false, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1));
    scene = new R3.Scene(); scene.fog = new R3.Fog(0xbfe3ff, 600, 2600);
    camera = new R3.PerspectiveCamera(72, 1, 4, 4000);
    hemi = new R3.HemisphereLight(0xdff2ff, 0x5a7a4a, .9); scene.add(hemi); sun = new R3.DirectionalLight(0xffffff, .7); sun.position.set(-1, 2, -.6); scene.add(sun);
    // zeme
    const ground = new R3.Mesh(new R3.PlaneGeometry(S + 3000, S + 3000), new R3.MeshLambertMaterial({ color: 0x7dbb63 })); ground.rotation.x = -Math.PI / 2; ground.position.set(S / 2, 0, S / 2); scene.add(ground);
    // ielas ar līnijām (tekstūra atkārtojas)
    const roadT = tex(256, 64, (g, w, h) => { g.fillStyle = '#454a56'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2f2f2'; g.fillRect(0, h / 2 - 2, w * .55, 4); g.fillStyle = '#5a5f6b'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3); });
    roadT.repeat.set((S + RW) / 220, 1); const roadM = new R3.MeshLambertMaterial({ map: roadT });
    for (let k = 0; k < N; k++) { const geo = new R3.PlaneGeometry(S + RW, RW);
      const h_ = new R3.Mesh(geo, roadM); h_.rotation.x = -Math.PI / 2; h_.position.set(S / 2, .6, k * G); scene.add(h_);
      const v_ = new R3.Mesh(geo, roadM); v_.rotation.x = -Math.PI / 2; v_.rotation.z = Math.PI / 2; v_.position.set(k * G, .7, S / 2); scene.add(v_); }
    // krustojumi bez līnijām
    const xM = new R3.MeshLambertMaterial({ color: 0x454a56 }), xG = new R3.PlaneGeometry(RW, RW), xI = new R3.InstancedMesh(xG, xM, N * N), m4 = new R3.Matrix4(), q = new R3.Quaternion().setFromEuler(new R3.Euler(-Math.PI / 2, 0, 0)), one = new R3.Vector3(1, 1, 1);
    let n = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) xI.setMatrixAt(n++, m4.compose(new R3.Vector3(i * G, .9, j * G), q, one)); scene.add(xI);
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
    scene.add(bI);
    // koki
    const trees = []; blocks.forEach(b => b.trees.forEach(t => trees.push(t)));
    const trunk = new R3.InstancedMesh(new R3.CylinderGeometry(3, 4, 40, 6).translate(0, 20, 0), new R3.MeshLambertMaterial({ color: 0x6b4a2e }), trees.length);
    const crown = new R3.InstancedMesh(new R3.SphereGeometry(1, 8, 6), new R3.MeshLambertMaterial({ color: 0xffffff }), trees.length);
    const firG = new R3.ConeGeometry(1, 2.4, 7); trees.forEach((t, i) => { trunk.setMatrixAt(i, m4.compose(new R3.Vector3(t.x, 0, t.y), new R3.Quaternion(), one));
      crown.setMatrixAt(i, m4.compose(new R3.Vector3(t.x, 40 + t.r * (t.fir ? 1.2 : .8), t.y), new R3.Quaternion(), new R3.Vector3(t.r * 1.3, t.r * (t.fir ? 2.2 : 1.2), t.r * 1.3))); crown.setColorAt(i, col.set(t.fir ? 0x2f6b35 : t.tint > .66 ? 0x5d8f2f : 0x4a9a3c)); });
    scene.add(trunk); scene.add(crown);
    // mašīnas (virsbūve + salons), luksofori, mērķu bākas
    carBody = new R3.InstancedMesh(new R3.BoxGeometry(1, 1, 1).translate(0, .5, 0), new R3.MeshLambertMaterial({ color: 0xffffff }), cars.length); carBody.instanceMatrix.setUsage(R3.DynamicDrawUsage); scene.add(carBody);
    carCab = new R3.InstancedMesh(new R3.BoxGeometry(1, 1, 1).translate(0, .5, 0), new R3.MeshLambertMaterial({ color: 0x1f2633 }), cars.length); carCab.instanceMatrix.setUsage(R3.DynamicDrawUsage); scene.add(carCab);
    cars.forEach((c, i) => carBody.setColorAt(i, col.set(c.col)));
    const nL = (N - 2) * (N - 2) * 4; lightsM = new R3.InstancedMesh(new R3.SphereGeometry(7, 8, 6), new R3.MeshBasicMaterial({ color: 0xffffff }), nL); scene.add(lightsM);
    const poles = new R3.InstancedMesh(new R3.CylinderGeometry(2, 2, 60, 5).translate(0, 30, 0), new R3.MeshLambertMaterial({ color: 0x3d4250 }), nL); n = 0; const e = RW / 2 + 14;
    FP.lp = []; for (let i = 1; i < N - 1; i++) for (let j = 1; j < N - 1; j++) { const X = i * G, Y = j * G; [[X - e - 12, Y + e + 14, 'h'], [X + e + 12, Y - e - 4, 'h'], [X - e - 12, Y - e - 4, 'v'], [X + e + 12, Y + e + 14, 'v']].forEach(([x, y, ax]) => {
      poles.setMatrixAt(n, m4.compose(new R3.Vector3(x, 0, y), new R3.Quaternion(), one)); lightsM.setMatrixAt(n, m4.compose(new R3.Vector3(x, 66, y), new R3.Quaternion(), one)); FP.lp.push({ i, j, ax }); n++; }); }
    scene.add(poles);
    const bm = c => new R3.Mesh(new R3.CylinderGeometry(26, 26, 900, 16, 1, true), new R3.MeshBasicMaterial({ color: c, transparent: true, opacity: .35, side: R3.DoubleSide, depthWrite: false }));
    beaconP = bm(0xff3b4e); beaconH = bm(0x5ac8ff); beaconP.position.y = beaconH.position.y = 450; scene.add(beaconP); scene.add(beaconH);
    FP.ready = true;
  }
  const LCOL = { r: 0xff3030, y: 0xffc533, g: 0x30e070 };
  FP.render = t => {
    if (!FP.ready) return; const w = innerWidth, h = innerHeight;
    if (glCv.width !== Math.round(w * renderer.getPixelRatio())) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dash.width = w * 2; dash.height = h * 2; }
    // diena / nakts
    const dk = darkness() / .62, day = 1 - dk, sky = new R3.Color().setRGB(.75 * day + .06 * dk, .89 * day + .06 * dk, 1 * day + .16 * dk);
    scene.background = sky; scene.fog.color = sky; hemi.intensity = .25 + .65 * day; sun.intensity = .1 + .6 * day; winMat.emissive.setRGB(dk * .9, dk * .9, dk * .9);
    // mašīnas
    const m4 = new R3.Matrix4(), q = new R3.Quaternion(), up = new R3.Vector3(0, 1, 0);
    cars.forEach((c, i) => { if (c.off) { m4.makeScale(0, 0, 0); carBody.setMatrixAt(i, m4); carCab.setMatrixAt(i, m4); return; } q.setFromAxisAngle(up, -c.ang);
      carBody.setMatrixAt(i, m4.compose(new R3.Vector3(c.x, 3, c.y), q, new R3.Vector3(c.len, 18, 26)));
      carCab.setMatrixAt(i, m4.compose(new R3.Vector3(c.x - Math.cos(c.ang) * 4, 21, c.y - Math.sin(c.ang) * 4), q, new R3.Vector3(c.len * .55, 12, 23))); });
    carBody.instanceMatrix.needsUpdate = carCab.instanceMatrix.needsUpdate = true;
    const col = new R3.Color(); FP.lp.forEach((L, i) => { const st = lightState(L.i, L.j, L.ax, t); lightsM.setColorAt(i, col.setHex(st === 'f' ? (Math.sin(t * 6) > 0 ? 0xffc533 : 0x332a10) : LCOL[st])); }); lightsM.instanceColor.needsUpdate = true;
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
