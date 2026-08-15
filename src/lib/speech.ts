export function speakZh(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = 0.92;
  const voices = window.speechSynthesis.getVoices();
  const chinese = voices.find((voice) => {
    const lang = voice.lang.toLowerCase();
    return lang.startsWith("zh-tw") || lang.startsWith("zh-hant") || lang.includes("taiwan");
  }) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("zh"));
  if (chinese) utterance.voice = chinese;
  window.speechSynthesis.speak(utterance);
}

export function stopZhSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: RecognitionAlternative;
}

interface RecognitionResultList {
  length: number;
  [index: number]: RecognitionResult;
}

interface RecognitionResultEvent extends Event {
  resultIndex: number;
  results: RecognitionResultList;
}

interface RecognitionErrorEvent extends Event {
  error: string;
}

interface RecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type RecognitionConstructor = new () => RecognitionInstance;

type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

export interface ChineseSpeechHandlers {
  onStart?: () => void;
  onInterim?: (transcript: string) => void;
  onSuccess: (transcript: string) => void;
  onError: (message: string) => void;
  onEnd?: () => void;
}

function getRecognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

export function isZhRecognitionSupported(): boolean {
  return Boolean(getRecognitionConstructor());
}

function zhSpeechStorageKey(employeeId: string, partId: string): string {
  return `workcard-zh-speech-v1:${employeeId}:${partId}`;
}

export function hasCompletedZhSpeech(employeeId: string, partId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(zhSpeechStorageKey(employeeId, partId)) === "done";
  } catch (_) {
    return false;
  }
}

export function saveCompletedZhSpeech(employeeId: string, partId: string): void {
  try {
    localStorage.setItem(zhSpeechStorageKey(employeeId, partId), "done");
  } catch (_) {}
}

export function zhSpeechTarget(value: string): string {
  const firstTerm = value.split(/[（／：]/)[0]?.trim();
  return firstTerm || value.trim();
}

export function normalizeSpeechText(value: string): string {
  const simplifiedToTraditional: Record<string, string> = {
    总: "總",
    识: "識",
    链: "鏈",
    侧: "側",
    锁: "鎖",
    条: "條",
    点: "點",
    压: "壓",
    边: "邊",
    丝: "絲",
    与: "與",
    颜: "顏"
  };
  return value
    .toLowerCase()
    .replace(/[\s，。！？、；：,.!?;:·／/]/g, "")
    .replace(/[总识链侧锁条点压边丝与颜]/g, (character) => simplifiedToTraditional[character] ?? character);
}

// Chrome can return a phonetically correct but visually different character.
// These groups cover common terms in this deck without adding a large pinyin dependency.
const HOMOPHONE_GROUPS = [
  "子字紫仔",
  "母木姆",
  "扇善山",
  "鉸交教膠腳",
  "鍊鏈練煉戀",
  "側策測色",
  "鎖所索",
  "玻波",
  "璃離梨",
  "壓押呀",
  "鍍渡度",
  "鋅心新辛",
  "鐵帖",
  "檔擋當",
  "門們",
  "封風峰",
  "邊編鞭",
  "珍真",
  "珠朱",
  "岩言",
  "防房",
  "火伙",
  "板版",
  "鈣蓋",
  "矽稀",
  "窗創"
] as const;

const HOMOPHONE_KEY: Record<string, string> = {};
for (const group of HOMOPHONE_GROUPS) {
  const key = group[0];
  for (const character of [...group]) HOMOPHONE_KEY[character] = key;
}

function phoneticSpeechKey(value: string): string {
  return [...normalizeSpeechText(value)]
    .filter((character) => /[\u3400-\u9fff]/.test(character))
    .map((character) => HOMOPHONE_KEY[character] ?? character)
    .join("");
}

export function matchesZhTarget(target: string, transcript: string): boolean {
  const normalizedTarget = normalizeSpeechText(target);
  const normalizedTranscript = normalizeSpeechText(transcript);
  const targetCharacters = [
    ...new Set([...normalizedTarget].filter((character) => /[\u3400-\u9fff]/.test(character)))
  ];
  const transcriptChinese = [...normalizedTranscript].filter((character) => /[\u3400-\u9fff]/.test(character));
  if (!targetCharacters.length || !transcriptChinese.length) return false;
  if (normalizedTranscript.includes(normalizedTarget)) return true;
  if (phoneticSpeechKey(normalizedTranscript).includes(phoneticSpeechKey(normalizedTarget))) return true;
  const matchedCount = targetCharacters.filter((character) => normalizedTranscript.includes(character)).length;
  const requiredCount = targetCharacters.length <= 2 ? targetCharacters.length : Math.ceil(targetCharacters.length * 0.75);
  return matchedCount >= requiredCount;
}

function recognitionErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    "not-allowed": "麥克風權限被拒絕，請在瀏覽器設定允許麥克風後再試。",
    "service-not-allowed": "語音辨識服務未被允許，請改用 Chrome／Edge 並再試。",
    "audio-capture": "找不到可用的麥克風，請確認裝置已連接。",
    "no-speech": "沒有聽到聲音，請看著卡片再朗讀一次。",
    network: "語音辨識服務連線失敗，請檢查網路後再試。"
  };
  return messages[error] ?? `語音辨識失敗（${error}），請再試一次。`;
}

export function recognizeZh(target: string, handlers: ChineseSpeechHandlers): () => void {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) {
    handlers.onError("此瀏覽器不支援中文語音辨識，請改用 Chrome／Edge；目前不能手動跳過。");
    return () => undefined;
  }

  const recognition = new Recognition();
  let cancelled = false;
  let completed = false;
  let reportedError = false;
  let finalTranscript = "";
  const finalAlternatives: string[] = [];
  recognition.lang = "zh-TW";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 5;
  recognition.onstart = () => {
    if (!cancelled) handlers.onStart?.();
  };
  recognition.onresult = (event) => {
    if (cancelled || completed) return;
    let interimTranscript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const alternatives = Array.from({ length: result.length }, (_, alternativeIndex) =>
        result[alternativeIndex]?.transcript ?? ""
      );
      const transcript = alternatives[0] ?? "";
      if (result.isFinal) finalTranscript += transcript;
      else interimTranscript += transcript;
      if (result.isFinal) finalAlternatives.push(...alternatives);
    }
    const shownTranscript = `${finalTranscript}${interimTranscript}`.trim();
    handlers.onInterim?.(shownTranscript);
    const recognized = [finalTranscript, ...finalAlternatives].some(
      (candidate) => candidate && matchesZhTarget(target, candidate)
    );
    if (finalTranscript && recognized) {
      completed = true;
      handlers.onSuccess(finalTranscript.trim());
      try { recognition.stop(); } catch (_) {}
    }
  };
  recognition.onerror = (event) => {
    if (cancelled || completed) return;
    reportedError = true;
    handlers.onError(recognitionErrorMessage(event.error));
  };
  recognition.onend = () => {
    if (cancelled || completed) {
      if (!cancelled) handlers.onEnd?.();
      return;
    }
    if (!reportedError) {
      handlers.onError(
        finalTranscript
          ? "沒有辨識到卡片上的中文詞語，請看著上方文字再朗讀一次。"
          : "沒有完成中文朗讀，請看著卡片再試一次。"
      );
    }
    handlers.onEnd?.();
  };
  try {
    recognition.start();
  } catch (_) {
    reportedError = true;
    handlers.onError("無法啟動麥克風，請確認瀏覽器權限後再試。");
  }

  return () => {
    cancelled = true;
    try { recognition.abort(); } catch (_) {}
  };
}
