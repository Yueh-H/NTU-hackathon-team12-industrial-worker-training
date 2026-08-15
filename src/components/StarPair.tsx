import type { StarCount } from "../engine/path";

export function StarPair({ count, label }: { count: StarCount | number; label?: string }) {
  const safeCount = Math.max(0, Math.min(2, Math.round(count))) as StarCount;
  return (
    <span className="star-pair" role="img" aria-label={label ?? `${safeCount} 顆星`}>
      <span className={safeCount >= 1 ? "on" : "off"} aria-hidden="true">
        ★
      </span>
      <span className={safeCount >= 2 ? "on" : "off"} aria-hidden="true">
        ★
      </span>
    </span>
  );
}
