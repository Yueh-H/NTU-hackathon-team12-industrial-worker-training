import seed from "./seed.json";
import deck from "./workorder-cards.json";
import type { Assignment, Attempt, CardCategory, Part, Profile, ReviewState, TrainingSet } from "../types";
import { dateAt, emptyState, makeAttempt, rateReview, startLearning } from "../engine/reviewEngine";

const HOTSPOTS: Record<string, { x: number; y: number }> = {
  "daun-anak": { x: 16, y: 33 },
  "daun-induk": { x: 38, y: 33 },
  "pintu-induk-anak": { x: 27, y: 33 },
  jendela: { x: 15, y: 30 },
  "kaca-tahan-api": { x: 15, y: 30 },
  "engsel-bendera": { x: 47, y: 46 },
  "pin-anti-congkel": { x: 16, y: 69 },
  "seal-bawah": { x: 72, y: 13 },
  "gagang-tanam": { x: 80, y: 42 },
  "grendel-3-titik": { x: 56, y: 12 },
  "papan-perlit": { x: 42, y: 56 },
  "papan-mgo": { x: 80, y: 36 },
  "lis-kaca": { x: 78, y: 84 },
  "penutup-tepi": { x: 8, y: 24 }
};

export const categoryLabels = deck.meta.categories as Record<CardCategory, { zh: string; idn: string }>;

export const trainingSet = {
  ...(seed.trainingSet as TrainingSet),
  summaryId: `Kenali ${deck.cards.length} kartu dari lembar ${seed.trainingSet.docNo}.`,
  summaryZh: `工單 ${seed.trainingSet.docNo} 共 ${deck.cards.length} 張單字卡。`
};

export const profiles = seed.profiles as Profile[];
export const assignments = seed.assignments as Assignment[];
export const workers = profiles.filter((profile) => profile.role === "worker");
export const supervisors = profiles.filter((profile) => profile.role === "supervisor");

export const parts: Part[] = deck.cards.map((card, index) => ({
  id: card.id,
  setId: trainingSet.id,
  version: trainingSet.version,
  callout: index + 1,
  category: card.cat as CardCategory,
  nameId: card.idn,
  nameZh: card.zh,
  nameEn: card.en,
  functionId: card.hint,
  safetyId: card.uncertain
    ? "譯名尚未經現場師傅確認，請以工單原文為準。"
    : "組立前請先對過工單上的原文。",
  icon: card.icon,
  sheet: card.sheet,
  hotspot: HOTSPOTS[card.id] ?? null,
  critical: card.cat === "hardware" || card.cat === "baris" || Boolean(card.uncertain),
  uncertain: Boolean(card.uncertain)
}));

export function partById(id: string): Part | undefined {
  return parts.find((part) => part.id === id);
}

export function workerById(id: string): Profile | undefined {
  return workers.find((profile) => profile.id === id);
}

export function partsByCategory(category: CardCategory): Part[] {
  return parts.filter((part) => part.category === category);
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

  const budiDone = parts
    .filter((part) => part.category === "struktur" && part.id !== "jendela")
    .map((part) => part.id);
  for (const partId of budiDone) {
    const result = replay("budi", partId, today, 10, [
      { offset: 1, rating: "remembered", daysAgo: 9 },
      { offset: 3, rating: "remembered", daysAgo: 7 },
      { offset: 7, rating: "remembered", daysAgo: 3 }
    ]);
    states.push(result.state);
    attempts.push(...result.attempts);
  }

  const budiDue = replay("budi", "papan-perlit", today, 7, [
    { offset: 1, rating: "remembered", daysAgo: 6 },
    { offset: 3, rating: "remembered", daysAgo: 4 }
  ]);
  states.push(budiDue.state);
  attempts.push(...budiDue.attempts);

  const budiOverdue = replay("budi", "kaca-tahan-api", today, 9, [
    { offset: 1, rating: "remembered", daysAgo: 8 },
    { offset: 3, rating: "fuzzy", daysAgo: 6 }
  ]);
  states.push(budiOverdue.state);
  attempts.push(...budiOverdue.attempts);

  for (const partId of ["daun-anak", "daun-induk", "sisi-engsel", "pintu-induk-anak", "tebal-pintu"]) {
    const result = replay("sari", partId, today, 4, [{ offset: 1, rating: "remembered", daysAgo: 3 }]);
    states.push(result.state);
    attempts.push(...result.attempts);
  }
  const sariGlass = replay("sari", "kaca-tahan-api", today, 4, [{ offset: 1, rating: "forgot", daysAgo: 3 }]);
  states.push(sariGlass.state);
  attempts.push(...sariGlass.attempts);
  const sariLock = replay("sari", "grendel-3-titik", today, 4, [{ offset: 1, rating: "fuzzy", daysAgo: 2 }]);
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
