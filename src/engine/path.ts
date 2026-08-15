import { categoryLabels, parts } from "../data/catalog";
import type { Attempt, CardCategory, Part } from "../types";

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
export type StarCount = 0 | 1 | 2;

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

export function unitForPart(partId: string): UnitPath | undefined {
  return units.find((unit) => unit.lessons.some((lesson) => lesson.partIds.includes(partId)));
}

export function unitPartIds(unit: UnitPath): string[] {
  return unit.lessons.flatMap((lesson) => lesson.partIds);
}

export function partsInLesson(lesson: Lesson): Part[] {
  return lesson.partIds.map((id) => parts.find((part) => part.id === id)).filter((part): part is Part => Boolean(part));
}

export function cardCleared(attempts: Attempt[], employeeId: string, partId: string): boolean {
  return attempts.some(
    (attempt) => attempt.employeeId === employeeId && attempt.partId === partId && attempt.quizCorrect === true
  );
}

export function isLessonDone(lesson: Lesson, attempts: Attempt[], employeeId: string): boolean {
  return lesson.partIds.length > 0 && lesson.partIds.every((partId) => cardCleared(attempts, employeeId, partId));
}

export function isUnitComplete(unit: UnitPath, attempts: Attempt[], employeeId: string): boolean {
  const ids = unitPartIds(unit);
  return ids.length > 0 && ids.every((partId) => cardCleared(attempts, employeeId, partId));
}

export function unitProgress(
  unit: UnitPath,
  attempts: Attempt[],
  employeeId: string
): { done: number; total: number } {
  const ids = unitPartIds(unit);
  const done = ids.filter((partId) => cardCleared(attempts, employeeId, partId)).length;
  return { done, total: ids.length };
}

export function nextUnit(unit: UnitPath): UnitPath | undefined {
  const index = units.findIndex((item) => item.id === unit.id);
  if (index < 0 || index >= units.length - 1) return undefined;
  return units[index + 1];
}

export function unitStars(
  unit: UnitPath,
  attempts: Attempt[],
  employeeId: string,
  spokenPartIds: Iterable<string> = []
): StarCount {
  if (isUnitComplete(unit, attempts, employeeId)) return 2;
  const spoken = spokenPartIds instanceof Set ? spokenPartIds : new Set(spokenPartIds);
  const ids = unitPartIds(unit);
  if (ids.some((id) => spoken.has(id) || cardCleared(attempts, employeeId, id))) return 1;
  return 0;
}

export function cardStars(
  partId: string,
  attempts: Attempt[],
  employeeId: string,
  spoken: boolean
): StarCount {
  if (cardCleared(attempts, employeeId, partId)) return 2;
  return spoken ? 1 : 0;
}

export function nodeState(lesson: Lesson, attempts: Attempt[], employeeId: string): NodeState {
  return isLessonDone(lesson, attempts, employeeId) ? "done" : "open";
}

export function firstOpenPart(lesson: Lesson, attempts: Attempt[], employeeId: string): string {
  return lesson.partIds.find((partId) => !cardCleared(attempts, employeeId, partId)) ?? lesson.partIds[0];
}

export function nextPartInLesson(lesson: Lesson, partId: string): string | undefined {
  const index = lesson.partIds.indexOf(partId);
  if (index < 0 || index >= lesson.partIds.length - 1) return undefined;
  return lesson.partIds[index + 1];
}

export function spokenSet(employeeId: string, hasSpoken: (employeeId: string, partId: string) => boolean): Set<string> {
  return new Set(parts.filter((part) => hasSpoken(employeeId, part.id)).map((part) => part.id));
}
