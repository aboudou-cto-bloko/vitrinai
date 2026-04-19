import { checkSiteExists } from "@/lib/scraper/dns-check";
import { runPageSpeed } from "./pagespeed";
import { analyzeSeo } from "./seo";
import { analyzePresence } from "./presence";
import { computeScores } from "./score";
import type { AuditResult } from "./types";

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function runAudit(rawUrl: string): Promise<AuditResult> {
  const url = normalizeUrl(rawUrl);
  const start = Date.now();

  const [site, ps, seo, presence] = await Promise.all([
    checkSiteExists(url),
    runPageSpeed(url),
    analyzeSeo(url),
    analyzePresence(url),
  ]);

  const { details, scores, recommandations } = computeScores(site, ps, seo, presence);

  return {
    url,
    scores,
    details,
    recommandations,
    meta: {
      duration: Date.now() - start,
      timestamp: Date.now(),
      title: seo.title ?? undefined,
      description: seo.metaDescription ?? undefined,
    },
  };
}
