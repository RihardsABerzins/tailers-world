// Čats, čuksti, draugi un paziņojumi – kopīgs modulis sākumlapai un spēlēm.
// Publiskajā (pilsētas) čatā tikai gatavas frāzes; čukstos brīvs teksts ar rupju vārdu filtru (zvaigznītes).
(function(){
  const db = firebase.database(), TS = firebase.database.ServerValue.TIMESTAMP;
  const S = window.TWS = { me: null, opts: {}, inbox: {}, reqs: {}, friends: {}, blocks: {}, names: {}, open: null, conv: null, convRef: null };

  // ---------- rupju vārdu filtrs ----------
  const norm = w => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const EXACT = ['sex','dick','ass','fuck','shit','bitch','suka','huj','hui','bla','ble','blja','pis','pidars','pidar','pederasts','mauka','kuce','idiots','idiote','idiot','debils','debile','dirsa','dirsu','suds','sudi','sudu','sudus','kaka','penis','vagina','nahuj','nahui','xuj','cunt','twat','dumjs','dumja','stulbs','stulba'];
  const START = ['fuck','fuk','shit','bitch','porn','pizd','pimp','dirs','nahu','huij','bljad','blyat','pidor','pidar','pedik','nigg','wank','cunt','debil','kretin','mauk','sukas','ebat','jeba','jebi','motherf','dickh','asshol'];
  S.clean = text => String(text || '')
    .replace(/[\p{L}\p{N}]+/gu, w => { const n = norm(w); return (EXACT.includes(n) || START.some(s => n.startsWith(s))) ? '★'.repeat(w.length) : w; })
    .replace(/\d[\d\s\-]{6,}\d/g, m => '★'.repeat(m.length)); // telefona numuri u.c. gari cipari
  S.isBad = text => S.clean(text) !== String(text || '');

  // ---------- frāzes pilsētas čatam ----------
  S.PHRASES = ['Čau! 👋','Sveiki visiem!','Kā iet? 🙂','Super! 🔥','Forši zīmē! 🎨','Paldies! 🙏','Nāc šurp!','Ejam uz metro 🚇','Policija! 🚓','Slēpjamies! 🫣','Kur ir kafejnīca? 🍔','Kāds tev līmenis?','Uzzīmēsim kopā?','Esmu jauns te 🆕','Labs darbs! 👍','Ha ha! 😂','Uz redzi! 👋','Atā! ✌️','Wow! 😮','Ups! 😅','Tu esi forša/s! ⭐','Vai būsi mans draugs? 🤝','Drīz atgriezīšos ⏳','Labu nakti! 🌙'];

  // ---------- palīgi ----------
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cid = (a, b) => a < b ? a + '_' + b : b + '_' + a;
  const myName = () => (S.me && (S.me.nick || S.me.name)) || '';
  async function nameOf(uid) { if (S.names[uid]) return S.names[uid];
    try { const v = (await db.ref('stats/' + uid).get()).val() || {}; S.names[uid] = { name: v.name || '?', nick: v.nick || '', level: v.level || 1 }; } catch (e) { S.names[uid] = { name: '?', nick: '', level: 1 }; }
    return S.names[uid]; }
  const disp = n => n.nick || n.name;
  const nameHTML = (text, uid) => window.TW ? TW.nameHTML(text, uid) : esc(text);
  function buzz() { try { navigator.vibrate && navigator.vibrate(20); } catch (e) {} }

  // ---------- UI ----------
  const CSS = `
  .tws-fab{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:60;width:58px;height:58px;border-radius:50%;border:0;background:linear-gradient(135deg,#5ac8ff,#7b2ff7);color:#fff;font-size:26px;box-shadow:0 8px 24px #0008;cursor:pointer}
  .tws-badge{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;border-radius:11px;background:#ff3d5a;color:#fff;font:900 12px system-ui;display:none;align-items:center;justify-content:center;padding:0 6px;border:2px solid #120f24}
  .tws-ov{position:fixed;inset:0;z-index:70;background:#000a;backdrop-filter:blur(4px);display:none;align-items:flex-end;justify-content:center}
  .tws-ov.on{display:flex}
  .tws-sheet{width:min(560px,100%);max-height:88vh;height:88vh;background:#1b1734;color:#fff8ff;border-radius:22px 22px 0 0;display:flex;flex-direction:column;font-family:ui-rounded,system-ui,-apple-system,sans-serif;box-shadow:0 -10px 40px #0009;animation:twsUp .25s both}
  @media (min-height:700px) and (min-width:700px){.tws-ov{align-items:center}.tws-sheet{border-radius:22px;height:min(680px,88vh)}}
  @media (orientation:landscape) and (max-height:520px){.tws-sheet{height:96vh;max-height:96vh;border-radius:16px 16px 0 0}}
  @keyframes twsUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
  .tws-top{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #ffffff1a}
  .tws-top b{flex:1;font-size:19px}
  .tws-x{background:#ffffff1a;border:0;color:#fff;width:44px;height:44px;border-radius:12px;font-size:20px;cursor:pointer}
  .tws-tabs{display:flex;gap:6px;padding:8px 10px}
  .tws-tab{flex:1;min-height:46px;border-radius:14px;border:2px solid #ffffff26;background:#ffffff0f;color:#fff;font:inherit;font-weight:800;font-size:15px;cursor:pointer;position:relative}
  .tws-tab.on{border-color:#ffd34d;background:#ffd34d22}
  .tws-dot{position:absolute;top:6px;right:8px;width:10px;height:10px;border-radius:50%;background:#ff3d5a;display:none}
  .tws-body{flex:1;min-height:70px;overflow:auto;padding:6px 12px 12px;-webkit-overflow-scrolling:touch}
  .tws-row{display:flex;align-items:center;gap:10px;padding:10px;border-radius:14px;background:#ffffff0c;margin-bottom:8px;cursor:pointer}
  .tws-av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#ff5fa2,#ffd34d);display:grid;place-items:center;font-weight:900;color:#1a1300;flex:0 0 auto}
  .tws-nm{flex:1;min-width:0}.tws-nm div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tws-sm{color:#c4bde6;font-size:13px}
  .tws-un{width:12px;height:12px;border-radius:50%;background:#5ac8ff;flex:0 0 auto}
  .tws-btn{min-height:42px;padding:8px 12px;border-radius:12px;border:0;font:inherit;font-weight:800;font-size:14px;cursor:pointer;background:#ffd34d;color:#1a1300}
  .tws-btn.g{background:#ffffff1f;color:#fff}.tws-btn.r{background:#ff6b7a;color:#fff}
  .tws-msgs{display:flex;flex-direction:column;gap:6px}
  .tws-m{max-width:80%;padding:8px 12px;border-radius:16px;background:#ffffff14;align-self:flex-start;word-wrap:break-word;font-size:16px}
  .tws-m.me{align-self:flex-end;background:#7b2ff7}
  .tws-m small{display:block;color:#ffffff99;font-size:11px;margin-top:2px}
  .tws-in{display:flex;gap:8px;padding:10px 12px max(12px,env(safe-area-inset-bottom));border-top:1px solid #ffffff1a}
  .tws-in input{-webkit-user-select:text;user-select:text;flex:1;min-width:0;font:inherit;font-size:17px;padding:12px 14px;border-radius:14px;border:2px solid #ffffff2a;background:#0f0c20;color:#fff;outline:none}
  .tws-ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;padding:8px 12px max(12px,env(safe-area-inset-bottom));border-top:1px solid #ffffff1a;max-height:min(36vh,280px);overflow:auto}
  .tws-ph button{min-height:46px;border-radius:14px;border:2px solid #ffffff26;background:#ffffff12;color:#fff;font:inherit;font-weight:700;font-size:14px;cursor:pointer}
  .tws-empty{color:#c4bde6;text-align:center;padding:24px 10px}
  .tws-toast{position:fixed;left:50%;top:max(12px,env(safe-area-inset-top));transform:translate(-50%,-120%);z-index:80;background:#1b1734;border:2px solid #5ac8ff;color:#fff;border-radius:16px;padding:10px 16px;font:700 15px system-ui;max-width:92vw;box-shadow:0 8px 24px #0009;transition:transform .3s;cursor:pointer}
  .tws-toast.on{transform:translate(-50%,0)}
  .tws-card{padding:16px}.tws-card .acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
  .tws-card .acts .tws-btn{min-height:52px;font-size:15px}
  .tws-add{display:flex;gap:8px;margin:6px 0 12px}.tws-add input{flex:1;min-width:0;font:inherit;font-size:16px;padding:10px 12px;border-radius:12px;border:2px solid #ffffff2a;background:#0f0c20;color:#fff}
  .tws-h{font-weight:900;margin:10px 2px 8px;color:#ffd34d}
  .gold{background:linear-gradient(100deg,#b07a12 0%,#ffd34d 25%,#fff8d0 45%,#ffd34d 60%,#b07a12 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:900}
  .neon{color:#7fdcff;text-shadow:0 0 6px #2ec5ff,0 0 14px #2ec5ff;font-weight:900}`;

  function buildUI() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <button class="tws-fab" id="twsFab" aria-label="Čats">💬<span class="tws-badge" id="twsBadge"></span></button>
      <div class="tws-ov" id="twsOv" data-notr><div class="tws-sheet" id="twsSheet"></div></div>
      <div class="tws-toast" id="twsToast" data-notr></div>`;
    document.body.appendChild(wrap);
    if (S.opts.fab === false) $('twsFab').style.display = 'none';
    $('twsFab').onclick = () => S.openPanel();
    $('twsOv').addEventListener('pointerdown', e => { if (e.target.id === 'twsOv') S.close(); });
  }
  S.close = () => { $('twsOv').classList.remove('on'); S.open = null; if (S.convRef) { S.convRef.off(); S.convRef = null; } S.conv = null; S.opts.onClose && S.opts.onClose(); };
  S.isOpen = () => $('twsOv').classList.contains('on');
  function sheet(html) { $('twsSheet').innerHTML = html; $('twsOv').classList.add('on'); S.opts.onOpen && S.opts.onOpen(); }
  function top(title, back) { return `<div class="tws-top">${back ? '<button class="tws-x" id="twsBack">←</button>' : ''}<b>${title}</b><button class="tws-x" id="twsClose">✕</button></div>`; }
  function wireTop(back) { $('twsClose').onclick = S.close; if (back) $('twsBack').onclick = back; }

  // ---------- panelis ar cilnēm ----------
  S.openPanel = (tab) => {
    tab = tab || S.lastTab || 'dm'; if (tab === 'city' && !S.opts.getCity) tab = 'dm'; S.lastTab = tab;
    const tabs = [['dm','💬 Čuksti'],['fr','👥 Draugi']].concat(S.opts.getCity ? [['city','🏙️ Pilsēta']] : []);
    sheet(top('Čats') + `<div class="tws-tabs">${tabs.map(([k, t]) => `<button class="tws-tab${k === tab ? ' on' : ''}" data-t="${k}">${t}<span class="tws-dot" id="twsDot_${k}"></span></button>`).join('')}</div><div class="tws-body" id="twsBody"></div><div id="twsFoot"></div>`);
    wireTop(); document.querySelectorAll('.tws-tab').forEach(b => b.onclick = () => S.openPanel(b.dataset.t));
    S.open = tab; paintDots();
    if (tab === 'dm') renderInbox(); else if (tab === 'fr') renderFriends(); else renderCity();
  };

  // ---------- čuksti ----------
  function renderInbox() { if (S.open !== 'dm') return;
    const rows = Object.entries(S.inbox).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
    $('twsBody').innerHTML = rows.length ? rows.map(([u, v]) => `<div class="tws-row" data-u="${u}"><div class="tws-av">${esc((v.n || '?')[0].toUpperCase())}</div><div class="tws-nm"><div><b>${nameHTML(v.n || '?', u)}</b></div><div class="tws-sm">${esc(S.clean(v.x || ''))}</div></div>${v.u ? '<span class="tws-un"></span>' : ''}</div>`).join('')
      : '<div class="tws-empty">Vēl nav sarunu.<br>Spēlē pieskaries citam spēlētājam vai atver draugu sarakstu, lai čukstētu. 🤫</div>';
    $('twsBody').querySelectorAll('[data-u]').forEach(r => r.onclick = () => S.openDM(r.dataset.u)); }

  S.openDM = async (uid) => { if (!S.me || uid === S.me.uid) return;
    const n = await nameOf(uid), c = cid(S.me.uid, uid); S.open = 'conv'; S.conv = uid;
    const blocked = !!S.blocks[uid];
    sheet(top(nameHTML(disp(n), uid), () => S.openPanel('dm')) + `<div class="tws-body" id="twsBody"><div class="tws-msgs" id="twsMsgs"><div class="tws-empty">Ielādē…</div></div></div>
      <div style="display:flex;gap:6px;padding:0 12px"><button class="tws-btn g" id="twsCard">👤 Profils</button></div>
      <form class="tws-in" id="twsForm"><input id="twsText" maxlength="300" autocomplete="off" placeholder="${blocked ? 'Tu esi bloķējis šo spēlētāju' : 'Raksti čukstu…'}" ${blocked ? 'disabled' : ''}><button class="tws-btn" ${blocked ? 'disabled' : ''}>➤</button></form>`);
    wireTop(() => S.openPanel('dm')); $('twsCard').onclick = () => S.openPlayer(uid);
    db.ref('inbox/' + S.me.uid + '/' + uid + '/u').set(0).catch(() => {});
    if (S.convRef) S.convRef.off();
    S.convRef = db.ref('dm/' + c).limitToLast(60);
    S.convRef.on('value', s => { const box = $('twsMsgs'); if (!box) return; const arr = [];
      s.forEach(m => { arr.push(m.val()); });
      box.innerHTML = arr.length ? arr.map(m => `<div class="tws-m${m.f === S.me.uid ? ' me' : ''}">${esc(S.clean(m.x))}<small>${m.t ? new Date(m.t).toLocaleTimeString('lv-LV', { hour: '2-digit', minute: '2-digit' }) : ''}</small></div>`).join('') : '<div class="tws-empty">Uzraksti pirmo čukstu! 🤫<br><small>Esi draudzīgs. Nekad nesūti savu adresi, telefona numuru vai paroli.</small></div>';
      const b = $('twsBody'); if (b) b.scrollTop = b.scrollHeight; }, () => {});
    $('twsForm').onsubmit = async e => { e.preventDefault(); const raw = $('twsText').value.trim(); if (!raw) return;
      const x = S.clean(raw).slice(0, 300); $('twsText').value = '';
      try { await db.ref('dm/' + c).push({ f: S.me.uid, x, t: TS });
        await db.ref('inbox/' + uid + '/' + S.me.uid).set({ n: myName(), x, t: Date.now(), u: 1 });
        await db.ref('inbox/' + S.me.uid + '/' + uid).set({ n: disp(n), x, t: Date.now(), u: 0 });
      } catch (err) { toast('Neizdevās nosūtīt – varbūt šis spēlētājs tevi ir bloķējis.'); } };
  };

  // ---------- draugi ----------
  async function renderFriends() { if (S.open !== 'fr') return;
    const reqs = Object.entries(S.reqs), fr = Object.keys(S.friends);
    let h = `<div class="tws-add"><input id="twsAddName" placeholder="Drauga lietotājvārds" autocapitalize="none" spellcheck="false"><button class="tws-btn" id="twsAddBtn">➕ Pievienot</button></div><div class="tws-sm" id="twsAddMsg" style="margin:-6px 2px 8px"></div>`;
    if (reqs.length) h += `<div class="tws-h">🔔 Draudzības pieprasījumi</div>` + reqs.map(([u, v]) => `<div class="tws-row"><div class="tws-av">${esc((v.n || '?')[0].toUpperCase())}</div><div class="tws-nm"><b>${nameHTML(v.n || '?', u)}</b><div class="tws-sm">grib būt tavs draugs</div></div><button class="tws-btn" data-acc="${u}">✓</button><button class="tws-btn g" data-dec="${u}">✕</button></div>`).join('');
    h += `<div class="tws-h">👥 Mani draugi (${fr.length})</div>`;
    if (!fr.length) h += '<div class="tws-empty">Vēl nav draugu. Pievieno pēc lietotājvārda vai pieskaries spēlētājam spēlē!</div>';
    $('twsBody').innerHTML = h + '<div id="twsFrList"></div>';
    const list = await Promise.all(fr.map(async u => [u, await nameOf(u)]));
    if (S.open !== 'fr') return;
    $('twsFrList').innerHTML = list.map(([u, n]) => `<div class="tws-row" data-u="${u}"><div class="tws-av">${esc(disp(n)[0].toUpperCase())}</div><div class="tws-nm"><b>${nameHTML(disp(n), u)}</b><div class="tws-sm">Līmenis ${n.level}</div></div><button class="tws-btn" data-dm="${u}">💬</button></div>`).join('');
    $('twsBody').querySelectorAll('[data-acc]').forEach(b => b.onclick = e => { e.stopPropagation(); S.acceptFriend(b.dataset.acc); });
    $('twsBody').querySelectorAll('[data-dec]').forEach(b => b.onclick = e => { e.stopPropagation(); db.ref('friendReq/' + S.me.uid + '/' + b.dataset.dec).remove(); });
    $('twsBody').querySelectorAll('[data-dm]').forEach(b => b.onclick = e => { e.stopPropagation(); S.openDM(b.dataset.dm); });
    $('twsFrList').querySelectorAll('[data-u]').forEach(r => r.onclick = () => S.openPlayer(r.dataset.u));
    $('twsAddBtn').onclick = async () => { const nm = $('twsAddName').value.trim().toLowerCase(), m = $('twsAddMsg'); if (!nm) return;
      try { const u = (await db.ref('usernames/' + nm).get()).val(); if (!u) { m.textContent = 'Šāds lietotājs nav atrasts.'; return; } if (u === S.me.uid) { m.textContent = 'Tas esi tu 🙂'; return; }
        await S.addFriend(u); m.textContent = '✓ Pieprasījums nosūtīts!'; $('twsAddName').value = ''; } catch (e) { m.textContent = 'Neizdevās.'; } };
  }
  S.addFriend = async uid => { if (S.friends[uid]) return; if (S.reqs[uid]) return S.acceptFriend(uid);
    await db.ref('friendReq/' + uid + '/' + S.me.uid).set({ n: myName(), t: TS }); };
  S.acceptFriend = async uid => { await db.ref('friends/' + S.me.uid + '/' + uid).set(true); await db.ref('friends/' + uid + '/' + S.me.uid).set(true);
    await db.ref('friendReq/' + S.me.uid + '/' + uid).remove(); buzz(); toast('🤝 Jauns draugs!'); };
  S.removeFriend = async uid => { await db.ref('friends/' + S.me.uid + '/' + uid).remove(); await db.ref('friends/' + uid + '/' + S.me.uid).remove().catch(() => {}); };
  S.block = async uid => { await db.ref('blocks/' + S.me.uid + '/' + uid).set(true); await S.removeFriend(uid).catch(() => {}); await db.ref('friendReq/' + S.me.uid + '/' + uid).remove().catch(() => {}); };
  S.unblock = uid => db.ref('blocks/' + S.me.uid + '/' + uid).remove();
  S.report = async (uid, what) => { await db.ref('reports').push({ by: S.me.uid, about: uid, what: what || '', t: TS }); };

  // ---------- spēlētāja kartīte ----------
  S.openPlayer = async (uid) => { if (!S.me || uid === S.me.uid) return;
    const n = await nameOf(uid), fr = !!S.friends[uid], bl = !!S.blocks[uid];
    sheet(top('Spēlētājs') + `<div class="tws-body tws-card"><div style="display:flex;align-items:center;gap:12px"><div class="tws-av" style="width:58px;height:58px;font-size:24px">${esc(disp(n)[0].toUpperCase())}</div><div><div style="font-size:22px;font-weight:900">${nameHTML(disp(n), uid)}</div><div class="tws-sm">@${esc(n.name)} · Līmenis ${n.level}</div></div></div>
      <div class="acts">
        <button class="tws-btn" id="pcDM" ${bl ? 'disabled' : ''}>💬 Čukstēt</button>
        <button class="tws-btn g" id="pcFr">${fr ? '✓ Draugi (noņemt)' : S.reqs[uid] ? '✓ Pieņemt draudzību' : '🤝 Pievienot draugos'}</button>
        <button class="tws-btn g" id="pcBl">${bl ? '🔓 Atbloķēt' : '🚫 Bloķēt'}</button>
        <button class="tws-btn r" id="pcRp">⚠️ Ziņot</button>
      </div><div class="tws-sm" id="pcMsg" style="margin-top:10px"></div></div>`);
    wireTop();
    $('pcDM').onclick = () => S.openDM(uid);
    $('pcFr').onclick = async () => { try { if (fr) { await S.removeFriend(uid); $('pcMsg').textContent = 'Noņemts no draugiem.'; } else { await S.addFriend(uid); $('pcMsg').textContent = S.friends[uid] ? 'Tagad jūs esat draugi! 🤝' : '✓ Draudzības pieprasījums nosūtīts.'; } } catch (e) { $('pcMsg').textContent = 'Neizdevās.'; } };
    $('pcBl').onclick = async () => { try { if (bl) await S.unblock(uid); else await S.block(uid); S.openPlayer(uid); } catch (e) { $('pcMsg').textContent = 'Neizdevās.'; } };
    $('pcRp').onclick = async () => { try { await S.report(uid, 'player'); $('pcMsg').textContent = '✓ Paldies! Admins to pārbaudīs.'; } catch (e) { $('pcMsg').textContent = 'Neizdevās.'; } };
  };

  // ---------- pilsētas čats (tikai frāzes) ----------
  let cityRef = null, cityId = null, cityMsgs = [];
  function watchCity() { const c = S.opts.getCity ? S.opts.getCity() : null;
    if (c === cityId) return; if (cityRef) cityRef.off(); cityRef = null; cityId = c; cityMsgs = [];
    if (c == null) { S.cityMsgs = []; return; }
    const since = Date.now() - 10 * 60 * 1000;
    cityRef = db.ref('chat/' + c).limitToLast(25);
    cityRef.on('value', s => { const a = []; s.forEach(m => { const v = m.val(); if (v && (v.t || 0) > since) a.push(v); }); cityMsgs = S.cityMsgs = a; if (S.open === 'city') renderCity(true); }, () => {}); }
  function renderCity(keepFoot) { if (S.open !== 'city') return;
    const c = S.opts.getCity();
    if (c == null) { $('twsBody').innerHTML = '<div class="tws-empty">Metro nav pilsētas čata. 🚇</div>'; $('twsFoot').innerHTML = ''; return; }
    $('twsBody').innerHTML = cityMsgs.length ? '<div class="tws-msgs">' + cityMsgs.map(m => `<div class="tws-m${m.u === S.me.uid ? ' me' : ''}"><b>${nameHTML(m.n, m.u)}:</b> ${esc(S.PHRASES[m.p] || '')}</div>`).join('') + '</div>' : `<div class="tws-empty">Pilsētā ${c + 1} vēl klusums. Pasaki kaut ko! 👇</div>`;
    const b = $('twsBody'); b.scrollTop = b.scrollHeight;
    if (keepFoot && $('twsFoot').innerHTML) return;
    $('twsFoot').innerHTML = '<div class="tws-ph">' + S.PHRASES.map((p, i) => `<button data-p="${i}">${esc(p)}</button>`).join('') + '</div>';
    $('twsFoot').querySelectorAll('[data-p]').forEach(bt => bt.onclick = async () => { bt.disabled = true; setTimeout(() => bt.disabled = false, 2500);
      try { await db.ref('chat/' + c).push({ u: S.me.uid, n: myName(), p: +bt.dataset.p, t: TS }); S.opts.onPhrase && S.opts.onPhrase(+bt.dataset.p); } catch (e) {} }); }

  // ---------- paziņojumi ----------
  let toastT = 0;
  function toast(html, onclick) { const t = $('twsToast'); t.innerHTML = html; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 4000);
    t.onclick = () => { t.classList.remove('on'); onclick && onclick(); }; }
  S.toast = toast;
  function paintDots() { const unread = Object.values(S.inbox).filter(v => v.u).length, reqs = Object.keys(S.reqs).length, total = unread + reqs;
    const bd = $('twsBadge'); if (bd) { bd.textContent = total > 9 ? '9+' : total; bd.style.display = total ? 'flex' : 'none'; }
    const d1 = $('twsDot_dm'), d2 = $('twsDot_fr'); if (d1) d1.style.display = unread ? 'block' : 'none'; if (d2) d2.style.display = reqs ? 'block' : 'none';
    S.opts.onBadge && S.opts.onBadge(total); }

  // ---------- starts ----------
  S.init = (me, opts) => { S.me = me; S.opts = opts || {}; buildUI();
    const t0 = Date.now(); let firstReq = true;
    db.ref('inbox/' + me.uid).on('value', s => { const prev = S.inbox; S.inbox = s.val() || {};
      Object.entries(S.inbox).forEach(([u, v]) => { const p = prev[u];
        if (v.u && (v.t || 0) > t0 && (!p || (v.t || 0) > (p.t || 0)) && S.conv !== u && !S.blocks[u]) {
          buzz(); toast(`💬 <b>${esc(v.n)}</b>: ${esc(S.clean(v.x || '').slice(0, 60))}`, () => S.openDM(u)); } });
      paintDots(); renderInbox(); }, () => {});
    db.ref('friendReq/' + me.uid).on('value', s => { const prev = S.reqs; S.reqs = s.val() || {};
      if (!firstReq) Object.entries(S.reqs).forEach(([u, v]) => { if (!prev[u]) { buzz(); toast(`🤝 <b>${esc(v.n)}</b> grib būt tavs draugs!`, () => S.openPanel('fr')); } });
      firstReq = false; paintDots(); renderFriends(); }, () => {});
    db.ref('friends/' + me.uid).on('value', s => { S.friends = s.val() || {}; renderFriends(); }, () => {});
    db.ref('blocks/' + me.uid).on('value', s => { S.blocks = s.val() || {}; }, () => {});
    if (S.opts.getCity) setInterval(watchCity, 1000);
  };
})();
