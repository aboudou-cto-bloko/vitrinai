"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Megaphone,
  Plus,
  WhatsappLogo,
  EnvelopeSimple,
  CircleNotch,
  Play,
  StopCircle,
} from "@phosphor-icons/react";

const STATUT_COLORS: Record<string, string> = {
  planifiée: "#87867f",
  en_cours: "#f59e0b",
  terminée: "#2d7a4f",
  suspendue: "#b53333",
};

const TYPE_ICONS = {
  whatsapp: WhatsappLogo,
  email: EnvelopeSimple,
  les_deux: Megaphone,
};

export default function CampagnesPage() {
  const campagnes = useQuery(api.campagnes.list) ?? [];
  const niches = useQuery(api.niches.list) ?? [];
  const create = useMutation(api.campagnes.create);
  const updateStatut = useMutation(api.campagnes.updateStatut);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nicheId: "" as Id<"niches"> | "",
    type: "whatsapp" as "whatsapp" | "email" | "les_deux",
    nombreCible: 50,
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nicheId) return;
    setLoading(true);
    try {
      await create({
        nicheId: form.nicheId as Id<"niches">,
        type: form.type,
        dateExecution: Date.now(),
        nombreCible: form.nombreCible,
      });
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-charbon" style={{ fontFamily: "Georgia, serif" }}>
            Campagnes
          </h2>
          <p className="text-[13px] text-pierre">{campagnes.length} campagne{campagnes.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2" disabled={niches.length === 0}>
          <Plus size={16} weight="bold" />
          Nouvelle campagne
        </Button>
      </div>

      {niches.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-800">
          Créez d&apos;abord une niche dans le CRM pour pouvoir lancer une campagne.
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-bordure p-6">
          <h3 className="text-[15px] font-semibold text-charbon mb-4">Créer une campagne</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px]">Niche cible</Label>
              <select
                className="h-10 rounded-lg border border-bordure-forte bg-white px-3 text-[14px] text-charbon focus:outline-none focus:ring-2 focus:ring-savane/40"
                value={form.nicheId}
                onChange={(e) => setForm((f) => ({ ...f, nicheId: e.target.value as Id<"niches"> }))}
                required
              >
                <option value="">— choisir —</option>
                {niches.map((n) => <option key={n._id} value={n._id}>{n.nom}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px]">Canal</Label>
              <select
                className="h-10 rounded-lg border border-bordure-forte bg-white px-3 text-[14px] text-charbon focus:outline-none focus:ring-2 focus:ring-savane/40"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="les_deux">WhatsApp + Email</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px]">Nombre de messages cible</Label>
              <input
                type="number"
                min={1}
                max={500}
                value={form.nombreCible}
                onChange={(e) => setForm((f) => ({ ...f, nombreCible: parseInt(e.target.value) || 50 }))}
                className="h-10 rounded-lg border border-bordure-forte bg-white px-3 text-[14px] text-charbon focus:outline-none focus:ring-2 focus:ring-savane/40"
              />
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit" disabled={loading || !form.nicheId} className="flex items-center gap-2">
                {loading ? <CircleNotch size={15} className="animate-spin" /> : <Megaphone size={15} weight="duotone" />}
                Créer la campagne
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      {campagnes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-bordure p-12 text-center">
          <Megaphone size={40} weight="duotone" className="text-argent mx-auto mb-3" />
          <p className="text-[14px] text-pierre">
            Aucune campagne. Créez une niche, détectez des leads, puis lancez votre première campagne.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {campagnes.map((c) => {
            const TypeIcon = TYPE_ICONS[c.type as keyof typeof TYPE_ICONS] ?? Megaphone;
            const pct = c.nombreCible > 0 ? Math.round((c.nombreEnvoyes / c.nombreCible) * 100) : 0;
            return (
              <div key={c._id} className="bg-white rounded-xl border border-bordure p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-parchemin flex items-center justify-center shrink-0">
                  <TypeIcon size={20} weight="duotone" className="text-savane" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-medium text-charbon capitalize">{c.type.replace("_", " + ")}</span>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        color: STATUT_COLORS[c.statut] ?? "#87867f",
                        backgroundColor: `${STATUT_COLORS[c.statut] ?? "#87867f"}18`,
                      }}
                    >
                      {c.statut}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-sable rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-savane transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-pierre shrink-0">
                      {c.nombreEnvoyes}/{c.nombreCible} envoyés
                      {c.nombreErreurs > 0 && ` · ${c.nombreErreurs} erreurs`}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {c.statut === "planifiée" && (
                    <button
                      onClick={() => updateStatut({ id: c._id, statut: "en_cours" })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-parchemin text-pierre hover:text-savane transition-colors"
                    >
                      <Play size={16} weight="duotone" />
                    </button>
                  )}
                  {c.statut === "en_cours" && (
                    <button
                      onClick={() => updateStatut({ id: c._id, statut: "suspendue" })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-parchemin text-pierre hover:text-error transition-colors"
                    >
                      <StopCircle size={16} weight="duotone" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
