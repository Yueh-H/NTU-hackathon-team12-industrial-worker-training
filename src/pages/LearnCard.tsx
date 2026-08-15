import { useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { PartArt } from "../components/PartArt";
import { categoryLabels, partById, workerById } from "../data/catalog";
import { partStatusLabel } from "../engine/dashboard";
import { lessonById } from "../engine/path";
import { STATUS_ZH } from "../lib/copy";
import { speakZh } from "../lib/speech";
import { useShop } from "../store";

export function LearnCard() {
  const { employeeId = "", partId = "" } = useParams();
  const [params] = useSearchParams();
  const lesson = lessonById(params.get("lesson") ?? "");
  const worker = workerById(employeeId);
  const part = partById(partId);
  const { stateFor } = useShop();
  const [showId, setShowId] = useState(false);
  if (!worker || !part) return <Navigate to="/learn" replace />;
  const state = stateFor(worker.id, part.id);
  const status = partStatusLabel(state);
  const category = categoryLabels[part.category];
  const step = lesson ? lesson.partIds.indexOf(part.id) + 1 : 0;
  const quizHref = `/learn/${worker.id}/quiz/${part.id}${lesson ? `?lesson=${lesson.id}` : ""}`;

  return (
    <main className="page">
      <header className="page-head compact">
        <p className="eyebrow">
          {lesson
            ? `${categoryLabels[lesson.unit].zh} · ${lesson.title} · ${step}/${lesson.partIds.length}`
            : `${category.zh} · #${part.callout} · ${STATUS_ZH[status]}`}
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
      <Link className="btn primary wide" to={quizHref}>
        開始測驗
      </Link>
      <Link className="text-btn" to={`/learn/${worker.id}`}>
        回學習路徑
      </Link>
    </main>
  );
}
