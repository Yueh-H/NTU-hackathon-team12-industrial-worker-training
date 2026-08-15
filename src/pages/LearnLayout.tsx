import { useEffect, useState } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { AlisPet } from "../components/AlisPet";
import { MaterialsPanel } from "../components/MaterialsPanel";
import { WorkOrderRail } from "../components/WorkOrderRail";
import { trainingSet, trainingSetById, workerById } from "../data/catalog";
import { useShop } from "../store";

export const DEFAULT_EMPLOYEE_ID = "agus";
const RAIL_KEY = "wo-rail-collapsed";

export function LearnLayout() {
  const { employeeId = DEFAULT_EMPLOYEE_ID, partId } = useParams();
  const worker = workerById(employeeId);
  const { states } = useShop();
  const [setId, setSetId] = useState(trainingSet.id);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(RAIL_KEY) === "1");
  const selected = trainingSetById(setId) ?? trainingSet;

  useEffect(() => {
    localStorage.setItem(RAIL_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  if (!worker) return <Navigate to={`/learn/${DEFAULT_EMPLOYEE_ID}`} replace />;
  const mine = states.filter((state) => state.employeeId === worker.id);

  return (
    <div className={`learn-shell three-col${collapsed ? " rail-min" : ""}`}>
      <WorkOrderRail
        employeeId={worker.id}
        selectedId={setId}
        collapsed={collapsed}
        onSelect={setSetId}
        onToggle={() => setCollapsed((value) => !value)}
      />
      <MaterialsPanel
        employeeId={worker.id}
        setId={setId}
        training={selected}
        states={mine}
        selectedPartId={partId}
      />
      <section className="learn-main card-pane">
        <Outlet context={{ setId, training: selected }} />
      </section>
      <AlisPet />
    </div>
  );
}
