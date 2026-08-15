import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type Firestore,
  type Unsubscribe
} from "firebase/firestore";
import type { LearningModule, WorkOrder, WorkOrderBundle, WorkOrderRisk } from "../types";

const WORK_ORDERS = "work_orders";
const LEARNING_MODULES = "learning_modules";

function riskLevel(value: unknown): WorkOrderRisk {
  return value === "low" || value === "high" ? value : "medium";
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

export function workOrderToDoc(order: WorkOrder): Record<string, unknown> {
  return {
    id: order.id,
    orgId: order.orgId,
    title: order.title,
    docNo: order.docNo,
    rawContent: order.rawContent,
    summary: order.summary,
    riskLevel: order.riskLevel,
    status: order.status,
    model: order.model,
    reasoningEffort: order.reasoningEffort,
    analysisSource: order.analysisSource,
    createdBy: order.createdBy,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

export function docToWorkOrder(raw: Record<string, unknown>): WorkOrder {
  return {
    id: String(raw.id ?? ""),
    orgId: String(raw.orgId ?? "team12-demo"),
    title: String(raw.title ?? "未命名工單"),
    docNo: String(raw.docNo ?? ""),
    rawContent: String(raw.rawContent ?? ""),
    summary: String(raw.summary ?? ""),
    riskLevel: riskLevel(raw.riskLevel),
    status: "ready",
    model: String(raw.model ?? "gpt-5.6-luna"),
    reasoningEffort: "max",
    analysisSource: raw.analysisSource === "codex" ? "codex" : "demo-fallback",
    createdBy: String(raw.createdBy ?? "supervisor"),
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? "")
  };
}

export function moduleToDoc(module: LearningModule): Record<string, unknown> {
  return {
    id: module.id,
    workOrderId: module.workOrderId,
    order: module.order,
    title: module.title,
    objective: module.objective,
    steps: module.steps,
    safety: module.safety,
    checkQuestion: module.checkQuestion,
    checkAnswer: module.checkAnswer,
    estimatedMinutes: module.estimatedMinutes,
    sourceText: module.sourceText
  };
}

export function docToModule(raw: Record<string, unknown>, workOrderId: string): LearningModule {
  const order = Number(raw.order);
  const estimatedMinutes = Number(raw.estimatedMinutes);
  return {
    id: String(raw.id ?? ""),
    workOrderId: String(raw.workOrderId ?? workOrderId),
    order: Number.isFinite(order) ? order : 0,
    title: String(raw.title ?? "學習單元"),
    objective: String(raw.objective ?? ""),
    steps: stringList(raw.steps),
    safety: stringList(raw.safety),
    checkQuestion: String(raw.checkQuestion ?? ""),
    checkAnswer: String(raw.checkAnswer ?? ""),
    estimatedMinutes: Number.isFinite(estimatedMinutes) ? estimatedMinutes : 10,
    sourceText: String(raw.sourceText ?? "")
  };
}

function sortOrders(orders: WorkOrder[]): WorkOrder[] {
  return [...orders].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function loadWorkOrders(db: Firestore): Promise<WorkOrder[]> {
  const snapshot = await getDocs(collection(db, WORK_ORDERS));
  return sortOrders(snapshot.docs.map((item) => docToWorkOrder(item.data())));
}

export async function loadWorkOrderBundle(db: Firestore, workOrderId: string): Promise<WorkOrderBundle | null> {
  const orderSnapshot = await getDoc(doc(db, WORK_ORDERS, workOrderId));
  if (!orderSnapshot.exists()) return null;
  const moduleSnapshot = await getDocs(collection(db, WORK_ORDERS, workOrderId, LEARNING_MODULES));
  return {
    workOrder: docToWorkOrder(orderSnapshot.data()),
    modules: moduleSnapshot.docs
      .map((item) => docToModule(item.data(), workOrderId))
      .sort((a, b) => a.order - b.order)
  };
}

export async function saveWorkOrder(db: Firestore, bundle: WorkOrderBundle): Promise<void> {
  const orderRef = doc(db, WORK_ORDERS, bundle.workOrder.id);
  await setDoc(orderRef, workOrderToDoc(bundle.workOrder));
  const batch = writeBatch(db);
  for (const module of bundle.modules) {
    batch.set(doc(db, WORK_ORDERS, bundle.workOrder.id, LEARNING_MODULES, module.id), moduleToDoc(module));
  }
  await batch.commit();
}

export function listenWorkOrders(
  db: Firestore,
  onChange: (orders: WorkOrder[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, WORK_ORDERS),
    (snapshot) => onChange(sortOrders(snapshot.docs.map((item) => docToWorkOrder(item.data())))),
    (error) => onError(error)
  );
}
