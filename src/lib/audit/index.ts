import { checkSiteExists } from "@/lib/scraper/dns-check";
import { runPageSpeed } from "./pagespeed";
import { analyzeSeoWithRaw } from "./seo";
import { analyzePresence } from "./presence";
import { computeScores } from "./score";
import { estimatePerformanceFromHtml } from "./perf-estimate";
import type { AuditResult } from "./types";

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function runAudit(rawUrl: string): Promise<AuditResult> {
  const url = normalizeUrl(rawUrl);
  const start = Date.now();

  // Lancer tout en parallèle — SEO retourne aussi le HTML brut pour le fallback perf
  const [site, ps, seoRaw, presence] = await Promise.all([
    checkSiteExists(url),
    runPageSpeed(url),
    analyzeSeoWithRaw(url),
    analyzePresence(url),
  ]);

  const { seo, html, $ } = seoRaw;

  // Si PageSpeed a échoué, on remplace par l'estimation HTML
  const psResolved = ps.isEstimate && html
    ? {
        ...ps,
        ...estimatePerformanceFromHtml(html, site.loadTimeMs, $),
        // On garde isEstimate=true pour l'affichage mais les valeurs sont maintenant réelles
        isEstimate: false,
      }
    : ps;

  const { details, scores, recommandations } = computeScores(site, psResolved, seo, presence);

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
