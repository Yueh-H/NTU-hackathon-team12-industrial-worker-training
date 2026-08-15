import { trainingSet } from "../data/catalog";

export function LearnPick() {
  return (
    <div className="learn-empty">
      <p className="eyebrow">工單</p>
      <h1>{trainingSet.titleZh}</h1>
      <p>從左邊點一位員工，右邊就會打開他的學習路徑。</p>
    </div>
  );
}
