import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildDemoProgress, parts } from "./data/catalog";
import { ensureRemoteData, listenProgress, replaceProgress, upsertSession } from "./data/firebaseStore";
import {
  listenWorkOrders,
  loadWorkOrderBundle as loadRemoteWorkOrder,
  saveWorkOrder as saveRemoteWorkOrder
} from "./data/workorderStore";
import { uploadWorkOrderPdf as uploadRemoteWorkOrderPdf } from "./data/workorderStorage";
import { applySession, emptyState, makeAttempt, STORAGE_KEY } from "./engine/reviewEngine";
import { getDb, getFirebaseStorage, isCloudEnabled } from "./lib/firebase";
import type {
  Attempt,
  PersistShape,
  QuizKind,
  Rating,
  ReviewState,
  WorkOrderBundle,
  WorkOrderSourceFile
} from "./types";

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
  const cloud = isCloudEnabled();
  const [backend] = useState<DataBackend>(cloud ? "cloud" : "local");
  const [ready, setReady] = useState(!cloud);
  const [cloudError, setCloudError] = useState("");
  const [persist, setPersist] = useState<PersistShape>(() => (cloud ? {
    version: 1,
    savedAt: "",
    states: [],
    attempts: []
  } : (() => {
    const initial = readPersist();
    if (!localStorage.getItem(STORAGE_KEY)) writePersist(initial);
    return initial;
  })()));
  const [workOrderRecords, setWorkOrderRecords] = useState<WorkOrderBundle[]>(() =>
    cloud ? [] : readLocalWorkOrders()
  );
  const [workOrdersReady, setWorkOrdersReady] = useState(!cloud);
  const [workOrderError, setWorkOrderError] = useState("");

  useEffect(() => {
    if (!cloud) {
      const onStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) setPersist(readPersist());
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    const db = getDb();
    if (!db) return;
    let cancelled = false;
    let stop: (() => void) | undefined;
    void (async () => {
      try {
        const next = await ensureRemoteData(db);
        if (cancelled) return;
        setPersist(next);
        setCloudError("");
        setReady(true);
        stop = listenProgress(db, (live) => {
          if (!cancelled) setPersist(live);
        });
      } catch (error) {
        if (!cancelled) {
          setCloudError(error instanceof Error ? error.message : "Firebase 連線失敗");
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [cloud]);

  useEffect(() => {
    if (!cloud) {
      const onStorage = (event: StorageEvent) => {
        if (event.key === WORKORDER_STORAGE_KEY) setWorkOrderRecords(readLocalWorkOrders());
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    const db = getDb();
    if (!db) return;
    let cancelled = false;
    const stop = listenWorkOrders(
      db,
      (orders) => {
        if (cancelled) return;
        setWorkOrderRecords((current) =>
          orders.map((workOrder) => ({
            workOrder,
            modules: current.find((item) => item.workOrder.id === workOrder.id)?.modules ?? []
          }))
        );
        setWorkOrderError("");
        setWorkOrdersReady(true);
      },
      (error) => {
        if (!cancelled) {
          setWorkOrderError(error.message || "Firebase 工單資料讀取失敗");
          setWorkOrdersReady(true);
        }
      }
    );
    return () => {
      cancelled = true;
      stop();
    };
  }, [cloud]);

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
    let attempt: Attempt | null = null;
    setPersist((current) => {
      const existing =
        current.states.find((state) => state.employeeId === input.employeeId && state.partId === input.partId) ??
        emptyState(input.employeeId, input.partId);
      const nextState = applySession(existing, {
        rating: input.rating,
        quizCorrect: input.quizCorrect
      });
      saved = nextState;
      attempt = makeAttempt({
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
      if (!cloud) writePersist(next);
      return next;
    });
    if (cloud && attempt) {
      const db = getDb();
      if (db) {
        void upsertSession(db, saved, attempt).catch((error) => {
          setCloudError(error instanceof Error ? error.message : "寫入 Firebase 失敗");
        });
      }
    }
    return saved;
  }, [cloud]);

  const loadWorkOrder = useCallback(
    async (workOrderId: string): Promise<WorkOrderBundle | null> => {
      const cached = workOrderRecords.find((item) => item.workOrder.id === workOrderId);
      if (!cloud) return cached ?? null;
      const db = getDb();
      if (!db) return null;
      const remote = await loadRemoteWorkOrder(db, workOrderId);
      if (remote) {
        setWorkOrderRecords((current) => {
          const existing = current.find((item) => item.workOrder.id === workOrderId);
          if (
            existing &&
            existing.workOrder.updatedAt === remote.workOrder.updatedAt &&
            existing.modules.length === remote.modules.length
          ) {
            return current;
          }
          return [...current.filter((item) => item.workOrder.id !== workOrderId), remote];
        });
      }
      return remote;
    },
    [cloud, workOrderRecords]
  );

  const saveWorkOrder = useCallback(
    async (bundle: WorkOrderBundle): Promise<void> => {
      if (!cloud) {
        setWorkOrderRecords((current) => {
          const next = [...current.filter((item) => item.workOrder.id !== bundle.workOrder.id), bundle];
          writeLocalWorkOrders(next);
          return next;
        });
        return;
      }
      const db = getDb();
      if (!db) throw new Error("Firebase 尚未設定，無法儲存大工單。");
      await saveRemoteWorkOrder(db, bundle);
      setWorkOrderRecords((current) => [
        ...current.filter((item) => item.workOrder.id !== bundle.workOrder.id),
        bundle
      ]);
    },
    [cloud]
  );

  const uploadWorkOrderPdf = useCallback(
    async (workOrderId: string, file: File, pageCount: number): Promise<WorkOrderSourceFile> => {
      if (!cloud) {
        return {
          name: file.name,
          storagePath: `local-only/work_orders/${workOrderId}/source.pdf`,
          downloadUrl: "",
          size: file.size,
          pageCount,
          uploadedAt: new Date().toISOString()
        };
      }
      const storage = getFirebaseStorage();
      if (!storage) throw new Error("Firebase Storage 尚未設定，無法上傳 PDF。");
      return uploadRemoteWorkOrderPdf(storage, workOrderId, file, pageCount);
    },
    [cloud]
  );

  const resetDemo = useCallback(() => {
    const next = freshPersist();
    if (!cloud) {
      writePersist(next);
      setPersist(next);
      return;
    }
    const db = getDb();
    if (!db) return;
    void (async () => {
      try {
        await replaceProgress(db, next);
        setPersist(next);
        setCloudError("");
      } catch (error) {
        setCloudError(error instanceof Error ? error.message : "重設失敗");
      }
    })();
  }, [cloud]);

  const value = useMemo<ShopContextValue>(
    () => ({
      backend,
      ready,
      cloudError,
      workOrdersReady,
      workOrderError,
      workOrders: workOrderRecords.map((item) => item.workOrder),
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
    [
      backend,
      ready,
      cloudError,
      workOrdersReady,
      workOrderError,
      workOrderRecords,
      persist,
      stateFor,
      attemptsFor,
      submitSession,
      loadWorkOrder,
      saveWorkOrder,
      uploadWorkOrderPdf,
      resetDemo
    ]
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
