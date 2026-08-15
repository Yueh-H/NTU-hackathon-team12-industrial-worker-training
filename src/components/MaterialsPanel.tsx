import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StarPair } from "./StarPair";
import { categoryLabels, parts } from "../data/catalog";
import {
  cardStars,
  lessonForPart,
  spokenSet,
  UNIT_ORDER,
  unitProgress,
  unitStars,
  units
} from "../engine/path";
import { REVIEW_FOLDERS, reviewStageOf, splitReviewInbox } from "../engine/reviewEngine";
import { REVIEW_STAGE_ID, REVIEW_STAGE_ZH, reviewStageHintBi, t, type Bi } from "../lib/copy";
import { BiText } from "./BiText";
import { hasCompletedZhSpeech } from "../lib/speech";
import type { Attempt, CardCategory, Part, ReviewState, TrainingSet } from "../types";

export function MaterialsPanel({
  employeeId,
  setId,
  training,
  states,
  attempts,
  selectedPartId
}: {
  employeeId: string;
  setId: string;
  training: TrainingSet;
  states: ReviewState[];
  attempts: Attempt[];
  selectedPartId?: string;
}) {
  const selected = parts.find((part) => part.id === selectedPartId);
  const selectedCategory = selected?.category;
  const [open, setOpen] = useState<CardCategory | "">(selectedCategory ?? "struktur");
  const [todayOpen, setTodayOpen] = useState(true);
  const [learnedOpen, setLearnedOpen] = useState(false);

  useEffect(() => {
    if (selectedCategory) setOpen(selectedCategory);
  }, [selectedCategory]);

  if (!training.active) {
    return (
      <aside className="materials-panel">
        <p className="eyebrow">{t.materials.zh} / {t.materials.idn}</p>
        <h2>
          {training.titleZh}
          <span className="bi-idn" lang="id">{training.titleId}</span>
        </h2>
        <BiText as="p" className="fine" zh={training.summaryZh} idn={training.summaryId} />
      </aside>
    );
  }

  const visible = parts.filter((part) => part.setId === setId);
  const inbox = splitReviewInbox(visible, states);
  return (
    <aside className="materials-panel">
      <p className="eyebrow">{t.materials.zh} / {t.materials.idn}</p>
      <h2>
        {training.titleZh}
        <span className="bi-idn" lang="id">{training.titleId}</span>
      </h2>
      <BiText as="p" className="fine" {...(inbox.today.length ? t.todayDueN(inbox.today.length) : t.noDueToday)} />
      <ReviewFolder
        employeeId={employeeId}
        title={t.todayReview}
        tone="today"
        empty={t.noToday}
        items={inbox.today}
        attempts={attempts}
        selectedPartId={selectedPartId}
        expanded={todayOpen}
        onToggle={() => setTodayOpen((value) => !value)}
      />
      <ReviewFolder
        employeeId={employeeId}
        title={t.learned}
        tone="learned"
        empty={t.noLearned}
        items={inbox.learned}
        attempts={attempts}
        selectedPartId={selectedPartId}
        expanded={learnedOpen}
        onToggle={() => setLearnedOpen((value) => !value)}
      />
      {UNIT_ORDER.map((category) => (
        <CategoryBlock
          key={category}
          category={category}
          employeeId={employeeId}
          states={states}
          attempts={attempts}
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
  attempts,
  selectedPartId,
  expanded,
  onToggle
}: {
  category: CardCategory;
  employeeId: string;
  states: ReviewState[];
  attempts: Attempt[];
  selectedPartId?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const items = parts.filter((part) => part.category === category);
  if (!items.length) return null;
  const unit = units.find((item) => item.id === category);
  const progress = unit ? unitProgress(unit, attempts, employeeId) : { done: 0, total: items.length };
  const spoken = spokenSet(employeeId, hasCompletedZhSpeech);
  const stars = unit ? unitStars(unit, attempts, employeeId, spoken) : 0;
  return (
    <section className={`mat-cat${expanded ? " is-open" : ""}`}>
      <button className="mat-toggle" type="button" onClick={onToggle} aria-expanded={expanded}>
        <span>
          {categoryLabels[category].zh}
          <span className="bi-idn" lang="id">{categoryLabels[category].idn}</span>
          <small>
            {progress.done}/{progress.total}
          </small>
        </span>
        <span className="banner-end">
          <StarPair count={stars} />
          <b aria-hidden="true">{expanded ? "−" : "+"}</b>
        </span>
      </button>
      {expanded ? (
        <ul>
          {items.map((part) => {
            const state = states.find((item) => item.partId === part.id);
            const stage = state ? reviewStageOf(state) : "inbox";
            const lesson = lessonForPart(part.id);
            const href = `/learn/${employeeId}/part/${part.id}${lesson ? `?lesson=${lesson.id}` : ""}`;
            const partStars = cardStars(part.id, attempts, employeeId, spoken.has(part.id));
            return (
              <li key={part.id}>
                <Link
                  className={`mat-item is-${stage}${selectedPartId === part.id ? " is-on" : ""}`}
                  to={href}
                >
                  <span className="num">{part.callout}</span>
                  <span>
                    {part.nameZh}
                    <span className="bi-idn" lang="id">{part.nameId}</span>
                    {" "}
                    <StarPair count={partStars} />
                  </span>
                  <small>
                    {state ? reviewStageHintBi(state).zh : t.speechIdleStatus.zh}
                    <span className="bi-idn" lang="id">
                      {state ? reviewStageHintBi(state).idn : t.speechIdleStatus.idn}
                    </span>
                  </small>
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
  title,
  tone,
  empty,
  items,
  attempts,
  selectedPartId,
  expanded,
  onToggle
}: {
  employeeId: string;
  title: Bi;
  tone: "today" | "learned";
  empty: Bi;
  items: Array<{ item: Part; state: ReviewState }>;
  attempts: Attempt[];
  selectedPartId?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <section className={`mat-cat review-folder is-${tone}${expanded ? " is-open" : ""}`}>
      <button className="mat-toggle" type="button" onClick={onToggle} aria-expanded={expanded}>
        <span>
          {title.zh}
          <span className="bi-idn" lang="id">{title.idn}</span>
          <small>{t.cardsCount(items.length).zh} / {t.cardsCount(items.length).idn}</small>
        </span>
        <b aria-hidden="true">{expanded ? "−" : "+"}</b>
      </button>
      {expanded ? (
        items.length ? (
          <>
            {tone === "today" ? (
              <p className="review-legend" aria-hidden="true">
                {REVIEW_FOLDERS.filter((stage) => stage !== "mastered").map((stage) => (
                  <span key={stage}>
                    <i className={`heat-swatch is-${stage}`} />
                    {REVIEW_STAGE_ZH[stage]} / {REVIEW_STAGE_ID[stage]}
                  </span>
                ))}
              </p>
            ) : null}
            <ul>
              {items.map(({ item, state }) => {
                const stage = reviewStageOf(state);
                const lesson = lessonForPart(item.id);
                const partStars = cardStars(
                  item.id,
                  attempts,
                  employeeId,
                  hasCompletedZhSpeech(employeeId, item.id)
                );
                return (
                  <li key={item.id}>
                    <Link
                      className={`mat-item is-${stage}${selectedPartId === item.id ? " is-on" : ""}`}
                      to={`/learn/${employeeId}/part/${item.id}${lesson ? `?lesson=${lesson.id}` : ""}`}
                    >
                      <span className="num">{item.callout}</span>
                      <span>
                        {item.nameZh}
                        <span className="bi-idn" lang="id">{item.nameId}</span>
                        {" "}
                        <StarPair count={partStars} />
                      </span>
                      <small>
                        {reviewStageHintBi(state).zh}
                        <span className="bi-idn" lang="id">{reviewStageHintBi(state).idn}</span>
                      </small>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <BiText as="p" className="fine review-empty" {...empty} />
        )
      ) : null}
    </section>
  );
}
