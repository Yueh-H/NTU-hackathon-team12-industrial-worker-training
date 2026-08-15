import { Link, Navigate, useParams } from "react-router-dom";
import { WorkOrderSidebar } from "../components/WorkOrderSidebar";
import { workerById } from "../data/catalog";
import { firstOpenPart, nodeState, units } from "../engine/path";
import { useShop } from "../store";

export function LearnHome() {
  const { employeeId = "" } = useParams();
  const worker = workerById(employeeId);
  const { states } = useShop();
  if (!worker) return <Navigate to="/learn" replace />;
  const mine = states.filter((state) => state.employeeId === worker.id);

  return (
    <div className="learn-shell">
      <WorkOrderSidebar employeeId={worker.id} units={units} states={mine} workerName={worker.name} />
      <section className="path-stage">
        <header className="path-head">
          <p className="eyebrow">學習路徑</p>
          <h1>像過關一樣把工單學完</h1>
          <p>右邊每一顆是一個檢核站。過關後才會打開下一站。</p>
        </header>
        {units.map((unit, unitIndex) => (
          <article key={unit.id} className="path-unit" id={`unit-${unit.id}`}>
            <div className="path-unit-banner">
              <small>第 {unitIndex + 1} 關</small>
              <strong>{unit.title}</strong>
            </div>
            <ol className="path-nodes">
              {unit.lessons.map((lesson, lessonIndex) => {
                const status = nodeState(lesson, mine);
                const href =
                  status === "locked"
                    ? undefined
                    : `/learn/${worker.id}/part/${firstOpenPart(lesson, mine)}?lesson=${lesson.id}`;
                return (
                  <li key={lesson.id} className={`path-row is-${status} shift-${lessonIndex % 3}`}>
                    {href ? (
                      <Link className="path-node" to={href}>
                        <span className="path-glyph">{status === "done" ? "✓" : lessonIndex + 1}</span>
                        <span className="path-label">{lesson.title}</span>
                        <small>{lesson.partIds.length} 題</small>
                      </Link>
                    ) : (
                      <div className="path-node">
                        <span className="path-glyph">鎖</span>
                        <span className="path-label">{lesson.title}</span>
                        <small>先過上一站</small>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </section>
    </div>
  );
}
