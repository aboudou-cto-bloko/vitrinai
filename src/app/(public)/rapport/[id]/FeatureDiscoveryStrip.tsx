"use client";

import { motion } from "motion/react";
import { Sparkle, ChartBar, Medal, Bell } from "@phosphor-icons/react";

const FEATURES = [
  {
    id: "action-plan",
    icon: Sparkle,
    label: "Plan d'action IA",
    benefit: "5 étapes concrètes adaptées à votre site",
    cost: "5 crédits",
    color: "bg-amber-50 text-amber-600 border-amber-100",
    iconColor: "text-amber-500",
  },
  {
    id: "concurrent",
    icon: ChartBar,
    label: "Analyse concurrentielle",
    benefit: "Votre score vs vos concurrents directs",
    cost: "15 crédits",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    iconColor: "text-blue-500",
  },
  {
    id: "badge",
    icon: Medal,
    label: "Badge & QR code",
    benefit: "Affichez votre score sur votre site",
    cost: "2 crédits",
    color: "bg-green-50 text-green-600 border-green-100",
    iconColor: "text-green-500",
  },
  {
    id: "suivi",
    icon: Bell,
    label: "Suivi mensuel",
    benefit: "Re-audit automatique + notification",
    cost: "3 cr/mois",
    color: "bg-purple-50 text-purple-600 border-purple-100",
    iconColor: "text-purple-500",
  },
];

export function FeatureDiscoveryStrip() {
  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <p className="text-[11px] font-semibold text-pierre uppercase tracking-widest mb-3">
        Aller plus loin avec ce rapport
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.button
              key={f.id}
              onClick={() => scrollTo(f.id)}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`text-left rounded-2xl border p-4 transition-shadow hover:shadow-md ${f.color}`}
            >
              <Icon size={20} weight="duotone" className={`mb-2 ${f.iconColor}`} />
              <p className="text-[13px] font-semibold leading-snug mb-0.5">{f.label}</p>
              <p className="text-[11px] opacity-70 leading-snug mb-2">{f.benefit}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/60">
                {f.cost}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
