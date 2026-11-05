// Service worker: aplikasi tetap bisa dibuka saat offline.
// Naikkan angka versi di bawah setiap kali index.html diperbarui agar cache lama diganti.
const V = "kanban-v7";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  // Cache file milik sendiri + SDK Firebase dan font. Lalu lintas Firestore/Auth tidak disentuh.
  const ext = u.hostname === "www.gstatic.com" || u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";
  if (u.origin !== location.origin && !ext) return;
  e.respondWith(
    fetch(r)
      .then(res => {
        if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      })
      .catch(() =>
        caches.match(r, { ignoreSearch: true }).then(m =>
          m || (r.mode === "navigate" ? caches.match("index.html") : Response.error())
        )
      )
  );
});
