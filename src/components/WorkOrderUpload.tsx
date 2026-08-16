import { useEffect, useState, type ChangeEvent, type DragEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DEMO_SHEET, DEMO_WORK_ORDER_ID } from "../data/demoSheet";
import { analyzeWorkOrder } from "../lib/aiWorkOrder";
import { biLine, BiText } from "./BiText";
import { t } from "../lib/copy";
import { extractPdfText } from "../lib/pdfText";
import { bundleFromAnalysis } from "../lib/workOrderPublish";
import { useShop } from "../store";
import type { WorkOrderSourceFile } from "../types";

type Picked = {
  file: File;
  url: string;
  kind: "pdf" | "image";
  text: string;
  pageCount: number;
};

function kindOf(file: File): "pdf" | "image" | null {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name)) return "image";
  return null;
}

export function WorkOrderUpload() {
  const navigate = useNavigate();
  const { saveWorkOrder, uploadWorkOrderPdf } = useShop();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [over, setOver] = useState(false);
  const [reading, setReading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    return () => {
      if (picked) URL.revokeObjectURL(picked.url);
    };
  }, [picked]);

  async function takeFile(file: File | undefined) {
    if (!file) return;
    const kind = kindOf(file);
    if (!kind) {
      setError("請選 PDF 或 PNG／JPG。");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("檔案上限為 25 MB，請先壓縮。");
      return;
    }
    setError("");
    setWarning("");
    setReading(true);
    try {
      let text: string = DEMO_SHEET.rawContent;
      let pageCount = 1;
      if (kind === "pdf") {
        const extracted = await extractPdfText(file);
        pageCount = extracted.pageCount;
        text = extracted.text || DEMO_SHEET.rawContent;
        setWarning(
          extracted.text
            ? `已讀取 ${extracted.pageCount} 頁 PDF。掃描檔若字太少，會改用 DEMO-001 示範解析。`
            : "這份 PDF 幾乎抽不到字，已套用 DEMO-001 示範解析。"
        );
      }
      setPicked((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { file, url: URL.createObjectURL(file), kind, text, pageCount };
      });
    } catch (readError) {
      setError(readError instanceof Error ? `檔案讀取失敗：${readError.message}` : "檔案讀取失敗。");
    } finally {
      setReading(false);
    }
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    void takeFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setOver(false);
    void takeFile(event.dataTransfer.files?.[0]);
  }

  async function publish() {
    if (!picked) {
      setError("先選一份工單檔案。");
      return;
    }
    setSubmitting(true);
    setError("");
    const rawContent = `【上傳檔案】${picked.file.name}\n${picked.text}`;
    try {
      const result = await analyzeWorkOrder({
        title: DEMO_SHEET.title,
        docNo: DEMO_SHEET.docNo,
        rawContent
      });
      let sourceFile: WorkOrderSourceFile | null = null;
      const bundle = bundleFromAnalysis(
        {
          title: DEMO_SHEET.title,
          docNo: DEMO_SHEET.docNo,
          rawContent,
          createdBy: "boss",
          sourceFile: null
        },
        result
      );
      if (picked.kind === "pdf") {
        sourceFile = await uploadWorkOrderPdf(bundle.workOrder.id, picked.file, picked.pageCount);
        bundle.workOrder.sourceFile = sourceFile;
      }
      await saveWorkOrder(bundle);
      if (result.warning) setWarning(result.warning);
      navigate(`/admin/workorders/${bundle.workOrder.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "工單儲存失敗，請再試一次。");
    } finally {
      setSubmitting(false);
    }
  }

  const previewSrc = picked?.kind === "image" ? picked.url : "";

  return (
    <section className="sheet-upload info-card">
      <div className="section-title-row">
        <div>
          <h2>
            {t.uploadSheet.zh}
            <span className="bi-idn" lang="id">{t.uploadSheet.idn}</span>
          </h2>
          <BiText as="p" className="fine" {...t.uploadHint} />
        </div>
      </div>
      <label
        className={`sheet-drop${over ? " is-over" : ""}${picked ? " has-file" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <input accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" hidden type="file" onChange={onInput} />
        <strong>{biLine(t.pickFile)}</strong>
        <small>{picked ? picked.file.name : reading ? "正在讀取檔案……" : biLine(t.pickFileFine)}</small>
      </label>
      {picked ? (
        <div className="sheet-preview">
          {previewSrc ? <img src={previewSrc} alt={picked.file.name} /> : null}
          <div className="sheet-parse">
            <p className="eyebrow">{biLine(t.parsedAs)}</p>
            <strong>{DEMO_SHEET.title}</strong>
            <small>
              {DEMO_SHEET.formCode}／{DEMO_SHEET.docNo} · {DEMO_SHEET.machine}
            </small>
            <p>{DEMO_SHEET.summary}</p>
            <small>
              工單文字只存在這個瀏覽器，PDF 不會上傳。
            </small>
          </div>
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      {warning ? <p className="form-warning">{warning}</p> : null}
      <div className="form-actions">
        <Link className="btn ghost" to={`/admin/workorders/${DEMO_WORK_ORDER_ID}`}>
          開啟示範工單
        </Link>
        <Link className="btn ghost" to="/admin/workorders/new">
          {biLine(t.pasteInstead)}
        </Link>
        <button className="btn primary" disabled={submitting || reading || !picked} type="button" onClick={() => void publish()}>
          {submitting ? biLine(t.analyzing) : biLine(t.publishSheet)}
        </button>
      </div>
    </section>
  );
}
