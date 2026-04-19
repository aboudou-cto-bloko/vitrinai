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

export interface AuditDetails {
  technique: AxisResult;
  seo: AxisResult;
  presence: AxisResult;
  ux: AxisResult;
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
