import { describe, expect, it } from "vitest";
import { emptyState } from "./reviewEngine";
import { firstOpenPart, isLessonDone, lessons, nodeState, units } from "./path";

describe("duolingo path", () => {
  it("builds six work-order units with checkpoints", () => {
    expect(units).toHaveLength(6);
    expect(lessons.length).toBeGreaterThan(6);
    expect(units[0].id).toBe("struktur");
    expect(units[0].lessons[0].partIds.length).toBeGreaterThan(0);
  });

  it("keeps the first checkpoint current when nothing is learned", () => {
    const first = units[0].lessons[0];
    const empty = first.partIds.map((partId) => emptyState("agus", partId));
    expect(nodeState(first, empty)).toBe("current");
    expect(nodeState(units[0].lessons[1], empty)).toBe("locked");
    expect(nodeState(units[1].lessons[0], empty)).toBe("locked");
  });

  it("opens the next checkpoint after a lesson is finished", () => {
    const first = units[0].lessons[0];
    const done = first.partIds.map((partId) => ({
      ...emptyState("agus", partId),
      status: "learning" as const,
      learnedAt: "2026-08-15T00:00:00.000Z"
    }));
    expect(isLessonDone(first, done)).toBe(true);
    expect(nodeState(units[0].lessons[1], done)).toBe("current");
    expect(firstOpenPart(first, done)).toBe(first.partIds[0]);
  });
});
