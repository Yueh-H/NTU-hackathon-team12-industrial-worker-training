import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const pagesBase = "/NTU-hackathon-team12-industrial-worker-training/";

function spaFallback() {
  return {
    name: "spa-github-pages-fallback",
    closeBundle() {
      const index = resolve("dist/index.html");
      if (existsSync(index)) copyFileSync(index, resolve("dist/404.html"));
    }
  };
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? pagesBase : "/",
  plugins: [react(), spaFallback()],
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/dist/**", "model_sheet_training_v0_7_components/**"]
  }
});
