import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { StarPair } from "../components/StarPair";
import { parts, workerById } from "../data/catalog";
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
import { reviewStageHint, reviewStageOf, splitReviewInbox } from "../engine/reviewEngine";
import { REVIEW_STAGE_ZH } from "../lib/copy";
import { hasCompletedZhSpeech } from "../lib/speech";
import type { CardCategory } from "../types";
import type { Attempt, Part, ReviewState } from "../types";
import { useShop } from "../store";

type OpenKey = CardCategory | "today" | "learned" | "";

export function LearnHome() {
  const { employeeId = "" } = useParams();
  const worker = workerById(employeeId);
  const { states, attempts } = useShop();
  const [openUnit, setOpenUnit] = useState<OpenKey>("today");
  if (!worker) return <Navigate to="/learn" replace />;
  const mine = states.filter((state) => state.employeeId === worker.id);
  const mineAttempts = attempts.filter((attempt) => attempt.employeeId === worker.id);
  const spoken = spokenSet(worker.id, hasCompletedZhSpeech);
  const inbox = splitReviewInbox(parts, mine);
  const defaultOpen: OpenKey = inbox.today.length ? "today" : inbox.learned.length ? "learned" : units[0]?.id ?? "";
  const expanded = openUnit || defaultOpen;

  return (
    <section className="path-stage">
      {inbox.today.length ? (
        <p className="review-alert">今天有 {inbox.today.length} 張要複習，先清這個收件夾。</p>
      ) : null}
      <ReviewPathFolder
        id="today"
        title="今天要複習"
        detail="到期或逾期，系統會自動放進來提醒"
        tone="today"
        items={inbox.today}
        employeeId={worker.id}
        attempts={mineAttempts}
        expanded={expanded === "today"}
        onToggle={() => setOpenUnit((current) => (current === "today" ? "" : "today"))}
      />
      <ReviewPathFolder
        id="learned"
        title="已學習過"
        detail="學過一次、還沒到下次複習日"
        tone="learned"
        items={inbox.learned}
        employeeId={worker.id}
        attempts={mineAttempts}
        expanded={expanded === "learned"}
        onToggle={() => setOpenUnit((current) => (current === "learned" ? "" : "learned"))}
      />
      <header className="path-head">
        <p className="eyebrow">{worker.name} · {worker.station}</p>
        <h1>選一站開始學</h1>
        <p>每一張卡：朗讀 1 星，答對 2 星。這一關全部答對，關卡才會變成 2 顆星。</p>
        <Link className="btn dark path-rank-btn" to={`/learn/ranking?from=${worker.id}`}>
          全員排行榜
        </Link>
      </header>
      {units.map((unit, unitIndex) => {
        const progress = unitProgress(unit, mineAttempts, worker.id);
        const stars = unitStars(unit, mineAttempts, worker.id, spoken);
        const isOpen = expanded === unit.id;
        return (
          <article key={unit.id} className={`path-unit${stars === 2 ? " is-clear" : ""}`} id={`unit-${unit.id}`}>
            <button
              className="path-unit-banner"
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenUnit((current) => (current === unit.id ? "" : unit.id))}
            >
              <span>
                <small>
                  第 {unitIndex + 1} 關 · {progress.done}/{progress.total}
                  {stars === 2 ? " · 已過關" : ""}
                </small>
                <strong>{unit.title}</strong>
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
                  return (
                    <li key={lesson.id} className={`path-row is-${status} shift-${lessonIndex % 3}`}>
                      <Link className="path-node" to={href}>
                        <span className="path-glyph">{status === "done" ? "✓" : lessonIndex + 1}</span>
                        <span className="path-label">{lesson.title}</span>
                        <small>{lesson.partIds.length} 題</small>
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
  title: string;
  detail: string;
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
            {title} · {items.length} 張
          </small>
          <strong>{detail}</strong>
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
              return (
                <li key={item.id} className={`path-row is-${stage} shift-${index % 3}`}>
                  <Link
                    className={`path-node is-${stage}`}
                    to={`/learn/${employeeId}/part/${item.id}${lesson ? `?lesson=${lesson.id}` : ""}`}
                  >
                    <span className="path-glyph">{REVIEW_STAGE_ZH[stage]}</span>
                    <span className="path-label">{item.nameZh}</span>
                    <StarPair count={stars} />
                    <small>{reviewStageHint(state)}</small>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="fine review-empty">
            {tone === "today" ? "今天沒有到期的複習。" : "學過一次、還沒到期的卡片會放這裡。"}
          </p>
        )
      ) : null}
    </article>
  );
}
