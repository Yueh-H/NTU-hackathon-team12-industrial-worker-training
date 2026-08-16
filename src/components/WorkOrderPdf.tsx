import type { WorkOrder } from "../types";

export function sheetPdfUrl(order: WorkOrder): string {
  return order.sourceFile?.downloadUrl || "";
}

export function WorkOrderPdf({ workOrder }: { workOrder: WorkOrder }) {
  const url = sheetPdfUrl(workOrder);
  if (!url) return null;
  const name = workOrder.sourceFile?.name || "source.pdf";
  const pages = workOrder.sourceFile?.pageCount || 1;
  return (
    <section className="info-card source-file-card">
      <div className="section-title-row">
        <h2>來源 PDF</h2>
        <span className="fine">{pages} 頁</span>
      </div>
      <iframe className="workorder-pdf-frame" title={name} src={url} />
      <p>
        <a href={url} target="_blank" rel="noreferrer">
          {name} ↗
        </a>
      </p>
      <small className="fine">這份 PDF 只在有上傳連結時顯示，不會放在 GitHub Pages。</small>
    </section>
  );
}
