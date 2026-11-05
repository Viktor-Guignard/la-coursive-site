/* L'app « Ma carte » de La Galette a déménagé sur
   admin.vikto-labs.fr/la-galette/mobile/. Ce service worker remplace
   l'ancien : il vide son cache (seulement celui de La Galette : la même
   adresse github.io sert aussi d'autres apps) puis se désinstalle.
   La page d'ici renvoie ensuite vers la nouvelle adresse. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('galette-')).map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
  );
});
