"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MagnifyingGlass,
  MapPin,
  UserCircle,
  CheckCircle,
  XCircle,
  Warning,
  ArrowLeft,
  ShareNetwork,
  Lock,
  ArrowRight,
} from "@phosphor-icons/react";
import { ExportPdfButton } from "./ExportPdfButton";
import { ThemePanel } from "./ThemePanel";
import { WebVitalsSection } from "@/components/rapport/WebVitalsSection";
import { AofSection } from "@/components/rapport/AofSection";
import { useSession } from "@/lib/auth-client";
import { resolveTheme, DEFAULT_THEME, type ReportThemeConfig } from "@/lib/report-themes";
import type { AuditDetails, AuditScores, Recommandation, Check } from "@/lib/audit/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  auditId: string;
  url: string;
  scores: AuditScores;
  details: AuditDetails;
  recommandations: Recommandation[];
  hostname: string;
  gated?: boolean;
  initialTheme?: ReportThemeConfig;
  isOwner?: boolean;
}

// ── Animated number ───────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const displayRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const ctrl = animate(motionVal, value, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    const unsub = rounded.on("change", (v) => {
      if (displayRef.current) displayRef.current.textContent = v + suffix;
    });
    return () => { ctrl.stop(); unsub(); };
  }, [value, suffix, motionVal, rounded]);
  return <span ref={displayRef}>0{suffix}</span>;
}

