// Service worker : le jeu reste jouable hors connexion une fois installé.
// Stratégie « réseau d'abord » : en ligne on reçoit toujours la dernière version, hors ligne on joue depuis le cache.
const CACHE = 'dbq-v2';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'js/font.js',
  'js/audio.js', 'js/options.js',
  'js/sprites.js',
  'js/monsters.js',
  'js/gfx.js',
  'js/data.js',
  'js/gear.js',
  'js/techs.js',
  'js/engine.js',
  'js/ui.js',
  'js/field.js', 'js/hud.js',
  'js/battle.js',
  'js/minigames.js',
  'js/worldmap.js',
  'js/maps.js', 'js/tournoi.js', 'js/progress.js', 'js/heroes.js', 'js/explore.js', 'js/modes.js',
  'js/main.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
