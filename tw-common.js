// Kopīgās funkcijas visām lapām: lomas (admins / moderatori), iesaukas, tiešsaiste.
// Lomas nosaka pēc konta (uid), nevis pēc vārda – tāpēc ar iesauku nevar uzdoties par adminu.
(function(){
  const TW = window.TW = { adminUid: null, mods: {}, off: 0 };
  const db = firebase.database();
  TW.BAD = ['fuck','shit','bitch','dick','sex','porn','nazi','hitler','pimp','pis','dirs','sūd','sud','kak','huj','hui','bljad','blyat','suka','pidar','pedik','idiot','muļķ','mulk'];
  TW.ready = (async () => {
    try { TW.adminUid = (await db.ref('usernames/tailerboi').get()).val(); } catch (e) {}
    db.ref('roles').on('value', s => { TW.mods = s.val() || {}; document.dispatchEvent(new Event('tw-roles')); }, () => {});
    db.ref('.info/serverTimeOffset').on('value', s => { TW.off = s.val() || 0; });
  })();
  TW.now = () => Date.now() + TW.off;
  TW.role = uid => !uid ? '' : uid === TW.adminUid ? 'admin' : TW.mods[uid] === 'mod' ? 'mod' : '';
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
  // CSS klase vārdam pēc lomas (gold / neon)
  TW.nameHTML = (text, uid) => { const r = TW.role(uid), e = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    return r === 'admin' ? `👑 <span class="gold">${e(text)}</span>` : r === 'mod' ? `🛡️ <span class="neon">${e(text)}</span>` : e(text); };
  // Tiešsaiste visās spēlēs (redz admins un moderatori)
  TW.heartbeat = (uid, info) => {
    const ref = db.ref('online/' + uid); ref.onDisconnect().remove();
    const beat = () => ref.set(Object.assign({ t: firebase.database.ServerValue.TIMESTAMP }, typeof info === 'function' ? info() : info)).catch(() => {});
    beat(); return setInterval(beat, 15000);
  };
})();
