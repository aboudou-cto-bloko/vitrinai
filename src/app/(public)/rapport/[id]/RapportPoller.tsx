"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, ShieldCheck, MagnifyingGlass, MapPin } from "@phosphor-icons/react";

export function RapportPoller({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    let tries = 0;
    const interval = setInterval(async () => {
      tries++;
      try {
        const res = await fetch(`/api/audit/status/${id}`);
        const data = await res.json();
        if (data.statut === "terminé") {
          clearInterval(interval);
          router.refresh();
        } else if (data.statut === "erreur" || tries > 24) {
          clearInterval(interval);
        }
      } catch {
        if (tries > 24) clearInterval(interval);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [id, router]);

  return (
    <main className="min-h-screen bg-parchemin flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center px-4">
        <div className="relative w-20 h-20">
          <CircleNotch size={80} weight="light" className="text-savane animate-spin absolute" />
          <ShieldCheck size={32} weight="duotone" className="text-savane absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div>
          <h1 className="text-[22px] font-semibold text-charbon mb-2" style={{ fontFamily: "Georgia, serif" }}>
            Analyse en cours…
          </h1>
          <p className="text-[14px] text-pierre max-w-xs">
            Nous analysons votre site sur 4 axes. Cela prend environ 20–30 secondes.
          </p>
        </div>
        <div className="flex gap-6 text-[13px] text-pierre">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} weight="duotone" className="text-savane" />Technique</span>
          <span className="flex items-center gap-1.5"><MagnifyingGlass size={14} weight="duotone" className="text-savane" />SEO</span>
          <span className="flex items-center gap-1.5"><MapPin size={14} weight="duotone" className="text-savane" />Présence</span>
        </div>
      </div>
    </main>
  );
}
