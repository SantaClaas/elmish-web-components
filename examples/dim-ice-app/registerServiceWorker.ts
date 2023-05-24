import serviceWorker from "./service worker/serviceworker?worker&url";

if ("serviceWorker" in navigator)
  navigator.serviceWorker.register(serviceWorker);
