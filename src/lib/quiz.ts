import type { Part } from "../types";

function seededShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  for (let index = copy.length - 1; index > 0; index -= 1) {
    hash = Math.imul(hash, 1664525) + 1013904223;
    const other = Math.abs(hash) % (index + 1);
    const current = copy[index];
    copy[index] = copy[other];
    copy[other] = current;
  }
  return copy;
}

export function nameChoices(part: Part, all: Part[], count = 4): string[] {
  const others = seededShuffle(
    all.filter((item) => item.id !== part.id).map((item) => item.nameZh),
    part.id
  ).slice(0, count - 1);
  return seededShuffle([part.nameZh, ...others], `${part.id}-names`);
}

export function partChoices(part: Part, all: Part[], count = 4): Part[] {
  const others = seededShuffle(
    all.filter((item) => item.id !== part.id),
    `${part.id}-parts`
  ).slice(0, count - 1);
  return seededShuffle([part, ...others], `${part.id}-grid`);
}
