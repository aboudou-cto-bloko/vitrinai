"use client";

import { FilePdf } from "@phosphor-icons/react";

export function ExportPdfButton({ hostname }: { hostname: string }) {
  function handleExport() {
    // Set document title for the PDF filename hint
    const prev = document.title;
    document.title = `audit-${hostname}-vitrinai`;
    window.print();
    document.title = prev;
  }

  return (
    <button
      id="export-pdf-btn"
      onClick={handleExport}
      className="inline-flex items-center gap-2 bg-white border border-bordure text-charbon text-[13px] font-medium px-4 py-2.5 rounded-xl hover:bg-parchemin hover:border-savane/40 transition-colors"
    >
      <FilePdf size={15} weight="duotone" className="text-savane" />
      Télécharger PDF
    </button>
  );
}
