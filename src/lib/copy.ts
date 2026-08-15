import { pendingReviews, reviewStageOf, shortDue, todayKey, type ReviewStage } from "../engine/reviewEngine";
import type { QuizKind, Rating, ReviewState } from "../types";

export type Bi = { zh: string; idn: string };

export type StatusLabel = "new" | "due" | "overdue" | "learning" | "mastered";

export const STATUS_ZH: Record<StatusLabel, string> = {
  new: "未學",
  due: "今日應複習",
  overdue: "逾期",
  learning: "學習中",
  mastered: "已掌握"
};

export const STATUS_ID: Record<StatusLabel, string> = {
  new: "Belum belajar",
  due: "Harus diulang hari ini",
  overdue: "Terlambat",
  learning: "Sedang belajar",
  mastered: "Sudah dikuasai"
};

export const REVIEW_STAGE_ZH: Record<ReviewStage, string> = {
  inbox: "未學",
  d1: "D+1",
  d3: "D+3",
  d7: "D+7",
  d30: "D+30",
  rescue: "隔日救援",
  mastered: "已掌握"
};

export const REVIEW_STAGE_ID: Record<ReviewStage, string> = {
  inbox: "Belum belajar",
  d1: "D+1",
  d3: "D+3",
  d7: "D+7",
  d30: "D+30",
  rescue: "Ulang besok",
  mastered: "Sudah dikuasai"
};

export const RATING_ZH: Record<Rating | "", string> = {
  forgot: "忘記",
  fuzzy: "模糊",
  remembered: "記得",
  "": "—"
};

export const RATING_ID: Record<Rating | "", string> = {
  forgot: "Lupa",
  fuzzy: "Ragu-ragu",
  remembered: "Ingat",
  "": "—"
};

export const QUIZ_KIND_ZH: Record<QuizKind, string> = {
  image_to_name: "看圖選名稱",
  name_to_image: "看名稱選圖",
  hotspot: "在工單上點位置"
};

export const QUIZ_KIND_ID: Record<QuizKind, string> = {
  image_to_name: "Lihat gambar, pilih nama",
  name_to_image: "Lihat nama, pilih gambar",
  hotspot: "Sentuh posisi di lembar"
};

export function reviewStageHintBi(state: ReviewState, day = todayKey()): Bi {
  const stage = reviewStageOf(state);
  if (stage === "inbox") return { zh: "未學", idn: "Belum belajar" };
  if (stage === "mastered") return { zh: "已掌握", idn: "Sudah dikuasai" };
  const next = pendingReviews(state)[0];
  const tag = REVIEW_STAGE_ZH[stage];
  const tagId = REVIEW_STAGE_ID[stage];
  if (next && next.dueDate < day) return { zh: `逾期 · ${tag}`, idn: `Terlambat · ${tagId}` };
  if (next && next.dueDate === day) return { zh: `今日 · ${tag}`, idn: `Hari ini · ${tagId}` };
  return next
    ? { zh: `${tag} · ${shortDue(next.dueDate)}`, idn: `${tagId} · ${shortDue(next.dueDate)}` }
    : { zh: tag, idn: tagId };
}

