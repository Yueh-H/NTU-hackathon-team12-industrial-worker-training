import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  categoryLabels,
  clearCardOverride,
  hasCardOverride,
  parts,
  saveCardOverride,
  type EditablePartFields
} from "../data/catalog";
import type { CardCategory, Part } from "../types";

const categories = Object.keys(categoryLabels) as CardCategory[];

function editableFields(part: Part): EditablePartFields {
  return {
    category: part.category,
    nameId: part.nameId,
    nameZh: part.nameZh,
    nameEn: part.nameEn,
    functionId: part.functionId,
    safetyId: part.safetyId,
    icon: part.icon,
    sheet: part.sheet,
    critical: part.critical,
    uncertain: part.uncertain
  };
}

export function AdminCards() {
  const [selectedId, setSelectedId] = useState(parts[0]?.id ?? "");
  const selected = parts.find((part) => part.id === selectedId) ?? parts[0];
  const [draft, setDraft] = useState<EditablePartFields>(() => editableFields(selected ?? parts[0]));

  if (!selected) {
    return (
      <main className="page admin">
        <p>目前沒有可編輯的卡片。</p>
        <Link className="text-btn" to="/admin">
          回主管總表
        </Link>
      </main>
    );
  }

  function chooseCard(id: string) {
    const next = parts.find((part) => part.id === id);
    if (!next) return;
    setSelectedId(id);
    setDraft(editableFields(next));
  }

  function updateField<K extends keyof EditablePartFields>(field: K, value: EditablePartFields[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveCardOverride(selected.id, draft);
    window.location.reload();
  }

  function reset() {
    clearCardOverride(selected.id);
    window.location.reload();
  }

  return (
    <main className="page admin">
      <header className="page-head">
        <p className="eyebrow">卡片模組管理</p>
        <h1>單獨編輯每一張卡片</h1>
        <p>每張卡片都有自己的屬性；修改只會套用到目前選取的卡片。</p>
      </header>

      <section className="info-card">
        <h2>Demo 儲存方式</h2>
        <p>修改會儲存在這個瀏覽器，按下儲存後會重新載入學習教材。卡片 ID、編號與圖面定位保持不變。</p>
      </section>

      <div className="card-editor-layout">
        <aside className="card-editor-picker">
          <label className="editor-field">
            <span>選擇卡片</span>
            <select value={selected.id} onChange={(event) => chooseCard(event.target.value)}>
              {parts.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.callout}. {part.nameZh} · {part.nameId}
                  {hasCardOverride(part.id) ? " · 已修改" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="editor-meta">
            <span className="pill">卡片 ID：{selected.id}</span>
            <span className="pill">第 {selected.callout} 張</span>
            {hasCardOverride(selected.id) ? <span className="pill is-edited">此卡有自訂屬性</span> : null}
          </div>
          <div className="info-card editor-preview">
            <h2>目前內容預覽</h2>
            <strong>{draft.nameZh}</strong>
            <p>{draft.nameId}</p>
            <p className="fine">{draft.nameEn}</p>
          </div>
        </aside>

        <form className="card-editor-form" onSubmit={save}>
          <div className="editor-grid">
            <label className="editor-field">
              <span>中文名稱</span>
              <input value={draft.nameZh} onChange={(event) => updateField("nameZh", event.target.value)} required />
            </label>
            <label className="editor-field">
              <span>分類</span>
              <select
                value={draft.category}
                onChange={(event) => updateField("category", event.target.value as CardCategory)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabels[category].zh} · {categoryLabels[category].idn}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="editor-grid">
            <label className="editor-field">
              <span>印尼文</span>
              <input value={draft.nameId} onChange={(event) => updateField("nameId", event.target.value)} required />
            </label>
            <label className="editor-field">
              <span>英文</span>
              <input value={draft.nameEn} onChange={(event) => updateField("nameEn", event.target.value)} required />
            </label>
          </div>

          <label className="editor-field">
            <span>使用／辨識提示</span>
            <textarea value={draft.functionId} onChange={(event) => updateField("functionId", event.target.value)} />
          </label>
          <label className="editor-field">
            <span>安全提醒</span>
            <textarea value={draft.safetyId} onChange={(event) => updateField("safetyId", event.target.value)} />
          </label>

          <div className="editor-grid">
            <label className="editor-field">
              <span>圖示檔名</span>
              <input
                value={draft.icon ?? ""}
                placeholder="例如：daun-induk.svg"
                onChange={(event) => updateField("icon", event.target.value || null)}
              />
            </label>
            <label className="editor-field">
              <span>圖面檔名</span>
              <input
                value={draft.sheet ?? ""}
                placeholder="例如：sheet-elevation.png"
                onChange={(event) => updateField("sheet", event.target.value || null)}
              />
            </label>
          </div>

          <div className="editor-checks">
            <label>
              <input
                type="checkbox"
                checked={draft.critical}
                onChange={(event) => updateField("critical", event.target.checked)}
              />
              關鍵卡片
            </label>
            <label>
              <input
                type="checkbox"
                checked={draft.uncertain}
                onChange={(event) => updateField("uncertain", event.target.checked)}
              />
              待師傅確認翻譯
            </label>
          </div>

          <div className="editor-actions">
            <button className="btn dark" type="submit">
              儲存這張卡片
            </button>
            <button className="btn ghost" type="button" onClick={reset} disabled={!hasCardOverride(selected.id)}>
              還原原始屬性
            </button>
          </div>
        </form>
      </div>

      <div className="admin-foot">
        <Link className="text-btn" to="/admin">
          回主管總表
        </Link>
      </div>
    </main>
  );
}
