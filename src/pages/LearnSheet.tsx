import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { DrawingBoard } from "../components/DrawingBoard";
import { categoryLabels, parts, trainingSet, workerById } from "../data/catalog";
import type { CardCategory } from "../types";
import { useShop } from "../store";

const ORDER: CardCategory[] = ["struktur", "bahan", "hardware", "proses", "lembar", "baris"];

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
        <h1>Lembar produksi</h1>
        <p>Nomor oranye = kartu yang ada di gambar. Daftar bawah = seluruh {parts.length} kartu.</p>
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
      {ORDER.map((category) => {
        const group = parts.filter((part) => part.category === category);
        if (!group.length) return null;
        return (
          <section key={category} className="queue">
            <h2>
              {categoryLabels[category].idn} · {categoryLabels[category].zh}
            </h2>
            <ul className="legend">
              {group.map((part) => (
                <li key={part.id}>
                  <Link to={`/learn/${worker.id}/part/${part.id}`}>
                    <span className="num">{part.callout}</span>
                    {part.nameId}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <Link className="text-btn" to={`/learn/${worker.id}`}>
        Kembali ke tugas
      </Link>
    </main>
  );
}
