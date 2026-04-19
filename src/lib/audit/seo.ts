import * as cheerio from "cheerio";

export interface SeoResult {
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  h1Count: number;
  h1Text: string | null;
  h2Count: number;
  hasCanonical: boolean;
  canonicalUrl: string | null;
  hasRobots: boolean;
  hasSitemap: boolean;
  hasOgTitle: boolean;
  hasOgDescription: boolean;
  hasOgImage: boolean;
  hasTwitterCard: boolean;
  hasFavicon: boolean;
  hasViewport: boolean;
  hasLang: boolean;
  lang: string | null;
  imagesTotal: number;
  imagesWithAlt: number;
  hasStructuredData: boolean;
  internalLinks: number;
  externalLinks: number;
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr,en;q=0.5",
};

function emptySeoResult(): SeoResult {
  return {
    title: null, titleLength: 0,
    metaDescription: null, metaDescriptionLength: 0,
    h1Count: 0, h1Text: null, h2Count: 0,
    hasCanonical: false, canonicalUrl: null,
    hasRobots: false, hasSitemap: false,
    hasOgTitle: false, hasOgDescription: false, hasOgImage: false,
    hasTwitterCard: false, hasFavicon: false,
    hasViewport: false, hasLang: false, lang: null,
    imagesTotal: 0, imagesWithAlt: 0,
    hasStructuredData: false,
    internalLinks: 0, externalLinks: 0,
  };
}

async function parseSeoFromDom(
  url: string,
  html: string,
  $: ReturnType<typeof cheerio.load>,
): Promise<SeoResult> {
  const baseHost = new URL(url).host;

  const title = $("title").first().text().trim() || null;
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() || null;
  const canonicalUrl = $('link[rel="canonical"]').attr("href")?.trim() || null;
  const lang = $("html").attr("lang")?.trim() || null;

  const images = $("img");
  const imagesWithAlt = images.filter((_, el) => !!$(el).attr("alt")).length;

  let internalLinks = 0;
  let externalLinks = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.startsWith("http")) {
      try {
        const host = new URL(href).host;
        if (host === baseHost) { internalLinks++; } else { externalLinks++; }
      } catch { externalLinks++; }
    } else if (href.startsWith("/") || href.startsWith("#")) {
      internalLinks++;
    }
  });

  const [robotsRes, sitemapRes] = await Promise.allSettled([
    fetch(`${new URL(url).origin}/robots.txt`, { signal: AbortSignal.timeout(5000) }),
    fetch(`${new URL(url).origin}/sitemap.xml`, { signal: AbortSignal.timeout(5000) }),
  ]);

  return {
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    h1Count: $("h1").length,
    h1Text: $("h1").first().text().trim() || null,
    h2Count: $("h2").length,
    hasCanonical: !!canonicalUrl,
    canonicalUrl,
    hasRobots: robotsRes.status === "fulfilled" && robotsRes.value.ok,
    hasSitemap: sitemapRes.status === "fulfilled" && sitemapRes.value.ok,
    hasOgTitle: !!$('meta[property="og:title"]').attr("content"),
    hasOgDescription: !!$('meta[property="og:description"]').attr("content"),
    hasOgImage: !!$('meta[property="og:image"]').attr("content"),
    hasTwitterCard: !!$('meta[name="twitter:card"]').attr("content"),
    hasFavicon:
      !!$('link[rel="icon"]').length ||
      !!$('link[rel="shortcut icon"]').length ||
      !!$('link[rel="apple-touch-icon"]').length,
    hasViewport: !!$('meta[name="viewport"]').attr("content"),
    hasLang: !!lang,
    lang,
    imagesTotal: images.length,
    imagesWithAlt,
    hasStructuredData: !!$('script[type="application/ld+json"]').length,
    internalLinks,
    externalLinks,
  };
}

/** Retourne le résultat SEO + le HTML brut + le $ (pour perf-estimator) */
export async function analyzeSeoWithRaw(url: string): Promise<{
  seo: SeoResult;
  html: string | null;
  $: ReturnType<typeof cheerio.load>;
}> {
  const empty$ = cheerio.load("");
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal, headers: HEADERS });
    clearTimeout(timer);
    const html = await res.text();
    const $ = cheerio.load(html);
    const seo = await parseSeoFromDom(url, html, $);
    return { seo, html, $ };
  } catch {
    return { seo: emptySeoResult(), html: null, $: empty$ };
  }
}

export async function analyzeSeo(url: string): Promise<SeoResult> {
  const { seo } = await analyzeSeoWithRaw(url);
  return seo;
}
