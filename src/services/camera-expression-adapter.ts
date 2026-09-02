import {
  CAMERA_MODEL_PATH,
  CAMERA_MODEL_VERSION,
  EXPRESSION_SAMPLE_INTERVAL_MS,
} from "../domain/constants";
import { ClientError } from "../domain/errors";
import { normalizeExpressionLabel, type RawExpressionEstimate } from "../domain/emotion";

interface FaceExpressionResult {
  expressions: {
    asSortedArray(): Array<{ expression: string; probability: number }>;
  };
}

interface FaceApiLike {
  nets: {
    tinyFaceDetector: { isLoaded: boolean; loadFromUri(uri: string): Promise<void> };
    faceExpressionNet: { isLoaded: boolean; loadFromUri(uri: string): Promise<void> };
  };
  TinyFaceDetectorOptions: new (options?: { inputSize?: number; scoreThreshold?: number }) => unknown;
  detectSingleFace(
    input: HTMLVideoElement,
    options: unknown,
  ): { withFaceExpressions(): Promise<FaceExpressionResult | undefined> };
}

export type CameraStopReason =
  | "user"
  | "sign-out"
  | "guest-expiry"
  | "unmount"
  | "page-hidden"
  | "fatal-error"
  | "restart";

export type CameraEvent =
  | { type: "model-loading" }
  | { type: "permission-pending" }
  | { type: "started"; modelVersion: string }
  | { type: "estimate"; estimate: RawExpressionEstimate }
  | { type: "no-face"; observedAt: string }
  | { type: "unavailable"; error: ClientError }
  | { type: "stopped"; reason: CameraStopReason };

export interface CameraStartOptions {
  preview: HTMLVideoElement;
  onEvent: (event: CameraEvent) => void;
  signal?: AbortSignal;
}

export interface CameraAdapterOptions {
  modelPath?: string;
  sampleIntervalMs?: number;
  loadFaceApi?: () => Promise<FaceApiLike>;
  mediaDevices?: Pick<MediaDevices, "getUserMedia">;
  document?: Document;
  location?: Pick<Location, "origin" | "hostname">;
  secureContext?: boolean;
  now?: () => number;
}

function mapCameraError(error: unknown): ClientError {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return new ClientError({
      code: "CAMERA_PERMISSION_DENIED",
      message:
        "Your browser blocked camera access. Allow the camera for this site, then try again. You can keep chatting without it.",
      cause: error,
    });
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return new ClientError({
      code: "CAMERA_DEVICE_UNAVAILABLE",
      message: "No camera was found. Connect one and try again, or keep chatting.",
      cause: error,
    });
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return new ClientError({
      code: "CAMERA_DEVICE_BUSY",
      message: "The camera is in use by another app. Close it there, then try again.",
      cause: error,
    });
  }
  if (name === "SecurityError") {
    return new ClientError({
      code: "CAMERA_INSECURE_CONTEXT",
      message: "Camera access is unavailable on this connection. You can keep chatting without it.",
      cause: error,
    });
  }
  return new ClientError({
    code: "CAMERA_INFERENCE_FAILED",
    message: "Expression context is unavailable. You can keep chatting without it.",
    cause: error,
  });
}

function stopTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export class LocalCameraExpressionAdapter {
  private readonly modelPath: string;
  private readonly sampleIntervalMs: number;
  private readonly loadFaceApi: () => Promise<FaceApiLike>;
  private readonly mediaDevices?: Pick<MediaDevices, "getUserMedia">;
  private readonly document: Document;
  private readonly location: Pick<Location, "origin" | "hostname">;
  private readonly secureContext: boolean;
  private readonly now: () => number;

  private faceApi: FaceApiLike | null = null;
  private modelLoad: Promise<FaceApiLike> | null = null;
  private stream: MediaStream | null = null;
  private preview: HTMLVideoElement | null = null;
  private timer: number | null = null;
  private generation = 0;
  private running = false;
  private onEvent: ((event: CameraEvent) => void) | null = null;
  private abortSignal: AbortSignal | null = null;

  constructor(options: CameraAdapterOptions = {}) {
    this.modelPath = options.modelPath ?? CAMERA_MODEL_PATH;
    this.sampleIntervalMs = options.sampleIntervalMs ?? EXPRESSION_SAMPLE_INTERVAL_MS;
    if (this.sampleIntervalMs < EXPRESSION_SAMPLE_INTERVAL_MS) {
      throw new Error(`Camera sampling must be at least ${EXPRESSION_SAMPLE_INTERVAL_MS}ms.`);
    }
    this.loadFaceApi =
      options.loadFaceApi ??
      (async () => (await import("@vladmandic/face-api")) as unknown as FaceApiLike);
    this.mediaDevices = options.mediaDevices ?? navigator.mediaDevices;
    this.document = options.document ?? document;
    this.location = options.location ?? window.location;
    this.secureContext = options.secureContext ?? globalThis.isSecureContext === true;
    this.now = options.now ?? Date.now;
  }

  isRunning(): boolean {
    return this.running;
  }

  async start(options: CameraStartOptions): Promise<void> {
    await this.stop("restart", false);
    const run = ++this.generation;
    this.preview = options.preview;
    this.onEvent = options.onEvent;
    this.abortSignal = options.signal ?? null;
    options.signal?.addEventListener("abort", this.onAbort, { once: true });
    this.document.addEventListener("visibilitychange", this.onVisibilityChange);

    if (!this.secureContext) {
      await this.fail(
        new ClientError({
          code: "CAMERA_INSECURE_CONTEXT",
          message: "Camera access needs a secure connection. You can keep chatting without it.",
        }),
      );
      return;
    }
    if (!this.mediaDevices?.getUserMedia) {
      await this.fail(
        new ClientError({
          code: "CAMERA_UNSUPPORTED",
          message: "This browser cannot use local expression context. You can keep chatting without it.",
        }),
      );
      return;
    }
    if (this.document.hidden) {
      await this.stop("page-hidden");
      return;
    }

    try {
      this.onEvent?.({ type: "model-loading" });
      const faceApi = await this.loadModels();
      if (run !== this.generation || options.signal?.aborted) return;

      this.onEvent?.({ type: "permission-pending" });
      const stream = await this.mediaDevices.getUserMedia({ video: true, audio: false });
      if (run !== this.generation || options.signal?.aborted || this.document.hidden) {
        stopTracks(stream);
        if (run === this.generation) await this.stop("page-hidden");
        return;
      }

      this.stream = stream;
      options.preview.srcObject = stream;
      options.preview.muted = true;
      options.preview.autoplay = true;
      options.preview.playsInline = true;
      await options.preview.play();
      if (run !== this.generation) return;

      this.faceApi = faceApi;
      this.running = true;
      this.onEvent?.({ type: "started", modelVersion: CAMERA_MODEL_VERSION });
      void this.sample(run);
    } catch (error) {
      if (run !== this.generation || options.signal?.aborted) return;
      await this.fail(error instanceof ClientError ? error : mapCameraError(error));
    }
  }

  async stop(reason: CameraStopReason, announce = true): Promise<void> {
    this.generation += 1;
    this.running = false;
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.abortSignal?.removeEventListener("abort", this.onAbort);
    this.abortSignal = null;
    this.document.removeEventListener("visibilitychange", this.onVisibilityChange);
    stopTracks(this.stream);
    this.stream = null;
    if (this.preview) {
      this.preview.pause();
      this.preview.srcObject = null;
    }
    this.preview = null;
    const listener = this.onEvent;
    this.onEvent = null;
    if (announce) listener?.({ type: "stopped", reason });
  }

  private readonly onAbort = () => {
    void this.stop("unmount");
  };

  private readonly onVisibilityChange = () => {
    if (this.document.hidden) void this.stop("page-hidden");
  };

  private async loadModels(): Promise<FaceApiLike> {
    const modelUrl = new URL(this.modelPath, `${this.location.origin}/`);
    if (modelUrl.origin !== this.location.origin) {
      throw new ClientError({
        code: "CAMERA_MODEL_UNAVAILABLE",
        message: "Expression context is unavailable. You can keep chatting without it.",
      });
    }
    if (!this.modelLoad) {
      this.modelLoad = this.loadFaceApi()
        .then(async (faceApi) => {
          await Promise.all([
            faceApi.nets.tinyFaceDetector.isLoaded
              ? Promise.resolve()
              : faceApi.nets.tinyFaceDetector.loadFromUri(modelUrl.pathname),
            faceApi.nets.faceExpressionNet.isLoaded
              ? Promise.resolve()
              : faceApi.nets.faceExpressionNet.loadFromUri(modelUrl.pathname),
          ]);
          return faceApi;
        })
        .catch((error) => {
          this.modelLoad = null;
          throw new ClientError({
            code: "CAMERA_MODEL_UNAVAILABLE",
            message: "The expression model did not load. You can keep chatting without it.",
            cause: error,
          });
        });
    }
    return this.modelLoad;
  }

  private async sample(run: number): Promise<void> {
    if (!this.running || run !== this.generation || !this.faceApi || !this.preview) return;
    try {
      const options = new this.faceApi.TinyFaceDetectorOptions({ inputSize: 224 });
      const result = await this.faceApi.detectSingleFace(this.preview, options).withFaceExpressions();
      if (!this.running || run !== this.generation) return;
      const observedAt = new Date(this.now()).toISOString();
      const strongest = result?.expressions.asSortedArray()[0];
      if (!strongest) {
        this.onEvent?.({ type: "no-face", observedAt });
      } else {
        const label = normalizeExpressionLabel(strongest.expression);
        if (label === "unavailable" || !Number.isFinite(strongest.probability)) {
          this.onEvent?.({ type: "no-face", observedAt });
        } else {
          this.onEvent?.({
            type: "estimate",
            estimate: {
              label,
              confidence: strongest.probability,
              modelVersion: CAMERA_MODEL_VERSION,
              observedAt,
            },
          });
        }
      }
    } catch (error) {
      if (run === this.generation) {
        await this.fail(error instanceof ClientError ? error : mapCameraError(error));
      }
      return;
    }
    if (this.running && run === this.generation) {
      this.timer = window.setTimeout(() => void this.sample(run), this.sampleIntervalMs);
    }
  }

  private async fail(error: ClientError): Promise<void> {
    const listener = this.onEvent;
    await this.stop("fatal-error", false);
    listener?.({ type: "unavailable", error });
  }
}
