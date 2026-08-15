import { parts } from "../data/catalog";
import { partStatusLabel } from "../engine/dashboard";
import type { ReviewState } from "../types";

interface DrawingBoardProps {
  states: ReviewState[];
  selectedId?: string;
  highlightId?: string;
  wrongId?: string;
  onPick: (partId: string) => void;
  interactive?: boolean;
}

export function DrawingBoard({
  states,
  selectedId,
  highlightId,
  wrongId,
  onPick,
  interactive = true
}: DrawingBoardProps) {
  return (
    <div className="drawing-board">
      <img className="drawing-image" src="/drawing.png" alt="FM-DEMO 生產製造表 DEMO-001" />
      {parts.map((part) => {
        if (!part.hotspot) return null;
        const state = states.find((item) => item.partId === part.id);
        const status = state ? partStatusLabel(state) : "new";
        const classes = [
          "hotspot",
          `is-${status}`,
          selectedId === part.id ? "is-selected" : "",
          highlightId === part.id ? "is-highlight" : "",
          wrongId === part.id ? "is-wrong" : ""
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={part.id}
            type="button"
            className={classes}
            style={{ left: `${part.hotspot.x}%`, top: `${part.hotspot.y}%` }}
            onClick={() => interactive && onPick(part.id)}
            aria-label={`${part.callout} ${part.nameZh}`}
          >
            {part.callout}
          </button>
        );
      })}
    </div>
  );
}
