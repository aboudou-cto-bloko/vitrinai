"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { motion } from "motion/react";

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-50 text-emerald-700 border-emerald-200",
  B: "bg-green-50 text-green-700 border-green-200",
  C: "bg-yellow-50 text-yellow-700 border-yellow-200",
  D: "bg-orange-50 text-orange-700 border-orange-200",
  E: "bg-red-50 text-red-700 border-red-200",
  F: "bg-red-100 text-red-800 border-red-300",
};

export default function AnalysesPage() {
  const { data: session } = useSession();
  const audits = useQuery(api.audits.getMyAudits);

  if (!session) {
    return (
      <div className="min-h-screen bg-parchemin flex items-center justify-center">
        <div className="text-center">
          <p className="text-olive mb-4">Connectez-vous pour voir votre historique d&apos;analyses.</p>
          <Link href="/signin" className="text-savane font-medium hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const done = audits?.filter((a) => a.statut === "terminé") ?? [];
  const pending = audits?.filter((a) => a.statut === "en_cours") ?? [];

  return (
    <div className="min-h-screen bg-parchemin">
      <div className="max-w-[860px] mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[28px] font-medium text-noir mb-1">
              Mes analyses
            </h1>
            <p className="text-[14px] text-olive">
              {audits === undefined
                ? "Chargement…"
                : `${audits.length} analyse${audits.length !== 1 ? "s" : ""} au total`}
            </p>
          </div>
          <Link
            href="/"
            className="h-10 px-4 rounded-lg bg-savane text-white text-[14px] font-medium hover:bg-savane/90 transition-colors flex items-center"
          >
            Nouvelle analyse
          </Link>
        </div>

        {audits === undefined && (
          <div className="bg-white rounded-2xl border border-bordure divide-y divide-bordure overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="px-5 py-4 flex items-center gap-4 animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-sable shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-sable rounded w-52" />
                  <div className="h-2.5 bg-sable rounded w-28" />
                </div>
                <div className="space-y-1.5 text-right shrink-0">
                  <div className="h-4 bg-sable rounded w-14" />
                  <div className="h-2.5 bg-sable rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {audits !== undefined && audits.length === 0 && (
          <div className="bg-white rounded-2xl border border-bordure p-10 text-center">
            <p className="text-[15px] font-medium text-charbon mb-1">Aucune analyse pour l&apos;instant</p>
            <p className="text-[13px] text-pierre mb-5">
              Lancez votre première analyse depuis la page d&apos;accueil.
            </p>
            <Link
              href="/"
              className="inline-flex items-center h-9 px-4 rounded-lg bg-savane text-white text-[13px] font-medium hover:bg-savane/90 transition-colors"
            >
              Analyser un site
            </Link>
          </div>
        )}

        {pending.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[13px] font-medium text-pierre uppercase tracking-wider mb-3">
              En cours
            </h2>
            <div className="bg-white rounded-2xl border border-bordure divide-y divide-bordure overflow-hidden">
              {pending.map((audit) => (
                <div key={audit._id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-parchemin flex items-center justify-center shrink-0">
                    <span className="text-[18px] animate-spin inline-block">⏳</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-charbon truncate">{audit.url}</p>
                    <p className="text-[12px] text-pierre">
                      {new Date(audit.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="text-[12px] text-olive bg-sable px-2.5 py-1 rounded-full shrink-0">
                    En cours…
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {done.length > 0 && (
          <div>
            {pending.length > 0 && (
              <h2 className="text-[13px] font-medium text-pierre uppercase tracking-wider mb-3">
                Terminées
              </h2>
            )}
            <div className="bg-white rounded-2xl border border-bordure divide-y divide-bordure overflow-hidden">
              {done.map((audit, idx) => {
                const grade = audit.scores?.grade ?? null;
                const score = audit.scores?.global ?? null;
                const gradeClass = grade ? (GRADE_COLORS[grade] ?? GRADE_COLORS["F"]) : "";

                return (
                  <motion.div
                    key={audit._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={`/rapport/${audit._id}`}
                      className="px-5 py-4 flex items-center gap-4 hover:bg-parchemin/50 transition-colors"
                    >
                      {/* Score badge */}
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${gradeClass}`}>
                        <span className="text-[15px] font-bold">{grade ?? "—"}</span>
                      </div>

                      {/* URL + date */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-charbon truncate">{audit.url}</p>
                        <p className="text-[12px] text-pierre">
                          {new Date(audit.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <p className="text-[15px] font-semibold text-charbon">
                          {score !== null ? `${score}/100` : "—"}
                        </p>
                        <p className="text-[11px] text-pierre">score global</p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
