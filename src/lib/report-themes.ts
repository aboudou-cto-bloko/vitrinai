export type PresetId = "standard" | "corporate" | "modern" | "brand";

export interface ReportThemeConfig {
  preset: PresetId;
  companyName?: string;
  accentHex?: string;
  headerBg?: string;
  fontChoice?: "serif" | "sans";
}

export interface ThemeStyles {
  pageBg: string;
  cardBg: string;
  headerBg: string;
  headerFg: string;
  accent: string;
  accentLight: string;
  border: string;
  headingFont: string;
  brandLabel: string;
}

export interface PresetMeta {
  id: PresetId;
  name: string;
  description: string;
  creditCost: number;
  swatches: [string, string, string];
}

export const PRESET_META: Record<PresetId, PresetMeta> = {
  standard: {
    id: "standard",
    name: "Standard",
    description: "Design VitrinAI original",
    creditCost: 0,
    swatches: ["#1c1c1b", "#2d7a4f", "#f5f3ec"],
  },
  corporate: {
    id: "corporate",
    name: "Corporate",
    description: "Bleu marine · Serif · Rapport conseil",
    creditCost: 3,
    swatches: ["#1a365d", "#2b6cb0", "#f0f4f8"],
  },
  modern: {
    id: "modern",
    name: "Modern",
    description: "Blanc · Indigo · Design épuré",
    creditCost: 3,
    swatches: ["#312e81", "#6366f1", "#f8fafc"],
  },
  brand: {
    id: "brand",
    name: "Marque",
    description: "Vos couleurs + nom d'entreprise",
    creditCost: 5,
    swatches: ["#374151", "#6b7280", "#ffffff"],
  },
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function resolveTheme(config: ReportThemeConfig): ThemeStyles {
  if (config.preset === "brand") {
    const accent = config.accentHex ?? "#1c1c1b";
    const header = config.headerBg ?? accent;
    const font = config.fontChoice === "sans"
      ? "system-ui, -apple-system, sans-serif"
      : "Georgia, 'Times New Roman', serif";
    return {
      pageBg: "#f9f9f9",
      cardBg: "#ffffff",
      headerBg: header,
      headerFg: "#ffffff",
      accent,
      accentLight: hexToRgba(accent, 0.08),
      border: "#e5e7eb",
      headingFont: font,
      brandLabel: config.companyName ?? "VitrinAI",
    };
  }

  const map: Record<Exclude<PresetId, "brand">, ThemeStyles> = {
    standard: {
      pageBg: "#f5f3ec",
      cardBg: "#ffffff",
      headerBg: "#1c1c1b",
      headerFg: "#f0ede4",
      accent: "#2d7a4f",
      accentLight: "rgba(45,122,79,0.08)",
      border: "#e8e5d8",
      headingFont: "Georgia, serif",
      brandLabel: "VitrinAI",
    },
    corporate: {
      pageBg: "#eef2f7",
      cardBg: "#ffffff",
      headerBg: "#1a365d",
      headerFg: "#ebf4ff",
      accent: "#2b6cb0",
      accentLight: "rgba(43,108,176,0.08)",
      border: "#c3dafe",
      headingFont: "Georgia, serif",
      brandLabel: "VitrinAI",
    },
    modern: {
      pageBg: "#f8fafc",
      cardBg: "#ffffff",
      headerBg: "#312e81",
      headerFg: "#e0e7ff",
      accent: "#6366f1",
      accentLight: "rgba(99,102,241,0.08)",
      border: "#e0e7ff",
      headingFont: "system-ui, -apple-system, sans-serif",
      brandLabel: "VitrinAI",
    },
  };

  return map[config.preset as Exclude<PresetId, "brand">];
}

export const DEFAULT_THEME: ReportThemeConfig = { preset: "standard" };
