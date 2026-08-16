import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildDemoProgress, parts } from "./data/catalog";
import { DEMO_WORK_ORDER_ID, demoWorkOrderBundle, withDemoWorkOrder } from "./data/demoSheet";
import { applySession, emptyState, makeAttempt, STORAGE_KEY } from "./engine/reviewEngine";
import type { Attempt, PersistShape, QuizKind, Rating, ReviewState, WorkOrderBundle, WorkOrderSourceFile } from "./types";

export type DataBackend = "local" | "cloud";

interface SubmitInput {
  employeeId: string;
  partId: string;
  rating: Rating;
  quizKind: QuizKind;
  quizCorrect: boolean;
  response?: string;
}

interface ShopContextValue {
  backend: DataBackend;
  ready: boolean;
  cloudError: string;
  workOrdersReady: boolean;
  workOrderError: string;
  workOrders: WorkOrderBundle["workOrder"][];
  states: ReviewState[];
  attempts: Attempt[];
  stateFor: (employeeId: string, partId: string) => ReviewState;
  attemptsFor: (employeeId: string, partId?: string) => Attempt[];
  submitSession: (input: SubmitInput) => ReviewState;
  loadWorkOrder: (workOrderId: string) => Promise<WorkOrderBundle | null>;
  saveWorkOrder: (bundle: WorkOrderBundle) => Promise<void>;
  uploadWorkOrderPdf: (workOrderId: string, file: File, pageCount: number) => Promise<WorkOrderSourceFile>;
  resetDemo: () => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);
const WORKORDER_STORAGE_KEY = "lembar-kerja-work-orders-v1";

function freshPersist(): PersistShape {
  const seeded = buildDemoProgress();
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    states: seeded.states,
    attempts: seeded.attempts
  };
}

function readPersist(): PersistShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshPersist();
    const parsed = JSON.parse(raw) as PersistShape;
    if (parsed.version !== 1 || !Array.isArray(parsed.states) || !Array.isArray(parsed.attempts)) {
      return freshPersist();
    }
    const seeded = buildDemoProgress();
    const existingEmployeeIds = new Set(parsed.states.map((state) => state.employeeId));
    const missingEmployeeIds = new Set(
      seeded.states
        .map((state) => state.employeeId)
        .filter((employeeId) => !existingEmployeeIds.has(employeeId))
    );
    if (!missingEmployeeIds.size) return parsed;
    const merged: PersistShape = {
      ...parsed,
      savedAt: new Date().toISOString(),
      states: [
        ...parsed.states,
        ...seeded.states.filter((state) => missingEmployeeIds.has(state.employeeId))
      ],
      attempts: [
        ...parsed.attempts,
        ...seeded.attempts.filter((attempt) => missingEmployeeIds.has(attempt.employeeId))
      ]
    };
    writePersist(merged);
    return merged;
  } catch {
    return freshPersist();
  }
}

