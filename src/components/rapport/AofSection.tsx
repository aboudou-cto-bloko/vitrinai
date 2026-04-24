"use client";

import { motion } from "motion/react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { AofResult, AofDirective } from "@/lib/audit/types";

interface Props {
  aof: AofResult;
}

// ── Directive card ────────────────────────────────────────────────────────────
const DIRECTIVE_COLORS = {
  critique: { bg: "#fef2f2", border: "#fca5a5", dot: "#b53333", badge: "#b53333", badgeBg: "#b5333318" },
  warning:  { bg: "#fffbeb", border: "#fcd34d", dot: "#f59e0b", badge: "#92400e", badgeBg: "#f59e0b18" },
  info:     { bg: "#f0f9ff", border: "#bae6fd", dot: "#0369a1", badge: "#0369a1", badgeBg: "#0369a118" },
};

const DIRECTIVE_LABELS = { critique: "Problème", warning: "Attention", info: "Conseil" };

function DirectiveCard({ directive, index }: { directive: AofDirective; index: number }) {
  const c = DIRECTIVE_COLORS[directive.type];
  return (
    <motion.div
      className="rounded-xl border p-5 flex flex-col gap-3"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: c.dot }} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ color: c.badge, backgroundColor: c.badgeBg }}
            >
              {DIRECTIVE_LABELS[directive.type]}
            </span>
            <span className="text-[14px] font-semibold text-charbon">{directive.titre}</span>
          </div>
          <p className="text-[13px] text-charbon/80 leading-relaxed">{directive.corps}</p>
        </div>
      </div>
      <div className="ml-5 pl-3 border-l-2" style={{ borderColor: c.dot }}>
        <p className="text-[12px] text-charbon/70">
          <span className="text-[11px] font-semibold uppercase tracking-wide mr-1.5" style={{ color: c.badge }}>Ce qu&apos;il faut faire</span>
          {directive.action}
        </p>
      </div>
    </motion.div>
  );
}

