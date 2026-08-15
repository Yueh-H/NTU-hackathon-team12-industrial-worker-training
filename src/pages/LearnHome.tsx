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
        <p className="eyebrow">你好，{worker.name}</p>
        <h1>今天的任務</h1>
        <p>
          {trainingSet.docNo} · {trainingSet.machine}
        </p>
      </header>
      <section className="sheet-card">
        <div>
          <small>生產製造表</small>
          <strong>{trainingSet.titleZh}</strong>
          <p>工單共 {parts.length} 張卡片 · 版本 {trainingSet.version}</p>
        </div>
        <Link className="btn primary" to={`/learn/${worker.id}/sheet`}>
          打開工單圖
        </Link>
      </section>
      <div className="stat-row">
        <div>
          <small>未學</small>
          <strong>{queue.fresh.length}</strong>
        </div>
        <div>
          <small>今日</small>
          <strong>{queue.today.length}</strong>
        </div>
        <div>
          <small>逾期</small>
          <strong className={queue.overdue.length ? "warn" : ""}>{queue.overdue.length}</strong>
        </div>
        <div>
          <small>已掌握</small>
          <strong>{snap.mastered}</strong>
        </div>
      </div>
      {first ? (
        <Link className="btn dark wide" to={`/learn/${worker.id}/part/${first.partId}`}>
          繼續：{parts.find((part) => part.id === first.partId)?.nameZh}
        </Link>
      ) : (
        <p className="fine">今天沒有待辦。可以打開工單複習。</p>
      )}
      <Queue title="逾期" items={queue.overdue} employeeId={worker.id} tone="warn" />
      <Queue title="今日複習" items={queue.today} employeeId={worker.id} />
      <Queue title="新卡片" items={queue.fresh} employeeId={worker.id} limit={8} />
      <Link className="text-btn" to="/learn">
        更換員工
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
                <span>{part.nameZh}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {limit && items.length > limit ? <p className="fine">工單裡還有 {items.length - limit} 張。</p> : null}
    </section>
  );
}
