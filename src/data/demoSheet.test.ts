import { describe, expect, it } from "vitest";
import { DEMO_SHEET, DEMO_WORK_ORDER_ID, demoWorkOrderBundle, withDemoWorkOrder } from "./demoSheet";
import type { WorkOrderBundle } from "../types";

describe("hosted demo sheet", () => {
  it("always exposes the GitHub Pages PDF as a stable work order", () => {
    const bundle = demoWorkOrderBundle();
    expect(bundle.workOrder.id).toBe(DEMO_WORK_ORDER_ID);
    expect(bundle.workOrder.docNo).toBe(DEMO_SHEET.docNo);
    expect(bundle.workOrder.sourceFile?.name).toBe("demo-sheet.pdf");
    expect(bundle.modules).toHaveLength(4);
  });

  it("prepends the demo sheet when the list is empty", () => {
    const merged = withDemoWorkOrder([]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.workOrder.id).toBe(DEMO_WORK_ORDER_ID);
  });

  it("does not duplicate a hosted upload of the same document", () => {
    const uploaded: WorkOrderBundle = {
      ...demoWorkOrderBundle(),
      workOrder: {
        ...demoWorkOrderBundle().workOrder,
        id: "wo-uploaded",
        sourceFile: {
          name: "demo-sheet.pdf",
          storagePath: "work_orders/wo-uploaded/source.pdf",
          downloadUrl: "https://example.test/source.pdf",
          size: 12,
          pageCount: 1,
          uploadedAt: "2026-08-15T12:00:00.000Z"
        }
      }
    };
    expect(withDemoWorkOrder([uploaded])).toEqual([uploaded]);
  });
});
