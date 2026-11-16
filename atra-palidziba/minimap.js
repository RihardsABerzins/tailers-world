// Karte no Kenney „Minimap Pack” flīzēm (CC0, kenney.nl): 8×8 px flīzes, stili A–F (minimap/A.png … F.png, 5×5 flīzes).
// Pilsēta = 53×53 flīzes: iela katrā 4. rindā/kolonnā (iela – 1 flīze, kvartāls – 3×3). Mazā karte seko mašīnai, lielā rāda visu pilsētu.
// Ielādē pirms game.js; pilsētas dati (N, G, blocks, jams, M, amb …) tiek lasīti tikai zīmējot.
'use strict';
window.KMap = (() => {
  const T = 8, q = new URLSearchParams(location.search).get('map');
  let style = q === 'old' ? null : (/^[A-F]$/.test(q || '') ? q : 'A');
  const imgs = {}, cache = {};
  const load = s => { if (!imgs[s]) { imgs[s] = new Image(); imgs[s].src = `minimap/${s}.png`; } return imgs[s]; };
  if (style) load(style);
  // flīžu numuri (rinda × 5 + kolonna)
  const ROOM = [[0, 1, 2], [5, 6, 7], [10, 11, 12]], EMPTY = 14, DOT = 13, PARK_P = 16, HOUSE = 19, X = 24, JAM_H = 21, JAM_V = 22;
  const CROSS = { 15: 6, 7: 8, 11: 9, 13: 3, 14: 4, 5: 0, 6: 2, 9: 10, 10: 12, 3: 1, 12: 5 }; // biti: 8=augšā, 4=lejā, 2=pa kreisi, 1=pa labi
  // flīze ar citām krāsām: fons → bg, viss pārējais → fg (null = atstāj)
  function tile(s, n, bg, fg) {
    const key = s + n + bg + fg; if (cache[key]) return cache[key];
    const c = document.createElement('canvas'); c.width = c.height = T; const g = c.getContext('2d');
    g.drawImage(imgs[s], (n % 5) * T, (n / 5 | 0) * T, T, T, 0, 0, T, T);
    if (bg || fg) { const d = g.getImageData(0, 0, T, T), p = d.data, b0 = [p[0], p[1], p[2]], hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      const B = bg && hex(bg), F = fg && hex(fg);
      for (let i = 0; i < p.length; i += 4) { const isBg = p[i] === b0[0] && p[i + 1] === b0[1] && p[i + 2] === b0[2], C = isBg ? B : F; if (C) { p[i] = C[0]; p[i + 1] = C[1]; p[i + 2] = C[2]; } }
      g.putImageData(d, 0, 0); }
    return cache[key] = c;
  }
  // pamatkarte (ielas, kvartāli, sastrēgumi) – uzzīmē vienreiz katram stilam
  function base(s) {
    const key = 'base' + s; if (cache[key]) return cache[key];
    const NT = 4 * (N - 1) + 1, c = document.createElement('canvas'); c.width = c.height = NT * T; const g = c.getContext('2d');
    const put = (n, tx, ty, bg, fg) => g.drawImage(tile(s, n, bg, fg), tx * T, ty * T);
    for (let ty = 0; ty < NT; ty++) for (let tx = 0; tx < NT; tx++) {
      const h = ty % 4 === 0, v = tx % 4 === 0, i = tx / 4, j = ty / 4;
      put(h && v ? CROSS[(j > 0) * 8 + (j < N - 1) * 4 + (i > 0) * 2 + (i < N - 1)] : h ? 1 : v ? 5 : EMPTY, tx, ty);
    }
    jams.forEach(k => { const ax = k[0], idx = +k.slice(1, k.indexOf('_')), seg = +k.slice(k.indexOf('_') + 1);
      for (let d = 1; d <= 3; d++) ax === 'h' ? put(JAM_H, seg * 4 + d, idx * 4, null, '#ff4d4d') : put(JAM_V, idx * 4, seg * 4 + d, null, '#ff4d4d'); });
    blocks.forEach(b => { const X0 = b.i * 4 + 1, Y0 = b.j * 4 + 1;
      for (let u = 0; u < 3; u++) for (let w = 0; w < 3; w++) { const tx = X0 + u, ty = Y0 + w, r = (b.i * 7 + b.j * 13 + u * 5 + w * 3) % 9;
        if (b.kind === 'hospital') put(ROOM[w][u], tx, ty, '#ffffff', '#ff4d5e');
        else if (b.kind === 'park') put(r < 4 ? DOT : EMPTY, tx, ty, '#3f7a3a', '#7ccf5c');
        else if (b.kind === 'parking') { if (u === 1 && w === 1) put(PARK_P, tx, ty); }
        else if (b.kind === 'city' && r < 3) put(DOT, tx, ty);
      } });
    return cache[key] = c;
  }
  const W2M = x => (x / (G / 4) + .5) * T; // pasaules koordināte → kartes pikseļi
  function draw(t) {
    const s = style, im = load(s); if (!im.complete || !im.naturalWidth) return false;
    const g = mctx, MW = mini.width, big = mini.classList.contains('big'), B = base(s), z = big ? MW / B.width : 4;
    const bg = tile(s, EMPTY).getContext('2d').getImageData(0, 0, 1, 1).data;
    g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`; g.fillRect(0, 0, MW, MW);
    const ox = big ? 0 : Math.round(MW / 2 - W2M(amb.x) * z), oy = big ? 0 : Math.round(MW / 2 - W2M(amb.y) * z);
    g.setTransform(z, 0, 0, z, ox, oy); g.drawImage(B, 0, 0);
    const icon = (n, x, y, sc, bgc, fgc) => { const k = T * sc; g.drawImage(tile(s, n, bgc, fgc), Math.round(W2M(x) - k / 2), Math.round(W2M(y) - k / 2), k, k); };
    if (M.route && (M.state === 'toPatient' || M.state === 'toHospital')) { g.strokeStyle = '#ffc600'; g.lineWidth = 3; g.lineJoin = 'miter'; g.lineCap = 'square';
      g.beginPath(); M.route.pts.forEach((p, n) => n ? g.lineTo(W2M(p.x), W2M(p.y)) : g.moveTo(W2M(p.x), W2M(p.y))); g.stroke(); }
    FUEL.forEach(f => icon(HOUSE, (f.b.x0 + f.b.x1) / 2, (f.b.y0 + f.b.y1) / 2, big ? 2 : 1.5, null, amb.fuel < 25 && Math.sin(t * 6) > 0 ? '#ffffff' : '#22c55e'));
    if (M.state === 'toPatient' || M.state === 'call') icon(X, M.px, M.py, big ? 2 : 1.5, Math.sin(t * 8) > 0 ? '#ff3b4e' : '#ffffff', Math.sin(t * 8) > 0 ? '#ffffff' : '#ff3b4e');
    // ātrā palīdzība – bultiņa ar melnu apmali
    g.save(); g.translate(W2M(amb.x), W2M(amb.y)); g.rotate(amb.a); const a = big ? 1.6 : 1;
    g.fillStyle = amb.heli ? '#7fd6ff' : '#ffd34d'; g.strokeStyle = '#000'; g.lineWidth = 1.5 * a; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(9 * a, 0); g.lineTo(-6 * a, -6 * a); g.lineTo(-3 * a, 0); g.lineTo(-6 * a, 6 * a); g.closePath(); g.stroke(); g.fill(); g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0);
    return true;
  }
  return { on: () => !!style, draw, set: s => { style = s; } };
})();
