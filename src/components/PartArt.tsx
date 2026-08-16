import { assetUrl } from "../lib/asset";
import type { Part } from "../types";

/** Pictogram only. Sheet crops stay off the published site. */
export function visualSrc(part: Part): string | null {
  if (part.icon) return assetUrl(`deck/icons/${part.icon}`);
  return null;
}

/** Sheet crops are not published. */
export function sheetSrc(_part: Part): string | null {
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
    </figure>
  );
}
