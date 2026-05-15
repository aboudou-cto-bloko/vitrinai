export interface ActionStep {
  numero: number;
  titre: string;
  description: string;
  effort: string;
  impact: string;
  axe: string;
}

export interface ConcurrentResult {
  url: string;
  scores: Record<string, number | string>;
  grade: string;
  global: number;
}

export interface ConcurrentAnalysis {
  urls: string[];
  status: string;
  results?: ConcurrentResult[];
  synthese?: string;
}
