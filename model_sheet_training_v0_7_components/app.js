let current = 0;
let progress = loadProgress();
let speechState = "idle";
let transcript = "";
let speechError = "";
let justEarnedStar = false;
let cancelSpeech = null;
let toastTimer = 0;

function starGlyphs(count) {
  return `<span class="stars" aria-label="${count} 顆星"><span class="${count >= 1 ? "on" : "off"}">★</span><span class="${count >= 2 ? "on" : "off"}">★</span></span>`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function updateChrome() {
  const spoken = speechStarCount(progress);
  const maxStars = maxSpeechStars();
  const doneRegions = completedRegionCount(progress);
  document.getElementById("starTotal").innerHTML = `★ ${spoken}<small>/${maxStars}</small>`;
  document.getElementById("prog").style.width = ((doneRegions / regions.length) * 100).toFixed(0) + "%";
  document.getElementById("regionRail").innerHTML = regions.map((region) => {
    const stars = regionStars(progress, region.id);
    const complete = isRegionComplete(progress, region.id);
    const currentRegion = screens[current] && screens[current].regionId === region.id;
    const unlocked = canEnter(progress, screens.findIndex((screen) => screen.regionId === region.id));
    const state = complete ? "is-done" : currentRegion ? "is-now" : unlocked ? "is-open" : "is-locked";
    return `<button type="button" class="region-chip ${state}" data-region="${region.id}">
      <b>${region.title}</b>${starGlyphs(stars)}
    </button>`;
  }).join("");
}

function firstScreenOfRegion(regionId) {
  return screens.findIndex((screen) => screen.regionId === regionId);
}

function speechNeeded(screen) {
  return screen.role === "quiz" && screen.cardId && !progress.speech[screen.cardId];
}

function isFirstQuizOfCard(screen, index) {
  return screens.findIndex((item) => item.cardId === screen.cardId) === index;
}

function speechBlock(screen) {
  const supported = isZhRecognitionSupported();
  const target = zhSpeechTarget(screen.speechTarget || screen.nameZh || "");
  const spoken = progress.speech[screen.cardId];
  const regionDone = isRegionComplete(progress, screen.regionId);
  const state = !supported ? "unsupported" : spoken ? "complete" : speechState;
  if (spoken) {
    return `
      <section class="speech-mini">
        <span>★ 朗讀 +1</span>
        <b>${target}</b>
        <small>${regionDone ? "這一區已 2 顆星" : "全對才 2 星"}</small>
      </section>
    `;
  }
  const status = {
    idle: "尚未朗讀",
    listening: "辨識中…",
    complete: "已通過",
    error: "請再試一次",
    unsupported: "不支援"
  }[state];
  return `
    <section class="speech-gate speech-gate-${state}">
      <div class="speech-gate-head">
        <div>
          <p class="eyebrow">中文朗讀 · Baca Mandarin</p>
          <h3>請朗讀「${target}」</h3>
        </div>
        <span class="speech-status">${status}</span>
      </div>
      <p class="speech-target">${target}</p>
      <p class="fine">朗讀對了，這張卡得 1 顆星。這一區題全部答對，才會變成 2 顆星。</p>
      <div class="speech-actions">
        <button class="btn ghost" type="button" data-speak-zh="${target}">聽中文示範</button>
        <button class="btn ghost" type="button" data-speak-id="${screen.nameId || ""}">Dengar (ID)</button>
        <button class="btn primary" type="button" data-speech="1" ${!supported ? "disabled" : ""}>
          ${state === "listening" ? "停止辨識" : "🎙 開始朗讀"}
        </button>
      </div>
      <p class="speech-transcript">${transcript ? `辨識到：「${transcript}」` : state === "listening" ? "正在聆聽…" : "辨識結果會顯示在這裡。"}</p>
      ${speechError ? `<p class="warn">${speechError}</p>` : ""}
      ${!supported ? `<p class="fine">請用 Chrome／Edge 並允許麥克風。朗讀通過後才能作答。</p>` : ""}
    </section>
  `;
}

function cardStarRow(screen) {
  if (!screen.cardId) return "";
  const stars = cardStars(progress, screen.cardId);
  const regionDone = isRegionComplete(progress, screen.regionId);
  return `<div class="card-star-row">
    <span>${screen.nameZh || ""} · ${screen.nameId || ""}</span>
    ${starGlyphs(stars)}
    <small>${regionDone ? "這一區全部 2 顆星" : stars ? "朗讀 1 星，全對才 2 星" : "先朗讀拿 1 星"}</small>
  </div>`;
}

function renderDone() {
  const rows = regions.map((region) => {
    const stars = regionStars(progress, region.id);
    return `<div class="card dual"><b>${region.title} / ${region.titleId}</b>${starGlyphs(stars)}</div>`;
  }).join("");
  document.getElementById("screen").innerHTML = `
    <div class="kicker">完成 / Selesai</div>
    <h2>5 區全部 2 顆星</h2>
    <div class="sub">Semua zona mendapat 2 bintang</div>
    <div class="card center" style="padding:28px 18px">
      <div class="done-stars">★★</div>
      <div class="q">朗讀星星 ${speechStarCount(progress)} / ${maxSpeechStars()}</div>
      <div class="sub" style="margin-bottom:0">Bintang baca = satu per kartu</div>
    </div>
    ${rows}
    <div class="card dual">
      <b>請通知現場測試人員。</b>
      <span class="idn">Silakan beri tahu petugas pengujian.</span>
    </div>
  `;
}

function restoreQuiz(screen) {
  if (screen.role !== "quiz" || !progress.quiz[screen.questionId]) return;
  const box = document.querySelector(".feedback");
  if (!box) return;
  box.classList.add("show");
  box.style.borderColor = "#cfe3cb";
  box.style.background = "#f4fbf0";
  if (isRegionComplete(progress, screen.regionId) && !box.querySelector(".region-win")) {
    box.insertAdjacentHTML("beforeend", `<div class="region-win">這一區全部答對，現在是 2 顆星 / Zona ini 2 bintang</div>`);
  }
}

function render() {
  const screen = screens[current];
  if (!screen) {
    document.getElementById("screen").innerHTML =
      '<div class="card"><b>畫面載入錯誤 / Kesalahan memuat layar</b></div>';
    return;
  }
  if (screen.role === "done") {
    renderDone();
    updateChrome();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const locked = speechNeeded(screen);
  const body = `
    ${cardStarRow(screen)}
    ${screen.role === "quiz" && (speechNeeded(screen) || isFirstQuizOfCard(screen, current)) ? speechBlock(screen) : ""}
    <div class="${locked ? "quiz-locked" : ""}">
      ${screen.html}
    </div>
  `;
  document.getElementById("screen").innerHTML = `
    <div class="kicker">${screen.kind}</div>
    <h2>${screen.title}</h2>
    <div class="sub">${screen.sub}</div>
    ${body}
  `;
  restoreQuiz(screen);
  updateChrome();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function stopSpeech() {
  cancelSpeech?.();
  cancelSpeech = null;
}

function go(index) {
  const target = Math.max(0, Math.min(screens.length - 1, index));
  if (!canEnter(progress, target)) {
    showToast("先答對這一區全部題目，才會變成 2 顆星、才能進下一區。");
    return;
  }
  if (target !== current) {
    stopSpeech();
    speechState = "idle";
    transcript = "";
    speechError = "";
    justEarnedStar = false;
  }
  current = target;
  render();
}

function prev() {
  if (current > 0) go(current - 1);
}

function startOrStopSpeech() {
  const screen = screens[current];
  if (!screen || screen.role !== "quiz" || progress.speech[screen.cardId]) return;
  if (!isZhRecognitionSupported()) return;
  if (speechState === "listening") {
    stopSpeech();
    speechState = "idle";
    speechError = "已停止辨識，請再朗讀一次。";
    render();
    return;
  }
  const target = zhSpeechTarget(screen.speechTarget || screen.nameZh || "");
  speechState = "listening";
  transcript = "";
  speechError = "";
  render();
  cancelSpeech = recognizeZh(target, {
    onStart: () => {
      speechState = "listening";
    },
    onInterim: (value) => {
      transcript = value;
      const node = document.querySelector(".speech-transcript");
      if (node) node.textContent = `辨識到：「${value}」`;
    },
    onSuccess: (value) => {
      progress = markSpeech(progress, screen.cardId);
      justEarnedStar = true;
      transcript = value;
      speechError = "";
      speechState = "complete";
      cancelSpeech = null;
      render();
    },
    onError: (message) => {
      speechError = message;
      speechState = "error";
      render();
    },
    onEnd: () => {
      cancelSpeech = null;
      if (speechState === "listening") {
        speechState = "idle";
        render();
      }
    }
  });
}

function answer(ok, id) {
  const screen = screens[current];
  if (screen && speechNeeded(screen)) {
    showToast("先完成中文朗讀，這張卡才會得到 1 顆星。");
    return;
  }
  const box = document.getElementById(id);
  if (!box) return;
  if (!box.dataset.original) box.dataset.original = box.innerHTML;
  box.classList.add("show");
  if (ok) {
    if (screen && screen.questionId) progress = markQuiz(progress, screen.questionId);
    render();
  } else {
    box.style.borderColor = "#eed3d3";
    box.style.background = "#fff7f7";
    box.innerHTML = `<b>再試一次 / Coba lagi</b><br><span class="small">請再試一次。 / Coba lagi.</span>`;
  }
}

window.go = go;
window.prev = prev;
window.answer = answer;

document.addEventListener("click", function (event) {
  const resetTarget = event.target.closest("[data-reset]");
  if (resetTarget) {
    event.preventDefault();
    progress = resetProgress();
    current = 0;
    speechState = "idle";
    transcript = "";
    speechError = "";
    justEarnedStar = false;
    render();
    return;
  }
  const regionChip = event.target.closest("[data-region]");
  if (regionChip) {
    event.preventDefault();
    const index = firstScreenOfRegion(regionChip.dataset.region);
    if (index >= 0) go(index);
    return;
  }
  const speechBtn = event.target.closest("[data-speech]");
  if (speechBtn) {
    event.preventDefault();
    startOrStopSpeech();
    return;
  }
  const speakZhBtn = event.target.closest("[data-speak-zh]");
  if (speakZhBtn) {
    event.preventDefault();
    speakZh(speakZhBtn.dataset.speakZh);
    return;
  }
  const speakIdBtn = event.target.closest("[data-speak-id]");
  if (speakIdBtn) {
    event.preventDefault();
    if (speakIdBtn.dataset.speakId) speakId(speakIdBtn.dataset.speakId);
    return;
  }
  const goTarget = event.target.closest("[data-go]");
  if (goTarget) {
    event.preventDefault();
    go(Number(goTarget.dataset.go));
    return;
  }
  const prevTarget = event.target.closest("[data-prev]");
  if (prevTarget) {
    event.preventDefault();
    prev();
  }
});

render();
