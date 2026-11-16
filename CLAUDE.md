# Tailers World LV – prasības

Mini spēļu vietne https://tailersworld.lv (GitHub Pages, repo `RihardsABerzins/tailers-world`, push uz `main` = publicēšana).

## Svarīgākais
- **Lietotāji ir bērni**, kas spēlē **telefonos un planšetēs**, nevis datoros.
- Viss jāpārbauda **telefonā vertikāli UN horizontāli** (piem., 390×780 un 780×390), arī planšetē.
- **Testē frontendā iebūvētajā Claude pārlūkā** (Browser pane, `mcp__Claude_Browser__*`) – katrs aģents/sesija savā panelī: lokālais serveris (`python3 -m http.server <ports>`, ne 8777) → `preview_start`/`navigate`, izmērs ar `resize_window` (390×780, 780×390, planšete), pārbaude ar ekrānuzņēmumiem un konsoli. Nevis video ierakstus vai lietotāja Chrome. Testos radio/skaņu neieslēdz, beigās aizver cilnes un serveri.
- Pogas lielas un ērti spiežamas ar pirkstu; teksts īss un saprotams.
- Spēles ir **bez maksas**. Nekādu īstu naudu spēlēs (lootboxi tikai par spēles naudu/precizitāti).
- Bērnu drošība: nevākt personas datus (lietotājvārds + parole, e-pasts tikai pēc izvēles). Publiskajā čatā **tikai gatavas frāzes**; brīvs teksts tikai privātos čukstos, ar rupju vārdu filtru (zvaigznītes) un garu ciparu (telefona numuru) slēpšanu. Var bloķēt un ziņot.

## Mūzika un iestatījumi (visās spēlēs)
- **Radio ir kopīgs visām spēlēm**: `tw-radio.js` (`TWRadio`) – Radio TEV, SWH, Latvijas Radio 5 un **ik pēc ~8 minūtēm Papīra Lidmašīnu dziesma**. Dziesmas – kopīgajā mapē `/music/` (128 kbps MP3). Iestatījumi `localStorage twMusic` – vienādi visās spēlēs.
- Publiskajā repo drīkst būt **tikai izdotās** Papīra Lidmašīnu dziesmas (Spotify singli + albums "Turbulence"). Neizdotās glabājas `~/Documents/Tclaude/music-archive/`.
- **🏠 „Uz sākumu” poga visās spēlēs** – kopīga, ieliek `tw-common.js` (lapām, kas to ielādē ar `../`): vienmēr redzama kreisajā augšējā stūrī virs visiem logiem, 1. pieskāriens – „Uz sākumu?”, 2. – uz sākumlapu. Spēles augšējā josla (`#top`/`#hud`) nobīdīta pa labi par 64 px. Jaunai spēlei nekas nav jādara – tikai jāielādē `../tw-common.js`.
- **Katrā spēlē ir ⚙ iestatījumi**: radio vadība (`TWRadio.controlsHTML()` + `TWRadio.wire(el)`), mūzikas skaļums un efektu skaļums (+ Graffiti: gaišums, valoda). Jaunai spēlei tie jāpievieno.
- **Iestatījumi visās spēlēs izskatās un darbojas vienādi**: ⚙ poga tajā pašā vietā (augšējā joslā), tas pats loga izskats (tumšs panelis, noapaļots, virsraksts „⚙ Iestatījumi”), tā pati secība – 1) radio (⏮ ⏯ ⏭ 🔇 + mūzikas skaļums), 2) efektu skaļums, 3) spēles specifiskie iestatījumi, 4) poga „Gatavs”. Jaunu iestatījumu pievieno visās spēlēs vienādi; atšķirīgu dizainu katrai spēlei netaisa.
- Graffiti arī izmanto `tw-radio.js` (atskaņotāja josla un pauzes iestatījumi vada `TWRadio`).
- **Testos klusums**: lokālajos testa serveros (localhost, 127.0.0.1, file:) radio pats nesāk skanēt (`TEST` tw-radio.js); ar ▶ var ieslēgt. Mainot tw-radio.js, palielini `?v=` visās lapās.

