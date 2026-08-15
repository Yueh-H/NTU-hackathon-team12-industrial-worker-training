import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { parts, workerById } from "../data/catalog";
import { firstOpenPart, lessonForPart, nodeState, unitProgress, units } from "../engine/path";
import { reviewStageHint, reviewStageOf } from "../engine/reviewEngine";
import { REVIEW_STAGE_ZH } from "../lib/copy";
import type { CardCategory } from "../types";
import { useShop } from "../store";

export function LearnHome() {
  const { employeeId = "" } = useParams();
  const worker = workerById(employeeId);
  const { states } = useShop();
  const [openUnit, setOpenUnit] = useState<CardCategory | "review" | "">("review");
  if (!worker) return <Navigate to="/learn" replace />;
  const mine = states.filter((state) => state.employeeId === worker.id);
  const reviewing = parts.filter((part) => {
    const state = mine.find((item) => item.partId === part.id);
    return Boolean(state && state.status !== "inbox");
  });

  return (
    <section className="path-stage">
      <article className="path-unit is-review" id="unit-review">
        <button
          className="path-unit-banner review-banner"
          type="button"
          aria-expanded={openUnit === "review"}
          onClick={() => setOpenUnit((current) => (current === "review" ? "" : "review"))}
        >
          <span>
            <small>複習夾 · {reviewing.length} 張</small>
            <strong>學過一次，依 D+1／3／7／30 再練</strong>
          </span>
          <b aria-hidden="true">{openUnit === "review" ? "−" : "+"}</b>
        </button>
        {openUnit === "review" ? (
          reviewing.length ? (
            <ol className="path-nodes">
              {reviewing.map((part, index) => {
                const state = mine.find((item) => item.partId === part.id);
                if (!state) return null;
                const stage = reviewStageOf(state);
                const lesson = lessonForPart(part.id);
                return (
                  <li key={part.id} className={`path-row is-${stage} shift-${index % 3}`}>
                    <Link
                      className={`path-node is-${stage}`}
                      to={`/learn/${worker.id}/part/${part.id}${lesson ? `?lesson=${lesson.id}` : ""}`}
                    >
                      <span className="path-glyph">{REVIEW_STAGE_ZH[stage]}</span>
                      <span className="path-label">{part.nameZh}</span>
                      <small>{reviewStageHint(state)}</small>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="fine review-empty">先學一張卡，它就會出現在這個夾，顏色代表下一次複習站。</p>
          )
        ) : null}
      </article>
      <header className="path-head">
        <p className="eyebrow">{worker.name} · {worker.station}</p>
        <h1>選一站開始學</h1>
        <p>點關卡標題展開或收合。每一顆都可以直接進去學。</p>
        <Link className="btn dark path-rank-btn" to={`/learn/ranking?from=${worker.id}`}>
          全員排行榜
        </Link>
      </header>
      {units.map((unit, unitIndex) => {
        const progress = unitProgress(unit, mine);
        const expanded = openUnit === unit.id;
        return (
          <article key={unit.id} className="path-unit" id={`unit-${unit.id}`}>
            <button
              className="path-unit-banner"
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpenUnit((current) => (current === unit.id ? "" : unit.id))}
            >
              <span>
                <small>
                  第 {unitIndex + 1} 關 · {progress.done}/{progress.total}
                </small>
                <strong>{unit.title}</strong>
              </span>
              <b aria-hidden="true">{expanded ? "−" : "+"}</b>
            </button>
            {expanded ? (
              <ol className="path-nodes">
                {unit.lessons.map((lesson, lessonIndex) => {
                  const status = nodeState(lesson, mine);
                  const href = `/learn/${worker.id}/part/${firstOpenPart(lesson, mine)}?lesson=${lesson.id}`;
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