export const t = {
  gateTitle: { zh: "工程訓練單", idn: "Lembar latihan kerja" },
  workerLearn: { zh: "員工學習", idn: "Belajar karyawan" },
  supervisor: { zh: "主管監控", idn: "Pantauan supervisor" },
  gateFine: {
    zh: "已接 Firebase 時，手機學習、筆電看主管頁會打同一份資料。沒接就存在這個瀏覽器。",
    idn: "Kalau Firebase tersambung, HP dan laptop memakai data yang sama. Kalau tidak, data hanya di browser ini."
  },
  resetDemo: { zh: "重設示範資料", idn: "Reset data demo" },
  todayReview: { zh: "今天要複習", idn: "Harus diulang hari ini" },
  todayReviewDetail: { zh: "到期或逾期，系統會自動放進來提醒", idn: "Kartu jatuh tempo atau terlambat masuk ke sini" },
  learned: { zh: "已學習過", idn: "Sudah pernah belajar" },
  learnedDetail: { zh: "學過一次、還沒到下次複習日", idn: "Sudah belajar sekali, belum sampai hari ulang berikutnya" },
  pickStation: { zh: "選一站開始學", idn: "Pilih satu stasiun untuk mulai" },
  starRule: {
    zh: "每一張卡：朗讀 1 星，答對 2 星。這一關全部答對，關卡才會變成 2 顆星。",
    idn: "Setiap kartu: baca = 1 bintang, jawab benar = 2 bintang. Semua kartu di unit benar = unit 2 bintang."
  },
  ranking: { zh: "全員排行榜", idn: "Papan peringkat" },
  rankingLong: { zh: "全員學習排行榜", idn: "Papan peringkat semua orang" },
  rankingSee: { zh: "看全員學習積分", idn: "Lihat skor semua orang" },
  todayAlert: (n: number): Bi => ({
    zh: `今天有 ${n} 張要複習，先清這個收件夾。`,
    idn: `Hari ini ada ${n} kartu yang harus diulang. Selesaikan kotak ini dulu.`
  }),
  noToday: { zh: "今天沒有到期的複習。", idn: "Hari ini tidak ada kartu yang jatuh tempo." },
  noLearned: { zh: "學過一次、還沒到期的卡片會放這裡。", idn: "Kartu yang sudah pernah dipelajari, tapi belum jatuh tempo, ada di sini." },
  unitN: (n: number): Bi => ({ zh: `第 ${n} 關`, idn: `Unit ${n}` }),
  cleared: { zh: "已過關", idn: "Selesai" },
  checkpoint: (n: number): Bi => ({ zh: `檢核站 ${n}`, idn: `Pos ${n}` }),
  questions: (n: number): Bi => ({ zh: `${n} 題`, idn: `${n} soal` }),
  cardsCount: (n: number): Bi => ({ zh: `${n} 張`, idn: `${n} kartu` }),
  materials: { zh: "材料", idn: "Materi" },
  noDueToday: { zh: "今天沒有到期複習", idn: "Tidak ada ulangan jatuh tempo hari ini" },
  todayDueN: (n: number): Bi => ({ zh: `今天有 ${n} 張要複習`, idn: `Hari ini ${n} kartu harus diulang` }),
  workOrder: { zh: "工單", idn: "Lembar kerja" },
  expandRail: { zh: "展開工單", idn: "Buka daftar lembar" },
  collapseRail: { zh: "縮小工單", idn: "Tutup daftar lembar" },
  notOpen: { zh: "尚未開放", idn: "Belum dibuka" },
  listenZh: { zh: "聽中文示範", idn: "Dengar Mandarin" },
  listenId: { zh: "聽印尼文", idn: "Dengar (ID)" },
  flipBack: { zh: "翻面看印尼文", idn: "Balik ke Indonesia" },
  flipFront: { zh: "看正面", idn: "Lihat sisi depan" },
  onSheet: { zh: "在單子上長這樣", idn: "Di lembar terlihat seperti ini" },
  speechTitle: { zh: "請看著卡片，朗讀一次中文", idn: "Lihat kartu, baca Mandarin sekali" },
  speechEyebrow: { zh: "中文語音辨識", idn: "Pengenalan suara Mandarin" },
  speechHelp: {
    zh: "朗讀是加分，不是必過關。唸對得 1 顆星；也可以先去做測驗。",
    idn: "Membaca adalah nilai plus, bukan syarat. Benar = 1 bintang. Boleh langsung ke kuis."
  },
  startSpeech: { zh: "開始朗讀", idn: "Mulai baca" },
  stopSpeech: { zh: "停止辨識", idn: "Stop" },
  speechDone: { zh: "已完成朗讀", idn: "Sudah dibaca" },
  listening: { zh: "正在聆聽…", idn: "Sedang mendengar…" },
  speechIdle: { zh: "辨識結果會顯示在這裡。", idn: "Hasil pengenalan muncul di sini." },
  heard: (text: string): Bi => ({ zh: `辨識到：「${text}」`, idn: `Terdengar: “${text}”` }),
  startQuiz: { zh: "開始測驗", idn: "Mulai kuis" },
  backPath: { zh: "回學習路徑", idn: "Kembali ke jalur" },
  backCard: { zh: "回卡片", idn: "Kembali ke kartu" },
  backHome: { zh: "回首頁", idn: "Kembali ke beranda" },
  howWritten: { zh: "工單怎麼寫", idn: "Tulisan di lembar" },
  caution: { zh: "注意", idn: "Perhatian" },
  uncertain: { zh: "譯名尚未經現場師傅確認", idn: "Terjemahan belum dikonfirmasi mandor" },
  speechIdleStatus: { zh: "尚未朗讀", idn: "Belum dibaca" },
  speechListenStatus: { zh: "辨識中…", idn: "Mendeteksi…" },
  speechOkStatus: { zh: "已通過", idn: "Lulus" },
  speechErrStatus: { zh: "請再試一次", idn: "Coba lagi" },
  speechNoSupport: { zh: "不支援", idn: "Tidak didukung" },
  star2: { zh: "這張卡答對了，現在是 2 顆星。", idn: "Kartu ini benar. Sekarang 2 bintang." },
  star1: { zh: "朗讀 1 星。答對這張卡才 2 星。", idn: "Baca = 1 bintang. Jawab benar = 2 bintang." },
  star0: { zh: "朗讀對了得 1 顆星；答對這張卡得 2 顆星。", idn: "Baca benar = 1 bintang. Jawab benar = 2 bintang." },
  reviewAgain: {
    zh: "再測一次可提前推進下一站，原定期日期不搬。",
    idn: "Ulangi kuis bisa maju ke stasiun berikutnya lebih cepat. Tanggal tetap."
  },
  plus1: { zh: "+1 顆星", idn: "+1 bintang" },
  got1: { zh: "已獲得 1 顆星", idn: "Sudah dapat 1 bintang" },
  card2stars: { zh: "這張卡 2 顆星", idn: "Kartu ini 2 bintang" },
  speechAndQuiz: { zh: "朗讀完成，而且答對了", idn: "Sudah dibaca dan dijawab benar" },
  speechFinished: { zh: "中文朗讀完成", idn: "Bacaan Mandarin selesai" },
  noMic: {
    zh: "此瀏覽器沒有語音辨識。仍可直接開始測驗；要拿朗讀 1 星請改用 Chrome／Edge。",
    idn: "Browser ini tidak punya pengenalan suara. Kuis tetap bisa. Untuk 1 bintang baca, pakai Chrome/Edge."
  },
  quiz: { zh: "測驗", idn: "Kuis" },
  whatIsThis: { zh: "這是什麼？", idn: "Ini apa?" },
  whichImage: (name: string): Bi => ({ zh: `哪一張是「${name}」？`, idn: `Mana yang “${name}”?` }),
  tapOnSheet: (name: string): Bi => ({ zh: `請在工單上點出：${name}`, idn: `Sentuh di lembar: ${name}` }),
  correctHowSure: { zh: "答對。有多確定？", idn: "Benar. Seberapa yakin?" },
  wrongMark: { zh: "不對。請標成忘記或模糊。", idn: "Salah. Tandai lupa atau ragu." },
  pickThenRate: { zh: "先選答案，再自評忘記／模糊／記得。", idn: "Pilih jawaban, lalu nilai: lupa / ragu / ingat." },
  saveResult: { zh: "儲存結果", idn: "Simpan hasil" },
  unitClear: { zh: "關卡過關", idn: "Unit selesai" },
  done: { zh: "完成", idn: "Selesai" },
  unitAllStars: (title: string): Bi => ({ zh: `${title} ★★ 全過`, idn: `${title} ★★ selesai` }),
  cardCorrect2: { zh: "答對了，這張卡 2 顆星。", idn: "Benar. Kartu ini 2 bintang." },
  tryAgain: { zh: "還沒過關，請再試。", idn: "Belum lulus. Coba lagi." },
  unitAllCorrect: { zh: "這一關每一張卡都答對了。", idn: "Semua kartu di unit ini sudah benar." },
  cardGot2: {
    zh: "這張卡拿到 2 顆星。這一關全部答對，關卡才會變成 2 顆星。",
    idn: "Kartu ini 2 bintang. Unit jadi 2 bintang kalau semua kartunya benar."
  },
  wrongStay1: {
    zh: "答錯這張卡還是 1 顆星。答對才會變成 2 顆星。",
    idn: "Jawaban salah: masih 1 bintang. Benar baru jadi 2."
  },
  nextUnit: { zh: "下一關", idn: "Unit berikutnya" },
  nextQuestion: { zh: "下一題", idn: "Soal berikutnya" },
  endStation: { zh: "結束這一站", idn: "Selesai stasiun ini" },
  forgot: { zh: "忘記", idn: "Lupa" },
  forgotHint: { zh: "還沒記住", idn: "Belum ingat" },
  fuzzy: { zh: "模糊", idn: "Ragu-ragu" },
  fuzzyHint: { zh: "有印象但不穩", idn: "Ada kesan, belum yakin" },
  remembered: { zh: "記得", idn: "Ingat" },
  rememberedHint: { zh: "現場叫得出來", idn: "Bisa disebut di lapangan" },
  sheetTitle: { zh: "生產製造表", idn: "Lembar produksi" },
  sheetHelp: {
    zh: "橘色編號是圖上對得到的卡片。",
    idn: "Nomor oranye adalah kartu yang ada di gambar."
  },
  backToday: { zh: "回今天的任務", idn: "Kembali ke tugas hari ini" },
  motivation: { zh: "學習動力", idn: "Motivasi belajar" },
  rankingHelp: {
    zh: "掌握卡片、答對測驗與按時複習，會反映在學習積分上。",
    idn: "Kuasai kartu, jawab kuis, dan ulang tepat waktu. Itu jadi skor."
  },
  backToPath: { zh: "回到學習路徑", idn: "Kembali ke jalur belajar" },
  thisCourse: { zh: "本課程", idn: "Kursus ini" },
  allLearners: { zh: "所有學習者", idn: "Semua pembelajar" },
  people: (n: number): Bi => ({ zh: `${n} 人`, idn: `${n} orang` }),
  masteredOf: (a: number, b: number): Bi => ({ zh: `掌握 ${a}/${b} 張`, idn: `Dikuasai ${a}/${b}` }),
  score: (n: number): Bi => ({ zh: `${n} 分`, idn: `${n} poin` }),
  accuracy: { zh: "正確率", idn: "Akurasi" },
  adminPeople: { zh: "人員", idn: "Orang" },
  adminOverview: { zh: "全員總覽", idn: "Ringkasan semua orang" },
  adminOverviewFine: { zh: "一眼看完進度、弱項與掌握圖", idn: "Lihat progres, kelemahan, dan peta penguasaan" },
  adminWorkorders: { zh: "大工單 → 學習", idn: "Lembar besar → belajar" },
  adminWorkordersFine: { zh: "貼上工單，AI 拆成員工情境", idn: "Tempel lembar, AI jadi unit belajar" },
  adminCards: { zh: "編輯卡片", idn: "Edit kartu" },
  adminCardsFine: { zh: "單獨改每一張卡的名稱與提示", idn: "Ubah nama dan petunjuk tiap kartu" },
  adminMonitor: { zh: "主管監控", idn: "Pantauan supervisor" },
  adminCheck: { zh: "主管檢核", idn: "Cek supervisor" },
  editCards: { zh: "編輯卡片模組", idn: "Edit modul kartu" },
  woLoading: { zh: "正在準備這張工單的學習內容……", idn: "Menyiapkan isi belajar lembar ini…" },
  woMissing: { zh: "找不到學習內容。", idn: "Isi belajar tidak ditemukan." },
  backWorkerHome: { zh: "回員工首頁", idn: "Kembali ke beranda karyawan" },
  askPet: { zh: "問學習小助手", idn: "Tanya asisten belajar" },
  petReplyLang: { zh: "會用你的問題語言回答", idn: "Akan menjawab dalam bahasa pertanyaanmu" },
  petSpeak: { zh: "聽提醒", idn: "Dengar pengingat" },
  nextCard: { zh: "下一張卡", idn: "Kartu berikutnya" }
} as const;
