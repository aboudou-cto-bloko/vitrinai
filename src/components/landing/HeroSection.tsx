"use client";

import { motion } from "motion/react";
import { AuditWidget } from "./AuditWidget";
import { CheckCircle } from "@phosphor-icons/react";

const H1_WORDS = ["Votre", "site", "est-il", "visible", "sur\u00a0Google\u00a0?"];

export function HeroSection() {
  return (
    <section id="analyser" className="bg-parchemin pt-20 pb-16">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col items-center text-center">

        {/* Badge */}
        <motion.div
          className="inline-flex items-center rounded-full bg-[#e8f5ee] px-4 py-1.5 mb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <span className="text-[12px] font-medium tracking-[0.5px] text-savane uppercase">
            Conçu pour l&apos;Afrique de l&apos;Ouest
          </span>
        </motion.div>

        {/* H1 — word-by-word reveal */}
        <h1 className="font-serif text-[56px] md:text-[64px] font-medium leading-[1.10] text-noir max-w-[700px] mb-6 text-balance">
          {H1_WORDS.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block"
              style={{ marginRight: "0.22em" }}
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.55,
                delay: 0.15 + i * 0.09,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Sous-titre */}
        <motion.p
          className="text-[18px] md:text-[20px] text-olive leading-[1.60] max-w-[580px] mb-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          Diagnostic complet en 30 secondes : SEO, vitesse, réseaux sociaux, et simulation de la performance réelle sur mobile 4G en Afrique de l&apos;Ouest. Gratuitement, sans inscription.
        </motion.p>

        {/* Widget */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <AuditWidget />
        </motion.div>

        {/* Reassurance pills */}
        <motion.div
          className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          {["Gratuit", "Sans inscription", "Résultat immédiat"].map((label, i) => (
            <motion.span
              key={label}
              className="text-[13px] text-pierre flex items-center gap-1.5"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 1.0 + i * 0.08 }}
            >
              <CheckCircle size={14} weight="fill" className="text-savane" aria-hidden="true" />
              {label}
            </motion.span>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
