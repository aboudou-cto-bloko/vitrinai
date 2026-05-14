"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { ArrowRight, MagnifyingGlass, ShoppingCart } from "@phosphor-icons/react";

export function RapportUpsell({ analyzedUrl }: { analyzedUrl: string }) {
  const { data: session } = useSession();
  const me = useQuery(api.credits.getMe);

  const competitorQuery = encodeURIComponent(
    `concurrent de ${new URL(analyzedUrl).hostname}`
  );
  const homeWithQuery = `/?url=${encodeURIComponent(analyzedUrl)}`;

  return (
    <div className="border-t border-bordure bg-parchemin px-6 py-8">
      <div className="max-w-[860px] mx-auto">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-charbon mb-0.5">
              Continuez à améliorer votre présence digitale
            </p>
            <p className="text-[13px] text-pierre">
              Chaque crédit = une analyse complète · Résultat en 30 secondes
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-savane text-white text-[13px] font-medium hover:bg-savane/90 transition-colors"
            >
              <MagnifyingGlass size={14} weight="bold" />
              Analyser un autre site
              <ArrowRight size={13} weight="bold" />
            </Link>

            {session && (
              <>
                {(me?.creditsBalance ?? 0) <= 2 && (
                  <Link
                    href="/credits"
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[13px] font-medium hover:bg-amber-100 transition-colors"
                  >
                    <ShoppingCart size={14} weight="bold" />
                    {me?.creditsBalance ?? 0} crédit{(me?.creditsBalance ?? 0) > 1 ? "s" : ""} restant{(me?.creditsBalance ?? 0) > 1 ? "s" : ""}
                    — Recharger
                  </Link>
                )}
              </>
            )}

            {!session && (
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-white border border-bordure text-charbon text-[13px] font-medium hover:bg-sable transition-colors"
              >
                Créer un compte — 2 crédits offerts
              </Link>
            )}
          </div>
        </div>

        {session && me && me.creditsBalance >= 3 && (
          <p className="text-[12px] text-argent mt-4 text-center">
            Vous avez <strong className="text-olive">{me.creditsBalance} crédits</strong> disponibles ·{" "}
            <Link href={homeWithQuery} className="text-savane hover:underline">
              Relancer cette analyse
            </Link>
            {" · "}
            <Link href="/analyses" className="text-savane hover:underline">
              Voir l&apos;historique
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
