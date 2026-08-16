import type { LearningModule, WorkOrderBundle } from "../types";

/** Generic demo parse result. No source-sheet identifiers. */
export const DEMO_SHEET = {
  title: "示範生產製造表",
  docNo: "DEMO-001",
  formCode: "FM-DEMO",
  machine: "示範門扇",
  pdfPath: "demo-sheet.pdf",
  pdfBytes: 0,
  summary: "示範用防火門組立工單，含門扇、材料與五金的學習拆解。",
  rawContent: `工單 DEMO-001／表單 FM-DEMO
名稱：示範防火門
成品：示範尺寸，開外
請依現場當次工單核對材料、五金與安全條件。`
} as const;

export const DEMO_WORK_ORDER_ID = "wo-demo-001";

const DEMO_STAMP = "2026-08-15T00:00:00.000Z";

const DEMO_MODULES: Omit<LearningModule, "id" | "workOrderId">[] = [
  {
    order: 1,
    title: "看懂工單與工作目標",
    objective: "能說出這張工單要完成什麼、完成後如何判定合格。",
    steps: ["先讀工單標題、編號與數量", "圈出自己的工作範圍", "向主管確認不清楚的欄位"],
    safety: ["未確認工單版本與工作範圍前，不要直接開始加工。"],
    checkQuestion: "開始前要先確認哪三件事？",
    checkAnswer: "工單版本、工作範圍／數量，以及不清楚的欄位。",
    estimatedMinutes: 8,
    sourceText: DEMO_SHEET.rawContent
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
    sourceText: DEMO_SHEET.rawContent
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
    sourceText: DEMO_SHEET.rawContent
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
    sourceText: DEMO_SHEET.rawContent
  }
];

export function demoWorkOrderBundle(): WorkOrderBundle {
  return {
    workOrder: {
      id: DEMO_WORK_ORDER_ID,
      orgId: "team12-demo",
      title: DEMO_SHEET.title,
      docNo: DEMO_SHEET.docNo,
      rawContent: DEMO_SHEET.rawContent,
      summary: DEMO_SHEET.summary,
      riskLevel: "medium",
      status: "ready",
      model: "gpt-5.6-luna",
      reasoningEffort: "max",
      analysisSource: "demo-fallback",
      sourceFile: {
        name: DEMO_SHEET.pdfPath,
        storagePath: `local-only/${DEMO_SHEET.pdfPath}`,
        downloadUrl: "",
        size: DEMO_SHEET.pdfBytes,
        pageCount: 1,
        uploadedAt: DEMO_STAMP
      },
      createdBy: "boss",
      createdAt: DEMO_STAMP,
      updatedAt: DEMO_STAMP
    },
    modules: DEMO_MODULES.map((module, index) => ({
      ...module,
      id: `${DEMO_WORK_ORDER_ID}-module-${index + 1}`,
      workOrderId: DEMO_WORK_ORDER_ID
    }))
  };
}

export function withDemoWorkOrder(records: WorkOrderBundle[]): WorkOrderBundle[] {
  if (records.some((item) => item.workOrder.id === DEMO_WORK_ORDER_ID)) return records;
  if (records.some((item) => item.workOrder.docNo === DEMO_SHEET.docNo && item.workOrder.sourceFile?.downloadUrl)) {
    return records;
  }
  return [demoWorkOrderBundle(), ...records];
}