## Struktūra
- **Katrai spēlei sava mape** (`/grafiti/`, nākamā – `/<spēle>/`): `index.html` (iezīmējums), `style.css`, `game.js`, `lang.js` (tulkojumi), mūzika/attēli tajā pašā mapē. Kopīgi tikai `tw-*.js`, `firebase-config.js` un sākumlapa.
- **Katrai spēlei savs Firebase zars**: `grafiti/saves/{uid}`, `grafiti/walls/...` utt. – lai spēļu dati nesajaucas. Kopīgs: `users/`, `stats/`, `ach/`, `presence/`, čats.
- **Katrai spēlei savas medaļas** atbilstoši tās spēles procesiem (grupa `TWA.GROUPS` + `TWA.LIST`), piešķir ar `TWA.sync`.
- **Nauda ir kopīga visām spēlēm** un var iet mīnusā (piem. remonts pēc avārijas; nopelnot parāds nosedzas). Pirkumiem spēle pati prasa, lai naudas pietiek: `wallet/{uid}` (`TW.wallet` tw-common.js – get/set/add ar transakciju/watch). Spēle tur savu skaitli un ik pa laikam nosūta starpību (sk. Graffiti `walletSync`). Sākumlapā redzama kopsumma.
- **Spēlētāja tēls (izskats) ir viens visās spēlēs**: `users/{uid}/look` = {skin, hood ('auto'|krāsa), hat ('cap'|'beanie'|'hair'), cap, mask ('none'|krāsa), pants}. Jaunā spēlē tēlu zīmē no šī.
- `index.html` – sākumlapa ("Labdien!", spēļu kartītes). Jaunu spēli pievieno `GAMES` sarakstā.
- `grafiti/` – Graffiti RPG. Kods raksta tekstus angliski; valodas slānis (skripts `<head>` sākumā, `PHRASES`/`WORDS`) pārtulko visu redzamo latviski. Noklusējums – latviešu; iestatījumos LV/EN slēdzis (localStorage `twLang`). Jaunam tekstam pievieno tulkojumu `PHRASES` sarakstā.

## Instrukcija spēlē
- Pirmajā reizē – mācības darot (`GUIDE`: bultiņa uz sienu → Zīmēt → apvelc → padomi), dzeltens baneris. 10 lapu instrukcija (`TUT_LV`/`TUT_EN`) – pauzē „❓ Kā spēlēt”.
- Pēc sienas – rezultāta kartīte `showResult` (1–3 zvaigznes, zīmējums virs kontūras, ikonas) garā teksta vietā.
- Telefonā nerāda tastatūras taustiņus (`.kh`, `.kbOnly`, `isTouch` teksti).
- Pirmajā reizē rāda soļu instrukciju (1–2 teikumi par katru funkciju + mērķis): `TUT_LV`/`TUT_EN` grafiti/index.html, atzīme `grafitiTut` localStorage; vēlreiz – pauzē „❓ Kā spēlēt”. Jaunai funkcijai pievieno soli.
- Spēlētāju vārdus kanvā zīmē ar `fillTextRaw` (netulko, piem. „Gold”).

## Mobilā vadība (principi)
- **Spied uz objekta pasaulē**: durvis, siena, miskaste, metro, vilciens → tēls pats aiziet un izdara darbību. Staigāšana un lēkšana – tikai ar bultiņām (spiediens uz tukšas vietas neko nedara).
- **Viena kontekstuālā poga** labajā apakšā (īkšķa zonā) rāda, ko tieši var izdarīt (🎨 Zīmēt, 🛒 Veikals, 🍔 Ēst, 🚇 Metro…); paslēpta, ja nav ko darīt. 🫣 poga parādās tikai pie slēptuves.
- Ēdiens: kafejnīcā/picērijā pērk līdzņemšanai (`SNACKS`: kruasāns +15%, hotdogs +30%, burgers +50%, pica +100%; cena × pilsēta), tas ieiet `save.snacks` somā, ēd no somas.
- Zem līmeņa lodziņa (ārpus tā) – 🎒 soma un 🍔 ēdiens % (+ aktīvie efekti); spiežot – logs ar paskaidrojumu un pogu „Lietot”.
- **Tīrs ekrāns**: HUD sakļauts (nauda + līmenis; aizdomas un ēdiens parādās tikai, kad svarīgi; spied, lai izvērstu), radio sakļauts līdz 🎵, priekšmeti sakļauti līdz 🎒.
- Ikonas virs objektiem ar ko var darboties; tuvumā tās pulsē.
- Pogas ≥ 50 px, svarīgākās lielākas; vibrācija (Android) pie darbībām.

## Firebase (projekts `tailers-world`, bezmaksas Spark plāns)
- Konti: lietotājvārds + parole (iekšēji `vards@players.tailersworld.lv`, īstus e-pastus nevācam). Bez ielogošanās spēles aizved uz sākumlapu.
- Realtime Database (europe-west1): `usernames/`, `users/`, `stats/` (līderu saraksts), `presence/{pilsēta}/` (citi spēlētāji spēlē), `fcm/` (paziņojumu atslēgas).
- Drošības noteikumi: `firebase/database.rules.json` – pēc izmaiņām jāielīmē Firebase konsolē (Realtime Database → Rules → Publish).
- Paziņojumi: Firebase konsole → Messaging → jauna kampaņa → web lietotne. iPhone paziņojumi strādā tikai, ja vietne pievienota sākuma ekrānam.
- Konfigurācija: `firebase-config.js`, serviss `firebase-messaging-sw.js`, manifests `manifest.webmanifest`.

