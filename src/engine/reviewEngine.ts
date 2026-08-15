import type { Attempt, QuizKind, Rating, Review, ReviewState } from "../types";

export const OFFSETS = [1, 3, 7, 30] as const;
export const STORAGE_KEY = "shop-trainer-v2";

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateAt(base: Date, offsetDays: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offsetDays, 12, 0, 0, 0);
}

export function dateAfter(dateValue: string | Date, offset: number): string {
  const source = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const anchor = Number.isNaN(source.getTime()) ? new Date() : source;
  return todayKey(dateAt(anchor, offset));
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function emptyState(employeeId: string, partId: string): ReviewState {
  return {
    employeeId,
    partId,
    status: "inbox",
    learnedAt: "",
    lastReviewedAt: "",
    reviews: [],
    updatedAt: ""
  };
}

export function pendingReviews(state: ReviewState): Review[] {
  return state.reviews
    .filter((review) => review.status === "pending")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.order - b.order);
}

export function dueReview(state: ReviewState, day: string): Review | undefined {
  return pendingReviews(state).find((review) => review.dueDate <= day);
}

export function isOverdue(state: ReviewState, day: string): boolean {
  const due = dueReview(state, day);
  return Boolean(due && due.dueDate < day);
}

export function reviewedOn(attempts: Attempt[], employeeId: string, partId: string, day: string): boolean {
  return attempts.some(
    (attempt) =>
      attempt.employeeId === employeeId &&
      attempt.partId === partId &&
      attempt.completedAt.slice(0, 10) === day
  );
}

export function startLearning(state: ReviewState, now = new Date()): ReviewState {
  const iso = now.toISOString();
  return {
    ...state,
    learnedAt: iso,
    status: "learning",
    lastReviewedAt: "",
    updatedAt: iso,
    reviews: OFFSETS.map((offset, index) => ({
      id: uid("review"),
      kind: "milestone",
      offset,
      dueDate: dateAfter(iso, offset),
      status: "pending",
      completedAt: "",
      rating: "",
      order: index
    }))
  };
}

export function addRescue(state: ReviewState, now = new Date()): ReviewState {
  const rescueDate = dateAfter(now.toISOString(), 1);
  const hasRescue = state.reviews.some(
    (review) => review.status === "pending" && review.kind === "rescue" && review.dueDate === rescueDate
  );
  if (hasRescue) return state;
  return {
    ...state,
    updatedAt: now.toISOString(),
    reviews: [
      ...state.reviews,
      {
        id: uid("review"),
        kind: "rescue",
        offset: null,
        dueDate: rescueDate,
        status: "pending",
        completedAt: "",
        rating: "",
        order: state.reviews.length
      }
    ]
  };
}

export function rateReview(state: ReviewState, reviewId: string, rating: Rating, now = new Date()): ReviewState {
  const review = state.reviews.find((item) => item.id === reviewId);
  if (!review || review.status === "completed") return state;
  const iso = now.toISOString();
  let next: ReviewState = {
    ...state,
    reviews: state.reviews.map((item) =>
      item.id === reviewId ? { ...item, status: "completed", completedAt: iso, rating } : item
    ),
    lastReviewedAt: iso,
    updatedAt: iso
  };
  if (rating === "forgot" || rating === "fuzzy") {
    next = addRescue(next, now);
  }
  if (!pendingReviews(next).length) {
    next = { ...next, status: "mastered" };
  }
  return next;
}

export function applySession(
  state: ReviewState,
  input: { rating: Rating; quizCorrect: boolean; now?: Date }
): ReviewState {
  const now = input.now ?? new Date();
  const day = todayKey(now);
  const firstLearn = state.status === "inbox";
  let next = firstLearn ? startLearning(state, now) : state;
  const due = dueReview(next, day);
  if (due && !firstLearn) {
    next = rateReview(next, due.id, input.rating, now);
  } else if (input.rating !== "remembered" || input.quizCorrect === false) {
    next = addRescue(next, now);
  } else {
    next = { ...next, lastReviewedAt: now.toISOString(), updatedAt: now.toISOString() };
  }
  return next;
}

export function makeAttempt(input: {
  employeeId: string;
  partId: string;
  reviewId?: string;
  rating: Rating | "";
  quizKind: QuizKind | "self_rate";
  quizCorrect: boolean | null;
  response?: string;
  now?: Date;
}): Attempt {
  const now = input.now ?? new Date();
  return {
    id: uid("attempt"),
    employeeId: input.employeeId,
    partId: input.partId,
    reviewId: input.reviewId ?? "",
    rating: input.rating,
    quizKind: input.quizKind,
    quizCorrect: input.quizCorrect,
    response: input.response ?? "",
    completedAt: now.toISOString()
  };
}

export function pickQuizKind(attemptCount: number, hasHotspot = false): QuizKind {
  if (!hasHotspot) {
    return attemptCount % 2 === 0 ? "image_to_name" : "name_to_image";
  }
  const kinds: QuizKind[] = ["image_to_name", "name_to_image", "hotspot"];
  return kinds[attemptCount % kinds.length];
}

export function milestoneDates(state: ReviewState): string[] {
  return state.reviews
    .filter((review) => review.kind === "milestone")
    .sort((a, b) => (a.offset ?? 0) - (b.offset ?? 0))
    .map((review) => review.dueDate);
}
