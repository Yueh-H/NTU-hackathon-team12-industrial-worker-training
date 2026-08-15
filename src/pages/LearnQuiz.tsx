import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BiText, biLine } from "../components/BiText";
import { DrawingBoard } from "../components/DrawingBoard";
import { PartArt } from "../components/PartArt";
import { RatingBar } from "../components/RatingBar";
import { categoryLabels, parts, partById, workerById } from "../data/catalog";
import {
  cardCleared,
  firstOpenPart,
  lessonById,
  nextPartInLesson,
  nextUnit,
  unitForPart,
  unitPartIds
} from "../engine/path";
import { pickQuizKind } from "../engine/reviewEngine";
import { QUIZ_KIND_ID, QUIZ_KIND_ZH, t } from "../lib/copy";
import { nameChoices, partChoices } from "../lib/quiz";
import type { Rating } from "../types";
import { useShop } from "../store";

export function LearnQuiz() {
  const { employeeId = "", partId = "" } = useParams();
  const [params] = useSearchParams();
  const lesson = lessonById(params.get("lesson") ?? "");
  const worker = workerById(employeeId);
  const part = partById(partId);
  const { attemptsFor, states, submitSession } = useShop();
  const navigate = useNavigate();
  const [picked, setPicked] = useState("");
  const [checked, setChecked] = useState(false);
  const [rating, setRating] = useState<Rating | undefined>();
  const [done, setDone] = useState(false);

  const prior = worker && part ? attemptsFor(worker.id, part.id).length : 0;
  const kind = useMemo(() => pickQuizKind(prior, Boolean(part?.hotspot)), [prior, part]);
  const names = useMemo(() => (part ? nameChoices(part, parts) : []), [part]);
  const grid = useMemo(() => (part ? partChoices(part, parts) : []), [part]);

  if (!worker || !part) return <Navigate to="/learn" replace />;
  const unit = unitForPart(part.id);

  const correct =
    kind === "name_to_image" || kind === "hotspot" ? picked === part.id : picked === part.nameZh;

  function lockAnswer(value: string) {
    if (checked) return;
    setPicked(value);
    setChecked(true);
    if (value !== (kind === "image_to_name" ? part!.nameZh : part!.id)) {
      setRating("forgot");
    }
  }

  function finish() {
    if (!rating || !part || !worker) return;
    submitSession({
      employeeId: worker.id,
      partId: part.id,
      rating,
      quizKind: kind,
      quizCorrect: correct,
      response: picked
    });
    setDone(true);
  }

  if (done) {
    const mine = attemptsFor(worker.id);
    const unitNowClear = Boolean(
      unit &&
        unitPartIds(unit).every((id) =>
          id === part.id ? correct : cardCleared(mine, worker.id, id)
        )
    );
    const following = unitNowClear && unit ? nextUnit(unit) : undefined;
    const nextInLesson = lesson ? nextPartInLesson(lesson, part.id) : undefined;
    const title = unitNowClear
      ? t.unitAllStars(unit?.title ?? t.unitN(1).zh)
      : correct
        ? t.cardCorrect2
        : t.tryAgain;
    const body = unitNowClear ? t.unitAllCorrect : correct ? t.cardGot2 : t.wrongStay1;
    return (
      <main className="page">
        <header className="page-head">
          <p className="eyebrow">{biLine(unitNowClear ? t.unitClear : t.done)}</p>
          <BiText as="h1" {...title} />
          <BiText as="p" {...body} />
        </header>
        {following ? (
          <Link
            className="btn primary wide"
            to={`/learn/${worker.id}/part/${firstOpenPart(following.lessons[0], mine, worker.id)}?lesson=${following.lessons[0].id}`}
          >
            {biLine(t.nextUnit)} · {following.title}
          </Link>
        ) : nextInLesson && correct ? (
          <Link
            className="btn primary wide"
            to={`/learn/${worker.id}/part/${nextInLesson}?lesson=${lesson!.id}`}
          >
            {biLine(t.nextQuestion)} · {categoryLabels[lesson!.unit].zh}
          </Link>
        ) : (
          <Link className="btn primary wide" to={`/learn/${worker.id}`}>
            {biLine(t.backPath)}
          </Link>
        )}
        <button className="btn ghost wide" type="button" onClick={() => navigate(`/learn/${worker.id}`)}>
          {biLine(t.endStation)}
        </button>
      </main>
    );
  }

  const question =
    kind === "image_to_name"
      ? t.whatIsThis
      : kind === "name_to_image"
        ? t.whichImage(part.nameZh)
        : t.tapOnSheet(part.nameZh);

  return (
    <main className="page">
      <header className="page-head compact">
        <p className="eyebrow">
          {t.quiz.zh} / {t.quiz.idn} · {QUIZ_KIND_ZH[kind]} / {QUIZ_KIND_ID[kind]}
        </p>
        <BiText as="h1" {...question} />
      </header>

      {kind === "image_to_name" ? (
        <>
          <PartArt part={part} label={`${part.nameZh} / ${part.nameId}`} />
          <div className="choice-list">
            {names.map((name) => (
              <button
                key={name}
                type="button"
                className={`choice ${checked && name === part.nameZh ? "is-right" : ""} ${
                  checked && name === picked && name !== part.nameZh ? "is-wrong" : ""
                }`}
                onClick={() => lockAnswer(name)}
              >
                {name}
                {name === part.nameZh ? <span className="bi-idn" lang="id">{part.nameId}</span> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {kind === "name_to_image" ? (
        <div className="choice-grid">
          {grid.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`choice-tile ${checked && item.id === part.id ? "is-right" : ""} ${
                checked && item.id === picked && item.id !== part.id ? "is-wrong" : ""
              }`}
              onClick={() => lockAnswer(item.id)}
            >
              <PartArt part={item} label={`${item.nameZh} / ${item.nameId}`} />
            </button>
          ))}
        </div>
      ) : null}

      {kind === "hotspot" ? (
        <div className="sheet-scroller short">
          <div className="sheet-stage">
            <DrawingBoard
              states={states.filter((state) => state.employeeId === worker.id)}
              selectedId={picked}
              highlightId={checked ? part.id : undefined}
              wrongId={checked && !correct ? picked : undefined}
              onPick={(id) => lockAnswer(id)}
            />
          </div>
        </div>
      ) : null}

      {checked ? (
        <section className="rate-panel">
          <BiText as="p" {...(correct ? t.correctHowSure : t.wrongMark)} />
          <RatingBar value={rating} onChange={setRating} />
          <button className="btn primary wide" type="button" disabled={!rating} onClick={finish}>
            {biLine(t.saveResult)}
          </button>
        </section>
      ) : (
        <BiText as="p" className="fine" {...t.pickThenRate} />
      )}

      <Link className="text-btn" to={`/learn/${worker.id}/part/${part.id}${lesson ? `?lesson=${lesson.id}` : ""}`}>
        {biLine(t.backCard)}
      </Link>
    </main>
  );
}


