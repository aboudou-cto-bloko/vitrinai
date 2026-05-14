"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { CREDIT_PACKS, type PackId } from "@/lib/credit-packs";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";

const PACK_LIST = Object.values(CREDIT_PACKS);

function CreditsSkeleton() {
  return (
    <div className="min-h-screen bg-parchemin">
      <div className="max-w-[900px] mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-bordure p-6 mb-8 animate-pulse flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-sable rounded w-20" />
            <div className="h-10 bg-sable rounded w-36" />
          </div>
          <div className="h-10 w-28 bg-sable rounded-lg" />
        </div>
        <div className="h-5 bg-sable rounded w-40 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-bordure p-5 space-y-4 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-5 mb-3 bg-sable rounded w-16" />
              <div className="space-y-1.5">
                <div className="h-4 bg-sable rounded w-24" />
                <div className="h-3 bg-sable rounded w-32" />
              </div>
              <div className="space-y-1">
                <div className="h-8 bg-sable rounded w-20" />
                <div className="h-3 bg-sable rounded w-36" />
              </div>
              <div className="h-9 bg-sable rounded-lg w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CreditsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const me = useQuery(api.credits.getMe);
  const history = useQuery(api.credits.getHistory, me ? { userId: me._id } : "skip");
  const [loading, setLoading] = useState<PackId | null>(null);

  // Session en cours de chargement ou page crédits sans auth
  if (!session) {
    // Pendant le chargement initial, on montre le skeleton pour éviter le flash
    const isLoading = session === undefined;
    if (isLoading) return <CreditsSkeleton />;
    return (
      <div className="min-h-screen bg-parchemin flex items-center justify-center">
        <div className="text-center">
          <p className="text-olive mb-4">Connectez-vous pour gérer vos crédits.</p>
          <Link href="/signin" className="text-savane font-medium hover:underline">Se connecter</Link>
        </div>
      </div>
    );
  }

  if (me === undefined) return <CreditsSkeleton />;

  async function handleBuy(packId: PackId) {
    setLoading(packId);
    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json() as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        toast.error(data.error ?? "Erreur lors de l'initialisation du paiement");
        return;
      }
      router.push(data.checkoutUrl);
    } catch (err) {
      console.error("[credits] handleBuy error:", err);
      toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-parchemin">
      <div className="max-w-[900px] mx-auto px-6 py-12">

        {/* Solde */}
        <motion.div
          className="bg-white rounded-2xl border border-bordure p-6 mb-8 flex items-center justify-between"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <p className="text-[13px] text-olive mb-1">Votre solde</p>
            <motion.p
              className="font-serif text-[40px] font-medium text-noir leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {me?.creditsBalance ?? "—"}
              <span className="text-[18px] text-olive ml-2">crédits</span>
            </motion.p>
          </div>
          <Link
            href="/"
            className="h-10 px-4 rounded-lg bg-savane text-white text-[14px] font-medium hover:bg-savane/90 transition-colors flex items-center"
          >
            Lancer un audit
          </Link>
        </motion.div>

        {/* Packs */}
        <h2 className="font-serif text-[22px] font-medium text-noir mb-4">Acheter des crédits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {PACK_LIST.map((pack, index) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, boxShadow: "rgba(0,0,0,0.08) 0px 10px 28px", transition: { duration: 0.2 } }}
              className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 ${
                pack.highlight ? "border-savane ring-1 ring-savane/20" : "border-bordure"
              }`}
            >
              {pack.highlight && (
                <span className="text-[11px] font-semibold text-savane tracking-wider uppercase">
                  Populaire
                </span>
              )}
              <div>
                <p className="font-semibold text-[16px] text-charbon">{pack.label}</p>
                <p className="text-[13px] text-olive mt-0.5">{pack.description}</p>
              </div>
              <div>
                <p className="font-serif text-[28px] font-medium text-noir leading-none">
                  {pack.credits}
                  <span className="text-[14px] text-olive ml-1">crédits</span>
                </p>
                <p className="text-[13px] text-pierre mt-0.5">
                  {pack.price.toLocaleString("fr-FR")} XOF
                  {" · "}
                  {Math.round(pack.price / pack.credits).toLocaleString("fr-FR")} XOF/crédit
                </p>
              </div>
              <motion.button
                onClick={() => handleBuy(pack.id as PackId)}
                disabled={loading === pack.id}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1 }}
                className={`w-full h-9 rounded-lg text-[13px] font-medium transition-colors ${
                  pack.highlight
                    ? "bg-savane text-white hover:bg-savane/90"
                    : "bg-parchemin text-charbon hover:bg-savane/10 border border-bordure"
                } disabled:opacity-50`}
              >
                {loading === pack.id ? "Redirection…" : "Acheter"}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Historique */}
        {history && history.length > 0 && (
          <>
            <h2 className="font-serif text-[20px] font-medium text-noir mb-3">Historique</h2>
            <div className="bg-white rounded-2xl border border-bordure divide-y divide-bordure overflow-hidden">
              {(history as Array<{ _id: string; description: string; createdAt: number; amount: number }>).map((tx) => (
                <div key={tx._id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-[14px] text-charbon">{tx.description}</p>
                    <p className="text-[12px] text-pierre">
                      {new Date(tx.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span
                    className={`text-[15px] font-semibold ${
                      tx.amount > 0 ? "text-[#2d7a4f]" : "text-[#b53333]"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}{tx.amount} cr.
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
