// Kopīgās funkcijas visām lapām: lomas (admins / moderatori), iesaukas, tiešsaiste.
// Lomas nosaka pēc konta (uid), nevis pēc vārda – tāpēc ar iesauku nevar uzdoties par adminu.
(function(){
  const TW = window.TW = { adminUid: null, admins: {}, mods: {}, off: 0 };
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
    @keyframes twBlue{to{background-position:-250% 0}}
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
  // Tiešsaiste visās spēlēs (redz admins un moderatori)
  TW.heartbeat = (uid, info) => {
    const ref = db.ref('online/' + uid);
    const beat = () => { if (TW.active()) ref.set(Object.assign({ t: firebase.database.ServerValue.TIMESTAMP }, typeof info === 'function' ? info() : info)).catch(() => {}); };
    const arm = () => { ref.onDisconnect().remove(); beat(); };
    document.addEventListener('tw-away', () => { ref.remove().catch(() => {}); });
    document.addEventListener('tw-back', arm);
    arm(); return setInterval(beat, 15000);
  };
})();
