import { parts } from "../data/catalog";
import type { Attempt, Part, Profile, ReviewState } from "../types";
import { dueReview, pendingReviews, todayKey } from "./reviewEngine";

export type ViewingStatus = "not_started" | "recent" | "active" | "stale";
export type MotivationStatus = "steady" | "building" | "encourage";

export const VIEWING_STATUS_ZH: Record<ViewingStatus, string> = {
  not_started: "尚未觀看",
  recent: "最近看過",
  active: "持續觀看",
  stale: "需要回看"
};

export const MOTIVATION_STATUS_ZH: Record<MotivationStatus, string> = {
  steady: "學習節奏穩定",
  building: "持續建立中",
  encourage: "需要鼓勵"
};

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
  learningScore: number;
  motivationStatus: MotivationStatus;
  motivationLabel: string;
  motivationHint: string;
  viewingStatus: ViewingStatus;
  viewingLabel: string;
  viewedCount: number;
}

export function rankSnapshots(snapshots: EmployeeSnapshot[]): EmployeeSnapshot[] {
  return [...snapshots].sort(
    (a, b) =>
      b.learningScore - a.learningScore ||
      b.mastered - a.mastered ||
      (b.accuracy ?? -1) - (a.accuracy ?? -1)
  );
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

export function viewingStatusFor(lastAt: string, started: number, now = new Date()): ViewingStatus {
  if (!started || !lastAt) return "not_started";
  const lastTime = new Date(lastAt).getTime();
  if (Number.isNaN(lastTime)) return "stale";
  const hoursSinceLastActivity = Math.max(0, now.getTime() - lastTime) / (1000 * 60 * 60);
  if (hoursSinceLastActivity <= 24) return "recent";
  if (hoursSinceLastActivity <= 72) return "active";
  return "stale";
}

export function learningScoreFor(input: {
  assigned: number;
  started: number;
  mastered: number;
  accuracy: number | null;
  overdue: number;
  viewingStatus: ViewingStatus;
}): number {
  if (!input.assigned || !input.started) return 0;
  const startedRatio = Math.min(1, input.started / input.assigned);
  const masteredRatio = Math.min(1, input.mastered / input.assigned);
  const accuracy = input.accuracy ?? 0;
  const reviewDiscipline = input.overdue === 0 ? 10 : Math.max(0, 10 - input.overdue * 2);
  const recentActivityBonus = input.viewingStatus === "recent" ? 5 : input.viewingStatus === "active" ? 3 : 0;
  return Math.max(
    0,
    Math.min(100, Math.round(startedRatio * 30 + masteredRatio * 35 + accuracy * 20 + reviewDiscipline + recentActivityBonus))
  );
}

function motivationHint(
  status: MotivationStatus,
  viewingStatus: ViewingStatus,
  mastered: number,
  assigned: number,
  overdue: number
): string {
  if (status === "encourage" && viewingStatus === "not_started") return "安排一個 5 分鐘入門任務，先讓他開始。";
  if (overdue > 0) return `有 ${overdue} 張複習待完成，適合用提醒代替催促。`;
  if (status === "steady") return "可以給予認可，再挑戰下一個關鍵零件。";
  const remaining = Math.max(0, assigned - mastered);
  return remaining ? `再掌握 ${remaining} 張卡片，就能再前進一格。` : "保持節奏，繼續完成下一次複習。";
}

function motivationStatusFor(score: number, viewingStatus: ViewingStatus, overdue: number): MotivationStatus {
  if (score >= 70 && viewingStatus !== "stale" && overdue === 0) return "steady";
  if (score >= 35 && viewingStatus !== "not_started") return "building";
  return "encourage";
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
  const viewingStatus = viewingStatusFor(lastAt, started);
  const learningScore = learningScoreFor({
    assigned: mine.length || parts.length,
    started,
    mastered,
    accuracy,
    overdue,
    viewingStatus
  });
  const motivationStatus = motivationStatusFor(learningScore, viewingStatus, overdue);
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
    notStarted,
    learningScore,
    motivationStatus,
    motivationLabel: MOTIVATION_STATUS_ZH[motivationStatus],
    motivationHint: motivationHint(motivationStatus, viewingStatus, mastered, mine.length || parts.length, overdue),
    viewingStatus,
    viewingLabel: VIEWING_STATUS_ZH[viewingStatus],
    viewedCount: started
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
