import { Outlet } from "react-router-dom";
import { EmployeeSidebar } from "../components/EmployeeSidebar";

export function LearnLayout() {
  return (
    <div className="learn-shell">
      <EmployeeSidebar />
      <section className="learn-main">
        <Outlet />
      </section>
    </div>
  );
}
