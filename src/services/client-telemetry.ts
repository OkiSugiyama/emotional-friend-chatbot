export type ClientTelemetryCategory =
  | "client_error"
  | "unhandled_rejection"
  | "storage_failure"
  | "network_failure"
  | "auth_token_failure"
  | "request_validation_failure"
  | "api_failure";

const endpoint = "/api/v1/client-events";

function releaseVersion(): string {
  const configured = import.meta.env.VITE_RELEASE_VERSION?.trim();
  return configured && configured.length <= 100 ? configured : "development";
}

/**
 * Emits only an allowlisted category and immutable release identifier. Error
 * objects, messages, stack traces, URLs, identities, and application state are
 * deliberately not accepted by this API.
 */
export function reportClientEvent(category: ClientTelemetryCategory): void {
  const payload = JSON.stringify({ releaseVersion: releaseVersion(), category });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
    return;
  }
  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

export function installGlobalClientTelemetry(): () => void {
  const onError = () => reportClientEvent("client_error");
  const onUnhandledRejection = () => reportClientEvent("unhandled_rejection");
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
