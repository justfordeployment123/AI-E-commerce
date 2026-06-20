# Stripe Payment Settings — Design Spec
**Date:** 2026-06-20  
**Status:** Approved  
**Scope:** Production Stripe integration with encrypted admin-managed keys, webhook safety net, and admin refund UI

---

## 1. Goals

1. Admin can manage Stripe keys (test + live) from the admin portal without SSH or server restarts.
2. Admin can switch between test mode and live mode from the portal with a confirmation step.
3. Admin can issue full or partial refunds to customers from the order detail panel.
4. A webhook safety net detects the rare "payment charged but order not created" case and alerts the admin by email.

## 2. Out of Scope

- Stripe Publishable Key management — it is a Next.js build-time env var (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) and cannot be changed at runtime from the DB. It stays in `apps/web/.env`.
- Stripe Connect / payouts to external bank accounts — not needed; refunds reverse the original charge.
- Changing the frontend order-creation flow — the webhook is a safety net only, not a replacement.

---

## 3. Data Layer

### 3.1 New Prisma Model

```prisma
model AppSetting {
  key            String   @id
  encryptedValue String
  updatedAt      DateTime @updatedAt

  @@map("app_settings")
}
```

### 3.2 Order Model Additions

Two new nullable fields on the existing `Order` model:

```prisma
refundId     String?   // Stripe refund ID e.g. "re_xxx"
refundAmount Float?    // Actual pounds refunded (set on partial refund)
```

### 3.3 New OrderStatus Enum Value

```prisma
enum OrderStatus {
  // ...existing values...
  PARTIALLY_REFUNDED   // new
}
```

### 3.4 New Environment Variable

```env
ENCRYPTION_KEY=<64 hex chars>   # generate: openssl rand -hex 32
# This is the only permanent secret. Never put it in the DB.
```

### 3.5 AppSetting Keys Managed

| Key | Secret? | Notes |
|-----|---------|-------|
| `STRIPE_SECRET_KEY_TEST` | Yes — encrypted | `sk_test_xxx` |
| `STRIPE_SECRET_KEY_LIVE` | Yes — encrypted | `sk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET_TEST` | Yes — encrypted | `whsec_xxx` |
| `STRIPE_WEBHOOK_SECRET_LIVE` | Yes — encrypted | `whsec_xxx` |
| `STRIPE_MODE` | No — plaintext | `"test"` or `"live"` |

---

## 4. SettingsService

**Location:** `apps/api/src/modules/settings/settings.service.ts`  
**Module:** `apps/api/src/modules/settings/settings.module.ts` (exports `SettingsService`)

### 4.1 Encryption

- Algorithm: AES-256-GCM using Node.js built-in `crypto`
- Key: `Buffer.from(process.env.ENCRYPTION_KEY, 'hex')` — 32 bytes
- Per-value: random 12-byte IV generated at write time
- Storage format: `iv_hex:authTag_hex:ciphertext_hex` (all hex-encoded, colon-separated)
- The same plaintext stored twice produces different encrypted bytes (IV randomness)

### 4.2 Read Path — `get(key: string): Promise<string | null>`

1. Check in-memory `Map<string, string>` cache
2. On cache miss → query `AppSetting` where `key = key` → decrypt → populate cache → return
3. If no DB row → fall back to `process.env[key] ?? null`

### 4.3 Write Path — `set(key: string, plaintext: string): Promise<void>`

1. Encrypt plaintext
2. Upsert `AppSetting` row
3. Delete cache entry for `key` (next read re-fetches from DB)

### 4.4 Special Case for `STRIPE_MODE`

