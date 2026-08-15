import { DEMO_SHEET } from "../data/demoSheet";
import { assetUrl } from "../lib/asset";
import type { WorkOrder } from "../types";

export function sheetPdfUrl(order: WorkOrder): string {
  if (order.sourceFile?.downloadUrl) return order.sourceFile.downloadUrl;
  if (order.docNo === DEMO_SHEET.docNo) return assetUrl(DEMO_SHEET.pdfPath);
  return "";
}

export function WorkOrderPdf({ workOrder }: { workOrder: WorkOrder }) {
  const url = sheetPdfUrl(workOrder);
  if (!url) return null;
  const name = workOrder.sourceFile?.name || DEMO_SHEET.pdfPath;
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
      <small className="fine">這份示範圖已拿掉客戶與工程名稱，可直接遠端展示。</small>
    </section>
  );
}
