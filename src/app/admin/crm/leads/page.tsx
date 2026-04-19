"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Users, Globe, PhoneCall, WhatsappLogo, EnvelopeSimple } from "@phosphor-icons/react";

const STATUT_COLORS: Record<string, string> = {
  nouveau: "#87867f",
  contacté: "#3898ec",
  répondu: "#f59e0b",
  "rendez-vous": "#9b59b6",
  converti: "#2d7a4f",
  refusé: "#b53333",
};

export default function LeadsPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.leads.listAll,
    {},
    { initialNumItems: 30 }
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[20px] font-semibold text-charbon" style={{ fontFamily: "Georgia, serif" }}>
          Leads
        </h2>
        <p className="text-[13px] text-pierre">{results.length} lead{results.length !== 1 ? "s" : ""} chargé{results.length !== 1 ? "s" : ""}</p>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-bordure p-12 text-center">
          <Users size={40} weight="duotone" className="text-argent mx-auto mb-3" />
          <p className="text-[14px] text-pierre">
            Aucun lead pour l&apos;instant. Créez une niche et lancez le scraping pour détecter des prospects.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-bordure overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-bordure bg-parchemin">
                  <th className="text-left px-5 py-3 text-pierre font-medium">Entreprise</th>
                  <th className="text-left px-5 py-3 text-pierre font-medium">Téléphone</th>
                  <th className="text-left px-5 py-3 text-pierre font-medium">Site web</th>
                  <th className="text-left px-5 py-3 text-pierre font-medium">Score</th>
                  <th className="text-left px-5 py-3 text-pierre font-medium">Contact</th>
                  <th className="text-left px-5 py-3 text-pierre font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {results.map((lead) => (
                  <tr key={lead._id} className="border-b border-bordure last:border-0 hover:bg-parchemin/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-charbon">{lead.nom}</td>
                    <td className="px-5 py-3.5 text-pierre">
                      <a href={`tel:${lead.telephone}`} className="flex items-center gap-1.5 hover:text-savane transition-colors">
                        <PhoneCall size={13} />
                        {lead.telephone}
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.siteWeb ? (
                        <a href={lead.siteWeb} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-savane hover:underline">
                          <Globe size={13} />
                          {new URL(lead.siteWeb).hostname}
                        </a>
                      ) : (
                        <span className="text-argent">— sans site</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.scoreAudit != null ? (
                        <span className="font-semibold text-charbon">{lead.scoreAudit}<span className="text-argent font-normal">/100</span></span>
                      ) : (
                        <span className="text-argent">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {lead.whatsappEnvoye && <WhatsappLogo size={15} className="text-success" weight="fill" />}
                        {lead.emailEnvoye && <EnvelopeSimple size={15} className="text-savane" weight="fill" />}
                        {!lead.whatsappEnvoye && !lead.emailEnvoye && <span className="text-argent">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-block text-[11px] font-medium px-2.5 py-1 rounded-full capitalize"
                        style={{
                          color: STATUT_COLORS[lead.statutOnboarding] ?? "#87867f",
                          backgroundColor: `${STATUT_COLORS[lead.statutOnboarding] ?? "#87867f"}18`,
                        }}
                      >
                        {lead.statutOnboarding}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {status === "CanLoadMore" && (
            <button
              onClick={() => loadMore(30)}
              className="self-center text-[13px] text-savane hover:underline"
            >
              Charger plus
            </button>
          )}
        </>
      )}
    </div>
  );
}
