import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { DrawingBoard } from "../components/DrawingBoard";
import { PartArt } from "../components/PartArt";
import { RatingBar } from "../components/RatingBar";
import { parts, partById, workerById } from "../data/catalog";
import { pickQuizKind } from "../engine/reviewEngine";
import { nameChoices, partChoices } from "../lib/quiz";
import type { Rating } from "../types";
import { useShop } from "../store";

export function LearnQuiz() {
  const { employeeId = "", partId = "" } = useParams();
  const worker = workerById(employeeId);
  const part = partById(partId);
  const { attemptsFor, states, submitSession } = useShop();
  const navigate = useNavigate();
  const [picked, setPicked] = useState("");
  const [checked, setChecked] = useState(false);
  const [rating, setRating] = useState<Rating | undefined>();
  const [done, setDone] = useState(false);

  const prior = worker && part ? attemptsFor(worker.id, part.id).length : 0;
  const kind = useMemo(() => pickQuizKind(prior), [prior]);
  const names = useMemo(() => (part ? nameChoices(part, parts) : []), [part]);
  const grid = useMemo(() => (part ? partChoices(part, parts) : []), [part]);

  if (!worker || !part) return <Navigate to="/learn" replace />;

  const correct =
    kind === "name_to_image" || kind === "hotspot" ? picked === part.id : picked === part.nameId;

  function lockAnswer(value: string) {
    if (checked) return;
    setPicked(value);
    setChecked(true);
    if (value !== (kind === "image_to_name" ? part!.nameId : part!.id)) {
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
    return (
      <main className="page">
        <header className="page-head">
          <p className="eyebrow">Selesai</p>
          <h1>{correct ? "Jawaban benar." : "Akan diulang besok."}</h1>
          <p>
            {rating === "remembered"
              ? "Jadwal D+1 / 3 / 7 / 30 tetap."
              : "Rescue besok ditambahkan. Milestone lama tidak dipindah."}
          </p>
        </header>
        <Link className="btn primary wide" to={`/learn/${worker.id}`}>
          Kembali ke tugas
        </Link>
        <button className="btn ghost wide" type="button" onClick={() => navigate(`/learn/${worker.id}/sheet`)}>
          Lihat gambar lagi
        </button>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-head compact">
        <p className="eyebrow">Kuis · {kind.replaceAll("_", " ")}</p>
        <h1>
          {kind === "image_to_name" && "Apa nama bagian ini?"}
          {kind === "name_to_image" && `Manakah ${part.nameId}?`}
          {kind === "hotspot" && `Sentuh posisi: ${part.nameId}`}
        </h1>
      </header>

      {kind === "image_to_name" ? (
        <>
          <PartArt partId={part.id} label={part.nameId} />
          <div className="choice-list">
            {names.map((name) => (
              <button
                key={name}
                type="button"
                className={`choice ${checked && name === part.nameId ? "is-right" : ""} ${
                  checked && name === picked && name !== part.nameId ? "is-wrong" : ""
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
              <img src={`/parts/${item.id}.png`} alt={item.nameId} />
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
          <p>{correct ? "Benar. Seberapa yakin?" : "Kurang tepat. Tandai Lupa atau Ragu-ragu."}</p>
          <RatingBar value={rating} onChange={setRating} />
          <button className="btn primary wide" type="button" disabled={!rating} onClick={finish}>
            Simpan hasil
          </button>
        </section>
      ) : (
        <p className="fine">Pilih jawaban dulu, baru penilaian Lupa / Ragu-ragu / Ingat.</p>
      )}

      <Link className="text-btn" to={`/learn/${worker.id}/part/${part.id}`}>
        Kembali ke kartu
      </Link>
    </main>
  );
}