// ── Grade ring ────────────────────────────────────────────────────────────────
function GradeRing({ grade, global, accent }: { grade: string; global: number; accent: string }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const targetOffset = circ - (global / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
          <circle cx="72" cy="72" r={radius} fill="none" stroke="#e8e6dc" strokeWidth="10" />
          <motion.circle
            cx="72" cy="72" r={radius} fill="none"
            stroke={accent} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold"
            style={{ color: accent, fontFamily: "Georgia, serif" }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {grade}
          </motion.span>
          <span className="text-[13px] text-pierre">
            <AnimatedNumber value={global} />/100
          </span>
        </div>
      </div>
      <motion.p
        className="text-[14px] text-charbon"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
      >
        Score global
      </motion.p>
    </div>
  );
}

// ── Axis metadata ─────────────────────────────────────────────────────────────
const AXIS_META = {
  technique: { label: "Technique",    Icon: ShieldCheck,    max: 30 },
  seo:       { label: "SEO",          Icon: MagnifyingGlass,max: 30 },
  presence:  { label: "Présence",     Icon: MapPin,         max: 25 },
  ux:        { label: "Expérience",   Icon: UserCircle,     max: 15 },
} as const;

// ── Axis bar ──────────────────────────────────────────────────────────────────
function AxisBar({ score, maxScore, accent }: { score: number; maxScore: number; accent: string }) {
  const pct = Math.round((score / maxScore) * 100);
  const barColor = pct >= 70 ? accent : pct >= 40 ? "#f59e0b" : "#b53333";
  return (
    <div className="mt-2 h-2 bg-sable rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: barColor }}
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// ── Check row ─────────────────────────────────────────────────────────────────
function CheckRow({ check, index }: { check: Check; index: number }) {
  const { status, label, value, detail } = check;
  return (
    <motion.li
      className="flex items-start gap-2.5 text-[13px]"
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {status === "pass" ? (
        <CheckCircle size={16} weight="fill" className="text-success mt-0.5 shrink-0" />
      ) : status === "fail" ? (
        <XCircle size={16} weight="fill" className="text-error mt-0.5 shrink-0" />
      ) : (
        <Warning size={16} weight="fill" className="text-warning mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <span className="text-charbon">{label}</span>
        {value && <span className="ml-1.5 text-pierre">— {value}</span>}
        {detail && status !== "pass" && (
          <p className="text-pierre mt-0.5 leading-snug">{detail}</p>
        )}
      </div>
    </motion.li>
  );
}

// ── Axis card ─────────────────────────────────────────────────────────────────
function AxisCard({
  axis, score, maxScore, checks, cardIndex, accent, cardBg, border,
}: {
  axis: keyof typeof AXIS_META;
  score: number; maxScore: number;
  checks: Check[]; cardIndex: number;
  accent: string; cardBg: string; border: string;
}) {
  const { label, Icon } = AXIS_META[axis];
  return (
    <motion.div
      className="rounded-2xl border p-6 flex flex-col gap-4"
      style={{ backgroundColor: cardBg, borderColor: border }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: cardIndex * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, boxShadow: "rgba(0,0,0,0.08) 0px 10px 28px", transition: { duration: 0.2 } }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent + "18" }}>
          <Icon size={20} weight="duotone" style={{ color: accent }} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-medium text-charbon">{label}</span>
            <span className="text-[14px] font-semibold text-charbon">
              <AnimatedNumber value={score} />
              <span className="text-pierre font-normal">/{maxScore}</span>
            </span>
          </div>
          <AxisBar score={score} maxScore={maxScore} accent={accent} />
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {checks.map((c, i) => <CheckRow key={c.id} check={c} index={i} />)}
      </ul>
    </motion.div>
  );
}

// ── Reco card ─────────────────────────────────────────────────────────────────
const IMPACT_COLORS = { high: "#b53333", medium: "#f59e0b", low: "#87867f" };
const IMPACT_LABELS = { high: "Impact fort", medium: "Impact moyen", low: "Impact faible" };
const AXE_LABELS = { technique: "Technique", seo: "SEO", presence: "Présence", ux: "Expérience" };

function RecoCard({ r, i, cardBg, border }: { r: Recommandation; i: number; cardBg: string; border: string }) {
  return (
    <motion.div
      className="rounded-xl border p-5 flex gap-4"
      style={{ backgroundColor: cardBg, borderColor: border }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, boxShadow: "rgba(0,0,0,0.07) 0px 8px 20px", transition: { duration: 0.18 } }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold text-white"
        style={{ backgroundColor: IMPACT_COLORS[r.impact] }}
      >
        {i + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-[14px] font-medium text-charbon">{r.titre}</span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ color: IMPACT_COLORS[r.impact], backgroundColor: `${IMPACT_COLORS[r.impact]}18` }}>
            {IMPACT_LABELS[r.impact]}
          </span>
          <span className="text-[11px] text-pierre bg-sable px-2 py-0.5 rounded-full">
            {AXE_LABELS[r.axe]}
          </span>
        </div>
        <p className="text-[13px] text-pierre leading-relaxed">{r.description}</p>
      </div>
    </motion.div>
  );
}

// ── Score mini tiles ──────────────────────────────────────────────────────────
function ScoreTile({ axis, score, max, index, accent, tileBg }: {
  axis: keyof typeof AXIS_META; score: number; max: number;
  index: number; accent: string; tileBg: string;
}) {
  const { label } = AXIS_META[axis];
  const pct = Math.round((score / max) * 100);
  const dotColor = pct >= 70 ? accent : pct >= 40 ? "#f59e0b" : "#b53333";
  return (
    <motion.div
      className="rounded-xl px-3 py-2 text-center"
      style={{ backgroundColor: tileBg }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.6 + index * 0.07, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
        <div className="text-[18px] font-bold text-charbon"><AnimatedNumber value={score} /></div>
      </div>
      <div className="text-[11px] text-pierre">{label} <span className="text-argent">/{max}</span></div>
    </motion.div>
  );
}

// ── Share button ──────────────────────────────────────────────────────────────
function ShareButton() {
  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: "Mon rapport VitrinAI", url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success("Lien copié dans le presse-papier !");
      }).catch(() => { toast.error("Impossible de copier le lien."); });
    }
  }
  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 text-white/80 hover:text-white text-[13px] transition-colors"
    >
      <ShareNetwork size={16} weight="duotone" />
      <span className="hidden sm:inline">Partager</span>
    </button>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ num, title, accent }: { num: string; title: string; accent: string }) {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
    >
      <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: accent }}>
        {num}
      </span>
      <h2 className="text-[18px] font-semibold text-charbon text-balance" style={{ fontFamily: "Georgia, serif" }}>
        {title}
      </h2>
    </motion.div>
  );
}

