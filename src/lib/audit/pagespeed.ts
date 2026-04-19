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
  error?: string;
}

export async function runPageSpeed(url: string): Promise<PageSpeedResult> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const categories = ["performance", "seo", "accessibility", "best-practices"];

  // Build URL manually for multiple category params
  const base = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
  const catParams = categories.map((c) => `category=${c}`).join("&");
  const urlParam = `url=${encodeURIComponent(url)}&strategy=mobile${apiKey ? `&key=${apiKey}` : ""}`;
  const endpoint = `${base}?${urlParam}&${catParams}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      await res.json().catch(() => ({}));
      return fallback(`PageSpeed API error: ${res.status}`);
    }

    const data = await res.json();
    const cats = data.lighthouseResult?.categories ?? {};
    const audits = data.lighthouseResult?.audits ?? {};

    const score = (key: string) => Math.round((cats[key]?.score ?? 0) * 100);
    const numVal = (key: string) =>
      audits[key]?.numericValue ?? null;

    return {
      performance: score("performance"),
      seo: score("seo"),
      accessibility: score("accessibility"),
      bestPractices: score("best-practices"),
      fcp: numVal("first-contentful-paint"),
      lcp: numVal("largest-contentful-paint"),
      cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
      tbt: numVal("total-blocking-time"),
      speedIndex: numVal("speed-index"),
      isMobileFriendly:
        audits["uses-responsive-images"]?.score !== 0 ||
        (audits["viewport"]?.score ?? 0) >= 0.9,
    };
  } catch (e) {
    return fallback(e instanceof Error ? e.message : "Timeout");
  }
}

function fallback(error: string): PageSpeedResult {
  return {
    performance: 0,
    seo: 0,
    accessibility: 0,
    bestPractices: 0,
    fcp: null,
    lcp: null,
    cls: null,
    tbt: null,
    speedIndex: null,
    isMobileFriendly: false,
    error,
  };
}
