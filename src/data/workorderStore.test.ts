import { describe, expect, it } from "vitest";
import { docToModule, docToWorkOrder, moduleToDoc, workOrderToDoc } from "./workorderStore";
import type { LearningModule, WorkOrder } from "../types";

const workOrder: WorkOrder = {
  id: "wo-demo",
  orgId: "team12-demo",
  title: "防火門組立",
  docNo: "DEMO-001",
  rawContent: "依工單準備材料並檢查安全條件。",
  summary: "拆成四個學習情境。",
  riskLevel: "high",
  status: "ready",
  model: "gpt-5.6-luna",
  reasoningEffort: "max",
  analysisSource: "codex",
  createdBy: "supervisor",
  createdAt: "2026-08-15T12:00:00.000Z",
  updatedAt: "2026-08-15T12:00:00.000Z"
};

const learningModule: LearningModule = {
  id: "wo-demo-module-1",
  workOrderId: "wo-demo",
  order: 1,
  title: "看懂工單",
  objective: "能說出工作目標。",
  steps: ["讀標題", "確認數量"],
  safety: ["不確定先問主管。"],
  checkQuestion: "開始前確認什麼？",
  checkAnswer: "確認工單版本與數量。",
  estimatedMinutes: 8,
  sourceText: "工單原文"
};

describe("work order Firebase mappers", () => {
  it("round-trips a work order without mixing it with review data", () => {
    expect(docToWorkOrder(workOrderToDoc(workOrder))).toEqual(workOrder);
  });

  it("round-trips a work order learning module under its parent id", () => {
    expect(docToModule(moduleToDoc(learningModule), workOrder.id)).toEqual(learningModule);
  });
});
