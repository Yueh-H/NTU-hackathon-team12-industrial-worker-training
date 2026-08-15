import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { BiText, biLine } from "../components/BiText";
import { StarPair } from "../components/StarPair";
import { categoryLabels, parts, workerById } from "../data/catalog";
import {
  cardStars,
  firstOpenPart,
  lessonForPart,
  nodeState,
  spokenSet,
  unitProgress,
  unitStars,
  units
} from "../engine/path";
import { reviewStageOf, splitReviewInbox } from "../engine/reviewEngine";
import { REVIEW_STAGE_ZH, reviewStageHintBi, t } from "../lib/copy";
import { hasCompletedZhSpeech } from "../lib/speech";
import type { CardCategory } from "../types";
import type { Attempt, Part, ReviewState } from "../types";
import { useShop } from "../store";

type OpenKey = CardCategory | "today" | "learned";

function toggleKey(current: Set<OpenKey>, key: OpenKey): Set<OpenKey> {
  const next = new Set(current);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export function LearnHome() {
  const { employeeId = "" } = useParams();
  const worker = workerById(employeeId);
  const { states, attempts, workOrders } = useShop();
  const [openKeys, setOpenKeys] = useState<Set<OpenKey>>(() => new Set());
  if (!worker) return <Navigate to="/learn" replace />;
  const mine = states.filter((state) => state.employeeId === worker.id);
  const mineAttempts = attempts.filter((attempt) => attempt.employeeId === worker.id);
  const spoken = spokenSet(worker.id, hasCompletedZhSpeech);
  const inbox = splitReviewInbox(parts, mine);

  return (
    <section className="path-stage">
      {inbox.today.length ? (
        <BiText as="p" className="review-alert" {...t.todayAlert(inbox.today.length)} />
      ) : null}
      <div className="path-trio">
        <ReviewPathFolder
          id="today"
          title={t.todayReview}
          detail={t.todayReviewDetail}
          tone="today"
          items={inbox.today}
          employeeId={worker.id}
          attempts={mineAttempts}
          expanded={openKeys.has("today")}
          onToggle={() => setOpenKeys((current) => toggleKey(current, "today"))}
        />
        <ReviewPathFolder
          id="learned"
          title={t.learned}
          detail={t.learnedDetail}
          tone="learned"
          items={inbox.learned}
          employeeId={worker.id}
          attempts={mineAttempts}
          expanded={openKeys.has("learned")}
          onToggle={() => setOpenKeys((current) => toggleKey(current, "learned"))}
        />
        <Link className="path-unit is-review path-rank-card" to={`/learn/ranking?from=${worker.id}`}>
          <span className="path-unit-banner review-banner is-rank">
            <span>
              <small>{biLine(t.ranking)}</small>
              <strong>{t.rankingSee.zh}</strong>
              <span className="bi-idn" lang="id">{t.rankingSee.idn}</span>
            </span>
            <b aria-hidden="true">→</b>
          </span>
        </Link>
      </div>
      <header className="path-head">
        <p className="eyebrow">{worker.name} · {worker.station}</p>
        <BiText as="h1" {...t.pickStation} />
        <BiText as="p" {...t.starRule} />
        {workOrders.length ? (
          <div className="boss-order-list">
            <p className="eyebrow">{biLine(t.bossOrders)}</p>
            {workOrders.map((workOrder) => (
              <Link key={workOrder.id} className="btn ghost wide" to={`/learn/workorder/${workOrder.id}?employee=${worker.id}`}>
                {workOrder.docNo ? `${workOrder.docNo} · ` : ""}
                {workOrder.title}
              </Link>
            ))}
          </div>
        ) : null}
      </header>
      {units.map((unit, unitIndex) => {
        const progress = unitProgress(unit, mineAttempts, worker.id);
        const stars = unitStars(unit, mineAttempts, worker.id, spoken);
        const isOpen = openKeys.has(unit.id);
        const labels = categoryLabels[unit.id];
        return (
          <article key={unit.id} className={`path-unit${stars === 2 ? " is-clear" : ""}`} id={`unit-${unit.id}`}>
            <button
              className="path-unit-banner"
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenKeys((current) => toggleKey(current, unit.id))}
            >
              <span>
                <small>
                  {t.unitN(unitIndex + 1).zh} · {t.unitN(unitIndex + 1).idn} · {progress.done}/{progress.total}
                  {stars === 2 ? ` · ${t.cleared.zh} / ${t.cleared.idn}` : ""}
                </small>
                <strong>{labels.zh}</strong>
                <span className="bi-idn" lang="id">{labels.idn}</span>
              </span>
              <span className="banner-end">
                <StarPair count={stars} />
                <b aria-hidden="true">{isOpen ? "−" : "+"}</b>
              </span>
            </button>
            {isOpen ? (
              <ol className="path-nodes">
                {unit.lessons.map((lesson, lessonIndex) => {
                  const status = nodeState(lesson, mineAttempts, worker.id);
                  const href = `/learn/${worker.id}/part/${firstOpenPart(lesson, mineAttempts, worker.id)}?lesson=${lesson.id}`;
                  const label = t.checkpoint(lessonIndex + 1);
                  const q = t.questions(lesson.partIds.length);
                  return (
                    <li key={lesson.id} className={`path-row is-${status} shift-${lessonIndex % 3}`}>
                      <Link className="path-node" to={href}>
                        <span className="path-glyph">{status === "done" ? "✓" : lessonIndex + 1}</span>
                        <span className="path-label">{label.zh}</span>
                        <small lang="id">{label.idn}</small>
                        <small>{q.zh} / {q.idn}</small>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

function ReviewPathFolder({
  id,
  title,
  detail,
  tone,
  items,
  employeeId,
  attempts,
  expanded,
  onToggle
}: {
  id: string;
  title: { zh: string; idn: string };
  detail: { zh: string; idn: string };
  tone: "today" | "learned";
  items: Array<{ item: Part; state: ReviewState }>;
  employeeId: string;
  attempts: Attempt[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className={`path-unit is-review is-${tone}`} id={`unit-${id}`}>
      <button
        className={`path-unit-banner review-banner is-${tone}`}
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span>
          <small>
            {title.zh} / {title.idn} · {t.cardsCount(items.length).zh}
          </small>
          <strong>{detail.zh}</strong>
          <span className="bi-idn" lang="id">{detail.idn}</span>
        </span>
        <b aria-hidden="true">{expanded ? "−" : "+"}</b>
      </button>
      {expanded ? (
        items.length ? (
          <ol className="path-nodes">
            {items.map(({ item, state }, index) => {
              const stage = reviewStageOf(state);
              const lesson = lessonForPart(item.id);
              const stars = cardStars(item.id, attempts, employeeId, hasCompletedZhSpeech(employeeId, item.id));
              const hint = reviewStageHintBi(state);
              return (
                <li key={item.id} className={`path-row is-${stage} shift-${index % 3}`}>
                  <Link
                    className={`path-node is-${stage}`}
                    to={`/learn/${employeeId}/part/${item.id}${lesson ? `?lesson=${lesson.id}` : ""}`}
                  >
                    <span className="path-glyph">{REVIEW_STAGE_ZH[stage]}</span>
                    <span className="path-label">{item.nameZh}</span>
                    <small lang="id">{item.nameId}</small>
                    <StarPair count={stars} />
                    <small>{hint.zh}</small>
                    <small lang="id">{hint.idn}</small>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <BiText as="p" className="fine review-empty" {...(tone === "today" ? t.noToday : t.noLearned)} />
        )
      ) : null}
    </article>
  );
}
