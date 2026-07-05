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

type FieldKey = "stripeSecretKeyTest" | "stripeSecretKeyLive" | "stripeWebhookSecretTest" | "stripeWebhookSecretLive";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [mode, setMode] = useState<"test" | "live">("test");
  const [showLiveBanner, setShowLiveBanner] = useState(false);

  const [fields, setFields] = useState<Record<FieldKey, FieldState>>({
    stripeSecretKeyTest: makeField(null),
    stripeSecretKeyLive: makeField(null),
    stripeWebhookSecretTest: makeField(null),
    stripeWebhookSecretLive: makeField(null),
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
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function startEdit(key: FieldKey) {
    setFields(f => ({ ...f, [key]: { ...f[key], editing: true, draft: "" } }));
  }

  function cancelEdit(key: FieldKey) {
    setFields(f => ({ ...f, [key]: { ...f[key], editing: false, draft: "" } }));
  }

  function setDraft(key: FieldKey, value: string) {
    setFields(f => ({ ...f, [key]: { ...f[key], draft: value } }));
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
      for (const [key, field] of Object.entries(fields) as [FieldKey, FieldState][]) {
        if (field.editing && field.draft.trim()) payload[key] = field.draft.trim();
      }
      const updated = await paymentSettingsApi.update(payload);
      setMode(updated.mode);
      setFields({
        stripeSecretKeyTest: makeField(updated.stripeSecretKeyTest),
        stripeSecretKeyLive: makeField(updated.stripeSecretKeyLive),
        stripeWebhookSecretTest: makeField(updated.stripeWebhookSecretTest),
        stripeWebhookSecretLive: makeField(updated.stripeWebhookSecretLive),
      });
      setShowLiveBanner(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
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
  const [shippoKeyMasked, setShippoKeyMasked] = useState<string | null>(null);
  const [shippoKeyEditing, setShippoKeyEditing] = useState(false);
  const [shippoKeyDraft, setShippoKeyDraft] = useState("");
  const [shippoServiceLevel, setShippoServiceLevel] = useState("");

  useEffect(() => {
    shippingSettingsApi.get()
      .then((s: ShippingSettings) => {
        setShippoKeyMasked(s.shippoApiKey);
        setShippoServiceLevel(s.shippoServiceLevel ?? "");
      })
      .catch(() => {})
      .finally(() => setShippingLoading(false));
  }, []);

  async function handleShippingSave() {
    setShippingSaving(true);
    setShippingTestResult(null);
    try {
      const payload: Record<string, string> = { shippoServiceLevel };
      if (shippoKeyEditing && shippoKeyDraft.trim()) payload.shippoApiKey = shippoKeyDraft.trim();
      const updated = await shippingSettingsApi.update(payload);
      setShippoKeyMasked(updated.shippoApiKey);
      setShippoServiceLevel(updated.shippoServiceLevel ?? "");
      setShippoKeyEditing(false);
      setShippoKeyDraft("");
      setShippingSaved(true);
      setTimeout(() => setShippingSaved(false), 2500);
    } catch { /* ignore */ }
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

        <div className="space-y-6">
          <KeySection
            title="Test Keys"
            fields={[
              { label: "Secret Key", fieldKey: "stripeSecretKeyTest" as FieldKey, placeholder: "sk_test_..." },
              { label: "Webhook Secret", fieldKey: "stripeWebhookSecretTest" as FieldKey, placeholder: "whsec_..." },
            ]}
            state={fields}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onDraftChange={setDraft}
          />
          <KeySection
            title="Live Keys"
            fields={[
              { label: "Secret Key", fieldKey: "stripeSecretKeyLive" as FieldKey, placeholder: "sk_live_..." },
              { label: "Webhook Secret", fieldKey: "stripeWebhookSecretLive" as FieldKey, placeholder: "whsec_..." },
            ]}
            state={fields}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onDraftChange={setDraft}
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

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-zinc-500 block mb-1.5">API Key</label>
            {shippoKeyEditing ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={shippoKeyDraft}
                  onChange={e => setShippoKeyDraft(e.target.value)}
                  placeholder="shippo_test_..."
                  className="flex-1 h-10 px-3 rounded-xl border-2 border-black font-mono text-sm outline-none"
                />
                <button
                  onClick={() => { setShippoKeyEditing(false); setShippoKeyDraft(""); }}
                  className="h-10 px-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-500 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <div className="flex-1 h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center font-mono text-sm text-zinc-500">
                  {shippingLoading ? "Loading…" : (shippoKeyMasked ?? <span className="text-zinc-300 italic text-xs">Not configured</span>)}
                </div>
                <button
                  onClick={() => setShippoKeyEditing(true)}
                  className="h-10 px-4 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition-colors flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 block mb-1.5">Service Level</label>
            <input
              type="text"
              value={shippoServiceLevel}
              onChange={e => setShippoServiceLevel(e.target.value)}
              placeholder="royalmail_tracked48"
              className="w-full h-10 px-3 rounded-xl border border-zinc-200 font-mono text-sm outline-none focus:border-black"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function KeySection({
  title,
  fields,
  state,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
}: {
  title: string;
  fields: { label: string; fieldKey: FieldKey; placeholder: string }[];
  state: Record<FieldKey, FieldState>;
  onStartEdit: (key: FieldKey) => void;
  onCancelEdit: (key: FieldKey) => void;
  onDraftChange: (key: FieldKey, value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">{title}</p>
      <div className="space-y-3">
        {fields.map(({ label, fieldKey, placeholder }) => {
          const field = state[fieldKey];
          return (
            <div key={fieldKey}>
              <label className="text-xs font-semibold text-zinc-500 block mb-1.5">{label}</label>
              {field.editing ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={field.draft}
                    onChange={e => onDraftChange(fieldKey, e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 h-10 px-3 rounded-xl border-2 border-black font-mono text-sm outline-none"
                  />
                  <button
                    onClick={() => onCancelEdit(fieldKey)}
                    className="h-10 px-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-500 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <div className="flex-1 h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center font-mono text-sm text-zinc-500">
                    {field.masked ?? <span className="text-zinc-300 italic text-xs">Not configured</span>}
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
