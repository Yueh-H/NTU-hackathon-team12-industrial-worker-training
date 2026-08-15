import { describe, expect, it } from "vitest";
import {
  OFFSETS,
  addRescue,
  applySession,
  dateAfter,
  dueReview,
  emptyState,
  milestoneDates,
  pendingReviews,
  rateReview,
  startLearning,
  todayKey
} from "./reviewEngine";

const noon = (isoDay: string) => new Date(`${isoDay}T12:00:00`);

describe("reviewEngine (practice-cat contract)", () => {
  it("schedules D+1 / D+3 / D+7 / D+30 from first learn day", () => {
    const learned = noon("2026-08-01");
    const state = startLearning(emptyState("e1", "p1"), learned);
    expect(state.status).toBe("learning");
    expect(state.reviews).toHaveLength(4);
    expect(state.reviews.map((review) => review.offset)).toEqual([...OFFSETS]);
    expect(milestoneDates(state)).toEqual(["2026-08-02", "2026-08-04", "2026-08-08", "2026-08-31"]);
  });

  it("does not complete D+1 on the first learning session", () => {
    const now = noon("2026-08-15");
    const next = applySession(emptyState("e1", "p1"), {
      rating: "remembered",
      quizCorrect: true,
      now
    });
    expect(next.status).toBe("learning");
    expect(dueReview(next, todayKey(now))).toBeUndefined();
    expect(milestoneDates(next)[0]).toBe("2026-08-16");
    expect(pendingReviews(next)).toHaveLength(4);
  });

  it("adds a next-day rescue when first learn is forgotten, without moving milestones", () => {
    const now = noon("2026-08-15");
    const next = applySession(emptyState("e1", "p1"), {
      rating: "forgot",
      quizCorrect: false,
      now
    });
    const milestones = next.reviews.filter((review) => review.kind === "milestone");
    const rescues = next.reviews.filter((review) => review.kind === "rescue");
    expect(milestones.every((review) => review.status === "pending")).toBe(true);
    expect(milestoneDates(next)).toEqual(["2026-08-16", "2026-08-18", "2026-08-22", "2026-09-14"]);
    expect(rescues).toHaveLength(1);
    expect(rescues[0].dueDate).toBe("2026-08-16");
  });

  it("adds rescue when the quiz is wrong even if self-rate is remembered", () => {
    const now = noon("2026-08-15");
    const next = applySession(emptyState("e1", "p1"), {
      rating: "remembered",
      quizCorrect: false,
      now
    });
    expect(next.reviews.some((review) => review.kind === "rescue" && review.dueDate === "2026-08-16")).toBe(true);
  });

  it("completes the due milestone and keeps remaining dates fixed", () => {
    const learned = noon("2026-08-01");
    const started = startLearning(emptyState("e1", "p1"), learned);
    const before = milestoneDates(started);
    const d1 = started.reviews.find((review) => review.offset === 1);
    expect(d1).toBeTruthy();
    const next = rateReview(started, d1!.id, "remembered", noon("2026-08-02"));
    expect(next.reviews.find((review) => review.id === d1!.id)?.status).toBe("completed");
    expect(milestoneDates(next)).toEqual(before);
    expect(next.reviews.filter((review) => review.kind === "rescue")).toHaveLength(0);
  });

  it("forgot on a due review adds rescue for the next day and does not move milestones", () => {
    const learned = noon("2026-08-01");
    const started = startLearning(emptyState("e1", "p1"), learned);
    const before = milestoneDates(started);
    const d1 = started.reviews.find((review) => review.offset === 1)!;
    const next = rateReview(started, d1.id, "fuzzy", noon("2026-08-02"));
    expect(milestoneDates(next)).toEqual(before);
    expect(next.reviews.some((review) => review.kind === "rescue" && review.dueDate === "2026-08-03")).toBe(true);
  });

  it("does not add a second rescue for the same tomorrow", () => {
    const learned = noon("2026-08-01");
    let state = startLearning(emptyState("e1", "p1"), learned);
    const d1 = state.reviews.find((review) => review.offset === 1)!;
    state = rateReview(state, d1.id, "forgot", noon("2026-08-02"));
    const once = state.reviews.filter((review) => review.kind === "rescue").length;
    state = addRescue(state, noon("2026-08-02"));
    expect(state.reviews.filter((review) => review.kind === "rescue")).toHaveLength(once);
  });

  it("marks mastered only after every pending review is gone", () => {
    const learned = noon("2026-08-01");
    let state = startLearning(emptyState("e1", "p1"), learned);
    for (const offset of OFFSETS) {
      const review = state.reviews.find((item) => item.offset === offset && item.status === "pending")!;
      state = rateReview(state, review.id, "remembered", new Date(`${review.dueDate}T12:00:00`));
    }
    expect(pendingReviews(state)).toHaveLength(0);
    expect(state.status).toBe("mastered");
  });

  it("treats a pending review with dueDate before today as overdue", () => {
    const learned = noon("2026-08-01");
    const state = startLearning(emptyState("e1", "p1"), learned);
    expect(dateAfter("2026-08-01", 1)).toBe("2026-08-02");
    expect(dueReview(state, "2026-08-10")?.offset).toBe(1);
    expect(dueReview(state, "2026-08-01")).toBeUndefined();
  });
});
