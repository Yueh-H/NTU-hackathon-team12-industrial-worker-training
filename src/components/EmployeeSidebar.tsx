import { Link, NavLink } from "react-router-dom";
import { trainingSet, workers } from "../data/catalog";
import { snapshotFor } from "../engine/dashboard";
import { useShop } from "../store";

export function EmployeeSidebar() {
  const { states, attempts } = useShop();
  return (
    <aside className="employee-side">
      <p className="eyebrow">選擇員工</p>
      <h1>{trainingSet.titleZh}</h1>
      <div className="employee-list">
        {workers.map((worker) => {
          const snap = snapshotFor(worker, states, attempts);
          return (
            <NavLink
              key={worker.id}
              to={`/learn/${worker.id}`}
              className={({ isActive }) => `employee-card${isActive ? " is-on" : ""}`}
            >
              <div>
                <strong>{worker.name}</strong>
                <small>{worker.station}</small>
              </div>
              <span>
                {snap.started}/{snap.assigned}
              </span>
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
