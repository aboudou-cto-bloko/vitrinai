"use client";

import { motion } from "motion/react";
import { Sparkle, ChartBar, Medal, Bell, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";

const FEATURES = [
  {
    icon: Sparkle,
    label: "Plan d'action IA",
    cost: "5 crédits",
    description:
      "Obtenez 5 étapes personnalisées générées par IA — adaptées au contexte africain : mobile-first, 4G, WhatsApp Business, Google Maps local.",
    tag: "Populaire",
    tagColor: "bg-amber-100 text-amber-700",
    borderColor: "border-amber-200",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
  },
  {
    icon: ChartBar,
    label: "Analyse concurrentielle",
    cost: "15 crédits",
    description:
      "Comparez votre présence digitale avec 1 ou 2 concurrents directs. Tableau de scores côte à côte + synthèse IA pour savoir où vous vous situez vraiment.",
    tag: "Agences",
    tagColor: "bg-blue-100 text-blue-700",
    borderColor: "border-blue-200",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    icon: Medal,
    label: "Badge & QR code",
    cost: "2 crédits",
    description:
      "Un badge SVG avec votre score et grade, un QR code vers votre rapport, et un code HTML prêt à intégrer sur votre site ou vos présentations clients.",
    tag: null,
    tagColor: "",
    borderColor: "border-green-200",
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
  },
  {
    icon: Bell,
    label: "Suivi mensuel",
    cost: "3 crédits/mois",
    description:
      "Re-audit automatique chaque mois. Notification dès que votre score évolue — vous voyez si vos améliorations portent leurs fruits.",
    tag: null,
    tagColor: "",
    borderColor: "border-purple-200",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
  },
];

export function PremiumFeaturesSection() {
  return (
    <section className="bg-parchemin border-t border-bordure py-20">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* Header */}
        <div className="max-w-[600px] mb-12 overflow-hidden">
          <motion.p
            className="text-[13px] font-semibold text-savane tracking-widest uppercase mb-3"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            Rapport enrichi
          </motion.p>
          <motion.h2
            className="font-serif text-[40px] md:text-[46px] font-medium text-noir leading-[1.1] mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            Votre rapport travaille<br />pour vous
          </motion.h2>
          <motion.p
            className="text-[17px] text-olive leading-[1.6]"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Chaque crédit débloque une couche d&apos;intelligence supplémentaire.
            Les agences web utilisent ces fonctionnalités pour livrer des rapports professionnels
            à leurs clients — et en faire un argument de vente.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`bg-white rounded-2xl border ${f.borderColor} p-6 flex gap-5`}
              >
                <div className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon size={22} weight="duotone" className={f.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[15px] font-semibold text-charbon">{f.label}</span>
                    {f.tag && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${f.tagColor}`}>
                        {f.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-olive leading-relaxed mb-3">{f.description}</p>
                  <span className="text-[12px] font-semibold text-pierre bg-sable px-3 py-1 rounded-full">
                    {f.cost}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="#analyser"
            className="inline-flex items-center gap-2 bg-charbon text-white text-[14px] font-medium px-6 py-3 rounded-xl hover:bg-charbon/90 transition-colors"
          >
            Analyser mon site gratuitement
            <ArrowRight size={15} weight="bold" />
          </Link>
          <Link
            href="#tarifs"
            className="text-[14px] text-olive hover:text-charbon transition-colors underline underline-offset-4"
          >
            Voir les tarifs
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
