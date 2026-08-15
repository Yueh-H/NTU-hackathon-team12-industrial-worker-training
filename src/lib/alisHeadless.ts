const endpoint = import.meta.env.VITE_ALIS_CODEX_ENDPOINT?.trim() || "http://127.0.0.1:8787/ask";

export async function askAlisHeadless(prompt: string): Promise<string> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: prompt
  });
  const body = (await response.text()).trim();
  if (!response.ok) throw new Error(body || `AI 服務錯誤（${response.status}）`);
  return body;
}
