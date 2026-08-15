import { describe, expect, it } from "vitest";
import {
  attemptToDoc,
  docToAttempt,
  docToState,
  missingEmployeeProgress,
  stateDocId,
  stateToDoc
} from "./firebaseStore";
import { buildDemoProgress } from "./catalog";
import type { Attempt, ReviewState } from "../types";

describe("firebase mappers", () => {
  it("round-trips a review state", () => {
    const state: ReviewState = {
      employeeId: "agus",
      partId: "kaca-tahan-api",
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
    expect(stateDocId(state)).toBe("agus__kaca-tahan-api");
    expect(docToState(stateToDoc(state))).toEqual(state);
  });

  it("round-trips an attempt and keeps quizCorrect null", () => {
    const attempt: Attempt = {
      id: "attempt-1",
      employeeId: "sari",
      partId: "grendel-3-titik",
      reviewId: "review-2",
      rating: "forgot",
      quizKind: "hotspot",
      quizCorrect: null,
      response: "",
      completedAt: "2026-08-15T12:01:00.000Z"
    };
    expect(docToAttempt(attemptToDoc(attempt))).toEqual(attempt);
  });

  it("adds only employees missing from an existing cloud seed", () => {
    const seeded = buildDemoProgress(new Date("2026-08-15T12:00:00"));
    const current = {
      states: seeded.states.filter((state) => ["budi", "sari", "agus"].includes(state.employeeId)),
      attempts: seeded.attempts.filter((attempt) => ["budi", "sari", "agus"].includes(attempt.employeeId))
    };

    const additions = missingEmployeeProgress(current, seeded);

    expect(new Set(additions.states.map((state) => state.employeeId))).toEqual(
      new Set(["dwi", "rina", "joko", "maya", "arif", "dewi", "yusuf"])
    );
    expect(additions.attempts.every((attempt) => !["budi", "sari", "agus"].includes(attempt.employeeId))).toBe(true);
  });
});
