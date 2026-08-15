import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { QUIZ_KIND_ZH } from "../lib/copy";
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
    return (
      <main className="page">
        <header className="page-head">
          <p className="eyebrow">{unitNowClear ? "關卡過關" : "完成"}</p>
          <h1>
            {unitNowClear
              ? `${unit?.title ?? "這一關"} ★★ 全過`
              : correct
                ? "答對了，這張卡 2 顆星。"
                : "還沒過關，請再試。"}
          </h1>
          <p>
            {unitNowClear
              ? "這一關每一張卡都答對了。"
              : correct
                ? "這張卡拿到 2 顆星。這一關全部答對，關卡才會變成 2 顆星。"
                : "答錯這張卡還是 1 顆星。答對才會變成 2 顆星。"}
          </p>
        </header>
        {following ? (
          <Link
            className="btn primary wide"
            to={`/learn/${worker.id}/part/${firstOpenPart(following.lessons[0], mine, worker.id)}?lesson=${following.lessons[0].id}`}
          >
            下一關 · {following.title}
          </Link>
        ) : nextInLesson && correct ? (
          <Link
            className="btn primary wide"
            to={`/learn/${worker.id}/part/${nextInLesson}?lesson=${lesson!.id}`}
          >
            下一題 · {categoryLabels[lesson!.unit].zh}
          </Link>
        ) : (
          <Link className="btn primary wide" to={`/learn/${worker.id}`}>
            回學習路徑
          </Link>
        )}
        <button className="btn ghost wide" type="button" onClick={() => navigate(`/learn/${worker.id}`)}>
          結束這一站
        </button>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-head compact">
        <p className="eyebrow">測驗 · {QUIZ_KIND_ZH[kind]}</p>
        <h1>
          {kind === "image_to_name" && "這是什麼？"}
          {kind === "name_to_image" && `哪一張是「${part.nameZh}」？`}
          {kind === "hotspot" && `請在工單上點出：${part.nameZh}`}
        </h1>
      </header>

      {kind === "image_to_name" ? (
        <>
          <PartArt part={part} label={part.nameZh} />
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
              <PartArt part={item} label={item.nameZh} />
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
          <p>{correct ? "答對。有多確定？" : "不對。請標成忘記或模糊。"}</p>
          <RatingBar value={rating} onChange={setRating} />
          <button className="btn primary wide" type="button" disabled={!rating} onClick={finish}>
            儲存結果
          </button>
        </section>
      ) : (
        <p className="fine">先選答案，再自評忘記／模糊／記得。</p>
      )}

      <Link className="text-btn" to={`/learn/${worker.id}/part/${part.id}${lesson ? `?lesson=${lesson.id}` : ""}`}>
        回卡片
      </Link>
    </main>
  );
}
