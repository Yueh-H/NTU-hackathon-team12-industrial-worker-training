import { Link } from "react-router-dom";
import { trainingSet, workers } from "../data/catalog";
import { snapshotFor } from "../engine/dashboard";
import { useShop } from "../store";

export function LearnPick() {
  const { states, attempts } = useShop();
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">Pilih nama</p>
        <h1>Siapa yang belajar?</h1>
        <p>{trainingSet.titleId}</p>
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
        Kembali
      </Link>
    </main>
  );
}
