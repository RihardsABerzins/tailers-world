// Firebase konfigurācija. Šī web konfigurācija nav slepena – datus sargā datubāzes drošības noteikumi (firebase/database.rules.json).
window.TW_FIREBASE = {
  apiKey: "AIzaSyAvQPh1FwsIJXgzAoHUPS90PfAXoLKgooc",
  authDomain: "tailers-world.firebaseapp.com",
  databaseURL: "https://tailers-world-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tailers-world",
  storageBucket: "tailers-world.firebasestorage.app",
  messagingSenderId: "182411538099",
  appId: "1:182411538099:web:d23731a05650cbd1740ac6"
};
// Web Push publiskā atslēga (paziņojumiem)
window.TW_VAPID = "BB1NfDDOWNveuikJ72DotNFfr2arnI5SOhKhUvyprqA5MuhluLHtux75pKYwfoxQwW2mwN58Z1H4WAS-8gJpFmk";
// Lietotājvārds tiek pārvērsts par iekšēju "e-pastu" – īstu e-pastu nevācam
window.TW_USER_DOMAIN = "players.tailersworld.lv";
window.twUserEmail = name => name.toLowerCase() + "@" + window.TW_USER_DOMAIN;
// Admini (lietotājvārdi mazajiem burtiem). Kroni var parādīt tikai īstais vārda īpašnieks – to pārbauda drošības noteikumi.
window.TW_ADMINS = ["tailerboi", "rihardsgod"];
window.twIsAdmin = name => !!name && window.TW_ADMINS.includes(String(name).toLowerCase());
if (window.firebase && !firebase.apps.length) firebase.initializeApp(window.TW_FIREBASE);
