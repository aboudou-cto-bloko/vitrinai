export type CheckStatus = "pass" | "fail" | "warn" | "na";
export type Grade = "A" | "B" | "C" | "D" | "F";

export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  value?: string;
  detail?: string;
  impact: "high" | "medium" | "low";
}

export interface AxisResult {
  score: number;
  maxScore: number;
  checks: Check[];
}

export interface Recommandation {
  titre: string;
  description: string;
  impact: "high" | "medium" | "low";
  axe: "technique" | "seo" | "presence" | "ux";
}

export interface AuditScores {
  technique: number;
  seo: number;
  presence: number;
  ux: number;
  global: number;
  grade: Grade;
}

export interface VitalsData {
  fcp: number | null;
  lcp: number | null;
  tbt: number | null;
  cls: number | null;
  ttfb: number | null;
  speedIndex: number | null;
  performanceScore: number;
  totalByteWeightKb: number | null;
  requestCount: number | null;
  unoptimizedImages: number;
}

export interface AofDirective {
  type: "critique" | "warning" | "info";
  titre: string;
  corps: string;
  action: string;
}

export interface AofResult {
  estimatedLoad3G_ms: number | null;
  totalByteWeightKb: number | null;
  requestCount: number | null;
  unoptimizedImages: number;
  hasCDN: boolean;
  cdnProvider: string | null;
  hasServiceWorker: boolean;
  aofScore: number;
  directives: AofDirective[];
}

export interface AuditDetails {
  technique: AxisResult;
  seo: AxisResult;
  presence: AxisResult;
  ux: AxisResult;
  vitals?: VitalsData;
  aof?: AofResult;
}

export interface AuditResult {
  url: string;
  scores: AuditScores;
  details: AuditDetails;
  recommandations: Recommandation[];
  meta: {
    duration: number;
    timestamp: number;
    title?: string;
    description?: string;
    favicon?: string;
  };
}
