// Medaļas (sasniegumi) visām lapām. Glabājas ach/{uid}/{id} = laiks (publiski redzams).
// Medaļas pieder kopējam profilam; tās piešķir sākumlapa (draugi) un spēles. Apskatāmas sākumlapā.
// Medaļu nosacījumi tiek pārbaudīti no ctx: {level, painted, city, invites, friends, invited}.
// g = grupa (GROUPS): jaunai spēlei pievieno savu grupu un medaļas ar g: '<spēle>'.
(function(){
  const A = window.TWA = { owned: null, uid: null };
  A.GROUPS = [{ g: 'profils', t: '👤 Profils un draugi' }, { g: 'grafiti', t: '🎨 Graffiti RPG' }];
  A.LIST = [
    { g: 'profils', id: 'hello',    i: '🎮', t: 'Sveiks!',            te: 'Hello!',            d: 'Izveidoji profilu',                         de: 'Created a profile',             ok: c => true },
    { g: 'profils', id: 'invited',  i: '🎁', t: 'Atnāci ar draugu',   te: 'Came with a friend', d: 'Pievienojies ar drauga saiti',              de: 'Joined with a friend\'s link',  ok: c => !!c.invited },
    { g: 'profils', id: 'friend1',  i: '🤝', t: 'Pirmais draugs',     te: 'First friend',      d: 'Tev ir draugs Tailers World',               de: 'You have a friend',             ok: c => c.friends >= 1 },
    { g: 'profils', id: 'inv1',     i: '💌', t: 'Uzaicināji draugu',  te: 'Invited a friend',  d: '1 draugs pievienojās ar tavu saiti',        de: '1 friend joined with your link', ok: c => c.invites >= 1 },
    { g: 'profils', id: 'inv3',     i: '🎖️', t: 'Draugu bars',        te: 'Friend squad',      d: '3 draugi pievienojās ar tavu saiti',        de: '3 friends joined',              ok: c => c.invites >= 3 },
    { g: 'profils', id: 'inv10',    i: '🏆', t: 'Zvaigzne',           te: 'Superstar',         d: '10 draugi pievienojās ar tavu saiti',       de: '10 friends joined',             ok: c => c.invites >= 10 },
    { g: 'grafiti', id: 'paint1',   i: '🎨', t: 'Pirmais grafiti',    te: 'First graffiti',    d: 'Uzzīmēji pirmo sienu',                      de: 'Painted your first wall',       ok: c => c.painted >= 1 },
    { g: 'grafiti', id: 'paint25',  i: '🖌️', t: 'Ielu mākslinieks',   te: 'Street artist',     d: 'Uzzīmēji 25 sienas',                        de: 'Painted 25 walls',              ok: c => c.painted >= 25 },
    { g: 'grafiti', id: 'paint100', i: '🌈', t: 'Grafiti meistars',   te: 'Graffiti master',   d: 'Uzzīmēji 100 sienas',                       de: 'Painted 100 walls',             ok: c => c.painted >= 100 },
    { g: 'grafiti', id: 'lvl5',     i: '⭐', t: '5. līmenis',          te: 'Level 5',           d: 'Sasniedzi 5. līmeni',                       de: 'Reached level 5',               ok: c => c.level >= 5 },
    { g: 'grafiti', id: 'lvl10',    i: '🌟', t: '10. līmenis',         te: 'Level 10',          d: 'Sasniedzi 10. līmeni',                      de: 'Reached level 10',              ok: c => c.level >= 10 },
    { g: 'grafiti', id: 'lvl25',    i: '💫', t: '25. līmenis',         te: 'Level 25',          d: 'Sasniedzi 25. līmeni',                      de: 'Reached level 25',              ok: c => c.level >= 25 },
    { g: 'grafiti', id: 'lvl50',    i: '🔥', t: '50. līmenis',         te: 'Level 50',          d: 'Sasniedzi 50. līmeni',                      de: 'Reached level 50',              ok: c => c.level >= 50 },
    { g: 'grafiti', id: 'lvl99',    i: '🏅', t: 'Leģenda',            te: 'Legend',            d: 'Sasniedzi 99. līmeni',                      de: 'Reached level 99',              ok: c => c.level >= 99 },
    { g: 'grafiti', id: 'city2',    i: '🚇', t: 'Ceļotājs',           te: 'Traveller',         d: 'Aizbrauci uz 2. pilsētu',                   de: 'Reached city 2',                ok: c => c.city >= 2 },
    { g: 'grafiti', id: 'city10',   i: '🗺️', t: 'Pasaules apceļotājs', te: 'World traveller',  d: 'Aizbrauci uz 10. pilsētu',                  de: 'Reached city 10',               ok: c => c.city >= 10 },
  ];
  A.byId = id => A.LIST.find(m => m.id === id);
  A.en = () => { try { return (localStorage.getItem('twLang') || 'lv') === 'en'; } catch (e) { return false; } };
  A.title = m => A.en() ? m.te : m.t;
  A.desc = m => A.en() ? m.de : m.d;
  // Ielādē manas medaļas (vienreiz)
  A.load = async uid => {
    if (A.uid === uid && A.owned) return A.owned;
    A.uid = uid; A.owned = {};
    try { A.owned = (await firebase.database().ref('ach/' + uid).get()).val() || {}; } catch (e) {}
    return A.owned;
  };
  // Piešķir medaļas, kuru nosacījumi izpildīti; atgriež jaunās
  A.sync = async (uid, ctx) => {
    await A.load(uid);
    const c = Object.assign({ level: 0, painted: 0, city: 0, invites: 0, friends: 0, invited: false }, ctx);
    const fresh = A.LIST.filter(m => !A.owned[m.id] && m.ok(c));
    if (!fresh.length) return [];
    const upd = {}; fresh.forEach(m => { upd[m.id] = Date.now(); A.owned[m.id] = upd[m.id]; });
    try { await firebase.database().ref('ach/' + uid).update(upd); } catch (e) {}
    return fresh;
  };
  // Saite draugu uzaicināšanai
  A.inviteUrl = name => location.origin + '/?draugs=' + encodeURIComponent(String(name).toLowerCase());
})();
