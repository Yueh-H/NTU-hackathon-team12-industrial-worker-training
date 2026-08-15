import { getDownloadURL, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";
import type { WorkOrderSourceFile } from "../types";

export async function uploadWorkOrderPdf(
  storage: FirebaseStorage,
  workOrderId: string,
  file: File,
  pageCount: number
): Promise<WorkOrderSourceFile> {
  const storagePath = `work_orders/${workOrderId}/source.pdf`;
  const fileRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(fileRef, file, {
    contentType: "application/pdf",
    customMetadata: {
      originalName: file.name,
      workOrderId
    }
  });
  return {
    name: file.name,
    storagePath,
    downloadUrl: await getDownloadURL(snapshot.ref),
    size: file.size,
    pageCount,
    uploadedAt: new Date().toISOString()
  };
}
