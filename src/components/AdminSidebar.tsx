import { Link, NavLink } from "react-router-dom";
import { workers } from "../data/catalog";
import { snapshotFor } from "../engine/dashboard";
import { useShop } from "../store";

function initials(name: string): string {
  const chunks = name.trim().split(/\s+/);
  if (chunks.length >= 2 && /^[A-Za-z]/.test(chunks[0])) {
    return `${chunks[0][0] ?? ""}${chunks[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2);
}

export function AdminSidebar() {
  const { states, attempts } = useShop();

  return (
    <aside className="admin-side">
      <p className="eyebrow">主管檢核</p>
      <h1>人員</h1>
      <NavLink className={({ isActive }) => `admin-overview-link${isActive ? " is-on" : ""}`} to="/admin" end>
        <strong>全員總覽</strong>
        <small>一眼看完進度、弱項與掌握圖</small>
      </NavLink>
      <NavLink className={({ isActive }) => `admin-overview-link workorder-nav${isActive ? " is-on" : ""}`} to="/admin/workorders">
        <strong>大工單 → 學習</strong>
        <small>貼上工單，AI 拆成員工情境</small>
      </NavLink>
      <NavLink className={({ isActive }) => `admin-overview-link${isActive ? " is-on" : ""}`} to="/admin/cards">
        <strong>編輯卡片</strong>
        <small>單獨改每一張卡的名稱與提示</small>
      </NavLink>
      <div className="admin-people">
        {workers.map((worker) => {
          const snap = snapshotFor(worker, states, attempts);
          return (
            <NavLink
              key={worker.id}
              to={`/admin/${worker.id}`}
              className={({ isActive }) => `admin-person${isActive ? " is-on" : ""}`}
            >
              <span className="admin-avatar" aria-hidden="true">
                {initials(worker.name)}
              </span>
              <span className="admin-person-copy">
                <strong>{worker.name}</strong>
                <small>{worker.station}</small>
                <small>
                  {snap.started}/{snap.assigned} 張
                  {snap.overdue ? ` · 逾期 ${snap.overdue}` : ""}
                </small>
              </span>
              {snap.needsHelp ? <span className="pill warn">需協助</span> : null}
              {snap.notStarted ? <span className="pill">尚未開始</span> : null}
            </NavLink>
          );
        })}
      </div>
      <Link className="text-btn" to="/">
        回首頁
      </Link>
    </aside>
  );
}
