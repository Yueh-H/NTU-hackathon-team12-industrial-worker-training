import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { WorkOrderPdf } from "../components/WorkOrderPdf";
import { workerById } from "../data/catalog";
import { useShop } from "../store";
import type { LearningModule, WorkOrderBundle } from "../types";
import { DEFAULT_EMPLOYEE_ID } from "./LearnLayout";

export function LearnWorkOrder() {
  const { loadWorkOrder } = useShop();
  const [searchParams] = useSearchParams();
  const { workOrderId = "" } = useParams();
  const employeeId = searchParams.get("employee") || DEFAULT_EMPLOYEE_ID;
  const worker = workerById(employeeId);
  const [bundle, setBundle] = useState<WorkOrderBundle | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadWorkOrder(workOrderId)
      .then((result) => {
        if (!active) return;
        setBundle(result);
        if (!result) setError("這張工單尚未建立或已不可用。");
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "學習內容讀取失敗。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadWorkOrder, workOrderId]);

  function toggleModule(moduleId: string) {
    setCompleted((current) =>
      current.includes(moduleId) ? current.filter((item) => item !== moduleId) : [...current, moduleId]
    );
  }

  if (loading) {
    return (
      <main className="page">
        <p className="info-card">正在準備這張工單的學習內容……<span className="bi-idn" lang="id">Menyiapkan isi belajar lembar ini…</span></p>
      </main>
    );
  }
  if (!bundle) {
    return (
      <main className="page">
        <p className="form-error">{error || "找不到學習內容。 / Isi belajar tidak ditemukan."}</p>
        <Link className="btn ghost" to={`/learn/${employeeId}`}>回員工首頁 / Kembali ke beranda karyawan</Link>
      </main>
    );
  }

  const { workOrder, modules } = bundle;
  const doneCount = completed.length;
  const progress = modules.length ? Math.round((doneCount / modules.length) * 100) : 0;

  return (
    <main className="page learn-workorder-page">
      <header className="page-head">
        <p className="eyebrow">員工學習 · {worker?.name ?? employeeId}</p>
        <h1>{workOrder.title}</h1>
        <p>{workOrder.docNo || "未編號"} · 這張工單拆成 {modules.length} 個學習情境</p>
      </header>
      <WorkOrderPdf workOrder={workOrder} />
      <section className="learning-progress-card">
        <div className="section-title-row">
          <strong>本張工單學習進度</strong>
          <span>{doneCount}/{modules.length} · {progress}%</span>
        </div>
        <div className="learning-progress-track"><span style={{ width: `${progress}%` }} /></div>
        <p>{workOrder.summary}</p>
      </section>
      <div className="learning-case-list">
        {modules.map((module) => (
          <LearningCase
            key={module.id}
            module={module}
            done={completed.includes(module.id)}
            onToggle={() => toggleModule(module.id)}
          />
        ))}
      </div>
      <Link className="text-btn" to={`/learn/${employeeId}`}>回員工首頁</Link>
    </main>
  );
}

function LearningCase({
  module,
  done,
  onToggle
}: {
  module: LearningModule;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <article className={`module-card learning-case${done ? " is-done" : ""}`}>
      <div className="module-card-head">
        <span className="module-number">{String(module.order).padStart(2, "0")}</span>
        <div>
          <h2>{module.title}</h2>
          <small>約 {module.estimatedMinutes} 分鐘</small>
        </div>
        {done ? <span className="case-done">已完成</span> : null}
      </div>
      <p>{module.objective}</p>
      <div className="module-columns">
        <div>
          <strong>跟著做</strong>
          <ol>{module.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </div>
        <div className="safety-list">
          <strong>安全／品質</strong>
          <ul>{module.safety.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>
      <details>
        <summary>完成前自我檢核</summary>
        <p><strong>問題：</strong>{module.checkQuestion}</p>
        <p><strong>參考答案：</strong>{module.checkAnswer}</p>
      </details>
      <button className={`btn ${done ? "ghost" : "dark"} wide`} type="button" onClick={onToggle}>
        {done ? "取消完成標記" : "我已完成這個學習情境"}
      </button>
    </article>
  );
}
