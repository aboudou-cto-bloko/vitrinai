"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  ShieldCheck,
  MagnifyingGlass,
  MapPin,
  DeviceMobile,
  CircleNotch,
} from "@phosphor-icons/react";

const STEPS = [
  { Icon: Globe,          label: "Vérification du domaine",  sub: "DNS · SSL · accessibilité"     },
  { Icon: ShieldCheck,    label: "Performance & sécurité",   sub: "Lighthouse · HTTPS · LCP"      },
  { Icon: MagnifyingGlass,label: "Analyse SEO",              sub: "Title · H1 · schema · sitemap" },
  { Icon: MapPin,         label: "Présence & contact",       sub: "Réseaux · Maps · WhatsApp"     },
  { Icon: DeviceMobile,   label: "Expérience mobile",        sub: "Accessibilité · formulaires"   },
];

// Timestamps (ms) auxquels chaque étape s'affiche
const STEP_STARTS = [0, 4000, 9000, 14000, 19000];
const TOTAL_MS = 25000;

export function RapportPoller({ id }: { id: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(3);
  const [done, setDone] = useState(false);

  // Avancement des étapes (fake, basé sur le temps)
  useEffect(() => {
    const timers = STEP_STARTS.map((delay, i) =>
      setTimeout(() => setStep(i), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Barre de progression fluide : rapide au début, ralentit vers 95 %
  useEffect(() => {
    const start = Date.now();
    let raf: number;
    function tick() {
      const t = Math.min((Date.now() - start) / TOTAL_MS, 1);
      const eased = 1 - Math.pow(1 - t, 2.8); // ease-out fort
      setProgress(Math.min(3 + eased * 92, 95));
      if (t < 1 && !done) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [done]);

  // Polling réel
  useEffect(() => {
    let tries = 0;
    const interval = setInterval(async () => {
      tries++;
      try {
        const res = await fetch(`/api/audit/status/${id}`);
        const data = await res.json() as { statut?: string };
        if (data.statut === "terminé") {
          clearInterval(interval);
          setDone(true);
          setProgress(100);
          setTimeout(() => router.refresh(), 400);
        } else if (data.statut === "erreur" || tries > 24) {
          clearInterval(interval);
        }
      } catch {
        if (tries > 24) clearInterval(interval);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [id, router]);

  const { Icon } = STEPS[step];

  return (
    <main className="min-h-screen bg-parchemin pb-16">

      {/* ── Loader card ─────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-6">
        <motion.div
          className="bg-white rounded-2xl border border-bordure p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Icône animée */}
            <div className="relative w-16 h-16 shrink-0">
              <CircleNotch
                size={64} weight="light"
                className="text-savane animate-spin absolute inset-0"
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1,   opacity: 1, rotate: 0   }}
                  exit  ={{ scale: 0.3, opacity: 0, rotate: 20  }}
                  transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <Icon size={26} weight="duotone" className="text-savane" />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Texte de l'étape + barre */}
            <div className="flex-1 w-full text-center sm:text-left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit  ={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <p className="text-[16px] font-semibold text-charbon">
                    {STEPS[step].label}
                  </p>
                  <p className="text-[13px] text-pierre mt-0.5">
                    {STEPS[step].sub}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 space-y-2">
                {/* Barre + % */}
                <div className="flex items-center justify-between text-[11px] text-argent">
                  <span>Étape {step + 1} / {STEPS.length}</span>
                  <motion.span animate={{ opacity: 1 }}>
                    {Math.round(progress)} %
                  </motion.span>
                </div>
                <div className="h-1.5 bg-sable rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-savane rounded-full origin-left"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                {/* Pastilles étapes */}
                <div className="flex gap-1.5 pt-0.5">
                  {STEPS.map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-1 rounded-full"
                      animate={{
                        width: i === step ? 18 : 6,
                        backgroundColor: i <= step ? "#2d7a4f" : "#d9d5c8",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Skeleton du rapport (anticipation) ──────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 flex flex-col gap-5">

        {/* Score hero skeleton */}
        <motion.div
          className="bg-white rounded-2xl border border-bordure p-8 flex flex-col sm:flex-row items-center gap-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {/* Anneau */}
          <div className="w-36 h-36 rounded-full bg-sable animate-pulse shrink-0" />
          <div className="flex-1 w-full space-y-4">
            <div className="space-y-2 text-center sm:text-left">
              <div className="h-5 bg-sable rounded-lg w-64 animate-pulse mx-auto sm:mx-0" />
              <div className="h-3 bg-sable rounded w-40 animate-pulse mx-auto sm:mx-0" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-parchemin rounded-xl p-3 space-y-2 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="h-6 bg-sable rounded w-10 mx-auto" />
                  <div className="h-2.5 bg-sable rounded w-14 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Axes skeleton */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-bordure p-6 space-y-4 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sable shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3.5 bg-sable rounded w-20" />
                    <div className="h-3.5 bg-sable rounded w-10" />
                  </div>
                  <div className="h-2 bg-sable rounded-full" />
                </div>
              </div>
              <div className="space-y-2.5">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="flex gap-2.5 items-start">
                    <div className="w-4 h-4 rounded-full bg-sable shrink-0 mt-0.5" />
                    <div
                      className="h-3 bg-sable rounded flex-1"
                      style={{ width: `${68 + j * 9}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Recommandations skeleton */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
        >
          <div className="h-5 bg-sable rounded w-48 animate-pulse" />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-bordure p-5 flex gap-4 animate-pulse"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="w-8 h-8 rounded-full bg-sable shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <div className="h-3.5 bg-sable rounded w-40" />
                  <div className="h-3.5 bg-sable rounded-full w-20" />
                </div>
                <div className="h-3 bg-sable rounded w-full" />
                <div className="h-3 bg-sable rounded w-3/4" />
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </main>
  );
}
