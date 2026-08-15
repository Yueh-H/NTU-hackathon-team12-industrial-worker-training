import { Link, useSearchParams } from "react-router-dom";
import { trainingSet, workers } from "../data/catalog";
import { rankSnapshots, snapshotFor } from "../engine/dashboard";
import { percent } from "../lib/format";
import { usePageTitle } from "../lib/pageTitle";
import { useShop } from "../store";

const medals = ["🥇", "🥈", "🥉"];

export function LearnRanking() {
  usePageTitle("全員排行榜");
  const [params] = useSearchParams();
  const { states, attempts } = useShop();
  const ranking = rankSnapshots(workers.map((worker) => snapshotFor(worker, states, attempts)));
  const backTo = workers.some((worker) => worker.id === params.get("from"))
    ? `/learn/${params.get("from")}`
    : "/learn";

  return (
    <section className="ranking-stage">
      <header className="path-head ranking-head">
        <p className="eyebrow">學習動力</p>
        <h1>全員學習排行榜</h1>
        <p>{trainingSet.titleZh}</p>
        <p className="fine">掌握卡片、答對測驗與按時複習，會反映在學習積分上。</p>
        <Link className="btn ghost" to={backTo}>
          回到學習路徑
        </Link>
      </header>

      {ranking.length >= 3 ? (
        <ol className="ranking-podium" aria-label="前三名">
          {ranking.slice(0, 3).map((snap, index) => (
            <li key={snap.employee.id} className={`ranking-podium-card place-${index + 1}`}>
              <span className="ranking-medal" aria-hidden="true">
                {medals[index]}
              </span>
              <strong>{snap.employee.name}</strong>
              <small>{snap.employee.station}</small>
              <b>{snap.learningScore} 分</b>
            </li>
          ))}
        </ol>
      ) : null}

      <section className="ranking-board">
        <div className="ranking-board-head">
          <div>
            <p className="eyebrow">本課程</p>
            <h2>所有學習者</h2>
          </div>
          <span>{ranking.length} 人</span>
        </div>
        <ol className="ranking-list">
          {ranking.map((snap, index) => (
            <li key={snap.employee.id} className="ranking-row">
              <span className="ranking-number">#{index + 1}</span>
              <div className="ranking-person">
                <strong>{snap.employee.name}</strong>
                <small>
                  {snap.employee.station} · 掌握 {snap.mastered}/{snap.assigned} 張
                </small>
              </div>
              <div className="ranking-score">
                <strong>{snap.learningScore} 分</strong>
                <small>正確率 {percent(snap.accuracy)}</small>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
