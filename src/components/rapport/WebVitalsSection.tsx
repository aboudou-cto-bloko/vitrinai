"use client";

import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { VitalsData } from "@/lib/audit/types";

interface Props {
  vitals: VitalsData;
}

// ── Thresholds & plain-language meta ─────────────────────────────────────────
const VITAL_META = {
  lcp: {
    label: "LCP",
    titre: "Temps d'affichage principal",
    unit: "s",
    good: 2.5,
    poor: 4,
    what: "Combien de temps avant que le contenu principal de votre page apparaisse à l'écran. C'est le moment où votre visiteur voit enfin quelque chose d'utile.",
    goodWhat: "Votre page s'affiche rapidement — vos visiteurs n'ont pas le temps de s'impatienter.",
    warnWhat: (v: number) => `Votre page met ${v}s à s'afficher. Beaucoup de visiteurs commencent à douter et pensent à quitter à partir de 3 secondes.`,
    poorWhat: (v: number) => `${v}s, c'est trop long. La majorité de vos visiteurs partira avant même de voir votre contenu. C'est une perte directe de clients.`,
    convert: (v: number) => +(v / 1000).toFixed(2),
  },
  fcp: {
    label: "FCP",
    titre: "Première apparition à l'écran",
    unit: "s",
    good: 1.8,
    poor: 3,
    what: "Le temps avant que quoi que ce soit s'affiche — même juste du texte ou un fond. Sans ça, votre visiteur voit une page blanche et pense que le site est cassé.",
    goodWhat: "Votre page réagit vite — le visiteur voit immédiatement que quelque chose se charge.",
    warnWhat: (v: number) => `${v}s avant la première image ou le premier texte. Vos visiteurs voient une page blanche pendant ce temps.`,
    poorWhat: (v: number) => `${v}s de page blanche. Pour un visiteur sur mobile, c'est suffisant pour fermer l'onglet et aller chez un concurrent.`,
    convert: (v: number) => +(v / 1000).toFixed(2),
  },
  tbt: {
    label: "TBT",
    titre: "Temps de blocage",
    unit: "ms",
    good: 200,
    poor: 600,
    what: "La durée pendant laquelle votre page ne répond pas — les clics, le défilement et les touches ne fonctionnent pas. C'est dû à des programmes (scripts) trop lourds qui bloquent le navigateur.",
    goodWhat: "Votre page répond bien aux clics et au défilement — l'expérience est fluide.",
    warnWhat: (v: number) => `Votre page est bloquée pendant ${v} ms. Vos visiteurs peuvent cliquer sur un bouton sans résultat pendant ce temps.`,
    poorWhat: (v: number) => `${v} ms de blocage. Sur mobile, votre page semble gelée. Les visiteurs pensent que le site est cassé et repartent.`,
    convert: (v: number) => Math.round(v),
  },
  cls: {
    label: "CLS",
    titre: "Stabilité de la page",
    unit: "",
    good: 0.1,
    poor: 0.25,
    what: "Est-ce que des éléments (boutons, textes, images) bougent sur la page pendant le chargement ? Si oui, vos visiteurs peuvent cliquer sur le mauvais bouton parce qu'il s'est déplacé au dernier moment.",
    goodWhat: "Les éléments de votre page restent bien en place pendant le chargement — pas de mauvaise surprise.",
    warnWhat: (_v: number) => "Des éléments bougent légèrement pendant le chargement. Vos visiteurs peuvent rater un bouton ou cliquer sur quelque chose qu'ils ne voulaient pas.",
    poorWhat: (_v: number) => "Votre mise en page est très instable. Des blocs entiers se déplacent à l'écran. C'est frustrant et peut provoquer des erreurs de clic.",
    convert: (v: number) => +v.toFixed(3),
  },
  ttfb: {
    label: "TTFB",
    titre: "Réactivité du serveur",
    unit: "ms",
    good: 200,
    poor: 600,
    what: "Le temps entre le moment où quelqu'un visite votre site et le moment où votre serveur commence à répondre. C'est la réactivité de votre hébergement.",
    goodWhat: "Votre serveur répond rapidement — bonne base pour un site performant.",
    warnWhat: (v: number) => `Votre serveur met ${v} ms à répondre. C'est acceptable mais peut impacter l'expérience sur réseaux lents.`,
    poorWhat: (v: number) => `${v} ms de délai serveur. Votre hébergement est trop lent. Sur un réseau mobile africain, cette lenteur s'accumule et double le temps d'attente.`,
    convert: (v: number) => Math.round(v),
  },
} as const;

