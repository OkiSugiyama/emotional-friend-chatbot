import { describe, expect, it, vi } from "vitest";
import {
  LocalCameraExpressionAdapter,
  type CameraEvent,
} from "../../src/services/camera-expression-adapter";

function previewElement() {
  const preview = document.createElement("video");
  Object.defineProperty(preview, "play", { value: vi.fn().mockResolvedValue(undefined) });
  Object.defineProperty(preview, "pause", { value: vi.fn() });
  return preview;
}

function faceApi(result?: { expression: string; probability: number }) {
  return {
    nets: {
      tinyFaceDetector: { isLoaded: false, loadFromUri: vi.fn().mockResolvedValue(undefined) },
      faceExpressionNet: { isLoaded: false, loadFromUri: vi.fn().mockResolvedValue(undefined) },
    },
    TinyFaceDetectorOptions: class {},
    detectSingleFace: vi.fn(() => ({
      withFaceExpressions: async () =>
        result
          ? { expressions: { asSortedArray: () => [result] } }
          : undefined,
    })),
  };
}

describe("controlled-origin camera adapter", () => {
  it("lazy-loads local models, requests video only, emits real output, and stops every track", async () => {
    const api = faceApi({ expression: "sad", probability: 0.8 });
    const trackOne = { stop: vi.fn() };
    const trackTwo = { stop: vi.fn() };
    const stream = { getTracks: () => [trackOne, trackTwo] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    const events: CameraEvent[] = [];
    const adapter = new LocalCameraExpressionAdapter({
      loadFaceApi: async () => api,
      mediaDevices: { getUserMedia },
      secureContext: true,
      location: { origin: "https://example.test", hostname: "example.test" },
      now: () => Date.parse("2026-08-09T00:00:00.000Z"),
    });
    const preview = previewElement();
    await adapter.start({ preview, onEvent: (event) => events.push(event) });
    await vi.waitFor(() => expect(events.some((event) => event.type === "estimate")).toBe(true));

    expect(getUserMedia).toHaveBeenCalledWith({ video: true, audio: false });
    expect(api.nets.tinyFaceDetector.loadFromUri).toHaveBeenCalledWith(
      "/models/face-expression-v1",
    );
    const estimate = events.find((event) => event.type === "estimate");
    expect(estimate).toMatchObject({
      type: "estimate",
      estimate: { label: "sad", confidence: 0.8 },
    });

    await adapter.stop("sign-out");
    expect(trackOne.stop).toHaveBeenCalledOnce();
    expect(trackTwo.stop).toHaveBeenCalledOnce();
    expect(preview.srcObject).toBeNull();
  });

  it("stops the camera when the page becomes hidden", async () => {
    const api = faceApi();
    const track = { stop: vi.fn() };
    const stream = { getTracks: () => [track] } as unknown as MediaStream;
    const events: CameraEvent[] = [];
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    const adapter = new LocalCameraExpressionAdapter({
      loadFaceApi: async () => api,
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
      secureContext: true,
      location: { origin: "https://example.test", hostname: "example.test" },
    });
    await adapter.start({ preview: previewElement(), onEvent: (event) => events.push(event) });
    hidden.mockReturnValue(true);
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.waitFor(() => expect(track.stop).toHaveBeenCalledOnce());
    expect(events).toContainEqual({ type: "stopped", reason: "page-hidden" });
    hidden.mockRestore();
  });

  it("rejects remote model origins before requesting a camera and never fabricates output", async () => {
    const getUserMedia = vi.fn();
    const events: CameraEvent[] = [];
    const adapter = new LocalCameraExpressionAdapter({
      modelPath: "https://cdn.example/models",
      loadFaceApi: async () => faceApi(),
      mediaDevices: { getUserMedia },
      secureContext: true,
      location: { origin: "https://app.example", hostname: "app.example" },
    });
    await adapter.start({ preview: previewElement(), onEvent: (event) => events.push(event) });
    await vi.waitFor(() => expect(events.some((event) => event.type === "unavailable")).toBe(true));
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(events.some((event) => event.type === "estimate")).toBe(false);
  });
});