- Lomas nosaka pēc konta (uid), nevis vārda: admini = lietotājvārdu `tailerboi` (TailerBoi) un `rihardsgod` īpašnieki (saraksts `TW_ADMINS` firebase-config.js + jāpapildina database.rules.json), moderatori = `roles/{uid}: "mod"` (iecelt var tikai admins). Admins zelta 👑, moderators zils neons 🛡️. Kopīgais kods: `tw-common.js`.
- `admin.html` – panelis adminam/moderatoriem: tiešsaistē visās spēlēs (`online/`), visi spēlētāji, moderatoru iecelšana, izmešana uz 10 min (`kicks/`), spēļu idejas (`ideas/`). Spēlē 🛠 poga redzama, ja ienāk "admina" režīmā (sessionStorage `twMode=staff`).
- Profils (uzspiežot uz sava vārda): iesauka (`nick`, bez emoji, rādās spēlēs) un valoda (`twLang`).
- Jaunā spēlē: izsauc `TW.heartbeat(uid, ...)`, lai admins redzētu spēlētājus tiešsaistē, un klausies `kicks/{uid}`.
- Pēc ielogošanās var pievienot e-pastu (privāts, `users/{uid}/email`, `news` = piekrīt jaunumiem). E-pastu sūtīšanai un paroles atjaunošanai vajag servera funkciju (Firebase Blaze plāns) – vēl nav.
- Čats: `tw-social.js` (`TWS`) – čuksti (`dm/`, `inbox/`), draugi (`friendReq/`, `friends/`), bloķēšana (`blocks/`), sūdzības (`reports/`, redz admin.html), pilsētas frāzes (`chat/{pilsēta}`, `TWS.PHRASES`). Spēlē: pieskaries citam spēlētājam → kartīte; 💬 poga radio joslā; frāzes parādās burbulī virs galvas. Filtrs: `TWS.clean()` (EXACT/START saraksti).
- Tiešsaiste: `TW.active()` (tw-common.js) – lapa redzama un pēdējās 5 min kaut kas spiests. Fonā savienojums tiek atslēgts (`goOffline`), tāpēc spēlētājs pazūd no saraksta; neaktīvs → ieraksti `online/` un `presence/` tiek izdzēsti.
- Admina vārds – zelta krāsā bez spīduma mākoņa.
- Spēlē blakus vārdam mazs 🏅 medaļu skaits (`presence/.../m`).
- Mainot `firebase-config.js`, palielini `?v=` numuru visās lapās (kešatmiņa).