// ── Gate overlay ──────────────────────────────────────────────────────────────
function GateOverlay({ recommandations }: { recommandations: Recommandation[] }) {
  const highCount = recommandations.filter((r) => r.impact === "high").length;
  const totalCount = recommandations.length;
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="bg-white/96 backdrop-blur-sm border border-bordure rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4">
        <div className="w-12 h-12 rounded-2xl bg-savane/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} weight="duotone" className="text-savane" />
        </div>
        <h3 className="text-[18px] font-semibold text-charbon mb-2" style={{ fontFamily: "Georgia, serif" }}>
          Débloquez l&apos;analyse complète
        </h3>
        {totalCount > 0 && (
          <p className="text-[13px] text-pierre mb-3">
            <span className="font-semibold text-charbon">{totalCount} recommandation{totalCount > 1 ? "s" : ""}</span>
            {highCount > 0 && (
              <> dont <span className="font-semibold text-error">{highCount} à impact fort</span></>
            )}{" "}disponibles pour ce site.
          </p>
        )}
        <p className="text-[13px] text-pierre mb-1">Créez un compte gratuit et obtenez</p>
        <p className="text-[15px] font-semibold text-savane mb-5">2 crédits offerts</p>
        <div className="flex flex-col gap-2">
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-savane text-white text-[14px] font-medium hover:bg-savane/90 transition-colors">
            Créer un compte gratuit <ArrowRight size={14} weight="bold" />
          </Link>
          <Link href="/signin" className="inline-flex items-center justify-center h-9 px-5 rounded-xl bg-parchemin border border-bordure text-charbon text-[13px] font-medium hover:bg-sable transition-colors">
            J&apos;ai déjà un compte
          </Link>
        </div>
        <p className="text-[11px] text-argent mt-4">Chaque crédit = une analyse complète</p>
      </div>
    </motion.div>
  );
}

