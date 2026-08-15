import { describe, expect, it } from "vitest";
import { learningScoreFor, viewingStatusFor } from "./dashboard";

const now = new Date("2026-08-15T12:00:00.000Z");

describe("dashboard motivation and viewing signals", () => {
  it("classifies viewing by the most recent learning activity", () => {
    expect(viewingStatusFor("", 0, now)).toBe("not_started");
    expect(viewingStatusFor("2026-08-15T08:00:00.000Z", 1, now)).toBe("recent");
    expect(viewingStatusFor("2026-08-13T12:00:00.000Z", 1, now)).toBe("active");
    expect(viewingStatusFor("2026-08-10T12:00:00.000Z", 1, now)).toBe("stale");
  });

  it("keeps unstarted workers at zero and caps active learning scores at 100", () => {
    expect(
      learningScoreFor({
        assigned: 12,
        started: 0,
        mastered: 0,
        accuracy: null,
        overdue: 0,
        viewingStatus: "not_started"
      })
    ).toBe(0);
    expect(
      learningScoreFor({
        assigned: 12,
        started: 12,
        mastered: 12,
        accuracy: 1,
        overdue: 0,
        viewingStatus: "recent"
      })
    ).toBe(100);
  });

  it("rewards mastery and recent activity", () => {
    const steady = learningScoreFor({
      assigned: 12,
      started: 12,
      mastered: 8,
      accuracy: 0.9,
      overdue: 0,
      viewingStatus: "recent"
    });
    const stale = learningScoreFor({
      assigned: 12,
      started: 12,
      mastered: 2,
      accuracy: 0.6,
      overdue: 3,
      viewingStatus: "stale"
    });
    expect(steady).toBeGreaterThan(stale);
  });
});
