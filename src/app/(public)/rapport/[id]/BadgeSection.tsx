"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Medal, QrCode, DownloadSimple, CircleNotch } from "@phosphor-icons/react";
import Link from "next/link";

interface Props {
  auditId: string;
  hostname: string;
  score: number;
  grade: string;
  isOwner: boolean;
  initialUnlocked?: boolean;
}

const GRADE_COLOR: Record<string, string> = {
  A: "#22763e", B: "#3c8260", C: "#b47a0a", D: "#be641e", F: "#aa2828",
};

function ScoreBadge({ hostname, score, grade }: { hostname: string; score: number; grade: string }) {
  const color = GRADE_COLOR[grade] ?? "#666";
  const label = hostname.slice(0, 26);
  return (
    <div style={{ display: "inline-block" }} className="select-none">
      <svg width="240" height="60" viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg">
        {/* Card */}
        <rect width="240" height="60" rx="10" fill="#ffffff" />
        <rect x="0.5" y="0.5" width="239" height="59" rx="9.5" fill="none" stroke="#e5e0d5" strokeWidth="1" />

        {/* Grade pill */}
        <rect x="14" y="13" width="34" height="34" rx="8" fill={color} />
        <text x="31" y="36" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="700" fontFamily="system-ui, sans-serif">{grade}</text>

        {/* Domain */}
        <text x="60" y="26" fill="#1c1c1b" fontSize="12" fontWeight="600" fontFamily="system-ui, sans-serif">{label}</text>

        {/* Score + branding */}
        <text x="60" y="42" fill="#888" fontSize="10" fontFamily="system-ui, sans-serif">
          {score}<tspan fill="#bbb">/100</tspan>
          <tspan dx="6" fill="#c5bfb4">·</tspan>
          <tspan dx="6" fill="#b0a898">VitrinAI</tspan>
        </text>
      </svg>
    </div>
  );
}

export function BadgeSection({ auditId, hostname, score, grade, isOwner, initialUnlocked }: Props) {
  const [unlocked, setUnlocked] = useState(initialUnlocked ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  const me = useQuery(api.credits.getMe);
  const unlock = useAction(api.ai.unlockBadge);

  const reportUrl = typeof window !== "undefined"
    ? `${window.location.origin}/rapport/${auditId}`
    : `/rapport/${auditId}`;

  const qrUrl = unlocked
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=1&data=${encodeURIComponent(reportUrl)}`
    : null;

  async function handleUnlock() {
    setLoading(true);
    setError(null);
    try {
      await unlock({ auditId: auditId as Id<"audits"> });
      setUnlocked(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg === "Solde insuffisant" ? "Crédits insuffisants." : msg);
    } finally {
      setLoading(false);
    }
  }

  function downloadSvg() {
    const svg = badgeRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `badge-vitrinai-${hostname}.svg`;
    a.click();
  }

  function copyEmbed() {
    const code = `<a href="${reportUrl}" target="_blank" rel="noopener"><img src="${reportUrl}/badge.svg" alt="Score VitrinAI ${score}/100" width="240" height="60" /></a>`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const canAfford = (me?.creditsBalance ?? 0) >= 2;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-semibold text-charbon flex items-center gap-2">
            <Medal size={18} weight="duotone" className="text-savane" />
            Badge & QR code
          </h2>
          <p className="text-[12px] text-pierre mt-0.5">
            Affichez votre score sur votre site ou vos documents
          </p>
        </div>
        {!unlocked && isOwner && (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleUnlock}
              disabled={loading || !canAfford}
              className="inline-flex items-center gap-2 bg-charbon text-white text-[13px] font-medium px-4 py-2.5 rounded-xl hover:bg-charbon/90 transition-colors disabled:opacity-40"
            >
              {loading ? (
                <><CircleNotch size={14} className="animate-spin" /> Déverrouillage…</>
              ) : (
                <><Medal size={14} weight="duotone" /> Débloquer — 2 crédits</>
              )}
            </button>
            {!canAfford && (
              <Link href="/credits" className="text-[11px] text-savane underline">Recharger</Link>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-[13px] text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4">{error}</p>
      )}

      {!unlocked && (
        <div className="bg-parchemin border border-bordure rounded-2xl px-6 py-6">
          <div className="opacity-50 pointer-events-none mb-4" ref={badgeRef}>
            <ScoreBadge hostname={hostname} score={score} grade={grade} />
          </div>
          <p className="text-[12px] text-pierre">
            Débloquez ce badge pour l&apos;intégrer sur votre site, dans vos emails ou vos présentations clients.
          </p>
        </div>
      )}

      {unlocked && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-bordure rounded-2xl px-6 py-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Badge preview */}
            <div ref={badgeRef}>
              <ScoreBadge hostname={hostname} score={score} grade={grade} />
            </div>

            {/* QR code */}
            {qrUrl ? (
              <div className="flex flex-col items-center gap-2">
                <img src={qrUrl} alt="QR code rapport" width={80} height={80} className="rounded-lg border border-bordure" />
                <span className="text-[10px] text-pierre text-center">QR → Rapport</span>
              </div>
            ) : (
              <div className="w-[80px] h-[80px] bg-sable rounded-lg flex items-center justify-center">
                <QrCode size={32} className="text-pierre/40" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadSvg}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-lg border border-bordure text-charbon hover:bg-parchemin transition-colors"
            >
              <DownloadSimple size={14} />
              Télécharger SVG
            </button>
            <button
              onClick={copyEmbed}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-lg border border-bordure text-charbon hover:bg-parchemin transition-colors"
            >
              {copied ? "Copié !" : "Copier le code HTML"}
            </button>
          </div>

          {/* Embed code */}
          <div>
            <p className="text-[11px] text-pierre mb-1.5">Code à intégrer sur votre site :</p>
            <code className="block bg-sable text-[10px] text-charbon px-4 py-3 rounded-xl break-all leading-relaxed">
              {`<a href="${reportUrl}"><img src="${reportUrl}/badge.svg" alt="Score VitrinAI ${score}/100" width="240" height="60"/></a>`}
            </code>
          </div>
        </motion.div>
      )}
    </div>
  );
}