type VitalKey = keyof typeof VITAL_META;

function getStatus(key: VitalKey, value: number): "good" | "needs-improvement" | "poor" {
  const m = VITAL_META[key];
  const v = m.convert(value);
  if (v <= m.good) return "good";
  if (v <= m.poor) return "needs-improvement";
  return "poor";
}

const STATUS_COLORS = {
  good: "#2d7a4f",
  "needs-improvement": "#f59e0b",
  poor: "#b53333",
};

const STATUS_LABELS = {
  good: "Bon",
  "needs-improvement": "À améliorer",
  poor: "Problème",
};

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ vitKey, value, index }: { vitKey: VitalKey; value: number; index: number }) {
  const m = VITAL_META[vitKey];
  const converted = m.convert(value);
  const status = getStatus(vitKey, value);
  const color = STATUS_COLORS[status];

  const message =
    status === "good"
      ? m.goodWhat
      : status === "needs-improvement"
        ? (typeof m.warnWhat === "function" ? (m.warnWhat as (v: number) => string)(converted) : m.warnWhat)
        : (typeof m.poorWhat === "function" ? (m.poorWhat as (v: number) => string)(converted) : m.poorWhat);

  const barPct = Math.min(100, Math.round((converted / (m.poor * 1.2)) * 100));

  return (
    <motion.div
      className="bg-white rounded-xl border border-bordure p-4 flex flex-col gap-3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-charbon">{m.titre}</span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ color, backgroundColor: `${color}18` }}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
          <p className="text-[11px] text-argent mt-0.5 font-mono">{m.label}</p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[20px] font-bold" style={{ color }}>{converted}</span>
          {m.unit && <span className="text-[12px] text-pierre ml-0.5">{m.unit}</span>}
        </div>
      </div>

      {/* Barre de progression */}
      <div className="space-y-1">
        <div className="h-1.5 bg-sable rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${barPct}%` }}
            transition={{ duration: 0.8, delay: 0.3 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-argent">
          <span>Idéal : ≤{m.good}{m.unit}</span>
          <span>Problème : &gt;{m.poor}{m.unit}</span>
        </div>
      </div>

      {/* Ce que ça veut dire */}
      <div className="space-y-2">
        <p className="text-[12px] text-pierre leading-relaxed italic">{m.what}</p>
        <div
          className="text-[12px] leading-relaxed px-3 py-2 rounded-lg"
          style={{ backgroundColor: `${color}10`, color: status === "good" ? "#2d7a4f" : "#3a3830" }}
        >
          {message}
        </div>
      </div>
    </motion.div>
  );
}

