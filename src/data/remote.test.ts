import { describe, expect, it } from "vitest";
import { attemptToRow, rowToAttempt, rowToState, stateToRow } from "./remote";
import type { Attempt, ReviewState } from "../types";

describe("remote mappers", () => {
  it("round-trips a review state", () => {
    const state: ReviewState = {
      employeeId: "agus",
      partId: "fire-glass",
      status: "learning",
      learnedAt: "2026-08-15T12:00:00.000Z",
      lastReviewedAt: "",
      updatedAt: "2026-08-15T12:00:00.000Z",
      reviews: [
        {
          id: "review-1",
          kind: "milestone",
          offset: 1,
          dueDate: "2026-08-16",
          status: "pending",
          completedAt: "",
          rating: "",
          order: 0
        }
      ]
    };
    expect(rowToState(stateToRow(state))).toEqual(state);
  });

  it("round-trips an attempt", () => {
    const attempt: Attempt = {
      id: "attempt-1",
      employeeId: "sari",
      partId: "three-lock",
      reviewId: "review-2",
      rating: "forgot",
      quizKind: "hotspot",
      quizCorrect: false,
      response: "drop-seal",
      completedAt: "2026-08-15T12:01:00.000Z"
    };
    expect(rowToAttempt(attemptToRow(attempt))).toEqual(attempt);
  });
});
