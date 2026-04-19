"use client";

import { useState } from "react";
import { FilePdf, CircleNotch } from "@phosphor-icons/react";

export function ExportPdfButton({ hostname }: { hostname: string }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const el = document.getElementById("rapport-content");
      if (!el) return;

      // Capture at 2x for retina quality
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f5f4ed",
        logging: false,
        // Ignore the export button itself
        ignoreElements: (node) => node.id === "export-pdf-btn",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = pdfW / (imgW / 2); // divide by scale factor
      const totalH = (imgH / 2) * ratio;

      // Paginate
      let yOffset = 0;
      while (yOffset < totalH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -yOffset, pdfW, totalH);
        yOffset += pdfH;
      }

      pdf.save(`audit-${hostname}-vitrinai.pdf`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      id="export-pdf-btn"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-white border border-bordure text-charbon text-[13px] font-medium px-4 py-2.5 rounded-xl hover:bg-parchemin hover:border-savane/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <CircleNotch size={15} className="animate-spin text-savane" />
      ) : (
        <FilePdf size={15} weight="duotone" className="text-savane" />
      )}
      {loading ? "Génération…" : "Télécharger PDF"}
    </button>
  );
}
