import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categoryLabels, parts } from "../data/catalog";
import { firstOpenPart, lessonForPart, UNIT_ORDER } from "../engine/path";
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
  const selectedCategory = parts.find((part) => part.id === selectedPartId)?.category;
  const [open, setOpen] = useState<CardCategory | "">(selectedCategory ?? "struktur");

  useEffect(() => {
    if (selectedCategory) setOpen(selectedCategory);
  }, [selectedCategory]);

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
      <p className="fine">{visible.length} 項 · 點分類展開，再選要學的項目</p>
      {UNIT_ORDER.map((category) => (
        <CategoryBlock
          key={category}
          category={category}
          employeeId={employeeId}
          states={states}
          selectedPartId={selectedPartId}
          expanded={open === category}
          onToggle={() => setOpen((current) => (current === category ? "" : category))}
        />
      ))}
    </aside>
  );
}

function CategoryBlock({
  category,
  employeeId,
  states,
  selectedPartId,
  expanded,
  onToggle
}: {
  category: CardCategory;
  employeeId: string;
  states: ReviewState[];
  selectedPartId?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const items = parts.filter((part) => part.category === category);
  if (!items.length) return null;
  const done = items.filter((part) => {
    const state = states.find((item) => item.partId === part.id);
    return state && state.status !== "inbox";
  }).length;
  return (
    <section className={`mat-cat${expanded ? " is-open" : ""}`}>
      <button className="mat-toggle" type="button" onClick={onToggle} aria-expanded={expanded}>
        <span>
          {categoryLabels[category].zh}
          <small>
            {done}/{items.length}
          </small>
        </span>
        <b aria-hidden="true">{expanded ? "−" : "+"}</b>
      </button>
      {expanded ? (
        <ul>
          {items.map((part) => {
            const state = states.find((item) => item.partId === part.id);
            const status = state ? partStatusLabel(state) : "new";
            const lesson = lessonForPart(part.id);
            const href = lesson
              ? `/learn/${employeeId}/part/${firstOpenPart(lesson, states)}?lesson=${lesson.id}`
              : `/learn/${employeeId}/part/${part.id}`;
            return (
              <li key={part.id}>
                <Link
                  className={`mat-item is-${status}${selectedPartId === part.id ? " is-on" : ""}`}
                  to={href}
                >
                  <span className="num">{part.callout}</span>
                  <span>{part.nameZh}</span>
                  <small>{STATUS_ZH[status]}</small>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
