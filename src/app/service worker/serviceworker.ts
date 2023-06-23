// declare const self: ServiceWorkerGlobalScope;
// export {};
const offlineAssetsInclude = [
  /\.js$/,
  /\.css/,
  /\.html/,
  /\.woff/,
  /\.woff2/,
  /\.json$/,
  /\.png$/,
  /\.jpe?g$/,
  /\.gif$/,
  /\.ico$/,
];

self.addEventListener("install", (event: ExtendableEvent) =>
  event.waitUntil(onInstall())
);
self.addEventListener("activate", (event: ExtendableEvent) =>
  event.waitUntil(onActivate())
);
self.addEventListener("fetch", (event: FetchEvent) =>
  event.respondWith(onFetch(event))
);

const offlineAssetsExclude = [/ˆserviceworker.js/];
const manifest = (self as any).__WB_MANIFEST;
const cacheNamePrefix = "offline-cache-";
const postFix = manifest && manifest.length > 0 ? manifest[0].url : "";
// Using this as a stupid nonce for now since the name should be nonced
const cacheName = `${cacheNamePrefix}${postFix}`;

async function onInstall() {
  console.debug("Service worker: install");
  // This contains all the files for precaching and is provided by workbox

  console.debug({ self });
  if (!manifest) return;
  const assetsRequests = manifest
    .filter((asset: any) =>
      offlineAssetsInclude.some((pattern) => pattern.test(asset.url))
    )
    .filter(
      (asset: any) =>
        !offlineAssetsExclude.some((pattern) => pattern.test(asset.url))
    )
    .map(
      (asset: any) =>
        new Request(asset.url, { integrity: asset.hash, cache: "no-cache" })
    );

  // Fetch and cache all matching items from the assets manifest
  await caches.open(cacheName).then((cache) => cache.addAll(assetsRequests));
}

async function onActivate() {
  console.info("Service worker: Activate");

  // Delete unused caches
  const cacheKeys = await caches.keys();
  await Promise.all(
    cacheKeys
      .filter((key) => key.startsWith(cacheNamePrefix) && key !== cacheName)
      .map((key) => caches.delete(key))
  );
}

async function onFetch(event: FetchEvent) {
  if (event.request.method !== "GET") return fetch(event.request);
  // For all navigation requests, try to serve index.html from cache
  // If you need some URLs to be server-rendered, edit the following check to exclude those URLs
  const isNavigationRequest = event.request.mode === "navigate";

  const request = isNavigationRequest ? "index.html" : event.request;
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  return cachedResponse || fetch(event.request);
}
