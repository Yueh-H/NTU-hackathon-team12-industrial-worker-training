import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { DrawingBoard } from "../components/DrawingBoard";
import { parts, trainingSet, workerById } from "../data/catalog";
import { useShop } from "../store";

export function LearnSheet() {
  const { employeeId = "" } = useParams();
  const worker = workerById(employeeId);
  const { states } = useShop();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(1);
  if (!worker) return <Navigate to="/learn" replace />;
  const mine = states.filter((state) => state.employeeId === worker.id);

  return (
    <main className="page sheet-page">
      <header className="page-head compact">
        <p className="eyebrow">{trainingSet.docNo}</p>
        <h1>Gambar mesin</h1>
        <p>Sentuh nomor untuk membuka kartu suku cadang.</p>
      </header>
      <div className="zoom-bar">
        <button type="button" onClick={() => setZoom((value) => Math.max(1, value - 0.4))}>
          −
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(2.6, value + 0.4))}>
          +
        </button>
      </div>
      <div className="sheet-scroller">
        <div className="sheet-stage" style={{ width: `${zoom * 100}%` }}>
          <DrawingBoard
            states={mine}
            onPick={(partId) => navigate(`/learn/${worker.id}/part/${partId}`)}
          />
        </div>
      </div>
      <ol className="legend">
        {parts.map((part) => (
          <li key={part.id}>
            <Link to={`/learn/${worker.id}/part/${part.id}`}>
              <span className="num">{part.callout}</span>
              {part.nameId}
            </Link>
          </li>
        ))}
      </ol>
      <Link className="text-btn" to={`/learn/${worker.id}`}>
        Kembali ke tugas
      </Link>
    </main>
  );
}
