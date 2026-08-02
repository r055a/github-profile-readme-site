import { readFileSync } from "node:fs";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const config = JSON.parse(
  readFileSync(new URL("./site.config.json", import.meta.url), "utf8"),
);

export default defineConfig({
  site: config.siteUrl,
  base: config.basePath || undefined,
  output: "static",
  trailingSlash: "never",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    format: "directory",
  },
});
