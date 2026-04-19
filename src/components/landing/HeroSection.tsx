"use client";

import { motion } from "motion/react";
import { AuditWidget } from "./AuditWidget";
import { CheckCircle } from "@phosphor-icons/react";

export function HeroSection() {
  return (
    <section id="analyser" className="bg-parchemin pt-20 pb-16">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col items-center text-center">

        {/* Overline badge */}
        <motion.div
          className="inline-flex items-center rounded-full bg-[#e8f5ee] px-4 py-1.5 mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <span className="text-[12px] font-medium tracking-[0.5px] text-savane uppercase">
            Bêta gratuit
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          className="font-serif text-[56px] md:text-[64px] font-medium leading-[1.10] text-noir max-w-[700px] mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Votre site est-il visible sur Google&nbsp;?
        </motion.h1>

        {/* Sous-titre */}
        <motion.p
          className="text-[18px] md:text-[20px] text-olive leading-[1.60] max-w-[560px] mb-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Obtenez un diagnostic complet de votre présence digitale en 30 secondes — gratuitement. Aucune inscription requise.
        </motion.p>

        {/* Widget */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <AuditWidget />
        </motion.div>

        {/* Réassurance */}
        <motion.div
          className="mt-5 flex items-center gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          {["Gratuit", "Sans inscription", "Résultat immédiat"].map((label) => (
            <span key={label} className="text-[13px] text-pierre flex items-center gap-1.5">
              <CheckCircle size={14} weight="fill" className="text-savane" />
              {label}
            </span>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
