import { parts, trainingSet } from "../data/catalog";
import { queueFor, snapshotFor } from "../engine/dashboard";
import type { Attempt, Profile, ReviewState } from "../types";

export interface AlisLearningSnapshot {
  schemaVersion: 1;
  generatedAt: string;
  learnerID: string;
  learnerName: string;
  courseTitle: string;
  totalItems: number;
  freshItems: number;
  dueToday: number;
  overdue: number;
  mastered: number;
  accuracy: number | null;
  streakDays: number;
  lastActivityAt: string | null;
  nextFocus: string | null;
  weakItems: string[];
  source: "training-web";
}

export type AlisSyncResult = "bridge" | "download";

export function buildAlisSnapshot(
  worker: Profile,
  states: ReviewState[],
  attempts: Attempt[]
): AlisLearningSnapshot {
  const snapshot = snapshotFor(worker, states, attempts);
  const queue = queueFor(worker.id, states);
  const next = queue.overdue[0] ?? queue.today[0] ?? queue.fresh[0];
  const nextPart = next ? parts.find((part) => part.id === next.partId) : undefined;

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    learnerID: worker.id,
    learnerName: worker.name,
    courseTitle: trainingSet.titleZh,
    totalItems: snapshot.assigned,
    freshItems: queue.fresh.length,
    dueToday: queue.today.length,
    overdue: queue.overdue.length,
    mastered: snapshot.mastered,
    accuracy: snapshot.accuracy,
    streakDays: currentStreakDays(snapshot.lastAt, attempts, worker.id),
    lastActivityAt: snapshot.lastAt || null,
    nextFocus: nextPart ? "先做：" + nextPart.nameId : null,
    weakItems: snapshot.weakParts.map((part) => part.nameId),
    source: "training-web"
  };
}

export async function syncAlisSnapshot(snapshot: AlisLearningSnapshot): Promise<AlisSyncResult> {
  try {
    const response = await fetch("/__ai-alis/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot)
    });
    if (response.ok) return "bridge";
  } catch {
    // Static deployments do not expose the local bridge; download below.
  }

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "learning-status.json";
  link.click();
  URL.revokeObjectURL(url);
  return "download";
}

function currentStreakDays(lastAt: string, attempts: Attempt[], employeeId: string): number {
  const days = new Set(
    attempts
      .filter((attempt) => attempt.employeeId === employeeId)
      .map((attempt) => attempt.completedAt.slice(0, 10))
      .concat(lastAt ? [lastAt.slice(0, 10)] : [])
      .filter(Boolean)
  );
  if (!days.size) return 0;

  const cursor = new Date();
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