`STRIPE_MODE` is stored unencrypted (it's not secret). `set` and `get` detect this key and skip encryption/decryption.

### 4.5 Mask Helper — `mask(plaintext: string): string`

Returns last 4 chars with the rest replaced by `****`: `sk_live_****7abc`. Used by the GET settings endpoint. Never stored.

---

## 5. PaymentsService Changes

**File:** `apps/api/src/modules/payments/payments.service.ts`

### 5.1 Key Loading (Hot-Reload)

Remove the constructor-time Stripe client instantiation. Replace with a `getStripe()` private async method:

```
async getStripe(): Promise<Stripe> {
  const mode = (await settingsService.get('STRIPE_MODE')) ?? 'test'
  const key  = await settingsService.get(`STRIPE_SECRET_KEY_${mode.toUpperCase()}`)
  if (!key) throw new BadRequestException('Stripe not configured')
  return new Stripe(key, { apiVersion: '2024-06-20' })
}
```

Called at the start of `createIntent`, `handleWebhook`, and `refundOrder`. No server restart needed when admin rotates keys.

### 5.2 New Method — `refundOrder`

```
refundOrder(orderId: string, amountPounds?: number): Promise<RefundResult>
```

1. Fetch order by `id` — throw `NotFoundException` if not found
2. Throw `BadRequestException` if `paymentIntentId` is null or `paymentMethod !== 'stripe'`
3. Throw `BadRequestException` if order already has `refundId` (already fully refunded)
4. Call `stripe.refunds.create({ payment_intent, amount? })` where `amount` is `Math.round(amountPounds * 100)` if provided
5. Update order: set `refundId`, `refundAmount` (if partial), status → `PARTIALLY_REFUNDED` (if `amountPounds < order.total`) or `REFUNDED`
6. Return `{ refundId, amount, status }`

### 5.3 Webhook Handler Change

On `payment_intent.succeeded`:
1. Query `Order` where `paymentIntentId = event.data.object.id`
2. If found → update `status` to `CONFIRMED` (auto-confirm on successful payment)
3. If not found → call `emailService.sendAdminAlert(...)` with:
   - Stripe `paymentIntentId`
   - Amount in £
   - Customer email (from `event.data.object.receipt_email`)
   - Subject: `[URGENT] Payment received but no order found`

### 5.4 New Method — `getSettings` / `updateSettings`

Used by the settings controller — delegates entirely to `SettingsService`.

---

## 6. API Endpoints

**Module:** `PaymentsModule` (extended — no new module needed)  
**Auth on all new endpoints:** `JwtAuthGuard` + `RolesGuard` + `@Roles('ADMIN')`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/payments/settings` | Returns masked key values + current mode |
| `PUT` | `/payments/settings` | Saves non-empty fields only |
| `POST` | `/payments/settings/test` | Calls `stripe.accounts.retrieve()`, returns `{ ok, accountId }` |
| `POST` | `/payments/refund` | Body: `{ orderId, amountPounds? }` |

### GET `/payments/settings` Response Shape

```json
{
  "mode": "test",
  "stripeSecretKeyTest": "sk_test_****7abc",
  "stripeSecretKeyLive": null,
  "stripeWebhookSecretTest": "whsec_****ef12",
  "stripeWebhookSecretLive": null
}
```

`null` means not yet configured (never set in DB or env).

### PUT `/payments/settings` Body

```json
{
  "mode": "live",
  "stripeSecretKeyTest": "sk_test_xxx",
  "stripeSecretKeyLive": "sk_live_xxx",
  "stripeWebhookSecretTest": "whsec_xxx",
  "stripeWebhookSecretLive": "whsec_xxx"
}
```

All fields optional. Only non-empty, non-null fields are written. This prevents accidentally overwriting a key with an empty string.

---

## 7. Admin UI

### 7.1 New Page: `/settings`

**File:** `apps/admin/app/settings/page.tsx`  
**Style:** Matches existing pages — `bg-zinc-50`, `rounded-2xl`, `border border-zinc-100 shadow-sm`, zinc/black color palette.

**Layout:**

```
Header: "Payment Settings"
Subtitle: "Manage Stripe API keys and payment mode."

Card: Stripe Payment Keys
  Active Mode toggle: [Test ●───○ Live]
  Warning banner when switching to Live: "Real cards will be charged."

  Section: Test Keys
    Secret Key:       [sk_test_****7abc ] [Edit]
    Webhook Secret:   [whsec_****ef12   ] [Edit]

  Section: Live Keys
    Secret Key:       [sk_live_****9xyz ] [Edit]
    Webhook Secret:   [whsec_****ab34   ] [Edit]

  Footer row: [Test Connection]    [Save Changes]
  Inline result: "✓ Connected — acct_xxx" or "✗ Error: Invalid API key"
```

**Behaviour:**
- All four key fields are masked at rest (show last 4 chars + `****` prefix)
- Clicking "Edit" on a field clears the masked value and shows a plain-text input for the new key
- "Save Changes" skips any field still showing a masked value (not edited), only saves changed fields
- Mode toggle change is immediate in local state; persisted only on "Save Changes"
- "Test Connection" tests the currently active mode's secret key
- Mode switch to Live shows an inline yellow warning banner; no separate confirm dialog

### 7.2 Sidebar Nav

Add "Settings" link to the admin sidebar, positioned after "Pricing".

### 7.3 Orders Page — Refund Button

**File:** `apps/admin/app/orders/page.tsx`

Add a "Issue Refund" button to the order detail panel. Visibility condition:
- `order.status` is one of `CONFIRMED`, `SHIPPED`, `DELIVERED`
- `order.paymentMethod === 'stripe'`
- `order.paymentIntentId` is not null
- `order.refundId` is null (not already refunded)

**Refund dialog (inline, not a modal):**

```
Issue Refund
Order total: £149.99
Amount: [£ 149.99    ]  ← pre-filled, editable
[Cancel]  [Confirm Refund]
```

After success: badge updates inline to `REFUNDED` or `PARTIALLY_REFUNDED`. No page reload needed.

---

## 8. Migration & Deployment

### Step-by-step for first deploy:

1. Add `ENCRYPTION_KEY` to server env (generate with `openssl rand -hex 32`)
2. Run `prisma migrate deploy` — creates `app_settings` table, adds `refundId`/`refundAmount` to orders, adds `PARTIALLY_REFUNDED` enum value
3. Deploy API — existing `process.env.STRIPE_SECRET_KEY` still works as fallback via `SettingsService`
4. Open admin portal → Settings → enter test keys → Test Connection → Save
5. When ready for production: enter live keys → Test Connection → switch mode to Live → Save
6. Register the live webhook in Stripe Dashboard pointing to `https://api.techstopuk.com/payments/webhook`, add the live webhook secret via the settings page

### Zero-downtime: 
The env fallback in `SettingsService.get()` means the API continues working with the old env vars until the admin explicitly saves new keys via the UI.

---

## 9. File Inventory

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `AppSetting` model, `PARTIALLY_REFUNDED` enum, `refundId`/`refundAmount` to Order |
| `apps/api/src/modules/settings/settings.module.ts` | New |
| `apps/api/src/modules/settings/settings.service.ts` | New |
| `apps/api/src/modules/payments/payments.service.ts` | Refactor key loading, add `refundOrder`, update webhook |
| `apps/api/src/modules/payments/payments.controller.ts` | Add settings + refund endpoints |
| `apps/api/src/modules/payments/payments.module.ts` | Import `SettingsModule`, `OrdersModule`, `EmailModule` |
| `apps/api/src/app.module.ts` | Import `SettingsModule` (if needed globally) |
| `apps/admin/app/settings/page.tsx` | New |
| `apps/admin/app/layout.tsx` (or sidebar component) | Add Settings nav link |
| `apps/admin/lib/api.ts` | Add `paymentSettingsApi` and `paymentsApi.refund` |
| `apps/admin/app/orders/page.tsx` | Add refund button + inline dialog |
| `apps/api/.env.example` | Add `ENCRYPTION_KEY` |
