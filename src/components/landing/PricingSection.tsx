"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check } from "@phosphor-icons/react";

const packs = [
  {
    id: "starter",
    name: "Starter",
    credits: 5,
    price: "1 500",
    pricePerCredit: "300",
    description: "Pour tester VitrinAI sur quelques sites.",
    highlight: false,
  },
  {
    id: "essentiel",
    name: "Essentiel",
    credits: 15,
    price: "3 900",
    pricePerCredit: "260",
    description: "Pour les PME qui suivent régulièrement leur présence digitale.",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    credits: 50,
    price: "9 900",
    pricePerCredit: "198",
    description: "Pour les freelances et petites agences web.",
    highlight: true,
  },
  {
    id: "agences",
    name: "Agences",
    credits: 200,
    price: "29 900",
    pricePerCredit: "149",
    description: "Usage intensif. Meilleur tarif par analyse.",
    highlight: false,
  },
];

const included = [
  "Score global sur 100",
  "Détail SEO, Technique, Présence, UX",
  "Top 5 recommandations priorisées",
  "Export PDF du rapport",
  "Rapport partageable par lien",
  "Historique de toutes vos analyses",
];

export function PricingSection() {
  return (
    <section id="tarifs" className="bg-ivoire border-t border-bordure-forte py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-4 overflow-hidden">
          <motion.h2
            className="font-serif text-[48px] md:text-[52px] font-medium text-noir mb-4 text-balance"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Tarifs au crédit
          </motion.h2>
          <motion.p
            className="text-[20px] text-olive max-w-[520px] mx-auto leading-[1.60]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            1 crédit = 1 analyse complète. Pas d&apos;abonnement, pas d&apos;expiration.
          </motion.p>
        </div>

        {/* Inclus dans chaque analyse */}
        <motion.div
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {included.map((f) => (
            <span key={f} className="flex items-center gap-1.5 text-[14px] text-olive">
              <Check size={14} weight="bold" className="text-savane shrink-0" />
              {f}
            </span>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {packs.map((pack, index) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, boxShadow: "rgba(0,0,0,0.08) 0px 12px 40px" }}
              className={[
                "rounded-2xl p-6 flex flex-col bg-white transition-shadow",
                pack.highlight
                  ? "border-2 border-savane shadow-[rgba(0,0,0,0.06)_0px_6px_24px]"
                  : "border border-bordure",
              ].join(" ")}
            >
              {pack.highlight ? (
                <span className="text-[11px] font-semibold text-savane tracking-wider uppercase mb-3">
                  Populaire
                </span>
              ) : (
                <div className="h-5 mb-3" />
              )}

              <p className="text-[15px] font-semibold text-charbon mb-1">{pack.name}</p>
              <p className="text-[13px] text-olive mb-4 leading-snug">{pack.description}</p>

              <div className="mb-1">
                <span className="font-serif text-[36px] font-medium text-noir leading-none">
                  {pack.credits}
                </span>
                <span className="text-[15px] text-olive ml-1.5">crédits</span>
              </div>
              <p className="text-[13px] text-pierre mb-5">
                {pack.price} XOF · {pack.pricePerCredit} XOF/crédit
              </p>

              <Link
                href="/signup"
                className={[
                  "mt-auto w-full h-9 rounded-xl text-[13px] font-medium flex items-center justify-center transition-colors",
                  pack.highlight
                    ? "bg-savane text-white hover:bg-savane/90"
                    : "bg-parchemin text-charbon border border-bordure hover:bg-sable",
                ].join(" ")}
              >
                Acheter
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-center text-[13px] text-pierre mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          1 audit gratuit sans inscription · 2 crédits offerts à l&apos;inscription
        </motion.p>
      </div>
    </section>
  );
}
