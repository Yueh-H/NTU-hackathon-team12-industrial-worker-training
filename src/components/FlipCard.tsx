import { categoryLabels } from "../data/catalog";
import type { Part } from "../types";
import { visualSrc } from "./PartArt";

/**
 * Two-sided vocabulary card.
 * Front: pictogram (or the real sheet line for baris cards) + Chinese as written on the sheet.
 * Back:  Indonesian + English + hint; baris cards get a segment-by-segment breakdown.
 */
export function FlipCard({
  part,
  flipped,
  onFlip
}: {
  part: Part;
  flipped: boolean;
  onFlip: () => void;
}) {
  const isLine = part.category === "baris";
  const src = visualSrc(part);
  const category = categoryLabels[part.category];

  return (
    <div
      className={`flip-card ${flipped ? "is-flipped" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={flipped ? "顯示正面" : "翻面看印尼文"}
      onClick={onFlip}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onFlip();
        }
      }}
    >
      <div className="flip-inner">
        <section className="flip-face flip-front" aria-hidden={flipped}>
          <span className="flip-tag">{category.zh}</span>
          {isLine ? (
            <>
              <p className="flip-raw">{part.nameZh}</p>
              {src ? <img className="flip-line" src={src} alt="單子上的這一行" /> : null}
            </>
          ) : (
            <>
              {src ? (
                <img className="flip-icon" src={src} alt={part.nameZh} />
              ) : (
                <div className="flip-icon flip-icon-empty">{part.nameZh}</div>
              )}
              <p className="flip-zh">{part.nameZh}</p>
            </>
          )}
          <span className="flip-hint">點一下翻面 · Ketuk untuk balik</span>
        </section>

        <section className="flip-face flip-back" aria-hidden={!flipped}>
          <span className="flip-tag">{category.idn}</span>
          <p className="flip-zh-small">{part.nameZh}</p>
          <p className="flip-idn">
            {part.nameId}
            {part.uncertain ? <span className="flip-unc" title="譯名尚未經現場師傅確認">?</span> : null}
          </p>
          <p className="flip-en">{part.nameEn}</p>
          {isLine && part.segments.length ? (
            <table className="flip-segments">
              <tbody>
                {part.segments.map((segment) => (
                  <tr key={segment.seg + segment.role}>
                    <td className="seg">{segment.seg}</td>
                    <td className="idn">{segment.idn}</td>
                    <td className="role">{segment.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      </div>
    </div>
  );
}
