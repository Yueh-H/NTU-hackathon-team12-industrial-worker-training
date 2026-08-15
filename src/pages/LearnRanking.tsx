import { Link, useSearchParams } from "react-router-dom";
import { BiText, biLine } from "../components/BiText";
import { trainingSet, workers } from "../data/catalog";
import { rankSnapshots, snapshotFor } from "../engine/dashboard";
import { t } from "../lib/copy";
import { percent } from "../lib/format";
import { usePageTitle } from "../lib/pageTitle";
import { useShop } from "../store";

const medals = ["🥇", "🥈", "🥉"];

export function LearnRanking() {
  usePageTitle(`${t.ranking.zh} / ${t.ranking.idn}`);
  const [params] = useSearchParams();
  const { states, attempts } = useShop();
  const ranking = rankSnapshots(workers.map((worker) => snapshotFor(worker, states, attempts)));
  const backTo = workers.some((worker) => worker.id === params.get("from"))
    ? `/learn/${params.get("from")}`
    : "/learn";

  return (
    <section className="ranking-stage">
      <header className="path-head ranking-head">
        <p className="eyebrow">{biLine(t.motivation)}</p>
        <BiText as="h1" {...t.rankingLong} />
        <p>
          {trainingSet.titleZh}
          <span className="bi-idn" lang="id">{trainingSet.titleId}</span>
        </p>
        <BiText as="p" className="fine" {...t.rankingHelp} />
        <Link className="btn ghost" to={backTo}>
          {biLine(t.backToPath)}
        </Link>
      </header>

      <section className="ranking-scheme">
        <div className="section-title-row">
          <h2>
            {t.scoreScheme.zh}
            <span className="bi-idn" lang="id">{t.scoreScheme.idn}</span>
          </h2>
          <span className="fine">100</span>
        </div>
        <ol className="score-parts">
          {t.scoreParts.map((part) => (
            <li key={part.zh}>
              <strong>{part.pts}</strong>
              <span>
                {part.zh}
                <span className="bi-idn" lang="id">{part.idn}</span>
              </span>
            </li>
          ))}
        </ol>
        <BiText as="p" className="fine" {...t.scoreZero} />
        <p className="score-future">
          <strong>{t.scoreFuture.zh}<span className="bi-idn" lang="id">{t.scoreFuture.idn}</span></strong>
          {t.scoreFutureFine.zh}
          <span className="bi-idn" lang="id">{t.scoreFutureFine.idn}</span>
        </p>
      </section>

      {ranking.length >= 3 ? (
        <ol className="ranking-podium" aria-label={biLine({ zh: "前三名", idn: "Tiga besar" })}>
          {ranking.slice(0, 3).map((snap, index) => (
            <li key={snap.employee.id} className={`ranking-podium-card place-${index + 1}`}>
              <span className="ranking-medal" aria-hidden="true">
                {medals[index]}
              </span>
              <strong>{snap.employee.name}</strong>
              <small>{snap.employee.station}</small>
              <b>{t.score(snap.learningScore).zh}</b>
              <small lang="id">{t.score(snap.learningScore).idn}</small>
            </li>
          ))}
        </ol>
      ) : null}

      <section className="ranking-board">
        <div className="ranking-board-head">
          <div>
            <p className="eyebrow">{biLine(t.thisCourse)}</p>
            <BiText as="h2" {...t.allLearners} />
          </div>
          <span>{t.people(ranking.length).zh} / {t.people(ranking.length).idn}</span>
        </div>
        <ol className="ranking-list">
          {ranking.map((snap, index) => (
            <li key={snap.employee.id} className="ranking-row">
              <span className="ranking-number">#{index + 1}</span>
              <div className="ranking-person">
                <strong>{snap.employee.name}</strong>
                <small>
                  {snap.employee.station} · {t.masteredOf(snap.mastered, snap.assigned).zh}
                  <span className="bi-idn" lang="id">{t.masteredOf(snap.mastered, snap.assigned).idn}</span>
                </small>
              </div>
              <div className="ranking-score">
                <strong>{t.score(snap.learningScore).zh}</strong>
                <small>
                  {t.accuracy.zh} {percent(snap.accuracy)}
                  <span className="bi-idn" lang="id">{t.accuracy.idn} {percent(snap.accuracy)}</span>
                </small>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
