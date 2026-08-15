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
}

export interface Part {
  id: string;
  setId: string;
  version: number;
  callout: number;
  nameId: string;
  nameZh: string;
  nameEn: string;
  functionId: string;
  safetyId: string;
  hotspot: { x: number; y: number };
  critical: boolean;
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
