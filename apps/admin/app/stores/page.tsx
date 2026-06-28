"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Check, X, Phone, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import { storesApi, type Store } from "../../lib/api";

const EMPTY: Omit<Store, "id" | "createdAt"> = {
  name: "", address: "", city: "", postcode: "",
  phone: "", openingHours: "", isActive: true,
};

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Store | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      setStores(await storesApi.list());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm({ ...EMPTY });
    setEditing(null);
    setAdding(true);
  }

  function openEdit(store: Store) {
    setForm({
      name: store.name, address: store.address, city: store.city,
      postcode: store.postcode, phone: store.phone ?? "",
      openingHours: store.openingHours ?? "", isActive: store.isActive,
    });
    setEditing(store);
    setAdding(false);
  }

  function closeForm() { setAdding(false); setEditing(null); }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await storesApi.update(editing.id, form);
      } else {
        await storesApi.create(form);
      }
      closeForm();
      await load();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await storesApi.remove(id);
      await load();
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  }

  async function handleToggle(store: Store) {
    try {
      await storesApi.update(store.id, { isActive: !store.isActive });
      await load();
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Locations</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage the drop-off locations shown to customers during trade-in.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-11 px-5 rounded-2xl bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add store
        </button>
      </div>

      {/* Add / Edit form */}
      {(adding || editing) && (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg">{editing ? "Edit store" : "New store"}</h2>
            <button onClick={closeForm} className="text-zinc-400 hover:text-zinc-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {([
              { key: "name", label: "Store Name", placeholder: "e.g. TechStop Leicester", span: true },
              { key: "address", label: "Street Address", placeholder: "e.g. 42 High Street", span: true },
              { key: "city", label: "City", placeholder: "e.g. Leicester" },
              { key: "postcode", label: "Postcode", placeholder: "e.g. LE1 1AA" },
              { key: "phone", label: "Phone (optional)", placeholder: "e.g. +44 116 123 4567" },
              { key: "openingHours", label: "Opening Hours (optional)", placeholder: "e.g. Mon–Sat 9am–6pm" },
            ] as { key: string; label: string; placeholder: string; span?: boolean }[]).map(f => (
              <div key={f.key} className={f.span ? "md:col-span-2" : ""}>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">{f.label}</label>
                <input
                  value={(form as unknown as Record<string, string>)[f.key] ?? ""}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full h-11 px-4 rounded-2xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
                />
              </div>
            ))}
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                className="flex items-center gap-2 text-sm font-medium text-zinc-700"
              >
                {form.isActive
                  ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                  : <ToggleLeft className="h-6 w-6 text-zinc-400" />}
                {form.isActive ? "Active — visible to customers" : "Inactive — hidden from customers"}
              </button>
            </div>
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button onClick={closeForm} className="h-10 px-5 rounded-2xl border border-zinc-200 text-sm font-bold hover:border-zinc-400 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.address || !form.city || !form.postcode}
              className="flex items-center gap-2 h-10 px-5 rounded-2xl bg-black text-white text-sm font-bold disabled:opacity-50 hover:bg-zinc-800 transition-colors"
            >
              {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
              {editing ? "Save changes" : "Add store"}
            </button>
          </div>
        </div>
      )}

      {/* Store list */}
      {stores.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No stores yet</p>
          <p className="text-sm mt-1">Add your first store location above.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {stores.map(store => (
            <div key={store.id} className={`bg-white rounded-3xl border shadow-sm p-6 flex flex-col gap-4 transition-opacity ${store.isActive ? "border-zinc-100" : "border-zinc-200 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-zinc-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{store.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${store.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {store.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(store)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                    title={store.isActive ? "Deactivate" : "Activate"}
                  >
                    {store.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(store)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    disabled={deletingId === store.id}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === store.id
                      ? <div className="h-3.5 w-3.5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-500">
                <p className="font-medium text-zinc-700">{store.address}</p>
                <p>{store.city}, {store.postcode}</p>
                {store.phone && (
                  <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{store.phone}</p>
                )}
                {store.openingHours && (
                  <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{store.openingHours}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
