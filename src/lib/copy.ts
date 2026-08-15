import type { ReviewStage } from "../engine/reviewEngine";
import type { QuizKind, Rating } from "../types";

export type StatusLabel = "new" | "due" | "overdue" | "learning" | "mastered";

export const STATUS_ZH: Record<StatusLabel, string> = {
  new: "未學",
  due: "今日應複習",
  overdue: "逾期",
  learning: "學習中",
  mastered: "已掌握"
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

export const RATING_ZH: Record<Rating | "", string> = {
  forgot: "忘記",
  fuzzy: "模糊",
  remembered: "記得",
  "": "—"
};

export const QUIZ_KIND_ZH: Record<QuizKind, string> = {
  image_to_name: "看圖選名稱",
  name_to_image: "看名稱選圖",
  hotspot: "在工單上點位置"
};
