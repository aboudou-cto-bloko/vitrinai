"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { CircleNotch, Coins, Gift, ToggleLeft, ToggleRight, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Section : Attribuer des crédits
// ─────────────────────────────────────────────────────────────────────────────

function GrantCreditsSection() {
  const users = useQuery(api.credits.listUsers) as Array<{
    _id: Id<"users">;
    email: string;
    name?: string;
    creditsBalance: number;
  }> | undefined;

  const grantCredits = useMutation(api.admin.grantCredits);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<Id<"users"> | null>(null);
  const [amount, setAmount] = useState("10");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = users?.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const selected = users?.find((u) => u._id === selectedId);

  async function handleGrant() {
    if (!selectedId) { toast.error("Sélectionnez un utilisateur"); return; }
    const n = parseInt(amount);
    if (!n || n <= 0) { toast.error("Montant invalide"); return; }
    setLoading(true);
    try {
      await grantCredits({ userId: selectedId, amount: n, note: note || undefined });
      toast.success(`${n} crédits attribués à ${selected?.email}`);
      setAmount("10");
      setNote("");
      setSelectedId(null);
      setSearch("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-bordure p-6">
      <h3 className="text-[15px] font-semibold text-charbon mb-1 flex items-center gap-2">
        <Coins size={17} weight="duotone" className="text-savane" />
        Attribuer des crédits
      </h3>
      <p className="text-[12px] text-pierre mb-5">Crédite directement le solde d&apos;un utilisateur.</p>

      <div className="space-y-4">
        {/* Recherche utilisateur */}
        <div>
          <label className="block text-[12px] font-medium text-olive mb-1.5">Utilisateur</label>
          <input
            type="text"
            placeholder="Rechercher par email ou nom…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedId(null); }}
            className="w-full h-9 px-3 rounded-xl border border-bordure text-[13px] text-charbon bg-parchemin focus:outline-none focus:ring-2 focus:ring-savane/30"
          />
          {search && !selectedId && filtered.length > 0 && (
            <div className="mt-1 border border-bordure rounded-xl bg-white shadow-sm overflow-hidden max-h-48 overflow-y-auto">
              {filtered.map((u) => (
                <button
                  key={u._id}
                  onClick={() => { setSelectedId(u._id); setSearch(u.email); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-parchemin transition-colors border-b border-bordure last:border-0"
                >
                  <div>
                    <p className="text-[13px] font-medium text-charbon">{u.email}</p>
                    {u.name && <p className="text-[11px] text-pierre">{u.name}</p>}
                  </div>
                  <span className="text-[12px] font-semibold text-savane">{u.creditsBalance} cr</span>
                </button>
              ))}
            </div>
          )}
          {selectedId && selected && (
            <p className="text-[11px] text-savane mt-1">
              Solde actuel : <strong>{selected.creditsBalance} crédits</strong>
            </p>
          )}
        </div>

        {/* Montant */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[12px] font-medium text-olive mb-1.5">Crédits à attribuer</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-bordure text-[13px] text-charbon bg-parchemin focus:outline-none focus:ring-2 focus:ring-savane/30"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[12px] font-medium text-olive mb-1.5">Note (optionnel)</label>
            <input
              type="text"
              placeholder="ex: compensation incident"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-bordure text-[13px] text-charbon bg-parchemin focus:outline-none focus:ring-2 focus:ring-savane/30"
            />
          </div>
        </div>

        <button
          onClick={handleGrant}
          disabled={loading || !selectedId}
          className="inline-flex items-center gap-2 bg-savane text-white text-[13px] font-medium px-5 py-2.5 rounded-xl hover:bg-savane/90 transition-colors disabled:opacity-40"
        >
          {loading ? <CircleNotch size={14} className="animate-spin" /> : <Coins size={14} weight="duotone" />}
          Attribuer
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section : Codes promo
// ─────────────────────────────────────────────────────────────────────────────

function PromoCodesSection() {
  type PromoCode = {
    _id: Id<"promoCodes">;
    code: string;
    credits: number;
    usesMax?: number;
    usesCount: number;
    expiresAt?: number;
    active: boolean;
    createdAt: number;
  };

  const codes = useQuery(api.admin.listPromoCodes) as PromoCode[] | undefined;
  const createPromoCode = useMutation(api.admin.createPromoCode);
  const togglePromoCode = useMutation(api.admin.togglePromoCode);

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState("5");
  const [usesMax, setUsesMax] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);

  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "VITRIN";
    for (let i = 0; i < 4; i++) result += chars[Math.floor(Math.random() * chars.length)];
    setCode(result);
  }

  async function handleCreate() {
    if (!code.trim()) { toast.error("Entrez un code"); return; }
    const n = parseInt(credits);
    if (!n || n <= 0) { toast.error("Montant invalide"); return; }
    setLoading(true);
    try {
      await createPromoCode({
        code,
        credits: n,
        usesMax: usesMax ? parseInt(usesMax) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
      });
      toast.success(`Code ${code.toUpperCase()} créé`);
      setCode(""); setCredits("5"); setUsesMax(""); setExpiresAt("");
      setShowForm(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-bordure p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-semibold text-charbon flex items-center gap-2">
            <Gift size={17} weight="duotone" className="text-savane" />
            Codes promo
          </h3>
          <p className="text-[12px] text-pierre mt-0.5">{codes?.length ?? "—"} codes créés</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 bg-charbon text-white text-[12px] font-medium px-4 py-2 rounded-xl hover:bg-charbon/85 transition-colors"
        >
          <Plus size={13} weight="bold" />
          Nouveau code
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-parchemin rounded-xl border border-bordure p-4 mb-5 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-olive mb-1">Code</label>
              <input
                type="text"
                placeholder="ex: VITRIN2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 rounded-xl border border-bordure text-[13px] font-mono text-charbon bg-white focus:outline-none focus:ring-2 focus:ring-savane/30"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={generateCode}
                className="h-9 px-3 rounded-xl border border-bordure text-[12px] text-olive bg-white hover:bg-sable transition-colors"
              >
                Générer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-olive mb-1">Crédits</label>
              <input
                type="number"
                min="1"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-bordure text-[13px] text-charbon bg-white focus:outline-none focus:ring-2 focus:ring-savane/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-olive mb-1">Utilisations max</label>
              <input
                type="number"
                min="1"
                placeholder="illimité"
                value={usesMax}
                onChange={(e) => setUsesMax(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-bordure text-[13px] text-charbon bg-white focus:outline-none focus:ring-2 focus:ring-savane/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-olive mb-1">Expire le</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-bordure text-[13px] text-charbon bg-white focus:outline-none focus:ring-2 focus:ring-savane/30"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-savane text-white text-[12px] font-medium px-4 py-2 rounded-xl hover:bg-savane/90 transition-colors disabled:opacity-40"
            >
              {loading ? <CircleNotch size={13} className="animate-spin" /> : <Gift size={13} weight="duotone" />}
              Créer le code
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-[12px] text-pierre hover:text-charbon transition-colors px-3"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table des codes */}
      <div className="overflow-hidden rounded-xl border border-bordure">
        <table className="w-full text-[12px]">
          <thead className="bg-parchemin border-b border-bordure">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-pierre">Code</th>
              <th className="text-right px-4 py-2.5 font-medium text-pierre">Crédits</th>
              <th className="text-right px-4 py-2.5 font-medium text-pierre">Utilisations</th>
              <th className="text-left px-4 py-2.5 font-medium text-pierre">Expiration</th>
              <th className="text-center px-4 py-2.5 font-medium text-pierre">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bordure">
            {!codes && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-pierre">Chargement…</td></tr>
            )}
            {codes?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-pierre">Aucun code promo</td></tr>
            )}
            {codes?.map((c) => (
              <tr key={c._id} className="hover:bg-parchemin/40 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-charbon">{c.code}</td>
                <td className="px-4 py-3 text-right text-savane font-semibold">+{c.credits}</td>
                <td className="px-4 py-3 text-right text-olive">
                  {c.usesCount}{c.usesMax != null ? ` / ${c.usesMax}` : ""}
                </td>
                <td className="px-4 py-3 text-pierre">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => togglePromoCode({ codeId: c._id })}
                    title={c.active ? "Désactiver" : "Activer"}
                  >
                    {c.active
                      ? <ToggleRight size={22} weight="fill" className="text-savane mx-auto" />
                      : <ToggleLeft size={22} className="text-pierre mx-auto" />
                    }
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminCreditsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-semibold text-charbon mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Crédits & Codes promo
        </h2>
        <p className="text-[13px] text-pierre">Attribuez des crédits manuellement ou gérez les codes promotionnels.</p>
      </div>
      <GrantCreditsSection />
      <PromoCodesSection />
    </div>
  );
}