// ── AOF Radar chart ───────────────────────────────────────────────────────────
function AofRadar({ aof }: { aof: AofResult }) {
  const load3GScore = aof.estimatedLoad3G_ms !== null
    ? Math.max(0, 100 - Math.round((aof.estimatedLoad3G_ms / 15000) * 100))
    : 50;
  const weightScore = aof.totalByteWeightKb !== null
    ? Math.max(0, 100 - Math.round((aof.totalByteWeightKb / 3000) * 100))
    : 50;
  const imageScore = Math.max(0, 100 - aof.unoptimizedImages * 15);

  const data = [
    { subject: "Vitesse mobile", score: load3GScore },
    { subject: "Poids page", score: weightScore },
    { subject: "CDN actif", score: aof.hasCDN ? 100 : 0 },
    { subject: "Accès offline", score: aof.hasServiceWorker ? 100 : 0 },
    { subject: "Images OK", score: imageScore },
  ];

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 8, right: 30, bottom: 8, left: 30 }}>
          <PolarGrid stroke="#e8e6dc" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: "#3a3830", fontWeight: 500 }}
          />
          <Radar
            name="Résultat"
            dataKey="score"
            stroke="#c47a3a"
            fill="#c47a3a"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              const label = d.score >= 70 ? "Bon" : d.score >= 40 ? "À améliorer" : "Problème";
              return (
                <div className="bg-white border border-bordure rounded-lg px-3 py-2 text-[12px]">
                  <p className="font-medium text-charbon">{d.subject}</p>
                  <p className="text-pierre">{label}</p>
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── AOF Score ring ────────────────────────────────────────────────────────────
function AofScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#2d7a4f" : score >= 40 ? "#f59e0b" : "#b53333";
  const label = score >= 70 ? "Bon" : score >= 40 ? "Moyen" : "Faible";
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#e8e6dc" strokeWidth="8" />
          <motion.circle
            cx="48" cy="48" r={radius}
            fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-pierre">/100</span>
        </div>
      </div>
      <span className="text-[12px] font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

// ── Summary tile ──────────────────────────────────────────────────────────────
function SummaryTile({
  label, value, explication, ok, index,
}: {
  label: string;
  value: string;
  explication: string;
  ok: boolean | null;
  index: number;
}) {
  const dotColor = ok === null ? "#87867f" : ok ? "#2d7a4f" : "#b53333";
  return (
    <motion.div
      className="bg-white rounded-xl border border-bordure px-4 py-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.15 + index * 0.06 }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
        <p className="text-[11px] text-pierre uppercase tracking-wide font-medium">{label}</p>
      </div>
      <p className="text-[15px] font-bold text-charbon">{value}</p>
      <p className="text-[11px] text-pierre mt-1 leading-snug">{explication}</p>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function AofSection({ aof }: Props) {
  const load3G = aof.estimatedLoad3G_ms !== null
    ? aof.estimatedLoad3G_ms >= 1000
      ? `~${(aof.estimatedLoad3G_ms / 1000).toFixed(1)}s`
      : `~${aof.estimatedLoad3G_ms} ms`
    : "Non mesuré";

  const weight = aof.totalByteWeightKb !== null
    ? aof.totalByteWeightKb >= 1024
      ? `${(aof.totalByteWeightKb / 1024).toFixed(1)} Mo`
      : `${aof.totalByteWeightKb} Ko`
    : "Non mesuré";

  const load3GOk = aof.estimatedLoad3G_ms !== null ? aof.estimatedLoad3G_ms <= 5000 : null;
  const weightOk = aof.totalByteWeightKb !== null ? aof.totalByteWeightKb <= 500 : null;

  const load3GExpl = aof.estimatedLoad3G_ms === null
    ? "Données insuffisantes pour estimer."
    : aof.estimatedLoad3G_ms <= 3000
      ? "Rapide même sur mobile — vos clients n'attendent pas."
      : aof.estimatedLoad3G_ms <= 8000
        ? "Lent sur mobile. La moitié de vos visiteurs peut avoir quitté avant d'arriver."
        : "Très lent. Sur mobile en AOF, la grande majorité de vos visiteurs ne verra pas votre site.";

  const weightExpl = aof.totalByteWeightKb === null
    ? "Données insuffisantes."
    : aof.totalByteWeightKb <= 500
      ? "Léger et rapide — idéal pour tous les réseaux."
      : aof.totalByteWeightKb <= 1500
        ? "Un peu lourd. Sur connexion lente, cela ralentit l'affichage."
        : "Trop lourd pour les forfaits mobiles limités.";

  return (
    <motion.section
      className="flex flex-col gap-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div>
        <motion.h2
          className="text-[18px] font-semibold text-charbon"
          style={{ fontFamily: "Georgia, serif" }}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Votre site vu depuis l&apos;Afrique de l&apos;Ouest
        </motion.h2>
        <motion.p className="text-[13px] text-pierre mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          Google mesure les performances depuis des serveurs en Europe. Cette section simule ce que vit vraiment un visiteur à Dakar, Abidjan ou Lomé — sur mobile avec un réseau 3G standard.
        </motion.p>
      </div>

      {/* Score + radar */}
      <motion.div
        className="bg-white rounded-2xl border border-bordure p-6 flex flex-col sm:flex-row items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col items-center gap-2 shrink-0">
          <AofScoreRing score={aof.aofScore} />
          <p className="text-[11px] text-pierre text-center">Adapté Afrique de l&apos;Ouest</p>
        </div>
        <div className="flex-1 w-full">
          <p className="text-[12px] text-argent mb-2 text-center">Plus le graphique est plein et orange, mieux c&apos;est.</p>
          <AofRadar aof={aof} />
        </div>
      </motion.div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryTile
          label="Chargement mobile 3G"
          value={load3G}
          explication={load3GExpl}
          ok={load3GOk}
          index={0}
        />
        <SummaryTile
          label="Poids de la page"
          value={weight}
          explication={weightExpl}
          ok={weightOk}
          index={1}
        />
        <SummaryTile
          label="CDN (réseau de diffusion)"
          value={aof.cdnProvider ?? "Absent"}
          explication={aof.hasCDN
            ? `Vos fichiers sont distribués via ${aof.cdnProvider}. Ils arrivent plus vite chez vos visiteurs.`
            : "Vos fichiers viennent directement de votre serveur, probablement en Europe. Cela ajoute du délai pour les visiteurs africains."}
          ok={aof.hasCDN}
          index={2}
        />
        <SummaryTile
          label="Accès sans connexion"
          value={aof.hasServiceWorker ? "Disponible" : "Non disponible"}
          explication={aof.hasServiceWorker
            ? "Votre site reste partiellement accessible même en cas de coupure réseau."
            : "En cas de coupure réseau (fréquent en AOF), votre site devient totalement inaccessible."}
          ok={aof.hasServiceWorker}
          index={3}
        />
      </div>

      {/* Directives */}
      {aof.directives.length > 0 && (
        <div className="flex flex-col gap-3">
          <motion.h3
            className="text-[15px] font-semibold text-charbon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Ce qu&apos;il faut corriger pour vos visiteurs en AOF
          </motion.h3>
          {aof.directives.map((d, i) => (
            <DirectiveCard key={i} directive={d} index={i} />
          ))}
        </div>
      )}

      {/* Note méthodologique */}
      <motion.div
        className="bg-parchemin rounded-xl border border-bordure/50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-[11px] text-pierre leading-relaxed">
          <span className="font-semibold text-charbon">Comment c&apos;est calculé : </span>
          Le temps de chargement mobile est estimé avec une latence de 300 ms et une vitesse de téléchargement d&apos;environ 1 Mbps — représentatif des réseaux mobiles 3G en Afrique de l&apos;Ouest. Ce sont des estimations ; les conditions réelles varient selon l&apos;opérateur, la ville et l&apos;heure.
        </p>
      </motion.div>
    </motion.section>
  );
}
