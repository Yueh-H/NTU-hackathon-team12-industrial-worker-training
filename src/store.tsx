import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildDemoProgress, parts } from "./data/catalog";
import { applySession, emptyState, makeAttempt, STORAGE_KEY } from "./engine/reviewEngine";
import type { Attempt, PersistShape, QuizKind, Rating, ReviewState } from "./types";

interface SubmitInput {
  employeeId: string;
  partId: string;
  rating: Rating;
  quizKind: QuizKind;
  quizCorrect: boolean;
  response?: string;
}

interface ShopContextValue {
  states: ReviewState[];
  attempts: Attempt[];
  stateFor: (employeeId: string, partId: string) => ReviewState;
  attemptsFor: (employeeId: string, partId?: string) => Attempt[];
  submitSession: (input: SubmitInput) => ReviewState;
  resetDemo: () => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

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
    return parsed;
  } catch {
    return freshPersist();
  }
}

function writePersist(value: PersistShape): void {
  const next = { ...value, savedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [persist, setPersist] = useState<PersistShape>(() => {
    const initial = readPersist();
    if (!localStorage.getItem(STORAGE_KEY)) writePersist(initial);
    return initial;
  });

  const reload = useCallback(() => {
    setPersist(readPersist());
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [reload]);

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

  const resetDemo = useCallback(() => {
    const next = freshPersist();
    writePersist(next);
    setPersist(next);
  }, []);

  const value = useMemo<ShopContextValue>(
    () => ({
      states: persist.states,
      attempts: persist.attempts,
      stateFor,
      attemptsFor,
      submitSession,
      resetDemo
    }),
    [persist, stateFor, attemptsFor, submitSession, resetDemo]
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
