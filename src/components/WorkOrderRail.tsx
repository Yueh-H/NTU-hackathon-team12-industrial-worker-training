import { Link, NavLink } from "react-router-dom";
import { biLine } from "./BiText";
import { trainingSets } from "../data/catalog";
import { t } from "../lib/copy";
import { useShop } from "../store";
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
  const { workOrders } = useShop();
  return (
    <aside className={`wo-rail${collapsed ? " is-collapsed" : ""}`}>
      <div className="wo-rail-head">
        {!collapsed ? <p className="eyebrow">{biLine(t.workOrder)}</p> : null}
        <button className="wo-rail-toggle" type="button" onClick={onToggle} aria-label={collapsed ? t.expandRail.zh : t.collapseRail.zh} title={biLine(collapsed ? t.expandRail : t.collapseRail)}>
          {collapsed ? "»" : "«"}
        </button>
      </div>
      <NavLink
        className={({ isActive }) => `wo-rail-ranking${isActive ? " is-on" : ""}${collapsed ? " is-collapsed" : ""}`}
        to="/learn/ranking"
        aria-label={biLine(t.rankingLong)}
        title={biLine(t.rankingLong)}
      >
        <span aria-hidden="true">🏆</span>
        {!collapsed ? <strong>{t.rankingLong.zh}<span className="bi-idn" lang="id">{t.rankingLong.idn}</span></strong> : null}
      </NavLink>
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
        {workOrders.map((workOrder) => (
          <Link
            key={workOrder.id}
            className="wo-rail-item wo-boss"
            to={`/learn/workorder/${workOrder.id}?employee=${employeeId}`}
            title={workOrder.title}
          >
            <strong>{collapsed ? (workOrder.docNo || "工").slice(0, 6) : workOrder.docNo || t.bossOrders.zh}</strong>
            {collapsed ? null : (
              <>
                <span>{workOrder.title}</span>
                <small>{t.bossOrders.zh}<span className="bi-idn" lang="id">{t.bossOrders.idn}</span></small>
              </>
            )}
          </Link>
        ))}
        <Link
          className="wo-rail-item wo-rank"
          to={`/learn/ranking?from=${employeeId}`}
          title={biLine(t.ranking)}
        >
          <strong>{collapsed ? "榜" : t.ranking.zh}</strong>
          {collapsed ? null : <small>{t.rankingSee.zh}<span className="bi-idn" lang="id">{t.rankingSee.idn}</span></small>}
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
          <small>{item.active ? item.machine : biLine(t.notOpen)}</small>
        </>
      )}
    </button>
  );
}
