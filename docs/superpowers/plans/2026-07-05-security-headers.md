# Security Response Headers Implementation Plan

**Goal:** Close all issues in the 2026-06-30 SecHead report (0/100) by adding CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, and CORP to both `apps/web` and `apps/admin`, without breaking Stripe checkout, the Maps embed, chat/notifications, or image loading.

**Architecture:** A `proxy.ts` in each app generates a per-request nonce, sets it as a `x-nonce` request header (read by `layout.tsx` for the one hand-authored inline script) and builds the `Content-Security-Policy` response header (nonce + `strict-dynamic` for scripts in production, relaxed for `next dev`). All other headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP) are static and set via each app's `next.config.ts` `headers()` function.

**Tech Stack:** Next.js 16 App Router `proxy.ts` (the installed Next 16.2.6 renamed the `middleware.ts` file convention to `proxy.ts` — same API, `export function proxy(...)` instead of `middleware(...)`) + `headers()` config API, Web Crypto (`crypto.getRandomValues`) for nonce generation.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `apps/web/proxy.ts` | Create | Nonce generation + CSP (Stripe/Maps/storage-aware) |
| `apps/web/app/layout.tsx` | Modify | Read nonce from headers, apply to the inline theme script |
| `apps/web/next.config.ts` | Modify | Add `headers()` — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP |
| `apps/admin/proxy.ts` | Create | Nonce generation + CSP (no Stripe/Maps directives needed) |
| `apps/admin/next.config.ts` | Modify | Same static headers as web |

---

## Task 1: `apps/web` middleware — nonce + CSP

- [x] Create `apps/web/proxy.ts`:
  - Generate a random nonce per request (base64 of `crypto.getRandomValues`).
  - Build CSP as a single-line string:
    - `default-src 'self'`
    - production: `script-src 'self' 'nonce-<n>' 'strict-dynamic' https://js.stripe.com`
    - dev (`NODE_ENV !== 'production'`): `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com` (HMR/Fast Refresh needs this; nonce/strict-dynamic is a prod-only concern)
    - `style-src 'self' 'unsafe-inline'`
    - `img-src 'self' data: https://storage.techstopuk.com https://picsum.photos` (also allow `http://localhost:*` in dev so local Garage works unoptimized)
    - `font-src 'self'`
    - `connect-src 'self' https://api.techstopuk.com wss://api.techstopuk.com https://api.stripe.com` (+ `http://localhost:3002 ws://localhost:3002` in dev)
    - `frame-src https://js.stripe.com https://hooks.stripe.com https://maps.google.com`
    - `frame-ancestors 'none'`
    - `base-uri 'self'`
    - `object-src 'none'`
  - Set `x-nonce` on the *request* headers (clone via `NextResponse.next({ request: { headers } })`) so Server Components can read it via `headers()`.
  - Set `Content-Security-Policy` on the *response* headers.
  - `export const config = { matcher: [...] }` excluding `_next/static`, `_next/image`, and common static file extensions, matching Next's documented CSP-nonce example.

## Task 2: Apply nonce to the one hand-authored inline script

- [x] `apps/web/app/layout.tsx`: import `headers` from `next/headers`, read `x-nonce`, pass as `nonce={nonce}` prop on the existing `<script dangerouslySetInnerHTML>` block (theme flash-prevention). No other inline `<script>` exists in this app.

## Task 3: `apps/admin` middleware — nonce + CSP

- [x] Create `apps/admin/proxy.ts`, same structure as Task 1 but simpler `connect-src`/`img-src` (no Stripe/Maps), since admin has no third-party embeds:
  - `script-src 'self' 'nonce-<n>' 'strict-dynamic'` (prod) / relaxed in dev
  - `style-src 'self' 'unsafe-inline'` (inline `<style>` block on the login page)
  - `img-src 'self' data: https://storage.techstopuk.com`
  - `connect-src 'self' https://api.techstopuk.com wss://api.techstopuk.com` (+ localhost equivalents in dev)
  - `frame-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`
  - No custom inline script in admin's `layout.tsx` to nonce manually — Next's own framework scripts pick up the nonce automatically via the CSP header alone.

## Task 4: Static headers via `next.config.ts` (both apps)

- [x] Add an async `headers()` function returning, for `source: '/(.*)'`:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")` (web only needs `payment=` for Stripe; admin can set `payment=()`)
  - `Cross-Origin-Opener-Policy: same-origin-allow-popups`
  - `Cross-Origin-Resource-Policy: same-origin`
  - Do **not** set `Content-Security-Policy` here — it's already set by middleware; setting it in both places would make browsers enforce the *intersection* of two independently-written policies, which is fragile and hard to reason about.

## Task 5: Verification

- [x] Typecheck both apps (`tsc --noEmit`).
- [x] `npm run build` both apps in production mode (confirms middleware + nonce compiles and doesn't error at build time).
- [x] Run both apps (`next start` after build, or `next dev` for a quick pass) and `curl -I` each to confirm every header is present with the expected value.
- [x] Browser-driven check (Playwright): load the storefront home page, a product page, the checkout page (through to the Stripe CardElement rendering), the store-locator Maps embed, and the support-chat page — confirm zero CSP-violation console errors and that the WebSocket/SSE connections still establish.
- [x] Re-run (or approximate) the SecHead-style check — `curl -I https://<local>` — against all six graded headers to confirm each now reports a value instead of "Missing".

## Task 6: Fixes made during verification (not in the original plan)

The Playwright pass in Task 5 found five real bugs the plan didn't anticipate — see the design spec's §8 for full detail. Summary:

- [x] Derive `connect-src`/`img-src` origins from `NEXT_PUBLIC_API_URL`/`GARAGE_PUBLIC_URL` at runtime instead of hardcoding `*.techstopuk.com` (was silently blocking every fetch when tested locally).
- [x] Set `GARAGE_PUBLIC_URL` in both apps' `.env.local`/`.env.example` — was never actually configured.
- [x] Add `https://www.google.com` to `frame-src` (Maps embed redirects there from `maps.google.com`).
- [x] Add `https://grainy-gradients.vercel.app` to `img-src` (decorative CSS background on the help page, missed by static source search).
- [x] Add `await headers()` to `apps/admin/app/layout.tsx` — without it, admin's statically-prerendered routes (`/login`) shipped a stale nonce and every script on the page was CSP-blocked.
