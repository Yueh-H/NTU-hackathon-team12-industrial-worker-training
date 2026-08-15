import { Link } from "react-router-dom";
import { trainingSets } from "../data/catalog";
import type { TrainingSet } from "../types";

export function WorkOrderRail({
  employeeId,
  selectedId,
  collapsed,
  onSelect,
  onToggle
}: {
  employeeId: string;
  selectedId: string;
  collapsed: boolean;
  onSelect: (setId: string) => void;
  onToggle: () => void;
}) {
  return (
    <aside className={`wo-rail${collapsed ? " is-collapsed" : ""}`}>
      <div className="wo-rail-head">
        {!collapsed ? <p className="eyebrow">工單</p> : null}
        <button className="wo-rail-toggle" type="button" onClick={onToggle} aria-label={collapsed ? "展開工單" : "縮小工單"}>
          {collapsed ? "»" : "«"}
        </button>
      </div>
      <div className="wo-rail-list">
        {trainingSets.map((item) => (
          <WorkOrderButton
            key={item.id}
            item={item}
            selected={item.id === selectedId}
            collapsed={collapsed}
            onSelect={onSelect}
          />
        ))}
        <Link
          className="wo-rail-item wo-rank"
          to={`/learn/ranking?from=${employeeId}`}
          title="全員排行榜"
        >
          <strong>{collapsed ? "榜" : "排行榜"}</strong>
          {collapsed ? null : <small>看全員學習積分</small>}
        </Link>
      </div>
    </aside>
  );
}

function WorkOrderButton({
  item,
  selected,
  collapsed,
  onSelect
}: {
  item: TrainingSet;
  selected: boolean;
  collapsed: boolean;
  onSelect: (setId: string) => void;
}) {
  const short = item.docNo.split("/")[0]?.trim() ?? item.id;
  return (
    <button
      type="button"
      className={`wo-rail-item${selected ? " is-on" : ""}${item.active ? "" : " is-off"}`}
      onClick={() => onSelect(item.id)}
      title={item.titleZh}
    >
      <strong>{collapsed ? short.replace("FM", "") : short}</strong>
      {collapsed ? null : (
        <>
          <span>{item.titleZh.replace(/^[A-Z0-9]+\s/, "")}</span>
          <small>{item.active ? item.machine : "尚未開放"}</small>
        </>
      )}
    </button>
  );
}
