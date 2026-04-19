"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapTrifold,
  Plus,
  CircleNotch,
  Play,
  PauseCircle,
} from "@phosphor-icons/react";

const SECTEURS = [
  "Restaurant", "Hôtel", "Salon de beauté", "Pharmacie", "Cabinet médical",
  "Avocat / Notaire", "Boutique", "Garage auto", "École / Formation", "Autre",
];

const VILLES = [
  "Cotonou", "Lomé", "Abidjan", "Dakar", "Accra", "Ouagadougou", "Bamako", "Niamey",
];

const STATUT_COLORS: Record<string, string> = {
  en_attente: "#87867f",
  en_cours: "#f59e0b",
  terminé: "#2d7a4f",
  en_pause: "#b53333",
};

const STATUT_LABELS: Record<string, string> = {
  en_attente: "En attente",
  en_cours: "En cours",
  terminé: "Terminé",
  en_pause: "En pause",
};

export default function NichesPage() {
  const niches = useQuery(api.niches.list) ?? [];
  const create = useMutation(api.niches.create);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    secteur: SECTEURS[0],
    ville: VILLES[0],
    pays: "Bénin",
    rayon: 10,
  });

  function setField<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await create({
        nom: `${form.secteur} — ${form.ville}`,
        secteur: form.secteur,
        ville: form.ville,
        pays: form.pays,
        rayon: form.rayon,
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
            Niches
          </h2>
          <p className="text-[13px] text-pierre">{niches.length} niche{niches.length !== 1 ? "s" : ""} configurée{niches.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2">
          <Plus size={16} weight="bold" />
          Nouvelle niche
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-bordure p-6">
          <h3 className="text-[15px] font-semibold text-charbon mb-4">Créer une niche</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px]">Secteur</Label>
              <select
                className="h-10 rounded-lg border border-bordure-forte bg-white px-3 text-[14px] text-charbon focus:outline-none focus:ring-2 focus:ring-savane/40"
                value={form.secteur}
                onChange={(e) => setField("secteur", e.target.value)}
              >
                {SECTEURS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px]">Ville</Label>
              <select
                className="h-10 rounded-lg border border-bordure-forte bg-white px-3 text-[14px] text-charbon focus:outline-none focus:ring-2 focus:ring-savane/40"
                value={form.ville}
                onChange={(e) => setField("ville", e.target.value)}
              >
                {VILLES.map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px]">Pays</Label>
              <Input
                value={form.pays}
                onChange={(e) => setField("pays", e.target.value)}
                className="h-10 text-[14px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px]">Rayon (km)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={form.rayon}
                onChange={(e) => setField("rayon", parseInt(e.target.value) || 10)}
                className="h-10 text-[14px]"
              />
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                {loading ? <CircleNotch size={15} className="animate-spin" /> : <Plus size={15} weight="bold" />}
                Créer
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {niches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-bordure p-12 text-center">
          <MapTrifold size={40} weight="duotone" className="text-argent mx-auto mb-3" />
          <p className="text-[14px] text-pierre">Aucune niche pour l&apos;instant. Créez-en une pour commencer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {niches.map((n) => (
            <div key={n._id} className="bg-white rounded-xl border border-bordure p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-parchemin flex items-center justify-center shrink-0">
                <MapTrifold size={20} weight="duotone" className="text-savane" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-charbon">{n.nom}</p>
                <p className="text-[12px] text-pierre">{n.ville} · {n.pays} · rayon {n.rayon} km</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:grid grid-cols-3 gap-4 text-center text-[12px]">
                  <div><div className="font-semibold text-charbon">{n.totalLeads}</div><div className="text-pierre">Leads</div></div>
                  <div><div className="font-semibold text-charbon">{n.leadsSansSite}</div><div className="text-pierre">Sans site</div></div>
                  <div><div className="font-semibold text-charbon">{n.leadsConvertis}</div><div className="text-pierre">Convertis</div></div>
                </div>
                <span
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{
                    color: STATUT_COLORS[n.statut],
                    backgroundColor: `${STATUT_COLORS[n.statut]}18`,
                  }}
                >
                  {STATUT_LABELS[n.statut] ?? n.statut}
                </span>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-parchemin transition-colors text-pierre hover:text-savane">
                  {n.statut === "en_cours" ? <PauseCircle size={18} weight="duotone" /> : <Play size={18} weight="duotone" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
