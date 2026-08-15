import { Link } from "react-router-dom";
import { categoryLabels, parts } from "../data/catalog";
import { UNIT_ORDER } from "../engine/path";
import { partStatusLabel } from "../engine/dashboard";
import { STATUS_ZH } from "../lib/copy";
import type { CardCategory, ReviewState, TrainingSet } from "../types";

export function MaterialsPanel({
  employeeId,
  setId,
  training,
  states,
  selectedPartId
}: {
  employeeId: string;
  setId: string;
  training: TrainingSet;
  states: ReviewState[];
  selectedPartId?: string;
}) {
  if (!training.active) {
    return (
      <aside className="materials-panel">
        <p className="eyebrow">材料</p>
        <h2>{training.titleZh}</h2>
        <p className="fine">{training.summaryZh}</p>
      </aside>
    );
  }

  const visible = parts.filter((part) => part.setId === setId);
  return (
    <aside className="materials-panel">
      <p className="eyebrow">材料</p>
      <h2>{training.titleZh}</h2>
      <p className="fine">{visible.length} 項 · 點一項打開右邊卡片</p>
      {UNIT_ORDER.map((category) => (
        <CategoryBlock
          key={category}
          category={category}
          employeeId={employeeId}
          states={states}
          selectedPartId={selectedPartId}
        />
      ))}
    </aside>
  );
}

function CategoryBlock({
  category,
  employeeId,
  states,
  selectedPartId
}: {
  category: CardCategory;
  employeeId: string;
  states: ReviewState[];
  selectedPartId?: string;
}) {
  const items = parts.filter((part) => part.category === category);
  if (!items.length) return null;
  return (
    <section className="mat-cat">
      <h3>{categoryLabels[category].zh}</h3>
      <ul>
        {items.map((part) => {
          const state = states.find((item) => item.partId === part.id);
          const status = state ? partStatusLabel(state) : "new";
          return (
            <li key={part.id}>
              <Link
                className={`mat-item is-${status}${selectedPartId === part.id ? " is-on" : ""}`}
                to={`/learn/${employeeId}/part/${part.id}`}
              >
                <span className="num">{part.callout}</span>
                <span>{part.nameZh}</span>
                <small>{STATUS_ZH[status]}</small>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
