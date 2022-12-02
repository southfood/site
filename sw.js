
const cacheName = "SFCPWA-v1";
const appShellFiles = [
    '/',
    '/index.html',
    '/app.js',
    '/styles.css',
    '/favicon.png',
];

self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
    e.waitUntil((async () => {
        const cache = await caches.open(cacheName);
        console.log('[Service Worker] Caching app shell');
        await cache.addAll(appShellFiles);
    })());
});

self.addEventListener('message', (e) => {
    console.log("[Service Worker] got a message", e);
    if(e.data && e.data.type === "SKIP_WAITING"){
        self.skipWaiting();
    }
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
            if (key === cacheName) { return; }
            return caches.delete(key);
        }));
    }));
});

self.addEventListener('fetch', (e) => {
    e.respondWith((async () => {
        console.log(`[Service Worker] Fetching requested resource: ${e.request.url}`);
        // let origin = self.location.host;
        // let domain = (new URL(e.request.url)).host;
        // console.log(origin, domain);
        let requestHost = (new URL(e.request.url)).host;
        if(requestHost != self.location.host) return await fetch(e.request);
        const r = await caches.match(e.request);
        if (r) {
            return r;
        }
        const response = await fetch(e.request);
        const cache = await caches.open(cacheName);
        console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
        cache.put(e.request, response.clone());
        return response;
    })());
});