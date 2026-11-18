// Ancien service worker qui mettait en cache les tuiles d'OpenStreetMap. Le fond
// de carte vient maintenant d'OpenFreeMap (tuiles vectorielles, déjà mises en
// cache par le navigateur) : ce fichier efface l'ancien cache et se désinstalle
// chez les visiteurs qui l'avaient. À garder quelques mois, puis supprimer.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(noms.filter((n) => n.startsWith('avant-apres-tiles-')).map((n) => caches.delete(n)));
    await self.registration.unregister();
  })());
});
