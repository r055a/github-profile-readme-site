import { readFileSync } from "node:fs";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { getReadMeSrc } from "./src/lib/gh.ts";

const config = JSON.parse(
  readFileSync(new URL("./site.config.json", import.meta.url), "utf8"),
);

const { repoName } = await getReadMeSrc(config.githubName, config.repoName);

export default defineConfig({
  site: config.siteUrl,
  base: config.basePath || repoName,
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
