import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import type { Plugin, ViteDevServer } from "vite";

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

function aiAlisBridge(): Plugin {
  const statusFile = process.env.AI_ALIS_STATUS_FILE
    ? resolve(process.env.AI_ALIS_STATUS_FILE)
    : resolve(homedir(), "Library/Application Support/AIAlis/learning-status.json");

  return {
    name: "ai-alis-local-status-bridge",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/__ai-alis/status", (request, response) => {
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.setHeader("Allow", "POST");
          response.end("POST only");
          return;
        }

        let body = "";
        request.on("data", (chunk: Buffer) => {
          body += chunk.toString();
          if (body.length > 128_000) request.destroy();
        });
        request.on("end", () => {
          try {
            const payload: unknown = JSON.parse(body);
            if (!isAlisStatusPayload(payload)) {
              response.statusCode = 400;
              response.end("Invalid AI Alis status payload");
              return;
            }
            mkdirSync(dirname(statusFile), { recursive: true });
            writeFileSync(statusFile, JSON.stringify(payload, null, 2));
            response.statusCode = 204;
            response.end();
          } catch {
            response.statusCode = 400;
            response.end("Invalid JSON");
          }
        });
      });
    }
  };
}

function isAlisStatusPayload(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return payload.schemaVersion === 1
    && typeof payload.learnerID === "string"
    && typeof payload.learnerName === "string"
    && typeof payload.totalItems === "number"
    && typeof payload.dueToday === "number"
    && typeof payload.overdue === "number";
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? pagesBase : "/",
  plugins: [react(), aiAlisBridge(), spaFallback()],
  test: {
    environment: "node"
  }
});
