import { useCallback, useEffect, useMemo, useState } from "react";
import type { EmotionContext } from "../types";
import {
  ExpressionStabilizer,
  UNAVAILABLE_EMOTION_CONTEXT,
} from "../domain/emotion";
import type { ClientError } from "../domain/errors";
import type {
  CameraEvent,
  CameraStopReason,
  LocalCameraExpressionAdapter,
} from "../services/camera-expression-adapter";

export type CameraPhase =
  | "closed"
  | "model-loading"
  | "permission-pending"
  | "running"
  | "no-face"
  | "unavailable"
  | "stopped";

export interface CameraExpressionHook {
  phase: CameraPhase;
  emotionContext: EmotionContext;
  emotionContextForSend: EmotionContext | undefined;
  useForReplies: boolean;
  error: ClientError | null;
  start(preview: HTMLVideoElement): Promise<void>;
  stop(reason?: CameraStopReason): Promise<void>;
  setUseForReplies(enabled: boolean): void;
}

export function useCameraExpression(
  adapter: LocalCameraExpressionAdapter,
): CameraExpressionHook {
  const stabilizer = useMemo(() => new ExpressionStabilizer(), []);
  const [phase, setPhase] = useState<CameraPhase>("closed");
  const [emotionContext, setEmotionContext] = useState<EmotionContext>({
    ...UNAVAILABLE_EMOTION_CONTEXT,
  });
  const [useForReplies, setUseForRepliesState] = useState(false);
  const [error, setError] = useState<ClientError | null>(null);

  const onEvent = useCallback(
    (event: CameraEvent) => {
      switch (event.type) {
        case "model-loading":
          setPhase("model-loading");
          setError(null);
          break;
        case "permission-pending":
          setPhase("permission-pending");
          break;
        case "started":
          setPhase("running");
          break;
        case "estimate":
          setEmotionContext(stabilizer.accept(event.estimate));
          setPhase("running");
          break;
        case "no-face":
          setEmotionContext(stabilizer.reset());
          setPhase("no-face");
          break;
        case "unavailable":
          setEmotionContext(stabilizer.reset());
          setUseForRepliesState(false);
          setError(event.error);
          setPhase("unavailable");
          break;
        case "stopped":
          setEmotionContext(stabilizer.reset());
          setUseForRepliesState(false);
          setPhase("stopped");
          break;
      }
    },
    [stabilizer],
  );

  const start = useCallback(
    async (preview: HTMLVideoElement) => {
      stabilizer.reset();
      setEmotionContext({ ...UNAVAILABLE_EMOTION_CONTEXT });
      setError(null);
      await adapter.start({ preview, onEvent });
    },
    [adapter, onEvent, stabilizer],
  );

  const stop = useCallback(
    (reason: CameraStopReason = "user") => adapter.stop(reason),
    [adapter],
  );

  const setUseForReplies = useCallback((enabled: boolean) => {
    setUseForRepliesState(enabled);
  }, []);

  useEffect(() => () => void adapter.stop("unmount"), [adapter]);

  return {
    phase,
    emotionContext,
    emotionContextForSend:
      useForReplies && emotionContext.label !== "unavailable" ? emotionContext : undefined,
    useForReplies,
    error,
    start,
    stop,
    setUseForReplies,
  };
}