- Medaļas: `tw-ach.js` (`TWA`) – saraksts `TWA.LIST`, grupas `TWA.GROUPS` (profils + katra spēle). Glabājas `ach/{uid}` (publiski), apskatāmas sākumlapā, citu medaļas redz "Citi spēlētāji". Spēle piešķir ar `TWA.sync(uid,ctx)` (Graffiti skaitītāji `save.st`: kastes, bēgšanas, šedevri, ēšana, metro u.c.). Dienas pēc kārtas: `TWA.visit` → `users/{uid}/visits`. Ar 50 medaļām vārds sarkani spīd, ar 100 – zili (`TW.nameHTML(teksts,uid,medaļas)`, spēlē `drawNameTag`). Jaunai spēlei pievieno grupu un medaļas.
- Uzaicini draugu: saite `/?draugs=lietotājvārds`; jaunais spēlētājs pēc profila izveides ieraksta `invites/{uzaicinātājs}/{uid}` un nosūta draudzības pieprasījumu – abi saņem medaļu.
- Graffiti RPG: katrā līmenī 3 sienas (galvenā līmeņa forma + 2 citas formas).
- Graffiti progress glabājas kontā `grafiti/saves/{uid}` (vecais `saves/{uid}` tiek nolasīts vienreiz) (+ kešs `grafitiRPG:{uid}` ierīcē); vecais `grafitiRPG` tiek piešķirts tikai kontam, kura `stats` XP sakrīt.
- Frizētava (💈, `openBarber`): bez maksas maina izskatu `save.look` (āda, jaka/„auto” = krāsas tonis, cepure/adīta/mati, maska vai smaids, bikses); citi to redz (`presence.l`, `lookFrom`). Arkāde, ziedi, velo – tikai dekorācija.
- Tulkojumi: jaunus kešatmiņas numurus (`?v=`) palielina grafiti/index.html, mainot game.js/style.css/lang.js.
- Tulkojumi: PHRASES ir apakšvirknes – tulkojums nedrīkst saturēt pašu avotu (piem. Mask→Maska), citādi bezgalīgs cikls; tādus liek WORDS.
- Apavu veikals (`SHOES`, `save.shoes/shoe`): ātrums kājām līdz ×1,5. Kafejnīca arī pie paša sākuma; norāde „🍔 Kafejnīca”, kad ēdiens < 50 %.
- Vertikālā telefonā iela ~63 % augstumā (`camY0`), zem ceļa pretējā ietve. Ceļa svītras piesaistītas pasaulei.
- Kopīgas sienas: katrs zīmējums ir vektoru slānis (`encodeLayer`, 720×440), glabājas `grafiti/walls/{pilsēta}/w{lot}` (pēdējie 6), citi spēlētāji redz un zīmē pa virsu; žūšana ir tikai savējā (20 s).
- Freestyle (BRĪVĀ SIENA) katras pilsētas sākumā: zīmē ko grib, var „Vispirms notīrīt sienu”. ⚠️ Bērnu drošība: citi redz brīvos zīmējumus – vajadzības gadījumā var notīrīt jebkurš.
- **„Atkārto manu zīmējumu”** – siena ATKĀRTO MANI (`rep`) katras pilsētas sākumā blakus brīvajai sienai: saraksts (`openRepeat`) → „Uzzīmē savu citiem” (oriģināls → `grafiti/repeat/{pilsēta}/{id}` = {u,n,s,t}, pēdējie 12) vai „Atkārtot” cita zīmējumu – oriģināls blāvi kā paraugs (var slēpt), precizitāte ar `evaluate()` pret oriģināla līnijām; nauda/XP kā parastai sienai, **≥90 % – lootbox**. Atkārtotājs ieraksta `r/{uid}`, autora spēle (`repCheck`, `save.repMine`) iedod bonusu (~€6 × pilsēta) par katru atkārtotāju vienreiz. Bērnu drošība: 🚩 (2 pieskārieni) – ziņo `reports/` un notīra visiem; savu var dzēst. Sienu atslēgas `w{wk}` neietver ATKĀRTO sienas (`lotByWk`), lai vecie kopīgie zīmējumi paliek savās vietās.
- Policija: auto brauc līdzi un apsteidz, izlaiž policistu priekšā; pie 2+★ pastiprinājums no otras puses (`police.extra`). Policists satver (palēnina), izlec, lai izrautos. Kājām noķer, ar skrejriteni/auto var aizbēgt.
- XP: `LV` = 60·n^1.15, `xpFor` = 20+14·(līm.).
- Formas: 1. līmenis – 4 vienkāršās, no 2. līmeņa plašs klāsts (smaidiņš, lidmašīna…), no 4. – visas 18 (`pickShape`).
- Krāsas iztērējas (`save.paint[id]` 0–100 %, ~20 % par apli); uzpilda Krāsu depo (melnā €20, sarkanā €25, citas 40 % no cenas). Katru nakti 02:00 (servera laiks) +€20 dāvana (`save.daily`, `dailyGift`).
- Zīmēšana aizņem visu ekrānu; pielaide ekrāna pikseļos (min 12 px). Izsalcis tēls (🍔 burbulis) iet lēnāk, un rokas trīc (līnija raustās → mazāk precīzi), bet zīmēt var.
- Policija: aizdomas rada pats zīmēšanas fakts – cik cilvēku redz (👀), patruļa, zvanītāji; ne zīmējuma kvalitāte. Notverts → sods 10%+2%/★, izlaiž pie metro tajā pašā pilsētā.
- No 2. pilsētas katra līmeņa 2 papildu sienas prasa noteiktu krāsu (`need`, katrā pilsētā jauna); bez tās jāpērk, ar citu krāsu – puse samaksas. Krāsu bonuss pēc līniju garuma.

