const fs = require("fs");
const path = require("path");
const vm = require("vm");

const store = {};
const context = {
  console,
  localStorage: {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); }
  },
  window: undefined,
  module: { exports: {} }
};

vm.createContext(context);
for (const file of ["screens.js", "progress.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), "utf8"), context);
}

const {
  emptyProgress,
  markSpeech,
  markQuiz,
  cardStars,
  regionStars,
  speechStarCount,
  maxSpeechStars,
  isRegionComplete,
  canEnter,
  completedRegionCount
} = context.module.exports;

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

let progress = emptyProgress();
assert(maxSpeechStars() === 7, "should have 7 cards");
assert(speechStarCount(progress) === 0, "no stars yet");
assert(cardStars(progress, "daun-induk") === 0, "card starts at 0");
assert(regionStars(progress, "door") === 0, "region starts at 0");
assert(canEnter(progress, 1), "can start first region");
assert(!canEnter(progress, 4), "cannot skip to hinge teach");
assert(!canEnter(progress, 15), "cannot finish early");

progress = markSpeech(progress, "daun-induk");
assert(cardStars(progress, "daun-induk") === 1, "speech gives 1 star");
assert(regionStars(progress, "door") === 1, "region shows 1 after any speech");
assert(speechStarCount(progress) === 1, "total speech stars increment");
assert(!isRegionComplete(progress, "door"), "speech alone does not complete region");

assert(!canEnter(progress, 3), "cannot skip second door quiz before the first is correct");
progress = markQuiz(progress, "q-daun-induk");
assert(cardStars(progress, "daun-induk") === 1, "one quiz is still 1 star");
assert(canEnter(progress, 3), "second door quiz opens after the first is correct");

progress = markSpeech(progress, "daun-anak");
progress = markQuiz(progress, "q-daun-anak");
assert(isRegionComplete(progress, "door"), "all door quizzes complete the region");
assert(cardStars(progress, "daun-induk") === 2, "cards become 2 stars when region is done");
assert(cardStars(progress, "daun-anak") === 2, "all cards in region become 2 stars");
assert(regionStars(progress, "door") === 2, "region is 2 stars");
assert(canEnter(progress, 4), "next region unlocks after 2 stars");
assert(!canEnter(progress, 7), "later regions stay locked");

progress = markSpeech(progress, "sisi-engsel");
progress = markQuiz(progress, "q-sisi-engsel");
progress = markSpeech(progress, "engsel-induk");
progress = markQuiz(progress, "q-engsel-induk");
progress = markSpeech(progress, "ukuran-anak");
progress = markQuiz(progress, "q-ukuran-anak");
progress = markSpeech(progress, "baris-8-5");
progress = markQuiz(progress, "q-8-5-spec");
progress = markQuiz(progress, "q-8-5-qty");
assert(!isRegionComplete(progress, "item85"), "8-5 needs all three questions");
assert(cardStars(progress, "baris-8-5") === 1, "partial 8-5 stays 1 star");
progress = markQuiz(progress, "q-8-5-side");
assert(regionStars(progress, "item85") === 2, "8-5 becomes 2 stars after last question");
assert(cardStars(progress, "baris-8-5") === 2, "8-5 card becomes 2 stars");

progress = markSpeech(progress, "baris-8-10");
progress = markQuiz(progress, "q-8-10-use");
progress = markQuiz(progress, "q-8-10-door");
assert(completedRegionCount(progress) === 5, "all five regions complete");
assert(canEnter(progress, 15), "done screen opens after every region is 2 stars");
assert(speechStarCount(progress) === 7, "seven speech stars");

console.log("progress.test.js ok");
