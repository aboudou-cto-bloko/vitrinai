"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Check, Lock } from "@phosphor-icons/react";

const plans = [
  {
    name: "Gratuit",
    badge: null,
    price: "0",
    period: "FCFA / mois",
    description: "Tout ce qu'il faut pour découvrir votre niveau de visibilité.",
    features: [
      "3 audits par jour",
      "Score global sur 100",
      "Détail par axe (Technique, SEO, Présence, UX)",
      "Top 5 recommandations priorisées",
      "Export PDF du rapport",
    ],
    cta: "Commencer gratuitement",
    ctaHref: "#analyser",
    available: true,
    featured: false,
    dark: false,
  },
  {
    name: "Pro",
    badge: "BIENTÔT",
    price: "9 900",
    period: "FCFA / mois",
    description: "Pour les entreprises qui veulent progresser chaque mois.",
    features: [
      "Audits illimités",
      "Historique des scores",
      "Alertes hebdomadaires de régression",
      "Rapport PDF personnalisé",
      "Comparaison concurrents",
    ],
    cta: "Bientôt disponible",
    ctaHref: "#",
    available: false,
    featured: true,
    dark: false,
  },
  {
    name: "Agences",
    badge: "BIENTÔT",
    price: "29 900",
    period: "FCFA / mois",
    description: "Pour les freelances et agences web qui gèrent plusieurs clients.",
    features: [
      "Tout le plan Pro",
      "Multi-clients illimités",
      "Marque blanche (white-label)",
      "Accès API",
      "Dashboard agrégé",
    ],
    cta: "Bientôt disponible",
    ctaHref: "#",
    available: false,
    featured: false,
    dark: true,
  },
];

export function PricingSection() {
  return (
    <section id="tarifs" className="bg-ivoire border-t border-bordure-forte py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-serif text-[48px] md:text-[52px] font-medium text-noir mb-4">
            Commencez gratuitement
          </h2>
          <p className="text-[20px] text-olive max-w-[480px] mx-auto leading-[1.60]">
            L&apos;audit complet est 100&nbsp;% gratuit. Les plans avancés arrivent bientôt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={[
                "rounded-2xl p-8 flex flex-col relative overflow-hidden",
                plan.featured
                  ? "bg-white border-2 border-savane shadow-[rgba(0,0,0,0.08)_0px_8px_32px]"
                  : plan.dark
                  ? "bg-noir text-ivoire"
                  : "bg-ivoire border border-bordure",
                !plan.available ? "opacity-70" : "",
              ].join(" ")}
            >
              {/* Badge */}
              {plan.badge ? (
                <div className={[
                  "inline-flex items-center self-start rounded-full px-3 py-1 mb-4 gap-1.5",
                  plan.dark ? "bg-white/10" : "bg-sable",
                ].join(" ")}>
                  <Lock size={10} weight="bold" className={plan.dark ? "text-argent" : "text-pierre"} />
                  <span className={[
                    "text-[11px] font-medium tracking-[0.5px] uppercase",
                    plan.dark ? "text-argent" : "text-pierre",
                  ].join(" ")}>
                    {plan.badge}
                  </span>
                </div>
              ) : (
                <div className="h-7 mb-4" />
              )}

              {/* Plan name */}
              <p className={`text-[14px] font-medium mb-2 ${plan.dark ? "text-argent" : "text-olive"}`}>
                {plan.name}
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`font-serif text-[40px] font-medium leading-none ${plan.dark ? "text-ivoire" : "text-noir"}`}>
                  {plan.price}
                </span>
                <span className={`text-[16px] ${plan.dark ? "text-argent" : "text-olive"}`}>
                  {plan.period}
                </span>
              </div>

              <p className={`text-[14px] leading-relaxed mb-7 ${plan.dark ? "text-argent" : "text-pierre"}`}>
                {plan.description}
              </p>

              {/* Features */}
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      size={16}
                      weight="bold"
                      className={`mt-0.5 shrink-0 ${plan.available ? "text-savane" : plan.dark ? "text-argent/50" : "text-pierre/50"}`}
                    />
                    <span className={`text-[15px] ${plan.dark ? "text-argent" : "text-charbon"} ${!plan.available ? "opacity-60" : ""}`}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.available ? (
                <Button variant="secondary" className="w-full" asChild>
                  <Link href={plan.ctaHref}>{plan.cta}</Link>
                </Button>
              ) : (
                <button
                  disabled
                  className={[
                    "w-full h-10 rounded-xl text-[14px] font-medium flex items-center justify-center gap-2 cursor-not-allowed",
                    plan.dark
                      ? "bg-white/5 text-argent/50 border border-white/10"
                      : "bg-sable text-pierre border border-bordure",
                  ].join(" ")}
                >
                  <Lock size={14} weight="duotone" />
                  Bientôt disponible
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-center text-[13px] text-pierre mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          Les plans Pro et Agences seront disponibles prochainement.
        </motion.p>
      </div>
    </section>
  );
}
