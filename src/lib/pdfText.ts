const MAX_EXTRACTED_TEXT_LENGTH = 60000;

export interface PdfTextResult {
  text: string;
  pageCount: number;
}

async function loadPdfJs() {
  const [pdfjsLib, pdfjsWorker] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.mjs?url")
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
  return pdfjsLib;
}

export async function extractPdfText(file: File): Promise<PdfTextResult> {
  const pdfjsLib = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const document = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ")
      .trim();
    if (pageText) pages.push(`第 ${pageNumber} 頁\n${pageText}`);
  }

  const text = pages.join("\n\n").slice(0, MAX_EXTRACTED_TEXT_LENGTH).trim();
  return { text, pageCount: document.numPages };
}
