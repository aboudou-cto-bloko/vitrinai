"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Users } from "@phosphor-icons/react";

const COLUMNS = [
  { key: "nouveau", label: "Nouveau", color: "#87867f" },
  { key: "contacté", label: "Contacté", color: "#3898ec" },
  { key: "répondu", label: "Répondu", color: "#f59e0b" },
  { key: "rendez-vous", label: "Rendez-vous", color: "#9b59b6" },
  { key: "converti", label: "Converti", color: "#2d7a4f" },
] as const;

function KanbanColumn({ statut, label, color }: { statut: string; label: string; color: string }) {
  const leads = useQuery(api.leads.listByStatut, { statutOnboarding: statut }) ?? [];

  return (
    <div className="flex flex-col gap-3 min-w-[220px] w-[220px]">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[13px] font-semibold text-charbon">{label}</span>
        <span className="ml-auto text-[11px] text-pierre bg-sable px-2 py-0.5 rounded-full">{leads.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {leads.map((lead) => (
          <div
            key={lead._id}
            className="bg-white rounded-xl border border-bordure p-3.5 cursor-pointer hover:border-savane/40 hover:shadow-sm transition-all"
          >
            <p className="text-[13px] font-medium text-charbon mb-1 truncate">{lead.nom}</p>
            <p className="text-[11px] text-pierre">{lead.telephone}</p>
            {lead.scoreAudit != null && (
              <div className="mt-2 flex items-center gap-1">
                <div
                  className="h-1.5 rounded-full flex-1 bg-sable overflow-hidden"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${lead.scoreAudit}%`,
                      backgroundColor: lead.scoreAudit >= 70 ? "#2d7a4f" : lead.scoreAudit >= 40 ? "#f59e0b" : "#b53333",
                    }}
                  />
                </div>
                <span className="text-[10px] text-pierre">{lead.scoreAudit}</span>
              </div>
            )}
          </div>
        ))}
        {leads.length === 0 && (
          <div className="border-2 border-dashed border-bordure-forte rounded-xl p-4 text-center">
            <p className="text-[11px] text-argent">Aucun lead</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[20px] font-semibold text-charbon" style={{ fontFamily: "Georgia, serif" }}>
          Kanban de prospection
        </h2>
        <p className="text-[13px] text-pierre">Suivez l&apos;avancement de vos leads</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(({ key, label, color }) => (
          <KanbanColumn key={key} statut={key} label={label} color={color} />
        ))}
        <div className="flex flex-col gap-3 min-w-[220px] w-[220px]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-error" />
            <span className="text-[13px] font-semibold text-charbon">Refusé</span>
            <span className="ml-auto text-[11px] text-pierre bg-sable px-2 py-0.5 rounded-full">
              <RefusedCount />
            </span>
          </div>
          <RefusedColumn />
        </div>
      </div>
    </div>
  );
}

function RefusedCount() {
  const leads = useQuery(api.leads.listByStatut, { statutOnboarding: "refusé" }) ?? [];
  return <>{leads.length}</>;
}

function RefusedColumn() {
  const leads = useQuery(api.leads.listByStatut, { statutOnboarding: "refusé" }) ?? [];
  if (leads.length === 0) {
    return (
      <div className="border-2 border-dashed border-bordure-forte rounded-xl p-4 text-center">
        <p className="text-[11px] text-argent">Aucun lead</p>
      </div>
    );
  }
  return (
    <>
      {leads.map((lead) => (
        <div key={lead._id} className="bg-white rounded-xl border border-bordure p-3.5 opacity-60">
          <p className="text-[13px] font-medium text-charbon mb-1 truncate">{lead.nom}</p>
          <p className="text-[11px] text-pierre">{lead.telephone}</p>
        </div>
      ))}
    </>
  );
}
