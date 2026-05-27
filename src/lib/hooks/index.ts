// ============================================================
// DUOLINGO CLASSROOM CHAT — Custom Type-Safe Hooks
// ============================================================

"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage, ModerationResult } from "@/types";
import { moderateContent } from "@/lib/validation/moderation";
import {
  ApiClientError,
  ContentSafetyError,
  ValidationError,
} from "@/lib/api/client";

// ─── useMessages Hook ────────────────────────────────────────

interface UseMessagesReturn {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  removeMessage: (id: string) => void;
}

export function useMessages(initial: ChatMessage[] = []): UseMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);

  const addMessage = useCallback((message: ChatMessage): void => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const removeMessage = useCallback((id: string): void => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { messages, addMessage, removeMessage };
}

// ─── useContentModeration Hook ───────────────────────────────

interface UseModerationReturn {
  moderate: (content: string) => ModerationResult;
  lastResult: ModerationResult | null;
  isSafe: boolean;
}

export function useContentModeration(): UseModerationReturn {
  const [lastResult, setLastResult] = useState<ModerationResult | null>(null);

  const moderate = useCallback((content: string): ModerationResult => {
    const result = moderateContent(content);
    setLastResult(result);
    return result;
  }, []);

  const isSafe =
    lastResult === null ||
    lastResult.action === "allow" ||
    lastResult.action === "warn";

  return { moderate, lastResult, isSafe };
}

// ─── useApiError Hook ────────────────────────────────────────

interface ApiErrorState {
  message: string | null;
  fieldErrors: Record<string, string[]>;
  code: string | null;
}

interface UseApiErrorReturn {
  errorState: ApiErrorState;
  handleError: (err: unknown) => void;
  clearError: () => void;
}

const INITIAL_ERROR_STATE: ApiErrorState = {
  message: null,
  fieldErrors: {},
  code: null,
};

export function useApiError(): UseApiErrorReturn {
  const [errorState, setErrorState] =
    useState<ApiErrorState>(INITIAL_ERROR_STATE);

  const handleError = useCallback((err: unknown): void => {
    if (err instanceof ValidationError) {
      setErrorState({
        message: "Please fix the errors below",
        fieldErrors: err.details ?? {},
        code: err.code,
      });
    } else if (err instanceof ContentSafetyError) {
      setErrorState({
        message: `Your message was flagged: ${err.reason}`,
        fieldErrors: {},
        code: err.code,
      });
    } else if (err instanceof ApiClientError) {
      setErrorState({
        message: err.message,
        fieldErrors: err.details ?? {},
        code: err.code,
      });
    } else if (err instanceof Error) {
      setErrorState({
        message: err.message,
        fieldErrors: {},
        code: "UNKNOWN_ERROR",
      });
    } else {
      setErrorState({
        message: "An unexpected error occurred",
        fieldErrors: {},
        code: "UNKNOWN_ERROR",
      });
    }
  }, []);

  const clearError = useCallback((): void => {
    setErrorState(INITIAL_ERROR_STATE);
  }, []);

  return { errorState, handleError, clearError };
}

// ─── useDebounce Hook ────────────────────────────────────────

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const update = useCallback(
    (newValue: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setDebouncedValue(newValue);
      }, delayMs);
    },
    [delayMs],
  );

  // Update when value changes
  if (value !== debouncedValue) {
    update(value);
  }

  return debouncedValue;
}
