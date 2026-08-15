import { categoryLabels, parts } from "../data/catalog";
import type { CardCategory, Part, ReviewState } from "../types";

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

export type NodeState = "locked" | "current" | "done";

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

export function isLessonDone(lesson: Lesson, states: ReviewState[]): boolean {
  return lesson.partIds.every((partId) => {
    const state = states.find((item) => item.partId === partId);
    return Boolean(state && state.status !== "inbox");
  });
}

export function unitProgress(unit: UnitPath, states: ReviewState[]): { done: number; total: number } {
  const ids = unit.lessons.flatMap((lesson) => lesson.partIds);
  const done = ids.filter((partId) => {
    const state = states.find((item) => item.partId === partId);
    return Boolean(state && state.status !== "inbox");
  }).length;
  return { done, total: ids.length };
}

export function nodeState(lesson: Lesson, states: ReviewState[]): NodeState {
  if (isLessonDone(lesson, states)) return "done";
  const unit = units.find((item) => item.id === lesson.unit);
  if (!unit) return "locked";
  if (lesson.index === 0) {
    if (unit.order === 0) return "current";
    const previous = units[unit.order - 1];
    return previous.lessons.every((item) => isLessonDone(item, states)) ? "current" : "locked";
  }
  const previousLesson = unit.lessons[lesson.index - 1];
  return isLessonDone(previousLesson, states) ? "current" : "locked";
}

export function firstOpenPart(lesson: Lesson, states: ReviewState[]): string {
  return (
    lesson.partIds.find((partId) => {
      const state = states.find((item) => item.partId === partId);
      return !state || state.status === "inbox";
    }) ?? lesson.partIds[0]
  );
}

export function nextPartInLesson(lesson: Lesson, partId: string): string | undefined {
  const index = lesson.partIds.indexOf(partId);
  if (index < 0 || index >= lesson.partIds.length - 1) return undefined;
  return lesson.partIds[index + 1];
}
