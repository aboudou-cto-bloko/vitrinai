import type { AuditDetails, AuditScores, Recommandation, VitalsData, AofResult } from "@/lib/audit/types";
import { resolveTheme, DEFAULT_THEME } from "@/lib/report-themes";
import type { ReportThemeConfig } from "@/lib/report-themes";

interface PdfAuditData {
  url: string;
  hostname: string;
  scores: AuditScores;
  details: AuditDetails;
  recommandations: Recommandation[];
  theme?: ReportThemeConfig;
}

// ── Palette (minimal — used sparingly) ────────────────────────────────────────
type RGB = [number, number, number];

const C = {
  ink:      [18, 18, 18]   as RGB,
  body:     [48, 48, 48]   as RGB,
  muted:    [110, 110, 110] as RGB,
  rule:     [210, 210, 210] as RGB,
  hairline: [230, 230, 230] as RGB,
  white:    [255, 255, 255] as RGB,
  accent:   [196, 122, 58]  as RGB,
  success:  [34, 110, 66]   as RGB,
  warning:  [180, 110, 10]  as RGB,
  error:    [170, 40, 40]   as RGB,
};

function gradeColor(grade: string): RGB {
  switch (grade) {
    case "A": return C.success;
    case "B": return [60, 130, 90] as RGB;
    case "C": return C.warning;
    case "D": return [190, 100, 30] as RGB;
    default:  return C.error;
  }
}

function metricColor(status: "good" | "needs-improvement" | "poor"): RGB {
  if (status === "good") return C.success;
  if (status === "needs-improvement") return C.warning;
  return C.error;
}

function scoreColor(pct: number): RGB {
  if (pct >= 70) return C.success;
  if (pct >= 40) return C.warning;
  return C.error;
}

// ── Layout ────────────────────────────────────────────────────────────────────
const PW = 210;
const PH = 297;
const ML = 22;
const MR = 22;
const CW = PW - ML - MR;
const FOOTER_H = 12;

