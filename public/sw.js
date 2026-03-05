const CACHE_NAME = "powerintake-v1";
const STATIC_CACHE = "powerintake-static-v1";
const DYNAMIC_CACHE = "powerintake-dynamic-v1";

// Assets to pre-cache on install
const PRECACHE_ASSETS = ["/", "/offline", "/manifest.json", "/favicon.ico"];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (name) =>
                name !== STATIC_CACHE &&
                name !== DYNAMIC_CACHE &&
                name !== CACHE_NAME,
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── Fetch strategies ────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser-extension requests
  if (request.method !== "GET" || !url.protocol.startsWith("http")) return;

  // Skip MSAL / Azure AD auth requests — always go to network
  if (
    url.hostname.includes("login.microsoftonline.com") ||
    url.hostname.includes("graph.microsoft.com") ||
    url.pathname.includes("/api/auth")
  ) {
    return;
  }

  // Static assets: Cache-first
  if (
    url.pathname.match(
      /\.(js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2|ttf|eot|webp)$/,
    )
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests: Network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Everything else: Network-first
  event.respondWith(networkFirst(request));
});

// ─── Strategy helpers ────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Network error", { status: 503 });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response("Network error", { status: 503 });
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return the root cache as offline fallback for SPA navigation
    const fallback = await caches.match("/");
    return (
      fallback ||
      new Response(
        `<!DOCTYPE html><html><head><title>Offline</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>body{background:#0f172a;color:#f1f5f9;font-family:sans-serif;
        display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:1rem;}
        h1{font-size:1.5rem;}p{color:#94a3b8;}</style></head>
        <body><h1>You're offline</h1>
        <p>Please check your internet connection and try again.</p></body></html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    );
  }
}

// ─── Background sync (optional, for future use) ──────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
