import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { PartArt } from "../components/PartArt";
import { categoryLabels, partById, workerById } from "../data/catalog";
import { partStatusLabel } from "../engine/dashboard";
import { STATUS_ZH } from "../lib/copy";
import { speakZh } from "../lib/speech";
import { useShop } from "../store";

export function LearnCard() {
  const { employeeId = "", partId = "" } = useParams();
  const worker = workerById(employeeId);
  const part = partById(partId);
  const { stateFor } = useShop();
  const [showId, setShowId] = useState(false);
  if (!worker || !part) return <Navigate to="/learn" replace />;
  const state = stateFor(worker.id, part.id);
  const status = partStatusLabel(state);
  const category = categoryLabels[part.category];

  return (
    <main className="page">
      <header className="page-head compact">
        <p className="eyebrow">
          {category.zh} · #{part.callout} · {STATUS_ZH[status]}
        </p>
        <h1>{part.nameZh}</h1>
      </header>
      <PartArt part={part} label={part.nameZh} />
      <div className="name-block">
        <button className="btn ghost" type="button" onClick={() => speakZh(part.nameZh)}>
          朗讀
        </button>
        <button className="btn ghost" type="button" onClick={() => setShowId((value) => !value)}>
          {showId ? "隱藏印尼文" : "顯示印尼文"}
        </button>
      </div>
      {showId ? <p className="zh-name">{part.nameId}</p> : null}
      {part.uncertain ? <p className="backend-badge warn">譯名尚未經現場師傅確認</p> : null}
      <section className="info-card">
        <h2>工單怎麼寫</h2>
        <p>{part.functionId}</p>
      </section>
      <section className="info-card danger">
        <h2>注意</h2>
        <p>{part.safetyId}</p>
      </section>
      <Link className="btn primary wide" to={`/learn/${worker.id}/quiz/${part.id}`}>
        開始測驗
      </Link>
      <Link className="text-btn" to={`/learn/${worker.id}/sheet`}>
        回工單圖
      </Link>
    </main>
  );
}
