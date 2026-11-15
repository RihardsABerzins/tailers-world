// Ātrā palīdzība – aina pie pacienta (zīmēta katram gadījumam: vieta, rekvizīti, pacients pozā, trauma)
// un interaktīva palīdzība: rīku velk no somas uz pacienta ķermeņa daļu (plāksteris uz ceļa, šina uz rokas, inhalators pie mutes…).
// Treat.mount(el, CASE, {interactive, onDone(result), onCpr(done)}) → kontrolieris. Loģiskais izmērs 480×300.
'use strict';
(function () {
  const SW = 480, SH = 300, ZN = { wound: 'brūces', armR: 'rokas', handR: 'rokas', handL: 'rokas', face: 'mutes un sejas', nose: 'deguna', head: 'galvas', chest: 'krūtīm', thigh: 'augšstilba', legs: 'kājām', knee: 'ceļa', body: 'pacienta' };
  const T = { now: 0 };
  // ---- pacienta ķermeņa punkti pēc pozas (sēž uz zemes ar kājām uz priekšu / uz soliņa / guļ profilā) ----
  function geo(c, st) {
    const pose = st.pose, A = st.applied, HR = c.p.age === 'kid' ? 21 : c.p.age === 'teen' ? 19.5 : 19;
    if (pose === 'lie') { // tas pats stāvošais tēls, pagriezts: galva pa kreisi, kājas pa labi (skats no augšas)
      const shY = -150, hipY = -92, cx = 300, cy = 252, m = ([x, y]) => [cx + y, cy - x];
      const L = { hr: HR, shoeA: 0, head: [0, shY - 8 - HR], neck: [0, shY - 6], shL: [-23, shY], shR: [23, shY], hipL: [-18, hipY], hipR: [18, hipY],
        armL: [[-24, shY + 6], [-31, shY + 34], [-33, hipY + 2]], armR: [[24, shY + 6], [31, shY + 34], [33, hipY + 2]],
        legL: [[-10, hipY], [-11, -46], [-11, -8]], legR: [[10, hipY], [11, -46], [11, -8]] };
      const P = { lie: true, L, xf: [cx, cy], hr: HR }; ['head', 'neck', 'shL', 'shR', 'hipL', 'hipR'].forEach(k => P[k] = m(L[k])); ['armL', 'armR', 'legL', 'legR'].forEach(k => P[k] = L[k].map(m));
      const z = (pt, r) => [...m(pt), r];
      P.Z = { head: z(L.head, 26), face: z([0, L.head[1] + 4], 14), nose: z([0, L.head[1] + 2], 9), chest: z([0, shY + 28], 24), thigh: z([-10, -72], 16), legs: z([0, -40], 30), knee: z(L.legL[1], 14),
        handL: z(L.armL[2], 13), handR: z(L.armR[2], 13), armR: z(L.armR[1], 15), body: [cx - 90, cy, 100] };
      return P; }
    const bench = c.prop === 'bench' && pose === 'sit', slump = pose === 'slump', lean = A.has('lean') ? 5 : A.has('back') ? -3 : 0;
    const fr = c.inj.k === 'fracture', burn = c.inj.k === 'burn', bee = c.id === 'bee';
    let P;
    if (bench) { // sēž uz soliņa: gurni uz sēdekļa, apakšstilbi uz leju
      const hipY = 226, shY = 166, head = [240, shY - HR - 8 + lean];
      P = { lie: false, bench, hr: HR, shoeA: 0, head, neck: [240, shY - 6], shL: [217, shY], shR: [263, shY], hipL: [226, hipY], hipR: [254, hipY],
        armL: [[219, shY + 6], [208, shY + 32], [214, hipY - 2]], armR: [[261, shY + 6], [272, shY + 32], [266, hipY - 2]],
        legL: [[232, hipY], [226, hipY + 18], [224, 278]], legR: [[248, hipY], [256, hipY + 18], [258, 278]] };
    } else { // sēž uz zemes: gurni pie zemes, kājas izstieptas pa labi, ceļgals nedaudz pacelts
      const hipY = 264, shY = 202 + (slump ? 10 : 0), sx = slump ? 8 : 0, head = [236 + sx + (slump ? 4 : 0), shY - HR - 8 + lean + (slump ? 4 : 0)];
      const armR = fr ? [[256 + sx, shY + 6], [262 + sx, shY + 30], [238 + sx, shY + 40]] : burn ? [[256 + sx, shY + 6], [276 + sx, shY + 24], [298 + sx, shY + 30]] : [[256 + sx, shY + 6], [266 + sx, shY + 28], [270, 256]];
      const armL = bee ? [[216 + sx, shY + 6], [198, shY + 20], [180, shY + 30]] : [[216 + sx, shY + 6], [204, shY + 30], [206, hipY - 4]];
      P = { lie: false, slump, hr: HR, shoeA: -1.3, head, neck: [236 + sx, shY - 6], shL: [213 + sx, shY], shR: [259 + sx, shY], hipL: [220, hipY], hipR: [252, hipY + 2], armL, armR,
        legL: [[236, hipY - 2], [276, hipY - 14], [312, hipY + 2]], legR: [[246, hipY + 4], [284, hipY - 2], [322, hipY + 8]] };
    }
    P.Z = { head: [P.head[0], P.head[1], HR + 10], face: [P.head[0], P.head[1] + 5, 13], nose: [P.head[0], P.head[1] + 2, 8], chest: [(P.shL[0] + P.shR[0]) / 2, P.shL[1] + 22, 22],
      thigh: bench ? [252, 234, 14] : [258, 260, 14], legs: bench ? [240, 268, 30] : [300, 264, 32], knee: [P.legL[1][0], P.legL[1][1], 15],
      handL: [P.armL[2][0], P.armL[2][1], 13], handR: [P.armR[2][0], P.armR[2][1], 13], armR: [(P.armR[1][0] + P.armR[2][0]) / 2, (P.armR[1][1] + P.armR[2][1]) / 2, 14], body: [240, (P.shL[1] + P.hipL[1]) / 2 + 10, 80] };
    return P;
  }
  // ---- multfilmas stila cilvēks: plakanas krāsas + bieza tumša kontūra (kā klasiskā 2D animācijā) ----
  const OL = '#24222b', LW = 2.6;
  const sh = (hex, k) => { const n = parseInt(String(hex).slice(1), 16); if (isNaN(n)) return hex; return `rgb(${Math.min(255, Math.round(((n >> 16) & 255) * k))},${Math.min(255, Math.round(((n >> 8) & 255) * k))},${Math.min(255, Math.round((n & 255) * k))})`; };
  function limb(g, pts, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }
  const cap = (g, pts, w, col) => { limb(g, pts, w + LW * 2, OL); limb(g, pts, w, col); };
  const along = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  function hand(g, [x, y], skin, r = 5.2) { g.fillStyle = skin; g.strokeStyle = OL; g.lineWidth = LW; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); }
  function shoe(g, [x, y], col, ang = 0) { g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = col; g.strokeStyle = OL; g.lineWidth = LW;
    g.beginPath(); g.moveTo(-9, 6); g.quadraticCurveTo(-10, -3, -2, -3); g.quadraticCurveTo(12, -2, 12, 5); g.closePath(); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-5, -1, 8, 2); g.restore(); }
  function torso(g, B, col) { const a = B.shL, b = B.shR, c2 = B.hipR, d = B.hipL;
    g.beginPath(); g.moveTo(a[0] - 3, a[1] + 12); g.quadraticCurveTo(a[0] - 2, a[1] - 3, a[0] + 10, a[1] - 3); g.lineTo(b[0] - 10, b[1] - 3); g.quadraticCurveTo(b[0] + 2, b[1] - 3, b[0] + 3, b[1] + 12);
    g.lineTo(c2[0] + 3, c2[1] + 2); g.lineTo(d[0] - 3, d[1] + 2); g.closePath(); g.fillStyle = col; g.fill();
    g.save(); g.clip(); g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(Math.max(a[0], d[0]) + (b[0] - a[0]) * .62, a[1] - 6, 60, c2[1] - a[1] + 12); g.restore();
    g.strokeStyle = OL; g.lineWidth = LW; g.lineJoin = 'round'; g.stroke(); }
  function head(g, x, y, r, o) {
    const skin = o.skin, hair = o.hair; g.save(); g.translate(x, y); if (o.tilt) g.rotate(o.tilt);
    g.strokeStyle = OL; g.lineWidth = LW; g.lineJoin = 'round'; g.lineCap = 'round';
    if (o.long) { g.fillStyle = hair; g.beginPath(); g.moveTo(-r * .98, -r * .2); g.quadraticCurveTo(-r * 1.25, r * .9, -r * .8, r * 1.3); g.lineTo(r * .8, r * 1.3); g.quadraticCurveTo(r * 1.25, r * .9, r * .98, -r * .2); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle = skin; [-1, 1].forEach(s => { g.beginPath(); g.ellipse(s * r * .88, r * .12, r * .2, r * .26, 0, 0, 7); g.fill(); g.stroke(); });
    g.beginPath(); g.ellipse(0, 0, r * .86, r, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = hair;
    if (o.age === 'old') [-1, 1].forEach(s => { g.beginPath(); g.ellipse(s * r * .8, -r * .12, r * .2, r * .4, s * .25, 0, 7); g.fill(); g.stroke(); });
    else { g.beginPath(); g.moveTo(-r * .88, r * .1); g.bezierCurveTo(-r * 1.05, -r * .95, -r * .4, -r * 1.25, 0, -r * 1.12); g.bezierCurveTo(r * .5, -r * 1.25, r * 1.05, -r * .95, r * .88, r * .1);
      if (o.long) { g.quadraticCurveTo(r * .7, -r * .55, r * .05, -r * .5); g.quadraticCurveTo(-r * .6, -r * .5, -r * .88, r * .1); }
      else { [[.8, -.3], [.6, -.44], [.4, -.32], [.18, -.5], [-.06, -.36], [-.3, -.52], [-.52, -.36], [-.72, -.42], [-.84, -.2]].forEach(([a, b]) => g.lineTo(r * a, r * b)); }
      g.closePath(); g.fill(); g.stroke(); }
    // seja
    const m = o.mood, ey = -r * .02, ex = r * .34; g.lineWidth = 2.2;
    g.fillStyle = 'rgba(255,110,110,.25)'; [-1, 1].forEach(s => { g.beginPath(); g.ellipse(s * r * .52, r * .34, r * .15, r * .09, 0, 0, 7); g.fill(); });
    g.fillStyle = OL;
    if (m === 'ok') { [-1, 1].forEach(s => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(s * ex, ey, r * .17, r * .2, 0, 0, 7); g.fill(); g.lineWidth = 1.8; g.stroke(); g.fillStyle = OL; g.beginPath(); g.arc(s * ex + r * .03, ey + r * .03, r * .08, 0, 7); g.fill(); });
      g.lineWidth = 2.6; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * (ex - r * .16), ey - r * .32); g.lineTo(s * (ex + r * .14), ey - r * .36); g.stroke(); });
      g.lineWidth = 2.2; g.beginPath(); g.arc(0, r * .36, r * .24, .2 * Math.PI, .8 * Math.PI); g.stroke(); }
    else if (m === 'out') { [-1, 1].forEach(s => { g.beginPath(); g.arc(s * ex, ey - r * .04, r * .15, .1 * Math.PI, .9 * Math.PI); g.stroke(); }); g.beginPath(); g.moveTo(-r * .14, r * .52); g.lineTo(r * .14, r * .52); g.stroke(); }
    else { [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * (ex + r * .17), ey - r * .08); g.lineTo(s * (ex - r * .1), ey); g.lineTo(s * (ex + r * .17), ey + r * .08); g.stroke();
        g.lineWidth = 2.6; g.beginPath(); g.moveTo(s * (ex + r * .2), ey - r * .26); g.lineTo(s * (ex - r * .14), ey - r * .38); g.stroke(); g.lineWidth = 2.2; });
      if (m === 'cry' && !o.calm) { g.fillStyle = '#6a1f24'; g.beginPath(); g.ellipse(0, r * .5, r * .2, r * .15, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#7fc8ff'; [-1, 1].forEach((s, i) => { g.beginPath(); g.arc(s * (ex + 1), ey + r * .22 + ((T.now * 22 + i * 6) % (r * .6)), 2.2, 0, 7); g.fill(); }); }
      else { g.beginPath(); g.moveTo(-r * .22, r * .52); g.quadraticCurveTo(-r * .1, r * .42, 0, r * .52); g.quadraticCurveTo(r * .1, r * .62, r * .22, r * .52); g.stroke(); } }
    g.lineWidth = 2; g.beginPath(); g.moveTo(-r * .04, r * .06); g.quadraticCurveTo(r * .14, r * .2, -r * .04, r * .24); g.stroke(); // deguns
    if (o.extra) o.extra(r); g.restore(); }
  // viss tēls pēc punktiem B (o: skin, shirt, pants, hair, long, age, mood, sleeve 'short'|'long', armCol, deco(g) – virs krekla, extra – galvai)
  function body(g, B, o) { const skin = o.skin, shoeC = o.shoe || '#26242c';
    [B.legR, B.legL].forEach(l => { cap(g, l, 14, o.pants); const n = l.length, a = l[n - 2], b = l[n - 1]; cap(g, [along(a, b, .8), b], 16, sh(o.pants, 1.22)); });
    shoe(g, B.legR[B.legR.length - 1], shoeC, B.shoeA); shoe(g, B.legL[B.legL.length - 1], shoeC, B.shoeA);
    const [nx, ny] = B.neck; g.fillStyle = skin; g.strokeStyle = OL; g.lineWidth = LW; g.beginPath(); g.rect(nx - B.hr * .26, B.head[1] + B.hr * .6, B.hr * .52, ny - B.head[1] - B.hr * .4); g.fill(); g.stroke();
    torso(g, B, o.shirt);
    g.fillStyle = skin; g.beginPath(); g.arc(nx, B.shL[1] - 3, B.hr * .34, .05 * Math.PI, .95 * Math.PI); g.fill(); g.stroke(); // kakla izgriezums
    if (o.deco) o.deco(g);
    [[B.armL, o.shirt], [B.armR, o.armCol || o.shirt]].forEach(([a, col]) => { if (o.sleeve === 'long') cap(g, a, 10, col); else { cap(g, a, 9, skin); cap(g, [a[0], along(a[0], a[1], .7)], 13, col); } });
    hand(g, B.armL[B.armL.length - 1], skin); hand(g, B.armR[B.armR.length - 1], skin);
    head(g, B.head[0], B.head[1], B.hr, o); }
  // mediķis (spēlētāja tēls ātrās palīdzības formā; izskats no frizētavas – LOOK)
  function medic(g, x, ground, s) { const L = (typeof LOOK !== 'undefined' && LOOK) || {}, skin = L.skin || '#f2c9a0', uni = '#2e8b57'; g.save(); g.translate(x, ground); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0, 2, 30, 6, 0, 0, 7); g.fill();
    const B = { hr: 16, shoeA: 0, head: [0, -130], neck: [0, -106], shL: [-17, -102], shR: [17, -102], hipL: [-14, -56], hipR: [14, -56],
      armL: [[-18, -96], [-23, -76], [-22, -56]], armR: [[18, -96], [25, -76], [27, -58]], legL: [[-7, -56], [-8, -30], [-8, -8]], legR: [[7, -56], [8, -30], [8, -8]] };
    const hat = L.hat || 'cap', hc = L.cap || '#1b1b1f';
    body(g, B, { skin, shirt: uni, pants: '#1f3a5f', hair: hc, age: 'adult', mood: 'ok', sleeve: 'long',
      deco: g => { g.fillStyle = '#f4d03f'; g.fillRect(-16, -84, 32, 4.5); g.fillRect(-15, -70, 30, 4.5); g.fillStyle = '#fff'; g.font = 'bold 8px system-ui'; g.textAlign = 'center'; g.fillText('112', 0, -90); },
      extra: r => { g.strokeStyle = OL; g.lineWidth = LW; g.fillStyle = hc;
        if (hat === 'cap') { g.beginPath(); g.ellipse(0, -r * .4, r * .95, r * .72, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.roundRect(-r * .1, -r * .5, r * 1.35, r * .22, 3); g.fill(); g.stroke(); }
        else if (hat === 'beanie') { g.beginPath(); g.ellipse(0, -r * .32, r * .96, r * .84, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -r * 1.18, r * .2, 0, 7); g.fill(); g.stroke(); } } });
    g.fillStyle = '#d63031'; g.strokeStyle = OL; g.lineWidth = LW; g.beginPath(); g.roundRect(18, -62, 22, 16, 3); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(27, -59, 4, 10); g.fillRect(24, -56, 10, 4);
    hand(g, B.armR[2], skin);
    g.restore(); }
  // radniecīgas zonas: galva ⊃ seja, deguns; kājas ⊃ ceļgals, augšstilbs; roka ⊃ plauksta
  const fits = (t, b) => t === b || t === 'body' || (t === 'head' && (b === 'face' || b === 'nose')) || (t === 'face' && (b === 'nose' || b === 'head')) || (t === 'nose' && b === 'face') || (t === 'legs' && (b === 'knee' || b === 'thigh')) || (t === 'armR' && b === 'handR') || (t === 'handR' && b === 'armR') || (t === 'chest' && b === 'body');
  const zoneOf = (c, id) => { const z = (c.zones && c.zones[id]) || TOOLS[id].z; return z === 'wound' ? c.inj.z : z; };
  // ---- fons un rekvizīti ----
  function bg(g, c) {
    const pl = c.place, night = c.night;
    const sky = g.createLinearGradient(0, 0, 0, 170); sky.addColorStop(0, night ? '#1b2346' : pl === 'concert' ? '#ffb36b' : '#8fd0ff'); sky.addColorStop(1, night ? '#3a3a6a' : pl === 'concert' ? '#ffe2a8' : '#dff2ff');
    if (pl === 'kitchen') { g.fillStyle = '#f3e6d3'; g.fillRect(0, 0, SW, SH); g.strokeStyle = '#e2d2bb'; g.lineWidth = 2; for (let x = 0; x < SW; x += 32) for (let y = 0; y < 170; y += 32) g.strokeRect(x, y, 32, 32);
      g.fillStyle = '#c9a77c'; g.fillRect(0, 170, SW, 130); g.fillStyle = '#8e6b47'; g.fillRect(330, 120, 140, 14); g.fillRect(345, 134, 10, 70); g.fillRect(450, 134, 10, 70); return; }
    if (pl === 'school') { g.fillStyle = sky; g.fillRect(0, 0, SW, 170); g.fillStyle = '#b5553d'; g.fillRect(0, 30, SW, 140); g.strokeStyle = '#9c4430'; g.lineWidth = 1;
      for (let y = 30; y < 170; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(SW, y); g.stroke(); for (let x = (y / 14 % 2) * 20; x < SW; x += 40) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 14); g.stroke(); } }
      g.fillStyle = '#cfe8ff'; [40, 160, 330].forEach(x => { g.fillRect(x, 50, 80, 50); g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(x, 50, 80, 50); }); g.fillStyle = '#7f8c8d'; g.fillRect(0, 170, SW, 130); return; }
    g.fillStyle = sky; g.fillRect(0, 0, SW, 170);
    if (c.sun && !night) { g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(70, 48, 26, 0, 7); g.fill(); g.fillStyle = 'rgba(255,240,150,.35)'; g.beginPath(); g.arc(70, 48, 48 + Math.sin(T.now * 3) * 4, 0, 7); g.fill(); }
    if (night) { g.fillStyle = '#fff'; for (let i = 0; i < 30; i++) g.fillRect((i * 97) % SW, (i * 53) % 120, 2, 2); g.fillStyle = '#f5f1d0'; g.beginPath(); g.arc(400, 50, 18, 0, 7); g.fill(); }
    if (pl === 'street') { g.fillStyle = '#d9cbb7'; g.fillRect(0, 40, 150, 130); g.fillStyle = '#c8b59c'; g.fillRect(160, 20, 140, 150); g.fillStyle = '#e3d6c3'; g.fillRect(310, 50, 170, 120);
      g.fillStyle = night ? '#ffd76a' : '#9fc3e0'; [[20, 60], [80, 60], [20, 110], [80, 110], [180, 40], [240, 40], [180, 95], [240, 95], [330, 70], [400, 70], [330, 115], [400, 115]].forEach(([x, y]) => g.fillRect(x, y, 40, 30));
      g.fillStyle = '#c9c2b6'; g.fillRect(0, 170, SW, 130); g.fillStyle = '#b6ae9f'; for (let x = 0; x < SW; x += 60) g.fillRect(x, 170, 2, 130); return; }
    if (pl === 'concert') { g.fillStyle = '#2b2b3a'; g.fillRect(250, 60, 220, 90); g.fillStyle = '#444'; g.fillRect(250, 50, 220, 12);
      ['#ff4fd8', '#5ac8ff', '#ffd34d'].forEach((col, i) => { g.fillStyle = col; g.globalAlpha = .5 + .3 * Math.sin(T.now * 4 + i); g.beginPath(); g.moveTo(290 + i * 70, 62); g.lineTo(260 + i * 70, 150); g.lineTo(320 + i * 70, 150); g.fill(); }); g.globalAlpha = 1;
      g.fillStyle = '#5a4a6a'; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(250 + i * 19, 158, 9, 0, 7); g.fill(); } }
    g.fillStyle = pl === 'playground' ? '#e8d39a' : '#7cc46a'; g.fillRect(0, 170, SW, 130);
    if (pl === 'park' || pl === 'garden' || pl === 'concert') { [[30, 120], [130, 112], [420, 118]].forEach(([x, y], i) => { if (pl === 'concert' && i) return; g.fillStyle = '#6b4a2e'; g.fillRect(x - 4, y, 8, 50); g.fillStyle = '#3f8f3a'; g.beginPath(); g.arc(x, y, 30, 0, 7); g.fill(); g.fillStyle = '#5bb04f'; g.beginPath(); g.arc(x - 8, y - 8, 16, 0, 7); g.fill(); }); }
    if (pl === 'park') { g.fillStyle = '#e7dcc4'; g.beginPath(); g.moveTo(0, 290); g.bezierCurveTo(150, 230, 330, 230, 480, 200); g.lineTo(480, 230); g.bezierCurveTo(330, 260, 150, 260, 0, 300); g.fill(); }
    if (pl === 'garden') { g.strokeStyle = '#fff'; g.lineWidth = 5; for (let x = 0; x < SW; x += 26) { g.beginPath(); g.moveTo(x, 172); g.lineTo(x, 132); g.stroke(); } g.beginPath(); g.moveTo(0, 145); g.lineTo(SW, 145); g.stroke();
      const fl = ['#ff5a7a', '#ffd34d', '#b388ff', '#ff8a3d']; for (let i = 0; i < 16; i++) { g.fillStyle = '#3f8f3a'; g.fillRect(20 + i * 29, 176, 2, 14); g.fillStyle = fl[i % 4]; g.beginPath(); g.arc(21 + i * 29, 176, 6, 0, 7); g.fill(); } }
  }
  function prop(g, c) {
    const p = c.prop;
    if (p === 'bike') { g.save(); g.translate(412, 262); g.rotate(-.15); g.strokeStyle = '#e74c3c'; g.lineWidth = 5; g.beginPath(); g.arc(-40, 0, 22, 0, 7); g.arc(40, 0, 22, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-40, 0); g.lineTo(-5, -30); g.lineTo(30, -30); g.lineTo(40, 0); g.moveTo(-5, -30); g.lineTo(5, 0); g.lineTo(-40, 0); g.stroke(); g.restore();
      g.fillStyle = '#2c3e50'; g.beginPath(); g.ellipse(330, 286, 18, 10, 0, 0, 7); g.fill(); g.fillStyle = '#e74c3c'; g.beginPath(); g.arc(330, 280, 14, Math.PI, 0); g.fill(); } // ķivere
    else if (p === 'ball') { g.fillStyle = '#ff8a3d'; g.beginPath(); g.arc(400, 270, 18, 0, 7); g.fill(); g.strokeStyle = '#7a3a10'; g.lineWidth = 2; g.beginPath(); g.arc(400, 270, 18, 0, 7); g.moveTo(382, 270); g.lineTo(418, 270); g.stroke(); }
    else if (p === 'benchP') { g.fillStyle = '#8e6b47'; g.fillRect(310, 196, 150, 10); g.fillRect(310, 176, 150, 8); g.fillStyle = '#555'; g.fillRect(320, 206, 6, 30); g.fillRect(444, 206, 6, 30); }
    else if (p === 'swing') { g.strokeStyle = '#555'; g.lineWidth = 6; g.beginPath(); g.moveTo(320, 260); g.lineTo(350, 70); g.lineTo(450, 70); g.lineTo(470, 260); g.stroke(); g.lineWidth = 2; const a = Math.sin(T.now * 1.5) * .15; g.save(); g.translate(400, 72); g.rotate(a); g.beginPath(); g.moveTo(-15, 0); g.lineTo(-15, 120); g.moveTo(15, 0); g.lineTo(15, 120); g.stroke(); g.fillStyle = '#e74c3c'; g.fillRect(-20, 118, 40, 8); g.restore(); }
    else if (p === 'tea') { g.fillStyle = '#fff'; g.save(); g.translate(390, 118); g.rotate(1.3); g.fillRect(-10, -14, 20, 24); g.restore(); g.fillStyle = 'rgba(160,90,40,.55)'; g.beginPath(); g.ellipse(400, 128, 30, 6, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(392 + i * 8, 106 - ((T.now * 20 + i * 7) % 20), 3, 0, 7); g.fill(); } }
    else if (p === 'cones') { g.fillStyle = '#ff7a1a'; [[340, 250], [400, 262], [455, 248]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y - 30); g.lineTo(x - 12, y); g.lineTo(x + 12, y); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 7, y - 16, 14, 4); g.fillStyle = '#ff7a1a'; }); }
    else if (p === 'hive') { g.fillStyle = '#e6b84a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(410, 200 - i * 16, 36 - i * 5, 10, 0, 0, 7); g.fill(); } g.fillStyle = '#3a2a10'; g.beginPath(); g.arc(410, 205, 5, 0, 7); g.fill();
      for (let i = 0; i < 4; i++) { const a = T.now * 2 + i * 1.6, x = 410 + Math.cos(a) * (40 + i * 6), y = 160 + Math.sin(a * 1.3) * 26; g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(x, y, 5, 3.5, 0, 0, 7); g.fill(); g.fillStyle = '#222'; g.fillRect(x - 1, y - 3, 2, 6); } }
    else if (p === 'stage' && c.sun) {}
  }
  // ---- pacients ----
  function patient(g, c, st, P) {
    const p = c.p, skin = st.pale ? '#f3e2d6' : (p.skin || '#f2c9a0'), shirt = p.shirt, pants = p.pants, hair = p.hair, A = st.applied;
    if (A.has('shade')) { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(240, 256, 190, 40, 0, 0, 7); g.fill(); }
    const sg = g.createRadialGradient(P.lie ? 214 : 255, P.lie ? 258 : 280, 4, P.lie ? 214 : 255, P.lie ? 258 : 280, P.lie ? 130 : 80); sg.addColorStop(0, 'rgba(0,0,0,.3)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sg; g.beginPath(); g.ellipse(P.lie ? 214 : 260, P.lie ? 258 : 278, P.lie ? 120 : 85, P.lie ? 40 : 14, 0, 0, 7); g.fill();
    if (P.bench) { g.fillStyle = '#8e6b47'; g.strokeStyle = OL; g.lineWidth = LW; g.beginPath(); g.roundRect(160, 222, 170, 10, 3); g.fill(); g.stroke(); g.beginPath(); g.roundRect(160, 196, 170, 9, 3); g.fill(); g.stroke(); g.fillStyle = '#555'; g.fillRect(170, 232, 6, 46); g.fillRect(314, 232, 6, 46); }
    if (P.lie && A.has('legs')) { g.fillStyle = '#3d6fb6'; g.strokeStyle = OL; g.lineWidth = LW; g.beginPath(); g.roundRect(278, 222, 44, 60, 8); g.fill(); g.stroke(); } // soma zem kājām
    const fr = c.inj.k === 'fracture' && !A.has('splint'), sweat = st.sweat, mood = st.mood, nb = c.inj.k === 'nosebleed' && !(A.has('lean') && A.has('pinch')), swollen = c.inj.k === 'swollen' && !A.has('epi');
    const o = { skin, shirt, pants, hair, long: p.long, age: p.age, mood, calm: A.has('calm'), sleeve: 'short', armCol: fr ? sh(shirt, .9) : shirt, tilt: P.lie ? 0 : A.has('lean') ? .18 : A.has('back') ? -.22 : 0, extra: rr => {
      if (swollen) { g.fillStyle = 'rgba(230,80,80,.28)'; g.beginPath(); g.ellipse(0, rr * .1, rr * .9, rr * .95, 0, 0, 7); g.fill(); g.fillStyle = '#d0505a'; g.beginPath(); g.ellipse(0, rr * .5, rr * .3, rr * .14, 0, 0, 7); g.fill(); }
      if (sweat) { g.fillStyle = '#7fc8ff'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-rr * .5 + i * rr * .5, -rr * .5 + ((T.now * 12 + i * 4) % (rr * .5)), 2.2, 0, 7); g.fill(); } }
      if (nb) { g.fillStyle = '#c0182b'; g.fillRect(-1.5, rr * .26, 3, rr * .2); for (let i = 0; i < 2; i++) { const yy = rr * .46 + ((T.now * 34 + i * 10) % (rr * .9)); g.beginPath(); g.arc(A.has('back') ? 0 : .5, yy, 2, 0, 7); g.fill(); } } } };
    if (P.lie) { g.save(); g.translate(P.xf[0], P.xf[1]); g.rotate(-Math.PI / 2); body(g, P.L, o); g.restore(); } else body(g, P, o);
    // traumas
    const Z = P.Z;
    if (c.inj.k === 'scrape' && !st.applied.has('plaster')) { const [x, y] = Z.knee; g.fillStyle = st.applied.has('wash') ? '#f0a0a0' : '#c0392b'; g.beginPath(); g.ellipse(x, y, 8, 6, .3, 0, 7); g.fill(); if (!st.applied.has('wash')) { g.fillStyle = '#7a1a10'; for (let i = 0; i < 5; i++) g.fillRect(x - 6 + (i * 5) % 12, y - 4 + (i * 7) % 8, 1.6, 1.6); } }
    if (c.inj.k === 'burn' && !st.applied.has('bandage')) { const [x, y] = Z.handR; g.fillStyle = st.applied.has('cool') ? '#f2a08e' : '#e2453a'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.fillStyle = '#ffe6d0'; [[3, -3], [-3, 2], [4, 4]].forEach(([a, b]) => { g.beginPath(); g.arc(x + a, y + b, 2.4, 0, 7); g.fill(); }); }
    if (c.inj.k === 'fracture' && !st.applied.has('splint')) { const [x, y] = Z.armR; g.fillStyle = 'rgba(140,60,160,.45)'; g.beginPath(); g.ellipse(x, y, 12, 8, 0, 0, 7); g.fill(); }
    if (c.inj.sting && !st.applied.has('sting')) { const [x, y] = Z[c.inj.sting]; g.fillStyle = '#e74c3c'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); g.fillStyle = '#111'; g.fillRect(x - 1, y - 6, 2, 6); }
    if (c.inj.k === 'swollen' && !st.applied.has('epi')) { g.fillStyle = 'rgba(220,40,60,.55)'; const [cx, cy] = Z.chest; [[-14, -6], [12, 4], [-2, 14], [8, -12]].forEach(([dx, dy]) => { g.beginPath(); g.arc(cx + dx, cy + dy, 3.4, 0, 7); g.fill(); }); }
    if ((c.inj.k === 'wheeze' && !st.applied.has('inhaler')) || (c.inj.k === 'swollen' && !st.applied.has('epi'))) { const [x, y] = Z.face; g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { const o = (T.now * 30 + i * 8) % 24; g.beginPath(); g.arc(x + 26 + o, y, 6, -.8, .8); g.stroke(); } }
    if (st.mood === 'out' && c.inj.k === 'out') { g.fillStyle = 'rgba(255,255,255,.9)'; g.font = 'bold 18px system-ui'; g.textAlign = 'center'; g.fillText('Neelpo!', P.Z.chest[0], P.Z.chest[1] - 40); }
  }
  // ---- uzliktās lietas ----
  function applied(g, c, st, P) {
    const Z = P.Z, at = id => Z[zoneOf(c, id)] || Z.body, A = st.applied;
    const box = (x, y, w, h, col, rot = 0, r = 4) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, r); g.fill(); g.restore(); };
    if (A.has('plaster')) { const [x, y] = at('plaster'); box(x, y, 30, 18, '#f1d2a8', .3); box(x, y, 12, 14, '#fff3e0', .3, 2); }
    if (A.has('cold') && !A.has('splint') || A.has('cold') && zoneOf(c, 'cold') !== 'armR') { const [x, y] = at('cold'); box(x + 2, y - 4, 28, 20, '#5ab4f0', -.2, 6); g.fillStyle = '#fff'; g.font = '11px system-ui'; g.textAlign = 'center'; g.fillText('❄', x + 2, y); }
    if (A.has('ice')) { const [x, y] = at('ice'); box(x, y, 16, 16, '#d8f3ff', .4, 3); }
    if (A.has('splint')) { const [x, y] = at('splint'), [x1, y1] = P.armR ? P.armR[1] : [x - 20, y], [x2, y2] = P.armR ? P.armR[2] : [x + 20, y]; g.save(); limb(g, [[x1, y1 - 7], [x2, y2 - 7]], 6, '#8e6b47'); limb(g, [[x1, y1 + 7], [x2, y2 + 7]], 6, '#8e6b47');
      g.fillStyle = '#fff'; [0.25, 0.75].forEach(t => { const sx = x1 + (x2 - x1) * t, sy = y1 + (y2 - y1) * t; g.fillRect(sx - 4, sy - 11, 8, 22); }); g.restore();
      if (A.has('cold')) { box(x, y - 16, 26, 16, '#5ab4f0', 0, 6); } }
    if (A.has('bandage')) { const [x, y] = at('bandage'); g.fillStyle = '#fafafa'; for (let i = 0; i < 3; i++) box(x - 8 + i * 8, y, 10, 26, i % 2 ? '#ffffff' : '#ececec', .2, 3); }
    if (A.has('butter')) { const [x, y] = at('butter'); g.fillStyle = 'rgba(255,220,90,.85)'; g.beginPath(); g.ellipse(x, y, 13, 9, 0, 0, 7); g.fill(); }
    if (A.has('cool') && st.fx.cool > 0) { const [x, y] = at('cool'); g.strokeStyle = 'rgba(120,200,255,.8)'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y - 90); g.lineTo(x, y - 6); g.stroke(); g.fillStyle = 'rgba(160,220,255,.8)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x - 12 + Math.random() * 24, y + Math.random() * 10, 2.5, 0, 7); g.fill(); } g.fillStyle = '#fff'; g.font = 'bold 13px system-ui'; g.textAlign = 'center'; g.fillText('⏱ 20 min', x, y - 96); }
    if (A.has('wash') && st.fx.wash > 0) { const [x, y] = at('wash'); g.fillStyle = 'rgba(140,210,255,.9)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(x - 14 + Math.random() * 28, y - 20 + ((T.now * 120 + i * 9) % 30), 2.6, 0, 7); g.fill(); } }
    if (A.has('pinch')) { const [x, y] = Z.nose; g.fillStyle = c.p.skin || '#f2c9a0'; g.beginPath(); g.arc(x - 9, y + 2, 6, 0, 7); g.arc(x + 9, y + 2, 6, 0, 7); g.fill(); g.strokeStyle = '#d4a37a'; g.lineWidth = 1.5; g.stroke(); }
    if (A.has('oxygen')) { const [x, y] = Z.face; g.fillStyle = 'rgba(200,240,255,.55)'; g.beginPath(); g.ellipse(x, y + 2, 14, 11, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(180,220,255,.9)'; g.lineWidth = 2; g.stroke(); limb(g, [[x + 10, y + 8], [x + 60, y + 40], [x + 110, y + 50]], 3, 'rgba(180,220,255,.9)'); }
    if (A.has('inhaler') && st.fx.inhaler > 0) { const [x, y] = Z.face; box(x + 16, y + 4, 16, 10, '#3d8bff', 0, 3); g.fillStyle = `rgba(255,255,255,${st.fx.inhaler})`; g.beginPath(); g.arc(x + 4, y + 2, 10 * (2 - st.fx.inhaler), 0, 7); g.fill(); }
    if (A.has('juice')) { const [x, y] = P.lie ? Z.handL : (P.armL ? P.armL[2] : Z.handL); box(x, y - 10, 14, 22, '#ff9f43', 0, 3); g.fillStyle = '#fff'; g.fillRect(x + 2, y - 26, 2, 10); }
    if (A.has('water')) { const [x, y] = P.lie ? Z.handL : (P.armR ? P.armR[2] : Z.handR); box(x, y - 12, 12, 26, 'rgba(120,190,255,.85)', 0, 3); }
    if (A.has('gluco')) { const [x, y] = Z.handL; box(x - 22, y + 8, 26, 18, '#34495e', 0, 4); g.fillStyle = '#7dff9a'; g.font = 'bold 10px system-ui'; g.textAlign = 'center'; g.fillText(A.has('juice') ? '5.4' : '2.8', x - 22, y + 12); }
    if (A.has('insulin') || A.has('epi')) { const id = A.has('epi') ? 'epi' : 'insulin', [x, y] = at(id); box(x, y - 4, 10, 34, A.has('epi') ? '#f39c12' : '#8e44ad', .5, 4); }
    if (A.has('sting')) { const [x, y] = at('sting'); box(x + 14, y - 6, 22, 12, '#bdc3c7', -.4, 3); }
    if (A.has('shade')) { g.save(); g.fillStyle = '#e74c3c'; g.beginPath(); g.moveTo(140, 92); g.quadraticCurveTo(240, 30, 340, 92); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(205, 70); g.quadraticCurveTo(240, 40, 275, 70); g.lineTo(240, 92); g.fill(); g.strokeStyle = '#555'; g.lineWidth = 4; g.beginPath(); g.moveTo(240, 60); g.lineTo(240, 270); g.stroke(); g.restore(); }
    if (A.has('blanket')) { g.fillStyle = 'rgba(200,60,60,.85)'; if (P.lie) { g.beginPath(); g.roundRect(152, 218, 150, 68, 16); g.fill(); } else { g.beginPath(); g.roundRect(208, P.shL[1] - 2, 64, 66, 14); g.fill(); } }
    if (A.has('monitor')) { const [x, y] = Z.chest; box(x + 120, y - 60, 70, 46, '#1b2133', 0, 6); g.strokeStyle = '#3dff7a'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 60; i++) { const ph = (i + T.now * 30) % 20, v = ph > 8 && ph < 10 ? -14 : ph >= 10 && ph < 11 ? 8 : 0; g.lineTo(x + 90 + i, y - 60 + v); } g.stroke(); }
    if (A.has('aed')) { const [x, y] = Z.chest; box(x - 12, y - 10, 18, 24, '#ecf0f1', -.3, 4); box(x + 18, y + 10, 18, 24, '#ecf0f1', .3, 4); box(x + 70, y + 36, 46, 30, '#f1c40f', 0, 6); g.fillStyle = '#222'; g.font = 'bold 11px system-ui'; g.textAlign = 'center'; g.fillText('AED', x + 70, y + 40);
      limb(g, [[x - 12, y - 10], [x + 70, y + 30]], 2, '#c0392b'); limb(g, [[x + 18, y + 10], [x + 70, y + 30]], 2, '#c0392b'); }
    if (A.has('calm') && st.fx.calm > 0) { const [x, y] = Z.head; g.globalAlpha = Math.min(1, st.fx.calm); g.fillStyle = '#fff'; g.beginPath(); g.roundRect(x + 30, y - 66, 150, 34, 12); g.fill(); g.fillStyle = '#1b2140'; g.font = 'bold 14px system-ui'; g.textAlign = 'left'; g.fillText('Viss būs labi 🙂', x + 42, y - 44); g.globalAlpha = 1; }
  }
  function effects(g, st, dt) { st.fxs = st.fxs.filter(e => (e.t -= dt) > 0);
    for (const e of st.fxs) { const a = Math.min(1, e.t * 2); g.globalAlpha = a;
      if (e.k === 'ok') { g.fillStyle = '#2ecc71'; for (let i = 0; i < 8; i++) { const an = i / 8 * 6.28 + e.t, d = 30 + (1 - e.t) * 30; g.beginPath(); g.arc(e.x + Math.cos(an) * d, e.y + Math.sin(an) * d, 3.5, 0, 7); g.fill(); } g.font = 'bold 22px system-ui'; g.textAlign = 'center'; g.fillText('✔', e.x, e.y - 30 - (1 - e.t) * 20); }
      else if (e.k === 'bad') { g.strokeStyle = '#ff3b4e'; g.lineWidth = 6; g.beginPath(); g.moveTo(e.x - 18, e.y - 18); g.lineTo(e.x + 18, e.y + 18); g.moveTo(e.x + 18, e.y - 18); g.lineTo(e.x - 18, e.y + 18); g.stroke(); g.fillStyle = '#fff'; g.font = 'bold 18px system-ui'; g.textAlign = 'center'; g.fillText('Au!', e.x, e.y - 30); }
      else if (e.k === 'shock') { g.fillStyle = `rgba(255,255,180,${e.t})`; g.fillRect(0, 0, SW, SH); }
      g.globalAlpha = 1; } }
  function drawMedic(g, look, x, y, s) { if (window.APmedic) window.APmedic(g, x, y, s); }

  // ================= montēšana =================
  const ageK = c => c.p.age === 'kid' ? .8 : c.p.age === 'teen' ? .92 : 1, piv = P => P.lie ? [250, 262] : [240, 268];
  window.Treat = { mount(el, c, opt = {}) {
    const st = { pose: c.pose, applied: new Set(), wrong: new Set(), mood: c.inj.k === 'out' ? 'out' : c.p.age === 'kid' ? 'cry' : 'pain', sweat: c.inj.k === 'sweat', pale: c.id === 'faint' || c.id === 'sugar', cond: c.cond || 50, fx: { cool: 0, wash: 0, inhaler: 0, calm: 0 }, fxs: [], hover: null, shocked: false };
    el.innerHTML = `<div class="stageWrap"><canvas class="stage" width="${SW * 2}" height="${SH * 2}"></canvas><div class="cond"><span>🫀 Stāvoklis</span><div class="cb"><i></i></div></div><div class="hint"></div><button class="shockBtn" style="display:none">⚡ Visi atkāpjas – ŠOKS!</button></div>`
      + (opt.interactive ? `<div class="tray">${c.tools.slice().sort(() => Math.random() - .5).map(id => `<div class="tile" data-t="${id}"><i>${TOOLS[id].i}</i><span>${TOOLS[id].n}</span></div>`).join('')}</div>` : '');
    const cv = el.querySelector('canvas'), g = cv.getContext('2d'), hintEl = el.querySelector('.hint'), cb = el.querySelector('.cb i'), shockBtn = el.querySelector('.shockBtn');
    let raf = 0, last = performance.now(), alive = true, hintT = 0;
    const hint = (t, bad) => { hintEl.innerHTML = t; hintEl.className = 'hint on' + (bad ? ' bad' : ''); clearTimeout(hintT); hintT = setTimeout(() => hintEl.classList.remove('on'), 3200); };
    const loop = now => { if (!alive) return; const dt = Math.min(.05, (now - last) / 1000); last = now; T.now += dt;
      for (const k in st.fx) st.fx[k] = Math.max(0, st.fx[k] - dt / 2.2);
      g.setTransform(2, 0, 0, 2, 0, 0); bg(g, c); prop(g, c); const P = geo(c, st), [px, py] = piv(P), ks = ageK(c);
      g.save(); g.translate(px, py); g.scale(ks, ks); g.translate(-px, -py); patient(g, c, st, P); applied(g, c, st, P);
      if (st.hover) { const z = P.Z[st.hover.z] || P.Z.body; g.strokeStyle = st.hover.ok ? 'rgba(46,204,113,.95)' : 'rgba(255,211,77,.9)'; g.lineWidth = 3; g.setLineDash([6, 5]); g.beginPath(); g.arc(z[0], z[1], z[2] + 8 + Math.sin(now / 120) * 3, 0, 7); g.stroke(); g.setLineDash([]); }
      effects(g, st, dt); g.restore();
      medic(g, P.lie ? 440 : 96, 290, P.lie ? .95 : 1.05);
      cb.style.width = st.cond + '%'; cb.style.background = st.cond > 60 ? '#2ecc71' : st.cond > 30 ? '#ffb020' : '#ff3b4e';
      raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const ctrl = { st, destroy() { alive = false; cancelAnimationFrame(raf); }, hint };
    if (!opt.interactive) return ctrl;
    // ---- vilkšana ----
    const toStage = (cx, cy) => { const r = cv.getBoundingClientRect(), x = (cx - r.left) / r.width * SW, y = (cy - r.top) / r.height * SH, [px, py] = piv(geo(c, st)), k = ageK(c); return [px + (x - px) / k, py + (y - py) / k]; };
    const onBody = (x, y) => { const P = geo(c, st); let best = null, bd = 1e9; for (const [k, z] of Object.entries(P.Z)) { if (k === 'body') continue; const d = Math.hypot(x - z[0], y - z[1]); if (d < z[2] + 26 && d < bd) { bd = d; best = k; } }
      if (!best) { const b = P.Z.body; if (Math.hypot(x - b[0], (y - b[1]) * 1.6) < b[2]) best = 'body'; } return best; };
    const isGood = id => c.need.includes(id) || (c.bonus || []).includes(id);
    const apply = (id, x, y) => {
      const tile = el.querySelector(`.tile[data-t="${id}"]`);
      if (!isGood(id)) { st.applied.add(id); st.wrong.add(id); st.cond = Math.max(0, st.cond - 15); st.fxs.push({ k: 'bad', x, y, t: 1.2 }); tile.classList.add('wrong'); opt.sfx && opt.sfx('bad'); hint(`❌ <b>${TOOLS[id].n}</b> – nē! ${TOOLS[id].why || ''}`, true); if (id === 'lie' || id === 'sit') st.pose = id === 'lie' ? c.pose : 'sit'; return; }
      st.applied.add(id); tile.classList.add('done'); const P = geo(c, st), z = P.Z[zoneOf(c, id)] || P.Z.body; st.fxs.push({ k: 'ok', x: z[0], y: z[1], t: 1 }); opt.sfx && opt.sfx('good');
      st.cond = Math.min(100, st.cond + (c.need.includes(id) ? Math.round((96 - (c.cond || 50)) / c.need.length) : 4));
      if (id in st.fx) st.fx[id] = 1;
      if (id === 'sit') st.pose = 'sit';
      if (id === 'juice' && c.id === 'sugar') { st.sweat = false; st.pale = false; }
      if ((id === 'shade' || id === 'water') && c.id === 'faint' && st.applied.has('shade') && st.applied.has('legs')) { st.sweat = false; st.pale = false; }
      if (c.need.every(n => st.applied.has(n)) && c.inj.k !== 'out') st.mood = 'ok';
      if (id === 'cpr' && opt.onCpr) { opt.onCpr(score => { st.cprScore = score; st.cond = Math.min(100, st.cond + Math.round(score / 4)); hint(`❤️ Sirds masāža: ${score}% ritmā. ${c.need.includes('aed') ? 'Tagad defibrilators!' : ''}`); }); return; }
      if (id === 'aed') { shockBtn.style.display = ''; hint('⚡ Defibrilators: „Šoks ieteikts. Neviens nepieskaras pacientam!”'); return; }
      hint(`✅ <b>${TOOLS[id].n}</b> – pareizi!`); };
    shockBtn.onclick = () => { shockBtn.style.display = 'none'; st.fxs.push({ k: 'shock', x: 0, y: 0, t: .8 }); opt.sfx && opt.sfx('shock'); st.shocked = true; st.mood = 'ok'; st.cond = Math.min(100, st.cond + 35); hint('💓 Sirds atkal pukst! Pacients elpo.'); opt.onShock && opt.onShock(); };
    el.querySelectorAll('.tile').forEach(tile => {
      tile.addEventListener('pointerdown', e => { if (tile.classList.contains('done') || tile.classList.contains('wrong')) return; e.preventDefault(); const id = tile.dataset.t;
        const ghost = document.createElement('div'); ghost.className = 'ghost'; ghost.textContent = TOOLS[id].i; document.body.appendChild(ghost); tile.classList.add('drag');
        const mv = ev => { if (ev.pointerId !== e.pointerId) return; ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; const [x, y] = toStage(ev.clientX, ev.clientY), b = onBody(x, y), tz = zoneOf(c, id);
          st.hover = b ? { z: fits(tz, b) || !isGood(id) ? b : tz, ok: fits(tz, b) } : null; };
        mv(e); opt.sfx && opt.sfx('tick');
        const up = ev => { if (ev.pointerId !== e.pointerId) return; removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); ghost.remove(); tile.classList.remove('drag'); st.hover = null;
          const [x, y] = toStage(ev.clientX, ev.clientY), b = onBody(x, y), tz = zoneOf(c, id);
          if (!b) { if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 8) hint(`👆 Velc <b>${TOOLS[id].i} ${TOOLS[id].n}</b> uz pacientu!`); return; }
          if (isGood(id)) { const pre = c.first && c.first[id]; if (pre && !st.applied.has(pre)) { hint(`☝️ Vispirms: <b>${TOOLS[pre].i} ${TOOLS[pre].n}</b>`); return; }
            if (!fits(tz, b)) { hint(`🤔 Ne šeit – to vajag pie ${ZN[tz] || 'pacienta'}.`); return; } }
          apply(id, x, y); opt.onChange && opt.onChange(st); };
        addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up); });
    });
    return ctrl;
  } };
})();
