import { describe, expect, it } from "vitest";
import { DEMO_SHEET } from "../data/demoSheet";
import type { WorkOrderAnalysisResult } from "./aiWorkOrder";
import { bundleFromAnalysis } from "./workOrderPublish";

describe("work order publish from demo sheet", () => {
  it("keeps uploaded text on the work order and tags modules to that id", () => {
    const result: WorkOrderAnalysisResult = {
      source: "demo-fallback",
      warning: "offline",
      analysis: {
        summary: "demo",
        riskLevel: "medium",
        modules: [
          {
            order: 1,
            title: "看懂工單",
            objective: "能說出目標",
            steps: ["讀標題"],
            safety: ["先問主管"],
            checkQuestion: "確認什麼？",
            checkAnswer: "版本與數量",
            estimatedMinutes: 8,
            sourceText: DEMO_SHEET.docNo
          }
        ]
      }
    };
    const bundle = bundleFromAnalysis(
      { title: DEMO_SHEET.title, docNo: DEMO_SHEET.docNo, rawContent: DEMO_SHEET.rawContent, createdBy: "boss" },
      result
    );
    expect(bundle.workOrder.docNo).toBe("DEMO-001");
    expect(bundle.workOrder.createdBy).toBe("boss");
    expect(bundle.modules).toHaveLength(1);
    expect(bundle.modules[0]?.workOrderId).toBe(bundle.workOrder.id);
    expect(bundle.workOrder.rawContent).toContain("示範防火門");
  });
});
