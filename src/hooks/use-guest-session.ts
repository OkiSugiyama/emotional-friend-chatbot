import { useCallback, useEffect, useRef, useState } from "react";
import type { GuestSession } from "../types";
import {
  GuestSessionStore,
  type GuestActivity,
  type GuestLoadResult,
} from "../domain/guest-storage";
import type { ClientError } from "../domain/errors";

export interface GuestSessionHook {
  loadResult: GuestLoadResult;
  session: GuestSession | null;
  persistenceWarning: ClientError | null;
  start(): GuestSession;
  update(
    activity: GuestActivity,
    updater: (session: GuestSession) => GuestSession,
  ): GuestSession | null;
  clear(): void;
  checkExpiry(): GuestLoadResult;
}

export interface UseGuestSessionOptions {
  onExpired?: () => void | Promise<void>;
}

export function useGuestSession(
  store: GuestSessionStore,
  options: UseGuestSessionOptions = {},
): GuestSessionHook {
  const onExpired = options.onExpired;
  const [state, setState] = useState(() => {
    const loadResult = store.load();
    return {
      loadResult,
      session: loadResult.kind === "restored" ? loadResult.session : null,
    };
  });
  const sessionRef = useRef<GuestSession | null>(state.session);
  const [persistenceWarning, setPersistenceWarning] = useState<ClientError | null>(null);

  const checkExpiry = useCallback(() => {
    const result = store.load();
    const nextSession = result.kind === "restored" ? result.session : null;
    sessionRef.current = nextSession;
    setState({ loadResult: result, session: nextSession });
    return result;
  }, [store]);

  useEffect(() => {
    if (state.loadResult.kind === "expired") void onExpired?.();
  }, [onExpired, state.loadResult.kind]);

  useEffect(() => {
    const timer = window.setInterval(checkExpiry, 30_000);
    const unsubscribe = store.observe(checkExpiry);
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [checkExpiry, store]);

  const start = useCallback(() => {
    const next = store.create();
    const result = store.save(next);
    sessionRef.current = next;
    setState({ loadResult: { kind: "restored", session: next }, session: next });
    setPersistenceWarning(result.kind === "quota-warning" ? result.error : null);
    return next;
  }, [store]);

  const update = useCallback(
    (activity: GuestActivity, updater: (current: GuestSession) => GuestSession) => {
      const current = sessionRef.current;
      if (!current) return null;
      const touched = store.touchIfActive(current, activity);
      if (touched.kind !== "active") {
        const loadResult: GuestLoadResult =
          touched.kind === "expired"
            ? { kind: "expired" }
            : { kind: "cleared-invalid", reason: "malformed" };
        sessionRef.current = null;
        setState({ loadResult, session: null });
        setPersistenceWarning(null);
        return null;
      }
      const next = updater(touched.session);
      const result = store.save(next);
      sessionRef.current = next;
      setState({ loadResult: { kind: "restored", session: next }, session: next });
      setPersistenceWarning(result.kind === "quota-warning" ? result.error : null);
      return next;
    },
    [store],
  );

  const clear = useCallback(() => {
    store.clear();
    sessionRef.current = null;
    setState({ loadResult: { kind: "empty" }, session: null });
    setPersistenceWarning(null);
  }, [store]);

  return {
    loadResult: state.loadResult,
    session: state.session,
    persistenceWarning,
    start,
    update,
    clear,
    checkExpiry,
  };
}
