"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { ChartBar, CircleNotch, Plus, Trash, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";

interface ConcurrentResult {
  url: string;
  scores: Record<string, number | string>;
  grade: string;
  global: number;
}

interface ConcurrentAnalysis {
  urls: string[];
  status: string;
  results?: ConcurrentResult[];
  synthese?: string;
}

interface Props {
  auditId: string;
  hostname: string;
  ownScores: { global: number; grade: string; technique: number; seo: number; presence: number; ux: number };
  isOwner: boolean;
  initialAnalysis?: ConcurrentAnalysis;
}

const GRADE_COLOR: Record<string, string> = {
  A: "text-green-700", B: "text-green-600", C: "text-amber-600", D: "text-orange-600", F: "text-red-600",
};

const AXES = [
  { key: "technique", label: "Technique", max: 30 },
  { key: "seo", label: "SEO", max: 30 },
  { key: "presence", label: "Présence", max: 25 },
  { key: "ux", label: "UX", max: 15 },
];

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-sable rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-medium text-charbon w-10 text-right">{value}/{max}</span>
    </div>
  );
}

export function ConcurrentSection({ auditId, hostname, ownScores, isOwner, initialAnalysis }: Props) {
  const [analysis, setAnalysis] = useState<ConcurrentAnalysis | null>(initialAnalysis ?? null);
  const [urls, setUrls] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const me = useQuery(api.credits.getMe);
  const lancer = useAction(api.ai.lancerAnalyseConcurrentielle);

  const canAfford = (me?.creditsBalance ?? 0) >= 15;
  const validUrls = urls.filter((u) => u.trim().length > 0);

  function addUrl() {
    if (urls.length < 2) setUrls([...urls, ""]);
  }

  function removeUrl(i: number) {
    setUrls(urls.filter((_, idx) => idx !== i));
  }

  function updateUrl(i: number, val: string) {
    const next = [...urls];
    next[i] = val;
    setUrls(next);
  }

  async function handleLancer() {
    if (validUrls.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await lancer({
        auditId: auditId as Id<"audits">,
        concurrentUrls: validUrls,
      });
      setAnalysis({
        urls: validUrls,
        status: "done",
        results: result.results as ConcurrentResult[],
        synthese: result.synthese,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg === "Solde insuffisant" ? "Crédits insuffisants pour cette analyse." : msg);
    } finally {
      setLoading(false);
    }
  }

  // Construire le tableau de comparaison
  const allSites = analysis?.status === "done" ? [
    { url: hostname, scores: ownScores, grade: ownScores.grade, global: ownScores.global, isOwn: true },
    ...(analysis.results ?? []).map((r) => ({
      url: new URL(/^https?:\/\//.test(r.url) ? r.url : `https://${r.url}`).hostname,
      scores: r.scores as Record<string, number>,
      grade: r.grade,
      global: r.global,
      isOwn: false,
    })),
  ] : null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-semibold text-charbon flex items-center gap-2">
            <ChartBar size={18} weight="duotone" className="text-savane" />
            Analyse concurrentielle
          </h2>
          <p className="text-[12px] text-pierre mt-0.5">
            Comparez votre score avec 1 ou 2 concurrents
          </p>
        </div>
      </div>

      {/* Formulaire — seulement si pas encore analysé */}
      {!analysis && isOwner && (
        <div className="bg-white border border-bordure rounded-2xl px-5 py-5 space-y-4">
          <div className="space-y-2">
            {urls.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => updateUrl(i, e.target.value)}
                  placeholder={`URL concurrent ${i + 1} (ex: concurrent.com)`}
                  className="flex-1 h-10 px-3 rounded-xl border border-bordure text-[13px] text-charbon placeholder:text-pierre/50 outline-none focus:border-charbon/40 transition-colors"
                />
                {urls.length > 1 && (
                  <button onClick={() => removeUrl(i)} className="text-pierre hover:text-red-500 transition-colors">
                    <Trash size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            {urls.length < 2 ? (
              <button
                onClick={addUrl}
                className="inline-flex items-center gap-1.5 text-[12px] text-pierre hover:text-charbon transition-colors"
              >
                <Plus size={13} /> Ajouter un 2e concurrent
              </button>
            ) : <div />}

            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleLancer}
                disabled={loading || !canAfford || validUrls.length === 0}
                className="inline-flex items-center gap-2 bg-charbon text-white text-[13px] font-medium px-4 py-2.5 rounded-xl hover:bg-charbon/90 transition-colors disabled:opacity-40"
              >
                {loading ? (
                  <><CircleNotch size={14} className="animate-spin" /> Analyse en cours…</>
                ) : (
                  <><ChartBar size={14} weight="duotone" /> Analyser — 15 crédits</>
                )}
              </button>
              {!canAfford && (
                <Link href="/credits" className="text-[11px] text-savane underline">Recharger</Link>
              )}
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}

          <p className="text-[11px] text-pierre">
            L&apos;analyse peut prendre 30 à 60 secondes par concurrent.
          </p>
        </div>
      )}

      {!isOwner && !analysis && (
        <div className="bg-parchemin border border-bordure rounded-2xl px-6 py-8 text-center">
          <ChartBar size={28} weight="duotone" className="text-savane mx-auto mb-3" />
          <p className="text-[13px] text-pierre">
            Le propriétaire peut comparer ce site avec ses concurrents directs.
          </p>
        </div>
      )}

      {/* Résultats */}
      <AnimatePresence>
        {analysis?.status === "done" && allSites && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Tableau comparatif */}
            <div className="bg-white border border-bordure rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[1fr_repeat(auto-fill,minmax(100px,1fr))] divide-x divide-bordure">
                {/* Header */}
                <div className="px-4 py-3 bg-parchemin text-[11px] font-semibold text-pierre uppercase tracking-wide">Axe</div>
                {allSites.map((site) => (
                  <div key={site.url} className={`px-3 py-3 bg-parchemin text-center ${site.isOwn ? "bg-savane/10" : ""}`}>
                    <p className="text-[11px] font-semibold text-charbon truncate">{site.isOwn ? "Vous" : site.url}</p>
                    <p className={`text-[13px] font-bold ${GRADE_COLOR[site.grade]}`}>{site.grade} · {site.global}/100</p>
                  </div>
                ))}
              </div>
              <div className="divide-y divide-bordure">
                {AXES.map(({ key, label, max }) => (
                  <div key={key} className="grid grid-cols-[1fr_repeat(auto-fill,minmax(100px,1fr))] divide-x divide-bordure">
                    <div className="px-4 py-3">
                      <p className="text-[12px] font-medium text-charbon">{label}</p>
                      <p className="text-[10px] text-pierre">/{max} pts</p>
                    </div>
                    {allSites.map((site) => {
                      const rawScore = (site.scores as Record<string, number | string>)[key];
                      const val = typeof rawScore === "number" ? rawScore : 0;
                      return (
                        <div key={site.url} className={`px-3 py-3 ${site.isOwn ? "bg-savane/5" : ""}`}>
                          <ScoreBar value={val} max={max} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Synthèse IA */}
            {analysis.synthese && (
              <div className="bg-parchemin border border-bordure rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkle size={15} weight="duotone" className="text-savane" />
                  <span className="text-[12px] font-semibold text-pierre uppercase tracking-wide">Synthèse IA</span>
                </div>
                <p className="text-[13px] text-charbon leading-relaxed">{analysis.synthese}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
