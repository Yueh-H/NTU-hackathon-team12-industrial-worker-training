export type Role = "worker" | "supervisor";
export type Rating = "forgot" | "fuzzy" | "remembered";
export type ReviewKind = "milestone" | "rescue";
export type ReviewStatus = "pending" | "completed";
export type ItemStatus = "inbox" | "learning" | "mastered";
export type QuizKind = "image_to_name" | "name_to_image" | "hotspot";

export interface Profile {
  id: string;
  name: string;
  station: string;
  role: Role;
  language: "id" | "zh";
}

export interface TrainingSet {
  id: string;
  version: number;
  docNo: string;
  titleId: string;
  titleZh: string;
  machine: string;
  station: string;
  summaryId: string;
  summaryZh: string;
  active: boolean;
}

export type WorkOrderStatus = "ready";
export type WorkOrderRisk = "low" | "medium" | "high";
export type WorkOrderAnalysisSource = "codex" | "demo-fallback";

/** A boss-submitted order. Kept separate from the fixed vocabulary training set. */
export interface WorkOrder {
  id: string;
  orgId: string;
  title: string;
  docNo: string;
  rawContent: string;
  summary: string;
  riskLevel: WorkOrderRisk;
  status: WorkOrderStatus;
  model: string;
  reasoningEffort: "max";
  analysisSource: WorkOrderAnalysisSource;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** One employee-facing learning case generated from a work order. */
export interface LearningModule {
  id: string;
  workOrderId: string;
  order: number;
  title: string;
  objective: string;
  steps: string[];
  safety: string[];
  checkQuestion: string;
  checkAnswer: string;
  estimatedMinutes: number;
  sourceText: string;
}

export interface WorkOrderBundle {
  workOrder: WorkOrder;
  modules: LearningModule[];
}

export type CardCategory = "struktur" | "bahan" | "hardware" | "proses" | "lembar" | "baris";

/** One segment of a line-reading (baris) card: raw text on the sheet, Indonesian gloss, role label (zh). */
export interface LineSegment {
  seg: string;
  idn: string;
  role: string;
}

export interface Part {
  id: string;
  setId: string;
  version: number;
  callout: number;
  category: CardCategory;
  nameId: string;
  nameZh: string;
  nameEn: string;
  functionId: string;
  safetyId: string;
  icon: string | null;
  sheet: string | null;
  /** Non-empty only for baris (line-reading) cards. */
  segments: LineSegment[];
  hotspot: { x: number; y: number } | null;
  critical: boolean;
  uncertain: boolean;
}

export interface Assignment {
  employeeId: string;
  setId: string;
}

export interface Review {
  id: string;
  kind: ReviewKind;
  offset: number | null;
  dueDate: string;
  status: ReviewStatus;
  completedAt: string;
  rating: Rating | "";
  order: number;
}

export interface ReviewState {
  employeeId: string;
  partId: string;
  status: ItemStatus;
  learnedAt: string;
  lastReviewedAt: string;
  reviews: Review[];
  updatedAt: string;
}

export interface Attempt {
  id: string;
  employeeId: string;
  partId: string;
  reviewId: string;
  rating: Rating | "";
  quizKind: QuizKind | "self_rate";
  quizCorrect: boolean | null;
  response: string;
  completedAt: string;
}

export interface PersistShape {
  version: 1;
  savedAt: string;
  states: ReviewState[];
  attempts: Attempt[];
}
