import { describe, expect, it } from "vitest";
import { buildDemoProgress, workers } from "./catalog";

describe("demo employee progress", () => {
  it("gives every worker at least one completed card", () => {
    const { states } = buildDemoProgress(new Date("2026-08-15T12:00:00"));

    expect(workers).toHaveLength(10);
    for (const worker of workers) {
      expect(
        states.some((state) => state.employeeId === worker.id && state.status === "mastered")
      ).toBe(true);
    }
  });
});
