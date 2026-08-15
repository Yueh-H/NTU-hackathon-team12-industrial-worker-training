import { Outlet } from "react-router-dom";
import { AdminSidebar } from "../components/AdminSidebar";

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <section className="admin-main">
        <Outlet />
      </section>
    </div>
  );
}
