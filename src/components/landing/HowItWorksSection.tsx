"use client";

import { useState, useEffect, useRef } from "react";
import { Link, Lightning, ChartBar, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    Icon: Link,
    num: "01",
    title: "Collez votre URL",
    description:
      "Entrez l'adresse de votre site ou le nom de votre entreprise. Pas d'inscription, pas de configuration. En quelques secondes, l'analyse démarre.",
    detail: "Compatible avec tous les types de sites — vitrine, e-commerce, blog, landing page.",
  },
  {
    Icon: Lightning,
    num: "02",
    title: "On analyse tout",
    description:
      "Notre moteur vérifie plus de 20 points en 30 secondes chrono — performance, SEO, présence sociale, expérience visiteur.",
    detail: "Propulsé par Google PageSpeed Insights + analyse SEO en temps réel.",
  },
  {
    Icon: ChartBar,
    num: "03",
    title: "Recevez votre score",
    description:
      "Rapport détaillé avec un score sur 100, un grade (A à F) et vos 3 priorités concrètes pour progresser immédiatement.",
    detail: "Partageable par lien. Envoyable par email en PDF. Mis à jour à chaque audit.",
  },
];

const INTERVAL = 3500;

export function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCycle = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    setProgress(0);

    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + (100 / (INTERVAL / 50)), 100));
    }, 50);

    intervalRef.current = setInterval(() => {
      setActive((a) => (a + 1) % steps.length);
      setProgress(0);
    }, INTERVAL);
  };

  useEffect(() => {
    if (!paused) startCycle();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [paused]);

  const handleStepClick = (i: number) => {
    setActive(i);
    setPaused(false);
    startCycle();
  };

  return (
    <section id="comment-ca-marche" className="bg-noir py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Gauche */}
          <div>
            <div className="inline-flex items-center rounded-full border border-noir-eleve px-4 py-1.5 mb-6">
              <span className="text-[12px] font-medium tracking-[0.5px] text-argent uppercase">
                Notre Processus
              </span>
            </div>

            <h2 className="font-serif text-[42px] md:text-[48px] font-medium text-ivoire leading-[1.15] mb-6">
              3 étapes,<br />30 secondes
            </h2>

            <p className="text-[17px] text-argent leading-[1.65] mb-10 max-w-[420px]">
              Un diagnostic complet de votre présence digitale, sans inscription, sans attente.
            </p>

            {/* Steps nav */}
            <div className="flex flex-col gap-2 mb-10">
              {steps.map((step, i) => (
                <button
                  key={step.num}
                  onClick={() => handleStepClick(i)}
                  onMouseEnter={() => setPaused(true)}
                  onMouseLeave={() => setPaused(false)}
                  className={[
                    "flex items-center gap-4 rounded-xl px-5 py-4 text-left transition-all duration-300 group",
                    active === i
                      ? "bg-noir-eleve border border-bordure-sombre"
                      : "border border-transparent hover:border-noir-eleve",
                  ].join(" ")}
                >
                  <div className={[
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300",
                    active === i ? "bg-savane" : "bg-noir-eleve group-hover:bg-[#252524]",
                  ].join(" ")}>
                    <step.Icon weight="bold" className="w-4 h-4 text-ivoire" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={[
                      "text-[11px] font-medium tracking-wider uppercase block mb-0.5 transition-colors",
                      active === i ? "text-savane" : "text-pierre",
                    ].join(" ")}>
                      {step.num}
                    </span>
                    <span className={[
                      "text-[15px] font-medium transition-colors",
                      active === i ? "text-ivoire" : "text-argent",
                    ].join(" ")}>
                      {step.title}
                    </span>
                  </div>
                  {/* Barre de progression */}
                  {active === i && (
                    <div className="w-12 h-1 bg-noir rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className="h-full bg-savane rounded-full transition-none"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <Button size="default" asChild>
              <a href="#analyser">
                Analyser gratuitement
                <ArrowRight weight="bold" className="w-4 h-4 ml-1" />
              </a>
            </Button>
          </div>

          {/* Droite — stacked cards */}
          <div
            className="relative h-[360px] flex items-center justify-center"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {steps.map((step, i) => {
              const offset = i - active;
              const isActive = i === active;
              const isPrev = i < active || (active === 0 && i === steps.length - 1);

              // Calcul position dans la pile
              const behind =
                active === 0 && i === steps.length - 1
                  ? false
                  : i < active;

              const visualOffset = (() => {
                if (isActive) return 0;
                // cartes suivantes empilées derrière vers le bas
                const dist = (i - active + steps.length) % steps.length;
                return dist * 18;
              })();

              const scale = isActive ? 1 : 1 - ((i - active + steps.length) % steps.length) * 0.05;
              const zIdx = steps.length - ((i - active + steps.length) % steps.length);
              const opacity = isActive ? 1 : (i - active + steps.length) % steps.length === 1 ? 0.55 : 0.25;

              return (
                <div
                  key={step.num}
                  className="absolute w-full max-w-[420px]"
                  style={{
                    transform: `translateY(${visualOffset}px) scale(${scale})`,
                    zIndex: zIdx,
                    opacity,
                    transition: "all 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
                    transformOrigin: "top center",
                  }}
                >
                  <div className={[
                    "rounded-2xl p-8 border transition-all duration-500",
                    isActive
                      ? "bg-noir-eleve border-bordure-sombre shadow-[rgba(0,0,0,0.5)_0px_20px_60px]"
                      : "bg-[#1c1c1b] border-[#252524]",
                  ].join(" ")}>
                    <div className="w-12 h-12 rounded-xl bg-savane/20 flex items-center justify-center mb-6">
                      <step.Icon weight="duotone" className="w-6 h-6 text-savane" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[11px] font-medium tracking-wider text-savane uppercase">
                        Étape {step.num}
                      </span>
                    </div>
                    <h3 className="font-serif text-[26px] font-medium text-ivoire mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[15px] text-argent leading-[1.65] mb-4">
                      {step.description}
                    </p>
                    <p className="text-[13px] text-pierre leading-[1.55] border-t border-noir pt-4">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
