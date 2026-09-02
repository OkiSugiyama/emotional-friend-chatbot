export interface RateLimitInput {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

export interface RateLimiter {
  consume(input: RateLimitInput): Promise<RateLimitResult>;
}

interface Bucket {
  timestamps: number[];
  touchedAt: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private operations = 0;

  constructor(private readonly now: () => number = Date.now) {}

  async consume(input: RateLimitInput): Promise<RateLimitResult> {
    const now = this.now();
    const boundary = now - input.windowMs;
    const bucket = this.buckets.get(input.key) ?? { timestamps: [], touchedAt: now };
    bucket.timestamps = bucket.timestamps.filter((timestamp) => timestamp > boundary);
    bucket.touchedAt = now;

    if (bucket.timestamps.length >= input.limit) {
      this.buckets.set(input.key, bucket);
      const retryMs = Math.max(1, bucket.timestamps[0] + input.windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil(retryMs / 1_000)),
      };
    }

    bucket.timestamps.push(now);
    this.buckets.set(input.key, bucket);
    this.operations += 1;
    if (this.operations % 500 === 0) this.prune(now, input.windowMs);
    return { allowed: true, remaining: Math.max(0, input.limit - bucket.timestamps.length) };
  }

  private prune(now: number, windowMs: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.touchedAt < now - windowMs * 2) this.buckets.delete(key);
    }
  }
}
