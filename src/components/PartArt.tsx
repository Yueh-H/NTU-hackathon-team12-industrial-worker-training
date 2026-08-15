import type { Part } from "../types";

export function visualSrc(part: Part): string | null {
  if (part.sheet) return `/deck/sheet/${part.sheet}`;
  if (part.icon) return `/deck/icons/${part.icon}`;
  return null;
}

export function PartArt({ part, label }: { part: Part; label: string }) {
  const src = visualSrc(part);
  if (src) {
    return (
      <figure className="part-art">
        <img src={src} alt={label} />
      </figure>
    );
  }
  return (
    <figure className="part-art type-card">
      <strong>{part.nameZh}</strong>
      <span>{part.nameId}</span>
    </figure>
  );
}
