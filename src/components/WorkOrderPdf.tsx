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
        <h2>
          來源檔
          <span className="bi-idn" lang="id">Berkas sumber</span>
        </h2>
        <span className="fine">{pages} 頁 / {pages} hlm</span>
      </div>
      <p>
        <a href={url} target="_blank" rel="noreferrer">
          另開 {name} ↗
        </a>
      </p>
      <small className="fine">不會自動預覽 PDF，只在你點連結時開啟。</small>
    </section>
  );
}
