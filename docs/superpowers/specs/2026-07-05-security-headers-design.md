# Security Response Headers — Design Spec
**Date:** 2026-07-05
**Status:** Implemented and verified (see §8)
**Scope:** Add missing HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP) to `apps/web` and `apps/admin`

---

## 1. Trigger

A third-party security scan of `https://techstopuk.com/` (SecHead report, 2026-06-30) scored **0/100** and flagged all six graded headers as **Missing**: `content-security-policy` (Critical), `strict-transport-security` (High), `x-frame-options` (High — also flagged separately as "no clickjacking protection found"), `x-content-type-options` (Medium), `referrer-policy` (Medium), `permissions-policy` (Low). The report also lists `cross-origin-opener-policy`, `cross-origin-embedder-policy`, `cross-origin-resource-policy` as "emerging best practice, not yet required for grading."

Confirmed by reading both `apps/web/next.config.ts` and `apps/admin/next.config.ts`: neither app has a `headers()` function at all — this isn't a misconfiguration, the headers were simply never added.

## 2. Goals

1. All six graded headers present and correctly configured on both `apps/web` (public storefront, `techstopuk.com`) and `apps/admin` (internal admin panel).
2. CSP must not break any existing functionality: Stripe Elements checkout, the Google Maps store-locator iframe, product/category/banner images served from object storage, the WebSocket-based support chat, or Server-Sent Events notifications.
3. Add the two safe "emerging best practice" headers (COOP, CORP). Explicitly skip COEP (see §5).

## 3. Out of Scope

- A CSP reporting endpoint (`report-uri`/`report-to`) — no infrastructure exists to receive reports; can be added later.
- Subresource Integrity (SRI) — not requested by the scan, separate concern.
- Rate limiting / WAF — unrelated to this report.

---

## 4. External Origins Inventory (drives the CSP directives)

Gathered by tracing every external resource/connection the frontend code actually makes (see PR/commit for full file:line evidence):

| Origin | Directive | Why |
|---|---|---|
| `https://js.stripe.com` | `script-src`, `frame-src` | Stripe.js SDK + CardElement/3DS iframe (`apps/web/app/(shop)/checkout/page.tsx`) |
| `https://hooks.stripe.com` | `frame-src` | 3-D Secure challenge frame |
| `https://api.stripe.com` | `connect-src` | Stripe.js's own API calls (payment confirmation) |
| `https://maps.google.com` | `frame-src` | Store-locator iframe embed (home, trade-in, repair pages). Admin can override the embed URL per-store — see §6 residual risk |
| `https://storage.techstopuk.com` | `img-src` | Garage/MinIO object storage — product, category, banner images (prod `GARAGE_PUBLIC_URL`) |
| `https://picsum.photos` | `img-src` | Hardcoded placeholder images (fallback only, two call sites) |
| `https://api.techstopuk.com` | `connect-src` | All `fetch()` calls from both apps (`NEXT_PUBLIC_API_URL`) |
| `wss://api.techstopuk.com` | `connect-src` | `socket.io-client` support chat (`/support` namespace) + SSE notifications, both apps |

No Google OAuth, Google Analytics, Facebook Pixel, reCAPTCHA, or any other third-party script/iframe found in either app. Fonts are fully self-hosted via `next/font/google` (no external font origin needed).

## 5. Content-Security-Policy Strategy — nonce-based, not `'unsafe-inline'` for scripts

Both apps are Next.js **App Router** apps. App Router injects its own inline `<script>` tags at runtime for RSC-streaming (`self.__next_f.push(...)`) on every single page, regardless of application code — so a workable `script-src` cannot simply omit inline-script allowance; the naive fix is `'unsafe-inline'`, but Next.js has a documented, supported alternative: a per-request **nonce** issued in `middleware.ts`, echoed back in the `Content-Security-Policy` response header as `'nonce-<value>'`, which Next.js's own rendering pipeline detects and automatically stamps onto all of its own framework-injected script tags. Application-authored inline scripts (there is exactly one, `apps/web/app/layout.tsx`'s theme-flash-prevention script) must have the same nonce applied manually via `headers().get('x-nonce')`.

This avoids `'unsafe-inline'` in `script-src` in production, which is what serious scanners/pentests flag as equivalent to no CSP at all for XSS purposes.

**`style-src` keeps `'unsafe-inline'`.** Both apps make heavy use of React's `style={{...}}` inline-attribute prop across many components (not just Next's own injected `<style>` tags) — arbitrary elements' `style=""` attributes cannot carry a `nonce`, only `<script>`/`<style>` tags can. Removing `'unsafe-inline'` from `style-src` would break rendering broadly. This is the same trade-off Next.js's own official CSP guide makes.

**Development vs. production:** Next.js dev mode (Fast Refresh/HMR) needs `'unsafe-eval'` and a more permissive `script-src` to function; this is conditionally relaxed only when `NODE_ENV !== 'production'`. The nonce/strict-dynamic policy applies in production builds.

### `frame-ancestors` (clickjacking)
Set to `'none'` in the CSP — this is the modern replacement for `X-Frame-Options` and is what the scan's "no clickjacking protection found" issue is asking for. `X-Frame-Options: DENY` is set alongside it for older tools/browsers that don't parse CSP's `frame-ancestors`.

