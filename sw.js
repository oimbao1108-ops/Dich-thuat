// Luu trang va thu vien vao bo nho dem de mo duoc khi khong co mang.
// (Cac file model do thu vien tu luu rieng.)
const CACHE = "dich-anh-viet-v1";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const own = url.origin === location.origin;
  const cdn = url.hostname === "cdn.jsdelivr.net";
  if (!own && !cdn) return;   // model tu huggingface: de thu vien tu xu ly
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (own) {   // trang cua minh: uu tien ban moi, mat mang thi dung ban da luu
      try { const r = await fetch(e.request); if (r.ok) cache.put(e.request, r.clone()); return r; }
      catch { return (await cache.match(e.request)) || (await cache.match("./index.html")); }
    }
    const hit = await cache.match(e.request);   // thu vien CDN: co dinh theo phien ban
    if (hit) return hit;
    const r = await fetch(e.request);
    if (r.ok) cache.put(e.request, r.clone());
    return r;
  })());
});
