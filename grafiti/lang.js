// Valodas slānis (LV/EN): kods raksta angliski, šis pārtulko visu redzamo latviski. Jaunam tekstam pievieno PHRASES/WORDS.
// Valodas slānis: spēles kods raksta angliski, šis fails pārtulko visu redzamo tekstu latviski.
// Valoda tiek glabāta localStorage ('twLang'); noklusējums – latviešu.
(function(){
  let lang='lv'; try{ lang=localStorage.getItem('twLang')||'lv'; }catch(e){}
  window.TW_LANG=lang;
  window.setLang=l=>{ try{ localStorage.setItem('twLang',l); }catch(e){} location.reload(); };
  if(lang!=='lv'){ window.tr=s=>s; return; }

  // Garākās frāzes vispirms. [angliski, latviski]
  const PHRASES=[
    ['Use it when the police are chasing you – they lose sight of you and suspicion drops.','Izmanto, kad policija dzenas pakaļ – viņi tevi pazaudē, un aizdomas samazinās.'],
    ['You run 40% faster for 40 seconds. Great for escaping!','40 sekundes skrien par 40% ātrāk. Lieliski, lai aizbēgtu!'],
    ['For 5 minutes every wall gives double XP – level up faster.','5 minūtes katra siena dod dubultu XP – ātrāk kāp līmeņos.'],
    ['For 3 minutes people who see you will not call the police.','3 minūtes cilvēki, kas tevi redz, neizsauks policiju.'],
    ['🎒 Backpack','🎒 Mugursoma'],['Items are found in loot boxes – in dumpsters 🗑️ and on bonus walls in the metro 🎁.','Priekšmetus atrodi lootboxos – miskastēs 🗑️ un metro bonusa sienās 🎁.'],
    ['Your character gets hungry over time. When food is 0%, you walk slower and your hands shake – drawings get wobbly.','Tavs tēls laika gaitā izsalkst. Kad ēdiens ir 0%, tu ej lēnāk, un rokas trīc – zīmējumi sanāk šķībi.'],
    ['Eat at a café 🍔 or a pizzeria 🍕','Paēd kafejnīcā 🍔 vai picērijā 🍕'],['When you are hungry, an arrow shows the way to the nearest café.','Kad esi izsalcis, bultiņa rāda ceļu uz tuvāko kafejnīcu.'],
    ['🎨 Draw anything!','🎨 Zīmē, ko gribi!'],['FREESTYLE','BRĪVĀ SIENA'],['Freestyle – draw anything you like!','Brīvā siena – zīmē, ko gribi!'],['Freestyle!','Brīvais zīmējums!'],['Draw a bit more!','Uzzīmē mazliet vairāk!'],
    ['Keep the old drawing','Atstāt veco zīmējumu'],['Clean the wall first','Vispirms notīrīt sienu'],
    ['Police backup is coming from the other side!','Policijas pastiprinājums brauc no otras puses!'],
    ['Needs level','Vajag līmeni'],
    ['💈 Barber','💈 Frizētava'],['Hat / hair color','Cepures / matu krāsa'],['Hoodie','Jaka'],['Head','Galva'],['Pants','Bikses'],['🎲 Random','🎲 Nejauši'],
    ['E – barber (change your look)','E – frizētava (maini izskatu)'],['Look','Izskats'],
    ['👉 Walk to the brick wall with ◀ ▶ – or just tap the wall','👉 Aizej līdz ķieģeļu sienai ar ◀ ▶ – vai vienkārši uzspied uz sienas'],['👉 Walk to the brick wall (A / D)','👉 Aizej līdz ķieģeļu sienai (A / D)'],
    ['🎨 Tap the big Paint button','🎨 Spied lielo pogu Zīmēt'],['🎨 Press E to paint','🎨 Spied E, lai zīmētu'],
    ['✏️ Trace the dashed shape with your finger, then tap ✔ Done','✏️ Apvelc punktoto formu ar pirkstu un spied ✔ Gatavs'],['✏️ Trace the dashed shape with the mouse, then press ✔ Done','✏️ Apvelc punktoto formu ar peli un spied ✔ Gatavs'],
    ['💰 Great! Walls give money and XP. If many people see you 👀, the police come – hide in a dumpster 🫣!','💰 Super! Sienas dod naudu un XP. Ja daudzi redz 👀, ierodas policija – slēpies miskastē 🫣!'],
    ['🪣 Paint runs out – refill it at the Paint Depot (pink sign). 🍔 Eat at a café. Have fun! 🎉','🪣 Krāsa iztērējas – uzpildi Krāsu depo (rozā izkārtne). 🍔 Ēd kafejnīcā. Lai jautri! 🎉'],
    ['Old sneakers','Vecās kedas'],['Running shoes','Skriešanas apavi'],['Sport boots','Sporta zābaki'],['Rocket sneakers','Raķešu kedas'],
    ['👟 Shoe shop','👟 Apavu veikals'],['Faster shoes = run faster on foot (escape the police!).','Ātrāki apavi = ātrāk skrien kājām (aizbēgt no policijas!).'],
    ['E – shoe shop (faster running)','E – apavu veikals (ātrāka skriešana)'],['jump ×','lēciens ×'],['🍔 Café','🍔 Kafejnīca'],
    ['Try again!','Mēģini vēlreiz!'],
    ['▶ Resume','▶ Turpināt'],['Hide 🫣 or run!','Slēpies 🫣 vai bēdz!'],['The train stands in the middle of the station – tap it.','Vilciens stāv stacijas vidū – uzspied uz tā.'],
    ['Tap a brick wall to paint 🎨. People with 📱 can call the police – hide in a dumpster 🫣.','Uzspied uz ķieģeļu sienas, lai zīmētu 🎨. Cilvēki ar 📱 var izsaukt policiju – slēpies miskastē 🫣.'],
    ['is empty – refill it at the Paint Depot','ir tukša – uzpildi to Krāsu depo'],['is empty – pick another color.','ir tukša – izvēlies citu krāsu.'],
    ['paint ran out! Pick another color or refill at the Paint Depot.','krāsa beigusies! Izvēlies citu vai uzpildi Krāsu depo.'],
    ['All your paint is empty! Refill at the Paint Depot (black € 20). Every night at 02:00 you get € 20.','Visas krāsas ir tukšas! Uzpildi Krāsu depo (melnā € 20). Katru nakti 02:00 saņem € 20.'],
    ['This wall needs','Šai sienai vajag'],['paint, but your can is empty – refill at the Paint Depot','krāsu, bet tava bundža ir tukša – uzpildi Krāsu depo'],
    ['Daily gift: € 20!','Ikdienas dāvana: € 20!'],['Enough to refill black paint. A new gift comes every night at 02:00.','Pietiek melnās krāsas uzpildei. Jauna dāvana – katru nakti 02:00.'],
    ['Refill €','Uzpildīt €'],
    ['Bonus wall – more accurate = better box!','Bonusa siena – jo precīzāk, jo labāka kaste!'],['· paint:','· krāsa:'],['Paint: ','Krāsa: '],['Buy: ','Nopērc: '],
    ['This wall needs this paint:','Šai sienai vajag šo krāsu:'],['– buy it at the Paint Depot','– nopērc to Krāsu depo'],
    ['Wrong color – the wall wanted:','Nepareiza krāsa – sienai vajadzēja:'],['Half pay.','Puse samaksas.'],
    ['1 person saw you','tevi redzēja 1 cilvēks'],['people saw you','cilvēki tevi redzēja'],['Nobody saw you – police not interested.','Neviens neredzēja – policijai neinteresē.'],
    ['watching','skatās'],['Nobody sees you','Neviens neredz'],['calling the police!','zvana policijai!'],['Hungry – shaky hands!','Izsalcis – rokas trīc!'],
    // sākuma padoms un garie paziņojumi
    ['Run along the street with','Skrien pa ielu ar'],['at a brick wall and paint.','pie ķieģeļu sienas un zīmē.'],['The Paint Depot (pink sign) sells colors and vehicles.','Krāsu depo (rozā izkārtne) – krāsas un transports.'],
    ['People with 📱 can report you to the police – hide with','Cilvēki ar 📱 var paziņot policijai – slēpies ar'],
    ['The sun is up –','Uzlēca saule –'],['police are more active by day','dienā policija aktīvāka'],['(more officers), and people see farther.','(vairāk policistu), un cilvēki redz tālāk.'],
    ['Night falls –','Iestājās nakts –'],['police are less active at night',"naktī policija mazāk aktīva"],[', it is darker and people see less far.',', ir tumšāks, un cilvēki redz tuvāk.'],
    ['Acceptable work – police not interested.','Pieņemams darbs – policija neinteresējas.'],
    ['The police dropped you at the metro.','Policija tevi izlaida pie metro.'],['of your money)','no naudas)'],
    ['Nowhere to hide here – look for a dumpster by a wall or crates by a shop (green arrow).','Te nav kur paslēpties – meklē konteineru pie sienas vai kastes pie veikala (zaļā bulta).'],
    ['The officer saw where you hid!','Policists redzēja, kur tu paslēpies!'],['Hidden! Wait for them to leave.','Paslēpies! Gaidi, kamēr aizies.'],
    ['You left the hiding spot.','Iznāci no slēptuves.'],
    ['You are starving! You walk slower and your hands shake – eat at a café.','Tu esi izsalcis! Ej lēnāk, un rokas trīc – paēd kafejnīcā.'],
    ['You are getting hungry – eat at a café (orange dot on the map).','Sāc kļūt izsalcis – paēd kafejnīcā (oranžais punkts kartē).'],
    ['Too hungry to paint – eat at a café first!','Pārāk izsalcis, lai zīmētu – vispirms paēd kafejnīcā!'],
    ['You are not hungry yet.','Tu vēl neesi izsalcis.'],['Yum! You are full for the day.','Mmm! Tu esi paēdis visai dienai.'],
    ['A meal costs','Maltīte maksā'],['– paint a wall to earn money.','– nokrāso sienu, lai nopelnītu.'],
    ['Someone is calling the police!','Kāds zvana policijai!'],
    ['is searching for you! Get out of the spotlight.','tevi meklē! Tiec prom no prožektora.'],['The helicopter found your hiding spot!','Helikopters atrada tavu slēptuvi!'],
    ['The police drove away.','Policija aizbrauca.'],
    ['City limit – take the metro to travel to another city.','Pilsētas robeža – uz citu pilsētu brauc ar metro.'],
    ['you may paint here, but drawings are harder and the police are stricter','drīksti zīmēt, bet zīmējumi ir grūtāki un policija stingrāka'],
    ['painting here needs level','zīmēšanai vajag līmeni'],
    ['Paint easier walls and earn XP.','Zīmē vieglākas sienas un krāj XP.'],
    ['Paint still drying – come back later or find another wall!','Krāsa vēl žūst – nāc vēlāk vai meklē citu sienu!'],
    ['Paint still drying – try another bonus wall.','Krāsa vēl žūst – pamēģini citu bonusa sienu.'],
    ['The shoe shop opens soon – buy faster running shoes there!','Apavu veikals drīz atvērsies – tur varēs nopirkt ātrākus skriešanas apavus!'],
    ['Smoke bomb! The police lost you.','Dūmu bumba! Policija tevi pazaudēja.'],['Energy! Run 40% faster for 40 seconds.','Enerģija! Skrien 40% ātrāk 40 sekundes.'],
    ['Double XP for 5 minutes!','Dubultais XP 5 minūtes!'],['Mask! Witnesses will not call the police for 3 minutes.','Maska! Liecinieki 3 minūtes nezvanīs policijai.'],
    ['The train stands in the middle of the station – walk to it and press E.','Vilciens stāv stacijas vidū – aizej līdz tam un spied E.'],
    ['Teleporting is metro only! Nearest station:','Teleportēties var tikai ar metro! Tuvākā stacija:'],['(blue arrow).','(zilā bulta).'],
    ['The police are after you – teleport unavailable!','Policija tevi ķer – teleports nav pieejams!'],
    ['The police are looking for you – metro unavailable!','Policija tevi meklē – metro nav pieejams!'],
    ['Each city has 10 levels. New cities open as you level up. Travel instantly, no waiting.','Katrā pilsētā ir 10 līmeņi. Jaunas pilsētas atveras, kad pieaug tavs līmenis. Brauc uzreiz, nav jāgaida.'],
    ['You found a hidden lootbox!','Tu atradi paslēptu lootbox!'],['Tip: lootboxes are rare. Some are hidden in dumpsters and crates.','Padoms: lootboxi ir reti. Daži ir paslēpti konteineros un kastēs.'],
    ['No lootbox this time','Šoreiz lootbox nav'],['– but you earned','– bet tu nopelnīji'],
    ['Drag along the faint outline. The more accurate and clean, the more money. Pricier colors give a bonus.','Velc pa blāvo kontūru. Jo precīzāk un tīrāk, jo vairāk naudas. Dārgākas krāsas dod bonusu.'],
    ['more accurate = better box!','precīzāk = labāka kaste!'],['Draw the outline!','Uzzīmē kontūru!'],
    ['A D – run · W – jump · E – paint / metro / shop · ↓ S – hide · Z X C V – items · M – music · F – fullscreen','A D – skriet · W – lēkt · E – zīmēt / metro / veikals · ↓ S – slēpties · Z X C V – priekšmeti · M – mūzika · F – pilnekrāns'],
    ['A D – run · W – jump','A D – skriet · W – lēkt'],['E – action · ↓ – hide','E – darbība · ↓ – slēpties'],['Z X C V – items','Z X C V – priekšmeti'],['Esc – pause / settings','Esc – pauze / iestatījumi'],
    // policija un aizdomas
    ['Police on the way!','Policija ceļā!'],['Hide (↓ / S) or run!','Slēpies (↓ / S) vai bēdz!'],['Being chased!','Dzenas pakaļ!'],['Searching for you…','Meklē tevi…'],['Helicopter overhead!','Helikopters virs tevis!'],
    ['Wanted level','Meklēšanas līmenis'],['the whole city is after you!','visa pilsēta tevi meklē!'],['officers and a helicopter!','policisti un helikopters!'],['several officers on your tail','vairāki policisti dzenas pakaļ'],
    ['officers closing in','policisti tuvojas'],['one officer','viens policists'],['witness calls the police','liecinieks zvana policijai'],['very bad drawing','ļoti slikts zīmējums'],['too many in one area','par daudz vienā apkaimē'],
    ['same wall again','tā pati siena atkārtoti'],['too fast','pārāk ātri'],['stricter','stingrāk'],['Suspicion','Aizdomas'],['Suspicious','Aizdomīgi'],['Leaving…','Aiziet…'],['Busted!','Pieķerts!'],['Fine:','Sods:'],
    ['Police: more','Policija: vairāk'],['Police: fewer','Policija: mazāk'],['👮 POLICE 🚨','👮 POLICIJA 🚨'],
    // uzvednes
    ['↓ / S – leave hiding spot','↓ / S – iznākt no slēptuves'],['↓ / S – hide','↓ / S – paslēpties'],['E – enter the paint shop and car dealer','E – ieiet krāsu veikalā un auto salonā'],['E – fast shoes (coming soon!)','E – ātrie apavi (drīzumā!)'],
    ['E – enter the metro','E – ieiet metro'],['E – train: choose a district (travel instantly)','E – vilciens: izvēlies pilsētu (brauc uzreiz)'],['E – to the street','E – uz ielu'],['E – bonus wall','E – bonusa siena'],
    ['E – eat','E – paēst'],['E – paint','E – zīmēt'],['Paint still drying…','Krāsa vēl žūst…'],['Paint drying…','Krāsa žūst…'],['up to €','līdz €'],['you have','tev ir'],['needs level','vajag līmeni'],
    // metro un ceļošana
    ['Train – choose a city','Vilciens – izvēlies pilsētu'],['Go straight to level','Brauc uzreiz uz līmeni'],['To the street','Uz ielu'],['CENTRAL STATION','CENTRĀLĀ STACIJA'],['STATION · ','STACIJA · '],
    ['▼ METRO ENTRANCE ▼','▼ IEEJA METRO ▼'],['▼ TRAIN · E – choose a district ▼','▼ VILCIENS · E – izvēlies pilsētu ▼'],['↑ TO STREET','↑ UZ IELU'],['CITY LIMIT','PILSĒTAS ROBEŽA'],['🚇 take the metro','🚇 brauc ar metro'],
    ['BONUS · shape','BONUSS · forma'],['Bonus task (metro)','Bonusa uzdevums (metro)'],['drying','žūst'],
    // zīmēšana, rezultāts, līmeņi
    ['Masterpiece!','Šedevrs!'],['Scribble','Škrebelis'],['Accuracy','Precizitāte'],['coverage','aptvērums'],['cleanliness','tīrība'],['Earned:','Nopelnīts:'],['color bonus','krāsas bonuss'],
    ['New level','Jauns līmenis'],['unlocked','atvērta'],['Done (Enter)','Gatavs (Enter)'],['Undo (Z)','Atcelt (Z)'],['Clear (C)','Notīrīt (C)'],['Leave (Esc)','Aiziet (Esc)'],
    // lootbox un priekšmeti
    ['Congratulations!','Apsveicam!'],['Open box','Atvērt kasti'],['opened!','atvērta!'],['Awesome!','Lieliski!'],['New color:','Jauna krāsa:'],
    ['Bronze box','Bronzas kaste'],['Silver box','Sudraba kaste'],['Gold box','Zelta kaste'],['Diamond box','Dimanta kaste'],
    ['Smoke bomb','Dūmu bumba'],['police lose you, suspicion −35','policija tevi pazaudē, aizdomas −35'],['Energy drink','Enerģijas dzēriens'],['+40% speed for 40 s','+40% ātrums 40 s'],
    ['Double XP','Dubultais XP'],['XP ×2 for 5 min','XP ×2 5 min'],['witnesses will not call for 3 min','liecinieki nezvana 3 min'],
    // veikals un HUD
    ['Paint Depot','Krāsu depo'],['Colors','Krāsas'],['Vehicles','Transports'],['✔ selected','✔ izvēlēta'],['✔ in use','✔ lieto'],['Close (E / Esc)','Aizvērt (E / Esc)'],
    ['Color:','Krāsa:'],['Vehicle:','Transports:'],['Walls painted:','Nokrāsotas sienas:'],['Food','Ēdiens'],['(max)','(maks.)'],
    // iestatījumi un atskaņotājs
    ['⏸ Pause · Settings','⏸ Pauze · Iestatījumi'],['Game volume (master)','Spēles skaļums (kopējais)'],['Music volume (M – mute)','Mūzikas skaļums (M – izslēgt)'],['Music volume','Mūzikas skaļums'],
    ['Effects volume','Efektu skaļums'],['Brightness','Gaišums'],['▶ Resume (Esc)','▶ Turpināt (Esc)'],['Fullscreen','Pilnekrāns'],['Settings (Esc)','Iestatījumi (Esc)'],
    ['🔇 Mute','🔇 Izslēgt'],['🔊 Unmute','🔊 Ieslēgt'],['PL song','PL dziesma'],['Papīra Lidmašīnas song now (R)','Papīra Lidmašīnu dziesma tagad (R)'],['Quieter (-)','Klusāk (-)'],['Louder (+)','Skaļāk (+)'],
    ['Sound effects (on / off)','Skaņas efekti (iesl. / izsl.)'],['Play / pause','Atskaņot / pauze'],['Previous','Iepriekšējā'],['unavailable, try ⏭','nav pieejams, spied ⏭'],
    // dienas laiks
    ['Morning','Rīts'],['Evening','Vakars'],['Night','Nakts'],
    // vietas un nosaukumi (pilsētas – pirms vārdiem)
    ['Old Town','Vecpilsēta'],['Neon Heights','Neona kalni'],['Parkside','Parka mala'],['Market Quarter','Tirgus kvartāls'],['Art Block','Mākslas kvartāls'],['Skyline','Debesskrāpji'],
    ['Riverside','Upmala'],['Uptown','Augšpilsēta'],['Crown Hill','Kroņkalns'],
    ['PAINT DEPOT','KRĀSU DEPO'],['CAFÉ','KAFEJNĪCA'],['PIZZERIA','PICĒRIJA'],['BIKES','VELO'],['SHOES','APAVI'],['ARCADE','SPĒĻU ZĀLE'],['FLOWERS','ZIEDI'],['BARBER','FRIZIERIS'],
    ['On foot','Kājām'],['Skateboard','Skrituļdēlis'],['Scooter','Skūteris'],['Hatchback','Hečbeks'],['Sports car','Sporta auto'],['Supercar','Superauto'],
    ['New medal!','Jauna medaļa!'],['How to play','Kā spēlēt'],['Good work – police not interested.','Labs darbs – policijai neinteresē.'],['sloppy drawing','paviršs zīmējums'],['patrol saw you','patrulis tevi redzēja'],['Hiding spot','Slēptuve'],['hiding spot','slēptuve'],['Wall (lvl','Siena (līm.'],['Wall –','Siena –'],
  ];
  // Atsevišķi vārdi (tikai veseli vārdi)
  const WORDS=[
    ['Officer','Policists'],['Police','Policija'],['Train','Vilciens'],['Exit','Izeja'],['Hidden','Paslēpies'],['Calm','Mierīgi'],['Day','Diena'],['Good','Labi'],['Poor','Švaki'],
    ['City','Pilsēta'],['Level','Līmenis'],['level','līmenis'],['levels','līmeņi'],['district','rajons'],['shape','forma'],['Wall','Siena'],['Walls','Sienas'],['hiding','paslēpies'],
    ['Select','Izvēlēties'],['Use','Lietot'],['speed','ātrums'],['bonus','bonuss'],['Go','Braukt'],['Close','Aizvērt'],['Music','Mūzika'],['Next','Nākamā'],
    ['Black','Melna'],['Red','Sarkana'],['Blue','Zila'],['Green','Zaļa'],['Yellow','Dzeltena'],['Pink','Rozā'],['Orange','Oranža'],['Purple','Violeta'],['Gold','Zelta'],['Neon','Neona'],
    ['Sun','Saules'],['Moon','Mēness'],['Star','Zvaigžņu'],['Apple','Ābeļu'],['Birch','Bērzu'],['Oak','Ozolu'],['Linden','Liepu'],['Rose','Rožu'],['Wind','Vēja'],['Water','Ūdens'],['Sand','Smilšu'],
    ['Street','iela'],['Boulevard','bulvāris'],['Quarter','kvartāls'],['Square','laukums'],['Park','parks'],['Embankment','krastmala'],['Harbor','osta'],['Bridge','tilts'],['Garden','dārzs'],
    ['STREET','IELA'],['BOULEVARD','BULVĀRIS'],['QUARTER','KVARTĀLS'],['SQUARE','LAUKUMS'],['PARK','PARKS'],['EMBANKMENT','KRASTMALA'],['HARBOR','OSTA'],['BRIDGE','TILTS'],['GARDEN','DĀRZS'],
    ['SUN','SAULES'],['MOON','MĒNESS'],['STAR','ZVAIGŽŅU'],['APPLE','ĀBEĻU'],['BIRCH','BĒRZU'],['OAK','OZOLU'],['LINDEN','LIEPU'],['ROSE','ROŽU'],['WIND','VĒJA'],['WATER','ŪDENS'],['SAND','SMILŠU'],
    ['Press','Spied'],['Helicopter','Helikopters'],['Skin','Āda'],['Mask','Maska'],['Settings','Iestatījumi'],['Done','Gatavs'],['Undo','Atcelt'],['Clear','Notīrīt'],['Leave','Aiziet'],['Paint','Zīmēt'],['Shop','Veikals'],['Eat','Ēst'],['Travel','Braukt'],['Bonus','Bonuss'],['Hide','Slēpties'],['Out','Iznākt'],['Soon','Drīz'],['Hungry','Izsalcis'],['Exit','Izeja'],['DISTRICT','RAJONS'],['LEVEL','LĪMENIS'],['OPEN','ATVĒRTS'],
  ];
  const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const RULES=[...PHRASES.sort((a,b)=>b[0].length-a[0].length).map(([e,l])=>[new RegExp(esc(e),'g'),l]),
               ...WORDS.map(([e,l])=>[new RegExp('(^|[^A-Za-zĀ-ž])'+esc(e)+'(?=$|[^A-Za-zĀ-ž])','g'),'$1'+l])];
  const cache=new Map();
  const tr=s=>{ if(typeof s!=='string'||!/[A-Za-z]/.test(s)) return s; let r=cache.get(s); if(r!==undefined) return r;
    r=s; for(const [re,l] of RULES) r=r.replace(re,l); if(cache.size>4000) cache.clear(); cache.set(s,r); return r; };
  window.tr=tr;

  // Uz kanvas zīmētie uzraksti
  const C=CanvasRenderingContext2D.prototype, f=C.fillText, st=C.strokeText;
  C.fillTextRaw=f; C.strokeTextRaw=st; // spēlētāju vārdiem – bez tulkošanas
  C.fillText=function(t,...a){ return f.call(this,tr(String(t)),...a); };
  C.strokeText=function(t,...a){ return st.call(this,tr(String(t)),...a); };

  // HTML teksts un title atribūti
  const SKIP=new Set(['SCRIPT','STYLE','INPUT','TEXTAREA']);
  const doNode=n=>{ if(n.nodeType===3){ if(n.parentNode&&(SKIP.has(n.parentNode.nodeName)||(n.parentNode.closest&&n.parentNode.closest('[data-notr]')))) return; const t=tr(n.nodeValue); if(t!==n.nodeValue) n.nodeValue=t; }
    else if(n.nodeType===1&&!SKIP.has(n.nodeName)&&!n.hasAttribute('data-notr')){ if(n.title){ const t=tr(n.title); if(t!==n.title) n.title=t; } for(const c of n.childNodes) doNode(c); } };
  const start=()=>{ document.documentElement.lang='lv'; doNode(document.body);
    new MutationObserver(ms=>{ for(const m of ms){ if(m.type==='characterData') doNode(m.target); else if(m.type==='attributes') doNode(m.target); else m.addedNodes.forEach(doNode); } })
      .observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title']}); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
