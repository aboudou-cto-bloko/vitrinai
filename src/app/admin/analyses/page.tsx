"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { CheckCircle, XCircle, Clock, TrendUp, Globe, ChartBar, FilmSlate, WarningCircle } from "@phosphor-icons/react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, { bg: string; text: string; bar: string }> = {
  A: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  B: { bg: "bg-teal-50",    text: "text-teal-700",    bar: "bg-teal-500"    },
  C: { bg: "bg-amber-50",   text: "text-amber-700",   bar: "bg-amber-500"   },
  D: { bg: "bg-orange-50",  text: "text-orange-700",  bar: "bg-orange-500"  },
  F: { bg: "bg-red-50",     text: "text-red-700",     bar: "bg-red-500"     },
};

const AXE_LABEL: Record<string, string> = {
  technique: "Technique",
  seo: "SEO",
  presence: "Présence",
  ux: "UX",
};

function ScoreBar({ value, color = "bg-savane" }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-sable rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[13px] font-semibold text-charbon w-8 text-right">{value}</span>
    </div>
  );
}

function StatCard({
  label, value, sub, Icon, color = "text-savane",
}: {
  label: string;
  value: string | number;
  sub?: string;
  Icon: React.ComponentType<{ size?: number; weight?: "duotone"; className?: string }>;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-bordure p-5 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl bg-sable flex items-center justify-center`}>
        <Icon size={18} weight="duotone" className={color} />
      </div>
      <div>
        <div className="text-[26px] font-bold text-charbon leading-none">{String(value)}</div>
        <div className="text-[12px] text-pierre mt-1">{label}</div>
        {sub && <div className="text-[11px] text-argent">{sub}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// ── Bloc insight : une stat en grand ─────────────────────────────────────────

function InsightStat({ pct, label, sub, color = "text-red-600" }: {
  pct: number; label: string; sub?: string; color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-4 bg-parchemin rounded-xl border border-bordure">
      <span className={`text-[32px] font-bold leading-none ${color}`}>{pct}%</span>
      <span className="text-[12px] font-semibold text-charbon leading-snug">{label}</span>
      {sub && <span className="text-[10px] text-pierre leading-snug">{sub}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminAnalysesPage() {
  const stats = useQuery(api.audits.getAuditStats);
  const insights = useQuery(api.audits.getInsights);

  if (!stats) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-7 bg-sable rounded w-48" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-bordure" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[0,1].map(i => <div key={i} className="h-56 bg-white rounded-2xl border border-bordure" />)}
        </div>
      </div>
    );
  }

  const maxVolume = Math.max(...stats.volumeJours.map(d => d.count), 1);
  const maxDomain = stats.topDomaines[0]?.count ?? 1;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h2 className="text-[22px] font-semibold text-charbon mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Analyses
        </h2>
        <p className="text-[13px] text-pierre">Bilan de toutes les analyses effectuées sur VitrinAI.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total analyses" value={stats.total} sub="depuis le lancement" Icon={ChartBar} />
        <StatCard label="Ce mois (30j)" value={stats.thisMonth} Icon={TrendUp} color="text-blue-500" />
        <StatCard label="Cette semaine" value={stats.thisWeek} Icon={Clock} color="text-amber-500" />
        <StatCard
          label="Taux de réussite"
          value={`${stats.tauxReussite}%`}
          sub={`${stats.termines} terminées · ${stats.erreurs} erreurs`}
          Icon={CheckCircle}
          color="text-emerald-500"
        />
      </div>

      {/* Statuts + Grades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Distribution des grades */}
        <div className="bg-white rounded-2xl border border-bordure p-6">
          <h3 className="text-[14px] font-semibold text-charbon mb-4">Distribution des grades</h3>
          {stats.byGrade && Object.entries(stats.byGrade).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.byGrade).map(([grade, count]) => {
                const pct = stats.termines > 0 ? Math.round((count / stats.termines) * 100) : 0;
                const c = GRADE_COLOR[grade] ?? GRADE_COLOR.F;
                return (
                  <div key={grade} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg ${c.bg} ${c.text} text-[13px] font-bold flex items-center justify-center shrink-0`}>
                      {grade}
                    </span>
                    <div className="flex-1 h-2.5 bg-sable rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.bar} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-pierre w-16 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] text-pierre">Aucune donnée</p>
          )}

          {/* Statuts */}
          <div className="mt-5 pt-4 border-t border-bordure flex gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" weight="fill" />
              <span className="text-[12px] text-olive">{stats.termines} terminées</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-amber-500" weight="fill" />
              <span className="text-[12px] text-olive">{stats.enCours} en cours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle size={14} className="text-red-400" weight="fill" />
              <span className="text-[12px] text-olive">{stats.erreurs} erreurs</span>
            </div>
          </div>
        </div>

        {/* Scores moyens par axe */}
        <div className="bg-white rounded-2xl border border-bordure p-6">
          <h3 className="text-[14px] font-semibold text-charbon mb-1">Scores moyens</h3>
          <p className="text-[12px] text-pierre mb-4">Sur {stats.termines} analyses terminées</p>
          {stats.scoresMoyens ? (
            <div className="space-y-4">
              {(["global", "technique", "seo", "presence", "ux"] as const).map((axe) => (
                <div key={axe}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] font-medium text-olive">
                      {axe === "global" ? "Score global" : AXE_LABEL[axe]}
                    </span>
                  </div>
                  <ScoreBar
                    value={stats.scoresMoyens![axe]}
                    color={axe === "global" ? "bg-savane" : "bg-pierre/60"}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-pierre">Aucune donnée</p>
          )}
        </div>
      </div>

      {/* Volume 30 jours */}
      <div className="bg-white rounded-2xl border border-bordure p-6">
        <h3 className="text-[14px] font-semibold text-charbon mb-4">Volume — 30 derniers jours</h3>
        <div className="flex items-end gap-0.5 h-24">
          {stats.volumeJours.map(({ date, count }) => {
            const h = maxVolume > 0 ? Math.max((count / maxVolume) * 100, count > 0 ? 8 : 2) : 2;
            const label = new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                <div
                  className="w-full rounded-sm bg-savane/70 hover:bg-savane transition-colors"
                  style={{ height: `${h}%` }}
                  title={`${label} : ${count}`}
                />
                {/* Tooltip on hover */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-charbon text-ivoire text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-argent">
            {stats.volumeJours[0]?.date
              ? new Date(stats.volumeJours[0].date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
              : ""}
          </span>
          <span className="text-[10px] text-argent">
            {stats.volumeJours[stats.volumeJours.length - 1]?.date
              ? new Date(stats.volumeJours[stats.volumeJours.length - 1].date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
              : ""}
          </span>
        </div>
      </div>

      {/* Top domaines + Récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top domaines */}
        <div className="bg-white rounded-2xl border border-bordure p-6">
          <h3 className="text-[14px] font-semibold text-charbon mb-4 flex items-center gap-2">
            <Globe size={16} weight="duotone" className="text-savane" />
            Top domaines analysés
          </h3>
          {stats.topDomaines.length === 0 ? (
            <p className="text-[13px] text-pierre">Aucune donnée</p>
          ) : (
            <div className="space-y-2.5">
              {stats.topDomaines.map(({ hostname, count }, i) => (
                <div key={hostname} className="flex items-center gap-3">
                  <span className="text-[11px] text-argent w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[12px] font-medium text-charbon truncate">{hostname}</span>
                      <span className="text-[11px] text-pierre shrink-0">{count}×</span>
                    </div>
                    <div className="h-1.5 bg-sable rounded-full overflow-hidden">
                      <div
                        className="h-full bg-savane/60 rounded-full"
                        style={{ width: `${Math.round((count / maxDomain) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analyses récentes */}
        <div className="bg-white rounded-2xl border border-bordure p-6">
          <h3 className="text-[14px] font-semibold text-charbon mb-4">Analyses récentes</h3>
          <div className="space-y-0 divide-y divide-bordure">
            {stats.recents.map((a) => {
              const c = a.grade ? (GRADE_COLOR[a.grade] ?? GRADE_COLOR.F) : null;
              return (
                <div key={a._id} className="flex items-center gap-3 py-2.5">
                  {c ? (
                    <span className={`w-6 h-6 rounded-md ${c.bg} ${c.text} text-[11px] font-bold flex items-center justify-center shrink-0`}>
                      {a.grade}
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-md bg-sable flex items-center justify-center shrink-0">
                      <Clock size={12} className="text-pierre" />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-charbon truncate">
                      {a.url.replace(/^https?:\/\/(www\.)?/, "")}
                    </p>
                    <p className="text-[10px] text-pierre">
                      {new Date(a.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {a.global != null && (
                    <span className="text-[13px] font-semibold text-charbon shrink-0">{a.global}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Insights vidéo ─────────────────────────────────────────────────── */}
      {insights && (
        <div className="bg-white rounded-2xl border border-bordure p-6">
          <div className="flex items-center gap-2 mb-1">
            <FilmSlate size={16} weight="duotone" className="text-savane" />
            <h3 className="text-[14px] font-semibold text-charbon">Insights — données pour la vidéo</h3>
          </div>
          <p className="text-[12px] text-pierre mb-5">
            Calculé sur <strong>{insights.total} sites terminés</strong>. Score moyen global :{" "}
            <strong>{insights.scoreMoyen}/100</strong> · <strong>{insights.gradeDFpct}%</strong> ont un grade D ou F.
          </p>

          <p className="text-[11px] font-semibold text-pierre uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <WarningCircle size={12} className="text-red-400" weight="fill" />
            Présence locale
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <InsightStat pct={insights.presence.sansGoogleMapsPct} label="sans Google Maps" sub="Introuvables sur Maps" />
            <InsightStat pct={insights.presence.sansFacebookPct} label="sans page Facebook" sub="Réseau n°1 en AOF" />
            <InsightStat pct={insights.presence.sansWhatsAppPct} label="sans WhatsApp lié" sub="Canal privilégié UEMOA" />
          </div>

          <p className="text-[11px] font-semibold text-pierre uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <WarningCircle size={12} className="text-orange-400" weight="fill" />
            Référencement
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <InsightStat pct={insights.seo.sansMetaDescPct} label="sans meta description" sub="Invisible dans Google" color="text-orange-600" />
            <InsightStat pct={insights.seo.sansTitrePct} label="sans balise title" sub="Critique pour le SEO" color="text-orange-600" />
            <InsightStat pct={insights.seo.sansSitemapPct} label="sans sitemap.xml" sub="Google indexe à l'aveugle" color="text-orange-600" />
          </div>

          <p className="text-[11px] font-semibold text-pierre uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <WarningCircle size={12} className="text-amber-400" weight="fill" />
            Technique & Performance
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <InsightStat pct={insights.technique.sansSSLpct} label="sans certificat SSL" sub="Marqué 'Non sécurisé'" color="text-amber-600" />
            <InsightStat pct={insights.technique.nonMobilePct} label="non adapté mobile" sub="74% du trafic AOF = mobile" color="text-amber-600" />
            <InsightStat pct={insights.technique.slowLoadPct} label="chargent en +8s sur 3G" sub="Estimation réseau africain" color="text-amber-600" />
          </div>

          <p className="text-[11px] font-semibold text-pierre uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <WarningCircle size={12} className="text-blue-400" weight="fill" />
            Contact & UX
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InsightStat pct={insights.ux.sansPhonePct} label="sans numéro cliquable" sub="Clients qui repartent" color="text-blue-600" />
            <InsightStat pct={insights.ux.sansContactPct} label="sans formulaire ni email" sub="Zéro moyen de contact" color="text-blue-600" />
          </div>
        </div>
      )}

    </div>
  );
}
