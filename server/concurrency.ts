export interface ProviderConcurrencyLease {
  slot: number;
  token: string;
}

export interface ProviderConcurrencyLimiter {
  acquire(input: { limit: number; leaseMs: number }): Promise<ProviderConcurrencyLease>;
  release(lease: ProviderConcurrencyLease): Promise<void>;
}

export class InMemoryProviderConcurrencyLimiter implements ProviderConcurrencyLimiter {
  private readonly leases = new Map<number, { token: string; expiresAt: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  async acquire(input: { limit: number; leaseMs: number }): Promise<ProviderConcurrencyLease> {
    const now = this.now();
    for (let slot = 0; slot < input.limit; slot += 1) {
      const existing = this.leases.get(slot);
      if (!existing || existing.expiresAt <= now) {
        const token = `${slot}-${now}-${Math.random()}`;
        this.leases.set(slot, { token, expiresAt: now + input.leaseMs });
        return { slot, token };
      }
    }
    throw new Error("provider concurrency exhausted");
  }

  async release(lease: ProviderConcurrencyLease): Promise<void> {
    if (this.leases.get(lease.slot)?.token === lease.token) this.leases.delete(lease.slot);
  }
}
