import * as cheerio from "cheerio";

/**
 * Estimation de performance basée sur l'analyse HTML statique.
 * Utilisé quand PageSpeed API est indisponible ou rate-limitée.
 * Score sur 100 inspiré des critères Core Web Vitals.
 */
export function estimatePerformanceFromHtml(
  html: string,
  loadTimeMs: number | null,
  $: ReturnType<typeof cheerio.load>,
): {
  performance: number;
  accessibility: number;
  bestPractices: number;
  isMobileFriendly: boolean;
} {
  let perf = 100;
  let a11y = 100;
  let bp = 100;

  // ── Temps de réponse serveur ─────────────────────────────────────────
  // > 600ms = mauvais, > 1200ms = très mauvais
  if (loadTimeMs !== null) {
    if (loadTimeMs > 2000) perf -= 25;
    else if (loadTimeMs > 1200) perf -= 15;
    else if (loadTimeMs > 600) perf -= 8;
  }

  // ── Taille HTML ──────────────────────────────────────────────────────
  const htmlKb = html.length / 1024;
  if (htmlKb > 500) perf -= 15;
  else if (htmlKb > 200) perf -= 8;
  else if (htmlKb > 100) perf -= 4;

  // ── Scripts bloquants dans <head> (sans async/defer) ────────────────
  const blockingScripts = $("head script[src]").filter((_, el) => {
    const attrs = el.attribs ?? {};
    return !("async" in attrs) && !("defer" in attrs);
  }).length;
  if (blockingScripts > 3) perf -= 20;
  else if (blockingScripts > 1) perf -= 10;
  else if (blockingScripts > 0) perf -= 5;

  // ── Stylesheets dans <head> ──────────────────────────────────────────
  const cssLinks = $('head link[rel="stylesheet"]').length;
  if (cssLinks > 5) perf -= 10;
  else if (cssLinks > 3) perf -= 5;

  // ── Images sans lazy loading ─────────────────────────────────────────
  const imgs = $("img");
  const lazyImgs = imgs.filter((_, el) => {
    const a = el.attribs ?? {};
    return a.loading === "lazy" || "data-src" in a || "data-lazy" in a;
  }).length;
  const nonLazyBelow = Math.max(0, imgs.length - 3 - lazyImgs); // les 3 premières peuvent être eager
  if (nonLazyBelow > 5) perf -= 10;
  else if (nonLazyBelow > 2) perf -= 5;

  // ── Preconnect / preload hints ───────────────────────────────────────
  const hasPreconnect = !!$('link[rel="preconnect"]').length || !!$('link[rel="preload"]').length;
  if (hasPreconnect) perf += 5;

  // ── Inline scripts lourds ────────────────────────────────────────────
  const inlineScriptSize = $("script:not([src])").toArray()
    .reduce((acc, el) => acc + ($(el).html()?.length ?? 0), 0);
  if (inlineScriptSize > 100000) perf -= 10;
  else if (inlineScriptSize > 50000) perf -= 5;

  // ── Best practices ───────────────────────────────────────────────────
  // HTTPS déjà vérifié en amont, on regarde le reste
  const hasDoctype = html.trimStart().toLowerCase().startsWith("<!doctype");
  if (!hasDoctype) bp -= 10;

  const hasCharset = !!$('meta[charset]').length || html.toLowerCase().includes("charset=");
  if (!hasCharset) bp -= 10;

  // console.log / erreurs détectées dans le HTML (indicateur grossier)
  const hasConsoleErrors = html.includes("Uncaught ") || html.includes("TypeError:");
  if (hasConsoleErrors) bp -= 15;

  // ── Accessibilité ────────────────────────────────────────────────────
  const hasLang = !!$("html[lang]").length;
  if (!hasLang) a11y -= 15;

  const hasViewport = !!$('meta[name="viewport"]').attr("content");
  if (!hasViewport) a11y -= 20;

  // Images sans alt
  const totalImgs = $("img").length;
  const withAlt = $("img[alt]").length;
  if (totalImgs > 0) {
    const altRatio = withAlt / totalImgs;
    if (altRatio < 0.5) a11y -= 20;
    else if (altRatio < 0.8) a11y -= 10;
  }

  // Boutons sans label accessible
  const btnsNoLabel = $("button:not([aria-label]):not([aria-labelledby])").filter((_, el) => {
    return !$(el).text().trim();
  }).length;
  if (btnsNoLabel > 3) a11y -= 10;

  // ── Mobile friendly ──────────────────────────────────────────────────
  const viewportContent = $('meta[name="viewport"]').attr("content") ?? "";
  const isMobileFriendly = viewportContent.includes("width=device-width");

  return {
    performance:   Math.max(0, Math.min(100, Math.round(perf))),
    accessibility: Math.max(0, Math.min(100, Math.round(a11y))),
    bestPractices: Math.max(0, Math.min(100, Math.round(bp))),
    isMobileFriendly,
  };
}
