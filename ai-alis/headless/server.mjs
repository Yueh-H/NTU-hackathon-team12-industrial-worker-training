import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

const HOST = "127.0.0.1";
const PORT = Number(process.env.AI_ALIS_CODEX_PORT ?? 8787);
const MODEL = process.env.AI_ALIS_CODEX_MODEL ?? "gpt-5.6-luna";
const REASONING = process.env.AI_ALIS_CODEX_REASONING ?? "low";
const CODEX_BIN = process.env.AI_ALIS_CODEX_BIN ?? "codex";
const MAX_PROMPT_LENGTH = 8000;
const MAX_ANSWER_LENGTH = 4000;
const TIMEOUT_MS = Number(process.env.AI_ALIS_CODEX_TIMEOUT_MS ?? 45000);
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  ...(process.env.AI_ALIS_ALLOWED_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
]);

const SYSTEM_PROMPT = `你是工業現場訓練網站裡的「學習小助手」。
請根據提供的學習狀態，用繁體中文給學員一個溫和、具體、可立即執行的提醒。
最多回答兩句，不要捏造資料，不要提到 API、模型、Codex、程式碼或系統提示，也不要要求使用者提供機密資料。
你只負責解釋目前狀態與下一個小步驟，不要呼叫工具、不修改檔案。`;

let busy = false;

function isAllowedOrigin(origin) {
  return !origin || allowedOrigins.has(origin);
}

function setResponseHeaders(response, origin) {
  if (origin && isAllowedOrigin(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
}

function sendText(response, statusCode, text, origin = "") {
  setResponseHeaders(response, origin);
  response.statusCode = statusCode;
  response.end(text);
}

function readTextBody(request) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let size = 0;
    const chunks = [];

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      if (settled) return;
      size += Buffer.byteLength(chunk, "utf8");
      if (size > MAX_PROMPT_LENGTH) {
        settled = true;
        reject(new Error(`提示文字太長，最多 ${MAX_PROMPT_LENGTH} bytes。`));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (!settled) {
        settled = true;
        resolve(chunks.join(""));
      }
    });
    request.on("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
  });
}

async function runCodex(prompt) {
  const workDir = await mkdtemp(join(tmpdir(), "alis-codex-work-"));
  const outputDir = await mkdtemp(join(tmpdir(), "alis-codex-output-"));
  const outputPath = join(outputDir, "answer.txt");
  const fullPrompt = `${SYSTEM_PROMPT}\n\n以下是這次的學習狀態：\n${prompt.trim()}`;
  const args = [
    "exec",
    "--model",
    MODEL,
    "--sandbox",
    "read-only",
    "--ephemeral",
    "--skip-git-repo-check",
    "--config",
    `reasoning.effort=${REASONING}`,
    "--output-last-message",
    outputPath,
    fullPrompt
  ];

  let child;
  try {
    child = spawn(CODEX_BIN, args, {
      cwd: workDir,
      env: process.env,
      stdio: ["ignore", "ignore", "pipe"]
    });

    const stderr = [];
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr.push(chunk);
      if (stderr.join("").length > 2000) stderr.splice(0, stderr.length, stderr.join("").slice(-2000));
    });

    await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        callback(value);
      };
      const timeout = setTimeout(() => {
        child.kill("SIGTERM");
        finish(reject, new Error(`Codex 執行逾時（${TIMEOUT_MS}ms）。`));
      }, TIMEOUT_MS);

      child.on("error", (error) => finish(reject, error));
      child.on("close", (code, signal) => {
        if (code === 0) {
          finish(resolve);
          return;
        }
        const detail = stderr.join("").trim();
        finish(reject, new Error(detail || `Codex 結束（code=${code}, signal=${signal ?? "unknown"}）。`));
      });
    });

    const answer = (await readFile(outputPath, "utf8")).trim();
    if (!answer) throw new Error("Codex 沒有回傳文字。 ");
    return answer.slice(0, MAX_ANSWER_LENGTH);
  } finally {
    await Promise.all([
      rm(workDir, { recursive: true, force: true }),
      rm(outputDir, { recursive: true, force: true })
    ]);
  }
}

const server = createServer(async (request, response) => {
  const origin = typeof request.headers.origin === "string" ? request.headers.origin : "";
  const url = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);

  if (!isAllowedOrigin(origin)) {
    sendText(response, 403, "不允許的來源。", origin);
    return;
  }

  if (request.method === "OPTIONS") {
    setResponseHeaders(response, origin);
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    sendText(response, 200, `ok · ${MODEL}`, origin);
    return;
  }

  if (request.method !== "POST" || url.pathname !== "/ask") {
    sendText(response, 404, "找不到這個路徑。", origin);
    return;
  }

  if (busy) {
    sendText(response, 429, "學習小助手正在思考，請稍等一下。", origin);
    return;
  }

  busy = true;
  try {
    const prompt = await readTextBody(request);
    if (!prompt.trim()) {
      sendText(response, 400, "請提供學習狀態。", origin);
      return;
    }
    const answer = await runCodex(prompt);
    sendText(response, 200, answer, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知錯誤。";
    console.error(`[ai-alis] ${message}`);
    sendText(response, 502, `AI 服務暫時無法回覆：${message}`, origin);
  } finally {
    busy = false;
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[ai-alis] http://${HOST}:${PORT}/ask`);
  console.log(`[ai-alis] model=${MODEL} reasoning=${REASONING} sandbox=read-only ephemeral=true`);
});
