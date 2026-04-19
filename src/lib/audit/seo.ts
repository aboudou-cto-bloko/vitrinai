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

export async function analyzeSeo(url: string): Promise<SeoResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr,en;q=0.5",
      },
    });
    clearTimeout(timeout);

    const html = await res.text();
    const $ = cheerio.load(html);
    const baseHost = new URL(url).host;

    const title = $("title").first().text().trim() || null;
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || null;
    const canonicalUrl =
      $('link[rel="canonical"]').attr("href")?.trim() || null;
    const lang = $("html").attr("lang")?.trim() || null;

    // Images
    const images = $("img");
    const imagesWithAlt = images.filter((_, el) => !!$(el).attr("alt")).length;

    // Links
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

    // Robots & sitemap
    const [robotsRes, sitemapRes] = await Promise.allSettled([
      fetch(`${new URL(url).origin}/robots.txt`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${new URL(url).origin}/sitemap.xml`, { signal: AbortSignal.timeout(5000) }),
    ]);

    const hasRobots =
      robotsRes.status === "fulfilled" && robotsRes.value.ok;
    const hasSitemap =
      sitemapRes.status === "fulfilled" && sitemapRes.value.ok;

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
      hasRobots,
      hasSitemap,
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
      hasStructuredData:
        !!$('script[type="application/ld+json"]').length,
      internalLinks,
      externalLinks,
    };
  } catch {
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
}
