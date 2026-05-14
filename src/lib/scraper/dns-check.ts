export interface SecurityHeaders {
  hsts: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  csp: boolean;
  referrerPolicy: boolean;
}

export interface SiteCheckResult {
  exists: boolean;
  hasSSL: boolean;
  redirectsToHttps: boolean;
  statusCode: number | null;
  loadTimeMs: number | null;
  finalUrl: string;
  cdnProvider: string | null;
  securityHeaders: SecurityHeaders;
  error?: string;
}

function detectCdn(headers: Headers): string | null {
  if (headers.get("cf-ray")) return "Cloudflare";
  if (headers.get("x-amz-cf-id")) return "Amazon CloudFront";
  const via = (headers.get("via") ?? "").toLowerCase();
  if (via.includes("fastly")) return "Fastly";
  if (via.includes("cloudfront")) return "Amazon CloudFront";
  if (via.includes("varnish")) return "Varnish";
  const server = (headers.get("server") ?? "").toLowerCase();
  if (server.includes("cloudflare")) return "Cloudflare";
  if (server.includes("bunnycdn")) return "Bunny CDN";
  const xCache = (headers.get("x-cache") ?? "").toLowerCase();
  if (xCache.includes("cloudfront")) return "Amazon CloudFront";
  if (xCache.includes("hit") || xCache.includes("miss")) return "CDN";
  if (headers.get("x-served-by")) return "Fastly";
  if (headers.get("x-bunny-served")) return "Bunny CDN";
  return null;
}

export async function checkSiteExists(url: string): Promise<SiteCheckResult> {
  const start = Date.now();
  const finalUrl = url.startsWith("http") ? url : `https://${url}`;
  const hasSSL = finalUrl.startsWith("https://");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(finalUrl, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "VitrinAI-Audit/1.0" },
    });

    clearTimeout(timeout);
    const loadTimeMs = Date.now() - start;
    const cdnProvider = detectCdn(res.headers);

    const securityHeaders: SecurityHeaders = {
      hsts: !!res.headers.get("strict-transport-security"),
      xFrameOptions: !!(res.headers.get("x-frame-options") || (res.headers.get("content-security-policy") ?? "").includes("frame-ancestors")),
      xContentTypeOptions: res.headers.get("x-content-type-options")?.toLowerCase() === "nosniff",
      csp: !!res.headers.get("content-security-policy"),
      referrerPolicy: !!res.headers.get("referrer-policy"),
    };

    let redirectsToHttps = hasSSL;
    if (!hasSSL) {
      try {
        const httpUrl = url.startsWith("http://") ? url : `http://${url}`;
        const rController = new AbortController();
        const rTimeout = setTimeout(() => rController.abort(), 5000);
        const rRes = await fetch(httpUrl, {
          method: "HEAD",
          signal: rController.signal,
          redirect: "follow",
          headers: { "User-Agent": "VitrinAI-Audit/1.0" },
        });
        clearTimeout(rTimeout);
        redirectsToHttps = rRes.url.startsWith("https://");
      } catch {
        redirectsToHttps = false;
      }
    }

    return {
      exists: res.ok || res.status < 500,
      hasSSL: finalUrl.startsWith("https://") || res.url.startsWith("https://"),
      redirectsToHttps,
      statusCode: res.status,
      loadTimeMs,
      finalUrl: res.url || finalUrl,
      cdnProvider,
      securityHeaders,
    };
  } catch (err) {
    return {
      exists: false,
      hasSSL: false,
      redirectsToHttps: false,
      statusCode: null,
      loadTimeMs: null,
      finalUrl,
      cdnProvider: null,
      securityHeaders: { hsts: false, xFrameOptions: false, xContentTypeOptions: false, csp: false, referrerPolicy: false },
      error: err instanceof Error ? err.message : "Connexion impossible",
    };
  }
}
