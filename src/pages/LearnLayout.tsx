import { Outlet } from "react-router-dom";
import { AlisPet } from "../components/AlisPet";
import { EmployeeSidebar } from "../components/EmployeeSidebar";

export function LearnLayout() {
  return (
    <div className="learn-shell">
      <EmployeeSidebar />
      <section className="learn-main">
        <Outlet />
      </section>
      <AlisPet />
    </div>
  );
}
