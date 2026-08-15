import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { PartArt } from "../components/PartArt";
import { categoryLabels, partById, workerById } from "../data/catalog";
import { partStatusLabel } from "../engine/dashboard";
import { speakId } from "../lib/speech";
import { useShop } from "../store";

export function LearnCard() {
  const { employeeId = "", partId = "" } = useParams();
  const worker = workerById(employeeId);
  const part = partById(partId);
  const { stateFor } = useShop();
  const [showZh, setShowZh] = useState(false);
  if (!worker || !part) return <Navigate to="/learn" replace />;
  const state = stateFor(worker.id, part.id);
  const status = partStatusLabel(state);
  const category = categoryLabels[part.category];

  return (
    <main className="page">
      <header className="page-head compact">
        <p className="eyebrow">
          {category.idn} · #{part.callout} · {status}
        </p>
        <h1>{part.nameId}</h1>
      </header>
      <PartArt part={part} label={part.nameId} />
      <div className="name-block">
        <button className="btn ghost" type="button" onClick={() => speakId(part.nameId)}>
          Dengarkan
        </button>
        <button className="btn ghost" type="button" onClick={() => setShowZh((value) => !value)}>
          {showZh ? "Sembunyikan Mandarin" : "Tampilkan nama Mandarin"}
        </button>
      </div>
      {showZh ? <p className="zh-name">{part.nameZh}</p> : null}
      {part.uncertain ? <p className="backend-badge warn">Terjemahan belum dicek mandor</p> : null}
      <section className="info-card">
        <h2>Di lembar ini</h2>
        <p>{part.functionId}</p>
      </section>
      <section className="info-card danger">
        <h2>Perhatian</h2>
        <p>{part.safetyId}</p>
      </section>
      <Link className="btn primary wide" to={`/learn/${worker.id}/quiz/${part.id}`}>
        Mulai kuis
      </Link>
      <Link className="text-btn" to={`/learn/${worker.id}/sheet`}>
        Kembali ke lembar
      </Link>
    </main>
  );
}