## Ātrā palīdzība 112 (`/atra-palidziba/`)
- Pilsēta no putna lidojuma (ielu režģis 10×10, kvartāli: mājas, parki, stāvvietas, laukumi, slimnīca, benzīntanki), satiksme ar luksoforiem un sastrēgumiem (`jams`), sirēna – mašīnas nobrauc malā.
- Vadība: kursorsvira parādās tur, kur pieskaras kartei (telefons) / bultiņas (dators), S – sirēna, E – darbība. Maršruts (Dijkstra, apiet sastrēgumus) – dzeltena līnija + minikarte.
- Izsaukums: jautājumi (noderīgi/nevajadzīgi) → kas noticis → palīdzība no somas (`cases.js`: `TOOLS`, `CASES` ar need/bonus) → sirds masāža ritmā 100–120/min (+ defibrilators) → slimnīca vai uz vietas → rezultāts % pa daļām + „Vai zināji?” + „zvani 112”. **Matemātiku šajā spēlē neliekam.** Operācijas – nākotnes slimnīcas spēlē.
- Aina pie pacienta (`treat.js`, `Treat.mount`): zīmēta katram gadījumam – vieta (`place`), rekvizīts (`prop`), pacients pozā (`pose`: sit/slump/lie), izskats (`p`), trauma (`inj`). Palīdzība ar **vilkšanu**: rīks no somas uz ķermeņa zonu (`TOOLS[id].z`, gadījuma `zones` pārraksta; 'wound' = trauma); secība `first` (piem. plāksteris pēc tīrīšanas); mīti ar paskaidrojumu (`why`) dod mīnusu. Sirds masāža atveras virs ainas, defibrilators – poga „ŠOKS”.
- **Ainu foni** – uzrenderēti Blenderī (`atra-palidziba/bg/<vieta>_d|_n.webp`, 7 vietas × diena/nakts, ~20–40 KB katrs), multfilmu stilā ar kontūrām; tēli zīmēti virsū ar kodu. Kamera 1.6 m, horizonts ainas vidū. Skripts `bg/build_bg.py`; jaunai vietai – uzbūvē, uzrenderē un pievieno `HAS` sarakstā treat.js (citādi zīmē procedurālo fonu). Mainot attēlus, palielini `BGV`. **Tēli** (pacients 7 pozās: sit_def/fr/burn/bee, slump_def, bench, lie; mediķis ar cepuri/adīto/matiem) arī no Blendera – `bg/char/<poza>_<slānis>.webp`: balti slāņi `skin/shirt/pants/hair*` iekrāso spēlē (`chTint`), `fixed` un `line_*` – kā ir; sejas izteiksmes zīmē kods (`head(..., faceOnly)`). Pozas punkti nāk no `Treat.geo`, tāpēc zonas sakrīt. Jaunai pozai – uzrenderē un pievieno `CHKEYS`; mainot – palielini `CHV`.
- Pilsēta 14×14 ielas. **3D mājas** (`drawBuilding`): sienas ar logiem un jumts ar perspektīvu no ekrāna centra (`PK`), zīmē pēc mašīnām, tālākās vispirms; slimnīca un benzīntanki arī 3D.
- **🛞 Stūres skats** (`fp.js`, pirmā persona, three.js r128 no cdnjs, ielādējas tikai ieslēdzot; poga blakus sirēnai vai V): tā pati pilsēta 3D (instanced mājas ar logiem, koki, mašīnas, luksofori, mērķa bāka), panelis ar stūri un spidometru, bultiņa uz nākamo pagriezienu. Vadība: velk pa kreisi/labi – stūrē, augšup – gāze, lejup – bremze.
- Stūres skatā: mašīnas ar sedana profilu, stikliem, riteņiem, lukturiem (bremžu – spožāki); maršruts – spīdošas bultiņas uz ceļa.
- 3D modeļi stūres skatā: Kenney CC0 (`atra-palidziba/models/`: cars, nature, roads + LICENSE faili), ielādē ar three.js GLTFLoader (jsdelivr r128), katra modeļa daļa – InstancedMesh.
- Karte (minikarte 150 px) – uzspiežot atveras liela pa vidu ekrāna.
- Nakts stils: maigas ielu lampas, krāsaini logi, neona kontūras uz ~1/4 māju jumtiem (`NEON`), nevis spožs dzeltenums. Parki: dzīvžogs, zāles laukumi, līkumoti celiņi ar strūklaku centrā, dīķis ar krastu/niedrēm/ūdensrozēm, puķu dobes, soliņi, lapu koki un egles.
- **Diena un nakts** (`DAYLEN` 6 min, `hourNow`, `isNight` 21–6): naktī tumsa + ielu lampas, logi, lukturi; ~60% mašīnu nav; luksofori mirgo dzelteni ('f'); izsaukumi grūtāki (līmenis +2) un ×1.5 XP/nauda.
- Satiksme nedrīkst braukt cauri citai mašīnai: konusa pārbaude priekšā (`fwd/lat`), pagriezienā gaida, ja izbrauktuve aizņemta; pret iestrēgšanu – pēc 3 s cits virziens, pēc 12 s ārpus redzesloka parādās citur.
- Luksofori: 20 s cikls ar dzelteno (`lightState`); katrai joslai krāsaina stop līnija + luksofors labajā stūrī. Satiksme: plāno pagriezienu pirms krustojuma (rādītāji mirgo), brauc pa līkni, bremžu lukturi, apstājas uz sarkano/dzelteno.
- Spēle ir **publiska** (sākumlapā `GAMES` sarakstā). Telefonā (<560 px) pogas labajā pusē divās rindās, lai neaizsedz kursorsviru kreisajā apakšā.
- **Simulētāji** (`fake: true`, `mood: 'fake'`): pacients izliekas – lielāko laiku vaid, ik ~4 s pamirkšķina un pasmīn; pavedieni bildē ir rekvizīti (`test` – kontroldarbs, `ketchup` – kečupa pudele + telefons REC, `icecream` – saldējums “lauztajā” rokā). Pareizā diagnoze „Izliekas…”, vajag tikai nomierināt, uz slimnīcu nevest; fakts par viltus 112 zvaniem.
- **🚁 Helikopters** (`save.heli`): pērk par €10000 no kopējā maciņa (poga 🚁 virs darbības pogas vai H). Pēc tam ar to pašu pogu pārslēdz mašīna ↔ helikopters (jāapstājas; nolaisties var tikai uz ielas). Lido virs mājām uz kursorsviras pusi (ekrāna virzieni), bez sadursmēm, maršruts – taisna līnija (`routeTo`), satiksme uz to nereaģē, nolaišanās rādiuss lielāks, degviela tērējas ātrāk; stūres skats tikai mašīnai.
- Nauda: kopīgais maciņš; ienākumi par izsaukumu €8 + rezultāts%/4 (naktī ×1.5); tēriņi – degviela (pilna bāka €20, benzīntankā), avārija = remonts −€1 (tikai stiprs trieciens: siena v·leņķis>230, mašīna v>150).
- Braukšanas palīgi bērniem: kursorsviras virziens ±26° pievelkas pie ielas ass; mašīna priekšā vai no sāniem (laiks līdz sadursmei <0.8 s) – piebremzē (līdz ~110, var apbraukt); pirms mājas stūra ātrumā >200 – piebremzē; pie apmales viegli pabīda atpakaļ uz ielas.
- Teksti rakstīti latviski uzreiz (bez lang.js). Saglabāšana `ap/saves/{uid}`, medaļas grupa `ap` (apCalls, apSaved, apCpr, apPerfect, apLevel), mediķis zīmēts pēc `users/{uid}/look`.
- Kešatmiņa: mainot style.css/game.js/cases.js, palielini `?v=` atra-palidziba/index.html.

