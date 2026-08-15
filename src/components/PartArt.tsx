import { assetUrl } from "../lib/asset";
import type { Part } from "../types";

/** Pictogram first; the sheet crop is only the visual when there is no icon (baris cards). */
export function visualSrc(part: Part): string | null {
  if (part.icon) return assetUrl(`deck/icons/${part.icon}`);
  if (part.sheet) return assetUrl(`deck/sheet/${part.sheet}`);
  return null;
}

/** The real production-sheet crop for this card, if any. */
export function sheetSrc(part: Part): string | null {
  return part.sheet ? assetUrl(`deck/sheet/${part.sheet}`) : null;
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
    </figure>
  );
}
