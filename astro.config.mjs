// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import { paraglideVitePlugin } from "@inlang/paraglide-js";

import cloudflare from "@astrojs/cloudflare";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import eminencesuite from "eminence-astro-suite";

// https://astro.build/config
export default defineConfig({
  site: "https://cloudflare-build-badge.xeffen25.com",
  adapter: cloudflare(),
  output: "server",
  compressHTML: true, // Fixes spacing issues from Astro v7
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--astro-font-inter",
      weights: ["100 900"],
      styles: ["normal", "italic"],
    },
  ],

  integrations: [
    eminencesuite({
      headTags: {
        openGraphSiteName: "Cloudflare Build Badge",
        colorScheme: "dark",
        themeColor: "#f38020",
        humansTxt: true,
      },
      icons: {
        source: "src/assets/icon.svg",
      },
      manifest: false,
      robotsTxt: {
        rules: [{ agent: "*", allow: "/" }],
        sitemap: "/sitemap-index.xml",
      },
      securityTxt: {
        contact: "mailto:xeffen25@xeffen25.com",
        expires: "1 year",
        preferredLanguages: ["es", "en"],
        canonical:
          "https://cloudflare-build-badge.xeffen25.com/.well-known/security.txt",
      },
      sitemap: {
        i18n: {
          defaultLocale: "es",
          locales: { es: "es", en: "en" },
        },
      },
    }),
    svelte(),
  ],

  vite: {
    plugins: [
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./src/paraglide",
        strategy: ["url", "baseLocale"],
        emitGitIgnore: false,
        emitPrettierIgnore: false,
      }),
      tailwindcss(),
    ],
  },
});