// ── Generator ─────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export async function generateAuditPdf(data: PdfAuditData): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const themeConfig = data.theme ?? DEFAULT_THEME;
  const themeStyles = resolveTheme(themeConfig);
  const accentRgb = hexToRgb(themeStyles.accent);
  const headerBgRgb = hexToRgb(themeStyles.headerBg);
  const headerFgRgb = hexToRgb(themeStyles.headerFg);
  const headerSubRgb: RGB = [
    Math.round(headerFgRgb[0] * 0.65 + headerBgRgb[0] * 0.35),
    Math.round(headerFgRgb[1] * 0.65 + headerBgRgb[1] * 0.35),
    Math.round(headerFgRgb[2] * 0.65 + headerBgRgb[2] * 0.35),
  ];
  const brandLabel = themeStyles.brandLabel;

  // Override accent in the palette with the resolved theme accent
  C.accent = accentRgb;

  let y = 0;

  // ── Primitives ────────────────────────────────────────────────────────────
  function setFill(c: RGB)  { doc.setFillColor(c[0], c[1], c[2]); }
  function setDraw(c: RGB)  { doc.setDrawColor(c[0], c[1], c[2]); }
  function setColor(c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }

  function t(
    str: string,
    x: number,
    ty: number,
    {
      size = 9.5,
      bold = false,
      color = C.body,
      align = "left" as "left" | "center" | "right",
      maxW,
    }: { size?: number; bold?: boolean; color?: RGB; align?: "left" | "center" | "right"; maxW?: number } = {}
  ) {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    setColor(color);
    if (maxW) {
      const lines = doc.splitTextToSize(str, maxW);
      doc.text(lines, x, ty, { align });
    } else {
      doc.text(str, x, ty, { align });
    }
  }

  function lineHeight(str: string, size: number, maxW: number): number {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(str, maxW);
    return lines.length * size * 0.353 + (lines.length - 1) * 1.2;
  }

  function rule(rx: number, ry: number, rw: number, color = C.hairline, lw = 0.2) {
    doc.setLineWidth(lw);
    setDraw(color);
    doc.line(rx, ry, rx + rw, ry);
  }

  function thickRule(rx: number, ry: number, rw: number) {
    setFill(C.accent);
    doc.rect(rx, ry, rw, 0.6, "F");
  }

  function pageBreakCheck(needed: number) {
    if (y + needed > PH - FOOTER_H - 6) {
      doc.addPage();
      y = 20;
    }
  }

  // ── Section heading ────────────────────────────────────────────────────────
  function section(title: string, sub?: string) {
    pageBreakCheck(14);
    t(title.toUpperCase(), ML, y, { size: 9, bold: true, color: C.muted });
    y += 3;
    rule(ML, y, CW, C.rule, 0.4);
    y += 5;
    if (sub) {
      t(sub, ML, y, { size: 9, color: C.muted, maxW: CW });
      y += lineHeight(sub, 9, CW) + 4;
    }
  }

  // ── Metric row ─────────────────────────────────────────────────────────────
  // label left, value right, thin bottom rule
  function metricRow(
    label: string,
    value: string,
    valueColor: RGB = C.body,
    sublabel?: string,
    barPct?: number,
    barColor?: RGB,
  ) {
    pageBreakCheck(12);
    t(label, ML, y, { size: 9.5, color: C.body });
    t(value, PW - MR, y, { size: 9.5, bold: true, color: valueColor, align: "right" });
    if (sublabel) {
      y += 4;
      t(sublabel, ML, y, { size: 8, color: C.muted, maxW: CW * 0.8 });
    }
    if (barPct !== undefined && barColor) {
      y += 4;
      // track
      setFill(C.hairline);
      doc.rect(ML, y, CW, 1.5, "F");
      // fill
      setFill(barColor);
      doc.rect(ML, y, Math.max(2, CW * barPct / 100), 1.5, "F");
      y += 3;
    }
    y += 4;
    rule(ML, y, CW);
    y += 4;
  }

  // ── Footers (rendered last) ───────────────────────────────────────────────
  function renderFooters() {
    const pages = doc.getNumberOfPages();
    const dateStr = new Date().toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      rule(ML, PH - FOOTER_H, CW, C.rule, 0.3);
      t("VitrinAI", ML, PH - FOOTER_H + 5, { size: 7.5, bold: true, color: C.accent });
      t(data.url, ML + 18, PH - FOOTER_H + 5, { size: 7.5, color: C.muted });
      t(`${dateStr}  ·  Page ${i} / ${pages}`, PW - MR, PH - FOOTER_H + 5, {
        size: 7.5, color: C.muted, align: "right",
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════════════════════════════════════════
  y = 0;

  // Header strip
  setFill(headerBgRgb);
  doc.rect(0, 0, PW, 18, "F");

  // Brand
  const brandLabelW = brandLabel.length * 2.2 + 4;
  t(brandLabel, ML, 11, { size: 11, bold: true, color: headerFgRgb });
  t("Rapport de présence digitale", ML + brandLabelW, 11, { size: 8.5, color: headerSubRgb });

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  t(dateStr, PW - MR, 11, { size: 8.5, color: C.muted, align: "right" });

  // Site name
  y = 46;
  const hostname = data.hostname;
  t(hostname, ML, y, { size: 26, bold: true, color: C.ink });
  y += 7;
  t(data.url, ML, y, { size: 9, color: C.muted });
  y += 7;
  if (themeConfig.preset === "brand" && themeConfig.companyName) {
    t(`Préparé par ${themeConfig.companyName}`, ML, y, { size: 9, bold: true, color: accentRgb });
    y += 6;
  }
  y += 5;
  rule(ML, y, CW, C.hairline, 0.3);
  y += 10;

  // Grade + global score — large, clean
  const gc = gradeColor(data.scores.grade);
  const gradeLabel: Record<string, string> = { A: "Excellent", B: "Bon", C: "À améliorer", D: "Insuffisant", F: "Critique" };

  t(data.scores.grade, ML, y + 20, { size: 52, bold: true, color: gc });
  t(`${data.scores.global}`, ML + 28, y + 14, { size: 22, bold: true, color: gc });
  t("/ 100", ML + 28, y + 20, { size: 11, color: C.muted });
  t(gradeLabel[data.scores.grade] ?? data.scores.grade, ML + 28, y + 27, {
    size: 10, bold: true, color: gc,
  });

  y += 36;
  rule(ML, y, CW, C.hairline, 0.3);
  y += 10;

  // 4 axes — simple 2×2 grid with lines
  const axes = [
    { key: "technique" as const, label: "Technique & Sécurité", max: 30 },
    { key: "seo"       as const, label: "Référencement (SEO)",   max: 30 },
    { key: "presence"  as const, label: "Présence en ligne",     max: 25 },
    { key: "ux"        as const, label: "Expérience visiteur",   max: 15 },
  ];

  const colW = CW / 2 - 4;
  axes.forEach(({ key, label, max }, i) => {
    const score = data.scores[key];
    const pct = Math.round((score / max) * 100);
    const col = scoreColor(pct);
    const ax = i % 2 === 0 ? ML : ML + colW + 8;
    const ay = y + Math.floor(i / 2) * 22;

    t(label, ax, ay, { size: 8.5, color: C.muted });
    t(`${score}/${max}`, ax + colW, ay, { size: 9.5, bold: true, color: col, align: "right" });

    // thin bar
    setFill(C.hairline);
    doc.rect(ax, ay + 3, colW, 1.5, "F");
    setFill(col);
    doc.rect(ax, ay + 3, Math.max(2, colW * pct / 100), 1.5, "F");

    rule(ax, ay + 8, colW, C.hairline);
  });
  y += 54;

  // Reference + disclaimer
  const ref = `REF-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${data.hostname.replace(/\./g, "").toUpperCase().slice(0, 8)}`;
  t(`Référence : ${ref}`, ML, y, { size: 8, color: C.muted });
  y += 10;

  const disclaimer = "Ce rapport est généré automatiquement à partir d'une analyse technique de votre page d'accueil (Google Lighthouse, PageSpeed Insights, vérifications HTTP). Il constitue une photographie de votre présence digitale à la date d'émission et ne se substitue pas à un audit réalisé par un professionnel.";
  rule(ML, y, CW, C.hairline, 0.2);
  y += 6;
  t(disclaimer, ML, y, { size: 7.5, color: C.muted, maxW: CW });

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 2 — RÉSUMÉ & AXES
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = 20;

  section("Résumé exécutif");

  const summary = buildSummary(data.scores, data.details);
  t(summary, ML, y, { size: 9.5, color: C.body, maxW: CW });
  y += lineHeight(summary, 9.5, CW) + 10;

  section("Performance par axe");

  const axeDetails = [
    { key: "technique" as const, label: "Technique & Sécurité", max: 30,
      desc: "SSL, vitesse de chargement, compatibilité mobile, en-têtes de sécurité." },
    { key: "seo" as const, label: "Référencement (SEO)", max: 30,
      desc: "Titre, méta-description, structure HTML, sitemap, robots." },
    { key: "presence" as const, label: "Présence en ligne", max: 25,
      desc: "Réseaux sociaux, Google Maps, coordonnées, visibilité locale." },
    { key: "ux" as const, label: "Expérience visiteur", max: 15,
      desc: "Accessibilité, contact visible, stabilité de la mise en page." },
  ];

  axeDetails.forEach(({ key, label, max, desc }) => {
    const score = data.scores[key];
    const pct = Math.round((score / max) * 100);
    const col = scoreColor(pct);
    const status = pct >= 70 ? "Bon" : pct >= 40 ? "À améliorer" : "Insuffisant";
    metricRow(`${label}  —  ${desc}`, `${score} / ${max}  ·  ${status}`, col, undefined, pct, col);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 3 — WEB VITALS
  // ════════════════════════════════════════════════════════════════════════════
  const vitals = data.details.vitals;
  if (vitals) {
    doc.addPage();
    y = 20;

    section(
      "Vitesse et expérience utilisateur",
      "Mesures Google Lighthouse sur mobile. Ces chiffres reflètent ce que vit un visiteur réel.",
    );

    renderVitalsSection(vitals);

    if (vitals.totalByteWeightKb !== null || vitals.requestCount !== null) {
      pageBreakCheck(24);
      y += 4;
      section("Poids de la page");

      if (vitals.totalByteWeightKb !== null) {
        const kb = vitals.totalByteWeightKb;
        const pct = Math.min(100, Math.round((kb / 3000) * 100));
        const col = scoreColor(100 - pct);
        const label = kb >= 1024 ? `${(kb / 1024).toFixed(1)} Mo` : `${kb} Ko`;
        const expl = kb <= 500 ? "Léger — bon pour les connexions mobiles."
          : kb <= 1500 ? "Acceptable. Des optimisations restent possibles."
          : "Trop lourd — beaucoup de visiteurs partiront avant l'affichage complet.";
        metricRow("Poids total de la page", label, col, expl, pct, col);
      }

      if (vitals.requestCount !== null) {
        const n = vitals.requestCount;
        const pct = Math.min(100, Math.round((n / 150) * 100));
        const col = scoreColor(100 - pct);
        const expl = n <= 40 ? "Nombre raisonnable de ressources."
          : n <= 80 ? "Assez élevé. Certains fichiers pourraient être regroupés."
          : "Trop de ressources — chaque requête ajoute du délai.";
        metricRow("Nombre de requêtes", `${n}`, col, expl, pct, col);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 4 — AOF
  // ════════════════════════════════════════════════════════════════════════════
  const aof = data.details.aof;
  if (aof) {
    doc.addPage();
    y = 20;

    section(
      "Performance depuis l'Afrique de l'Ouest",
      "Simulation 4G mobile depuis Dakar, Abidjan ou Lomé. Les mesures standard (Google) sont calculées depuis l'Europe.",
    );

    const aofCol = scoreColor(aof.aofScore);
    metricRow("Score AOF global", `${aof.aofScore} / 100`, aofCol, undefined, aof.aofScore, aofCol);

    if (aof.estimatedLoad3G_ms !== null) {
      const ms = aof.estimatedLoad3G_ms;
      const col = ms <= 3000 ? C.success : ms <= 8000 ? C.warning : C.error;
      const expl = ms <= 3000 ? "Rapide — vos visiteurs n'attendent pas."
        : ms <= 8000 ? "Lent — certains visiteurs partiront avant le chargement."
        : "Très lent — la majorité des visiteurs mobiles ne verra pas votre site.";
      metricRow("Temps de chargement 4G estimé", `~${(ms / 1000).toFixed(1)} s`, col, expl);
    }

    if (aof.totalByteWeightKb !== null) {
      const kb = aof.totalByteWeightKb;
      const col = kb <= 500 ? C.success : kb <= 1500 ? C.warning : C.error;
      const label = kb >= 1024 ? `${(kb / 1024).toFixed(1)} Mo` : `${kb} Ko`;
      const expl = kb <= 500 ? "Léger — idéal pour les forfaits mobiles limités."
        : kb <= 1500 ? "Lourd pour un forfait mobile limité."
        : "Trop lourd — coûteux en data pour vos visiteurs.";
      metricRow("Poids de la page", label, col, expl);
    }

    const cdnCol = aof.hasCDN ? C.success : C.error;
    const cdnExpl = aof.hasCDN
      ? `Actif via ${aof.cdnProvider ?? "CDN détecté"}. Vos ressources arrivent plus vite.`
      : "Absent. Vos fichiers viennent d'un serveur en Europe (+150 à 400 ms).";
    metricRow("Réseau de diffusion (CDN)", aof.hasCDN ? (aof.cdnProvider ?? "Actif") : "Absent", cdnCol, cdnExpl);

    const swCol = aof.hasServiceWorker ? C.success : C.muted;
    const swExpl = aof.hasServiceWorker
      ? "Votre site reste accessible lors d'une coupure réseau."
      : "En cas de coupure réseau (fréquent en AOF), votre site devient totalement inaccessible.";
    metricRow("Mode hors-ligne (Service Worker)", aof.hasServiceWorker ? "Disponible" : "Absent", swCol, swExpl);

    // AOF directives
    if (aof.directives.length > 0) {
      y += 4;
      section("Actions spécifiques");
      renderDirectives(aof.directives);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE — RECOMMANDATIONS
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = 20;

  section(
    "Priorités d'action",
    "Classées par ordre d'impact. Traitez les éléments « Impact fort » en premier.",
  );

  if (data.recommandations.length === 0) {
    t("Aucune recommandation prioritaire — votre site est bien configuré.", ML, y, {
      size: 10, color: C.success,
    });
  } else {
    data.recommandations.forEach((r, i) => {
      const impactColor: Record<string, RGB> = {
        high: C.error, medium: C.warning, low: C.muted,
      };
      const impactLabel: Record<string, string> = {
        high: "Impact fort", medium: "Impact moyen", low: "Impact faible",
      };
      const axeLabel: Record<string, string> = {
        technique: "Technique", seo: "SEO", presence: "Présence", ux: "Expérience",
      };

      const ic = impactColor[r.impact] ?? C.muted;
      const il = impactLabel[r.impact] ?? r.impact;
      const al = axeLabel[r.axe] ?? r.axe;

      const descH = lineHeight(r.description, 9, CW - 12);
      const blockH = 7 + descH + 10;
      pageBreakCheck(blockH + 6);

      // Number dot (minimal — just text, colored)
      t(`${i + 1}.`, ML, y + 5, { size: 9, bold: true, color: ic });

      // Title + tags
      t(r.titre, ML + 8, y + 5, { size: 10, bold: true, color: C.ink });
      t(`${il}  ·  ${al}`, PW - MR, y + 5, { size: 8, color: ic, align: "right" });

      y += 8;

      // Description
      t(r.description, ML + 8, y, { size: 9, color: C.muted, maxW: CW - 10 });
      y += descH + 6;

      rule(ML, y, CW);
      y += 5;
    });
  }

  // ── Footers ────────────────────────────────────────────────────────────────
  renderFooters();

  // ── Save ───────────────────────────────────────────────────────────────────
  doc.save(`rapport-${data.hostname}-vitrinai.pdf`);

  // ── Inner renderers ────────────────────────────────────────────────────────

  function renderVitalsSection(v: VitalsData) {
    const items = [
      {
        key: "lcp" as const,
        label: "Affichage du contenu principal (LCP)",
        unit: "s",
        good: 2.5,
        poor: 4,
        convert: (n: number) => +(n / 1000).toFixed(2),
        expl: (val: number, s: string) =>
          s === "good" ? "Votre page s'affiche rapidement."
          : s === "needs-improvement" ? `${val} s avant que le contenu principal apparaisse.`
          : `${val} s — trop lent, la majorité des visiteurs partira avant.`,
      },
      {
        key: "fcp" as const,
        label: "Première apparition à l'écran (FCP)",
        unit: "s",
        good: 1.8,
        poor: 3,
        convert: (n: number) => +(n / 1000).toFixed(2),
        expl: (val: number, s: string) =>
          s === "good" ? "Votre page réagit vite."
          : s === "needs-improvement" ? `${val} s avant la première apparition à l'écran.`
          : `${val} s de page blanche — vos visiteurs pensent que le site est cassé.`,
      },
      {
        key: "tbt" as const,
        label: "Temps de blocage (TBT)",
        unit: "ms",
        good: 200,
        poor: 600,
        convert: (n: number) => Math.round(n),
        expl: (val: number, s: string) =>
          s === "good" ? "La page répond bien aux interactions."
          : s === "needs-improvement" ? `${val} ms de blocage — la page peut sembler figée.`
          : `${val} ms bloqués — sur mobile, c'est critique.`,
      },
      {
        key: "cls" as const,
        label: "Stabilité de la mise en page (CLS)",
        unit: "",
        good: 0.1,
        poor: 0.25,
        convert: (n: number) => +n.toFixed(3),
        expl: (_val: number, s: string) =>
          s === "good" ? "Les éléments restent bien en place pendant le chargement."
          : s === "needs-improvement" ? "Certains éléments bougent légèrement."
          : "Mise en page instable — risque de clics involontaires sur mobile.",
      },
      {
        key: "ttfb" as const,
        label: "Réactivité du serveur (TTFB)",
        unit: "ms",
        good: 200,
        poor: 600,
        convert: (n: number) => Math.round(n),
        expl: (val: number, s: string) =>
          s === "good" ? "Votre serveur répond rapidement."
          : s === "needs-improvement" ? `${val} ms de délai serveur — acceptable mais optimisable.`
          : `${val} ms — votre hébergement est trop lent.`,
      },
    ];

    items.forEach(({ key, label, unit, good, poor, convert, expl }) => {
      const raw = v[key];
      if (raw === null) return;
      const val = convert(raw as number);
      const status: "good" | "needs-improvement" | "poor" =
        val <= good ? "good" : val <= poor ? "needs-improvement" : "poor";
      const col = metricColor(status);
      const statusLabel = status === "good" ? "Bon" : status === "needs-improvement" ? "À améliorer" : "Problème";
      const explanation = expl(val, status);
      const pct = Math.min(100, Math.round((val / (poor * 1.2)) * 100));

      metricRow(
        label,
        `${val}${unit}  ·  ${statusLabel}`,
        col,
        explanation,
        pct,
        col,
      );
    });
  }

  function renderDirectives(directives: AofResult["directives"]) {
    const typeColor: Record<string, RGB> = {
      critique: C.error,
      warning: C.warning,
      info: [30, 100, 160] as RGB,
    };
    const typeLabel: Record<string, string> = {
      critique: "Problème", warning: "Attention", info: "Information",
    };

    directives.forEach((d) => {
      const col = typeColor[d.type] ?? C.muted;
      const lbl = typeLabel[d.type] ?? d.type;

      const bodyH = lineHeight(d.corps, 9, CW - 8);
      const actionH = lineHeight(d.action, 8.5, CW - 12);
      const blockH = 8 + bodyH + 6 + actionH + 8;
      pageBreakCheck(blockH + 6);

      // Type marker + title
      t(`[${lbl}]`, ML, y + 5, { size: 8, bold: true, color: col });
      const lblW = ([lbl].map(s => s.length * 1.9 + 4)[0]);
      t(d.titre, ML + lblW + 4, y + 5, { size: 10, bold: true, color: C.ink });

      y += 8;
      t(d.corps, ML, y, { size: 9, color: C.body, maxW: CW });
      y += bodyH + 5;

      t("Action recommandée :", ML, y, { size: 8, bold: true, color: col });
      y += 4;
      t(d.action, ML + 4, y, { size: 8.5, color: C.body, maxW: CW - 6 });
      y += actionH + 6;

      rule(ML, y, CW);
      y += 5;
    });
  }
}

// ── Summary builder ────────────────────────────────────────────────────────────
function buildSummary(scores: AuditScores, details: AuditDetails): string {
  const g = scores.global;
  const intro = g >= 70
    ? `Ce site obtient la note ${scores.grade} avec un score global de ${g}/100. C'est une base solide.`
    : g >= 45
      ? `Ce site obtient la note ${scores.grade} avec un score global de ${g}/100. Des axes importants restent à améliorer.`
      : `Ce site obtient la note ${scores.grade} avec un score global de ${g}/100. La présence digitale est insuffisante et pénalise sa visibilité.`;

  const checks = [
    ...details.technique.checks,
    ...details.seo.checks,
    ...details.presence.checks,
    ...details.ux.checks,
  ];
  const fails = checks.filter((c) => c.status === "fail" && c.impact === "high").length;
  const warns = checks.filter((c) => c.status === "warn").length;

  const issuesPart = fails > 0
    ? ` ${fails} problème${fails > 1 ? "s" : ""} critique${fails > 1 ? "s" : ""} ont été détectés`
    : "";
  const warnPart = warns > 0
    ? `${fails > 0 ? " et " : " "}${warns} point${warns > 1 ? "s" : ""} à améliorer`
    : "";

  const cta = fails > 0
    ? " Commencer par les problèmes critiques donnera les meilleurs résultats."
    : warns > 0
      ? " Quelques corrections ciblées peuvent significativement renforcer la visibilité."
      : " Le site est bien configuré — continuer à entretenir les bonnes pratiques.";

  return intro + (issuesPart || warnPart ? issuesPart + warnPart + "." : "") + cta;
}
