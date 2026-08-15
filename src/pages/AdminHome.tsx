import { Link } from "react-router-dom";
import { trainingSet, workers } from "../data/catalog";
import { snapshotFor } from "../engine/dashboard";
import { formatDateTime, percent, relativeTime } from "../lib/format";
import { useShop } from "../store";

export function AdminHome() {
  const { states, attempts, resetDemo } = useShop();
  const snaps = workers.map((worker) => snapshotFor(worker, states, attempts));
  const assigned = snaps.length;
  const started = snaps.filter((snap) => !snap.notStarted).length;
  const due = snaps.reduce((sum, snap) => sum + snap.dueToday, 0);
  const overdue = snaps.reduce((sum, snap) => sum + snap.overdue, 0);
  const help = snaps.filter((snap) => snap.needsHelp);

  return (
    <main className="page admin">
      <header className="page-head">
        <p className="eyebrow">主管監控</p>
        <h1>{trainingSet.titleZh}</h1>
        <p>
          {trainingSet.docNo} · 已指派 {assigned} 人，已開始 {started} 人
        </p>
      </header>
      <div className="stat-row">
        <div>
          <small>今日應複習件數</small>
          <strong>{due}</strong>
        </div>
        <div>
          <small>逾期件數</small>
          <strong className={overdue ? "warn" : ""}>{overdue}</strong>
        </div>
        <div>
          <small>需要協助</small>
          <strong className={help.length ? "warn" : ""}>{help.length}</strong>
        </div>
      </div>
      {help.length ? (
        <section className="help-box">
          <h2>先看這幾位</h2>
          <ul>
            {help.map((snap) => (
              <li key={snap.employee.id}>
                <Link to={`/admin/${snap.employee.id}`}>
                  {snap.employee.name} · 逾期 {snap.overdue} · 弱項{" "}
                  {snap.weakParts.map((part) => part.nameZh).join("、") || "—"}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>員工</th>
              <th>進度</th>
              <th>今日 / 逾期</th>
              <th>測驗正確率</th>
              <th>最後學習</th>
              <th>弱項</th>
            </tr>
          </thead>
          <tbody>
            {snaps.map((snap) => (
              <tr key={snap.employee.id}>
                <td>
                  <Link to={`/admin/${snap.employee.id}`}>
                    <strong>{snap.employee.name}</strong>
                    <small>{snap.employee.station}</small>
                    {snap.needsHelp ? <span className="pill warn">需協助</span> : null}
                    {snap.notStarted ? <span className="pill">尚未開始</span> : null}
                  </Link>
                </td>
                <td>
                  {snap.started}/{snap.assigned}
                  {snap.mastered ? ` · 掌握 ${snap.mastered}` : ""}
                </td>
                <td>
                  {snap.dueToday} / <span className={snap.overdue ? "warn" : ""}>{snap.overdue}</span>
                </td>
                <td>{percent(snap.accuracy)}</td>
                <td title={formatDateTime(snap.lastAt, "zh-TW")}>{relativeTime(snap.lastAt, "zh")}</td>
                <td>{snap.weakParts.map((part) => part.nameZh).join("、") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fine">這是輔導看板，不是監視器。不會記錄是否在線。</p>
      <div className="admin-foot">
        <Link className="text-btn" to="/">
          回首頁
        </Link>
        <button className="text-btn" type="button" onClick={resetDemo}>
          重設 demo 資料
        </button>
      </div>
    </main>
  );
}
