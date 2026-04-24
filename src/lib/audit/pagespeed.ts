export interface PageSpeedResult {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  tbt: number | null;
  ttfb: number | null;
  speedIndex: number | null;
  totalByteWeightKb: number | null;
  requestCount: number | null;
  unoptimizedImages: number;
  isMobileFriendly: boolean;
  /** true quand la réponse API est une estimation (quota dépassé, timeout…) */
  isEstimate?: boolean;
  error?: string;
}

export async function runPageSpeed(url: string): Promise<PageSpeedResult> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const categories = ["performance", "seo", "accessibility", "best-practices"];

  const catParams = categories.map((c) => `category=${encodeURIComponent(c)}`).join("&");
  const urlParam = `url=${encodeURIComponent(url)}&strategy=mobile${apiKey ? `&key=${apiKey}` : ""}`;
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${urlParam}&${catParams}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      await res.json().catch(() => ({}));
      return fallback(`PageSpeed API error: ${res.status}`, true);
    }

    const data = await res.json();
    const cats = data.lighthouseResult?.categories ?? {};
    const audits = data.lighthouseResult?.audits ?? {};

    const score = (key: string) => Math.round((cats[key]?.score ?? 0) * 100);
    const numVal = (key: string): number | null => audits[key]?.numericValue ?? null;

    const viewportScore = audits["viewport"]?.score ?? 0;
    const mobileUsability = (audits["mobile-friendly"]?.score ?? 1) >= 0.9;
    const isMobileFriendly = viewportScore >= 0.9 || mobileUsability;

    // Page weight from total-byte-weight audit (in bytes → KB)
    const totalBytes = numVal("total-byte-weight");
    const totalByteWeightKb = totalBytes !== null ? Math.round(totalBytes / 1024) : null;

    // HTTP request count from network-requests audit items
    const networkItems = audits["network-requests"]?.details?.items;
    const requestCount = Array.isArray(networkItems) ? networkItems.length : null;

    // Unoptimized images (uses-optimized-images + uses-webp-images)
    const unoptItems1 = audits["uses-optimized-images"]?.details?.items;
    const unoptItems2 = audits["uses-webp-images"]?.details?.items;
    const unoptSet = new Set<string>();
    if (Array.isArray(unoptItems1)) {
      unoptItems1.forEach((item: { url?: string }) => { if (item.url) unoptSet.add(item.url); });
    }
    if (Array.isArray(unoptItems2)) {
      unoptItems2.forEach((item: { url?: string }) => { if (item.url) unoptSet.add(item.url); });
    }
    const unoptimizedImages = unoptSet.size;

    return {
      performance:    score("performance"),
      seo:            score("seo"),
      accessibility:  score("accessibility"),
      bestPractices:  score("best-practices"),
      fcp:            numVal("first-contentful-paint"),
      lcp:            numVal("largest-contentful-paint"),
      cls:            audits["cumulative-layout-shift"]?.numericValue ?? null,
      tbt:            numVal("total-blocking-time"),
      ttfb:           numVal("server-response-time"),
      speedIndex:     numVal("speed-index"),
      totalByteWeightKb,
      requestCount,
      unoptimizedImages,
      isMobileFriendly,
    };
  } catch (e) {
    return fallback(e instanceof Error ? e.message : "Timeout", true);
  }
}

function fallback(error: string, isEstimate = false): PageSpeedResult {
  return {
    performance:   50,
    seo:           50,
    accessibility: 50,
    bestPractices: 50,
    fcp: null, lcp: null, cls: null, tbt: null, ttfb: null, speedIndex: null,
    totalByteWeightKb: null,
    requestCount: null,
    unoptimizedImages: 0,
    isMobileFriendly: true,
    isEstimate,
    error,
  };
}
