import type { LearningModule, WorkOrder, WorkOrderBundle, WorkOrderSourceFile } from "../types";
import type { WorkOrderAnalysisResult } from "./aiWorkOrder";

export function newWorkOrderId(): string {
  return `wo-${Date.now().toString(36)}`;
}

export function moduleForWorkOrder(
  workOrderId: string,
  module: Omit<LearningModule, "id" | "workOrderId">,
  index: number
): LearningModule {
  return {
    ...module,
    id: `${workOrderId}-module-${index + 1}`,
    workOrderId,
    order: index + 1
  };
}

export function bundleFromAnalysis(
  input: {
    title: string;
    docNo: string;
    rawContent: string;
    createdBy?: string;
    sourceFile?: WorkOrderSourceFile | null;
  },
  result: WorkOrderAnalysisResult
): WorkOrderBundle {
  const id = newWorkOrderId();
  const now = new Date().toISOString();
  const workOrder: WorkOrder = {
    id,
    orgId: "team12-demo",
    title: input.title,
    docNo: input.docNo,
    rawContent: input.rawContent,
    summary: result.analysis.summary,
    riskLevel: result.analysis.riskLevel,
    status: "ready",
    model: "gpt-5.6-luna",
    reasoningEffort: "max",
    analysisSource: result.source,
    sourceFile: input.sourceFile ?? null,
    createdBy: input.createdBy ?? "supervisor",
    createdAt: now,
    updatedAt: now
  };
  return {
    workOrder,
    modules: result.analysis.modules.map((module, index) => moduleForWorkOrder(id, module, index))
  };
}
