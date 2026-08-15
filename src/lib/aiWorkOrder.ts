import type { LearningModule, WorkOrderRisk } from "../types";

const DEFAULT_ENDPOINT = "http://127.0.0.1:8787/analyze-workorder";

export interface WorkOrderAnalysisInput {
  title: string;
  docNo: string;
  rawContent: string;
}

export type GeneratedLearningModule = Omit<LearningModule, "id" | "workOrderId">;

export interface WorkOrderAnalysis {
  summary: string;
  riskLevel: WorkOrderRisk;
  modules: GeneratedLearningModule[];
}

export interface WorkOrderAnalysisResult {
  analysis: WorkOrderAnalysis;
  source: "codex" | "demo-fallback";
  warning: string;
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function list(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const result = value.map((item) => String(item).trim()).filter(Boolean);
  return result.length ? result : fallback;
}

function parseRisk(value: unknown): WorkOrderRisk {
  return value === "low" || value === "high" ? value : "medium";
}

function normalizeAnalysis(raw: unknown): WorkOrderAnalysis {
  if (!raw || typeof raw !== "object") throw new Error("AI 回傳格式不是 JSON 物件。");
  const record = raw as Record<string, unknown>;
  const rawModules = Array.isArray(record.modules) ? record.modules : [];
  const modules = rawModules.slice(0, 8).map((item, index) => {
    const module = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      order: index + 1,
      title: text(module.title, `學習單元 ${index + 1}`),
      objective: text(module.objective, "能說明這個工序的目的與完成條件。"),
      steps: list(module.steps, ["讀懂工單內容", "依現場標準完成操作", "完成後自我檢查"]),
      safety: list(module.safety, ["依現場安全規範操作，遇到不確定先停下來問主管。"]),
      checkQuestion: text(module.checkQuestion, "開始工作前，最重要的確認是什麼？"),
      checkAnswer: text(module.checkAnswer, "先對照工單、材料與安全條件，再開始操作。"),
      estimatedMinutes: Math.max(5, Math.min(60, Number(module.estimatedMinutes) || 10)),
      sourceText: text(module.sourceText, "由主管提交的大工單內容拆解")
    } satisfies GeneratedLearningModule;
  });
  if (!modules.length) throw new Error("AI 沒有產生任何學習單元。");
  return {
    summary: text(record.summary, "這張工單已拆解為可逐步學習的工作情境。"),
    riskLevel: parseRisk(record.riskLevel),
    modules
  };
}

function fallbackAnalysis(input: WorkOrderAnalysisInput): WorkOrderAnalysis {
  const lines = input.rawContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const source = lines.slice(0, 4).join("；") || "主管尚未提供額外工單文字，請依現場文件補充。";
  return {
    summary: `${input.title || "這張工單"} 已先建立四個員工學習情境；正式使用時請由 AI 依工單原文再校對一次。`,
    riskLevel: "medium",
    modules: [
      {
        order: 1,
        title: "看懂工單與工作目標",
        objective: "能說出這張工單要完成什麼、完成後如何判定合格。",
        steps: ["先讀工單標題、編號與數量", "圈出自己的工作範圍", "向主管確認不清楚的欄位"],
        safety: ["未確認工單版本與工作範圍前，不要直接開始加工。"],
        checkQuestion: "開始前要先確認哪三件事？",
        checkAnswer: "工單版本、工作範圍／數量，以及不清楚的欄位。",
        estimatedMinutes: 8,
        sourceText: source
      },
      {
        order: 2,
        title: "準備材料與工具",
        objective: "能依工單準備正確材料、工具與量測方式。",
        steps: ["對照材料名稱與規格", "檢查工具狀態與量具歸零", "把缺料或規格不符項目回報主管"],
        safety: ["材料規格不符時先停工，不要用相似品替代。", "操作工具前穿戴現場規定的 PPE。"],
        checkQuestion: "發現材料規格和工單不同時怎麼做？",
        checkAnswer: "先停止使用並回報主管，確認後才能替換。",
        estimatedMinutes: 10,
        sourceText: source
      },
      {
        order: 3,
        title: "依順序完成工作",
        objective: "能依工單順序完成主要步驟，不跳過關鍵檢查。",
        steps: ["依序讀出每個加工或組裝步驟", "完成一項就對照規格", "把異常與返工點記錄下來"],
        safety: ["不確定下一步或遇到異常時，先停機、保持現場並請主管確認。"],
        checkQuestion: "為什麼不能只憑記憶跳過工單步驟？",
        checkAnswer: "工單版本、尺寸與安全條件可能不同，必須以當次工單為準。",
        estimatedMinutes: 12,
        sourceText: source
      },
      {
        order: 4,
        title: "品質與安全交接",
        objective: "能完成成品自檢，並把結果清楚交接給下一站。",
        steps: ["檢查尺寸、數量與外觀", "確認安全關鍵點已完成", "回報完成、異常與待處理事項"],
        safety: ["品質未確認前不可流入下一站；涉及人身或設備風險時立即通報。"],
        checkQuestion: "交接時至少要說明哪些內容？",
        checkAnswer: "已完成項目、檢查結果，以及異常或待處理事項。",
        estimatedMinutes: 8,
        sourceText: source
      }
    ]
  };
}

export async function analyzeWorkOrder(input: WorkOrderAnalysisInput): Promise<WorkOrderAnalysisResult> {
  const endpoint = import.meta.env.VITE_AI_WORKORDER_ENDPOINT?.trim() || DEFAULT_ENDPOINT;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    if (!response.ok) throw new Error((await response.text()) || `AI service ${response.status}`);
    const payload = (await response.json()) as { analysis?: unknown };
    return {
      analysis: normalizeAnalysis(payload.analysis ?? payload),
      source: "codex",
      warning: ""
    };
  } catch (error) {
    return {
      analysis: fallbackAnalysis(input),
      source: "demo-fallback",
      warning: error instanceof Error ? error.message : "AI service 未連線，已切換示範拆解。"
    };
  }
}
