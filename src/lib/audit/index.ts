import { checkSiteExists } from "@/lib/scraper/dns-check";
import { runPageSpeed } from "./pagespeed";
import { analyzeSeoWithRaw } from "./seo";
import { analyzePresence } from "./presence";
import { computeScores } from "./score";
import { estimatePerformanceFromHtml } from "./perf-estimate";
import { analyzeAof } from "./aof";
import type { AuditResult } from "./types";

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function runAudit(rawUrl: string): Promise<AuditResult> {
  const url = normalizeUrl(rawUrl);
  const start = Date.now();

  const [site, ps, seoRaw, presence] = await Promise.all([
    checkSiteExists(url),
    runPageSpeed(url),
    analyzeSeoWithRaw(url),
    analyzePresence(url),
  ]);

  const { seo, html, $ } = seoRaw;

  const psResolved = ps.isEstimate && html
    ? {
        ...ps,
        ...estimatePerformanceFromHtml(html, site.loadTimeMs, $),
        isEstimate: false,
      }
    : ps;

  const { details, scores, recommandations } = computeScores(site, psResolved, seo, presence);

  const vitals = {
    fcp: psResolved.fcp,
    lcp: psResolved.lcp,
    tbt: psResolved.tbt,
    cls: psResolved.cls,
    ttfb: psResolved.ttfb,
    speedIndex: psResolved.speedIndex,
    performanceScore: psResolved.performance,
    totalByteWeightKb: psResolved.totalByteWeightKb,
    requestCount: psResolved.requestCount,
    unoptimizedImages: psResolved.unoptimizedImages,
  };

  const aof = analyzeAof(psResolved, site, html);

  return {
    url,
    scores,
    details: { ...details, vitals, aof },
    recommandations,
    meta: {
      duration: Date.now() - start,
      timestamp: Date.now(),
      title: seo.title ?? undefined,
      description: seo.metaDescription ?? undefined,
    },
  };
}
