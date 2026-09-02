import { beforeEach, describe, expect, it, vi } from "vitest";

const emulatorMocks = vi.hoisted(() => ({
  connectAuthEmulator: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
}));

vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual<typeof import("firebase/auth")>("firebase/auth");
  return { ...actual, connectAuthEmulator: emulatorMocks.connectAuthEmulator };
});

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual<typeof import("firebase/firestore")>("firebase/firestore");
  return { ...actual, connectFirestoreEmulator: emulatorMocks.connectFirestoreEmulator };
});

import {
  connectFirebaseEmulatorsOnce,
  parseFirebaseEmulatorConfig,
  type FirebaseClient,
} from "../../src/services/firebase-client";

describe("Firebase emulator topology", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses loopback defaults only after the exact development opt-in", () => {
    expect(parseFirebaseEmulatorConfig({ VITE_USE_FIREBASE_EMULATORS: "TRUE" })).toBeNull();
    expect(parseFirebaseEmulatorConfig({ VITE_USE_FIREBASE_EMULATORS: "true" })).toEqual({
      auth: { host: "127.0.0.1", port: 9099 },
      firestore: { host: "127.0.0.1", port: 8080 },
    });
  });

  it("parses explicitly configured emulator hosts and guarded ports", () => {
    expect(
      parseFirebaseEmulatorConfig({
        MODE: "development",
        VITE_USE_FIREBASE_EMULATORS: "true",
        VITE_FIREBASE_AUTH_EMULATOR_HOST: "localhost",
        VITE_FIREBASE_AUTH_EMULATOR_PORT: "9199",
        VITE_FIRESTORE_EMULATOR_HOST: "127.0.0.2",
        VITE_FIRESTORE_EMULATOR_PORT: "8180",
      }),
    ).toEqual({
      auth: { host: "localhost", port: 9199 },
      firestore: { host: "127.0.0.2", port: 8180 },
    });
    expect(() =>
      parseFirebaseEmulatorConfig({
        VITE_USE_FIREBASE_EMULATORS: "true",
        VITE_FIREBASE_AUTH_EMULATOR_HOST: "https://production.example",
      }),
    ).toThrow(/without a scheme/u);
    expect(() =>
      parseFirebaseEmulatorConfig({
        VITE_USE_FIREBASE_EMULATORS: "true",
        VITE_FIRESTORE_EMULATOR_PORT: "70000",
      }),
    ).toThrow(/1 through 65535/u);
  });

  it("rejects explicitly configured non-loopback emulator hosts", () => {
    expect(() =>
      parseFirebaseEmulatorConfig({
        MODE: "development",
        VITE_USE_FIREBASE_EMULATORS: "true",
        VITE_FIREBASE_AUTH_EMULATOR_HOST: "auth-emulator.internal",
      }),
    ).toThrow(/only to a loopback host/u);
    expect(() =>
      parseFirebaseEmulatorConfig({
        MODE: "development",
        VITE_USE_FIREBASE_EMULATORS: "true",
        VITE_FIRESTORE_EMULATOR_HOST: "192.168.1.20",
      }),
    ).toThrow(/only to a loopback host/u);
  });

  it("never enables emulator connections in production mode", () => {
    expect(
      parseFirebaseEmulatorConfig({
        PROD: true,
        MODE: "development",
        VITE_USE_FIREBASE_EMULATORS: "true",
      }),
    ).toBeNull();
    expect(
      parseFirebaseEmulatorConfig({
        MODE: "production",
        VITE_USE_FIREBASE_EMULATORS: "true",
      }),
    ).toBeNull();
  });

  it("connects each Auth and Firestore instance only once", () => {
    const client = {
      app: {},
      auth: {},
      firestore: {},
    } as FirebaseClient;
    const environment = {
      MODE: "development",
      VITE_USE_FIREBASE_EMULATORS: "true",
      VITE_FIREBASE_AUTH_EMULATOR_HOST: "localhost",
      VITE_FIRESTORE_EMULATOR_HOST: "localhost",
    };

    expect(connectFirebaseEmulatorsOnce(client, environment)).toBe(true);
    expect(connectFirebaseEmulatorsOnce(client, environment)).toBe(true);

    expect(emulatorMocks.connectAuthEmulator).toHaveBeenCalledTimes(1);
    expect(emulatorMocks.connectAuthEmulator).toHaveBeenCalledWith(
      client.auth,
      "http://localhost:9099",
      { disableWarnings: true },
    );
    expect(emulatorMocks.connectFirestoreEmulator).toHaveBeenCalledTimes(1);
    expect(emulatorMocks.connectFirestoreEmulator).toHaveBeenCalledWith(
      client.firestore,
      "localhost",
      8080,
    );
  });
});
