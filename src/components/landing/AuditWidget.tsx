"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  MagnifyingGlass,
  Globe,
  DeviceMobile,
  MapPin,
  CircleNotch,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";

// ── URL normalization & validation ────────────────────────────────────────────
function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type UrlState = "empty" | "valid" | "invalid";

function getUrlState(raw: string): UrlState {
  const trimmed = raw.trim();
  if (!trimmed) return "empty";
  try {
    const normalized = normalizeUrl(trimmed);
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol)) return "invalid";
    // Needs at least one dot in hostname and reasonable length
    if (!parsed.hostname.includes(".") || parsed.hostname.length < 4) return "invalid";
    // Block obvious non-URLs
    if (parsed.hostname.startsWith(".") || parsed.hostname.endsWith(".")) return "invalid";
    return "valid";
  } catch {
    return "invalid";
  }
}

// True when the displayed input differs from its normalized form
function getNormalizedPreview(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = normalizeUrl(trimmed);
  // Only show preview if we actually changed something
  if (normalized === trimmed) return null;
  // Don't show if it's just adding https:// — too noisy while typing
  if (normalized === `https://${trimmed}` && !trimmed.includes(" ")) return null;
  return normalized;
}

// ── Loading steps ─────────────────────────────────────────────────────────────
const STEPS = [
  { Icon: Globe,          label: "Vérification du domaine",  sub: "DNS, SSL, accessibilité…"      },
  { Icon: ShieldCheck,    label: "Performance & sécurité",   sub: "Lighthouse, HTTPS, LCP…"       },
  { Icon: MagnifyingGlass,label: "Analyse SEO",              sub: "Title, H1, schema, sitemap…"   },
  { Icon: MapPin,         label: "Présence & contact",       sub: "Réseaux, Maps, WhatsApp…"      },
  { Icon: DeviceMobile,   label: "Expérience mobile",        sub: "Accessibilité, formulaires…"   },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function AuditWidget() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [focused, setFocused] = useState(false);
  const [analyzedUrl, setAnalyzedUrl] = useState("");

  const urlState = getUrlState(raw);
  const normalizedPreview = getNormalizedPreview(raw);
  const isDirty = raw.trim().length > 0;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRaw(e.target.value);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    // On paste, immediately normalize if the pasted value is a clean URL
    const pasted = e.clipboardData.getData("text").trim();
    if (pasted) {
      e.preventDefault();
      // Clean common paste artefacts: trailing slash is fine, spaces are stripped
      const cleaned = pasted.replace(/\s+/g, "");
      setRaw(cleaned);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (urlState !== "valid" || loading) return;

    const finalUrl = normalizeUrl(raw.trim());
    setAnalyzedUrl(finalUrl);
    setLoading(true);
    setStep(0);

    // Lance l'audit — navigation immédiate vers le rapport dès que l'ID est créé
    // Le RapportPoller prend le relai pour attendre la fin de l'analyse
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl }),
      });
      const data = await res.json() as { auditId?: string; gated?: boolean; error?: string; requiresSignup?: boolean };
      if (!res.ok) {
        if (data.requiresSignup) {
          toast.error("Créez un compte gratuit pour continuer — 2 crédits offerts.", {
            duration: 6000,
            action: { label: "Créer un compte", onClick: () => router.push("/signup") },
          });
        } else {
          toast.error(data.error ?? "Erreur lors du lancement de l'audit.", { duration: 5000 });
        }
        setLoading(false);
        return;
      }
      // Optimistic : on navigue immédiatement, le rapport affiche son propre loader
      const suffix = data.gated ? "?gated=1" : "";
      router.push(`/rapport/${data.auditId}${suffix}`);
    } catch {
      toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.", { duration: 5000 });
      setLoading(false);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 85 + 10;

  // Border color based on state
  const borderColor =
    !isDirty || !focused
      ? "border-bordure"
      : urlState === "valid"
        ? "border-success ring-2 ring-success/20"
        : urlState === "invalid"
          ? "border-error ring-2 ring-error/10"
          : "border-bordure";

  return (
    <div className="bg-white rounded-2xl border border-bordure shadow-[rgba(0,0,0,0.08)_0px_8px_32px] w-full max-w-[640px] mx-auto overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          // ── Loading state ────────────────────────────────────────────────
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 flex flex-col gap-5"
          >
            {/* URL being analyzed */}
            <motion.div
              className="flex items-center justify-center gap-2 text-[13px] text-pierre bg-parchemin rounded-lg px-4 py-2"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Globe size={13} weight="duotone" className="text-savane shrink-0" aria-hidden="true" />
              <span className="truncate font-mono text-[12px]">{analyzedUrl}</span>
            </motion.div>

            {/* Spinner with step icon */}
            <div className="flex items-center justify-center">
              <div className="relative w-16 h-16">
                <CircleNotch size={64} weight="light" className="text-savane animate-spin absolute inset-0" aria-hidden="true" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.4, opacity: 0, rotate: 30 }}
                    transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    {(() => { const { Icon } = STEPS[step]; return <Icon size={28} weight="duotone" className="text-savane" aria-hidden="true" />; })()}
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

            {/* Progress bar + dots */}
            <div className="flex flex-col gap-2">
              <div className="w-full bg-sable rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="bg-savane h-full rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="flex justify-center gap-1.5 mt-1" aria-hidden="true">
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
          // ── Form state ───────────────────────────────────────────────────
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 sm:p-8 flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="url" className="text-[14px] font-medium text-charbon">
                Adresse de votre site
              </Label>

              {/* Input with validation icon */}
              <div className={`relative flex items-center rounded-xl border bg-white transition-all duration-200 ${borderColor}`}>
                <Globe
                  size={18}
                  weight="duotone"
                  className="absolute left-4 text-pierre shrink-0 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="url"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  spellCheck={false}
                  value={raw}
                  onChange={handleChange}
                  onPaste={handlePaste}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="monsite.com"
                  className="w-full h-14 text-[16px] bg-transparent pl-11 pr-12 outline-none text-charbon placeholder:text-argent"
                  aria-describedby="url-hint"
                />
                {/* Validation icon */}
                <AnimatePresence>
                  {isDirty && (
                    <motion.span
                      className="absolute right-4"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                      {urlState === "valid" ? (
                        <CheckCircle size={20} weight="fill" className="text-success" aria-hidden="true" />
                      ) : (
                        <XCircle size={20} weight="fill" className="text-error/50" aria-hidden="true" />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Normalized preview / hint */}
              <AnimatePresence>
                {isDirty && (
                  <motion.p
                    id="url-hint"
                    className="text-[12px] px-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {urlState === "valid" ? (
                      <span className="text-success">
                        ✓ Sera analysé comme{" "}
                        <span className="font-mono">{normalizeUrl(raw.trim())}</span>
                      </span>
                    ) : (
                      <span className="text-error/70">
                        Entrez un domaine valide — ex : <span className="font-mono">monsite.com</span>
                      </span>
                    )}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
            >
              <Button
                type="submit"
                size="xl"
                disabled={urlState !== "valid"}
                className="w-full text-[16px] font-medium flex items-center justify-center gap-2 group disabled:opacity-40 transition-opacity"
              >
                Analyser maintenant
                <ArrowRight
                  size={18}
                  weight="bold"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Button>
            </motion.div>

            <p className="text-center text-[13px] text-pierre">
              Analyse gratuite · Résultat en 30 secondes · Aucune inscription
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
