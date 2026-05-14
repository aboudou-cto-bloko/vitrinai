"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CREDIT_PACKS, type PackId } from "@/lib/credit-packs";
import { Suspense } from "react";

function ConfirmationContent() {
  const params = useSearchParams();
  const packId = params.get("pack") as PackId | null;
  const pack = packId ? CREDIT_PACKS[packId] : null;

  return (
    <div className="min-h-screen bg-parchemin flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-6">🎉</div>
        <h1 className="font-serif text-[26px] font-medium text-noir mb-2">
          Paiement reçu
        </h1>
        <p className="text-[15px] text-olive mb-2">
          {pack
            ? `Vos ${pack.credits} crédits seront disponibles dans quelques secondes.`
            : "Vos crédits seront disponibles dans quelques secondes."}
        </p>
        <p className="text-[13px] text-pierre mb-8">
          Si le solde ne s&apos;actualise pas, rafraîchissez la page.
        </p>
        <Link
          href="/credits"
          className="inline-flex h-10 px-6 items-center rounded-lg bg-savane text-white text-[14px] font-medium hover:bg-savane/90 transition-colors"
        >
          Voir mon solde
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  );
}
