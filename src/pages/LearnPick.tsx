import { Link } from "react-router-dom";
import { trainingSet, workers } from "../data/catalog";
import { snapshotFor } from "../engine/dashboard";
import { useShop } from "../store";

export function LearnPick() {
  const { states, attempts } = useShop();
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">選擇員工</p>
        <h1>誰要開始學？</h1>
        <p>{trainingSet.titleZh}</p>
      </header>
      <div className="stack">
        {workers.map((worker) => {
          const snap = snapshotFor(worker, states, attempts);
          return (
            <Link key={worker.id} className="pick-card" to={`/learn/${worker.id}`}>
              <div>
                <strong>{worker.name}</strong>
                <small>{worker.station}</small>
              </div>
              <span>
                {snap.started}/{snap.assigned}
              </span>
            </Link>
          );
        })}
      </div>
      <Link className="text-btn" to="/">
        回首頁
      </Link>
    </main>
  );
}
