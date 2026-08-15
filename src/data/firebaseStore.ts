import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type Firestore,
  type Unsubscribe
} from "firebase/firestore";
import { buildDemoProgress } from "./catalog";
import type { Attempt, PersistShape, Review, ReviewState } from "../types";

const STATES = "review_states";
const ATTEMPTS = "review_attempts";

export function stateDocId(state: Pick<ReviewState, "employeeId" | "partId">): string {
  return `${state.employeeId}__${state.partId}`;
}

export function stateToDoc(state: ReviewState): Record<string, unknown> {
  return {
    employeeId: state.employeeId,
    partId: state.partId,
    status: state.status,
    learnedAt: state.learnedAt || "",
    lastReviewedAt: state.lastReviewedAt || "",
    reviews: state.reviews,
    updatedAt: state.updatedAt || new Date().toISOString()
  };
}

export function docToState(raw: Record<string, unknown>): ReviewState {
  return {
    employeeId: String(raw.employeeId ?? ""),
    partId: String(raw.partId ?? ""),
    status: raw.status === "learning" || raw.status === "mastered" ? raw.status : "inbox",
    learnedAt: String(raw.learnedAt ?? ""),
    lastReviewedAt: String(raw.lastReviewedAt ?? ""),
    reviews: Array.isArray(raw.reviews) ? (raw.reviews as Review[]) : [],
    updatedAt: String(raw.updatedAt ?? "")
  };
}

export function attemptToDoc(attempt: Attempt): Record<string, unknown> {
  return {
    id: attempt.id,
    employeeId: attempt.employeeId,
    partId: attempt.partId,
    reviewId: attempt.reviewId || "",
    rating: attempt.rating || "",
    quizKind: attempt.quizKind,
    quizCorrect: attempt.quizCorrect,
    response: attempt.response || "",
    completedAt: attempt.completedAt
  };
}

export function docToAttempt(raw: Record<string, unknown>): Attempt {
  const quizKind = raw.quizKind;
  return {
    id: String(raw.id ?? ""),
    employeeId: String(raw.employeeId ?? ""),
    partId: String(raw.partId ?? ""),
    reviewId: String(raw.reviewId ?? ""),
    rating: raw.rating === "forgot" || raw.rating === "fuzzy" || raw.rating === "remembered" ? raw.rating : "",
    quizKind:
      quizKind === "image_to_name" || quizKind === "name_to_image" || quizKind === "hotspot" || quizKind === "self_rate"
        ? quizKind
        : "self_rate",
    quizCorrect: typeof raw.quizCorrect === "boolean" ? raw.quizCorrect : null,
    response: String(raw.response ?? ""),
    completedAt: String(raw.completedAt ?? "")
  };
}

export async function loadProgress(db: Firestore): Promise<PersistShape> {
  const [stateSnap, attemptSnap] = await Promise.all([
    getDocs(collection(db, STATES)),
    getDocs(collection(db, ATTEMPTS))
  ]);
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    states: stateSnap.docs.map((item) => docToState(item.data())),
    attempts: attemptSnap.docs.map((item) => docToAttempt(item.data()))
  };
}

async function writeAll(db: Firestore, persist: PersistShape): Promise<void> {
  const chunks: Array<() => Promise<void>> = [];
  const queue = [...persist.states.map((state) => ({ type: "state" as const, state })), ...persist.attempts.map((attempt) => ({ type: "attempt" as const, attempt }))];
  for (let index = 0; index < queue.length; index += 400) {
    const slice = queue.slice(index, index + 400);
    chunks.push(async () => {
      const batch = writeBatch(db);
      for (const item of slice) {
        if (item.type === "state") {
          batch.set(doc(db, STATES, stateDocId(item.state)), stateToDoc(item.state));
        } else {
          batch.set(doc(db, ATTEMPTS, item.attempt.id), attemptToDoc(item.attempt));
        }
      }
      await batch.commit();
    });
  }
  for (const run of chunks) await run();
}

export async function replaceProgress(db: Firestore, persist: PersistShape): Promise<void> {
  const [stateSnap, attemptSnap] = await Promise.all([
    getDocs(collection(db, STATES)),
    getDocs(collection(db, ATTEMPTS))
  ]);
  const existing = [...stateSnap.docs, ...attemptSnap.docs];
  for (let index = 0; index < existing.length; index += 400) {
    const batch = writeBatch(db);
    for (const item of existing.slice(index, index + 400)) batch.delete(item.ref);
    await batch.commit();
  }
  await writeAll(db, persist);
}

export async function ensureRemoteData(db: Firestore): Promise<PersistShape> {
  const current = await loadProgress(db);
  if (current.states.length) return current;
  const seeded = buildDemoProgress();
  const persist: PersistShape = {
    version: 1,
    savedAt: new Date().toISOString(),
    states: seeded.states,
    attempts: seeded.attempts
  };
  await writeAll(db, persist);
  return persist;
}

export async function upsertSession(db: Firestore, state: ReviewState, attempt: Attempt): Promise<void> {
  await Promise.all([
    setDoc(doc(db, STATES, stateDocId(state)), stateToDoc(state)),
    setDoc(doc(db, ATTEMPTS, attempt.id), attemptToDoc(attempt))
  ]);
}

export function listenProgress(db: Firestore, onChange: (persist: PersistShape) => void): Unsubscribe {
  let states: ReviewState[] = [];
  let attempts: Attempt[] = [];
  const publish = () => {
    onChange({
      version: 1,
      savedAt: new Date().toISOString(),
      states,
      attempts
    });
  };
  const stopStates = onSnapshot(collection(db, STATES), (snap) => {
    states = snap.docs.map((item) => docToState(item.data()));
    publish();
  });
  const stopAttempts = onSnapshot(collection(db, ATTEMPTS), (snap) => {
    attempts = snap.docs.map((item) => docToAttempt(item.data()));
    publish();
  });
  return () => {
    stopStates();
    stopAttempts();
  };
}

export async function clearProgress(db: Firestore): Promise<void> {
  const [stateSnap, attemptSnap] = await Promise.all([
    getDocs(collection(db, STATES)),
    getDocs(collection(db, ATTEMPTS))
  ]);
  await Promise.all([...stateSnap.docs, ...attemptSnap.docs].map((item) => deleteDoc(item.ref)));
}
