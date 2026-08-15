import { Link, NavLink } from "react-router-dom";
import { biLine } from "./BiText";
import { workers } from "../data/catalog";
import { snapshotFor } from "../engine/dashboard";
import { t } from "../lib/copy";
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
      <p className="eyebrow">{biLine(t.adminCheck)}</p>
      <h1>{t.adminPeople.zh}<span className="bi-idn" lang="id">{t.adminPeople.idn}</span></h1>
      <NavLink className={({ isActive }) => `admin-overview-link${isActive ? " is-on" : ""}`} to="/admin" end>
        <strong>{t.adminOverview.zh}<span className="bi-idn" lang="id">{t.adminOverview.idn}</span></strong>
        <small>{t.adminOverviewFine.zh}<span className="bi-idn" lang="id">{t.adminOverviewFine.idn}</span></small>
      </NavLink>
      <NavLink className={({ isActive }) => `admin-overview-link workorder-nav${isActive ? " is-on" : ""}`} to="/admin/workorders">
        <strong>{t.adminWorkorders.zh}<span className="bi-idn" lang="id">{t.adminWorkorders.idn}</span></strong>
        <small>{t.adminWorkordersFine.zh}<span className="bi-idn" lang="id">{t.adminWorkordersFine.idn}</span></small>
      </NavLink>
      <NavLink className={({ isActive }) => `admin-overview-link${isActive ? " is-on" : ""}`} to="/admin/cards">
        <strong>{t.adminCards.zh}<span className="bi-idn" lang="id">{t.adminCards.idn}</span></strong>
        <small>{t.adminCardsFine.zh}<span className="bi-idn" lang="id">{t.adminCardsFine.idn}</span></small>
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
        {biLine(t.backHome)}
      </Link>
    </aside>
  );
}
