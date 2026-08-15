import { Link } from "react-router-dom";
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
      <div className="gate-actions">
        <Link className="btn primary" to="/learn">
          Karyawan · Belajar suku cadang
        </Link>
        <Link className="btn dark" to="/admin">
          主管監控
        </Link>
      </div>
      <p className="fine">
        Data demo disimpan di browser ini. Buka /learn dan /admin di dua tab untuk melihat angka bergerak.
      </p>
      <button className="text-btn" type="button" onClick={resetDemo}>
        Reset data demo
      </button>
    </main>
  );
}
