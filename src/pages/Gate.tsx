import { Link } from "react-router-dom";
import { BackendBadge } from "../components/BackendBadge";
import { trainingSet } from "../data/catalog";
import { useShop } from "../store";

export function Gate() {
  const { resetDemo } = useShop();
  return (
    <main className="page gate">
      <p className="eyebrow">Team 12 · NTU Hackathon</p>
      <h1>Lembar Kerja Mesin</h1>
      <p className="lede">
        {trainingSet.titleZh}
        <br />
        {trainingSet.docNo} · {trainingSet.machine}
      </p>
      <BackendBadge />
      <div className="gate-actions">
        <Link className="btn primary" to="/learn">
          Karyawan · Belajar suku cadang
        </Link>
        <Link className="btn dark" to="/admin">
          主管監控
        </Link>
      </div>
      <p className="fine">
        有設 Supabase 時，手機學、筆電看主管頁會打同一份資料。沒設就存在這個瀏覽器。
      </p>
      <button className="text-btn" type="button" onClick={resetDemo}>
        Reset data demo
      </button>
    </main>
  );
}
