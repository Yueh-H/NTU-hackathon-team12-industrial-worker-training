import { Link } from "react-router-dom";
import { BiText, biLine } from "../components/BiText";
import { BackendBadge } from "../components/BackendBadge";
import { t } from "../lib/copy";
import { usePageTitle } from "../lib/pageTitle";
import { useShop } from "../store";

export function Gate() {
  usePageTitle(`${t.gateTitle.zh} / ${t.gateTitle.idn}`);
  const { resetDemo } = useShop();
  return (
    <main className="page gate">
      <p className="eyebrow">Team 12 · NTU Hackathon</p>
      <BiText as="h1" zh={t.gateTitle.zh} idn={t.gateTitle.idn} />
      <p className="lede">
        {t.gateLede.zh}
        <span className="bi-idn" lang="id">
          {t.gateLede.idn}
        </span>
      </p>
      <BackendBadge />
      <div className="gate-actions">
        <Link className="btn primary" to="/learn">
          {biLine(t.workerLearn)}
        </Link>
        <Link className="btn dark" to="/admin">
          {biLine(t.bossPage)}
        </Link>
      </div>
      <BiText as="p" className="fine" zh={t.gateFine.zh} idn={t.gateFine.idn} />
      <button className="text-btn" type="button" onClick={resetDemo}>
        {biLine(t.resetDemo)}
      </button>
    </main>
  );
}
