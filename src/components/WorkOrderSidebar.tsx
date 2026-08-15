import { Link } from "react-router-dom";
import { trainingSet } from "../data/catalog";
import { units, unitProgress } from "../engine/path";
import type { ReviewState } from "../types";

export function WorkOrderSidebar({
  employeeId,
  workerName,
  states
}: {
  employeeId: string;
  workerName: string;
  states: ReviewState[];
}) {
  const total = units.reduce((sum, unit) => sum + unitProgress(unit, states).total, 0);
  const done = units.reduce((sum, unit) => sum + unitProgress(unit, states).done, 0);

  return (
    <aside className="workorder-side">
      <p className="eyebrow">我的工單</p>
      <h1>{trainingSet.titleZh}</h1>
      <p className="wo-meta">
        {trainingSet.docNo}
        <br />
        {trainingSet.machine} · {trainingSet.station}
      </p>
      <Link className="wo-drawing" to={`/learn/${employeeId}/sheet`}>
        <img src="/drawing-sm.png" alt="生產製造表縮圖" />
        <span>打開完整工單圖</span>
      </Link>
      <div className="wo-progress">
        <small>
          {workerName} · {done}/{total}
        </small>
        <div className="wo-bar">
          <i style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>
      <nav className="wo-units">
        {units.map((unit, index) => {
          const progress = unitProgress(unit, states);
          return (
            <a key={unit.id} className="wo-unit" href={`#unit-${unit.id}`}>
              <strong>
                {index + 1}. {unit.title}
              </strong>
              <small>
                {progress.done}/{progress.total} · {unit.lessons.length} 個檢核站
              </small>
            </a>
          );
        })}
      </nav>
      <Link className="text-btn" to="/">
        回首頁
      </Link>
    </aside>
  );
}
