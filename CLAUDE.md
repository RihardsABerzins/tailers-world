# Tailers World LV – prasības

Mini spēļu vietne https://tailersworld.lv (GitHub Pages, repo `RihardsABerzins/tailers-world`, push uz `main` = publicēšana).

## Svarīgākais
- **Lietotāji ir bērni**, kas spēlē **telefonos un planšetēs**, nevis datoros.
- Viss jāpārbauda **telefonā vertikāli UN horizontāli** (piem., 390×780 un 780×390), arī planšetē.
- Pogas lielas un ērti spiežamas ar pirkstu; teksts īss un saprotams.
- Spēles ir **bez maksas**. Nekādu īstu naudu spēlēs (lootboxi tikai par spēles naudu/precizitāti).
- Bērnu drošība: nevākt personas datus (lietotājvārds + parole, bez e-pasta), nekādu brīvu čatu; citu spēlētāju vārdi tikai kā etiķetes.

## Mūzika
- Spēlē skan latviešu radio (Radio TEV, SWH, Latvijas Radio 5) un **ik pēc ~8 minūtēm Papīra Lidmašīnu dziesma**.
- Publiskajā repo drīkst būt **tikai izdotās** Papīra Lidmašīnu dziesmas (Spotify singli + albums "Turbulence"), 128 kbps MP3. Neizdotās glabājas `~/Documents/Tclaude/music-archive/`.

## Struktūra
- `index.html` – sākumlapa ("Labdien!", spēļu kartītes). Jaunu spēli pievieno `GAMES` sarakstā.
- `grafiti/` – Graffiti RPG. Kods raksta tekstus angliski; valodas slānis (skripts `<head>` sākumā, `PHRASES`/`WORDS`) pārtulko visu redzamo latviski. Noklusējums – latviešu; iestatījumos LV/EN slēdzis (localStorage `twLang`). Jaunam tekstam pievieno tulkojumu `PHRASES` sarakstā.

## Firebase (projekts `tailers-world`, bezmaksas Spark plāns)
- Konti: lietotājvārds + parole (iekšēji `vards@players.tailersworld.lv`, īstus e-pastus nevācam). Bez ielogošanās spēles aizved uz sākumlapu.
- Realtime Database (europe-west1): `usernames/`, `users/`, `stats/` (līderu saraksts), `presence/{pilsēta}/` (citi spēlētāji spēlē), `fcm/` (paziņojumu atslēgas).
- Drošības noteikumi: `firebase/database.rules.json` – pēc izmaiņām jāielīmē Firebase konsolē (Realtime Database → Rules → Publish).
- Paziņojumi: Firebase konsole → Messaging → jauna kampaņa → web lietotne. iPhone paziņojumi strādā tikai, ja vietne pievienota sākuma ekrānam.
- Konfigurācija: `firebase-config.js`, serviss `firebase-messaging-sw.js`, manifests `manifest.webmanifest`.

- Lomas nosaka pēc konta (uid), nevis vārda: admins = lietotājvārda `tailerboi` īpašnieks (TailerBoi), moderatori = `roles/{uid}: "mod"` (iecelt var tikai admins). Admins zelta 👑, moderators zils neons 🛡️. Kopīgais kods: `tw-common.js`.
- `admin.html` – panelis adminam/moderatoriem: tiešsaistē visās spēlēs (`online/`), visi spēlētāji, moderatoru iecelšana, izmešana uz 10 min (`kicks/`), spēļu idejas (`ideas/`). Spēlē 🛠 poga redzama, ja ienāk "admina" režīmā (sessionStorage `twMode=staff`).
- Profils (uzspiežot uz sava vārda): iesauka (`nick`, bez emoji, rādās spēlēs) un valoda (`twLang`).
- Jaunā spēlē: izsauc `TW.heartbeat(uid, ...)`, lai admins redzētu spēlētājus tiešsaistē, un klausies `kicks/{uid}`.
- Pēc ielogošanās var pievienot e-pastu (privāts, `users/{uid}/email`, `news` = piekrīt jaunumiem). E-pastu sūtīšanai un paroles atjaunošanai vajag servera funkciju (Firebase Blaze plāns) – vēl nav.
- Mainot `firebase-config.js`, palielini `?v=` numuru visās lapās (kešatmiņa).

## Plānots
- Sasniegumi (achievements).
- "Atbalsti mani" saite sākumlapā.
