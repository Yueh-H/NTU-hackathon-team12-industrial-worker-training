import { describe, expect, it } from "vitest";
import { buildDemoProgress, parts, workers } from "../data/catalog";
import { buildAlisSnapshot } from "./alisSnapshot";

describe("AI Alis learning snapshot", () => {
  it("maps the existing review dashboard into the desktop-pet contract", () => {
    const worker = workers.find((profile) => profile.id === "budi");
    if (!worker) throw new Error("demo worker budi is required");
    const progress = buildDemoProgress(new Date());

    const snapshot = buildAlisSnapshot(worker, progress.states, progress.attempts);

    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.source).toBe("training-web");
    expect(snapshot.learnerID).toBe("budi");
    expect(snapshot.totalItems).toBe(parts.length);
    expect(snapshot.dueToday + snapshot.overdue).toBeGreaterThan(0);
    expect(snapshot.weakItems.length).toBeLessThanOrEqual(3);
  });
});
