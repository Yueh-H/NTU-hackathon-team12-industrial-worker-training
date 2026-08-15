const STORAGE_KEY = "sheet-train-v07-stars-v1";

const regions = [
  { id: "door", title: "門扇", titleId: "Daun pintu" },
  { id: "hinge", title: "鉸鏈／鎖", titleId: "Engsel / kunci" },
  { id: "size", title: "上方尺寸", titleId: "Ukuran" },
  { id: "item85", title: "8-5", titleId: "Item 8-5" },
  { id: "item810", title: "8-10", titleId: "Item 8-10" }
];

function emptyProgress() {
  return { speech: {}, quiz: {} };
}

function loadProgress() {
  if (typeof localStorage === "undefined") return emptyProgress();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "");
    if (!parsed || typeof parsed !== "object") return emptyProgress();
    return {
      speech: parsed.speech && typeof parsed.speech === "object" ? parsed.speech : {},
      quiz: parsed.quiz && typeof parsed.quiz === "object" ? parsed.quiz : {}
    };
  } catch (_) {
    return emptyProgress();
  }
}

function saveProgress(progress) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (_) {}
}

function quizScreens() {
  return screens.filter((screen) => screen.role === "quiz");
}

function cardsInRegion(regionId) {
  const ids = [];
  for (const screen of quizScreens()) {
    if (screen.regionId !== regionId || !screen.cardId) continue;
    if (!ids.includes(screen.cardId)) ids.push(screen.cardId);
  }
  return ids;
}

function questionsInRegion(regionId) {
  return quizScreens()
    .filter((screen) => screen.regionId === regionId)
    .map((screen) => screen.questionId);
}

function regionIndex(regionId) {
  return regions.findIndex((region) => region.id === regionId);
}

function isRegionComplete(progress, regionId) {
  const questions = questionsInRegion(regionId);
  return questions.length > 0 && questions.every((id) => progress.quiz[id]);
}

function cardHasSpeech(progress, cardId) {
  return Boolean(progress.speech[cardId]);
}

function cardStars(progress, cardId) {
  if (!cardHasSpeech(progress, cardId)) return 0;
  const screen = quizScreens().find((item) => item.cardId === cardId);
  if (screen && isRegionComplete(progress, screen.regionId)) return 2;
  return 1;
}

function regionStars(progress, regionId) {
  if (isRegionComplete(progress, regionId)) return 2;
  if (cardsInRegion(regionId).some((cardId) => cardHasSpeech(progress, cardId))) return 1;
  return 0;
}

function speechStarCount(progress) {
  return quizScreens().reduce((count, screen, index, list) => {
    if (!progress.speech[screen.cardId]) return count;
    if (list.findIndex((item) => item.cardId === screen.cardId) !== index) return count;
    return count + 1;
  }, 0);
}

function maxSpeechStars() {
  return cardsInRegion("door").length
    + cardsInRegion("hinge").length
    + cardsInRegion("size").length
    + cardsInRegion("item85").length
    + cardsInRegion("item810").length;
}

function completedRegionCount(progress) {
  return regions.filter((region) => isRegionComplete(progress, region.id)).length;
}

function canEnter(progress, targetIndex) {
  const target = screens[targetIndex];
  if (!target) return false;
  if (target.role === "intro") return true;
  if (target.role === "done") return regions.every((region) => isRegionComplete(progress, region.id));

  const targetRegionIdx = regionIndex(target.regionId);
  if (targetRegionIdx < 0) return true;
  for (let index = 0; index < targetRegionIdx; index += 1) {
    if (!isRegionComplete(progress, regions[index].id)) return false;
  }
  if (target.role === "quiz") {
    const earlier = screens.filter((screen, index) => (
      index < targetIndex && screen.regionId === target.regionId && screen.role === "quiz"
    ));
    if (earlier.some((screen) => !progress.quiz[screen.questionId])) return false;
  }
  return true;
}

function markSpeech(progress, cardId) {
  if (!cardId || progress.speech[cardId]) return progress;
  const next = { speech: { ...progress.speech, [cardId]: true }, quiz: { ...progress.quiz } };
  saveProgress(next);
  return next;
}

function markQuiz(progress, questionId) {
  if (!questionId || progress.quiz[questionId]) return progress;
  const next = { speech: { ...progress.speech }, quiz: { ...progress.quiz, [questionId]: true } };
  saveProgress(next);
  return next;
}

function resetProgress() {
  const next = emptyProgress();
  saveProgress(next);
  return next;
}

if (typeof window !== "undefined") {
  window.regions = regions;
  window.loadProgress = loadProgress;
  window.saveProgress = saveProgress;
  window.cardsInRegion = cardsInRegion;
  window.questionsInRegion = questionsInRegion;
  window.isRegionComplete = isRegionComplete;
  window.cardStars = cardStars;
  window.regionStars = regionStars;
  window.speechStarCount = speechStarCount;
  window.maxSpeechStars = maxSpeechStars;
  window.completedRegionCount = completedRegionCount;
  window.canEnter = canEnter;
  window.markSpeech = markSpeech;
  window.markQuiz = markQuiz;
  window.resetProgress = resetProgress;
}

if (typeof module !== "undefined") {
  module.exports = {
    STORAGE_KEY,
    regions,
    emptyProgress,
    cardsInRegion,
    questionsInRegion,
    isRegionComplete,
    cardStars,
    regionStars,
    speechStarCount,
    maxSpeechStars,
    completedRegionCount,
    canEnter,
    markSpeech,
    markQuiz,
    resetProgress
  };
}