function writePersist(value: PersistShape): void {
  const next = { ...value, savedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function readLocalWorkOrders(): WorkOrderBundle[] {
  try {
    const raw = localStorage.getItem(WORKORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkOrderBundle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalWorkOrders(value: WorkOrderBundle[]): void {
  localStorage.setItem(WORKORDER_STORAGE_KEY, JSON.stringify(value));
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [persist, setPersist] = useState<PersistShape>(() => {
    const initial = readPersist();
    if (!localStorage.getItem(STORAGE_KEY)) writePersist(initial);
    return initial;
  });
  const [workOrderRecords, setWorkOrderRecords] = useState<WorkOrderBundle[]>(() => readLocalWorkOrders());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setPersist(readPersist());
      if (event.key === WORKORDER_STORAGE_KEY) setWorkOrderRecords(readLocalWorkOrders());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const stateFor = useCallback(
    (employeeId: string, partId: string) =>
      persist.states.find((state) => state.employeeId === employeeId && state.partId === partId) ??
      emptyState(employeeId, partId),
    [persist.states]
  );

  const attemptsFor = useCallback(
    (employeeId: string, partId?: string) =>
      persist.attempts.filter(
        (attempt) => attempt.employeeId === employeeId && (!partId || attempt.partId === partId)
      ),
    [persist.attempts]
  );

  const submitSession = useCallback((input: SubmitInput) => {
    let saved: ReviewState = emptyState(input.employeeId, input.partId);
    setPersist((current) => {
      const existing =
        current.states.find((state) => state.employeeId === input.employeeId && state.partId === input.partId) ??
        emptyState(input.employeeId, input.partId);
      const nextState = applySession(existing, {
        rating: input.rating,
        quizCorrect: input.quizCorrect
      });
      saved = nextState;
      const attempt = makeAttempt({
        employeeId: input.employeeId,
        partId: input.partId,
        reviewId: nextState.reviews.find((review) => review.completedAt && review.rating === input.rating)?.id,
        rating: input.rating,
        quizKind: input.quizKind,
        quizCorrect: input.quizCorrect,
        response: input.response ?? ""
      });
      const states = [
        ...current.states.filter((state) => !(state.employeeId === input.employeeId && state.partId === input.partId)),
        nextState
      ];
      const next: PersistShape = {
        version: 1,
        savedAt: new Date().toISOString(),
        states,
        attempts: [...current.attempts, attempt]
      };
      writePersist(next);
      return next;
    });
    return saved;
  }, []);

  const loadWorkOrder = useCallback(
    async (workOrderId: string): Promise<WorkOrderBundle | null> => {
      const cached = withDemoWorkOrder(workOrderRecords).find((item) => item.workOrder.id === workOrderId);
      if (workOrderId === DEMO_WORK_ORDER_ID) return cached ?? demoWorkOrderBundle();
      return cached ?? null;
    },
    [workOrderRecords]
  );

  const saveWorkOrder = useCallback(async (bundle: WorkOrderBundle): Promise<void> => {
    setWorkOrderRecords((current) => {
      const next = [...current.filter((item) => item.workOrder.id !== bundle.workOrder.id), bundle];
      writeLocalWorkOrders(next);
      return next;
    });
  }, []);

  const uploadWorkOrderPdf = useCallback(
    async (workOrderId: string, file: File, pageCount: number): Promise<WorkOrderSourceFile> => ({
      name: file.name,
      storagePath: `local-only/work_orders/${workOrderId}/source.pdf`,
      downloadUrl: "",
      size: file.size,
      pageCount,
      uploadedAt: new Date().toISOString()
    }),
    []
  );

  const resetDemo = useCallback(() => {
    const next = freshPersist();
    writePersist(next);
    setPersist(next);
    writeLocalWorkOrders([]);
    setWorkOrderRecords([]);
  }, []);

  const value = useMemo<ShopContextValue>(
    () => ({
      backend: "local",
      ready: true,
      cloudError: "",
      workOrdersReady: true,
      workOrderError: "",
      workOrders: withDemoWorkOrder(workOrderRecords).map((item) => item.workOrder),
      states: persist.states,
      attempts: persist.attempts,
      stateFor,
      attemptsFor,
      submitSession,
      loadWorkOrder,
      saveWorkOrder,
      uploadWorkOrderPdf,
      resetDemo
    }),
    [workOrderRecords, persist, stateFor, attemptsFor, submitSession, loadWorkOrder, saveWorkOrder, uploadWorkOrderPdf, resetDemo]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used inside ShopProvider");
  return value;
}

export function ensurePartStates(employeeId: string, states: ReviewState[]): ReviewState[] {
  const have = new Set(states.filter((state) => state.employeeId === employeeId).map((state) => state.partId));
  const missing = parts.filter((part) => !have.has(part.id)).map((part) => emptyState(employeeId, part.id));
  return [...states.filter((state) => state.employeeId === employeeId), ...missing];
}
