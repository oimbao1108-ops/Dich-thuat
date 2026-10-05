// Luu trang va thu vien vao bo nho dem de mo duoc khi khong co mang.
// (Cac file model do thu vien tu luu rieng.)
const CACHE = "dich-anh-viet-v2";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html"])).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// Them header "cach ly" de trinh duyet cho phep chay da luong (nhanh hon nhieu lan)
function iso(r) {
  if (!r || r.status === 0) return r;
  const h = new Headers(r.headers);
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  h.set("Cross-Origin-Embedder-Policy", "require-corp");
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const own = url.origin === location.origin;
  const cdn = url.hostname === "cdn.jsdelivr.net";
  if (!own && !cdn) return;   // model tu huggingface: de thu vien tu xu ly
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (own) {   // trang cua minh: uu tien ban moi, mat mang thi dung ban da luu
      try { const r = await fetch(e.request); if (r.ok) cache.put(e.request, r.clone()); return iso(r); }
      catch { return iso((await cache.match(e.request)) || (await cache.match("./index.html"))); }
    }
    const hit = await cache.match(e.request);   // thu vien CDN: co dinh theo phien ban
    if (hit) return hit;
    const r = await fetch(e.request);
    if (r.ok) cache.put(e.request, r.clone());
    return r;
  })());
});
