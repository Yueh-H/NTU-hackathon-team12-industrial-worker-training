import { categoryLabels, parts } from "../data/catalog";
import type { Attempt, CardCategory, Part, ReviewState } from "../types";

export const UNIT_ORDER: CardCategory[] = ["struktur", "bahan", "hardware", "proses", "lembar", "baris"];
const CHUNK = 4;

export interface Lesson {
  id: string;
  unit: CardCategory;
  index: number;
  title: string;
  partIds: string[];
}

export interface UnitPath {
  id: CardCategory;
  title: string;
  order: number;
  lessons: Lesson[];
}

export type NodeState = "open" | "done";

export function buildUnits(): UnitPath[] {
  return UNIT_ORDER.map((unit, order) => {
    const group = parts.filter((part) => part.category === unit);
    const lessons: Lesson[] = [];
    for (let index = 0; index < group.length; index += CHUNK) {
      const slice = group.slice(index, index + CHUNK);
      const lessonIndex = lessons.length;
      lessons.push({
        id: `${unit}-${lessonIndex}`,
        unit,
        index: lessonIndex,
        title: `檢核站 ${lessonIndex + 1}`,
        partIds: slice.map((part) => part.id)
      });
    }
    return {
      id: unit,
      title: categoryLabels[unit].zh,
      order,
      lessons
    };
  });
}

export const units = buildUnits();
export const lessons = units.flatMap((unit) => unit.lessons);

export function lessonById(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

export function lessonForPart(partId: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.partIds.includes(partId));
}

export function partsInLesson(lesson: Lesson): Part[] {
  return lesson.partIds.map((id) => parts.find((part) => part.id === id)).filter((part): part is Part => Boolean(part));
}

export function isLessonDone(lesson: Lesson, states: ReviewState[]): boolean;
export function isLessonDone(lesson: Lesson, attempts: Attempt[], employeeId: string): boolean;
export function isLessonDone(lesson: Lesson, evidence: ReviewState[] | Attempt[], employeeId?: string): boolean {
  if (employeeId !== undefined) {
    return lesson.partIds.every((partId) => hasCorrectAttempt(evidence as Attempt[], employeeId, partId));
  }
  return lesson.partIds.every((partId) => {
    const state = (evidence as ReviewState[]).find((item) => item.partId === partId);
    return Boolean(state && state.status !== "inbox");
  });
}

function hasAttempt(attempts: Attempt[], employeeId: string, partId: string): boolean {
  return attempts.some(
    (attempt) => attempt.employeeId === employeeId && attempt.partId === partId && attempt.quizCorrect !== null
  );
}

function hasCorrectAttempt(attempts: Attempt[], employeeId: string, partId: string): boolean {
  return attempts.some(
    (attempt) => attempt.employeeId === employeeId && attempt.partId === partId && attempt.quizCorrect === true
  );
}

export function unitProgress(unit: UnitPath, states: ReviewState[]): { done: number; total: number };
export function unitProgress(unit: UnitPath, attempts: Attempt[], employeeId: string): { done: number; total: number };
export function unitProgress(
  unit: UnitPath,
  evidence: ReviewState[] | Attempt[],
  employeeId?: string
): { done: number; total: number } {
  const ids = unit.lessons.flatMap((lesson) => lesson.partIds);
  const done = employeeId === undefined
    ? ids.filter((partId) => {
        const state = (evidence as ReviewState[]).find((item) => item.partId === partId);
        return Boolean(state && state.status !== "inbox");
      }).length
    : ids.filter((partId) => hasAttempt(evidence as Attempt[], employeeId, partId)).length;
  return { done, total: ids.length };
}

export function nodeState(lesson: Lesson, states: ReviewState[]): NodeState;
export function nodeState(lesson: Lesson, attempts: Attempt[], employeeId: string): NodeState;
export function nodeState(lesson: Lesson, evidence: ReviewState[] | Attempt[], employeeId?: string): NodeState {
  const done = employeeId === undefined
    ? isLessonDone(lesson, evidence as ReviewState[])
    : isLessonDone(lesson, evidence as Attempt[], employeeId);
  return done ? "done" : "open";
}

export function firstOpenPart(lesson: Lesson, states: ReviewState[]): string;
export function firstOpenPart(lesson: Lesson, attempts: Attempt[], employeeId: string): string;
export function firstOpenPart(lesson: Lesson, evidence: ReviewState[] | Attempt[], employeeId?: string): string {
  return (
    employeeId === undefined
      ? lesson.partIds.find((partId) => {
          const state = (evidence as ReviewState[]).find((item) => item.partId === partId);
          return !state || state.status === "inbox";
        })
      : lesson.partIds.find((partId) => !hasCorrectAttempt(evidence as Attempt[], employeeId, partId))
  ) ?? lesson.partIds[0];
}

export function spokenSet(
  employeeId: string,
  hasCompletedSpeech: (employeeId: string, partId: string) => boolean
): Set<string> {
  return new Set(
    parts
      .map((part) => part.id)
      .filter((partId) => hasCompletedSpeech(employeeId, partId))
  );
}

export function unitStars(unit: UnitPath, attempts: Attempt[], employeeId: string, spoken: Set<string>): number {
  const ids = unit.lessons.flatMap((lesson) => lesson.partIds);
  if (!ids.length) return 0;
  const speechStar = ids.every((partId) => spoken.has(partId)) ? 1 : 0;
  const quizStar = ids.every((partId) => hasCorrectAttempt(attempts, employeeId, partId)) ? 1 : 0;
  return speechStar + quizStar;
}

export function isUnitUnlocked(unit: UnitPath, attempts: Attempt[], employeeId: string): boolean {
  if (unit.order === 0) return true;
  const previous = units.find((item) => item.order === unit.order - 1);
  if (!previous) return true;
  const ids = previous.lessons.flatMap((lesson) => lesson.partIds);
  return ids.every((partId) => hasCorrectAttempt(attempts, employeeId, partId));
}

export function nextPartInLesson(lesson: Lesson, partId: string): string | undefined {
  const index = lesson.partIds.indexOf(partId);
  if (index < 0 || index >= lesson.partIds.length - 1) return undefined;
  return lesson.partIds[index + 1];
}
