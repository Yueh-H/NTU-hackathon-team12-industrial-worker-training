import { Link, Navigate, useParams } from "react-router-dom";
import { parts, workerById } from "../data/catalog";
import { nextDueLabel, partStatusLabel, snapshotFor } from "../engine/dashboard";
import { formatDateTime, percent } from "../lib/format";
import { useShop } from "../store";

const STATUS_ZH = {
  new: "未學",
  due: "今日應複習",
  overdue: "逾期",
  learning: "學習中",
  mastered: "已掌握"
};

export function AdminEmployee() {
  const { employeeId = "" } = useParams();
  const worker = workerById(employeeId);
  const { states, attempts, attemptsFor, stateFor } = useShop();
  if (!worker) return <Navigate to="/admin" replace />;
  const snap = snapshotFor(worker, states, attempts);
  const recent = [...attemptsFor(worker.id)].sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 8);

  return (
    <main className="page admin">
      <header className="page-head">
        <p className="eyebrow">{worker.station}</p>
        <h1>{worker.name}</h1>
        <p>
          正確率 {percent(snap.accuracy)} · 測驗 {snap.quizCount} 次 · 最後 {formatDateTime(snap.lastAt, "zh-TW")}
        </p>
      </header>
      <div className="part-grid">
        {parts.map((part) => {
          const state = stateFor(worker.id, part.id);
          const status = partStatusLabel(state);
          return (
            <article key={part.id} className={`part-chip is-${status}`}>
              <span className="num">{part.callout}</span>
              <strong>{part.nameZh}</strong>
              <small>
                {STATUS_ZH[status]}
                {nextDueLabel(state) ? ` · 下次 ${nextDueLabel(state)}` : ""}
              </small>
            </article>
          );
        })}
      </div>
      <section>
        <h2>最近作答</h2>
        <ul className="attempt-list">
          {recent.map((attempt) => {
            const part = parts.find((item) => item.id === attempt.partId);
            return (
              <li key={attempt.id}>
                <strong>{part?.nameZh ?? attempt.partId}</strong>
                <span>
                  {attempt.quizCorrect === null ? "自評" : attempt.quizCorrect ? "答對" : "答錯"} ·{" "}
                  {attempt.rating || "—"} · {formatDateTime(attempt.completedAt, "zh-TW")}
                </span>
              </li>
            );
          })}
          {!recent.length ? <li>尚無作答。</li> : null}
        </ul>
      </section>
      <Link className="text-btn" to="/admin">
        回總表
      </Link>
    </main>
  );
}
