"use client";

import { useState, useRef, useEffect } from "react";
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
  return (
    <div
      style={{ fontFamily: "system-ui, sans-serif", display: "inline-block" }}
      className="select-none"
    >
      <svg width="240" height="80" viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
        <rect width="240" height="80" rx="12" fill="#1c1c1b" />
        {/* Left accent */}
        <rect x="0" y="0" width="4" height="80" rx="2" fill={color} />
        {/* Grade circle */}
        <circle cx="48" cy="40" r="24" fill={color} opacity="0.15" />
        <text x="48" y="46" textAnchor="middle" fill={color} fontSize="22" fontWeight="700" fontFamily="system-ui">{grade}</text>
        {/* Score */}
        <text x="88" y="30" fill="#f0ede4" fontSize="11" fontFamily="system-ui" opacity="0.6">Présence digitale</text>
        <text x="88" y="48" fill="#f0ede4" fontSize="18" fontWeight="700" fontFamily="system-ui">{score}<tspan fontSize="11" opacity="0.6">/100</tspan></text>
        {/* Hostname */}
        <text x="88" y="64" fill="#f0ede4" fontSize="10" fontFamily="system-ui" opacity="0.45">{hostname.slice(0, 24)}</text>
        {/* VitrinAI watermark */}
        <text x="222" y="74" textAnchor="end" fill="#f0ede4" fontSize="8" fontFamily="system-ui" opacity="0.3">VitrinAI</text>
      </svg>
    </div>
  );
}

export function BadgeSection({ auditId, hostname, score, grade, isOwner, initialUnlocked }: Props) {
  const [unlocked, setUnlocked] = useState(initialUnlocked ?? false);
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  const me = useQuery(api.credits.getMe);
  const unlock = useAction(api.ai.unlockBadge);

  const reportUrl = typeof window !== "undefined"
    ? `${window.location.origin}/rapport/${auditId}`
    : `/rapport/${auditId}`;

  useEffect(() => {
    if (!unlocked) return;
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(reportUrl, { width: 160, margin: 1, color: { dark: "#1c1c1b", light: "#ffffff" } })
        .then(setQrDataUrl)
        .catch(console.error);
    });
  }, [unlocked, reportUrl]);

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
    const code = `<a href="${reportUrl}" target="_blank" rel="noopener"><img src="${reportUrl}/badge.svg" alt="Score VitrinAI ${score}/100" width="240" height="80" /></a>`;
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
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-2">
                <img src={qrDataUrl} alt="QR code rapport" width={80} height={80} className="rounded-lg border border-bordure" />
                <span className="text-[10px] text-pierre text-center">QR → Rapport</span>
              </div>
            )}
            {!qrDataUrl && (
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
              {`<a href="${reportUrl}"><img src="${reportUrl}/badge.svg" alt="Score VitrinAI ${score}/100" width="240" height="80"/></a>`}
            </code>
          </div>
        </motion.div>
      )}
    </div>
  );
}
