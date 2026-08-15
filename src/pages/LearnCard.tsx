import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PartArt } from "../components/PartArt";
import { categoryLabels, partById, workerById } from "../data/catalog";
import { partStatusLabel } from "../engine/dashboard";
import { lessonById } from "../engine/path";
import { STATUS_ZH } from "../lib/copy";
import {
  hasCompletedZhSpeech,
  isZhRecognitionSupported,
  recognizeZh,
  saveCompletedZhSpeech,
  speakZh,
  zhSpeechTarget
} from "../lib/speech";
import { useShop } from "../store";

type SpeechState = "idle" | "listening" | "complete" | "error" | "unsupported";

const SPEECH_STATUS: Record<SpeechState, string> = {
  idle: "尚未朗讀",
  listening: "辨識中…",
  complete: "已通過",
  error: "請再試一次",
  unsupported: "不支援"
};

export function LearnCard() {
  const { employeeId = "", partId = "" } = useParams();
  const [params] = useSearchParams();
  const lesson = lessonById(params.get("lesson") ?? "");
  const worker = workerById(employeeId);
  const part = partById(partId);
  const { stateFor } = useShop();
  const navigate = useNavigate();
  const speechSupported = isZhRecognitionSupported();
  const [showId, setShowId] = useState(false);
  const [speechState, setSpeechState] = useState<SpeechState>(() => {
    if (!speechSupported) return "unsupported";
    return hasCompletedZhSpeech(employeeId, partId) ? "complete" : "idle";
  });
  const [justEarnedStar, setJustEarnedStar] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechError, setSpeechError] = useState("");
  const cancelSpeech = useRef<(() => void) | null>(null);

  useEffect(() => {
    setSpeechState(
      !speechSupported ? "unsupported" : hasCompletedZhSpeech(employeeId, partId) ? "complete" : "idle"
    );
    setJustEarnedStar(false);
    setTranscript("");
    setSpeechError("");
    return () => {
      cancelSpeech.current?.();
      cancelSpeech.current = null;
    };
  }, [employeeId, partId, speechSupported]);

  if (!worker || !part) return <Navigate to="/learn" replace />;
  const state = stateFor(worker.id, part.id);
  const status = partStatusLabel(state);
  const category = categoryLabels[part.category];
  const step = lesson ? lesson.partIds.indexOf(part.id) + 1 : 0;
  const speechComplete = speechState === "complete";
  const speechTarget = zhSpeechTarget(part.nameZh);
  const quizHref = `/learn/${worker.id}/quiz/${part.id}${lesson ? `?lesson=${lesson.id}` : ""}`;

  function startSpeech() {
    if (!worker || !part) return;
    if (speechState === "complete" || !speechSupported) return;
    if (speechState === "listening") {
      cancelSpeech.current?.();
      cancelSpeech.current = null;
      setSpeechState("idle");
      setSpeechError("已停止辨識，請再看著卡片朗讀一次。");
      return;
    }
    setSpeechState("listening");
    setTranscript("");
    setSpeechError("");
    cancelSpeech.current = recognizeZh(speechTarget, {
      onStart: () => setSpeechState("listening"),
      onInterim: (value) => setTranscript(value),
      onSuccess: (value) => {
        saveCompletedZhSpeech(worker.id, part.id);
        setJustEarnedStar(true);
        setTranscript(value);
        setSpeechError("");
        setSpeechState("complete");
      },
      onError: (message) => {
        setSpeechError(message);
        setSpeechState("error");
      },
      onEnd: () => {
        cancelSpeech.current = null;
        setSpeechState((current) => (current === "listening" ? "idle" : current));
      }
    });
  }

  return (
    <main className="page">
      <header className="page-head compact">
        <p className="eyebrow">
          {lesson
            ? `${categoryLabels[lesson.unit].zh} · ${lesson.title} · ${step}/${lesson.partIds.length}`
            : `${category.zh} · #${part.callout} · ${STATUS_ZH[status]}`}
        </p>
        <h1>{part.nameZh}</h1>
      </header>
      <PartArt part={part} label={part.nameZh} />
      <div className="name-block">
        <button className="btn ghost" type="button" onClick={() => speakZh(speechTarget)}>
          聽中文示範
        </button>
        <button className="btn ghost" type="button" onClick={() => setShowId((value) => !value)}>
          {showId ? "隱藏印尼文" : "顯示印尼文"}
        </button>
      </div>
      {showId ? <p className="zh-name">{part.nameId}</p> : null}

      <section className={`speech-gate speech-gate-${speechState}`} aria-labelledby="speechGateTitle">
        <div className="speech-gate-head">
          <div>
            <p className="eyebrow">中文語音辨識通關</p>
            <h2 id="speechGateTitle">請看著卡片，朗讀一次中文</h2>
          </div>
          <span className="speech-status">{SPEECH_STATUS[speechState]}</span>
        </div>
        <p className="speech-target" lang="zh-Hant">
          {speechTarget}
        </p>
        <p className="fine">按下麥克風，唸出上方中文。辨識成功會得到 1 顆星，並解鎖測驗。</p>
        <div className="speech-actions">
          <button
            className="btn primary"
            type="button"
            disabled={speechState === "complete" || speechState === "unsupported"}
            onClick={startSpeech}
          >
            {speechState === "listening" ? "停止辨識" : speechComplete ? "✓ 已完成朗讀" : "🎙 開始朗讀"}
          </button>
        </div>
        <p className="speech-transcript" aria-live="polite">
          {transcript ? `辨識到：「${transcript}」` : speechState === "listening" ? "正在聆聽…" : "辨識結果會顯示在這裡。"}
        </p>
        {speechComplete ? (
          <div className="speech-reward" role="status" aria-live="polite">
            <span className="speech-star" aria-hidden="true">★</span>
            <span>
              <strong>{justEarnedStar ? "+1 顆星" : "已獲得 1 顆星"}</strong>
              <small>中文朗讀完成</small>
            </span>
          </div>
        ) : null}
        {speechError ? <p className="backend-badge warn">{speechError}</p> : null}
        {!speechSupported ? (
          <p className="fine">請用支援 SpeechRecognition 的 Chrome／Edge 並允許麥克風；目前不能手動跳過。</p>
        ) : null}
      </section>

      {part.uncertain ? <p className="backend-badge warn">譯名尚未經現場師傅確認</p> : null}
      <section className="info-card">
        <h2>工單怎麼寫</h2>
        <p>{part.functionId}</p>
      </section>
      <section className="info-card danger">
        <h2>注意</h2>
        <p>{part.safetyId}</p>
      </section>
      <button
        className="btn primary wide"
        type="button"
        disabled={!speechComplete}
        onClick={() => navigate(quizHref)}
      >
        {speechComplete ? "開始測驗" : "先完成中文朗讀"}
      </button>
      <Link className="text-btn" to={`/learn/${worker.id}`}>
        回學習路徑
      </Link>
    </main>
  );
}
