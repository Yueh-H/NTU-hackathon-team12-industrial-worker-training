import { Link, Navigate, useParams } from "react-router-dom";
import { workerById } from "../data/catalog";
import { firstOpenPart, nodeState, unitProgress, units } from "../engine/path";
import { useShop } from "../store";

export function LearnHome() {
  const { employeeId = "" } = useParams();
  const worker = workerById(employeeId);
  const { states } = useShop();
  if (!worker) return <Navigate to="/learn" replace />;
  const mine = states.filter((state) => state.employeeId === worker.id);

  return (
    <section className="path-stage">
      <header className="path-head">
        <p className="eyebrow">{worker.name} · {worker.station}</p>
        <h1>選一站開始學</h1>
        <p>每一顆都是檢核站，可以直接點要學的內容，不必依序解鎖。</p>
      </header>
      {units.map((unit, unitIndex) => {
        const progress = unitProgress(unit, mine);
        return (
          <article key={unit.id} className="path-unit" id={`unit-${unit.id}`}>
            <div className="path-unit-banner">
              <small>
                第 {unitIndex + 1} 關 · {progress.done}/{progress.total}
              </small>
              <strong>{unit.title}</strong>
            </div>
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
          </article>
        );
      })}
    </section>
  );
}
