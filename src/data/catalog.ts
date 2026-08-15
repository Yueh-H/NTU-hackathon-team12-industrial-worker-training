import seed from "./seed.json";
import type { Assignment, Attempt, Part, Profile, ReviewState, TrainingSet } from "../types";
import { dateAt, emptyState, makeAttempt, rateReview, startLearning } from "../engine/reviewEngine";

export const trainingSet = seed.trainingSet as TrainingSet;
export const profiles = seed.profiles as Profile[];
export const parts = seed.parts as Part[];
export const assignments = seed.assignments as Assignment[];
export const workers = profiles.filter((profile) => profile.role === "worker");
export const supervisors = profiles.filter((profile) => profile.role === "supervisor");

export function partById(id: string): Part | undefined {
  return parts.find((part) => part.id === id);
}

export function workerById(id: string): Profile | undefined {
  return workers.find((profile) => profile.id === id);
}

function at(today: Date, offsetDays: number): Date {
  return dateAt(today, offsetDays);
}

function replay(
  employeeId: string,
  partId: string,
  today: Date,
  learnedDaysAgo: number,
  steps: { offset: number; rating: "forgot" | "fuzzy" | "remembered"; daysAgo: number }[]
): { state: ReviewState; attempts: Attempt[] } {
  const learned = at(today, -learnedDaysAgo);
  let state = startLearning(emptyState(employeeId, partId), learned);
  const attempts: Attempt[] = [
    makeAttempt({
      employeeId,
      partId,
      rating: "remembered",
      quizKind: "image_to_name",
      quizCorrect: true,
      now: learned
    })
  ];
  for (const step of steps) {
    const review = state.reviews.find((item) => item.offset === step.offset && item.status === "pending");
    if (!review) continue;
    const when = at(today, -step.daysAgo);
    state = rateReview(state, review.id, step.rating, when);
    attempts.push(
      makeAttempt({
        employeeId,
        partId,
        reviewId: review.id,
        rating: step.rating,
        quizKind: step.rating === "remembered" ? "image_to_name" : "hotspot",
        quizCorrect: step.rating === "remembered",
        now: when
      })
    );
  }
  return { state, attempts };
}

export function buildDemoProgress(today = new Date()): { states: ReviewState[]; attempts: Attempt[] } {
  const states: ReviewState[] = [];
  const attempts: Attempt[] = [];

  const budiDone = ["child-sash", "mother-sash", "flag-hinge", "anti-pry", "drop-seal", "recess-handle", "gd1043", "glass-bead", "magnesium"];
  for (const partId of budiDone) {
    const result = replay("budi", partId, today, 10, [
      { offset: 1, rating: "remembered", daysAgo: 9 },
      { offset: 3, rating: "remembered", daysAgo: 7 },
      { offset: 7, rating: "remembered", daysAgo: 3 }
    ]);
    states.push(result.state);
    attempts.push(...result.attempts);
  }

  const budiDue = replay("budi", "perlite", today, 7, [
    { offset: 1, rating: "remembered", daysAgo: 6 },
    { offset: 3, rating: "remembered", daysAgo: 4 }
  ]);
  states.push(budiDue.state);
  attempts.push(...budiDue.attempts);

  const budiOverdue = replay("budi", "fire-glass", today, 9, [
    { offset: 1, rating: "remembered", daysAgo: 8 },
    { offset: 3, rating: "fuzzy", daysAgo: 6 }
  ]);
  states.push(budiOverdue.state);
  attempts.push(...budiOverdue.attempts);

  const sariOk = ["child-sash", "mother-sash", "gd1043", "magnesium", "recess-handle"];
  for (const partId of sariOk) {
    const result = replay("sari", partId, today, 4, [{ offset: 1, rating: "remembered", daysAgo: 3 }]);
    states.push(result.state);
    attempts.push(...result.attempts);
  }
  const sariGlass = replay("sari", "fire-glass", today, 4, [{ offset: 1, rating: "forgot", daysAgo: 3 }]);
  states.push(sariGlass.state);
  attempts.push(...sariGlass.attempts);
  const sariLock = replay("sari", "three-lock", today, 4, [{ offset: 1, rating: "fuzzy", daysAgo: 2 }]);
  states.push(sariLock.state);
  attempts.push(...sariLock.attempts);

  for (const workerId of ["budi", "sari", "agus"] as const) {
    for (const part of parts) {
      if (!states.some((state) => state.employeeId === workerId && state.partId === part.id)) {
        states.push(emptyState(workerId, part.id));
      }
    }
  }

  return { states, attempts };
}
