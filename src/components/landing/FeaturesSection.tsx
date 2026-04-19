"use client";

import { motion } from "motion/react";
import {
  DeviceMobile,
  MagnifyingGlass,
  MapPin,
  UserCircle,
  CheckCircle,
  XCircle,
  Warning,
} from "@phosphor-icons/react";

const features = [
  {
    Icon: DeviceMobile,
    title: "Santé Technique",
    description:
      "Performance, SSL, compatibilité mobile, vitesse de chargement — tous les indicateurs techniques qui impactent votre classement Google.",
    points: "30 pts",
    checks: ["SSL actif", "Score Lighthouse", "Mobile-friendly", "Vitesse < 2s"],
    featured: true,
  },
  {
    Icon: MagnifyingGlass,
    title: "Référencement Google",
    description:
      "Balises SEO, structure H1/H2, indexation, sitemap et robots.txt — tout ce qui détermine votre visibilité dans les résultats.",
    points: "30 pts",
    checks: ["Balises meta", "Sitemap.xml", "Indexation Google", "Structure titres"],
    featured: false,
  },
  {
    Icon: MapPin,
    title: "Présence en Ligne",
    description:
      "Fiche Google Maps, page Facebook, Instagram — votre cohérence sur toutes les plateformes où vos clients vous cherchent.",
    points: "25 pts",
    checks: ["Google Business", "Page Facebook", "Instagram", "Cohérence NAP"],
    featured: false,
  },
  {
    Icon: UserCircle,
    title: "Expérience Visiteur",
    description:
      "Numéro cliquable, formulaire de contact, accessibilité — les éléments qui transforment un visiteur en client.",
    points: "15 pts",
    checks: ["Téléphone cliquable", "Formulaire contact", "Adresse visible", "Accessibilité"],
    featured: false,
  },
];

const statusIcon = (i: number) => {
  if (i === 0) return <CheckCircle weight="fill" className="text-success w-4 h-4" />;
  if (i === 1) return <XCircle weight="fill" className="text-error w-4 h-4" />;
  return <Warning weight="fill" className="text-warning w-4 h-4" />;
};

export function FeaturesSection() {
  const [featured, ...rest] = features;

  return (
    <section className="bg-parchemin pb-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-serif text-[36px] font-medium text-noir mb-4">
            Un diagnostic complet en 4 dimensions
          </h2>
          <p className="text-[17px] text-olive max-w-[480px] mx-auto leading-[1.60]">
            Plus de 20 critères analysés automatiquement pour vous donner une vision claire de votre état numérique.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Grande carte featured */}
          <motion.div
            className="md:col-span-2 md:row-span-2 bg-ivoire border border-bordure rounded-2xl p-8 flex flex-col justify-between shadow-[rgba(0,0,0,0.04)_0px_4px_20px]"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#e8f5ee] flex items-center justify-center">
                  <featured.Icon weight="duotone" className="w-6 h-6 text-savane" />
                </div>
                <span className="text-[12px] font-medium text-pierre bg-sable rounded-full px-3 py-1">
                  {featured.points}
                </span>
              </div>
              <h3 className="font-serif text-[28px] font-medium text-noir mb-3">
                {featured.title}
              </h3>
              <p className="text-[16px] text-olive leading-[1.65] max-w-[420px]">
                {featured.description}
              </p>
            </div>

            {/* Mini checklist */}
            <div className="mt-8 grid grid-cols-2 gap-2">
              {featured.checks.map((check, i) => (
                <div key={check} className="flex items-center gap-2 bg-white border border-bordure rounded-lg px-3 py-2.5">
                  {statusIcon(i)}
                  <span className="text-[14px] text-charbon">{check}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 3 petites cartes */}
          {rest.map((f, i) => (
            <motion.div
              key={f.title}
              className="bg-ivoire border border-bordure rounded-2xl p-6 flex flex-col gap-4 shadow-[rgba(0,0,0,0.03)_0px_2px_12px]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#e8f5ee] flex items-center justify-center">
                  <f.Icon weight="duotone" className="w-5 h-5 text-savane" />
                </div>
                <span className="text-[11px] font-medium text-pierre bg-sable rounded-full px-2.5 py-1">
                  {f.points}
                </span>
              </div>
              <div>
                <h3 className="font-serif text-[20px] font-medium text-noir mb-2">
                  {f.title}
                </h3>
                <p className="text-[14px] text-olive leading-[1.60]">
                  {f.description}
                </p>
              </div>
            </motion.div>
          ))}

        </div>
      </div>
    </section>
  );
}