// ── Document header (cover) ───────────────────────────────────────────────────
function DocumentHeader({
  hostname, url, auditId, createdAt, theme, isOwner, gated,
  scores, details, recommandations,
}: {
  hostname: string; url: string; auditId: string; createdAt: number;
  theme: ReportThemeConfig; isOwner: boolean; gated: boolean;
  scores: AuditScores; details: AuditDetails; recommandations: Recommandation[];
}) {
  const t = resolveTheme(theme);
  const date = new Date(createdAt).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const ref = auditId.slice(-6).toUpperCase();

  return (
    <div style={{ backgroundColor: t.headerBg, color: t.headerFg }}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Barre nav */}
        <div className="py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.headerFg}20` }}>
          <Link
            href="/"
            className="flex items-center gap-2 text-[13px] transition-opacity hover:opacity-70"
            style={{ color: t.headerFg }}
          >
            <ArrowLeft size={16} weight="bold" />
            Retour
          </Link>
          <div className="flex items-center gap-3">
            <ShareButton />
            {!gated && (
              <ExportPdfButton
                hostname={hostname} url={url} scores={scores}
                details={details} recommandations={recommandations}
              />
            )}
            {isOwner && !gated && (
              <ThemePanel
                auditId={auditId}
                currentTheme={theme}
                onThemeChange={() => window.location.reload()}
              />
            )}
          </div>
        </div>

        {/* Cover */}
        <div className="py-8 pb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: t.headerFg + "80" }}>
                {t.brandLabel}
              </p>
              <h1
                className="text-[28px] sm:text-[34px] font-medium leading-tight"
                style={{ fontFamily: t.headingFont, color: t.headerFg }}
              >
                Rapport de présence<br />digitale
              </h1>
              <p className="mt-2 text-[14px] break-all" style={{ color: t.headerFg + "90" }}>
                {url}
              </p>
            </div>
            <div className="text-right text-[12px] space-y-1" style={{ color: t.headerFg + "70" }}>
              <p>Réf. {ref}</p>
              <p>{date}</p>
              <p>VitrinAI Analytics</p>
            </div>
          </div>

          {/* Separator */}
          <div className="mt-8 h-px" style={{ backgroundColor: t.headerFg + "20" }} />

          {/* Score summary row */}
          <div className="mt-6 flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: t.headerFg + "60" }}>Score global</p>
              <p className="text-[40px] font-bold leading-none mt-0.5" style={{ color: t.headerFg, fontFamily: t.headingFont }}>
                {scores.global}<span className="text-[20px] font-normal">/100</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: t.headerFg + "60" }}>Grade</p>
              <p className="text-[40px] font-bold leading-none mt-0.5" style={{ color: t.accent || t.headerFg, fontFamily: t.headingFont }}>
                {scores.grade}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {(["technique", "seo", "presence", "ux"] as const).map((axis) => (
                <div key={axis} className="text-center">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: t.headerFg + "60" }}>{AXIS_META[axis].label}</p>
                  <p className="text-[20px] font-bold" style={{ color: t.headerFg }}>
                    {scores[axis]}<span className="text-[12px] font-normal">/{AXIS_META[axis].max}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function RapportContent({
  auditId, url, scores, details, recommandations, hostname,
  gated = false, initialTheme, isOwner = false,
}: Props) {
  const { data: session } = useSession();
  const isGated = gated && !session;
  const [theme, setTheme] = useState<ReportThemeConfig>(initialTheme ?? DEFAULT_THEME);
  const t = resolveTheme(theme);

  return (
    <main id="rapport-content" style={{ backgroundColor: t.pageBg }} className="min-h-screen pb-20">

      {/* Document cover header */}
      <DocumentHeader
        hostname={hostname} url={url} auditId={auditId}
        createdAt={Date.now()} theme={theme}
        isOwner={isOwner} gated={isGated}
        scores={scores} details={details} recommandations={recommandations}
      />

      <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">

        {/* Score hero — détail */}
        <motion.section
          className="rounded-2xl border p-8 flex flex-col sm:flex-row items-center gap-8"
          style={{ backgroundColor: t.cardBg, borderColor: t.border }}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <GradeRing grade={scores.grade} global={scores.global} accent={t.accent} />
          <div className="flex-1 text-center sm:text-left">
            <motion.p
              className="text-[13px] text-pierre mb-5 break-all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {url}
            </motion.p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["technique", "seo", "presence", "ux"] as const).map((axis, i) => (
                <ScoreTile
                  key={axis} axis={axis} score={scores[axis]}
                  max={AXIS_META[axis].max} index={i}
                  accent={t.accent} tileBg={t.accentLight}
                />
              ))}
            </div>
          </div>
        </motion.section>

        {/* Sections verrouillées ou non */}
        {isGated ? (
          <div className="relative">
            <div className="flex flex-col gap-10 blur-sm select-none pointer-events-none opacity-50" aria-hidden="true">
              {details.vitals && <WebVitalsSection vitals={details.vitals} />}
              {details.aof && <AofSection aof={details.aof} />}
              {recommandations.length > 0 && (
                <section className="flex flex-col gap-4">
                  <SectionHeader num="01" title="Priorités d'amélioration" accent={t.accent} />
                  {recommandations.slice(0, 3).map((r, i) => (
                    <RecoCard key={i} r={r} i={i} cardBg={t.cardBg} border={t.border} />
                  ))}
                </section>
              )}
              <section className="flex flex-col gap-4">
                <SectionHeader num="02" title="Détail par axe" accent={t.accent} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["technique", "seo", "presence", "ux"] as const).map((axis, i) => (
                    <AxisCard key={axis} axis={axis} score={details[axis].score}
                      maxScore={details[axis].maxScore} checks={details[axis].checks}
                      cardIndex={i} accent={t.accent} cardBg={t.cardBg} border={t.border} />
                  ))}
                </div>
              </section>
            </div>
            <GateOverlay recommandations={recommandations} />
          </div>
        ) : (
          <>
            {details.vitals && <WebVitalsSection vitals={details.vitals} />}
            {details.aof && <AofSection aof={details.aof} />}

            {recommandations.length > 0 && (
              <section className="flex flex-col gap-4">
                <SectionHeader num="01" title="Priorités d'amélioration" accent={t.accent} />
                {recommandations.map((r, i) => (
                  <RecoCard key={i} r={r} i={i} cardBg={t.cardBg} border={t.border} />
                ))}
              </section>
            )}

            <section className="flex flex-col gap-4">
              <SectionHeader num="02" title="Détail par axe" accent={t.accent} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["technique", "seo", "presence", "ux"] as const).map((axis, i) => (
                  <AxisCard key={axis} axis={axis} score={details[axis].score}
                    maxScore={details[axis].maxScore} checks={details[axis].checks}
                    cardIndex={i} accent={t.accent} cardBg={t.cardBg} border={t.border} />
                ))}
              </div>
            </section>

            {/* CTA final */}
            <motion.section
              className="rounded-2xl p-8 text-center text-ivoire overflow-hidden relative"
              style={{ backgroundColor: t.headerBg }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                style={{ backgroundColor: t.accent + "20" }} />
              <h3 className="text-[20px] font-semibold mb-2 relative" style={{ fontFamily: t.headingFont, color: t.headerFg }}>
                Améliorez votre score avec VitrinAI
              </h3>
              <p className="text-[14px] mb-6 relative" style={{ color: t.headerFg + "90" }}>
                Analyses régulières, suivi des progrès, rapports brandés pour vos clients.
              </p>
              <Link
                href="/#tarifs"
                className="inline-block text-[14px] font-medium px-6 py-3 rounded-xl transition-colors relative"
                style={{ backgroundColor: t.accent, color: "#fff" }}
              >
                Voir les offres →
              </Link>
            </motion.section>
          </>
        )}
      </div>
    </main>
  );
}
