import { Navigate, Outlet, useParams } from "react-router-dom";
import { AlisPet } from "../components/AlisPet";
import { WorkOrderSidebar } from "../components/WorkOrderSidebar";
import { workerById } from "../data/catalog";
import { useShop } from "../store";

export const DEFAULT_EMPLOYEE_ID = "agus";

export function LearnLayout() {
  const { employeeId = DEFAULT_EMPLOYEE_ID } = useParams();
  const worker = workerById(employeeId);
  const { states } = useShop();
  if (!worker) return <Navigate to={`/learn/${DEFAULT_EMPLOYEE_ID}`} replace />;
  const mine = states.filter((state) => state.employeeId === worker.id);

  return (
    <div className="learn-shell">
      <WorkOrderSidebar employeeId={worker.id} workerName={worker.name} states={mine} />
      <section className="learn-main">
        <Outlet />
      </section>
      <AlisPet />
    </div>
  );
}
