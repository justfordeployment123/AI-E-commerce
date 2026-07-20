import { Injectable, Logger } from '@nestjs/common';

export interface ProxyConfig {
    server: string;
    username?: string;
    password?: string;
}

/**
 * Round-robin pool of outbound proxies for the Playwright-driven scrapers.
 *
 * Configured via SCRAPER_PROXIES (comma-separated "http://[user:pass@]host:port"
 * entries). With no entries set, `enabled` is false and `next()` always returns
 * null — every call site falls back to the existing no-proxy behavior untouched.
 *
 * This is scaffolding: it works correctly today with zero proxies configured
 * (a no-op), and starts rotating for real the moment SCRAPER_PROXIES is set to
 * a live provider's proxy list.
 */
@Injectable()
export class ProxyPoolService {
    private readonly logger = new Logger(ProxyPoolService.name);
    private readonly proxies: ProxyConfig[];
    private cursor = 0;
    private readonly cooldownUntil = new Map<number, number>();

    constructor() {
        this.proxies = this.parseProxyList(process.env.SCRAPER_PROXIES);
        if (this.proxies.length > 0) {
            this.logger.log(`Proxy pool loaded: ${this.proxies.length} proxy(ies) configured.`);
        }
    }

    get enabled(): boolean {
        return this.proxies.length > 0;
    }

    /** Next healthy proxy in round-robin order, or null when no pool is configured. */
    next(): ProxyConfig | null {
        if (this.proxies.length === 0) return null;

        const now = Date.now();
        for (let attempts = 0; attempts < this.proxies.length; attempts++) {
            const idx = this.cursor % this.proxies.length;
            this.cursor++;
            const bannedUntil = this.cooldownUntil.get(idx) ?? 0;
            if (bannedUntil <= now) return this.proxies[idx];
        }

        // Every proxy is currently cooling down — reuse one rather than stall the run.
        this.logger.warn('All proxies are in cooldown — reusing one anyway.');
        return this.proxies[this.cursor % this.proxies.length];
    }

    /** Puts a proxy in cooldown after it gets blocked/rate-limited, so `next()` skips it for a while. */
    markBad(proxy: ProxyConfig, cooldownMs = 10 * 60_000): void {
        const idx = this.proxies.findIndex(p => p.server === proxy.server);
        if (idx === -1) return;
        this.cooldownUntil.set(idx, Date.now() + cooldownMs);
        this.logger.warn(`Proxy ${this.redact(proxy.server)} marked bad — cooling down for ${Math.round(cooldownMs / 60_000)}m.`);
    }

    /** Hides credentials from log lines — server host:port only. */
    redact(server: string): string {
        try {
            const u = new URL(server);
            return `${u.protocol}//${u.hostname}:${u.port || '—'}`;
        } catch {
            return '(invalid proxy url)';
        }
    }

    private parseProxyList(raw: string | undefined): ProxyConfig[] {
        if (!raw?.trim()) return [];
        return raw
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map((entry): ProxyConfig | null => {
                try {
                    const u = new URL(entry);
                    return {
                        server: `${u.protocol}//${u.host}`,
                        username: u.username ? decodeURIComponent(u.username) : undefined,
                        password: u.password ? decodeURIComponent(u.password) : undefined,
                    };
                } catch {
                    this.logger.warn(`Skipping malformed proxy entry (expected "http://[user:pass@]host:port"): ${entry}`);
                    return null;
                }
            })
            .filter((p): p is ProxyConfig => p !== null);
    }
}
