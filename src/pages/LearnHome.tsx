import { Navigate, useParams } from "react-router-dom";
import { trainingSet, workerById } from "../data/catalog";

export function LearnHome() {
  const { employeeId = "" } = useParams();
  const worker = workerById(employeeId);
  if (!worker) return <Navigate to="/learn" replace />;

  return (
    <section className="card-empty">
      <p className="eyebrow">{worker.name}</p>
      <h1>從中間選一項材料</h1>
      <p>左邊是你的工單，中間是這張單上的材料。點一項，卡片會出現在這裡。</p>
      <p className="fine">{trainingSet.docNo} · {trainingSet.machine}</p>
    </section>
  );
}
