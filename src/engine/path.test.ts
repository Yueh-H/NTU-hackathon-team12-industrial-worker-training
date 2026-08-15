import { describe, expect, it } from "vitest";
import { emptyState, makeAttempt } from "./reviewEngine";
import {
  cardCleared,
  cardStars,
  firstOpenPart,
  isLessonDone,
  isUnitComplete,
  lessons,
  nodeState,
  unitProgress,
  unitStars,
  units
} from "./path";

const employeeId = "agus";

function correctAttempts(partIds: string[]) {
  return partIds.map((partId) =>
    makeAttempt({
      employeeId,
      partId,
      rating: "remembered",
      quizKind: "image_to_name",
      quizCorrect: true
    })
  );
}

describe("learn path", () => {
  it("builds six work-order units with checkpoints", () => {
    expect(units).toHaveLength(6);
    expect(lessons.length).toBeGreaterThan(6);
    expect(units[0].id).toBe("struktur");
    expect(units[0].lessons[0].partIds.length).toBeGreaterThan(0);
  });

  it("gives each card one star for speech and two stars when that card is correct", () => {
    const partId = units[0].lessons[0].partIds[0];
    expect(cardStars(partId, [], employeeId, false)).toBe(0);
    expect(cardStars(partId, [], employeeId, true)).toBe(1);
    expect(cardStars(partId, correctAttempts([partId]), employeeId, true)).toBe(2);
    expect(nodeState(units[0].lessons[0], [], employeeId)).toBe("open");
  });

  it("does not treat started-but-wrong cards as cleared", () => {
    const first = units[0].lessons[0];
    const started = first.partIds.map((partId) => ({
      ...emptyState(employeeId, partId),
      status: "learning" as const,
      learnedAt: "2026-08-15T00:00:00.000Z"
    }));
    expect(started).toHaveLength(first.partIds.length);
    expect(isLessonDone(first, [], employeeId)).toBe(false);
    expect(cardCleared([], employeeId, first.partIds[0])).toBe(false);
  });

  it("gives a unit two stars only when every card is answered correctly", () => {
    const first = units[0].lessons[0];
    const partial = correctAttempts(first.partIds);
    expect(isLessonDone(first, partial, employeeId)).toBe(true);
    expect(nodeState(first, partial, employeeId)).toBe("done");
    expect(unitStars(units[0], partial, employeeId)).toBe(1);
    expect(isUnitComplete(units[0], partial, employeeId)).toBe(false);

    const allStruktur = units[0].lessons.flatMap((lesson) => lesson.partIds);
    const complete = correctAttempts(allStruktur);
    expect(unitProgress(units[0], complete, employeeId)).toEqual({
      done: allStruktur.length,
      total: allStruktur.length
    });
    expect(isUnitComplete(units[0], complete, employeeId)).toBe(true);
    expect(unitStars(units[0], complete, employeeId)).toBe(2);
    expect(firstOpenPart(first, complete, employeeId)).toBe(first.partIds[0]);
  });
});
