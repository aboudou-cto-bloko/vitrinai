"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Bell, CircleNotch, CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";

interface Props {
  auditId: string;
  isOwner: boolean;
  initialActif?: boolean;
}

export function SuiviSection({ auditId, isOwner, initialActif }: Props) {
  const [actif, setActif] = useState(initialActif ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const me = useQuery(api.credits.getMe);
  const activer = useAction(api.ai.activerSuivi);

  const canAfford = (me?.creditsBalance ?? 0) >= 3;

  async function handleActiver() {
    setLoading(true);
    setError(null);
    try {
      await activer({ auditId: auditId as Id<"audits"> });
      setActif(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg === "Solde insuffisant" ? "Crédits insuffisants." : msg);
    } finally {
      setLoading(false);
    }
  }

  if (!isOwner) return null;

  return (
    <div className="mt-4">
      {actif ? (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
          <CheckCircle size={20} weight="duotone" className="text-green-600 shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-green-800">Suivi mensuel activé</p>
            <p className="text-[12px] text-green-600">
              Vous recevrez un rapport d&apos;évolution chaque mois par email.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-parchemin border border-bordure rounded-2xl px-5 py-4">
          <div className="flex items-start gap-3">
            <Bell size={18} weight="duotone" className="text-savane shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-charbon">Suivi mensuel</p>
              <p className="text-[12px] text-pierre">
                Re-audit automatique chaque mois + email de comparaison avec votre progression.
              </p>
              {error && <p className="text-[12px] text-red-600 mt-1">{error}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
            <button
              onClick={handleActiver}
              disabled={loading || !canAfford}
              className="inline-flex items-center gap-2 bg-charbon text-white text-[12px] font-medium px-3 py-2 rounded-xl hover:bg-charbon/90 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              {loading ? (
                <><CircleNotch size={13} className="animate-spin" /> Activation…</>
              ) : (
                <><Bell size={13} weight="duotone" /> Activer — 3 cr/mois</>
              )}
            </button>
            {!canAfford && (
              <Link href="/credits" className="text-[11px] text-savane underline">Recharger</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
