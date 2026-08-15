import { useShop } from "../store";

export function BackendBadge() {
  const { backend, ready, cloudError } = useShop();
  if (!ready) return <p className="backend-badge">正在連線中央資料庫…</p>;
  if (backend === "cloud" && cloudError) {
    return <p className="backend-badge warn">雲端：{cloudError}</p>;
  }
  if (backend === "cloud") {
    return <p className="backend-badge ok">Firebase 已連線 · 兩台裝置會同步</p>;
  }
  return <p className="backend-badge">本機模式 · 同一瀏覽器兩個分頁可同步</p>;
}
