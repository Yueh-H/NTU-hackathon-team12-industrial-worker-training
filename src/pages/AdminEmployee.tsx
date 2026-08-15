import { Navigate, useParams } from "react-router-dom";
import { categoryLabels, parts, partsByCategory, workerById } from "../data/catalog";
import { nextDueLabel, partStatusLabel, snapshotFor } from "../engine/dashboard";
import { RATING_ZH, STATUS_ID, STATUS_ZH } from "../lib/copy";
import { formatDateTime, percent } from "../lib/format";
import { usePageTitle } from "../lib/pageTitle";
import type { CardCategory } from "../types";
import { useShop } from "../store";

const CARD_CATEGORIES = Object.keys(categoryLabels) as CardCategory[];

export function AdminEmployee() {
  const { employeeId = "" } = useParams();
  const worker = workerById(employeeId);
  const { states, attempts, attemptsFor, stateFor } = useShop();
  usePageTitle(worker ? `${worker.name} · 主管檢核` : "主管檢核");
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
      <div className="stat-row">
        <div>
          <small>已開始</small>
          <strong>
            {snap.started}/{snap.assigned}
          </strong>
        </div>
        <div>
          <small>已掌握</small>
          <strong>{snap.mastered}</strong>
        </div>
        <div>
          <small>今日 / 逾期</small>
          <strong className={snap.overdue ? "warn" : ""}>
            {snap.dueToday} / {snap.overdue}
          </strong>
        </div>
        <div>
          <small>學習積分</small>
          <strong>{snap.learningScore}</strong>
        </div>
      </div>
      <section className="info-card">
        <h2>學習動機與觀看情況</h2>
        <p>
          <strong>{snap.learningScore} 分</strong> · {snap.motivationLabel} · {snap.viewingLabel}
        </p>
        <p>{snap.motivationHint}</p>
        <p>
          弱項：{snap.weakParts.map((part) => part.nameZh).join("、") || "尚無明顯弱項"}
        </p>
        <p className="fine">
          依學習活動推算：已開始 {snap.viewedCount}/{snap.assigned} 張；不代表實際停留時間。
        </p>
      </section>
      {CARD_CATEGORIES.map((category) => {
        const group = partsByCategory(category);
        return (
          <section key={category} className="admin-cat">
            <h2>
              {categoryLabels[category].zh}
              <small>{group.length} 張</small>
            </h2>
            <div className="part-grid">
              {group.map((part) => {
                const state = stateFor(worker.id, part.id);
                const status = partStatusLabel(state);
                return (
                  <article key={part.id} className={`part-chip is-${status}`}>
                    <span className="num">{part.callout}</span>
                    <strong>
                      {part.nameZh}
                      <span className="bi-idn" lang="id">{part.nameId}</span>
                    </strong>
                    <small>
                      {STATUS_ZH[status]} / {STATUS_ID[status]}
                      {nextDueLabel(state) ? ` · 下次 ${nextDueLabel(state)}` : ""}
                    </small>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
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
                  {RATING_ZH[attempt.rating]} · {formatDateTime(attempt.completedAt, "zh-TW")}
                </span>
              </li>
            );
          })}
          {!recent.length ? <li>尚無作答。</li> : null}
        </ul>
      </section>
    </main>
  );
}
