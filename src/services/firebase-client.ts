import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";

export interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export interface FirebaseEmulatorEnvironment {
  readonly MODE?: string;
  readonly PROD?: boolean;
  readonly VITE_USE_FIREBASE_EMULATORS?: string;
  readonly VITE_FIREBASE_AUTH_EMULATOR_HOST?: string;
  readonly VITE_FIREBASE_AUTH_EMULATOR_PORT?: string;
  readonly VITE_FIRESTORE_EMULATOR_HOST?: string;
  readonly VITE_FIRESTORE_EMULATOR_PORT?: string;
}

export interface FirebaseEmulatorConfig {
  auth: { host: string; port: number };
  firestore: { host: string; port: number };
}

const DEFAULT_EMULATOR_HOST = "127.0.0.1";
const connectedAuthInstances = new WeakSet<Auth>();
const connectedFirestoreInstances = new WeakSet<Firestore>();

function parseHost(value: string | undefined): string {
  const host = (value?.trim() || DEFAULT_EMULATOR_HOST).toLowerCase();
  if (
    host.includes("://") ||
    host.includes("/") ||
    host.includes("@") ||
    /\s/u.test(host) ||
    host.length > 253
  ) {
    throw new Error("Firebase emulator hosts must be hostnames without a scheme, path, or port.");
  }
  if (host === "localhost") return host;
  const unwrapped = host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
  if (unwrapped === "::1") return unwrapped;
  const ipv4 = unwrapped.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u);
  if (
    ipv4 &&
    ipv4.slice(1).every((octet) => Number(octet) <= 255) &&
    Number(ipv4[1]) === 127
  ) {
    return unwrapped;
  }
  throw new Error("Firebase emulators may connect only to a loopback host.");
}

function parsePort(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  if (!/^\d{1,5}$/u.test(value.trim())) {
    throw new Error("Firebase emulator ports must be integers from 1 through 65535.");
  }
  const port = Number(value);
  if (port < 1 || port > 65_535) {
    throw new Error("Firebase emulator ports must be integers from 1 through 65535.");
  }
  return port;
}

function authEmulatorUrl(host: string, port: number): string {
  const urlHost = host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
  return `http://${urlHost}:${port}`;
}

/** Returns a validated emulator topology only for an explicit nonproduction opt-in. */
export function parseFirebaseEmulatorConfig(
  environment: FirebaseEmulatorEnvironment,
): FirebaseEmulatorConfig | null {
  if (
    environment.PROD === true ||
    environment.MODE === "production" ||
    environment.VITE_USE_FIREBASE_EMULATORS !== "true"
  ) {
    return null;
  }
  return {
    auth: {
      host: parseHost(environment.VITE_FIREBASE_AUTH_EMULATOR_HOST),
      port: parsePort(environment.VITE_FIREBASE_AUTH_EMULATOR_PORT, 9_099),
    },
    firestore: {
      host: parseHost(environment.VITE_FIRESTORE_EMULATOR_HOST),
      port: parsePort(environment.VITE_FIRESTORE_EMULATOR_PORT, 8_080),
    },
  };
}

/** Connects each SDK instance at most once; returns false when emulators are disabled. */
export function connectFirebaseEmulatorsOnce(
  client: FirebaseClient,
  environment: FirebaseEmulatorEnvironment,
): boolean {
  const config = parseFirebaseEmulatorConfig(environment);
  if (!config) return false;
  if (!connectedAuthInstances.has(client.auth)) {
    connectAuthEmulator(client.auth, authEmulatorUrl(config.auth.host, config.auth.port), {
      disableWarnings: true,
    });
    connectedAuthInstances.add(client.auth);
  }
  if (!connectedFirestoreInstances.has(client.firestore)) {
    connectFirestoreEmulator(
      client.firestore,
      config.firestore.host,
      config.firestore.port,
    );
    connectedFirestoreInstances.add(client.firestore);
  }
  return true;
}

export function createFirebaseClient(
  options: FirebaseOptions,
  appName = "emotional-friend-client",
  emulatorEnvironment: FirebaseEmulatorEnvironment = import.meta.env,
): FirebaseClient {
  const app = getApps().some((candidate) => candidate.name === appName)
    ? getApp(appName)
    : initializeApp(options, appName);
  const client = { app, auth: getAuth(app), firestore: getFirestore(app) };
  connectFirebaseEmulatorsOnce(client, emulatorEnvironment);
  return client;
}
