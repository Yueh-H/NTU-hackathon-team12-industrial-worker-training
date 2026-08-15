import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BiText, biLine } from "../components/BiText";
import { FlipCard } from "../components/FlipCard";
import { sheetSrc } from "../components/PartArt";
import { StarPair } from "../components/StarPair";
import { categoryLabels, partById, workerById } from "../data/catalog";
import { cardStars, lessonById } from "../engine/path";
import { reviewStageOf } from "../engine/reviewEngine";
import { REVIEW_STAGE_ZH, reviewStageHintBi, t } from "../lib/copy";
import {
  hasCompletedZhSpeech,
  isZhRecognitionSupported,
  recognizeZh,
  saveCompletedZhSpeech,
  speakId,
  speakZh,
  zhSpeechTarget
} from "../lib/speech";
import { useShop } from "../store";

type SpeechState = "idle" | "listening" | "complete" | "error" | "unsupported";

const SPEECH_STATUS: Record<SpeechState, { zh: string; idn: string }> = {
  idle: t.speechIdleStatus,
  listening: t.speechListenStatus,
  complete: t.speechOkStatus,
  error: t.speechErrStatus,
  unsupported: t.speechNoSupport
};

export function LearnCard() {
  const { employeeId = "", partId = "" } = useParams();
  const [params] = useSearchParams();
  const lesson = lessonById(params.get("lesson") ?? "");
  const worker = workerById(employeeId);
  const part = partById(partId);
  const { stateFor, attempts } = useShop();
  const navigate = useNavigate();
  const speechSupported = isZhRecognitionSupported();
  const [flipped, setFlipped] = useState(false);
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
  const stage = reviewStageOf(state);
  const category = categoryLabels[part.category];
  const step = lesson ? lesson.partIds.indexOf(part.id) + 1 : 0;
  const speechComplete = speechState === "complete";
  const stars = cardStars(part.id, attempts, worker.id, speechComplete);
  const speechTarget = zhSpeechTarget(part.nameZh);
  const quizHref = `/learn/${worker.id}/quiz/${part.id}${lesson ? `?lesson=${lesson.id}` : ""}`;
  const crop = part.category === "baris" ? null : sheetSrc(part);
  const starCopy = stars === 2 ? t.star2 : speechComplete ? t.star1 : t.star0;
  const hint = reviewStageHintBi(state);
  const speechBtn =
    speechState === "listening" ? t.stopSpeech : speechComplete ? t.speechDone : t.startSpeech;

  function startSpeech() {
    if (!worker || !part) return;
    if (speechState === "complete" || !speechSupported) return;
    if (speechState === "listening") {
      cancelSpeech.current?.();
      cancelSpeech.current = null;
      setSpeechState("idle");
      setSpeechError(`${t.tryAgain.zh} / ${t.tryAgain.idn}`);
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
            ? `${category.zh} / ${category.idn} · ${step}/${lesson.partIds.length}`
            : `${category.zh} / ${category.idn} · #${part.callout}`}
          {` · ${REVIEW_STAGE_ZH[stage]}`}
        </p>
        <h1>
          {part.nameZh}
          <span className="bi-idn" lang="id">{part.nameId}</span>
        </h1>
        <p className="card-star-line">
          <StarPair count={stars} />
          <BiText zh={starCopy.zh} idn={starCopy.idn} />
        </p>
        {stage !== "inbox" ? (
          <BiText as="p" zh={`${hint.zh}。${t.reviewAgain.zh}`} idn={`${hint.idn}. ${t.reviewAgain.idn}`} />
        ) : null}
      </header>
      <FlipCard part={part} flipped={flipped} onFlip={() => setFlipped((value) => !value)} />
      <div className="name-block">
        <button className="btn ghost" type="button" onClick={() => speakZh(speechTarget)}>
          {biLine(t.listenZh)}
        </button>
        <button className="btn ghost" type="button" onClick={() => speakId(part.nameId)}>
          {biLine(t.listenId)}
        </button>
        <button className="btn ghost" type="button" onClick={() => setFlipped((value) => !value)}>
          {biLine(flipped ? t.flipFront : t.flipBack)}
        </button>
      </div>
      {crop ? (
        <section className="info-card">
          <BiText as="h2" {...t.onSheet} />
          <img className="sheet-crop" src={crop} alt={`${part.nameZh} / ${part.nameId}`} />
        </section>
      ) : null}

      <section className={`speech-gate speech-gate-${speechState}`} aria-labelledby="speechGateTitle">
        <div className="speech-gate-head">
          <div>
            <p className="eyebrow">{biLine(t.speechEyebrow)}</p>
            <BiText as="h2" {...t.speechTitle} />
          </div>
          <BiText as="span" className="speech-status" {...SPEECH_STATUS[speechState]} />
        </div>
        <p className="speech-target" lang="zh-Hant">
          {speechTarget}
        </p>
        <BiText as="p" className="fine" {...t.speechHelp} />
        <div className="speech-actions">
          <button
            className="btn primary"
            type="button"
            disabled={speechState === "complete" || speechState === "unsupported"}
            onClick={startSpeech}
          >
            {speechComplete ? "✓ " : speechState === "listening" ? "" : "🎙 "}
            {biLine(speechBtn)}
          </button>
        </div>
        <BiText
          as="p"
          className="speech-transcript"
          {...(transcript ? t.heard(transcript) : speechState === "listening" ? t.listening : t.speechIdle)}
        />
        {speechComplete ? (
          <div className="speech-reward" role="status" aria-live="polite">
            <span className="speech-star" aria-hidden="true">★</span>
            <span>
              <BiText
                as="strong"
                {...(stars === 2 ? t.card2stars : justEarnedStar ? t.plus1 : t.got1)}
              />
              <BiText
                as="small"
                {...(stars === 2 ? t.speechAndQuiz : t.speechFinished)}
              />
            </span>
          </div>
        ) : null}
        {speechError ? <p className="backend-badge warn">{speechError}</p> : null}
        {!speechSupported ? <BiText as="p" className="fine" {...t.noMic} /> : null}
      </section>

      {part.uncertain ? <p className="backend-badge warn">{biLine(t.uncertain)}</p> : null}
      <section className="info-card">
        <BiText as="h2" {...t.howWritten} />
        <p>{part.functionId}</p>
      </section>
      <section className="info-card danger">
        <BiText as="h2" {...t.caution} />
        <p>{part.safetyId}</p>
      </section>
      <button className="btn primary wide" type="button" onClick={() => navigate(quizHref)}>
        {biLine(t.startQuiz)}
      </button>
      <Link className="text-btn" to={`/learn/${worker.id}`}>
        {biLine(t.backPath)}
      </Link>
    </main>
  );
}
