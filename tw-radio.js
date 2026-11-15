// Kopīgais radio visām spēlēm: Latvijas radio stacijas + ik pēc ~8 minūtēm Papīra Lidmašīnu dziesma (tikai izdotās, /music/).
// Lietošana spēlē: <script src="../tw-radio.js"></script>, tad TWRadio.button(elements) – 🎵 poga ar paneli; TWRadio.start() pie pirmā pieskāriena;
// TWRadio.duck(0..1) – klusāk (piem. pie pacienta); TWRadio.controlsHTML() + TWRadio.wire(el) – vadība iestatījumu logā.
// Iestatījumi glabājas localStorage 'twMusic' (vienādi visās spēlēs).
(function () {
  const BASE = new URL('music/', document.currentScript ? document.currentScript.src : location.href).href;
  const TRACKS = [{ t: 'Lido Tu', f: 'lido-tu.mp3' }, { t: 'Tu Vari', f: 'tu-vari.mp3' }, { t: 'Dejot Laiks', f: 'dejot-laiks.mp3' }, { t: 'Peļķe ielas galā', f: 'pelke-ielas-gala.mp3' }, { t: 'Esi reāls', f: 'esi-reals.mp3' },
    { t: 'Mirklis vēsturē', f: 'mirklis.mp3' }, { t: 'Fotomomenti', f: 'fotomomenti.mp3' }, { t: 'Kāpēc nē', f: 'kapec-ne.mp3' }, { t: 'Gravitācija', f: 'gravitacija.mp3' }, { t: 'Dzīve paciņā', f: 'dzive-pacina.mp3' },
    { t: 'Dīvainis ar dziesmu', f: 'divainis-ar-dziesmu.mp3' }, { t: 'Saku paldies', f: 'saku-paldies.mp3' }, { t: 'Kad zvaigznes krīt uz galvas', f: 'kad-zvaigznes-krit.mp3' }, { t: 'Neaizej', f: 'neaizej.mp3' },
    { t: 'Meklēju sajūtas', f: 'mekleju-sajutas.mp3' }, { t: 'Gaismu lej', f: 'gaismu-lej.mp3' }];
  const RADIOS = [{ t: 'Radio TEV', u: 'https://stream.radiotev.lv:8443/radiov' }, { t: 'Radio SWH', u: 'https://live.radioswh.lv:8443/swh_lv' }, { t: 'Latvijas Radio 5 (Pieci)', u: 'https://muste.latvijasradio.lv/pieci/smil:k2.smil/playlist.m3u8', hls: true }];
  const PL_EVERY = 480; // sekundes starp Papīra Lidmašīnu dziesmām
  const R = window.TWRadio = { TRACKS, RADIOS, vol: .6, muted: false, radio: 0, pl: false, i: Math.floor(Math.random() * 5), el: null, hls: null, started: false, nextPL: 0, k: 1, listeners: [] };
  try { const m = JSON.parse(localStorage.getItem('twMusic') || localStorage.getItem('grafitiMusic')); if (m) { R.vol = m.vol ?? .6; R.muted = !!m.muted; R.radio = m.radio || 0; } } catch (e) {}
  const save = () => { try { localStorage.setItem('twMusic', JSON.stringify({ vol: R.vol, muted: R.muted, radio: R.radio })); } catch (e) {} };
  const now = () => performance.now() / 1000;
  R.title = () => (R.muted ? '🔇 ' : '') + (R.pl ? '✈ Papīra Lidmašīnas – ' + TRACKS[R.i].t : '📻 ' + RADIOS[R.radio].t);
  R.playing = () => !!(R.el && !R.el.paused);
  const emit = () => R.listeners.forEach(f => { try { f(R); } catch (e) {} });
  R.onChange = f => { R.listeners.push(f); f(R); };
  function ensure() { if (R.el) return; R.el = new Audio(); R.el.preload = 'none';
    R.el.addEventListener('ended', () => { if (R.pl) { R.i = (R.i + 1) % TRACKS.length; R.playRadio(R.radio); } });
    ['play', 'pause'].forEach(e => R.el.addEventListener(e, emit));
    R.el.addEventListener('error', () => { if (R.pl) { R.i = (R.i + 1) % TRACKS.length; R.playRadio(R.radio); } }); }
  function setSrc(u, hls) { if (R.hls) { R.hls.destroy(); R.hls = null; }
    if (hls && !R.el.canPlayType('application/vnd.apple.mpegurl') && window.Hls && Hls.isSupported()) { R.hls = new Hls(); R.hls.loadSource(u); R.hls.attachMedia(R.el); }
    else if (hls && !R.el.canPlayType('application/vnd.apple.mpegurl') && !window.Hls) { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js'; s.onload = () => setSrc(u, hls); document.head.appendChild(s); }
    else R.el.src = u; }
  R.apply = () => { if (R.el) R.el.volume = Math.max(0, Math.min(1, R.vol * R.k * (R.muted ? 0 : 1))); };
  R.playRadio = r => { ensure(); R.radio = (r + RADIOS.length) % RADIOS.length; R.pl = false; R.nextPL = now() + PL_EVERY; const x = RADIOS[R.radio]; setSrc(x.u, x.hls); R.apply(); R.el.play().catch(() => {}); save(); emit(); };
  R.playPL = () => { ensure(); R.pl = true; setSrc(BASE + TRACKS[R.i].f, false); R.apply(); R.el.play().catch(() => {}); emit(); };
  R.next = () => { R.start(); if (R.pl) { R.i = (R.i + 1) % TRACKS.length; R.playPL(); } else R.playRadio(R.radio + 1); };
  R.prev = () => { R.start(); if (R.pl) { R.i = (R.i - 1 + TRACKS.length) % TRACKS.length; R.playPL(); } else R.playRadio(R.radio - 1); };
  R.toggle = () => { R.start(); if (R.playing()) R.el.pause(); else R.el.play().catch(() => {}); emit(); };
  R.song = () => { R.start(); if (R.pl) R.i = (R.i + 1) % TRACKS.length; R.playPL(); };
  R.setVol = v => { R.vol = Math.max(0, Math.min(1, v)); if (R.muted && R.vol > 0) R.muted = false; R.apply(); save(); emit(); };
  R.mute = () => { R.muted = !R.muted; R.apply(); save(); emit(); };
  R.duck = k => { R.k = k; R.apply(); };
  R.start = () => { if (R.started) return; R.started = true; R.playRadio(R.radio); };
  setInterval(() => { if (R.started && !R.pl && R.playing() && now() > R.nextPL) R.playPL(); }, 2000);
  // ---- vadība iestatījumu logā ----
  R.controlsHTML = () => `<div class="twr"><div class="twrT"></div><div class="twrB"><button data-r="prev">⏮</button><button data-r="toggle">▶</button><button data-r="next">⏭</button><button data-r="mute">🔇</button></div>
    <label class="twrV">🎵 Mūzika <input type="range" min="0" max="100"></label></div>`;
  R.wire = el => { const t = el.querySelector('.twrT'), tg = el.querySelector('[data-r="toggle"]'), mu = el.querySelector('[data-r="mute"]'), vol = el.querySelector('.twrV input');
    el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => R[b.dataset.r]());
    vol.oninput = () => R.setVol(vol.value / 100);
    const up = () => { if (!el.isConnected) return; t.textContent = R.title(); tg.textContent = R.playing() ? '⏸' : '▶'; mu.textContent = R.muted ? '🔊' : '🔇'; vol.value = Math.round(R.vol * 100); };
    R.onChange(up); };
  // stils (vienreiz)
  const css = document.createElement('style'); css.textContent = `.twr{display:grid;gap:8px}.twrT{font-weight:800;font-size:14.5px;min-height:20px}.twrB{display:flex;gap:6px}.twrB button{flex:1;min-height:44px;border-radius:12px;border:1px solid #ffffff33;background:#ffffff14;color:#fff;font-size:18px}
    .twrV{display:flex;align-items:center;gap:10px;font-weight:700;font-size:14px}.twrV input{flex:1;accent-color:#ffd34d}`;
  document.head.appendChild(css);
})();
