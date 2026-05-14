"use client";

import { useState } from "react";
import { FilePdf } from "@phosphor-icons/react";
import { generateAuditPdf } from "@/lib/rapport/pdf-generator";
import type { AuditDetails, AuditScores, Recommandation } from "@/lib/audit/types";
import type { ReportThemeConfig } from "@/lib/report-themes";

interface Props {
  hostname: string;
  url: string;
  scores: AuditScores;
  details: AuditDetails;
  recommandations: Recommandation[];
  theme?: ReportThemeConfig;
}

export function ExportPdfButton({ hostname, url, scores, details, recommandations, theme }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      await generateAuditPdf({ url, hostname, scores, details, recommandations, theme });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      id="export-pdf-btn"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-white border border-bordure text-charbon text-[13px] font-medium px-4 py-2.5 rounded-xl hover:bg-parchemin hover:border-savane/40 transition-colors disabled:opacity-60"
    >
      <FilePdf size={15} weight="duotone" className="text-savane" />
      {loading ? "Génération…" : "Télécharger PDF"}
    </button>
  );
}
