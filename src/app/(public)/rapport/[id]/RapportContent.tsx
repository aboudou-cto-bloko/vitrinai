"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
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
import { WebVitalsSection } from "@/components/rapport/WebVitalsSection";
import { AofSection } from "@/components/rapport/AofSection";
import { useSession } from "@/lib/auth-client";
import type { AuditDetails, AuditScores, Recommandation, Check } from "@/lib/audit/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  url: string;
  scores: AuditScores;
  details: AuditDetails;
  recommandations: Recommandation[];
  hostname: string;
  gated?: boolean;
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
const GRADE_COLORS: Record<string, string> = {
  A: "#2d7a4f", B: "#5e9e73", C: "#f59e0b", D: "#e07b39", F: "#b53333",
};

function GradeRing({ grade, global }: { grade: string; global: number }) {
  const color = GRADE_COLORS[grade] ?? "#87867f";
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
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold"
            style={{ color, fontFamily: "Georgia, serif" }}
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

// ── Axis bar ──────────────────────────────────────────────────────────────────
const AXIS_META = {
  technique: { label: "Technique", Icon: ShieldCheck, max: 30 },
  seo: { label: "SEO", Icon: MagnifyingGlass, max: 30 },
  presence: { label: "Présence", Icon: MapPin, max: 25 },
  ux: { label: "Expérience", Icon: UserCircle, max: 15 },
} as const;

function AxisBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = Math.round((score / maxScore) * 100);
  const barColor = pct >= 70 ? "#2d7a4f" : pct >= 40 ? "#f59e0b" : "#b53333";
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
  axis, score, maxScore, checks, cardIndex,
}: {
  axis: keyof typeof AXIS_META;
  score: number;
  maxScore: number;
  checks: Check[];
  cardIndex: number;
}) {
  const { label, Icon } = AXIS_META[axis];
  return (
    <motion.div
      className="bg-white rounded-2xl border border-bordure p-6 flex flex-col gap-4"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: cardIndex * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, boxShadow: "rgba(0,0,0,0.08) 0px 10px 28px", transition: { duration: 0.2 } }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-parchemin flex items-center justify-center">
          <Icon size={20} weight="duotone" className="text-savane" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-medium text-charbon">{label}</span>
            <span className="text-[14px] font-semibold text-charbon">
              <AnimatedNumber value={score} />
              <span className="text-pierre font-normal">/{maxScore}</span>
            </span>
          </div>
          <AxisBar score={score} maxScore={maxScore} />
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

function RecoCard({ r, i }: { r: Recommandation; i: number }) {
  return (
    <motion.div
      className="bg-white rounded-xl border border-bordure p-5 flex gap-4"
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
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ color: IMPACT_COLORS[r.impact], backgroundColor: `${IMPACT_COLORS[r.impact]}18` }}
          >
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
function ScoreTile({ axis, score, max, index }: { axis: keyof typeof AXIS_META; score: number; max: number; index: number }) {
  const { label } = AXIS_META[axis];
  const pct = Math.round((score / max) * 100);
  const dotColor = pct >= 70 ? "#2d7a4f" : pct >= 40 ? "#f59e0b" : "#b53333";
  return (
    <motion.div
      className="bg-parchemin rounded-xl px-3 py-2 text-center"
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
      }).catch(() => {
        toast.error("Impossible de copier le lien.");
      });
    }
  }
  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 text-argent hover:text-ivoire text-[13px] transition-colors"
    >
      <ShareNetwork size={16} weight="duotone" />
      Partager
    </button>
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
      <div className="bg-white/95 backdrop-blur-sm border border-bordure rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4">
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
            )}
            {" "}sont disponibles pour ce site.
          </p>
        )}
        <p className="text-[13px] text-pierre mb-1">
          Créez un compte gratuit et obtenez
        </p>
        <p className="text-[15px] font-semibold text-savane mb-5">
          2 crédits offerts
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-savane text-white text-[14px] font-medium hover:bg-savane/90 transition-colors"
          >
            Créer un compte gratuit
            <ArrowRight size={14} weight="bold" />
          </Link>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center h-9 px-5 rounded-xl bg-parchemin border border-bordure text-charbon text-[13px] font-medium hover:bg-sable transition-colors"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
        <p className="text-[11px] text-argent mt-4">
          Chaque crédit = une analyse complète
        </p>
      </div>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function RapportContent({ url, scores, details, recommandations, hostname, gated }: Props) {
  const { data: session } = useSession();
  const isGated = gated && !session;

  return (
    <main className="min-h-screen bg-parchemin pb-20">
      {/* Header */}
      <div className="bg-noir text-ivoire">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[13px] text-argent hover:text-ivoire transition-colors">
            <ArrowLeft size={16} weight="bold" />
            Retour
          </Link>
          <div className="flex items-center gap-4">
            <ShareButton />
            <span className="text-argent/40">|</span>
            <span className="text-[13px] text-argent hidden sm:block">{hostname}</span>
            {!isGated && (
              <ExportPdfButton
                hostname={hostname}
                url={url}
                scores={scores}
                details={details}
                recommandations={recommandations}
              />
            )}
          </div>
        </div>
      </div>

      <div id="rapport-content" className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">

        {/* Score hero — always visible */}
        <motion.section
          className="bg-white rounded-2xl border border-bordure p-8 flex flex-col sm:flex-row items-center gap-8"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <GradeRing grade={scores.grade} global={scores.global} />
          <div className="flex-1 text-center sm:text-left">
            <motion.h1
              className="text-2xl font-semibold text-charbon mb-1"
              style={{ fontFamily: "Georgia, serif" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Rapport de présence digitale
            </motion.h1>
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
                <ScoreTile key={axis} axis={axis} score={scores[axis]} max={AXIS_META[axis].max} index={i} />
              ))}
            </div>
          </div>
        </motion.section>

        {/* Gated sections */}
        {isGated ? (
          <div className="relative">
            {/* Blurred preview */}
            <div className="flex flex-col gap-10 blur-sm select-none pointer-events-none opacity-50" aria-hidden="true">
              {details.vitals && <WebVitalsSection vitals={details.vitals} />}
              {details.aof && <AofSection aof={details.aof} />}
              {recommandations.length > 0 && (
                <section className="flex flex-col gap-4">
                  <h2 className="text-[18px] font-semibold text-charbon" style={{ fontFamily: "Georgia, serif" }}>
                    Priorités d&apos;amélioration
                  </h2>
                  {recommandations.slice(0, 3).map((r, i) => <RecoCard key={i} r={r} i={i} />)}
                </section>
              )}
              <section className="flex flex-col gap-4">
                <h2 className="text-[18px] font-semibold text-charbon" style={{ fontFamily: "Georgia, serif" }}>
                  Détail par axe
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["technique", "seo", "presence", "ux"] as const).map((axis, i) => (
                    <AxisCard
                      key={axis}
                      axis={axis}
                      score={details[axis].score}
                      maxScore={details[axis].maxScore}
                      checks={details[axis].checks}
                      cardIndex={i}
                    />
                  ))}
                </div>
              </section>
            </div>
            <GateOverlay recommandations={recommandations} />
          </div>
        ) : (
          <>
            {/* Web Vitals */}
            {details.vitals && <WebVitalsSection vitals={details.vitals} />}

            {/* AOF Context */}
            {details.aof && <AofSection aof={details.aof} />}

            {/* Recommandations */}
            {recommandations.length > 0 && (
              <section className="flex flex-col gap-4">
                <motion.h2
                  className="text-[18px] font-semibold text-charbon text-balance"
                  style={{ fontFamily: "Georgia, serif" }}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4 }}
                >
                  Priorités d&apos;amélioration
                </motion.h2>
                {recommandations.map((r, i) => <RecoCard key={i} r={r} i={i} />)}
              </section>
            )}

            {/* Axis detail grid */}
            <section className="flex flex-col gap-4">
              <motion.h2
                className="text-[18px] font-semibold text-charbon text-balance"
                style={{ fontFamily: "Georgia, serif" }}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4 }}
              >
                Détail par axe
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["technique", "seo", "presence", "ux"] as const).map((axis, i) => (
                  <AxisCard
                    key={axis}
                    axis={axis}
                    score={details[axis].score}
                    maxScore={details[axis].maxScore}
                    checks={details[axis].checks}
                    cardIndex={i}
                  />
                ))}
              </div>
            </section>

            {/* CTA */}
            <motion.section
              className="bg-noir rounded-2xl p-8 text-center text-ivoire overflow-hidden relative"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-savane/10 blur-3xl pointer-events-none" />
              <h3 className="text-[20px] font-semibold mb-2 relative" style={{ fontFamily: "Georgia, serif" }}>
                Améliorez votre score avec VitrinAI Pro
              </h3>
              <p className="text-[14px] text-argent mb-6 relative">
                Suivi mensuel, alertes de régression, accompagnement personnalisé.
              </p>
              <Link
                href="/#tarifs"
                className="inline-block bg-savane text-ivoire text-[14px] font-medium px-6 py-3 rounded-xl hover:bg-savane-hover transition-colors relative"
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