## Skola (`/skola/`)
- **Viena skola, kā IQ spēle** – priekšmetus un klasi neizvēlas. Stundā 8 jautājumi: 5 fakti (Latvija, daba, valodas, loģikas mīklas – `questions.js`), 2 matemātika (`mathQ`), 1 skaitļu virkne „kas nāk tālāk?” (`logicQ`).
- **3D klase no skolotāja galda** (`layout`, `drawRoom`): aizmugurējā siena ar tāfeli (horizontāli – starp augšējiem lodziņiem), sānu sienas ar logiem/durvīm, grīda ar dēļiem uz pazušanas punktu (`LY.room`), pulkstenis (ja nav zem joslas). Apakšā skolotāja galds (`teacherDesk`) ar žurnālu, grāmatām, ābolu un ☕ krūzi. Rotājumi zīmēti (skapīši, globuss, akvārijs, puķe, plakāts, kaķis, virtene), ne emoji.
- **16 skolēni** 4×4 ar ejām starp soliem, pirmā rinda atstatus no skolotāja galda; tālākie mazāki (maigāka perspektīva `hv`), 3D soli (`desk3d`). Katram jautājumam 4 paceļ rokas ar atbilžu burbuļiem (`pickAnswerers` – ne blakus, ne viens aiz otra, ne tie, kuru burbulis aizsegtu tāfeli), pārējie sēž. Pieskaries tam, kuram pareizā. Nepareizi → „Mācību brīdis” (pareizā atbilde + paskaidrojums), bez soda.
- **Draiskuļi** (`PRANKS`: lidmašīna uz tāfeli, varde, telefons, košļene, bungas, snauda, **spļauj papīra bumbiņas uz skolotāju** – trāpa ekrānā (`splats`), **met bumbiņu citam** („Ei! 😠”), **zīmīte kaimiņam**): virs galvas ❗ (`warnDur`), tad joks 2,6 s. Ja draiskojas tas, kam pareizā atbilde, burbulis pazūd, līdz viņu pieķer. Pieskaries laikus → jautrs fakts, noskaņojums +6/+3; palaid garām → −10.
- **Jautājumu grūtība = klase 1.–9.** (`grade`): `autoGrade` aug ar līmeni (1 + (līm.−1)/2); **📁 mapīte uz skolotāja galda** (`gradeSheet`) – „Klases žurnāls”: redz, līdz kurai klasei aizgājis, var izvēlēties zemāku (`save.grade`, 0 = automātiski), augstākās 🔒. No klases atkarīga faktu pakāpe `maxTier` (1 / no 2. kl. 2 / no 5. kl. 3), matemātikas minimums un maksimums, jautājuma laiks.
- **Draiskuļi aug ar līmeni** (`tLv`): draiskuļi reizē `maxBusy` (1/2/3 no 4./8. līm.), joki stundā `maxPerQ`, īsāks brīdinājums. Matemātika un virknes arī pielāgojas (`save.ml` 1–8). Lobijā redzams līmenis, grūtība un draiskuļu skaits.
- Fakti – `questions.js` (`FACTS`: [priekšmets, pakāpe, jautājums, atbilde, 'nepareizās', paskaidrojums]); jaunus pievieno saraksta BEIGĀS (id pēc kārtas priekšmetā). Kļūdas atkārto (`save.miss`), nesen redzētos atliek (`save.seen`).
- **⏱ Taimeris** jautājumam (`qDur`: 16 s + teksta garums, mazāk augstākā līmenī, 10–30 s) – josla uz skolotāja galda; laiks beidzas → „⏰ Laiks beidzās!” mācību brīdis.
- **Skolotāja ⚡ enerģija** (`energy`, `save.en`): krīt stundā (−0,3/s, palaists joks −4), zem 30 – ekrāns satumst un ❗ brīdinājumi īsāki, 0 – „snauž”, klases noskaņojums krīt. ☕ krūze uz galda: +40, atkal pilna pēc 35 s. **Skolas diena** (`save.day`, `DAY`): 4 stundas ar pulksteni augšā (8:30…), pēc 2. – 🍽 pusdienu pauze (enerģija 100%), pēc 4. – dienas bonuss €10.
- **🚽 Tualete** (`wcStart`/`wcDecide`): kāds paceļ roku „Var uz tualeti?” ar pogām Laist/Nē. Šmaucējs (`fake`) smīn, kabatā 📱; tiešām vajag – dīdās un svīst. Pareizs lēmums +4 noskaņojums, €1, 5 XP; palaists šmaucējs atgriežas un „spēlēja telefonā”; neatbildot 9 s – tiešām vajadzīgajam mīnuss.
- **Tāfeles krāsa** (`BOARDS`, `save.board/boards`): zaļa (bez maksas), melna, zila, ķiršu, baltā marķieru – veikalā „🛍 Klase un tāfele”.
- Pirmajā stundā mācības ar dzelteno baneri (1. jautājumā joku nav, 2. – lēns). Atvērts logs = pauze (`LT` neiet).
- Atlīdzība: €3 + €2 par pareizo + €1 par pieķerto + €1 par pareizu tualetes lēmumu (+€5, ja noskaņojums ≥80; +€5 par 8/8; +€10 dienas beigās); XP 10 par pareizo + 5 par pieķerto/tualeti (+20 par 8/8).
- 🛍 Klases rotājumi (`DECO`, kopīgā nauda, `save.deco`). Saglabāšana `skola/saves/{uid}`, medaļas grupa `skola` (stundas, bez kļūdām, pieķertie, pareizās atbildes, līmenis, tualetes lēmumi `save.wcOk`, pilnas skolas dienas `day/4`, sasniegtā klase, kafija `save.coffee`, rotājumi+tāfeles).
- Pagaidām **tikai adminiem/moderatoriem** (slēgums game.js; sākumlapā aizslēgta kartīte ar 🛠 `skTest`). Kešatmiņa: mainot failus, palielini `?v=` skola/index.html.

