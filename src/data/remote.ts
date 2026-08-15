import { assignments, buildDemoProgress, parts, profiles, trainingSet } from "./catalog";
import type { Attempt, PersistShape, Review, ReviewState } from "../types";
import type { SupabaseClient } from "@supabase/supabase-js";

interface StateRow {
  employee_id: string;
  part_id: string;
  status: ReviewState["status"];
  learned_at: string;
  last_reviewed_at: string;
  reviews: Review[];
  updated_at: string;
}

interface AttemptRow {
  id: string;
  employee_id: string;
  part_id: string;
  review_id: string;
  rating: Attempt["rating"];
  quiz_kind: Attempt["quizKind"];
  quiz_correct: boolean | null;
  response: string;
  completed_at: string;
}

export function stateToRow(state: ReviewState): StateRow {
  return {
    employee_id: state.employeeId,
    part_id: state.partId,
    status: state.status,
    learned_at: state.learnedAt,
    last_reviewed_at: state.lastReviewedAt,
    reviews: state.reviews,
    updated_at: state.updatedAt || new Date().toISOString()
  };
}

export function rowToState(row: StateRow): ReviewState {
  return {
    employeeId: row.employee_id,
    partId: row.part_id,
    status: row.status,
    learnedAt: row.learned_at ?? "",
    lastReviewedAt: row.last_reviewed_at ?? "",
    reviews: Array.isArray(row.reviews) ? row.reviews : [],
    updatedAt: row.updated_at ?? ""
  };
}

export function attemptToRow(attempt: Attempt): AttemptRow {
  return {
    id: attempt.id,
    employee_id: attempt.employeeId,
    part_id: attempt.partId,
    review_id: attempt.reviewId,
    rating: attempt.rating,
    quiz_kind: attempt.quizKind,
    quiz_correct: attempt.quizCorrect,
    response: attempt.response,
    completed_at: attempt.completedAt
  };
}

export function rowToAttempt(row: AttemptRow): Attempt {
  return {
    id: row.id,
    employeeId: row.employee_id,
    partId: row.part_id,
    reviewId: row.review_id ?? "",
    rating: row.rating ?? "",
    quizKind: row.quiz_kind,
    quizCorrect: row.quiz_correct,
    response: row.response ?? "",
    completedAt: row.completed_at
  };
}

export async function seedCatalog(client: SupabaseClient): Promise<void> {
  const { error: setError } = await client.from("training_sets").upsert({
    id: trainingSet.id,
    version: trainingSet.version,
    doc_no: trainingSet.docNo,
    title_id: trainingSet.titleId,
    title_zh: trainingSet.titleZh,
    machine: trainingSet.machine,
    station: trainingSet.station,
    summary_id: trainingSet.summaryId,
    summary_zh: trainingSet.summaryZh
  });
  if (setError) throw setError;

  const { error: profileError } = await client.from("profiles").upsert(
    profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      station: profile.station,
      role: profile.role,
      language: profile.language
    }))
  );
  if (profileError) throw profileError;

  const { error: partError } = await client.from("parts").upsert(
    parts.map((part) => ({
      id: part.id,
      set_id: part.setId,
      version: part.version,
      callout: part.callout,
      name_id: part.nameId,
      name_zh: part.nameZh,
      name_en: part.nameEn,
      function_id: part.functionId,
      safety_id: part.safetyId,
      hotspot: part.hotspot ?? { x: 0, y: 0 },
      critical: part.critical
    }))
  );
  if (partError) throw partError;

  const { error: assignError } = await client.from("assignments").upsert(
    assignments.map((item) => ({
      employee_id: item.employeeId,
      set_id: item.setId
    }))
  );
  if (assignError) throw assignError;
}

export async function replaceProgress(client: SupabaseClient, persist: PersistShape): Promise<void> {
  const { error: delAttempts } = await client.from("review_attempts").delete().neq("id", "");
  if (delAttempts) throw delAttempts;
  const { error: delStates } = await client.from("review_states").delete().neq("employee_id", "");
  if (delStates) throw delStates;

  if (persist.states.length) {
    const { error } = await client.from("review_states").insert(persist.states.map(stateToRow));
    if (error) throw error;
  }
  if (persist.attempts.length) {
    const { error } = await client.from("review_attempts").insert(persist.attempts.map(attemptToRow));
    if (error) throw error;
  }
}

export async function loadProgress(client: SupabaseClient): Promise<PersistShape> {
  const [statesRes, attemptsRes] = await Promise.all([
    client.from("review_states").select("*"),
    client.from("review_attempts").select("*")
  ]);
  if (statesRes.error) throw statesRes.error;
  if (attemptsRes.error) throw attemptsRes.error;
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    states: (statesRes.data as StateRow[]).map(rowToState),
    attempts: (attemptsRes.data as AttemptRow[]).map(rowToAttempt)
  };
}

export async function ensureRemoteData(client: SupabaseClient): Promise<PersistShape> {
  await seedCatalog(client);
  const current = await loadProgress(client);
  if (current.states.length) return current;
  const seeded = buildDemoProgress();
  const persist: PersistShape = {
    version: 1,
    savedAt: new Date().toISOString(),
    states: seeded.states,
    attempts: seeded.attempts
  };
  await replaceProgress(client, persist);
  return persist;
}

export async function upsertSession(
  client: SupabaseClient,
  state: ReviewState,
  attempt: Attempt
): Promise<void> {
  const { error: stateError } = await client.from("review_states").upsert(stateToRow(state));
  if (stateError) throw stateError;
  const { error: attemptError } = await client.from("review_attempts").upsert(attemptToRow(attempt));
  if (attemptError) throw attemptError;
}
