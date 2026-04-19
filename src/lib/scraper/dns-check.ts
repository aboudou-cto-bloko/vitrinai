export interface SiteCheckResult {
  exists: boolean;
  hasSSL: boolean;
  redirectsToHttps: boolean;
  statusCode: number | null;
  loadTimeMs: number | null;
  finalUrl: string;
  error?: string;
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

    // Check if http redirects to https
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
    };
  } catch (err) {
    return {
      exists: false,
      hasSSL: false,
      redirectsToHttps: false,
      statusCode: null,
      loadTimeMs: null,
      finalUrl,
      error: err instanceof Error ? err.message : "Connexion impossible",
    };
  }
}
