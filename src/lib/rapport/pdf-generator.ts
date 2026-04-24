import type { AuditDetails, AuditScores, Recommandation, VitalsData, AofResult } from "@/lib/audit/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PdfAuditData {
  url: string;
  hostname: string;
  scores: AuditScores;
  details: AuditDetails;
  recommandations: Recommandation[];
}

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  noir:     [22, 20, 16],
  charbon:  [58, 56, 48],
  pierre:   [103, 101, 92],
  argent:   [135, 134, 127],
  sable:    [232, 230, 220],
  parchemin:[245, 243, 236],
  white:    [255, 255, 255],
  savane:   [196, 122, 58],
  success:  [45, 122, 79],
  warning:  [245, 158, 11],
  error:    [181, 51, 51],
};

type RGB = [number, number, number];

// ── Score helpers ─────────────────────────────────────────────────────────────
function gradeColor(grade: string): RGB {
  switch (grade) {
    case "A": return C.success as RGB;
    case "B": return [94, 158, 115];
    case "C": return C.warning as RGB;
    case "D": return [224, 123, 57];
    default:  return C.error as RGB;
  }
}

function scoreColor(pct: number): RGB {
  if (pct >= 70) return C.success as RGB;
  if (pct >= 40) return C.warning as RGB;
  return C.error as RGB;
}

function scoreLabel(pct: number): string {
  if (pct >= 80) return "Excellent";
  if (pct >= 60) return "Bien";
  if (pct >= 40) return "À améliorer";
  return "Problème";
}

// ── Layout constants ──────────────────────────────────────────────────────────
const PW = 210;   // page width mm
const PH = 297;   // page height mm
const ML = 18;    // margin left
const MR = 18;    // margin right
const CW = PW - ML - MR;  // content width

