// Medaļas (sasniegumi) visām lapām. Glabājas ach/{uid}/{id} = laiks (publiski redzams).
// Medaļas pieder kopējam profilam; tās piešķir sākumlapa (draugi, dienas) un spēles. Apskatāmas sākumlapā.
// Nosacījumi tiek pārbaudīti no ctx (skaitļi; trūkstošs = 0). Profils: friends, invites, invited, nick, notify, streak, days.
// Graffiti: painted, level, city (lielākā), colors, cars [], master, perfect, bonus, box, legend, escape, esc5, hide, eat, metro, earned, rich, night, items, busted.
// g = grupa (GROUPS): jaunai spēlei pievieno savu grupu un medaļas ar g: '<spēle>'.
// Ar 50 medaļām vārds sarkani spīd, ar 100 – zili (TW.nameHTML / spēles vārda zīme).
(function(){
  const A = window.TWA = { owned: null, uid: null };
  A.GROUPS = [{ g: 'profils', t: '👤 Profils un draugi' }, { g: 'grafiti', t: '🎨 Graffiti RPG' }];
  const L = A.LIST = [];
  const add = (g, id, i, t, te, d, de, ok) => L.push({ g, id, i, t, te, d, de, ok });
  // Pakāpju medaļas: rows = [[skaits, ikona, nosaukums, nosaukums EN, id?]]
  const tiers = (g, key, pre, rows, d, de) => rows.forEach(([n, i, t, te, id]) => add(g, id || pre + n, i, t, te, d(n), de(n), c => (c[key] || 0) >= n));

  // ---- Profils un draugi ----
  add('profils', 'hello', '🎮', 'Sveiks!', 'Hello!', 'Izveidoji profilu', 'Created a profile', c => true);
  add('profils', 'invited', '🎁', 'Atnāci ar draugu', 'Came with a friend', 'Pievienojies ar drauga saiti', 'Joined with a friend\'s link', c => !!c.invited);
  add('profils', 'nick', '✏️', 'Mana iesauka', 'My nickname', 'Izdomāji sev iesauku', 'Picked a nickname', c => !!c.nick);
  add('profils', 'notify', '🔔', 'Pirmais uzzinās', 'First to know', 'Ieslēdzi paziņojumus', 'Turned on notifications', c => !!c.notify);
  add('profils', 'idea', '💡', 'Ideju ģēnijs', 'Idea genius', 'Nosūtīji ideju jaunai spēlei', 'Sent a game idea', c => !!c.idea);
  tiers('profils', 'friends', 'friend', [[1, '🤝', 'Pirmais draugs', 'First friend'], [5, '👫', '5 draugi', '5 friends'], [10, '🎉', '10 draugi', '10 friends'], [25, '🌍', '25 draugi', '25 friends'], [50, '🌐', '50 draugi', '50 friends']],
    n => n === 1 ? 'Tev ir draugs Tailers World' : `Tev ir ${n} draugi`, n => `You have ${n} friend${n > 1 ? 's' : ''}`);
  tiers('profils', 'invites', 'inv', [[1, '💌', 'Uzaicināji draugu', 'Invited a friend'], [3, '🎖️', 'Draugu bars', 'Friend squad'], [10, '🏆', 'Zvaigzne', 'Superstar'], [25, '🌠', 'Superzvaigzne', 'Megastar'], [50, '🚀', 'Kosmiskā zvaigzne', 'Cosmic star']],
    n => `${n} ${n === 1 ? 'draugs pievienojās' : 'draugi pievienojās'} ar tavu saiti`, n => `${n} friend${n > 1 ? 's' : ''} joined with your link`);
  tiers('profils', 'streak', 'row', [[3, '🌱', '3 dienas pēc kārtas', '3 days in a row'], [7, '🌿', 'Nedēļa pēc kārtas', 'A week in a row'], [10, '🔥', '10 dienas pēc kārtas', '10 days in a row'], [30, '💪', 'Mēnesis pēc kārtas', 'A month in a row'], [50, '⚡', '50 dienas pēc kārtas', '50 days in a row'], [100, '💎', '100 dienas pēc kārtas', '100 days in a row']],
    n => `Ielogojies ${n} dienas pēc kārtas`, n => `Logged in ${n} days in a row`);
  tiers('profils', 'days', 'days', [[10, '🎈', '10 dienas', '10 days'], [50, '🎯', '50 dienas', '50 days'], [100, '🏵️', '100 dienas', '100 days'], [200, '🎗️', '200 dienas', '200 days'], [365, '🎂', 'Vesels gads', 'A whole year']],
    n => `Spēlēji kopā ${n} dažādās dienās`, n => `Played on ${n} different days`);

  // ---- Graffiti RPG ----
  tiers('grafiti', 'painted', 'paint', [[1, '🎨', 'Pirmais grafiti', 'First graffiti'], [10, '🖍️', '10 sienas', '10 walls'], [25, '🖌️', 'Ielu mākslinieks', 'Street artist'], [50, '🧱', '50 sienas', '50 walls'], [100, '🌈', 'Grafiti meistars', 'Graffiti master'], [250, '🏙️', '250 sienas', '250 walls'], [500, '🎭', '500 sienas', '500 walls'], [1000, '🗿', '1000 sienas', '1000 walls'], [2000, '🏛️', 'Pilsētas leģenda', 'City legend']],
    n => n === 1 ? 'Uzzīmēji pirmo sienu' : `Uzzīmēji ${n} sienas`, n => `Painted ${n} wall${n > 1 ? 's' : ''}`);
  tiers('grafiti', 'level', 'lvl', [[5, '⭐'], [10, '🌟'], [20, '✨'], [30, '💫'], [40, '☄️'], [50, '🔥'], [60, '🌙'], [70, '☀️'], [80, '🪐'], [90, '🌌'], [99, '🏅', 'Leģenda', 'Legend']].map(([n, i, t, te]) => [n, i, t || `${n}. līmenis`, te || `Level ${n}`]),
    n => `Sasniedzi ${n}. līmeni`, n => `Reached level ${n}`);
  [['⚓', 'Harbor'], ['🌃', 'Neon Heights'], ['🌳', 'Parkside'], ['🛒', 'Market Quarter'], ['🖼️', 'Art Block'], ['🌆', 'Skyline'], ['🌊', 'Riverside'], ['🏢', 'Uptown'], ['🏰', 'Crown Hill']].forEach(([i, nm], k) => { const n = k + 2;
    add('grafiti', 'city' + n, i, n === 10 ? 'Pasaules apceļotājs' : `${n}. pilsēta`, n === 10 ? 'World traveller' : `City ${n}`, `Aizbrauci uz ${n}. pilsētu – ${nm}`, `Reached city ${n} – ${nm}`, c => (c.city || 0) >= n); });
  tiers('grafiti', 'colors', 'col', [[3, '🟡', '3 krāsas', '3 colors'], [5, '🟣', '5 krāsas', '5 colors'], [10, '💠', 'Visas krāsas', 'All colors']],
    n => n === 10 ? 'Tev ir visas 10 krāsas' : `Tev ir ${n} krāsas`, n => `You own ${n} colors`);
  [['board', '🛹', 'Skeitbords', 'Skateboard'], ['scoot', '🛴', 'Skrejritenis', 'Scooter'], ['hatch', '🚗', 'Pirmā mašīna', 'First car'], ['sport', '🏎️', 'Sporta auto', 'Sports car'], ['super', '🚀', 'Superauto', 'Supercar']].forEach(([k, i, t, te]) =>
    add('grafiti', 'car' + k, i, t, te, `Nopirki: ${t.toLowerCase()}`, `Bought: ${te.toLowerCase()}`, c => (c.cars || []).includes(k)));
  tiers('grafiti', 'master', 'mast', [[1, '👌', 'Šedevrs', 'Masterpiece'], [10, '🎯', '10 šedevri', '10 masterpieces'], [50, '🧠', '50 šedevri', '50 masterpieces'], [100, '🦄', '100 šedevri', '100 masterpieces'], [250, '🎇', '250 šedevri', '250 masterpieces']],
    n => n === 1 ? 'Zīmējums ar 90%+ precizitāti' : `${n} zīmējumi ar 90%+ precizitāti`, n => `${n} drawing${n > 1 ? 's' : ''} with 90%+ accuracy`);
  add('grafiti', 'perfect', '💯', 'Gandrīz perfekts', 'Nearly perfect', 'Zīmējums ar 98%+ precizitāti', 'A drawing with 98%+ accuracy', c => (c.perfect || 0) >= 1);
  tiers('grafiti', 'bonus', 'bon', [[1, '🚆', 'Metro mākslinieks', 'Metro artist'], [10, '🚉', '10 bonusa sienas', '10 bonus walls'], [50, '🚄', '50 bonusa sienas', '50 bonus walls'], [100, '🚅', '100 bonusa sienas', '100 bonus walls']],
    n => n === 1 ? 'Uzzīmēji bonusa sienu metro' : `Uzzīmēji ${n} bonusa sienas metro`, n => `Painted ${n} metro bonus wall${n > 1 ? 's' : ''}`);
  tiers('grafiti', 'box', 'box', [[1, '📦', 'Pirmā kaste', 'First box'], [10, '🗃️', '10 kastes', '10 boxes'], [50, '🧰', '50 kastes', '50 boxes'], [100, '🏴‍☠️', 'Dārgumu mednieks', 'Treasure hunter']],
    n => n === 1 ? 'Atvēri lootboxu' : `Atvēri ${n} lootboxus`, n => `Opened ${n} loot box${n > 1 ? 'es' : ''}`);
  add('grafiti', 'legend', '🔮', 'Leģendārā kaste', 'Legendary box', 'Atvēri leģendāro lootboxu', 'Opened a legendary loot box', c => (c.legend || 0) >= 1);
  tiers('grafiti', 'escape', 'esc', [[1, '🏃', 'Aizbēgi!', 'Got away!'], [10, '💨', '10 bēgšanas', '10 escapes'], [50, '🥷', 'Ēna', 'Shadow'], [100, '🦊', 'Viltīgā lapsa', 'Sly fox']],
    n => n === 1 ? 'Aizbēgi no policijas' : `Aizbēgi no policijas ${n} reizes`, n => `Escaped the police ${n} time${n > 1 ? 's' : ''}`);
  add('grafiti', 'esc5', '🚁', 'Neuzvaramais', 'Untouchable', 'Aizbēgi ar 5 zvaigznēm', 'Escaped with 5 stars', c => (c.esc5 || 0) >= 1);
  add('grafiti', 'busted', '🚓', 'Noķerts!', 'Busted!', 'Policija tevi noķēra (gadās!)', 'The police caught you (it happens!)', c => (c.busted || 0) >= 1);
  tiers('grafiti', 'hide', 'hide', [[10, '🗑️', 'Paslēpies', 'Hide and seek'], [100, '🙈', 'Slēpšanās meistars', 'Hiding master'], [500, '🕳️', 'Neredzamais', 'Invisible']],
    n => `Paslēpies ${n} reizes`, n => `Hid ${n} times`);
  tiers('grafiti', 'eat', 'eat', [[10, '🍔', 'Gardēdis', 'Foodie'], [50, '🍕', '50 maltītes', '50 meals'], [100, '🍰', '100 maltītes', '100 meals'], [250, '🍽️', 'Šefpavārs', 'Chef']],
    n => `Paēdi kafejnīcā ${n} reizes`, n => `Ate at the café ${n} times`);
  tiers('grafiti', 'metro', 'metro', [[10, '🚇', 'Metro braucējs', 'Metro rider'], [100, '🛤️', '100 braucieni', '100 rides'], [500, '🚂', 'Mašīnists', 'Train driver']],
    n => `Brauci ar metro ${n} reizes`, n => `Rode the metro ${n} times`);
  tiers('grafiti', 'earned', 'eur', [[1000, '💶', '€1 000', '€1,000', 'eur1k'], [10000, '💰', '€10 000', '€10,000', 'eur10k'], [100000, '🏦', '€100 000', '€100,000', 'eur100k'], [1000000, '🤑', 'Miljonārs', 'Millionaire', 'eur1m']],
    n => `Kopā nopelnīji €${n.toLocaleString('lv')}`, n => `Earned €${n.toLocaleString('en')} in total`);
  tiers('grafiti', 'rich', 'rich', [[5000, '💳', 'Pilns maks', 'Full wallet', 'rich5k'], [50000, '💸', 'Bagātnieks', 'Rich kid', 'rich50k']],
    n => `Vienlaikus tev bija €${n.toLocaleString('lv')}`, n => `Had €${n.toLocaleString('en')} at once`);
  tiers('grafiti', 'night', 'night', [[10, '🦉', 'Nakts pūce', 'Night owl'], [100, '🦇', 'Nakts mākslinieks', 'Night artist']],
    n => `Uzzīmēji ${n} sienas naktī`, n => `Painted ${n} walls at night`);
  tiers('grafiti', 'items', 'item', [[10, '🎒', 'Gudrs spēlētājs', 'Smart player'], [100, '🧳', '100 priekšmeti', '100 items']],
    n => `Izmantoji ${n} priekšmetus`, n => `Used ${n} items`);

  A.byId = id => L.find(m => m.id === id);
  A.count = owned => L.filter(m => owned && owned[m.id]).length;
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
    const c = Object.assign({}, ctx);
    const fresh = L.filter(m => !A.owned[m.id] && m.ok(c));
    if (!fresh.length) return [];
    const upd = {}; fresh.forEach(m => { upd[m.id] = Date.now(); A.owned[m.id] = upd[m.id]; });
    try { await firebase.database().ref('ach/' + uid).update(upd); } catch (e) {}
    document.dispatchEvent(new Event('tw-medals'));
    return fresh;
  };
  // Apmeklējumu dienas: pēc kārtas (n), labākā sērija (best), kopā (days). users/{uid}/visits
  const day = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  A.visit = async uid => {
    const ref = firebase.database().ref('users/' + uid + '/visits');
    let v = {}; try { v = (await ref.get()).val() || {}; } catch (e) { return v; }
    const today = day(Date.now()); if (v.last === today) return v;
    const n = v.last === day(Date.now() - 864e5) ? (v.n || 0) + 1 : 1;
    v = { last: today, n, best: Math.max(n, v.best || 0), days: (v.days || 0) + 1 };
    try { await ref.set(v); } catch (e) {}
    return v;
  };
  // Saite draugu uzaicināšanai
  A.inviteUrl = name => location.origin + '/?draugs=' + encodeURIComponent(String(name).toLowerCase());
})();
