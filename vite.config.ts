import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default {
  test: {
    globals: true,
  },
  plugins: [
    VitePWA({
      devOptions: { enabled: true },
      outDir: "./",
      filename: "serviceworker.ts",
      srcDir: "examples/dim-ice-app/service worker",
      injectRegister: false,
      strategies: "injectManifest",
      manifest: {
        // android_package_name: "dev.claas.pass",
        background_color: "#ffffff",
        categories: ["entertainment", "social"],
        description: "Quickly catch up on your mastodon feed",
        display: "standalone",
        icons: [
          {
            src: "assets/logo.smaller.svg",
            type: "image/svg+xml",
            sizes: "any",
          },
          // {
          //   src: "monochrome.icon.svg",
          //   type: "image/svg+xml",
          //   sizes: "any",
          //   purpose: "monochrome",
          // },
          // {
          //   src: "maskable_icon_x192.png",
          //   type: "image/png",
          //   sizes: "192x192",
          //   purpose: "maskable",
          // },
          // {
          //   src: "maskable_icon_x512.png",
          //   type: "image/png",
          //   sizes: "512x512",
          //   purpose: "maskable",
          // },
          // {
          //   src: "splash.icon.png",
          //   type: "image/png",
          //   sizes: "2001x2001",
          // },
        ],
        id: "/",
        name: "Dim Ice for Mastodon",
        scope: "/",
        short_name: "Dim Ice",
        start_url: "./",
        theme_color: "#c1445b",
        prefer_related_applications: false,
        orientation: "portrait-primary",
      },
    }),
  ],
};
