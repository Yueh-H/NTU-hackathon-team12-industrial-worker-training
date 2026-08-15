import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { parts, workerById } from "../data/catalog";
import { queueFor, snapshotFor } from "../engine/dashboard";
import { useShop } from "../store";

type PetMood = "calm" | "due" | "urgent" | "celebrate";

function moodFor(overdue: number, dueToday: number, mastered: number, assigned: number): PetMood {
  if (overdue > 0) return "urgent";
  if (dueToday > 0) return "due";
  if (assigned > 0 && mastered >= assigned) return "celebrate";
  return "calm";
}

function reminderFor(mood: PetMood, dueToday: number, fresh: number, overdue: number): string {
  if (mood === "urgent") return `有 ${overdue} 張逾期複習，先救回一張就好。`;
  if (mood === "due") return `今天有 ${dueToday} 張複習，花幾分鐘維持手感。`;
  if (mood === "celebrate") return "這一輪完成了！休息一下，再挑戰下一份工單。";
  if (fresh > 0) return `還有 ${fresh} 張新卡，今天先學一張。`;
  return "目前沒有急件，保持自己的學習節奏。";
}

export function AlisPet() {
  const { employeeId } = useParams();
  const { states, attempts } = useShop();
  const [open, setOpen] = useState(false);
  const worker = workerById(employeeId ?? "");

  if (!worker) return null;

  const snapshot = snapshotFor(worker, states, attempts);
  const queue = queueFor(worker.id, states);
  const mood = moodFor(snapshot.overdue, snapshot.dueToday, snapshot.mastered, snapshot.assigned);
  const message = reminderFor(mood, snapshot.dueToday, queue.fresh.length, snapshot.overdue);
  const next = queue.overdue[0] ?? queue.today[0] ?? queue.fresh[0];
  const nextPart = next ? parts.find((part) => part.id === next.partId) : undefined;
  const progress = snapshot.assigned ? Math.round((snapshot.started / snapshot.assigned) * 100) : 0;
  const atlasUrl = `${import.meta.env.BASE_URL}alis-pet.webp`;
  const badge = snapshot.overdue || snapshot.dueToday;

  return (
    <aside className={`alis-pet is-${mood}`} aria-label="AI Alis 學習桌寵">
      {open ? (
        <div className="alis-pet-bubble" role="status">
          <button
            className="alis-pet-close"
            type="button"
            onClick={() => setOpen(false)}
            aria-label="關閉 AI Alis 提醒"
          >
            ×
          </button>
          <small>AI Alis · {worker.name}</small>
          <strong>{mood === "urgent" ? "先處理逾期複習" : mood === "due" ? "今天的學習提醒" : "學習進度更新"}</strong>
          <p>{message}</p>
          <div
            className="alis-pet-progress"
            role="progressbar"
            aria-label="已開始的學習卡片"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="alis-pet-meta">
            <span>{snapshot.started}/{snapshot.assigned} 張已開始</span>
            <span>{snapshot.learningScore} 分</span>
          </div>
          {nextPart ? (
            <Link className="alis-pet-action" to={`/learn/${worker.id}/part/${nextPart.id}`} onClick={() => setOpen(false)}>
              開始「{nextPart.nameZh}」
            </Link>
          ) : null}
        </div>
      ) : null}
      <button
        className="alis-pet-button"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`AI Alis：${message}`}
        aria-expanded={open}
      >
        <span
          className="alis-pet-sprite"
          style={{ backgroundImage: `url("${atlasUrl}")` }}
          aria-hidden="true"
        />
        {badge ? <b className="alis-pet-badge">{badge > 9 ? "9+" : badge}</b> : null}
        <span className="alis-pet-name">AI Alis</span>
      </button>
    </aside>
  );
}
