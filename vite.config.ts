import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default {
  test: {
    globals: true,
  },
  plugins: [
    VitePWA({
      // devOptions: { enabled: true },
      // strategies: "injectManifest",
      // srcDir: "examples/dim-ice-app",
      // filename: "serviceworker.ts",
      filename: "serviceworker.ts",
      srcDir: "examples/dim-ice-app/service worker",
      injectRegister: false,
      strategies: "injectManifest",
    }),
  ],
};
