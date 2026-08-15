import { describe, expect, it } from "vitest";
import { emptyState } from "./reviewEngine";
import { firstOpenPart, isLessonDone, lessons, nodeState, units } from "./path";

describe("learn path", () => {
  it("builds six work-order units with checkpoints", () => {
    expect(units).toHaveLength(6);
    expect(lessons.length).toBeGreaterThan(6);
    expect(units[0].id).toBe("struktur");
    expect(units[0].lessons[0].partIds.length).toBeGreaterThan(0);
  });

  it("lets every unfinished checkpoint be opened", () => {
    const empty = units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.partIds.map((partId) => emptyState("agus", partId))));
    expect(nodeState(units[0].lessons[0], empty)).toBe("open");
    expect(nodeState(units[0].lessons[1], empty)).toBe("open");
    expect(nodeState(units[1].lessons[0], empty)).toBe("open");
  });

  it("marks a finished checkpoint as done without locking the rest", () => {
    const first = units[0].lessons[0];
    const done = first.partIds.map((partId) => ({
      ...emptyState("agus", partId),
      status: "learning" as const,
      learnedAt: "2026-08-15T00:00:00.000Z"
    }));
    expect(isLessonDone(first, done)).toBe(true);
    expect(nodeState(first, done)).toBe("done");
    expect(nodeState(units[0].lessons[1], done)).toBe("open");
    expect(firstOpenPart(first, done)).toBe(first.partIds[0]);
  });
});
