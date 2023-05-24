import serviceWorker from "./service worker/serviceworker?url";

if ("serviceWorker" in navigator)
  navigator.serviceWorker.register(serviceWorker);
