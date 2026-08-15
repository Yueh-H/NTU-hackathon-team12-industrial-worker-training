import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { parts, workerById } from "../data/catalog";
import { queueFor, snapshotFor } from "../engine/dashboard";
import { askAlisHeadless } from "../lib/alisHeadless";
import { speakZh } from "../lib/speech";
import { useShop } from "../store";

type PetMood = "calm" | "due" | "urgent" | "celebrate";
const PET_NAME = "學習小助手";
const SPEECH_MEMORY_PREFIX = "learning-assistant-spoken-v1:";

function speechMemoryKey(reminderKey: string): string {
  return `${SPEECH_MEMORY_PREFIX}${encodeURIComponent(reminderKey)}`;
}

function wasReminderSpoken(reminderKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(speechMemoryKey(reminderKey)) === "1";
  } catch {
    return false;
  }
}

function rememberReminder(reminderKey: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(speechMemoryKey(reminderKey), "1");
  } catch {
    // Private browsing can disable sessionStorage; the in-memory guard still works.
  }
}

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
  const [aiMessage, setAiMessage] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const worker = workerById(employeeId ?? "");
  const spokenRef = useRef("");
  const snapshot = worker ? snapshotFor(worker, states, attempts) : undefined;
  const queue = worker ? queueFor(worker.id, states) : undefined;
  const mood = snapshot && queue
    ? moodFor(snapshot.overdue, snapshot.dueToday, snapshot.mastered, snapshot.assigned)
    : "calm";
  const message = snapshot && queue
    ? reminderFor(mood, snapshot.dueToday, queue.fresh.length, snapshot.overdue)
    : "";
  const next = queue ? queue.overdue[0] ?? queue.today[0] ?? queue.fresh[0] : undefined;
  const nextPart = next ? parts.find((part) => part.id === next.partId) : undefined;
  const progress = snapshot?.assigned ? Math.round((snapshot.started / snapshot.assigned) * 100) : 0;
  const atlasUrl = `${import.meta.env.BASE_URL}alis-pet.webp`;
  const badge = snapshot ? snapshot.overdue || snapshot.dueToday : 0;
  const workerId = worker?.id ?? "";
  const spokenKey = worker ? `${worker.id}:${mood}:${message}` : "";
  const voiceMessage = worker ? `${PET_NAME}提醒，${worker.name}。${message}` : "";
  const aiPrompt = worker && snapshot
    ? [
        `學員：${worker.name}（${worker.station}）`,
        `學習分數：${snapshot.learningScore}`,
        `已開始：${snapshot.started}/${snapshot.assigned} 張`,
        `掌握：${snapshot.mastered}/${snapshot.assigned} 張`,
        `今日複習：${snapshot.dueToday} 張`,
        `逾期複習：${snapshot.overdue} 張`,
        `弱項：${snapshot.weakParts.map((part) => part.nameZh).join("、") || "目前沒有紀錄"}`,
        `目前提醒：${message}`,
        `下一張：${nextPart?.nameZh ?? "沒有指定"}`
      ].join("\n")
    : "";

  useEffect(() => {
    setAiMessage("");
  }, [workerId]);

  useEffect(() => {
    if (!workerId || !spokenKey || !voiceMessage) return;
    if (spokenRef.current === spokenKey || wasReminderSpoken(spokenKey)) return;
    spokenRef.current = spokenKey;
    rememberReminder(spokenKey);
    speakZh(voiceMessage);
  }, [spokenKey, voiceMessage, workerId]);

  async function askHeadlessAssistant(): Promise<void> {
    if (aiBusy || !aiPrompt) return;
    setAiBusy(true);
    setAiMessage("");
    try {
      const answer = await askAlisHeadless(aiPrompt);
      setAiMessage(answer);
      speakZh(answer);
    } catch (error) {
      setAiMessage(
        error instanceof Error
          ? `本機 Codex 尚未啟動：${error.message}`
          : "本機 Codex 尚未啟動，請先執行 npm run ai:headless。"
      );
    } finally {
      setAiBusy(false);
    }
  }

  if (!worker || !snapshot || !queue) return null;

  return (
    <aside className={`alis-pet is-${mood}`} aria-label={`${PET_NAME}學習桌寵`}>
      {open ? (
        <div className="alis-pet-bubble" role="status">
          <button
            className="alis-pet-close"
            type="button"
            onClick={() => setOpen(false)}
            aria-label={`關閉${PET_NAME}提醒`}
          >
            ×
          </button>
          <small>{PET_NAME} · {worker.name}</small>
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
          {aiMessage ? <p className="alis-pet-ai-message"><strong>AI：</strong>{aiMessage}</p> : null}
          <div className="alis-pet-tools">
            <button className="alis-pet-voice" type="button" onClick={() => speakZh(voiceMessage)}>
              🔊 再說一次
            </button>
            <button
              className="alis-pet-voice"
              type="button"
              disabled={aiBusy}
              onClick={() => void askHeadlessAssistant()}
            >
              {aiBusy ? "⏳ Codex 思考中…" : "✨ 問學習小助手"}
            </button>
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
        aria-label={`${PET_NAME}：${message}`}
        aria-expanded={open}
      >
        <span
          className="alis-pet-sprite"
          style={{ backgroundImage: `url("${atlasUrl}")` }}
          aria-hidden="true"
        />
        {badge ? <b className="alis-pet-badge">{badge > 9 ? "9+" : badge}</b> : null}
        <span className="alis-pet-name">{PET_NAME}</span>
      </button>
    </aside>
  );
}
