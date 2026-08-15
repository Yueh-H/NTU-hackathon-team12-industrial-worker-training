import { parts } from "../data/catalog";
import type { Attempt, Part, Profile, ReviewState } from "../types";
import { dueReview, pendingReviews, todayKey } from "./reviewEngine";

export interface EmployeeSnapshot {
  employee: Profile;
  assigned: number;
  started: number;
  mastered: number;
  dueToday: number;
  overdue: number;
  accuracy: number | null;
  quizCount: number;
  lastAt: string;
  weakParts: Part[];
  needsHelp: boolean;
  notStarted: boolean;
}

function quizAttempts(attempts: Attempt[], employeeId: string): Attempt[] {
  return attempts.filter((attempt) => attempt.employeeId === employeeId && attempt.quizCorrect !== null);
}

export function accuracyOf(attempts: Attempt[], employeeId: string, partId?: string): number | null {
  const subset = quizAttempts(attempts, employeeId).filter((attempt) => !partId || attempt.partId === partId);
  if (!subset.length) return null;
  return subset.filter((attempt) => attempt.quizCorrect).length / subset.length;
}

export function lastActivity(states: ReviewState[], attempts: Attempt[], employeeId: string): string {
  const times = [
    ...states.filter((state) => state.employeeId === employeeId).flatMap((state) => [state.lastReviewedAt, state.learnedAt]),
    ...attempts.filter((attempt) => attempt.employeeId === employeeId).map((attempt) => attempt.completedAt)
  ].filter(Boolean);
  return times.sort().at(-1) ?? "";
}

export function weakPartsFor(attempts: Attempt[], employeeId: string, limit = 3): Part[] {
  const misses = new Map<string, number>();
  for (const attempt of attempts) {
    if (attempt.employeeId !== employeeId) continue;
    const miss = attempt.quizCorrect === false || attempt.rating === "forgot" || attempt.rating === "fuzzy";
    if (!miss) continue;
    misses.set(attempt.partId, (misses.get(attempt.partId) ?? 0) + 1);
  }
  return [...misses.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([partId]) => parts.find((part) => part.id === partId))
    .filter((part): part is Part => Boolean(part))
    .slice(0, limit);
}

export function snapshotFor(
  employee: Profile,
  states: ReviewState[],
  attempts: Attempt[],
  day = todayKey()
): EmployeeSnapshot {
  const mine = states.filter((state) => state.employeeId === employee.id);
  const dueToday = mine.filter((state) => {
    const due = dueReview(state, day);
    return Boolean(due && due.dueDate === day);
  }).length;
  const overdue = mine.filter((state) => {
    const due = dueReview(state, day);
    return Boolean(due && due.dueDate < day);
  }).length;
  const started = mine.filter((state) => state.status !== "inbox").length;
  const mastered = mine.filter((state) => state.status === "mastered").length;
  const quizzes = quizAttempts(attempts, employee.id);
  const accuracy = quizzes.length ? quizzes.filter((attempt) => attempt.quizCorrect).length / quizzes.length : null;
  const lastAt = lastActivity(mine, attempts, employee.id);
  const stale =
    lastAt !== "" && (Date.now() - new Date(lastAt).getTime()) / (1000 * 60 * 60 * 24) >= 2;
  const notStarted = started === 0;
  const needsHelp = !notStarted && (overdue >= 2 || (accuracy !== null && accuracy < 0.6 && quizzes.length >= 3) || stale);
  return {
    employee,
    assigned: mine.length || parts.length,
    started,
    mastered,
    dueToday,
    overdue,
    accuracy,
    quizCount: quizzes.length,
    lastAt,
    weakParts: weakPartsFor(attempts, employee.id),
    needsHelp,
    notStarted
  };
}

export function queueFor(employeeId: string, states: ReviewState[], day = todayKey()) {
  const mine = states.filter((state) => state.employeeId === employeeId);
  const overdue: ReviewState[] = [];
  const today: ReviewState[] = [];
  const fresh: ReviewState[] = [];
  for (const state of mine) {
    const due = dueReview(state, day);
    if (due && due.dueDate < day) overdue.push(state);
    else if (due && due.dueDate === day) today.push(state);
    else if (state.status === "inbox") fresh.push(state);
  }
  return { overdue, today, fresh };
}

export function partStatusLabel(state: ReviewState, day = todayKey()): "new" | "due" | "overdue" | "learning" | "mastered" {
  if (state.status === "mastered" && !dueReview(state, day)) return "mastered";
  const due = dueReview(state, day);
  if (due && due.dueDate < day) return "overdue";
  if (due && due.dueDate === day) return "due";
  if (state.status === "inbox") return "new";
  return "learning";
}

export function nextDueLabel(state: ReviewState): string {
  const next = pendingReviews(state)[0];
  return next ? next.dueDate : "";
}