// ── Main generator ────────────────────────────────────────────────────────────
export async function generateAuditPdf(data: PdfAuditData): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let y = 0;

  // ── Helper methods ─────────────────────────────────────────────────────────
  const setColor = (rgb: RGB) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setFill = (rgb: RGB) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb: RGB) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

  function checkPageBreak(neededMm: number) {
    if (y + neededMm > PH - 15) {
      doc.addPage();
      y = 18;
    }
  }

  function drawRect(x: number, ry: number, w: number, h: number, fill: RGB, draw?: RGB) {
    setFill(fill);
    if (draw) { setDraw(draw); doc.roundedRect(x, ry, w, h, 2, 2, "FD"); }
    else { doc.roundedRect(x, ry, w, h, 2, 2, "F"); }
  }

  function text(
    str: string,
    x: number,
    ty: number,
    opts: { size?: number; bold?: boolean; color?: RGB; align?: "left" | "center" | "right"; maxWidth?: number } = {}
  ) {
    const { size = 10, bold = false, color = C.charbon as RGB, align = "left", maxWidth } = opts;
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    setColor(color);
    if (maxWidth) {
      const lines = doc.splitTextToSize(str, maxWidth);
      doc.text(lines, x, ty, { align });
    } else {
      doc.text(str, x, ty, { align });
    }
  }

  function textHeight(str: string, fontSize: number, maxWidth: number): number {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(str, maxWidth);
    return lines.length * (fontSize * 0.35) + (lines.length - 1) * 1;
  }

  function sectionTitle(title: string) {
    checkPageBreak(12);
    // Ligne colorée à gauche
    setFill(C.savane as RGB);
    doc.rect(ML, y, 3, 6, "F");
    text(title, ML + 6, y + 4.5, { size: 13, bold: true, color: C.charbon as RGB });
    y += 10;
    // Séparateur
    setDraw(C.sable as RGB);
    doc.setLineWidth(0.3);
    doc.line(ML, y, PW - MR, y);
    y += 5;
  }

  function scoreBar(x: number, barY: number, w: number, pct: number, color: RGB) {
    drawRect(x, barY, w, 3.5, C.sable as RGB);
    drawRect(x, barY, Math.max(4, w * pct / 100), 3.5, color);
  }

  function footer() {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      setFill(C.noir as RGB);
      doc.rect(0, PH - 10, PW, 10, "F");
      text("VitrinAI — Rapport de présence digitale", ML, PH - 4, { size: 7.5, color: C.argent as RGB });
      text(`Page ${i} / ${pages}`, PW - MR, PH - 4, { size: 7.5, color: C.argent as RGB, align: "right" });
      text(data.url, PW / 2, PH - 4, { size: 7, color: C.pierre as RGB, align: "center" });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COUVERTURE
  // ════════════════════════════════════════════════════════════════════════════
  setFill(C.noir as RGB);
  doc.rect(0, 0, PW, PH, "F");

  // Accent band
  setFill(C.savane as RGB);
  doc.rect(0, 0, 4, PH, "F");

  // VitrinAI
  text("VitrinAI", ML + 6, 22, { size: 18, bold: true, color: C.white as RGB });
  text("Rapport de présence digitale", ML + 6, 30, { size: 10, color: C.argent as RGB });

  // Divider
  setDraw(C.charbon as RGB);
  doc.setLineWidth(0.3);
  doc.line(ML + 6, 35, PW - MR, 35);

  // Site URL
  text(data.hostname, PW / 2, 60, { size: 22, bold: true, color: C.white as RGB, align: "center" });
  text(data.url, PW / 2, 68, { size: 9, color: C.argent as RGB, align: "center" });

  // Grade circle (drawn manually)
  const gColor = gradeColor(data.scores.grade);
  doc.setLineWidth(3);
  setDraw(gColor);
  doc.setFillColor(22, 20, 16);
  doc.circle(PW / 2, 105, 18, "FD");
  text(data.scores.grade, PW / 2, 109, { size: 26, bold: true, color: gColor, align: "center" });
  text(`${data.scores.global}/100`, PW / 2, 117, { size: 9, color: C.argent as RGB, align: "center" });

  // Score label
  const gLabel = data.scores.global >= 70 ? "Bonne présence digitale" : data.scores.global >= 45 ? "Présence à renforcer" : "Présence insuffisante";
  text(gLabel, PW / 2, 127, { size: 10, color: gColor, align: "center" });

  // 4 axis pills
  const axes = [
    { key: "technique", label: "Technique", max: 30 },
    { key: "seo", label: "SEO", max: 30 },
    { key: "presence", label: "Présence", max: 25 },
    { key: "ux", label: "Expérience", max: 15 },
  ] as const;
  const pillW = 38;
  const pillGap = 4;
  const pillsStart = (PW - (pillW * 4 + pillGap * 3)) / 2;

  axes.forEach(({ key, label, max }, i) => {
    const score = data.scores[key];
    const pct = Math.round((score / max) * 100);
    const col = scoreColor(pct);
    const px = pillsStart + i * (pillW + pillGap);
    drawRect(px, 138, pillW, 18, [30, 28, 24] as RGB);
    text(label, px + pillW / 2, 144.5, { size: 7, color: C.argent as RGB, align: "center" });
    text(`${score}/${max}`, px + pillW / 2, 150, { size: 9, bold: true, color: col, align: "center" });
  });

  // Date
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  text(`Généré le ${dateStr}`, PW / 2, 200, { size: 8, color: C.pierre as RGB, align: "center" });

  // Confidence note
  setFill([30, 28, 24] as RGB);
  doc.roundedRect(ML, 210, CW, 24, 2, 2, "F");
  text("À propos de ce rapport", ML + 8, 218, { size: 8, bold: true, color: C.savane as RGB });
  text(
    "Ce rapport analyse automatiquement la présence digitale de votre site. Il est basé sur des outils reconnus (Google Lighthouse, PageSpeed Insights) et une analyse de votre page d'accueil. Il ne remplace pas un audit réalisé par un professionnel mais donne une photographie fiable de votre situation actuelle.",
    ML + 8,
    224,
    { size: 7.5, color: C.argent as RGB, maxWidth: CW - 16 }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 2 — RÉSUMÉ & SCORES
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = 18;

  sectionTitle("Résumé de votre situation");

  // Résumé phrase
  const summaryText = buildSummary(data.scores, data.details);
  const sh = textHeight(summaryText, 10, CW);
  checkPageBreak(sh + 10);
  drawRect(ML, y, CW, sh + 8, C.parchemin as RGB);
  text(summaryText, ML + 6, y + 6, { size: 10, color: C.charbon as RGB, maxWidth: CW - 12 });
  y += sh + 14;

  // Axes
  sectionTitle("Vos 4 axes de performance");

  const axeDetails = [
    { key: "technique" as const, label: "Technique & Sécurité", max: 30, desc: "SSL, vitesse, compatibilité mobile, bonnes pratiques techniques." },
    { key: "seo" as const, label: "Référencement (SEO)", max: 30, desc: "Titre, description, structure, sitemap — ce qui détermine si Google vous trouve." },
    { key: "presence" as const, label: "Présence en ligne", max: 25, desc: "Réseaux sociaux, Google Maps, téléphone, email — votre visibilité locale." },
    { key: "ux" as const, label: "Expérience visiteur", max: 15, desc: "Accessibilité, contact facile, stabilité visuelle — ce que ressent votre visiteur." },
  ];

  axeDetails.forEach(({ key, label, max, desc }) => {
    checkPageBreak(28);
    const score = data.scores[key];
    const pct = Math.round((score / max) * 100);
    const col = scoreColor(pct);
    const sl = scoreLabel(pct);

    drawRect(ML, y, CW, 24, C.white as RGB, C.sable as RGB);

    // Label + score
    text(label, ML + 5, y + 7, { size: 10, bold: true, color: C.charbon as RGB });
    text(`${score}/${max}`, PW - MR - 5, y + 7, { size: 10, bold: true, color: col, align: "right" });

    // Status badge
    drawRect(ML + 5, y + 9.5, 22, 5, col);
    text(sl, ML + 16, y + 13.5, { size: 7, bold: true, color: C.white as RGB, align: "center" });

    // Bar
    scoreBar(ML + 32, y + 11, CW - 40, pct, col);

    // Desc
    text(desc, ML + 5, y + 20, { size: 8, color: C.pierre as RGB });
    y += 28;
  });

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 3 — WEB VITALS (si présents)
  // ════════════════════════════════════════════════════════════════════════════
  const vitals = data.details.vitals;
  if (vitals) {
    doc.addPage();
    y = 18;
    sectionTitle("Vitesse et expérience utilisateur");

    text(
      "Ces mesures reflètent ce que vivent vos visiteurs quand ils ouvrent votre site. Elles sont calculées par Google Lighthouse sur mobile.",
      ML, y, { size: 9, color: C.pierre as RGB, maxWidth: CW }
    );
    y += 10;

    renderVitals(doc, vitals, ML, y, CW);
    y += estimateVitalsHeight(vitals);

    // Page weight block
    if (vitals.totalByteWeightKb !== null || vitals.requestCount !== null) {
      checkPageBreak(30);
      y += 4;
      sectionTitle("Poids de la page");
      renderWeightBlock(doc, vitals, ML, y, CW, text, drawRect, scoreBar, scoreColor);
      y += 36;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 4 — AOF (si présent)
  // ════════════════════════════════════════════════════════════════════════════
  const aof = data.details.aof;
  if (aof) {
    doc.addPage();
    y = 18;
    sectionTitle("Votre site vu depuis l'Afrique de l'Ouest");

    text(
      "Google mesure les performances depuis l'Europe. Cette section simule ce que vit un visiteur à Dakar, Abidjan ou Lomé — sur mobile 4G standard.",
      ML, y, { size: 9, color: C.pierre as RGB, maxWidth: CW }
    );
    y += 10;

    renderAofSection(doc, aof, ML, y, CW, text, drawRect, scoreColor, scoreBar);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 5 — RECOMMANDATIONS
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = 18;
  sectionTitle("Vos priorités d'action");

  text(
    "Ces actions sont classées par ordre d'impact. Commencer par les premières vous donnera les meilleurs résultats le plus rapidement.",
    ML, y, { size: 9, color: C.pierre as RGB, maxWidth: CW }
  );
  y += 10;

  if (data.recommandations.length === 0) {
    text("Aucune recommandation prioritaire — votre site est bien configuré.", ML, y, {
      size: 10, color: C.success as RGB,
    });
  } else {
    const impactColors: Record<string, RGB> = {
      high: C.error as RGB,
      medium: C.warning as RGB,
      low: C.pierre as RGB,
    };
    const impactLabels: Record<string, string> = { high: "Impact fort", medium: "Impact moyen", low: "Impact faible" };
    const axeLabels: Record<string, string> = { technique: "Technique", seo: "SEO", presence: "Présence", ux: "Expérience" };

    data.recommandations.forEach((r, i) => {
      const ic = impactColors[r.impact];
      const il = impactLabels[r.impact];
      const al = axeLabels[r.axe];
      const descH = textHeight(r.description, 9, CW - 18);
      const blockH = descH + 22;
      checkPageBreak(blockH + 4);

      drawRect(ML, y, CW, blockH, C.white as RGB, C.sable as RGB);

      // Number
      drawRect(ML + 3, y + 3, 7, 7, ic);
      text(`${i + 1}`, ML + 6.5, y + 8.5, { size: 8, bold: true, color: C.white as RGB, align: "center" });

      // Title
      text(r.titre, ML + 13, y + 8.5, { size: 10, bold: true, color: C.charbon as RGB });

      // Badges
      drawRect(PW - MR - 40, y + 3, 20, 6, ic);
      text(il, PW - MR - 30, y + 7.5, { size: 7, bold: true, color: C.white as RGB, align: "center" });
      drawRect(PW - MR - 18, y + 3, 15, 6, C.sable as RGB);
      text(al, PW - MR - 10.5, y + 7.5, { size: 7, color: C.pierre as RGB, align: "center" });

      // Description
      text(r.description, ML + 13, y + 16, { size: 9, color: C.pierre as RGB, maxWidth: CW - 18 });

      y += blockH + 4;
    });
  }

  // ── AOF directives in recommendations page ─────────────────────────────────
  if (aof && aof.directives.length > 0) {
    checkPageBreak(12);
    y += 4;
    sectionTitle("Actions spécifiques Afrique de l'Ouest");

    const typeColors: Record<string, RGB> = {
      critique: C.error as RGB,
      warning: C.warning as RGB,
      info: [3, 105, 161] as RGB,
    };
    const typeLabels: Record<string, string> = { critique: "Problème", warning: "Attention", info: "Conseil" };

    aof.directives.forEach((d, i) => {
      const col = typeColors[d.type];
      const lbl = typeLabels[d.type];
      const bodyH = textHeight(d.corps, 9, CW - 16);
      const actionH = textHeight(d.action, 8.5, CW - 24);
      const blockH = bodyH + actionH + 26;
      checkPageBreak(blockH + 4);

      drawRect(ML, y, 3, blockH, col);
      drawRect(ML + 3, y, CW - 3, blockH, C.white as RGB, C.sable as RGB);

      // Badge + title
      drawRect(ML + 7, y + 3, 18, 5.5, col);
      text(lbl, ML + 16, y + 7.5, { size: 7, bold: true, color: C.white as RGB, align: "center" });
      text(d.titre, ML + 28, y + 7.5, { size: 10, bold: true, color: C.charbon as RGB });

      // Body
      text(d.corps, ML + 7, y + 14, { size: 9, color: C.charbon as RGB, maxWidth: CW - 16 });

      // Action
      const actionY = y + 14 + bodyH + 2;
      setFill([245, 243, 236] as RGB);
      doc.rect(ML + 7, actionY, CW - 14, actionH + 6, "F");
      text("Ce qu'il faut faire", ML + 10, actionY + 5, { size: 7.5, bold: true, color: col });
      text(d.action, ML + 10, actionY + 10, { size: 8.5, color: C.charbon as RGB, maxWidth: CW - 20 });

      y += blockH + 5;
      if (i < aof.directives.length - 1) checkPageBreak(10);
    });
  }

  // ── Footers ────────────────────────────────────────────────────────────────
  footer();

  // ── Save ───────────────────────────────────────────────────────────────────
  doc.save(`rapport-${data.hostname}-vitrinai.pdf`);
}

// ── Summary builder ────────────────────────────────────────────────────────────
function buildSummary(scores: AuditScores, details: AuditDetails): string {
  const g = scores.global;
  const intro = g >= 70
    ? `Votre site obtient la note ${scores.grade} avec ${g}/100. C'est une bonne base.`
    : g >= 45
      ? `Votre site obtient la note ${scores.grade} avec ${g}/100. Il y a des axes importants à améliorer.`
      : `Votre site obtient la note ${scores.grade} avec ${g}/100. Votre présence digitale est insuffisante et vous fait perdre des clients potentiels.`;

  const checks = details.technique.checks.concat(details.seo.checks, details.presence.checks, details.ux.checks);
  const fails = checks.filter((c) => c.status === "fail" && c.impact === "high").length;
  const warns = checks.filter((c) => c.status === "warn").length;

  const issues = fails > 0
    ? ` ${fails} problème${fails > 1 ? "s" : ""} critique${fails > 1 ? "s" : ""} ont été détectés`
    : "";
  const warnings = warns > 0
    ? ` et ${warns} point${warns > 1 ? "s" : ""} à améliorer`
    : "";

  const cta = fails > 0
    ? " Commencez par corriger les problèmes critiques — ce sont eux qui vous font le plus perdre de visiteurs."
    : warns > 0
      ? " Quelques améliorations peuvent significativement renforcer votre visibilité."
      : " Continuez à entretenir votre site.";

  return intro + (issues || warnings ? issues + warnings + "." : "") + cta;
}

// ── Vitals renderer ───────────────────────────────────────────────────────────
function renderVitals(
  doc: InstanceType<typeof import("jspdf").default>,
  vitals: VitalsData,
  x: number,
  startY: number,
  w: number
) {
  const items = [
    { key: "lcp" as const, titre: "Temps d'affichage principal", unit: "s", good: 2.5, poor: 4, convert: (v: number) => +(v / 1000).toFixed(2) },
    { key: "fcp" as const, titre: "Première apparition à l'écran", unit: "s", good: 1.8, poor: 3, convert: (v: number) => +(v / 1000).toFixed(2) },
    { key: "tbt" as const, titre: "Temps de blocage", unit: "ms", good: 200, poor: 600, convert: (v: number) => Math.round(v) },
    { key: "cls" as const, titre: "Stabilité de la page", unit: "", good: 0.1, poor: 0.25, convert: (v: number) => +v.toFixed(3) },
    { key: "ttfb" as const, titre: "Réactivité du serveur", unit: "ms", good: 200, poor: 600, convert: (v: number) => Math.round(v) },
  ];

  const expl: Record<string, (v: number, status: string) => string> = {
    lcp: (v, s) => s === "good" ? "Votre page s'affiche rapidement." : s === "needs-improvement" ? `${v}s — quelques secondes d'attente avant de voir le contenu principal.` : `${v}s — trop lent, la majorité des visiteurs partira avant.`,
    fcp: (v, s) => s === "good" ? "Votre page réagit vite." : s === "needs-improvement" ? `${v}s avant la première apparition à l'écran.` : `${v}s de page blanche — vos visiteurs pensent que le site est cassé.`,
    tbt: (v, s) => s === "good" ? "Votre page répond bien aux clics." : s === "needs-improvement" ? `${v}ms de blocage — la page peut sembler figée.` : `${v}ms bloqués — sur mobile, c'est insupportable.`,
    cls: (_v, s) => s === "good" ? "Les éléments restent bien en place." : s === "needs-improvement" ? "Certains éléments bougent légèrement pendant le chargement." : "Mise en page très instable — risque de clics involontaires.",
    ttfb: (v, s) => s === "good" ? "Votre serveur répond vite." : s === "needs-improvement" ? `${v}ms de délai serveur.` : `${v}ms — votre hébergement est trop lent.`,
  };

  let cy = startY;
  doc.setFontSize(9);

  items.forEach(({ key, titre, unit, good, poor, convert }) => {
    const raw = vitals[key];
    if (raw === null) return;
    const v = convert(raw as number);
    const pct = Math.min(100, Math.round((v / (poor * 1.2)) * 100));
    const status = v <= good ? "good" : v <= poor ? "needs-improvement" : "poor";
    const col = status === "good" ? C.success : status === "needs-improvement" ? C.warning : C.error;
    const sl = status === "good" ? "Bon" : status === "needs-improvement" ? "À améliorer" : "Problème";
    const ex = expl[key]?.(v, status) ?? "";

    const exH = Math.ceil(ex.length / 90) * 3.5 + 1;
    const blockH = 6 + 5 + exH + 5;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(C.sable[0], C.sable[1], C.sable[2]);
    doc.roundedRect(x, cy, w, blockH, 1.5, 1.5, "FD");

    // Title row
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(C.charbon[0], C.charbon[1], C.charbon[2]);
    doc.text(titre, x + 4, cy + 5.5);

    // Value + badge
    doc.setTextColor(col[0], col[1], col[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${v}${unit}`, x + w - 4, cy + 5.5, { align: "right" });

    doc.setFillColor(col[0], col[1], col[2]);
    const badgeW = sl.length * 1.6 + 4;
    doc.roundedRect(x + w - badgeW - 4 - 18, cy + 1.5, badgeW, 5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(sl, x + w - 4 - 18 - badgeW / 2, cy + 5.5, { align: "center" });

    // Bar
    const barX = x + 4;
    const barW = w - 8;
    doc.setFillColor(C.sable[0], C.sable[1], C.sable[2]);
    doc.roundedRect(barX, cy + 8.5, barW, 2.5, 0.8, 0.8, "F");
    doc.setFillColor(col[0], col[1], col[2]);
    doc.roundedRect(barX, cy + 8.5, Math.max(3, barW * pct / 100), 2.5, 0.8, 0.8, "F");

    // Explanation
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(C.pierre[0], C.pierre[1], C.pierre[2]);
    const exLines = doc.splitTextToSize(ex, w - 8);
    doc.text(exLines, x + 4, cy + 14);

    cy += blockH + 3;
  });
}

function estimateVitalsHeight(vitals: VitalsData): number {
  const keys = (["lcp", "fcp", "tbt", "cls", "ttfb"] as const).filter((k) => vitals[k] !== null);
  return keys.length * 30 + 10;
}

function renderWeightBlock(
  _doc: InstanceType<typeof import("jspdf").default>,
  vitals: VitalsData,
  x: number,
  startY: number,
  w: number,
  text: (str: string, x: number, y: number, opts?: Record<string, unknown>) => void,
  drawRect: (x: number, y: number, w: number, h: number, fill: RGB, draw?: RGB) => void,
  scoreBar: (x: number, y: number, w: number, pct: number, col: RGB) => void,
  scoreColorFn: (pct: number) => RGB,
) {
  let cy = startY;

  if (vitals.totalByteWeightKb !== null) {
    const kb = vitals.totalByteWeightKb;
    const pct = Math.min(100, Math.round((kb / 3000) * 100));
    const col = scoreColorFn(100 - pct);
    const label = kb >= 1024 ? `${(kb / 1024).toFixed(1)} Mo` : `${kb} Ko`;
    drawRect(x, cy, w, 14, C.white as RGB, C.sable as RGB);
    text(`Poids total : ${label}`, x + 4, cy + 5.5, { size: 9.5, bold: true });
    scoreBar(x + 4, cy + 8, w - 8, pct, col);
    cy += 18;
  }
  if (vitals.requestCount !== null) {
    const n = vitals.requestCount;
    const pct = Math.min(100, Math.round((n / 150) * 100));
    const col = scoreColorFn(100 - pct);
    drawRect(x, cy, w, 14, C.white as RGB, C.sable as RGB);
    text(`Nombre de requêtes : ${n}`, x + 4, cy + 5.5, { size: 9.5, bold: true });
    scoreBar(x + 4, cy + 8, w - 8, pct, col);
    cy += 18;
  }
}

function renderAofSection(
  _doc: InstanceType<typeof import("jspdf").default>,
  aof: AofResult,
  x: number,
  startY: number,
  w: number,
  text: (str: string, x: number, y: number, opts?: Record<string, unknown>) => void,
  drawRect: (x: number, y: number, w: number, h: number, fill: RGB, draw?: RGB) => void,
  scoreColorFn: (pct: number) => RGB,
  scoreBar: (x: number, y: number, w: number, pct: number, col: RGB) => void,
) {
  let cy = startY;

  // AOF score
  const aofCol = scoreColorFn(aof.aofScore);
  drawRect(x, cy, w, 14, C.white as RGB, C.sable as RGB);
  text(`Score AOF global : ${aof.aofScore}/100`, x + 4, cy + 5.5, { size: 10, bold: true });
  scoreBar(x + 4, cy + 8, w - 8, aof.aofScore, aofCol);
  cy += 18;

  // Tiles
  const tiles = [
    {
      label: "Chargement 4G",
      val: aof.estimatedLoad3G_ms !== null
        ? `~${(aof.estimatedLoad3G_ms / 1000).toFixed(1)}s`
        : "N/D",
      ok: aof.estimatedLoad3G_ms !== null ? aof.estimatedLoad3G_ms <= 5000 : null,
      expl: aof.estimatedLoad3G_ms === null ? "Non mesuré"
        : aof.estimatedLoad3G_ms <= 3000 ? "Rapide — vos clients n'attendent pas."
        : aof.estimatedLoad3G_ms <= 8000 ? "Lent — des visiteurs partiront avant l'affichage."
        : "Très lent — la majorité de vos visiteurs mobiles ne verra pas votre site.",
    },
    {
      label: "Poids page",
      val: aof.totalByteWeightKb !== null
        ? aof.totalByteWeightKb >= 1024 ? `${(aof.totalByteWeightKb / 1024).toFixed(1)} Mo` : `${aof.totalByteWeightKb} Ko`
        : "N/D",
      ok: aof.totalByteWeightKb !== null ? aof.totalByteWeightKb <= 500 : null,
      expl: aof.totalByteWeightKb === null ? "Non mesuré"
        : aof.totalByteWeightKb <= 500 ? "Léger — idéal pour les connexions mobiles."
        : aof.totalByteWeightKb <= 1500 ? "Lourd pour un forfait mobile limité."
        : "Trop lourd — beaucoup de visiteurs ne verront jamais votre contenu.",
    },
    {
      label: "CDN",
      val: aof.cdnProvider ?? "Absent",
      ok: aof.hasCDN,
      expl: aof.hasCDN
        ? `Actif via ${aof.cdnProvider}. Vos ressources arrivent plus vite chez vos visiteurs.`
        : "Absent. Vos fichiers viennent d'un serveur en Europe — 150 à 400 ms de délai supplémentaire.",
    },
    {
      label: "Mode hors-ligne",
      val: aof.hasServiceWorker ? "Disponible" : "Absent",
      ok: aof.hasServiceWorker,
      expl: aof.hasServiceWorker
        ? "Votre site reste accessible même lors d'une coupure réseau."
        : "En cas de coupure réseau (fréquent en AOF), votre site devient totalement inaccessible.",
    },
  ];

  const tileW = (w - 9) / 2;
  tiles.forEach((t, i) => {
    const tx = x + (i % 2) * (tileW + 3);
    const ty = cy + Math.floor(i / 2) * 28;
    const col = t.ok === null ? C.pierre as RGB : t.ok ? C.success as RGB : C.error as RGB;

    drawRect(tx, ty, tileW, 24, C.white as RGB, C.sable as RGB);
    text(t.label, tx + 4, ty + 5.5, { size: 7.5, color: C.pierre as RGB });
    text(t.val, tx + 4, ty + 11, { size: 10, bold: true, color: col });
    text(t.expl, tx + 4, ty + 17, { size: 7.5, color: C.pierre as RGB, maxWidth: tileW - 8 });
  });
  cy += 60;
  return cy;
}