// ── Recharts comparison bar ───────────────────────────────────────────────────
function VitalsChart({ vitals }: { vitals: VitalsData }) {
  const data = (["lcp", "fcp", "tbt", "cls", "ttfb"] as VitalKey[])
    .filter((k) => vitals[k] !== null)
    .map((k) => {
      const m = VITAL_META[k];
      const raw = vitals[k] as number;
      const converted = m.convert(raw);
      const status = getStatus(k, raw);
      const normalized = Math.min(100, Math.round((converted / (m.poor * 1.2)) * 100));
      return {
        name: m.label,
        fullName: m.titre,
        score: normalized,
        color: STATUS_COLORS[status],
      };
    });

  if (data.length === 0) return null;

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e6dc" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#87867f" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "#3a3830", fontWeight: 600, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: "#f5f3ec" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white border border-bordure rounded-lg px-3 py-2 text-[12px] max-w-[200px]">
                  <p className="font-medium text-charbon mb-0.5">{d.fullName}</p>
                  <p className="text-pierre">
                    {d.score <= 50 ? "Bonne performance" : d.score <= 80 ? "À améliorer" : "Problème à régler"}
                  </p>
                </div>
              );
            }}
          />
          {/* Ligne verte = zone idéale */}
          <ReferenceLine x={50} stroke="#2d7a4f" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={14}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function WebVitalsSection({ vitals }: Props) {
  const keys = (["lcp", "fcp", "tbt", "cls", "ttfb"] as VitalKey[]).filter(
    (k) => vitals[k] !== null
  );

  if (keys.length === 0) return null;

  return (
    <motion.section
      className="flex flex-col gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <motion.h2
          className="text-[18px] font-semibold text-charbon"
          style={{ fontFamily: "Georgia, serif" }}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Vitesse et expérience utilisateur
        </motion.h2>
        <motion.p className="text-[13px] text-pierre mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          Ce que vivent concrètement vos visiteurs quand ils ouvrent votre site. Chaque indicateur a un impact direct sur le nombre de clients qui restent ou qui repartent.
        </motion.p>
      </div>

      {/* Vue d'ensemble graphique */}
      <motion.div
        className="bg-white rounded-2xl border border-bordure p-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <p className="text-[12px] text-pierre mb-3">
          Plus la barre est courte et verte, mieux c&apos;est. La ligne pointillée verte = objectif à atteindre.
        </p>
        <VitalsChart vitals={vitals} />
      </motion.div>

      {/* Cartes détaillées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {keys.map((k, i) => (
          <MetricCard key={k} vitKey={k} value={vitals[k] as number} index={i} />
        ))}
      </div>

      {/* Statistiques de la page */}
      {(vitals.totalByteWeightKb !== null || vitals.requestCount !== null) && (
        <motion.div
          className="bg-white rounded-xl border border-bordure p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <p className="text-[13px] font-semibold text-charbon mb-3">Poids de votre site</p>
          <div className="flex flex-wrap gap-4">
            {vitals.totalByteWeightKb !== null && (() => {
              const kb = vitals.totalByteWeightKb;
              const ok = kb <= 500;
              const warn = kb <= 1500;
              const color = ok ? "#2d7a4f" : warn ? "#f59e0b" : "#b53333";
              const label = kb >= 1024 ? `${(kb / 1024).toFixed(1)} Mo` : `${kb} Ko`;
              const msg = ok
                ? "Votre page est légère — vos visiteurs mobiles vous remercient."
                : warn
                  ? `${label} c'est déjà lourd pour un forfait mobile limité. Vos visiteurs sur réseau lent attendront.`
                  : `${label}, c'est trop lourd. Imaginez télécharger un fichier de ${label} juste pour voir votre page d'accueil.`;
              return (
                <div className="flex items-start gap-3 flex-1 min-w-[200px]">
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: color }} />
                  <div>
                    <p className="text-[14px] font-bold text-charbon">{label}</p>
                    <p className="text-[11px] text-pierre">Poids total de la page</p>
                    <p className="text-[12px] mt-1" style={{ color }}>{msg}</p>
                  </div>
                </div>
              );
            })()}
            {vitals.requestCount !== null && (() => {
              const n = vitals.requestCount;
              const ok = n <= 50;
              const warn = n <= 80;
              const color = ok ? "#2d7a4f" : warn ? "#f59e0b" : "#b53333";
              const msg = ok
                ? "Votre page est efficace — elle charge les éléments nécessaires sans surcharger la connexion."
                : warn
                  ? `${n} éléments à charger. Sur un réseau mobile lent, chaque élément supplémentaire ralentit l'affichage.`
                  : `${n} éléments différents doivent être téléchargés pour afficher votre page. C'est beaucoup — chaque élément prend du temps sur réseau mobile.`;
              return (
                <div className="flex items-start gap-3 flex-1 min-w-[200px]">
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: color }} />
                  <div>
                    <p className="text-[14px] font-bold text-charbon">{n} éléments</p>
                    <p className="text-[11px] text-pierre">Chargés par la page</p>
                    <p className="text-[12px] mt-1" style={{ color }}>{msg}</p>
                  </div>
                </div>
              );
            })()}
            {vitals.unoptimizedImages > 0 && (() => {
              const n = vitals.unoptimizedImages;
              return (
                <div className="flex items-start gap-3 flex-1 min-w-[200px]">
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0 bg-warning" />
                  <div>
                    <p className="text-[14px] font-bold text-charbon">{n} image{n > 1 ? "s" : ""}</p>
                    <p className="text-[11px] text-pierre">Non optimisée{n > 1 ? "s" : ""}</p>
                    <p className="text-[12px] mt-1 text-warning">
                      {n > 1
                        ? `Ces ${n} images sont trop lourdes. Réduire leur poids peut accélérer votre site de façon spectaculaire.`
                        : "Cette image est trop lourde. La compresser peut accélérer votre site facilement."}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
