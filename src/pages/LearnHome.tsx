import { Link, Navigate, useParams } from "react-router-dom";
import { trainingSet, workerById, workers } from "../data/catalog";
import { rankSnapshots, snapshotFor } from "../engine/dashboard";
import { firstOpenPart, nodeState, unitProgress, units } from "../engine/path";
import { relativeTime } from "../lib/format";
import { useShop } from "../store";

export function LearnHome() {
  const { employeeId = "" } = useParams();
  const worker = workerById(employeeId);
  const { states, attempts } = useShop();
  if (!worker) return <Navigate to="/learn" replace />;
  const mine = states.filter((state) => state.employeeId === worker.id);
  const snap = snapshotFor(worker, mine, attempts);
  const ranking = rankSnapshots(workers.map((item) => snapshotFor(item, states, attempts)));
  const rank = ranking.findIndex((item) => item.employee.id === worker.id) + 1;

  return (
    <section className="path-stage">
      <header className="path-head">
        <p className="eyebrow">{worker.name} · {worker.station}</p>
        <h1>{trainingSet.titleZh}</h1>
        <p>每一顆是一個檢核站。過關後才會打開下一站。</p>
        <Link className="btn ghost" to={`/learn/${worker.id}/sheet`}>
          打開完整工單圖
        </Link>
      </header>
      <section className="info-card">
        <h2>你的學習動力</h2>
        <p>
          <strong>{snap.learningScore} 分</strong> · 本課程第 {rank} 名 · {snap.motivationLabel}
        </p>
        <p>{snap.motivationHint}</p>
        <p className="fine">
          已開始 {snap.viewedCount}/{snap.assigned} 張 · 最近{relativeTime(snap.lastAt, "zh")}
        </p>
        <Link className="btn ghost" to="/learn/ranking">
          查看全員排行榜
        </Link>
      </section>
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
        );
      })}
    </section>
  );
}
