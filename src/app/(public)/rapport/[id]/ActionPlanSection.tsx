"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Sparkle, CircleNotch, Lightning, Clock, ChartBar } from "@phosphor-icons/react";
import Link from "next/link";
import type { ActionStep } from "@/lib/premium-types";

interface Props {
  auditId: string;
  initialPlan?: ActionStep[];
  isOwner: boolean;
}

const EFFORT_LABEL: Record<string, string> = { rapide: "Rapide", moyen: "Moyen", complexe: "Complexe" };
const IMPACT_COLOR: Record<string, string> = {
  fort: "text-red-600",
  moyen: "text-amber-600",
  faible: "text-gray-400",
};
const IMPACT_LABEL: Record<string, string> = { fort: "Impact fort", moyen: "Impact moyen", faible: "Impact faible" };
const AXE_LABEL: Record<string, string> = {
  technique: "Technique", seo: "SEO", presence: "Présence", ux: "Expérience",
};

export function ActionPlanSection({ auditId, initialPlan, isOwner }: Props) {
  const [plan, setPlan] = useState<ActionStep[] | null>(initialPlan ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const me = useQuery(api.credits.getMe);
  const generatePlan = useAction(api.ai.generateActionPlan);

  const canAfford = (me?.creditsBalance ?? 0) >= 5;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const steps = await generatePlan({ auditId: auditId as Id<"audits"> });
      setPlan(steps as ActionStep[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg === "Solde insuffisant" ? "Crédits insuffisants. Rechargez votre compte." : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-semibold text-charbon flex items-center gap-2">
            <Sparkle size={18} weight="duotone" className="text-savane" />
            Plan d&apos;action personnalisé
          </h2>
          <p className="text-[12px] text-pierre mt-0.5">
            5 étapes concrètes générées par IA pour votre site
          </p>
        </div>
        {!plan && isOwner && (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleGenerate}
              disabled={loading || !canAfford}
              className="inline-flex items-center gap-2 bg-charbon text-white text-[13px] font-medium px-4 py-2.5 rounded-xl hover:bg-charbon/90 transition-colors disabled:opacity-40"
            >
              {loading ? (
                <><CircleNotch size={14} className="animate-spin" /> Génération…</>
              ) : (
                <><Sparkle size={14} weight="duotone" /> Générer — 5 crédits</>
              )}
            </button>
            {!canAfford && (
              <Link href="/credits" className="text-[11px] text-savane underline">
                Recharger
              </Link>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-[13px] text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4">{error}</p>
      )}

      {!plan && !isOwner && (
        <div className="bg-parchemin border border-bordure rounded-2xl px-6 py-8 text-center">
          <Sparkle size={28} weight="duotone" className="text-savane mx-auto mb-3" />
          <p className="text-[14px] font-medium text-charbon mb-1">Plan d&apos;action IA disponible</p>
          <p className="text-[12px] text-pierre">
            Le propriétaire de ce rapport peut générer un plan d&apos;action personnalisé en 5 étapes.
          </p>
        </div>
      )}

      {!plan && isOwner && !loading && (
        <div className="bg-parchemin border border-bordure rounded-2xl px-6 py-6">
          <p className="text-[13px] text-pierre leading-relaxed">
            Sur la base de vos scores, un plan d&apos;action en 5 étapes prioritaires sera généré — adapté au contexte africain (mobile-first, 4G, Google Maps local, WhatsApp Business).
          </p>
        </div>
      )}

      <AnimatePresence>
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {plan.map((step, i) => (
              <motion.div
                key={step.numero}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white border border-bordure rounded-2xl px-5 py-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-charbon text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                    {step.numero}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
                      <span className="text-[14px] font-semibold text-charbon">{step.titre}</span>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <span className={`text-[11px] font-medium ${IMPACT_COLOR[step.impact]}`}>
                          {IMPACT_LABEL[step.impact]}
                        </span>
                        <span className="text-[11px] text-pierre bg-sable px-2 py-0.5 rounded-full">
                          {AXE_LABEL[step.axe] ?? step.axe}
                        </span>
                        <span className="text-[11px] text-pierre flex items-center gap-1">
                          {step.effort === "rapide" ? (
                            <Lightning size={11} weight="duotone" className="text-savane" />
                          ) : step.effort === "moyen" ? (
                            <Clock size={11} weight="duotone" className="text-pierre" />
                          ) : (
                            <ChartBar size={11} weight="duotone" className="text-pierre" />
                          )}
                          {EFFORT_LABEL[step.effort]}
                        </span>
                      </div>
                    </div>
                    <p className="text-[13px] text-pierre leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