## Mega rampa (`/rampa/`)
- **3D skats no aizmugures** (three.js r128 + GLTFLoader): darbnīca → „🚀 Aiziet!” → **svira** (`#lever`, `release()`) → barjera paceļas → milzu U-rampa → lidojums. **Jebkurš pieskāriens** zemei/jumtam/sienai (vai izšautajam pilotam) **uzreiz beidz lidojumu** – nav ripošanas un nav izpletņa. Avārijā daļas atlūzt, rezultāts pēc ~0,9 s. Poga **✖ Beigt** – pārtrauc bez naudas. Poga **🚀 Katapulta** (lidojumā) – pilots izšaujas uz augšu un nedaudz uz priekšu, krīt ātrāk; attālums = kur pilots pieskaras (+€3).
- Mazāk teksta: bez paskaidrojumu baneriem; rezultāts – ikonas, attālums, 💰, ⭐.
- **Fizika** `physics.js` (`RP`, testē ar `jsc`): z, y, x + kurss `psi` + sānsvere `bank` (koordinēts pagrieziens), fiksēts solis 1/120 s + interpolācija; cēlējspēks ⟂ ātrumam, krīt virs 15°; garāki spārni (AR) → mazāka inducētā pretestība; riteņi rampā zaudē mazāk. Palīgs tur 1g lidojumu uz labāko planēšanas leņķi. **Vadība – ekrāna puses** (`TOUCH`, `#padL/#padR`): turi kreisajā pusē = deguns augšup (līdz 13,5° – bez cēlējspēka zuduma), labajā = lejup; turot pavelc ⬅➡ = stūrē (lidmašīna sasveras ≤45°; skūteris/mašīna gaisā nedaudz stūrē, puses = salto).
- **Lidmašīnas šasija** (`body`, 35 līm.): 0 – 🥔 kartupelis ar acīm, tad kartona kaste, saplākšņa, alumīnija, sacīkšu, reaktīvā (Blendera `Body` ar krāsu); ar līmeni lielāka (`af` mērogs .74→1.16), mazāka pretestība `cda`, izturīgāka `crashV`.
- **Uzlabojumi: katrai pozīcijai 35 līmeņi** (`slot()` physics.js: 5 pakāpes × 7, efekts aug pakāpeniski, cena `price(base, L)` ≈ ×1,15). Rampa arī 35 līmeņi (55 → 220 m), mala 18 m, nolaišanās rampa 15 m – jau sākumā lidmašīna atstāj rampu ar lidošanai pietiekamu ātrumu. Darbnīcā: `Lv/35`, ◀ ▶ pārslēdz uz jebkuru jau nopirktu līmeni (`own[vid]['u_' + slot]`), „+1 €…” pērk nākamo un uzreiz lieto. Spārnu izmērs netiek izvēlēts. Lidojums: €5 + €1/5 m + rekords + salto/jumti; pirmais lēciens +€25.
- **Pilsēta** (`genCity`, sēkla): visas ēkas ir šķēršļi (`surfAt(W, x, z)`, režģis 20 m), slīpi jumti, nolaišanās rampa aiz malas, parki (dzīvžogi, celiņi, soliņi, dīķi, Kenney koki no `atra-palidziba/models/nature`), ielu koki, cilvēki (low-poly instancēti, skatītāji pie rampas), ielu lampas, stāvošas mašīnas. Instancētie objekti sadalīti 350 m gabalos (`chunkCity`/`cullChunks`) – zīmē tikai tuvos (telefonā ~200–350 k trijstūru). DPR ≤ 1,5 skārienekrānos.
- **Diena/nakts** kā citās spēlēs: 6 min diennakts (`DAYLEN`, `hourNow`, `isNight` 21–6), sākas 10:00; debesis, saule, migla mainās, naktī logi deg (šeidera `uNight`), lampas spīd, zvaigznes; pulkstenis augšējā lodziņā.
- **Modeļi no Blendera**: `rampa/models.glb` (avots `models_src.blend`): lidmašīna (Body, Nose, Canopy, WingL/R – laidums 0..1, mērogo pēc `span/chord`, Fin, HStab, Prop), Wheel, skūteris (SDeck, SStem), mašīna (CBody, CCabin), tēls pa daļām (Torso, LegL/R, ArmL/R, Head, Helmet), kaija (BBody, BWingL/R). Krāsa pēc materiāla nosaukuma – `mdl(nosaukums, {materiāls: krāsa})`.
- **Gaisa plūsmas līnijas** (`flowAt` + `updateStreaks`, 24 līnijas): elipsoīds, spārna augšplūsma/lejupplūsma, virpuļi aiz spārnu galiem, turbulenta vaga; pa līnijām slīd „komētas”. Dzeltena – brīva plūsma, balta – paātrinās, oranža/sarkana – neveikls priekšgals, zilgana – vaga. Bez spēku bultām; iestatījumos var izslēgt.
- **Putni** (`BIRDS`, bariņi pa 3): ietriecoties nobirst spalvas, putns aizlido; trāpījums priekšā ar dzinēju → dzinējs apstājas (dūmo).
- Kamera piesieta braucamrīkam (gludi mainās tikai nobīde – neraustās). Saglabāšana `rampa/saves/{uid}`, medaļas grupa `rampa` (rpFlights, rpPlane, rpLandP, rpScoot, rpLandS, rpFlip, rpCar, rpRoof, rpCrash, rpBird, rpLevel). Iestatījumi: ⚙ kā citās spēlēs + 🧭 palīgs, 🌬 strīpas.
- Pagaidām **tikai adminiem/moderatoriem** (slēgums game.js; sākumlapā kartīte ar 🛠 `rpTest`). Kešatmiņa: mainot failus, palielini `?v=` rampa/index.html. Lokāli (http) bez konta, nauda – `localStorage rpWalletDev`.

## Plānots
- "Atbalsti mani" saite sākumlapā.
