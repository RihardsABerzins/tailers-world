// Paziņojumu serviss (darbojas fonā, kad lapa ir aizvērta)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
importScripts('firebase-config.js');

const messaging = firebase.messaging();
// Ziņas ar "notification" daļu Firebase parāda pats; šeit tikai datu ziņas
messaging.onBackgroundMessage(payload => {
  if (payload.notification) return;
  const d = payload.data || {};
  self.registration.showNotification(d.title || 'Tailers World LV', { body: d.body || '', icon: 'icon-192.png', data: { url: d.url || '/' } });
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.openWindow(url));
});
