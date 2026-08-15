// 在工訓 Web App 的 DevTools Console 執行，下載目前學習者的 AI Alis snapshot。
// 預設 Agus；需要其他人時，把 learnerId 改成 "budi"、"sari" 或其他 employee id。
(() => {
  const learnerId = "agus";
  const storageKey = "shop-trainer-v2";
  const raw = localStorage.getItem(storageKey);
  if (!raw) throw new Error("找不到 " + storageKey + "；請先在同一個瀏覽器開啟工訓頁面。");

  const persist = JSON.parse(raw);
  const states = Array.isArray(persist.states) ? persist.states : [];
  const attempts = Array.isArray(persist.attempts) ? persist.attempts : [];
  const mine = states.filter((state) => state.employeeId === learnerId);
  const today = new Date().toISOString().slice(0, 10);
  const dueFor = (state) =>
    (Array.isArray(state.reviews) ? state.reviews : [])
      .filter((review) => review.status === "pending")
      .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0];
  const overdue = mine.filter((state) => {
    const due = dueFor(state);
    return due && due.dueDate < today;
  });
  const dueToday = mine.filter((state) => {
    const due = dueFor(state);
    return due && due.dueDate === today;
  });
  const fresh = mine.filter((state) => state.status === "inbox");
  const mastered = mine.filter((state) => state.status === "mastered").length;
  const quizzes = attempts.filter(
    (attempt) => attempt.employeeId === learnerId && attempt.quizCorrect !== null
  );
  const accuracy = quizzes.length
    ? quizzes.filter((attempt) => attempt.quizCorrect === true).length / quizzes.length
    : null;
  const activity = [
    ...mine.flatMap((state) => [state.learnedAt, state.lastReviewedAt]),
    ...attempts.filter((attempt) => attempt.employeeId === learnerId).map((attempt) => attempt.completedAt)
  ].filter(Boolean).sort();
  const weakCounts = new Map();
  attempts
    .filter((attempt) => attempt.employeeId === learnerId)
    .filter((attempt) => attempt.quizCorrect === false || ["forgot", "fuzzy"].includes(attempt.rating))
    .forEach((attempt) => weakCounts.set(attempt.partId, (weakCounts.get(attempt.partId) || 0) + 1));
  const weakItems = [...weakCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([partId]) => partId);
  const next = overdue[0] || dueToday[0] || fresh[0];
  const snapshot = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    learnerID: learnerId,
    learnerName: learnerId,
    courseTitle: "防火門零件訓練",
    totalItems: mine.length || 64,
    freshItems: fresh.length,
    dueToday: dueToday.length,
    overdue: overdue.length,
    mastered,
    accuracy,
    streakDays: 0,
    lastActivityAt: activity.at(-1) || null,
    nextFocus: next ? "先做：" + next.partId : null,
    weakItems,
    source: "training-web"
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "learning-status.json";
  link.click();
  URL.revokeObjectURL(url);
  console.info("AI Alis snapshot 已下載：", snapshot);
})();