## 6. COOP / CORP — added; COEP — explicitly skipped

- `Cross-Origin-Opener-Policy: same-origin-allow-popups` — safe: no OAuth popup flow exists (Google login is a full-page redirect handled server-side, confirmed), so `same-origin` would also work, but `-allow-popups` is a harmless extra safety margin for anything opening a new tab/window (e.g. "open store in new tab").
- `Cross-Origin-Resource-Policy: same-origin` — restricts other origins from directly loading our own responses; does not affect our ability to load Stripe/Maps/storage resources (that's governed by *their* CORP, not ours).
- **`Cross-Origin-Embedder-Policy` is intentionally not added.** COEP (`require-corp`) would require every cross-origin subresource we load — the Stripe iframe, the Google Maps iframe, images from `storage.techstopuk.com` and `picsum.photos` — to send a compatible CORP/CORS header, which we don't control on Stripe's or Google's side. Enabling it would very likely break Stripe Elements and/or the Maps embed. The scan itself lists COEP as "Soon" / not yet required — deferring it is intentional, not an oversight.

## 7. Residual Risk

- The store-locator Maps `frame-src` is pinned to `https://maps.google.com` and `https://www.google.com` (the latter added after verification — see §8 — since `maps.google.com` redirects there), matching every current store's `mapsEmbedUrl` (seed data + admin-entered values observed today). Admin can free-type a different embed URL per store (`apps/admin/app/stores/page.tsx`) — if a future store used a non-Google map provider, that iframe would be silently blocked by CSP until `frame-src` is updated. Not fixing this generically (e.g. wildcarding `frame-src` to any host) because that would defeat the purpose of restricting `frame-src` at all.
- No CSP violation reporting endpoint exists, so a future policy/resource mismatch will only surface as a silent browser-console error, not an alert. Acceptable for this pass; flagged for future work.
- `apps/admin`'s root layout now unconditionally calls `headers()` purely to force dynamic rendering (see §8, finding 5) — this disables static-page caching/prerendering for the entire admin app. Acceptable for an internal, authenticated admin panel where content is per-user anyway, but worth knowing if admin's cold-start/TTFB ever becomes a concern.

## 8. Verification Findings — what a live browser test caught that static analysis missed

Static header inspection (`curl -I`) only proves headers are *present*; it says nothing about whether the CSP actually breaks the app. A real Playwright browser pass against production builds of both apps caught five real bugs the design above didn't anticipate, all fixed before shipping:

1. **`connect-src`/`img-src` were hardcoded to the production hostnames** (`api.techstopuk.com`, `storage.techstopuk.com`). `next start` sets `NODE_ENV=production` even when testing locally against `localhost:3002`/`localhost:9000`, so a `NODE_ENV`-keyed dev/prod branch silently allowlisted the wrong origin and blocked every real fetch. Fixed by deriving the CSP origins from `NEXT_PUBLIC_API_URL` and `GARAGE_PUBLIC_URL` at module-load time instead of guessing from `NODE_ENV` — correct in both local and real deployments by construction, not by assumption.
2. **`GARAGE_PUBLIC_URL` was never actually set for `apps/web`/`apps/admin`**, even though `next.config.ts`'s pre-existing `storageIsLocal` check already silently depended on it. Added to both apps' `.env.local`/`.env.example` (mirroring `apps/api`'s value) — a real, if minor, pre-existing configuration gap this work surfaced.
3. **`maps.google.com`'s embed URL redirects to `www.google.com/maps/embed`** — CSP `frame-src` is checked against the final URL after redirects, not the `src` attribute, so the Maps embed was silently blocked until `https://www.google.com` was added alongside `https://maps.google.com`.
4. **A decorative CSS background** (`bg-[url('https://grainy-gradients.vercel.app/noise.svg')]`, help page only) was invisible to a source grep for `<img>`/`next/image` usage — Tailwind arbitrary-value background URLs don't look like typical image references. Only surfaced as a live `img-src` violation. Added to the allowlist.
5. **CSP nonces disable static prerendering for any route that doesn't call a dynamic API** (documented Next.js behavior). `apps/web`'s root layout already called `headers()` to read the nonce for its one hand-authored inline script, which incidentally forced every web route dynamic. `apps/admin`'s layout had no inline script to nonce, so it never called `headers()` — meaning admin's statically-prerendered routes (`/login` included) shipped a nonce baked in at build time that never matched the fresh per-request nonce in the CSP header, and **every single script on those pages was blocked**, including Next's own framework chunks. Fixed by adding a bare `await headers()` call to `apps/admin/app/layout.tsx` to force the same dynamic-rendering trade-off across all admin routes. This was caught only because the verification pass loaded the actual login page in a real browser and read the console — `curl -I` would never have shown it, since the *headers themselves* were correct; it was the *page content* that was broken.

None of these would have been caught by a header-presence check alone. This is the reason a full Playwright pass through checkout (Stripe iframe), the store-locator Maps embed, the help-page chat trigger (WebSocket), and an authenticated admin session (dashboard, orders, settings) was run before considering this done, not just `curl -I`.
