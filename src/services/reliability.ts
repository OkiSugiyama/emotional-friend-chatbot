import {
  RETRY_JITTER_MAX_MS,
  RETRY_JITTER_MIN_MS,
} from "../domain/constants";

export function createClientRequestId(): string {
  return crypto.randomUUID();
}

export function retryJitterMs(random: () => number = Math.random): number {
  return Math.floor(
    RETRY_JITTER_MIN_MS + random() * (RETRY_JITTER_MAX_MS - RETRY_JITTER_MIN_MS + 1),
  );
}

export class SingleFlight<T> {
  private readonly operations = new Map<string, Promise<T>>();

  has(key: string): boolean {
    return this.operations.has(key);
  }

  run(key: string, operation: () => Promise<T>): Promise<T> {
    const current = this.operations.get(key);
    if (current) return current;
    const pending = operation().finally(() => this.operations.delete(key));
    this.operations.set(key, pending);
    return pending;
  }
}
