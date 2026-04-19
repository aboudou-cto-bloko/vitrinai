export interface PageSpeedResult {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  fcp: number | null;   // First Contentful Paint (ms)
  lcp: number | null;   // Largest Contentful Paint (ms)
  cls: number | null;   // Cumulative Layout Shift
  tbt: number | null;   // Total Blocking Time (ms)
  speedIndex: number | null;
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
      // API quota or error — retour partiel marqué estimate
      return fallback(`PageSpeed API error: ${res.status}`, true);
    }

    const data = await res.json();
    const cats = data.lighthouseResult?.categories ?? {};
    const audits = data.lighthouseResult?.audits ?? {};

    const score = (key: string) => Math.round((cats[key]?.score ?? 0) * 100);
    const numVal = (key: string): number | null => audits[key]?.numericValue ?? null;

    // Mobile-friendly = viewport présent ET pas d'erreur de viewport
    const viewportScore = audits["viewport"]?.score ?? 0;
    const mobileUsability = (audits["mobile-friendly"]?.score ?? 1) >= 0.9;
    const isMobileFriendly = viewportScore >= 0.9 || mobileUsability;

    return {
      performance:    score("performance"),
      seo:            score("seo"),
      accessibility:  score("accessibility"),
      bestPractices:  score("best-practices"),
      fcp:            numVal("first-contentful-paint"),
      lcp:            numVal("largest-contentful-paint"),
      cls:            audits["cumulative-layout-shift"]?.numericValue ?? null,
      tbt:            numVal("total-blocking-time"),
      speedIndex:     numVal("speed-index"),
      isMobileFriendly,
    };
  } catch (e) {
    return fallback(e instanceof Error ? e.message : "Timeout", true);
  }
}

function fallback(error: string, isEstimate = false): PageSpeedResult {
  return {
    // On retourne 50 comme estimation neutre — on ne pénalise pas un site
    // dont on ne peut pas mesurer les perfs (quota API, réseau…)
    performance:   50,
    seo:           50,
    accessibility: 50,
    bestPractices: 50,
    fcp: null, lcp: null, cls: null, tbt: null, speedIndex: null,
    isMobileFriendly: true,
    isEstimate,
    error,
  };
}
