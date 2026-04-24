"use client";

import { motion } from "motion/react";
import {
  ForkKnife,
  FirstAid,
  Buildings,
  Scissors,
  Student,
  ShoppingBag,
  Scales,
  Car,
  Pill,
  Coffee,
} from "@phosphor-icons/react";

const sectors = [
  { Icon: ForkKnife, label: "Restaurants" },
  { Icon: FirstAid, label: "Cliniques" },
  { Icon: Buildings, label: "Hôtels" },
  { Icon: Scissors, label: "Salons" },
  { Icon: Student, label: "Écoles" },
  { Icon: ShoppingBag, label: "Boutiques" },
  { Icon: Scales, label: "Cabinets" },
  { Icon: Car, label: "Garages" },
  { Icon: Pill, label: "Pharmacies" },
  { Icon: Coffee, label: "Maquis" },
];

export function SectorsSection() {
  return (
    <section id="secteurs" className="bg-parchemin py-20">
      <div className="max-w-[1200px] mx-auto px-6 text-center">

        <div className="overflow-hidden mb-4">
          <motion.h2
            className="font-serif text-[36px] font-medium text-noir text-balance"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Fait pour les entreprises de votre secteur
          </motion.h2>
        </div>

        <motion.p
          className="text-[17px] text-olive mb-10 max-w-[480px] mx-auto leading-[1.60]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Restaurants, cliniques, hôtels, salons — VitrinAI comprend les spécificités de chaque métier en zone UEMOA.
        </motion.p>

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {sectors.map(({ Icon, label }, i) => (
            <motion.div
              key={label}
              className="flex items-center gap-2 bg-white border border-bordure-forte rounded-full px-5 py-2.5 text-[15px] font-medium text-charbon cursor-default"
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.45,
                delay: 0.15 + i * 0.055,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              whileHover={{
                y: -3,
                borderColor: "var(--color-savane)",
                color: "var(--color-savane)",
                transition: { duration: 0.18, ease: "easeOut" },
              }}
            >
              <Icon weight="duotone" className="w-4 h-4" aria-hidden="true" />
              <span>{label}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-[15px] text-olive"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          Et tous les secteurs d&apos;activité en zone UEMOA
        </motion.p>
      </div>
    </section>
  );
}
