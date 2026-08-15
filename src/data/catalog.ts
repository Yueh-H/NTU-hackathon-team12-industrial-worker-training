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

export const trainingSet: TrainingSet = {
  ...(seed.trainingSet as Omit<TrainingSet, "active">),
  summaryId: `Kenali ${deck.cards.length} kartu dari lembar ${seed.trainingSet.docNo}.`,
  summaryZh: `工單 ${seed.trainingSet.docNo} 共 ${deck.cards.length} 張單字卡。`,
  active: true
};

export const trainingSets: TrainingSet[] = [
  trainingSet,
  {
    id: "fm720088",
    version: 1,
    docNo: "FM720088 / 11506821-3",
    titleId: "Pintu tahan api",
    titleZh: "FM720088 防火門扇",
    machine: "15-D6 單扇",
    station: "製一課／組立",
    summaryId: "",
    summaryZh: "下一張指派工單，教材尚未開放。",
    active: false
  },
  {
    id: "fm810012",
    version: 1,
    docNo: "FM810012 / 11507102-1",
    titleId: "Frame pintu",
    titleZh: "FM810012 玄關框組立",
    machine: "框線-02",
    station: "製二課／組立",
    summaryId: "",
    summaryZh: "下一張指派工單，教材尚未開放。",
    active: false
  }
];

export function trainingSetById(id: string): TrainingSet | undefined {
  return trainingSets.find((item) => item.id === id);
}

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
  segments: (card.parts ?? []).map(([seg, idn, role]) => ({ seg, idn, role })),
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

type DemoStep = { offset: number; rating: "forgot" | "fuzzy" | "remembered"; daysAgo: number };

interface DemoScenario {
  employeeId: string;
  partIds: string[];
  learnedDaysAgo: number;
  steps: DemoStep[];
}

const EXTRA_DEMO_SCENARIOS: DemoScenario[] = [
  {
    employeeId: "agus",
    partIds: ["daun-anak", "daun-induk", "engsel-bendera", "grendel-3-titik", "papan-perlit", "lis-kaca"],
    learnedDaysAgo: 0,
    steps: []
  },
  {
    employeeId: "dwi",
    partIds: ["daun-anak", "daun-induk", "jendela", "kaca-tahan-api", "seal-bawah", "penutup-tepi"],
    learnedDaysAgo: 7,
    steps: [
      { offset: 1, rating: "remembered", daysAgo: 6 },
      { offset: 3, rating: "remembered", daysAgo: 4 },
      { offset: 7, rating: "remembered", daysAgo: 0 }
    ]
  },
  {
    employeeId: "rina",
    partIds: ["engsel-bendera", "pin-anti-congkel", "grendel-3-titik", "papan-perlit", "papan-mgo"],
    learnedDaysAgo: 3,
    steps: [{ offset: 1, rating: "remembered", daysAgo: 2 }]
  },
  {
    employeeId: "joko",
    partIds: ["daun-anak", "daun-induk", "kaca-tahan-api", "engsel-bendera", "pin-anti-congkel", "grendel-3-titik"],
    learnedDaysAgo: 10,
    steps: [
      { offset: 1, rating: "remembered", daysAgo: 9 },
      { offset: 3, rating: "fuzzy", daysAgo: 7 },
      { offset: 7, rating: "forgot", daysAgo: 3 }
    ]
  },
  {
    employeeId: "maya",
    partIds: parts.slice(0, 18).map((part) => part.id),
    learnedDaysAgo: 36,
    steps: [
      { offset: 1, rating: "remembered", daysAgo: 35 },
      { offset: 3, rating: "remembered", daysAgo: 33 },
      { offset: 7, rating: "remembered", daysAgo: 29 },
      { offset: 30, rating: "remembered", daysAgo: 0 }
    ]
  },
  {
    employeeId: "arif",
    partIds: ["penutup-tepi", "seal-bawah", "gagang-tanam", "papan-mgo"],
    learnedDaysAgo: 2,
    steps: []
  },
  {
    employeeId: "dewi",
    partIds: ["daun-anak", "daun-induk", "engsel-bendera", "kaca-tahan-api", "lis-kaca", "penutup-tepi"],
    learnedDaysAgo: 12,
    steps: [
      { offset: 1, rating: "remembered", daysAgo: 11 },
      { offset: 3, rating: "remembered", daysAgo: 9 },
      { offset: 7, rating: "fuzzy", daysAgo: 5 }
    ]
  }
];

function appendScenario(
  scenario: DemoScenario,
  today: Date,
  states: ReviewState[],
  attempts: Attempt[]
): void {
  for (const partId of scenario.partIds) {
    const result = replay(scenario.employeeId, partId, today, scenario.learnedDaysAgo, scenario.steps);
    states.push(result.state);
    attempts.push(...result.attempts);
  }
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

  for (const scenario of EXTRA_DEMO_SCENARIOS) {
    appendScenario(scenario, today, states, attempts);
  }

  for (const worker of workers) {
    for (const part of parts) {
      if (!states.some((state) => state.employeeId === worker.id && state.partId === part.id)) {
        states.push(emptyState(worker.id, part.id));
      }
    }
  }

  return { states, attempts };
}
