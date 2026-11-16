// Kopīgās funkcijas visām lapām: lomas (admins / moderatori), iesaukas, tiešsaiste.
// Lomas nosaka pēc konta (uid), nevis pēc vārda – tāpēc ar iesauku nevar uzdoties par adminu.
(function(){
  const TW = window.TW = { adminUid: null, admins: {}, mods: {}, off: 0 };
  // Pilnais redzamais augstums. iOS „no sākuma ekrāna” (standalone) innerHeight / height:100% neietver apakšējo drošo zonu
  // (mājas indikatoru) → spēles kanva par īsu, apakšā tukša josla. TW.viewH() + CSS mainīgais --twH (atjauno pie resize/pagrieziena).
  const standalone = () => !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));
  TW.viewH = () => { let h = innerHeight;
    if (standalone()) { const land = innerWidth > innerHeight, sh = land ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height); if (sh > h && sh - h < 140) h = sh; }
    return Math.round(h); };
  let twH0 = 0; const setTwH = () => { const h = TW.viewH(); if (h !== twH0) { twH0 = h; document.documentElement.style.setProperty('--twH', h + 'px'); } };
  setTwH(); setInterval(setTwH, 1000); addEventListener('resize', setTwH); addEventListener('orientationchange', () => setTimeout(setTwH, 300)); if (window.visualViewport) visualViewport.addEventListener('resize', setTwH);
  const db = firebase.database();
  TW.BAD = ['fuck','shit','bitch','dick','sex','porn','nazi','hitler','pimp','pis','dirs','sūd','sud','kak','huj','hui','bljad','blyat','suka','pidar','pedik','idiot','muļķ','mulk'];
  TW.ready = (async () => {
    // Admini: lietotājvārdi no TW_ADMINS (tiem jāsakrīt ar firebase/database.rules.json)
    await Promise.all((window.TW_ADMINS || ['tailerboi']).map(async n => { try { const u = (await db.ref('usernames/' + n).get()).val(); if (u) { TW.admins[u] = n; TW.adminUid = TW.adminUid || u; } } catch (e) {} }));
    db.ref('roles').on('value', s => { TW.mods = s.val() || {}; document.dispatchEvent(new Event('tw-roles')); }, () => {});
    db.ref('.info/serverTimeOffset').on('value', s => { TW.off = s.val() || 0; });
  })();
  TW.now = () => Date.now() + TW.off;
  TW.role = uid => !uid ? '' : TW.admins[uid] ? 'admin' : TW.mods[uid] === 'mod' ? 'mod' : '';
  TW.isStaff = uid => !!TW.role(uid);
  TW.badge = role => role === 'admin' ? '👑' : role === 'mod' ? '🛡️' : '';
  // Iesauka: burti (arī latviešu), cipari, atstarpe, _ . - ; bez emoji; 2–16 zīmes
  TW.cleanNick = s => String(s || '').replace(/[^\p{L}\p{N} _.\-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  TW.nickProblem = (n, uid) => {
    if (n.length < 2) return 'Iesaukai vajag vismaz 2 burtus.';
    const l = n.toLowerCase().replace(/[\s_.\-]/g, '');
    if (TW.BAD.some(w => l.includes(w))) return 'Lūdzu, izvēlies pieklājīgu iesauku.';
    if (/tailer|admin|moder/.test(l) && TW.role(uid) !== 'admin') return 'Šo iesauku nevar izmantot.';
    return '';
  };
  TW.display = (name, nick) => nick || name || '';
  // CSS klase vārdam pēc lomas (gold / neon) vai medaļām: 50+ sarkani spīd, 100+ zili spīd
  TW.nameHTML = (text, uid, medals) => { const r = TW.role(uid), e = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    return r === 'admin' ? `👑 <span class="gold">${e(text)}</span>` : r === 'mod' ? `🛡️ <span class="neon">${e(text)}</span>`
      : medals >= 100 ? `<span class="mblue">${e(text)}</span>` : medals >= 50 ? `<span class="mred">${e(text)}</span>` : e(text); };
  { const st = document.createElement('style'); st.textContent = `
    .mred{color:#ff5d6c;font-weight:900;text-shadow:0 0 6px #ff1f3d,0 0 14px #ff1f3d;animation:twRed 1.8s ease-in-out infinite}
    @keyframes twRed{50%{text-shadow:0 0 10px #ff1f3d,0 0 24px #ff4d6a,0 0 34px #ff1f3d88}}
    .mblue{background:linear-gradient(100deg,#2f6bff 0%,#8fd0ff 30%,#ffffff 45%,#8fd0ff 60%,#2f6bff 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:900;filter:drop-shadow(0 0 6px #3d8bffcc) drop-shadow(0 0 14px #2f6bff88);animation:twBlue 2.4s linear infinite}
    @keyframes twBlue{to{background-position:-166.667% 0}}
    @media (prefers-reduced-motion:reduce){.mred,.mblue{animation:none}}`; document.head.appendChild(st); }
  // Aktīvs = lapa redzama un pēdējās 5 min kaut kas spiests. Fonā (lietotne nolaista/aizvērta) atslēdzam
  // savienojumu – serveris uzreiz izdzēš online/ un presence/ ierakstus (onDisconnect). Neaktīvs → tikai izdzēšam ierakstus.
  const IDLE = 5 * 60 * 1000; let lastInput = Date.now(), wasActive = true;
  TW.active = () => !document.hidden && Date.now() - lastInput < IDLE;
  const recheck = () => { const a = TW.active(); if (a !== wasActive) { wasActive = a; document.dispatchEvent(new Event(a ? 'tw-back' : 'tw-away')); } };
  ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(ev => addEventListener(ev, () => { lastInput = Date.now(); if (!wasActive) recheck(); }, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) db.goOffline(); else { lastInput = Date.now(); db.goOnline(); } recheck(); });
  addEventListener('pagehide', () => { db.goOffline(); });
  addEventListener('pageshow', e => { if (e.persisted) { db.goOnline(); recheck(); } });
  setInterval(recheck, 10000);
  // Kopīgā nauda visām spēlēm: wallet/{uid} (skaitlis). Spēle tur savu skaitli un ik pa laikam nosūta starpību ar transakciju,
  // lai divas spēles (vai divas ierīces) viena otru nepārraksta. Katrā spēlē naudu var nopelnīt un iztērēt.
  TW.wallet = {
    get: async uid => (await db.ref('wallet/' + uid).get()).val(),
    // nauda var iet mīnusā (piem. remonts pēc avārijas) – nopelnot parāds nosedzas; pirkumiem spēles pašas prasa pietiekamu naudu
    set: (uid, v) => db.ref('wallet/' + uid).set(Math.round(v || 0)),
    add: (uid, d) => db.ref('wallet/' + uid).transaction(v => Math.round((v || 0) + d)).then(r => r.snapshot.val()),
    watch: (uid, cb) => db.ref('wallet/' + uid).on('value', s => cb(s.val()), () => {}),
  };
  // Tiešsaiste visās spēlēs: online/{uid} (redz admins un moderatori) + playing/{spēle}/{uid} (redz visi ielogotie –
  // „👥 Kas vēl spēlē”: tikai iesauka, līmenis, medaļu skaits un īss statuss). info: {game, where, name, nick, lv}.
  const GAMEKEY = (location.pathname.split('/').filter(Boolean)[0] || '').replace(/\.html$/, '');
  TW.GAMES = { grafiti: ['🎨', 'Graffiti'], 'atra-palidziba': ['🚑', 'Ātrā palīdzība'], skola: ['🏫', 'Skola'], rampa: ['🚀', 'Mega rampa'] };
  let myMedals = 0;
  TW.heartbeat = (uid, info) => {
    const ref = db.ref('online/' + uid), pref = TW.GAMES[GAMEKEY] ? db.ref('playing/' + GAMEKEY + '/' + uid) : null;
    const medals = () => db.ref('ach/' + uid).get().then(s => { if (window.TWA && TWA.count) myMedals = TWA.count(s.val()); }).catch(() => {});
    const beat = () => { if (!TW.active()) return; const i = typeof info === 'function' ? info() : info;
      ref.set(Object.assign({ t: firebase.database.ServerValue.TIMESTAMP }, i)).catch(() => {});
      if (pref && i && i.name) { const p = { n: String(i.name), lv: Math.max(1, Math.round(+i.lv || +(String(i.where || '').match(/Līm\.?\s*(\d+)/) || [])[1] || 1)), m: myMedals, w: String(i.where || '').slice(0, 40), t: firebase.database.ServerValue.TIMESTAMP };
        if (i.nick) p.nk = String(i.nick).slice(0, 16); pref.set(p).catch(() => {}); } };
    const arm = () => { ref.onDisconnect().remove(); if (pref) pref.onDisconnect().remove(); beat(); };
    document.addEventListener('tw-away', () => { ref.remove().catch(() => {}); if (pref) pref.remove().catch(() => {}); });
    document.addEventListener('tw-back', arm);
    medals(); setInterval(medals, 300000);
    arm(); if (pref) TW.who(uid); return setInterval(beat, 15000);
  };
  // 👥 poga zem 🏠 (spēlēs): cik citu spēlētāju tagad spēlē; uzspiežot – saraksts (šajā spēlē + citās spēlēs).
  TW.who = uid => {
    if (TW.who.on || !document.body) return; TW.who.on = true; let all = {};
    const st = document.createElement('style'); st.textContent = `
      #twWho{position:fixed;left:calc(8px + env(safe-area-inset-left));top:calc(62px + env(safe-area-inset-top));z-index:2147482500;height:34px;min-width:48px;padding:0 10px;box-sizing:border-box;border-radius:17px;border:2px solid #ffffff44;background:rgba(16,20,36,.78);color:#fff;font:800 14px system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:4px;cursor:pointer;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);touch-action:manipulation}
      #twWho.has{border-color:#5ef08a;box-shadow:0 0 0 2px #5ef08a44}
      #twWhoOv{position:fixed;inset:0;z-index:2147482600;background:rgba(8,10,22,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:calc(12px + env(safe-area-inset-top)) 14px calc(12px + env(safe-area-inset-bottom));box-sizing:border-box;font-family:system-ui,sans-serif;color:#fff}
      #twWhoOv .p{width:min(440px,100%);max-height:100%;overflow:auto;background:#151a30;border:2px solid #ffffff22;border-radius:18px;padding:14px 14px 10px;box-sizing:border-box;box-shadow:0 10px 40px #000a}
      #twWhoOv h3{margin:0 0 8px;font-size:20px}#twWhoOv h4{margin:12px 0 6px;font-size:14px;color:#aab3d8;font-weight:800}
      #twWhoOv .r{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:#ffffff0d;margin-bottom:6px;font-size:15px}
      #twWhoOv .r .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800}
      #twWhoOv .r .lv{background:#ffd34d;color:#2b1a00;border-radius:10px;padding:2px 8px;font-weight:900;font-size:13px;white-space:nowrap}
      #twWhoOv .r small{display:block;color:#99a3c8;font-weight:600;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #twWhoOv .e{color:#aab3d8;padding:6px 2px}#twWhoOv button{width:100%;min-height:50px;margin-top:8px;border:0;border-radius:14px;background:linear-gradient(160deg,#ffd34d,#ffb020);color:#2b1a00;font:900 18px system-ui,sans-serif}`;
    document.head.appendChild(st);
    const b = document.createElement('button'); b.id = 'twWho'; b.type = 'button'; b.title = 'Kas vēl spēlē'; b.setAttribute('aria-label', 'Kas vēl spēlē'); b.innerHTML = '👥 <b>0</b>'; document.body.appendChild(b);
    const live = () => { const out = [], now = TW.now(); for (const g in all) for (const u in all[g]) { const p = all[g][u]; if (p && now - (p.t || 0) < 60000) out.push(Object.assign({ g, u }, p)); } return out; };
    const e = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const row = p => `<div class="r"><div class="n">${TW.nameHTML(TW.display(p.n, p.nk), p.u, p.m || 0)}${p.u === uid ? ' <span style="color:#99a3c8;font-weight:600">(tu)</span>' : ''}<small>${p.m ? '🏅 ' + (+p.m) + ' · ' : ''}${e(p.w || '')}</small></div><span class="lv">Līm. ${+p.lv || 1}</span></div>`;
    const count = () => { const n = live().filter(p => p.u !== uid).length; b.querySelector('b').textContent = n; b.classList.toggle('has', n > 0); };
    const open = () => { const L = live().sort((a, c) => (c.lv || 0) - (a.lv || 0)), here = L.filter(p => p.g === GAMEKEY), other = L.filter(p => p.g !== GAMEKEY && p.u !== uid);
      const ov = document.createElement('div'); ov.id = 'twWhoOv';
      ov.innerHTML = `<div class="p"><h3>👥 Kas vēl spēlē</h3><h4>${e(TW.GAMES[GAMEKEY][0] + ' ' + TW.GAMES[GAMEKEY][1])}</h4>${here.length ? here.map(row).join('') : '<div class="e">Tikai tu.</div>'}
        <h4>Citās spēlēs</h4>${other.length ? Object.keys(TW.GAMES).filter(g => g !== GAMEKEY).map(g => { const ps = other.filter(p => p.g === g); return ps.length ? `<div style="font-size:13px;color:#ffd34d;font-weight:800;margin:6px 2px 4px">${e(TW.GAMES[g].join(' '))}</div>` + ps.map(row).join('') : ''; }).join('') : '<div class="e">Pagaidām neviens – uzaicini draugu!</div>'}
        <button type="button">Labi</button></div>`;
      ov.addEventListener('pointerdown', ev => ev.stopPropagation()); ov.addEventListener('click', ev => { ev.stopPropagation(); if (ev.target === ov || ev.target.closest('button')) ov.remove(); });
      document.body.appendChild(ov); };
    b.addEventListener('pointerdown', ev => ev.stopPropagation()); b.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); open(); });
    db.ref('playing').on('value', s => { all = s.val() || {}; count(); }, () => { b.remove(); });
    setInterval(count, 15000);
  };
  // Instrukcija pirms spēles: 3–5 bildes ar dažiem vārdiem, pēc tam „Spēlēt!”. Vienāds izskats visās spēlēs.
  // TW.intro(key, slides, force) → Promise (atrisinās, kad aizver). slides: [{img: 'intro/1.webp' | ico: '🚀', t: 'Īss teksts'}].
  // Pirmajā reizē rāda pats (localStorage twIntro:key); force = true – rāda vienmēr (❓ poga iestatījumos / pauzē).
  // opts.i18n – spēle atbalsta angļu valodu (Graffiti): pogas pēc localStorage twLang, netulko (data-notr).
  TW.intro = (key, slides, force, opts) => new Promise(res => {
    const k = 'twIntro:' + key; let seen = false; try { seen = !!localStorage.getItem(k); } catch (e) {}
    if ((seen && !force) || !slides || !slides.length) return res();
    if (!document.getElementById('twIntroCss')) { const st = document.createElement('style'); st.id = 'twIntroCss'; st.textContent = `
      #twIntro{position:fixed;inset:0;z-index:2147482000;background:rgba(8,10,22,.5);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);display:flex;align-items:center;justify-content:center;padding:calc(12px + env(safe-area-inset-top)) 16px calc(12px + env(safe-area-inset-bottom));box-sizing:border-box;font-family:system-ui,sans-serif;color:#fff;touch-action:manipulation;-webkit-user-select:none;user-select:none}
      #twIntro .box{width:min(520px,100%);max-height:100%;display:flex;flex-direction:column;gap:12px;align-items:center}
      #twIntro .pic{width:100%;aspect-ratio:16/10;max-height:52vh;border-radius:18px;background:#1b2140 center/cover no-repeat;display:flex;align-items:center;justify-content:center;font-size:min(30vw,26vh);line-height:1;box-shadow:0 8px 30px #0008;border:3px solid #ffffff22;overflow:hidden}
      #twIntro .pic img{width:100%;height:100%;object-fit:cover;display:block}
      #twIntro .txt{font:900 clamp(20px,5.5vw,30px)/1.2 system-ui,sans-serif;text-align:center;min-height:2.4em;display:flex;align-items:center;text-shadow:0 2px 8px #000a}
      #twIntro .dots{display:flex;gap:8px}#twIntro .dots i{width:10px;height:10px;border-radius:50%;background:#ffffff44}#twIntro .dots i.on{background:#ffd34d;transform:scale(1.25)}
      @supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){#twIntro{background:rgba(8,10,22,.88)}}
      #twIntro .row{display:flex;gap:10px;width:100%}
      #twIntro button{flex:1;min-height:56px;border-radius:16px;border:0;font:900 20px system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
      #twIntro .skip{flex:none;min-height:44px;padding:0 22px;background:#0006;color:#fffd;font-size:16px;border-radius:22px}#twIntro .skip.hide{visibility:hidden}
      #twIntro .next{background:linear-gradient(160deg,#ffd34d,#ffb020);color:#2b1a00;box-shadow:0 4px 0 #b97800}
      #twIntro .next.go{background:linear-gradient(160deg,#5ef08a,#22c55e);color:#062b12;box-shadow:0 4px 0 #15803d}
      @media (orientation:landscape) and (max-height:520px){#twIntro{padding-left:calc(68px + env(safe-area-inset-left))}#twIntro .pic{font-size:40vh}#twIntro .box{width:min(860px,100%);height:100%;display:grid;grid-template-columns:1.6fr 1fr;align-content:center;grid-template-rows:1fr auto auto auto;gap:10px 18px}
        #twIntro .pic{grid-row:1/5;align-self:center;max-height:none;width:100%;height:auto;aspect-ratio:16/10}#twIntro .txt{align-self:end}#twIntro .dots,#twIntro .skip{justify-self:center}}`; document.head.appendChild(st); }
    const ov = document.createElement('div'); ov.id = 'twIntro'; let i = 0, en = false; try { en = !!(opts && opts.i18n) && localStorage.getItem('twLang') === 'en'; } catch (er) {}
    const W = en ? { next: 'Next ▶', play: '▶ Play!', skip: 'Skip' } : { next: 'Tālāk ▶', play: '▶ Spēlēt!', skip: 'Izlaist' };
    const e = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const draw = () => { const s = slides[i], last = i === slides.length - 1;
      ov.innerHTML = `<div class="box"><div class="pic">${s.img ? `<img src="${e(s.img)}" alt="">` : e(s.ico || '')}</div><div class="txt">${e(s.t || '')}</div>
        <div class="dots">${slides.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="row"><button class="next${last ? ' go' : ''}" type="button" data-notr>${last ? W.play : W.next}</button></div><button class="skip${last ? ' hide' : ''}" type="button" data-notr>${W.skip}</button></div>`; };
    const close = () => { try { localStorage.setItem(k, '1'); } catch (er) {} ov.remove(); res(); };
    ov.addEventListener('pointerdown', ev => ev.stopPropagation());
    ov.addEventListener('click', ev => { ev.stopPropagation(); const b = ev.target.closest('button');
      if (b && b.classList.contains('skip')) return close();
      if (b || ev.target.closest('.pic')) { if (i >= slides.length - 1) return close(); i++; draw(); } });
    draw(); slides.forEach(s => { if (s.img) new Image().src = s.img; });
    const add = () => document.body.appendChild(ov); if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  });
  // 🏠 „Uz sākumu” – visās spēlēs (lapas, kas ielādē ../tw-common.js) vienmēr redzama poga kreisajā augšējā stūrī,
  // virs visiem logiem. Pirmais pieskāriens – „Uz sākumu?”, otrais (3 s laikā) – aiziet uz sākumlapu (lai bērns netīšām neiziet).
  const me = document.currentScript, inGame = me && /^\.\.\//.test(me.getAttribute('src') || '');
  if (inGame) {
    const st = document.createElement('style'); st.textContent = `
      #twHome{position:fixed;left:calc(8px + env(safe-area-inset-left));top:calc(8px + env(safe-area-inset-top));z-index:2147483000;height:48px;min-width:48px;padding:0 12px;box-sizing:border-box;border-radius:24px;border:2px solid #ffffff55;background:rgba(16,20,36,.82);color:#fff;font:800 15px system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 16px #0006;cursor:pointer;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);touch-action:manipulation}
      #twHome b{font-size:22px;line-height:1}#twHome span{display:none;white-space:nowrap}#twHome.ask{background:linear-gradient(160deg,#ffd34d,#ffb020);color:#2b1a00;border-color:#fff}#twHome.ask span{display:inline}
      #top{left:calc(64px + env(safe-area-inset-left)) !important} #stat > #home{display:none !important} #hud{left:64px !important}`;
    document.head.appendChild(st);
    const add = () => { if (document.getElementById('twHome')) return; const b = document.createElement('button'); b.id = 'twHome'; b.type = 'button'; b.title = 'Uz sākumlapu'; b.setAttribute('aria-label', 'Uz sākumlapu');
      b.innerHTML = '<b>🏠</b><span>Uz sākumu?</span>'; let t = 0;
      const go = e => { e.preventDefault(); e.stopPropagation(); if (b.classList.contains('ask')) { location.href = '../index.html'; return; }
        b.classList.add('ask'); clearTimeout(t); t = setTimeout(() => b.classList.remove('ask'), 3000); };
      b.addEventListener('pointerdown', e => e.stopPropagation()); b.addEventListener('pointerup', go); b.addEventListener('click', e => e.preventDefault()); document.body.appendChild(b); };
    if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  }
})();
