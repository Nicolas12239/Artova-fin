// Service worker ArTova : application installable, ressources statiques en
// cache et page hors ligne. Les pages HTML ne sont jamais mises en cache
// (elles dépendent de la session), seules les ressources immuables le sont.
const VERSION = "artova-v1";
const CACHE_STATIQUE = `${VERSION}-statique`;
const CACHE_IMAGES = `${VERSION}-images`;
const PAGE_HORS_LIGNE = "/hors-ligne";
const MAX_IMAGES = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_STATIQUE)
      .then((cache) =>
        cache.addAll([
          PAGE_HORS_LIGNE,
          "/icons/icon-192.png",
          "/logo/ArTova_logo_complet_fondclair.svg",
          "/logo/ArTova_monogramme_AT_bicolore.svg",
        ]),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(cles.filter((cle) => !cle.startsWith(VERSION)).map((cle) => caches.delete(cle))),
      )
      .then(() => self.clients.claim()),
  );
});

async function limiter(nomCache, max) {
  const cache = await caches.open(nomCache);
  const cles = await cache.keys();
  for (const cle of cles.slice(0, Math.max(0, cles.length - max))) await cache.delete(cle);
}

async function cacheDabord(requete, nomCache) {
  const cache = await caches.open(nomCache);
  const enCache = await cache.match(requete);
  if (enCache) return enCache;
  const reponse = await fetch(requete);
  if (reponse.ok) {
    cache.put(requete, reponse.clone());
    if (nomCache === CACHE_IMAGES) limiter(CACHE_IMAGES, MAX_IMAGES);
  }
  return reponse;
}

self.addEventListener("fetch", (event) => {
  const requete = event.request;
  if (requete.method !== "GET") return;
  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;

  // Navigation : toujours le réseau ; page hors ligne si la connexion manque.
  if (requete.mode === "navigate") {
    event.respondWith(
      fetch(requete).catch(async () => (await caches.match(PAGE_HORS_LIGNE)) ?? Response.error()),
    );
    return;
  }

  // Ressources immuables (empreinte dans le nom ou identifiant unique).
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheDabord(requete, CACHE_STATIQUE));
    return;
  }
  if (
    url.pathname.startsWith("/fichiers/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/logo/")
  ) {
    event.respondWith(cacheDabord(requete, CACHE_IMAGES));
  }
  // Le reste (données de pages, /auth, /admin, optimiseur d'images) passe
  // directement par le réseau.
});
