"use client";

import { useEffect, useState } from "react";
import { Save, Check, Zap, Eye, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { paymentSettingsApi, type PaymentSettings, shippingSettingsApi, type ShippingSettings } from "../../lib/api";

type TestResult = { ok: true; accountId: string } | { ok: false; error: string } | null;
type ShippingTestResult = { ok: true } | { ok: false; error: string } | null;

interface FieldState {
  masked: string | null;
  editing: boolean;
  draft: string;
}

function makeField(masked: string | null): FieldState {
  return { masked, editing: false, draft: "" };
}

type StripeFieldKey =
  | "stripeSecretKeyTest" | "stripeSecretKeyLive"
  | "stripeWebhookSecretTest" | "stripeWebhookSecretLive"
  | "stripePublishableKeyTest" | "stripePublishableKeyLive";
type ShippoFieldKey = "shippoApiKeyTest" | "shippoApiKeyLive";
type ToastState = { message: string; type: "success" | "error" } | null;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [mode, setMode] = useState<"test" | "live">("test");
  const [showLiveBanner, setShowLiveBanner] = useState(false);
  const [savingField, setSavingField] = useState<StripeFieldKey | null>(null);

  const [toast, setToast] = useState<ToastState>(null);
  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const [fields, setFields] = useState<Record<StripeFieldKey, FieldState>>({
    stripeSecretKeyTest: makeField(null),
    stripeSecretKeyLive: makeField(null),
    stripeWebhookSecretTest: makeField(null),
    stripeWebhookSecretLive: makeField(null),
    stripePublishableKeyTest: makeField(null),
    stripePublishableKeyLive: makeField(null),
  });

  useEffect(() => {
    paymentSettingsApi.get()
      .then((s: PaymentSettings) => {
        setMode(s.mode ?? "test");
        setFields({
          stripeSecretKeyTest: makeField(s.stripeSecretKeyTest),
          stripeSecretKeyLive: makeField(s.stripeSecretKeyLive),
          stripeWebhookSecretTest: makeField(s.stripeWebhookSecretTest),
          stripeWebhookSecretLive: makeField(s.stripeWebhookSecretLive),
          stripePublishableKeyTest: makeField(s.stripePublishableKeyTest),
          stripePublishableKeyLive: makeField(s.stripePublishableKeyLive),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function startEdit(key: StripeFieldKey) {
    setFields(f => ({ ...f, [key]: { ...f[key], editing: true, draft: "" } }));
  }

  function cancelEdit(key: StripeFieldKey) {
    setFields(f => ({ ...f, [key]: { ...f[key], editing: false, draft: "" } }));
  }

  function setDraft(key: StripeFieldKey, value: string) {
    setFields(f => ({ ...f, [key]: { ...f[key], draft: value } }));
  }

  async function saveField(key: StripeFieldKey) {
    const draft = fields[key].draft.trim();
    if (!draft) return;
    setSavingField(key);
    try {
      const updated = await paymentSettingsApi.update({ [key]: draft });
      setMode(updated.mode);
      setFields({
        stripeSecretKeyTest: makeField(updated.stripeSecretKeyTest),
        stripeSecretKeyLive: makeField(updated.stripeSecretKeyLive),
        stripeWebhookSecretTest: makeField(updated.stripeWebhookSecretTest),
        stripeWebhookSecretLive: makeField(updated.stripeWebhookSecretLive),
        stripePublishableKeyTest: makeField(updated.stripePublishableKeyTest),
        stripePublishableKeyLive: makeField(updated.stripePublishableKeyLive),
      });
      showToast("Saved successfully");
    } catch (err: any) {
      showToast(err?.message ?? "Failed to save", "error");
    } finally {
      setSavingField(null);
    }
  }

  function handleModeToggle(newMode: "test" | "live") {
    if (newMode === "live" && mode !== "live") setShowLiveBanner(true);
    setMode(newMode);
  }

  async function handleSave() {
    setSaving(true);
    setTestResult(null);
    try {
      const payload: Record<string, string> = { mode };
      for (const [key, field] of Object.entries(fields) as [StripeFieldKey, FieldState][]) {
        if (field.editing && field.draft.trim()) payload[key] = field.draft.trim();
      }
      const updated = await paymentSettingsApi.update(payload);
      setMode(updated.mode);
      setFields({
        stripeSecretKeyTest: makeField(updated.stripeSecretKeyTest),
        stripeSecretKeyLive: makeField(updated.stripeSecretKeyLive),
        stripeWebhookSecretTest: makeField(updated.stripeWebhookSecretTest),
        stripeWebhookSecretLive: makeField(updated.stripeWebhookSecretLive),
        stripePublishableKeyTest: makeField(updated.stripePublishableKeyTest),
        stripePublishableKeyLive: makeField(updated.stripePublishableKeyLive),
      });
      setShowLiveBanner(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      showToast("Settings saved");
    } catch (err: any) {
      showToast(err?.message ?? "Failed to save", "error");
    }
    finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await paymentSettingsApi.test();
      setTestResult({ ok: true, accountId: result.accountId });
    } catch (err: any) {
      setTestResult({ ok: false, error: err?.message ?? "Connection failed" });
    } finally {
      setTesting(false);
    }
  }

  // ── Shippo section — deliberately isolated state, independent of the Stripe fields above ──
  const [shippingLoading, setShippingLoading] = useState(true);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [shippingSaved, setShippingSaved] = useState(false);
  const [shippingTesting, setShippingTesting] = useState(false);
  const [shippingTestResult, setShippingTestResult] = useState<ShippingTestResult>(null);
  const [shippoMode, setShippoMode] = useState<"test" | "live">("test");
  const [showShippoLiveBanner, setShowShippoLiveBanner] = useState(false);
  const [shippoFields, setShippoFields] = useState<Record<ShippoFieldKey, FieldState>>({
    shippoApiKeyTest: makeField(null),
    shippoApiKeyLive: makeField(null),
  });
  const [shippoServiceLevel, setShippoServiceLevel] = useState("");
  const [savingShippoField, setSavingShippoField] = useState<ShippoFieldKey | null>(null);
  const [savingServiceLevel, setSavingServiceLevel] = useState(false);

  useEffect(() => {
    shippingSettingsApi.get()
      .then((s: ShippingSettings) => {
        setShippoMode(s.mode ?? "test");
        setShippoFields({
          shippoApiKeyTest: makeField(s.shippoApiKeyTest),
          shippoApiKeyLive: makeField(s.shippoApiKeyLive),
        });
        setShippoServiceLevel(s.shippoServiceLevel ?? "");
      })
      .catch(() => {})
      .finally(() => setShippingLoading(false));
  }, []);

  function startShippoEdit(key: ShippoFieldKey) {
    setShippoFields(f => ({ ...f, [key]: { ...f[key], editing: true, draft: "" } }));
  }

  function cancelShippoEdit(key: ShippoFieldKey) {
    setShippoFields(f => ({ ...f, [key]: { ...f[key], editing: false, draft: "" } }));
  }

  function setShippoDraft(key: ShippoFieldKey, value: string) {
    setShippoFields(f => ({ ...f, [key]: { ...f[key], draft: value } }));
  }

  async function saveShippoField(key: ShippoFieldKey) {
    const draft = shippoFields[key].draft.trim();
    if (!draft) return;
    setSavingShippoField(key);
    try {
      const updated = await shippingSettingsApi.update({ [key]: draft });
      setShippoMode(updated.mode);
      setShippoFields({
        shippoApiKeyTest: makeField(updated.shippoApiKeyTest),
        shippoApiKeyLive: makeField(updated.shippoApiKeyLive),
      });
      setShippoServiceLevel(updated.shippoServiceLevel ?? "");
      showToast("Saved successfully");
    } catch (err: any) {
      showToast(err?.message ?? "Failed to save", "error");
    } finally {
      setSavingShippoField(null);
    }
  }

  async function saveServiceLevel() {
    const value = shippoServiceLevel.trim();
    if (!value) return;
    setSavingServiceLevel(true);
    try {
      const updated = await shippingSettingsApi.update({ shippoServiceLevel: value });
      setShippoServiceLevel(updated.shippoServiceLevel ?? "");
      showToast("Service level saved");
    } catch (err: any) {
      showToast(err?.message ?? "Failed to save", "error");
    } finally {
      setSavingServiceLevel(false);
    }
  }

  function handleShippoModeToggle(newMode: "test" | "live") {
    if (newMode === "live" && shippoMode !== "live") setShowShippoLiveBanner(true);
    setShippoMode(newMode);
  }

  async function handleShippingSave() {
    setShippingSaving(true);
    setShippingTestResult(null);
    try {
      const payload: Record<string, string> = { mode: shippoMode, shippoServiceLevel };
      for (const [key, field] of Object.entries(shippoFields) as [ShippoFieldKey, FieldState][]) {
        if (field.editing && field.draft.trim()) payload[key] = field.draft.trim();
      }
      const updated = await shippingSettingsApi.update(payload);
      setShippoMode(updated.mode);
      setShippoFields({
        shippoApiKeyTest: makeField(updated.shippoApiKeyTest),
        shippoApiKeyLive: makeField(updated.shippoApiKeyLive),
      });
      setShippoServiceLevel(updated.shippoServiceLevel ?? "");
      setShowShippoLiveBanner(false);
      setShippingSaved(true);
      setTimeout(() => setShippingSaved(false), 2500);
      showToast("Settings saved");
    } catch (err: any) {
      showToast(err?.message ?? "Failed to save", "error");
    }
    finally { setShippingSaving(false); }
  }

  async function handleShippingTest() {
    setShippingTesting(true);
    setShippingTestResult(null);
    try {
      await shippingSettingsApi.test();
      setShippingTestResult({ ok: true });
    } catch (err: any) {
      setShippingTestResult({ ok: false, error: err?.message ?? "Connection failed" });
    } finally {
      setShippingTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage Stripe payment keys and the Shippo shipping API key.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 h-10 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold hover:border-zinc-400 transition-colors disabled:opacity-60"
          >
            {testing
              ? <div className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              : <Zap className="h-3.5 w-3.5" />}
            Test Connection
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${saved ? "bg-emerald-500 text-white" : "bg-black text-white hover:bg-zinc-800"}`}
          >
            {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      {testResult && (
        <div className={`mb-6 flex items-center gap-3 p-4 rounded-2xl border text-sm font-medium ${testResult.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {testResult.ok
            ? <><CheckCircle className="h-4 w-4 shrink-0" /> Connected — Account: {testResult.accountId}</>
            : <><XCircle className="h-4 w-4 shrink-0" /> {testResult.error}</>}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 max-w-2xl">
        <p className="text-sm font-bold mb-5">Stripe Payment Keys</p>

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Active Mode</p>
          <div className="flex gap-2">
            {(["test", "live"] as const).map(m => (
              <button
                key={m}
                onClick={() => handleModeToggle(m)}
                className={`h-9 px-5 rounded-xl text-sm font-bold transition-all ${mode === m ? "bg-black text-white" : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
              >
                {m === "test" ? "Test Mode" : "Live Mode"}
              </button>
            ))}
          </div>
          {showLiveBanner && mode === "live" && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Live mode is active — real customer cards will be charged. Save to confirm.
            </div>
          )}
        </div>

        <WebhookGuide />

        <div className="space-y-6">
          <KeySection
            title="Test Keys"
            fields={[
              { label: "Publishable Key", fieldKey: "stripePublishableKeyTest" as StripeFieldKey, placeholder: "pk_test_..." },
              { label: "Secret Key", fieldKey: "stripeSecretKeyTest" as StripeFieldKey, placeholder: "sk_test_..." },
              { label: "Webhook Secret", fieldKey: "stripeWebhookSecretTest" as StripeFieldKey, placeholder: "whsec_..." },
            ]}
            state={fields}
            savingKey={savingField}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onDraftChange={setDraft}
            onSave={saveField}
          />
          <KeySection
            title="Live Keys"
            fields={[
              { label: "Publishable Key", fieldKey: "stripePublishableKeyLive" as StripeFieldKey, placeholder: "pk_live_..." },
              { label: "Secret Key", fieldKey: "stripeSecretKeyLive" as StripeFieldKey, placeholder: "sk_live_..." },
              { label: "Webhook Secret", fieldKey: "stripeWebhookSecretLive" as StripeFieldKey, placeholder: "whsec_..." },
            ]}
            state={fields}
            savingKey={savingField}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onDraftChange={setDraft}
            onSave={saveField}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 max-w-2xl mt-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-bold">Shippo Shipping Key</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShippingTest}
              disabled={shippingTesting}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-zinc-200 bg-white text-xs font-semibold hover:border-zinc-400 transition-colors disabled:opacity-60"
            >
              {shippingTesting
                ? <div className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                : <Zap className="h-3.5 w-3.5" />}
              Test Connection
            </button>
            <button
              onClick={handleShippingSave}
              disabled={shippingSaving}
              className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-60 ${shippingSaved ? "bg-emerald-500 text-white" : "bg-black text-white hover:bg-zinc-800"}`}
            >
              {shippingSaved ? <><Check className="h-3.5 w-3.5" /> Saved!</> : <><Save className="h-3.5 w-3.5" /> Save</>}
            </button>
          </div>
        </div>

        {shippingTestResult && (
          <div className={`mb-5 flex items-center gap-3 p-3 rounded-xl border text-xs font-medium ${shippingTestResult.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {shippingTestResult.ok
              ? <><CheckCircle className="h-3.5 w-3.5 shrink-0" /> Connected to Shippo</>
              : <><XCircle className="h-3.5 w-3.5 shrink-0" /> {shippingTestResult.error}</>}
          </div>
        )}

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Active Mode</p>
          <div className="flex gap-2">
            {(["test", "live"] as const).map(m => (
              <button
                key={m}
                onClick={() => handleShippoModeToggle(m)}
                className={`h-9 px-5 rounded-xl text-sm font-bold transition-all ${shippoMode === m ? "bg-black text-white" : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
              >
                {m === "test" ? "Test Mode" : "Live Mode"}
              </button>
            ))}
          </div>
          {showShippoLiveBanner && shippoMode === "live" && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Live mode is active — real shipping labels will be purchased. Save to confirm.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <KeySection
            title="Test Key"
            fields={[
              { label: "API Key", fieldKey: "shippoApiKeyTest" as ShippoFieldKey, placeholder: "shippo_test_..." },
            ]}
            state={shippoFields}
            savingKey={savingShippoField}
            onStartEdit={startShippoEdit}
            onCancelEdit={cancelShippoEdit}
            onDraftChange={setShippoDraft}
            onSave={saveShippoField}
          />
          <KeySection
            title="Live Key"
            fields={[
              { label: "API Key", fieldKey: "shippoApiKeyLive" as ShippoFieldKey, placeholder: "shippo_live_..." },
            ]}
            state={shippoFields}
            savingKey={savingShippoField}
            onStartEdit={startShippoEdit}
            onCancelEdit={cancelShippoEdit}
            onDraftChange={setShippoDraft}
            onSave={saveShippoField}
          />

          <div>
            <label className="text-xs font-semibold text-zinc-500 block mb-1.5">Service Level</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shippoServiceLevel}
                onChange={e => setShippoServiceLevel(e.target.value)}
                placeholder="royalmail_tracked48"
                disabled={savingServiceLevel}
                className="flex-1 h-10 px-3 rounded-xl border border-zinc-200 font-mono text-sm outline-none focus:border-black disabled:opacity-60"
              />
              <button
                onClick={saveServiceLevel}
                disabled={savingServiceLevel || !shippoServiceLevel.trim()}
                className="h-10 px-4 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                {savingServiceLevel
                  ? <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Save className="h-3.5 w-3.5" />}
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebhookGuide() {
  const [copied, setCopied] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";
  const endpoint = `${apiUrl}/payments/webhook`;

  function handleCopy() {
    navigator.clipboard.writeText(endpoint).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="mb-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Webhook Endpoint</p>
      <p className="text-xs text-zinc-500 mb-2">
        In the Stripe Dashboard, under Developers → Webhooks → Add endpoint, use this URL. Stripe will give you a signing secret (<span className="font-mono">whsec_...</span>) — paste it into the Webhook Secret field below.
      </p>
      <div className="flex gap-2">
        <div className="flex-1 h-9 px-3 rounded-lg border border-zinc-200 bg-white flex items-center font-mono text-xs text-zinc-700 overflow-x-auto whitespace-nowrap">
          {endpoint}
        </div>
        <button
          onClick={handleCopy}
          className="h-9 px-3 rounded-lg border border-zinc-200 bg-white text-xs font-bold text-zinc-600 hover:border-zinc-400 transition-colors shrink-0"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function Toast({ toast }: { toast: ToastState }) {
  return (
    <div
      className={`fixed top-5 right-5 z-50 transition-all duration-300 ${
        toast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      {toast && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${
            toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

function StatusPill({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Configured
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" /> Not set
    </span>
  );
}

function KeySection<K extends string>({
  title,
  fields,
  state,
  savingKey,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
  onSave,
}: {
  title: string;
  fields: { label: string; fieldKey: K; placeholder: string }[];
  state: Record<K, FieldState>;
  savingKey: K | null;
  onStartEdit: (key: K) => void;
  onCancelEdit: (key: K) => void;
  onDraftChange: (key: K, value: string) => void;
  onSave: (key: K) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">{title}</p>
      <div className="space-y-3">
        {fields.map(({ label, fieldKey, placeholder }) => {
          const field = state[fieldKey];
          const isSaving = savingKey === fieldKey;
          return (
            <div key={fieldKey}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-500">{label}</label>
                <StatusPill configured={Boolean(field.masked)} />
              </div>
              {field.editing ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={field.draft}
                    onChange={e => onDraftChange(fieldKey, e.target.value)}
                    placeholder={placeholder}
                    disabled={isSaving}
                    className="flex-1 min-w-0 h-10 px-3 rounded-xl border-2 border-black font-mono text-sm outline-none disabled:opacity-60"
                  />
                  <button
                    onClick={() => onSave(fieldKey)}
                    disabled={isSaving || !field.draft.trim()}
                    className="h-10 px-4 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {isSaving
                      ? <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <Save className="h-3.5 w-3.5" />}
                    Save
                  </button>
                  <button
                    onClick={() => onCancelEdit(fieldKey)}
                    disabled={isSaving}
                    className="h-10 px-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <div
                    title={field.masked ?? undefined}
                    className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center font-mono text-sm text-zinc-500 overflow-hidden"
                  >
                    {field.masked
                      ? <span className="truncate">{field.masked}</span>
                      : <span className="text-zinc-300 italic text-xs">Not configured</span>}
                  </div>
                  <button
                    onClick={() => onStartEdit(fieldKey)}
                    className="h-10 px-4 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
