import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categoryLabels, parts } from "../data/catalog";
import { lessonForPart, UNIT_ORDER } from "../engine/path";
import { REVIEW_FOLDERS, reviewStageHint, reviewStageOf } from "../engine/reviewEngine";
import { REVIEW_STAGE_ZH } from "../lib/copy";
import type { CardCategory, Part, ReviewState, TrainingSet } from "../types";

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
  const selected = parts.find((part) => part.id === selectedPartId);
  const selectedCategory = selected?.category;
  const [open, setOpen] = useState<CardCategory | "">(selectedCategory ?? "struktur");
  const [reviewOpen, setReviewOpen] = useState(true);

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
  const reviewing = visible
    .map((part) => ({ part, state: states.find((item) => item.partId === part.id) }))
    .filter((item): item is { part: Part; state: ReviewState } => Boolean(item.state && item.state.status !== "inbox"));
  return (
    <aside className="materials-panel">
      <p className="eyebrow">材料</p>
      <h2>{training.titleZh}</h2>
      <p className="fine">{visible.length} 項 · 學過的進上方複習夾，顏色＝下一站</p>
      <ReviewFolder
        employeeId={employeeId}
        items={reviewing}
        selectedPartId={selectedPartId}
        expanded={reviewOpen}
        onToggle={() => setReviewOpen((value) => !value)}
      />
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
            const stage = state ? reviewStageOf(state) : "inbox";
            const lesson = lessonForPart(part.id);
            const href = `/learn/${employeeId}/part/${part.id}${lesson ? `?lesson=${lesson.id}` : ""}`;
            return (
              <li key={part.id}>
                <Link
                  className={`mat-item is-${stage}${selectedPartId === part.id ? " is-on" : ""}`}
                  to={href}
                >
                  <span className="num">{part.callout}</span>
                  <span>{part.nameZh}</span>
                  <small>{state ? reviewStageHint(state) : "未學"}</small>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function ReviewFolder({
  employeeId,
  items,
  selectedPartId,
  expanded,
  onToggle
}: {
  employeeId: string;
  items: { part: Part; state: ReviewState }[];
  selectedPartId?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <section className={`mat-cat review-folder${expanded ? " is-open" : ""}`}>
      <button className="mat-toggle" type="button" onClick={onToggle} aria-expanded={expanded}>
        <span>
          複習夾
          <small>{items.length} 張</small>
        </span>
        <b aria-hidden="true">{expanded ? "−" : "+"}</b>
      </button>
      {expanded ? (
        items.length ? (
          <>
            <p className="review-legend" aria-hidden="true">
              {REVIEW_FOLDERS.filter((stage) => stage !== "mastered" && stage !== "rescue").map((stage) => (
                <span key={stage}>
                  <i className={`heat-swatch is-${stage}`} />
                  {REVIEW_STAGE_ZH[stage]}
                </span>
              ))}
              <span>
                <i className="heat-swatch is-rescue" />
                救援
              </span>
            </p>
            {REVIEW_FOLDERS.map((stage) => {
              const group = items.filter((item) => reviewStageOf(item.state) === stage);
              if (!group.length) return null;
              return (
                <div key={stage} className="review-group">
                  <h3>
                    {REVIEW_STAGE_ZH[stage]}
                    <small>{group.length}</small>
                  </h3>
                  <ul>
                    {group.map(({ part, state }) => {
                      const lesson = lessonForPart(part.id);
                      return (
                        <li key={part.id}>
                          <Link
                            className={`mat-item is-${stage}${selectedPartId === part.id ? " is-on" : ""}`}
                            to={`/learn/${employeeId}/part/${part.id}${lesson ? `?lesson=${lesson.id}` : ""}`}
                          >
                            <span className="num">{part.callout}</span>
                            <span>{part.nameZh}</span>
                            <small>{reviewStageHint(state)}</small>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </>
        ) : (
          <p className="fine review-empty">學過一次的卡片會進這裡，依 D+1／3／7／30 分夾複習。</p>
        )
      ) : null}
    </section>
  );
}
