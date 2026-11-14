# Tailers World LV – prasības

Mini spēļu vietne https://tailersworld.lv (GitHub Pages, repo `RihardsABerzins/tailers-world`, push uz `main` = publicēšana).

## Svarīgākais
- **Lietotāji ir bērni**, kas spēlē **telefonos un planšetēs**, nevis datoros.
- Viss jāpārbauda **telefonā vertikāli UN horizontāli** (piem., 390×780 un 780×390), arī planšetē.
- Pogas lielas un ērti spiežamas ar pirkstu; teksts īss un saprotams.
- Spēles ir **bez maksas**. Nekādu īstu naudu spēlēs (lootboxi tikai par spēles naudu/precizitāti).
- Bērnu drošība: nevākt personas datus (lietotājvārds + parole, e-pasts tikai pēc izvēles). Publiskajā čatā **tikai gatavas frāzes**; brīvs teksts tikai privātos čukstos, ar rupju vārdu filtru (zvaigznītes) un garu ciparu (telefona numuru) slēpšanu. Var bloķēt un ziņot.

## Mūzika
- Spēlē skan latviešu radio (Radio TEV, SWH, Latvijas Radio 5) un **ik pēc ~8 minūtēm Papīra Lidmašīnu dziesma**.
- Publiskajā repo drīkst būt **tikai izdotās** Papīra Lidmašīnu dziesmas (Spotify singli + albums "Turbulence"), 128 kbps MP3. Neizdotās glabājas `~/Documents/Tclaude/music-archive/`.

## Struktūra
- `index.html` – sākumlapa ("Labdien!", spēļu kartītes). Jaunu spēli pievieno `GAMES` sarakstā.
- `grafiti/` – Graffiti RPG. Kods raksta tekstus angliski; valodas slānis (skripts `<head>` sākumā, `PHRASES`/`WORDS`) pārtulko visu redzamo latviski. Noklusējums – latviešu; iestatījumos LV/EN slēdzis (localStorage `twLang`). Jaunam tekstam pievieno tulkojumu `PHRASES` sarakstā.

## Instrukcija spēlē
- Pirmajā reizē rāda soļu instrukciju (1–2 teikumi par katru funkciju + mērķis): `TUT_LV`/`TUT_EN` grafiti/index.html, atzīme `grafitiTut` localStorage; vēlreiz – pauzē „❓ Kā spēlēt”. Jaunai funkcijai pievieno soli.
- Spēlētāju vārdus kanvā zīmē ar `fillTextRaw` (netulko, piem. „Gold”).

## Mobilā vadība (principi)
- **Spied uz objekta pasaulē**: durvis, siena, miskaste, metro, vilciens → tēls pats aiziet un izdara darbību. Staigāšana un lēkšana – tikai ar bultiņām (spiediens uz tukšas vietas neko nedara).
- **Viena kontekstuālā poga** labajā apakšā (īkšķa zonā) rāda, ko tieši var izdarīt (🎨 Zīmēt, 🛒 Veikals, 🍔 Ēst, 🚇 Metro…); paslēpta, ja nav ko darīt. 🫣 poga parādās tikai pie slēptuves.
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
- Spēlē blakus vārdam mazs 🏅 medaļu skaits (`presence/.../m`).
- Mainot `firebase-config.js`, palielini `?v=` numuru visās lapās (kešatmiņa).

- Medaļas: `tw-ach.js` (`TWA`) – saraksts `TWA.LIST`, grupas `TWA.GROUPS` (profils + katra spēle). Glabājas `ach/{uid}` (publiski), apskatāmas sākumlapā, citu medaļas redz "Citi spēlētāji". Spēle piešķir ar `TWA.sync(uid,ctx)` (Graffiti skaitītāji `save.st`: kastes, bēgšanas, šedevri, ēšana, metro u.c.). Dienas pēc kārtas: `TWA.visit` → `users/{uid}/visits`. Ar 50 medaļām vārds sarkani spīd, ar 100 – zili (`TW.nameHTML(teksts,uid,medaļas)`, spēlē `drawNameTag`). Jaunai spēlei pievieno grupu un medaļas.
- Uzaicini draugu: saite `/?draugs=lietotājvārds`; jaunais spēlētājs pēc profila izveides ieraksta `invites/{uzaicinātājs}/{uid}` un nosūta draudzības pieprasījumu – abi saņem medaļu.
- Graffiti RPG: katrā līmenī 3 sienas (galvenā līmeņa forma + 2 citas formas).
- Graffiti progress glabājas kontā `saves/{uid}` (+ kešs `grafitiRPG:{uid}` ierīcē); vecais `grafitiRPG` tiek piešķirts tikai kontam, kura `stats` XP sakrīt.
- Formas: 1. līmenis – 4 vienkāršās, no 2. līmeņa plašs klāsts (smaidiņš, lidmašīna…), no 4. – visas 18 (`pickShape`).
- Krāsas iztērējas (`save.paint[id]` 0–100 %, ~20 % par apli); uzpilda Krāsu depo (melnā €20, sarkanā €25, citas 40 % no cenas). Katru nakti 02:00 (servera laiks) +€20 dāvana (`save.daily`, `dailyGift`).
- Zīmēšana aizņem visu ekrānu; pielaide ekrāna pikseļos (min 12 px). Izsalcis tēls (🍔 burbulis) iet un krāso lēni, bet var zīmēt.
- Policija: aizdomas rada pats zīmēšanas fakts – cik cilvēku redz (👀), patruļa, zvanītāji; ne zīmējuma kvalitāte. Notverts → sods 10%+2%/★, izlaiž pie metro tajā pašā pilsētā.
- No 2. pilsētas katra līmeņa 2 papildu sienas prasa noteiktu krāsu (`need`, katrā pilsētā jauna); bez tās jāpērk, ar citu krāsu – puse samaksas. Krāsu bonuss pēc līniju garuma.

## Plānots
- "Atbalsti mani" saite sākumlapā.
