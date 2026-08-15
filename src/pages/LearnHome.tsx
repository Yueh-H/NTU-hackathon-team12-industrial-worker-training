import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { workerById } from "../data/catalog";
import { firstOpenPart, nodeState, unitProgress, units } from "../engine/path";
import type { CardCategory } from "../types";
import { useShop } from "../store";

export function LearnHome() {
  const { employeeId = "" } = useParams();
  const worker = workerById(employeeId);
  const { states } = useShop();
  const [openUnit, setOpenUnit] = useState<CardCategory | "">(units[0]?.id ?? "struktur");
  if (!worker) return <Navigate to="/learn" replace />;
  const mine = states.filter((state) => state.employeeId === worker.id);

  return (
    <section className="path-stage">
      <header className="path-head">
        <p className="eyebrow">{worker.name} · {worker.station}</p>
        <h1>選一站開始學</h1>
        <p>點關卡標題展開或收合。每一顆都可以直接進去學。</p>
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
