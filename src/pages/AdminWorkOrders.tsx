import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { WorkOrderUpload } from "../components/WorkOrderUpload";
import { analyzeWorkOrder } from "../lib/aiWorkOrder";
import { formatDateTime } from "../lib/format";
import { usePageTitle } from "../lib/pageTitle";
import { extractPdfText } from "../lib/pdfText";
import { moduleForWorkOrder, newWorkOrderId } from "../lib/workOrderPublish";
import { useShop } from "../store";
import type { LearningModule, WorkOrder, WorkOrderBundle } from "../types";

const RISK_LABELS = {
  low: "低風險",
  medium: "中風險",
  high: "高風險"
} as const;

function analysisSourceLabel(source: WorkOrder["analysisSource"]): string {
  return source === "codex" ? "Codex AI 已分析" : "示範拆解（AI service 未連線）";
}

function fileSizeLabel(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminWorkOrders() {
  usePageTitle("上傳工單 · 老闆");
  const { workOrders, workOrdersReady, workOrderError } = useShop();

  return (
    <main className="page admin">
      <header className="page-head">
        <p className="eyebrow">老闆工具 · 上傳工單</p>
        <h1>發一張生產製造表</h1>
        <p>老闆把 PDF／PNG 丟進來，再拆成員工可以逐步學習的工作情境。</p>
      </header>
      <WorkOrderUpload />
      {workOrderError ? <p className="form-error">{workOrderError}</p> : null}
      <section className="workorder-list">
        <div className="section-title-row">
          <h2>已建立的工單</h2>
          <span className="fine">{workOrders.length} 張</span>
        </div>
        {!workOrdersReady ? <p className="info-card">正在讀取 Firebase 工單資料……</p> : null}
        {workOrders.map((workOrder) => (
          <Link className="workorder-list-card" key={workOrder.id} to={`/admin/workorders/${workOrder.id}`}>
            <span className="workorder-list-copy">
              <strong>{workOrder.title}</strong>
              <small>{workOrder.docNo || "未填工單編號"}</small>
              <small>
                {formatDateTime(workOrder.updatedAt, "zh-TW")} · {analysisSourceLabel(workOrder.analysisSource)}
              </small>
            </span>
            <span className={`risk-badge is-${workOrder.riskLevel}`}>{RISK_LABELS[workOrder.riskLevel]}</span>
          </Link>
        ))}
        {workOrdersReady && !workOrders.length ? (
          <p className="info-card empty-state">還沒有大工單。先建立第一張，讓它變成員工學習內容。</p>
        ) : null}
      </section>
      <Link className="text-btn" to="/admin">
        回主管總覽
      </Link>
    </main>
  );
}

export function AdminWorkOrderNew() {
  const navigate = useNavigate();
  const { saveWorkOrder, uploadWorkOrderPdf, backend } = useShop();
  const [title, setTitle] = useState("");
  const [docNo, setDocNo] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [pdfDraft, setPdfDraft] = useState<{ file: File; text: string; pageCount: number } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  async function handlePdfChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPdfDraft(null);
    setError("");
    setWarning("");
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("只能上傳 PDF 檔案。");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("PDF 上限為 25 MB，請先壓縮檔案。");
      return;
    }
    setPdfLoading(true);
    try {
      const extracted = await extractPdfText(file);
      setPdfDraft({ file, text: extracted.text, pageCount: extracted.pageCount });
      setWarning(
        extracted.text
          ? `已讀取 ${extracted.pageCount} 頁 PDF 文字，送出時會先上傳再進行 break down。`
          : "這份 PDF 沒有可抽取的文字，請在下方補充工單內容，否則 AI 無法拆解。"
      );
    } catch (extractError) {
      setError(extractError instanceof Error ? `PDF 讀取失敗：${extractError.message}` : "PDF 讀取失敗。");
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = rawContent.trim();
    if (!cleanTitle || (!cleanContent && !pdfDraft?.text)) {
      setError("請填寫工單名稱，並上傳有文字的 PDF 或貼入工單原文。");
      return;
    }
    if (pdfLoading) {
      setError("PDF 還在讀取中，請稍候。");
      return;
    }

    setSubmitting(true);
    setError("");
    setWarning("");
    const id = newWorkOrderId();
    const now = new Date().toISOString();
    const sourceContent = [
      pdfDraft ? `【PDF 原文：${pdfDraft.file.name}】\n${pdfDraft.text}` : "",
      cleanContent ? `【主管補充】\n${cleanContent}` : ""
    ]
      .filter(Boolean)
      .join("\n\n");

    const workOrder: WorkOrder = {
      id,
      orgId: "team12-demo",
      title: cleanTitle,
      docNo: docNo.trim(),
      rawContent: sourceContent,
      summary: "",
      riskLevel: "medium",
      status: "ready",
      model: "gpt-5.6-luna",
      reasoningEffort: "max",
      analysisSource: "demo-fallback",
      sourceFile: null,
      createdBy: "supervisor",
      createdAt: now,
      updatedAt: now
    };

    try {
      if (pdfDraft) workOrder.sourceFile = await uploadWorkOrderPdf(id, pdfDraft.file, pdfDraft.pageCount);
      const result = await analyzeWorkOrder({ title: cleanTitle, docNo: docNo.trim(), rawContent: sourceContent });
      workOrder.summary = result.analysis.summary;
      workOrder.riskLevel = result.analysis.riskLevel;
      workOrder.analysisSource = result.source;
      const bundle: WorkOrderBundle = {
        workOrder,
        modules: result.analysis.modules.map((module, index) => moduleForWorkOrder(id, module, index))
      };
      await saveWorkOrder(bundle);
      if (result.warning) setWarning(result.warning);
      navigate(`/admin/workorders/${id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "工單儲存失敗，請再試一次。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page admin">
      <header className="page-head">
        <p className="eyebrow">主管工具 · 新增</p>
        <h1>丟入一張大工單</h1>
        <p>先保留工單原文，AI 只負責整理成學習順序；現場安全規範仍由主管確認。</p>
      </header>
      <form className="workorder-form" onSubmit={handleSubmit}>
        <label>
          工單名稱
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：FM-DEMO 防火門子母扇組立"
            required
          />
        </label>
        <label>
          工單編號（選填）
          <input
            value={docNo}
            onChange={(event) => setDocNo(event.target.value)}
            placeholder="例如：DEMO-001"
          />
        </label>
        <label>
          上傳工單 PDF
          <input type="file" accept="application/pdf,.pdf" onChange={handlePdfChange} />
          <small className="field-hint">PDF 會先上傳到 Firebase Storage，再抽取文字交給 break down。單檔上限 25 MB。</small>
          {pdfLoading ? <small className="field-status">正在讀取 PDF 文字……</small> : null}
          {pdfDraft ? (
            <small className="field-status">
              {pdfDraft.file.name} · {pdfDraft.pageCount} 頁 · {fileSizeLabel(pdfDraft.file.size)}
            </small>
          ) : null}
        </label>
        <label>
          工單原文／主管補充（PDF 可抽取文字時選填）
          <textarea
            value={rawContent}
            onChange={(event) => setRawContent(event.target.value)}
            placeholder={'如果 PDF 是掃描影像，請在這裡補上尺寸、材料、工序、數量與安全注意事項……'}
            rows={14}
          />
        </label>
        <div className="ai-config-card">
          <strong>AI 拆解設定</strong>
          <span>Codex · gpt-5.6-luna · reasoning effort max</span>
          <small>
            不把 API key 放在前端；由 headless service 代為呼叫。{backend === "cloud" ? "PDF 存 Firebase Storage，工單與 break down 存 Firestore。" : "目前只會在這個瀏覽器保存文字與檔案 metadata。"}
          </small>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        {warning ? <p className="form-warning">{warning}</p> : null}
        <div className="form-actions">
          <Link className="btn ghost" to="/admin/workorders">
            取消
          </Link>
          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? "AI 分析中……" : "分析並建立學習內容"}
          </button>
        </div>
      </form>
    </main>
  );
}

export function AdminWorkOrderDetail() {
  const { workOrderId = "" } = useParams();
  const { loadWorkOrder } = useShop();
  const [bundle, setBundle] = useState<WorkOrderBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadWorkOrder(workOrderId)
      .then((result) => {
        if (!active) return;
        setBundle(result);
        if (!result) setError("找不到這張大工單。");
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "工單讀取失敗。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadWorkOrder, workOrderId]);

  if (loading) return <main className="page admin"><p className="info-card">正在讀取大工單……</p></main>;
  if (!bundle) {
    return (
      <main className="page admin">
        <p className="form-error">{error || "找不到這張大工單。"}</p>
        <Link className="btn ghost" to="/admin/workorders">回大工單列表</Link>
      </main>
    );
  }

  const { workOrder, modules } = bundle;
  return (
    <main className="page admin">
      <header className="page-head">
        <p className="eyebrow">大工單 · {workOrder.docNo || "未編號"}</p>
        <h1>{workOrder.title}</h1>
        <p>
          {analysisSourceLabel(workOrder.analysisSource)} · {workOrder.model} · reasoning {workOrder.reasoningEffort}
        </p>
      </header>
      <section className="info-card workorder-summary">
        <div className="section-title-row">
          <h2>AI 拆解摘要</h2>
          <span className={`risk-badge is-${workOrder.riskLevel}`}>{RISK_LABELS[workOrder.riskLevel]}</span>
        </div>
        <p>{workOrder.summary}</p>
      </section>
      {workOrder.sourceFile ? (
        <section className="info-card source-file-card">
          <div className="section-title-row">
            <h2>來源 PDF</h2>
            <span className="fine">{workOrder.sourceFile.pageCount} 頁 · {fileSizeLabel(workOrder.sourceFile.size)}</span>
          </div>
          <p>
            {workOrder.sourceFile.downloadUrl ? (
              <a href={workOrder.sourceFile.downloadUrl} target="_blank" rel="noreferrer">
                {workOrder.sourceFile.name} ↗
              </a>
            ) : (
              <strong>{workOrder.sourceFile.name}</strong>
            )}
          </p>
          <small className="fine">
            {workOrder.sourceFile.downloadUrl ? "已存入 Firebase Storage。" : "本機 fallback 僅保存檔案 metadata，未上傳雲端。"}
          </small>
        </section>
      ) : null}
      <section className="module-list">
        <div className="section-title-row">
          <h2>員工學習單元</h2>
          <span className="fine">{modules.length} 個情境</span>
        </div>
        {modules.map((module) => <LearningModulePreview key={module.id} module={module} />)}
      </section>
      <div className="form-actions">
        <Link className="btn ghost" to="/admin/workorders">回工單列表</Link>
        <Link className="btn primary" to={`/learn/workorder/${workOrder.id}?employee=agus`}>
          以員工視角預覽
        </Link>
      </div>
    </main>
  );
}

function LearningModulePreview({ module }: { module: LearningModule }) {
  return (
    <article className="module-card">
      <div className="module-card-head">
        <span className="module-number">{String(module.order).padStart(2, "0")}</span>
        <div>
          <h3>{module.title}</h3>
          <small>約 {module.estimatedMinutes} 分鐘</small>
        </div>
      </div>
      <p>{module.objective}</p>
      <div className="module-columns">
        <div>
          <strong>操作步驟</strong>
          <ol>{module.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </div>
        <div>
          <strong>安全／品質</strong>
          <ul>{module.safety.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>
      <details>
        <summary>查看自我檢核</summary>
        <p><strong>問：</strong>{module.checkQuestion}</p>
        <p><strong>答：</strong>{module.checkAnswer}</p>
      </details>
      <small className="module-source">依據：{module.sourceText}</small>
    </article>
  );
}
