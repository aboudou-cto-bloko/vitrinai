"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { X, Palette, Check, Lock, CircleNotch } from "@phosphor-icons/react";
import { PRESET_META, type PresetId, type ReportThemeConfig } from "@/lib/report-themes";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

interface Props {
  auditId: string;
  currentTheme: ReportThemeConfig;
  onThemeChange: (theme: ReportThemeConfig) => void;
}

const PRESET_LIST = Object.values(PRESET_META);

export function ThemePanelTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 text-[13px] font-medium px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition-colors"
    >
      <Palette size={14} weight="duotone" />
      <span className="hidden sm:inline">Personnaliser</span>
    </button>
  );
}

export function ThemePanel({ auditId, currentTheme, onThemeChange }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetId>(currentTheme.preset);
  const [companyName, setCompanyName] = useState(currentTheme.companyName ?? "");
  const [accentHex, setAccentHex] = useState(currentTheme.accentHex ?? "#1c1c1b");
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();
  const me = useQuery(api.credits.getMe);
  const applyThemeMutation = useMutation(api.audits.applyTheme);

  const selectedMeta = PRESET_META[selectedPreset];
  const cost = selectedMeta.creditCost;
  const isCurrentPreset = currentTheme.preset === selectedPreset;
  const canAfford = (me?.creditsBalance ?? 0) >= cost;

  async function handleApply() {
    if (!session) return;
    setApplying(true);
    setError(null);
    try {
      await applyThemeMutation({
        auditId: auditId as Id<"audits">,
        preset: selectedPreset,
        companyName: companyName || undefined,
        accentHex: selectedPreset === "brand" ? accentHex : undefined,
      });
      onThemeChange({
        preset: selectedPreset,
        companyName: companyName || undefined,
        accentHex: selectedPreset === "brand" ? accentHex : undefined,
      });
      setOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg === "Solde insuffisant" ? "Crédits insuffisants pour ce thème." : msg);
    } finally {
      setApplying(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-[13px] font-medium px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition-colors"
      >
        <Palette size={14} weight="duotone" />
        <span className="hidden sm:inline">Personnaliser</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.aside
              className="fixed right-0 top-0 h-full w-full max-w-[400px] bg-white z-50 shadow-2xl flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                  <h2 className="text-[16px] font-semibold text-gray-900">Personnaliser le rapport</h2>
                  <p className="text-[12px] text-gray-400 mt-0.5">Choisissez un thème visuel</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Unauthenticated */}
              {!session && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <Lock size={32} weight="duotone" className="text-gray-300" />
                  <p className="text-[15px] font-medium text-gray-700">Créez un compte pour personnaliser</p>
                  <p className="text-[13px] text-gray-400">
                    Les thèmes sont disponibles à partir de 3 crédits.
                  </p>
                  <Link
                    href="/signup"
                    className="mt-2 h-10 px-6 rounded-xl bg-gray-900 text-white text-[14px] font-medium hover:bg-gray-800 transition-colors flex items-center"
                    onClick={() => setOpen(false)}
                  >
                    Créer un compte — 2 crédits offerts
                  </Link>
                </div>
              )}

              {/* Authenticated */}
              {session && (
                <>
                  <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">

                    {/* Solde */}
                    {me !== undefined && (
                      <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
                        <span className="text-[13px] text-gray-500">Votre solde</span>
                        <span className="text-[14px] font-semibold text-gray-900">
                          {me?.creditsBalance ?? 0} crédit{(me?.creditsBalance ?? 0) > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}

                    {/* Preset cards */}
                    {PRESET_LIST.map((preset) => {
                      const isSelected = selectedPreset === preset.id;
                      const isApplied = currentTheme.preset === preset.id;
                      return (
                        <motion.button
                          key={preset.id}
                          onClick={() => setSelectedPreset(preset.id)}
                          whileTap={{ scale: 0.99 }}
                          className={`w-full text-left rounded-2xl border-2 p-4 transition-colors ${
                            isSelected
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-100 hover:border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Swatches */}
                            <div className="flex gap-1 mt-0.5 shrink-0">
                              {preset.id === "brand"
                                ? (
                                  <div
                                    className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center"
                                    style={{ background: selectedPreset === "brand" ? accentHex : "#f3f4f6" }}
                                  />
                                )
                                : preset.swatches.map((color, i) => (
                                  <div
                                    key={i}
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: color }}
                                  />
                                ))
                              }
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[14px] font-semibold text-gray-900">{preset.name}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isApplied && (
                                    <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                      Actif
                                    </span>
                                  )}
                                  {preset.creditCost === 0 ? (
                                    <span className="text-[12px] text-green-600 font-medium">Gratuit</span>
                                  ) : (
                                    <span className="text-[12px] text-gray-500 font-medium">
                                      {preset.creditCost} crédits
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-[12px] text-gray-400 mt-0.5">{preset.description}</p>
                            </div>

                            {/* Check */}
                            {isSelected && (
                              <Check size={16} weight="bold" className="text-gray-900 mt-0.5 shrink-0" />
                            )}
                          </div>

                          {/* Brand inputs */}
                          {isSelected && preset.id === "brand" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-4 space-y-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div>
                                <label className="block text-[12px] font-medium text-gray-600 mb-1">
                                  Nom de l&apos;entreprise
                                </label>
                                <input
                                  type="text"
                                  value={companyName}
                                  onChange={(e) => setCompanyName(e.target.value)}
                                  placeholder="Agence Digitale Cotonou"
                                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-400 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-[12px] font-medium text-gray-600 mb-1">
                                  Couleur principale
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={accentHex}
                                    onChange={(e) => setAccentHex(e.target.value)}
                                    className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                                  />
                                  <span className="text-[13px] text-gray-500 font-mono">{accentHex}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}

                    {/* Insufficient credits warning */}
                    {cost > 0 && !isCurrentPreset && !canAfford && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-700">
                        Solde insuffisant. Il vous faut{" "}
                        <strong>{cost - (me?.creditsBalance ?? 0)} crédit{cost - (me?.creditsBalance ?? 0) > 1 ? "s" : ""} supplémentaire{cost - (me?.creditsBalance ?? 0) > 1 ? "s" : ""}</strong>.{" "}
                        <Link href="/credits" className="underline" onClick={() => setOpen(false)}>
                          Recharger
                        </Link>
                      </div>
                    )}

                    {error && (
                      <p className="text-[13px] text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-4 border-t border-gray-100 space-y-2">
                    {cost > 0 && !isCurrentPreset && (
                      <p className="text-[12px] text-gray-400 text-center">
                        Ce thème coûte <strong className="text-gray-700">{cost} crédits</strong> (déduit une seule fois)
                      </p>
                    )}
                    <button
                      onClick={handleApply}
                      disabled={applying || (cost > 0 && !isCurrentPreset && !canAfford)}
                      className="w-full h-11 rounded-xl bg-gray-900 text-white text-[14px] font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {applying ? (
                        <>
                          <CircleNotch size={16} className="animate-spin" />
                          Application…
                        </>
                      ) : isCurrentPreset ? (
                        "Thème actif — Enregistrer les modifications"
                      ) : cost === 0 ? (
                        "Appliquer gratuitement"
                      ) : (
                        `Appliquer — ${cost} crédits`
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
