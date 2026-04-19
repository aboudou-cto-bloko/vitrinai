"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  MagnifyingGlass,
  Globe,
  DeviceMobile,
  MapPin,
  CircleNotch,
  ArrowRight,
} from "@phosphor-icons/react";

const STEPS = [
  { Icon: Globe, label: "Vérification du domaine", sub: "DNS, SSL, accessibilité…" },
  { Icon: ShieldCheck, label: "Performance & sécurité", sub: "Lighthouse, HTTPS, LCP…" },
  { Icon: MagnifyingGlass, label: "Analyse SEO", sub: "Title, H1, schema, sitemap…" },
  { Icon: MapPin, label: "Présence & contact", sub: "Réseaux, Maps, WhatsApp…" },
  { Icon: DeviceMobile, label: "Expérience mobile", sub: "Accessibilité, formulaires…" },
];

const POLL_INTERVAL = 2500;
const MAX_POLLS = 24;

export function AuditWidget() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setError(null);
    setLoading(true);
    setStep(0);

    let auditId: string;
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors du lancement de l'audit.");
        setLoading(false);
        return;
      }
      auditId = data.auditId;
    } catch {
      setError("Impossible de contacter le serveur.");
      setLoading(false);
      return;
    }

    let polls = 0;
    const interval = setInterval(async () => {
      polls++;
      setStep((s) => (s + 1) % STEPS.length);

      try {
        const res = await fetch(`/api/audit/status/${auditId}`);
        const data = await res.json();

        if (data.statut === "terminé") {
          clearInterval(interval);
          router.push(`/rapport/${auditId}`);
          return;
        }
        if (data.statut === "erreur" || polls >= MAX_POLLS) {
          clearInterval(interval);
          setError("L'audit a échoué. Vérifiez l'URL et réessayez.");
          setLoading(false);
        }
      } catch {
        if (polls >= MAX_POLLS) {
          clearInterval(interval);
          setError("Délai d'attente dépassé. Réessayez.");
          setLoading(false);
        }
      }
    }, POLL_INTERVAL);
  }

  const progress = ((step + 1) / STEPS.length) * 85 + 10;

  return (
    <div className="bg-white rounded-2xl border border-bordure shadow-[rgba(0,0,0,0.08)_0px_8px_32px] w-full max-w-[640px] mx-auto overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 flex flex-col gap-6"
          >
            {/* Step icon */}
            <div className="flex items-center justify-center">
              <div className="relative w-16 h-16">
                <motion.div className="absolute inset-0">
                  <CircleNotch size={64} weight="light" className="text-savane animate-spin" />
                </motion.div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
                    transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    {(() => { const { Icon } = STEPS[step]; return <Icon size={28} weight="duotone" className="text-savane" />; })()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Step label */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                className="text-center"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-[15px] font-medium text-charbon">{STEPS[step].label}</p>
                <p className="text-[13px] text-pierre mt-0.5">{STEPS[step].sub}</p>
              </motion.div>
            </AnimatePresence>

            {/* Progress bar */}
            <div className="flex flex-col gap-2">
              <div className="w-full bg-sable rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="bg-savane h-full rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              {/* Step dots */}
              <div className="flex justify-center gap-1.5 mt-1">
                {STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    animate={{
                      width: i === step ? 16 : 6,
                      backgroundColor: i <= step ? "#2d7a4f" : "#d9d5c8",
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ height: 6 }}
                  />
                ))}
              </div>
            </div>

            <p className="text-center text-[12px] text-argent">Analyse en cours — environ 20–30 secondes</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="url" className="text-[14px] font-medium text-charbon">
                URL de votre site web
              </Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://votresite.com"
                className="h-14 text-[16px]"
                autoComplete="off"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button type="submit" size="xl" className="w-full text-[16px] font-medium flex items-center justify-center gap-2 group">
              Analyser maintenant
              <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-1" />
            </Button>

            <p className="text-center text-[13px] text-pierre">
              Analyse gratuite · Résultat en 30 secondes
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
