import { Link, Navigate, useParams } from "react-router-dom";
import { parts, trainingSet, workerById } from "../data/catalog";
import { queueFor, snapshotFor } from "../engine/dashboard";
import { useShop } from "../store";

export function LearnHome() {
  const { employeeId = "" } = useParams();
  const worker = workerById(employeeId);
  const { states, attempts } = useShop();
  if (!worker) return <Navigate to="/learn" replace />;
  const mine = states.filter((state) => state.employeeId === worker.id);
  const snap = snapshotFor(worker, mine, attempts);
  const queue = queueFor(worker.id, mine);
  const first =
    queue.overdue[0] ?? queue.today[0] ?? queue.fresh[0] ?? mine.find((state) => state.status === "learning");

  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">Halo, {worker.name}</p>
        <h1>Tugas hari ini</h1>
        <p>
          {trainingSet.docNo} · {trainingSet.machine}
        </p>
      </header>
      <section className="sheet-card">
        <div>
          <small>Lembar produksi</small>
          <strong>{trainingSet.titleId}</strong>
          <p>{parts.length} kartu dari lembar produksi · versi {trainingSet.version}</p>
        </div>
        <Link className="btn primary" to={`/learn/${worker.id}/sheet`}>
          Buka gambar mesin
        </Link>
      </section>
      <div className="stat-row">
        <div>
          <small>Baru</small>
          <strong>{queue.fresh.length}</strong>
        </div>
        <div>
          <small>Hari ini</small>
          <strong>{queue.today.length}</strong>
        </div>
        <div>
          <small>Terlambat</small>
          <strong className={queue.overdue.length ? "warn" : ""}>{queue.overdue.length}</strong>
        </div>
        <div>
          <small>Dikuasai</small>
          <strong>{snap.mastered}</strong>
        </div>
      </div>
      {first ? (
        <Link className="btn dark wide" to={`/learn/${worker.id}/part/${first.partId}`}>
          Lanjut: {parts.find((part) => part.id === first.partId)?.nameId}
        </Link>
      ) : (
        <p className="fine">Tidak ada tugas hari ini. Buka gambar untuk mengulang.</p>
      )}
      <Queue title="Terlambat" items={queue.overdue} employeeId={worker.id} tone="warn" />
      <Queue title="Ulangan hari ini" items={queue.today} employeeId={worker.id} />
      <Queue title="Kartu baru" items={queue.fresh} employeeId={worker.id} limit={8} />
      <Link className="text-btn" to="/learn">
        Ganti orang
      </Link>
    </main>
  );
}

function Queue({
  title,
  items,
  employeeId,
  tone,
  limit
}: {
  title: string;
  items: { partId: string }[];
  employeeId: string;
  tone?: "warn";
  limit?: number;
}) {
  if (!items.length) return null;
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <section className="queue">
      <h2 className={tone}>
        {title} · {items.length}
      </h2>
      <ul>
        {shown.map((item) => {
          const part = parts.find((entry) => entry.id === item.partId);
          if (!part) return null;
          return (
            <li key={part.id}>
              <Link to={`/learn/${employeeId}/part/${part.id}`}>
                <span className="num">{part.callout}</span>
                <span>
                  {part.nameId}
                  <small> {part.nameZh}</small>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {limit && items.length > limit ? <p className="fine">Dan {items.length - limit} kartu lagi di lembar.</p> : null}
    </section>
  );
}
