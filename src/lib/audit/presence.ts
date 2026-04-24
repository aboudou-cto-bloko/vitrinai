import * as cheerio from "cheerio";

export interface PresenceResult {
  hasFacebookLink: boolean;
  facebookUrl: string | null;
  hasInstagramLink: boolean;
  instagramUrl: string | null;
  hasLinkedInLink: boolean;
  linkedInUrl: string | null;
  hasTwitterLink: boolean;
  twitterUrl: string | null;
  hasTelegramLink: boolean;
  telegramUrl: string | null;
  hasWhatsApp: boolean;
  whatsAppNumber: string | null;
  hasGoogleMapsEmbed: boolean;
  hasGoogleMapsLink: boolean;
  hasPhoneNumber: boolean;
  phoneNumber: string | null;
  hasEmailAddress: boolean;
  emailAddress: string | null;
  hasAddress: boolean;
  hasContactForm: boolean;
  hasYouTube: boolean;
  hasTikTok: boolean;
}

// ── Social URL matchers ────────────────────────────────────────────────────────
// False-positive paths to ignore when matching social URLs
const FB_IGNORE = /\/(sharer|share|plugins|dialog|login|home\.php|privacy|legal|help|events\/create|groups\/create|pages\/create|policies)/i;
const TW_IGNORE = /\/(intent|share|home|search|hashtag|login|i\/)/i;

function matchesSocial(url: string, pattern: RegExp, ignore?: RegExp): boolean {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(normalized);
    const full = parsed.href;
    if (ignore && ignore.test(full)) return false;
    return pattern.test(full);
  } catch {
    return pattern.test(url);
  }
}

const PATTERNS = {
  facebook:  /(?:https?:\/\/)?(?:www\.|m\.)?(?:facebook\.com|fb\.com|fb\.me)\//i,
  instagram: /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\//i,
  whatsapp:  /(?:https?:\/\/)?(?:api\.whatsapp\.com\/send|wa\.me|chat\.whatsapp\.com)\//i,
  linkedin:  /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in|school|pub)\//i,
  youtube:   /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel|user|c|@)/i,
  tiktok:    /(?:https?:\/\/)?(?:www\.|m\.)?tiktok\.com\/@/i,
  twitter:   /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?!search|share|intent|home|i\/)/i,
  telegram:  /(?:https?:\/\/)?(?:t\.me|telegram\.me)\//i,
  gmaps:     /(?:https?:\/\/)?(?:maps\.google\.|goo\.gl\/maps|maps\.app\.goo\.gl|google\.[a-z.]+\/maps)/i,
};

// Extract WhatsApp number from wa.me link (wa.me/2250700000000)
function extractWhatsAppNumber(href: string): string | null {
  const m = href.match(/wa\.me\/(\d+)/i);
  return m ? `+${m[1]}` : null;
}

// ── Structured data extraction ─────────────────────────────────────────────────

// JSON-LD sameAs: most reliable source — injected by Yoast, RankMath, Wix, Squarespace, etc.
function extractJsonLdUrls($: cheerio.CheerioAPI): string[] {
  const urls: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() ?? "";
      const data: unknown = JSON.parse(raw);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (typeof item !== "object" || item === null) continue;
        const obj = item as Record<string, unknown>;
        if (obj.sameAs) {
          const sameAs = Array.isArray(obj.sameAs) ? obj.sameAs : [obj.sameAs];
          urls.push(...sameAs.filter((u): u is string => typeof u === "string"));
        }
        // Also check nested @graph array (used by Yoast)
        if (Array.isArray(obj["@graph"])) {
          for (const node of obj["@graph"] as unknown[]) {
            if (typeof node === "object" && node !== null) {
              const n = node as Record<string, unknown>;
              if (n.sameAs) {
                const sa = Array.isArray(n.sameAs) ? n.sameAs : [n.sameAs];
                urls.push(...sa.filter((u): u is string => typeof u === "string"));
              }
            }
          }
        }
      }
    } catch { /* malformed JSON-LD — skip */ }
  });
  return urls;
}

// og:see_also — Facebook's own meta tag for social profiles
function extractOgSeeAlso($: cheerio.CheerioAPI): string[] {
  const urls: string[] = [];
  $('meta[property="og:see_also"]').each((_, el) => {
    const content = $(el).attr("content");
    if (content) urls.push(content);
  });
  return urls;
}

// rel="me" — used by WordPress, Ghost, many CMS platforms
function extractRelMe($: cheerio.CheerioAPI): string[] {
  const urls: string[] = [];
  $('a[rel~="me"], link[rel~="me"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) urls.push(href);
  });
  return urls;
}

// Collect ALL candidate URLs from the page (hrefs + structured sources)
function collectAllUrls($: cheerio.CheerioAPI): string[] {
  const urls: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href) urls.push(href);
  });
  urls.push(...extractJsonLdUrls($));
  urls.push(...extractOgSeeAlso($));
  urls.push(...extractRelMe($));
  return urls;
}

// Find first URL matching a pattern, applying optional ignore filter
function findUrl(urls: string[], pattern: RegExp, ignore?: RegExp): string | null {
  for (const url of urls) {
    if (matchesSocial(url, pattern, ignore)) return url;
  }
  return null;
}

// ── AOF Phone patterns ─────────────────────────────────────────────────────────
// Covers: CI (+225), Sénégal (+221), Bénin (+229), Togo (+228), Burkina (+226),
//         Ghana (+233), Cameroun (+237), Mali (+223), Niger (+227), Mauritanie (+222)
const AOF_PHONE_PREFIX = /\+(?:225|221|229|228|226|233|237|223|227|222)/;

function extractPhone($: cheerio.CheerioAPI, html: string): { has: boolean; number: string | null } {
  // 1. tel: links are most reliable
  const telHref = $("a[href^='tel:']").first().attr("href");
  if (telHref) {
    return { has: true, number: telHref.replace("tel:", "").trim() };
  }
  // 2. AOF international prefix numbers
  const aofMatch = html.match(AOF_PHONE_PREFIX.source + /[\d\s\-]{6,14}/.source);
  if (aofMatch) return { has: true, number: aofMatch[0].replace(/\s+/g, " ").trim() };
  // 3. Generic phone pattern fallback (8–15 digits, allows spaces/dashes)
  const generic = html.match(/(?<!\d)(?:\+?[\d]{1,3}[\s\-.]?)?(?:\(?\d{2,4}\)?[\s\-.]?){2,4}\d{2,4}(?!\d)/);
  if (generic && generic[0].replace(/\D/g, "").length >= 8) {
    return { has: true, number: generic[0].trim() };
  }
  return { has: false, number: null };
}

// ── Address detection ──────────────────────────────────────────────────────────
// West African cities and address keywords
const ADDRESS_KEYWORDS = [
  // Generic
  "rue ", "avenue ", "boulevard ", "immeuble ", "quartier ", "carrefour ", "bp ",
  "boite postale", "b.p.", "lot ", "ilot ", "parcelle ", "cite ",
  // Côte d'Ivoire
  "abidjan", "bouaké", "yamoussoukro", "san-pedro", "daloa", "korhogo", "cocody", "plateau",
  "yopougon", "marcory", "treichville", "adjamé", "abobo",
  // Sénégal
  "dakar", "thiès", "saint-louis", "ziguinchor", "touba", "rufisque", "mbacké",
  "almadies", "point e", "plateau dakar",
  // Bénin
  "cotonou", "porto-novo", "parakou", "abomey", "fidjrossè", "haie vive", "cadjehoun",
  // Togo
  "lomé", "kara", "sokodé", "atakpamé", "bé", "tokoin", "nyékonakpoè",
  // Burkina Faso
  "ouagadougou", "bobo-dioulasso", "koudougou", "ouaga",
  // Ghana
  "accra", "kumasi", "tamale", "tema", "east legon", "cantonments",
  // Cameroun
  "douala", "yaoundé", "bafoussam",
  // Mali
  "bamako", "sikasso",
  // General
  "zone industrielle", "zone 4", "hamdallaye",
];

function hasAddress($: cheerio.CheerioAPI, text: string): boolean {
  // Check semantic <address> HTML element first
  if ($("address").length > 0) return true;
  const lower = text.toLowerCase();
  return ADDRESS_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Main export ────────────────────────────────────────────────────────────────
export async function analyzePresence(url: string): Promise<PresenceResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
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
    const text = $.text();
    const fullHtml = html.toLowerCase();

    const allUrls = collectAllUrls($);

    // ── Social platforms ───────────────────────────────────────────────────────
    const facebookUrl = findUrl(allUrls, PATTERNS.facebook, FB_IGNORE);
    const instagramUrl = findUrl(allUrls, PATTERNS.instagram);
    const linkedInUrl = findUrl(allUrls, PATTERNS.linkedin);
    const twitterUrl = findUrl(allUrls, PATTERNS.twitter, TW_IGNORE);
    const telegramUrl = findUrl(allUrls, PATTERNS.telegram);
    const youtubeUrl = findUrl(allUrls, PATTERNS.youtube);
    const tiktokUrl = findUrl(allUrls, PATTERNS.tiktok);

    // WhatsApp: check links first, then text mentions
    const waUrl = findUrl(allUrls, PATTERNS.whatsapp);
    const hasWhatsApp = !!waUrl || fullHtml.includes("whatsapp");
    const whatsAppNumber = waUrl ? extractWhatsAppNumber(waUrl) : null;

    // ── Google Maps ────────────────────────────────────────────────────────────
    const hasGoogleMapsEmbed =
      fullHtml.includes("maps.googleapis.com") ||
      fullHtml.includes("maps/embed") ||
      !!$('iframe[src*="google.com/maps"]').length ||
      !!$('iframe[src*="maps.google"]').length;

    const hasGoogleMapsLink =
      !!findUrl(allUrls, PATTERNS.gmaps) ||
      !!$('a[href*="maps.app.goo.gl"]').length;

    // ── Phone & email ──────────────────────────────────────────────────────────
    const phone = extractPhone($, html);

    const emailHref = $("a[href^='mailto:']").first().attr("href");
    const emailMatch = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    const hasEmailAddress = !!emailHref || !!emailMatch;
    const emailAddress = emailHref?.replace("mailto:", "").split("?")[0] ?? emailMatch?.[0] ?? null;

    // ── Contact form ───────────────────────────────────────────────────────────
    const hasContactForm =
      $("form").length > 0 &&
      ($('input[type="email"]').length > 0 || $("textarea").length > 0);

    return {
      hasFacebookLink: !!facebookUrl,
      facebookUrl,
      hasInstagramLink: !!instagramUrl,
      instagramUrl,
      hasLinkedInLink: !!linkedInUrl,
      linkedInUrl,
      hasTwitterLink: !!twitterUrl,
      twitterUrl,
      hasTelegramLink: !!telegramUrl,
      telegramUrl,
      hasWhatsApp,
      whatsAppNumber,
      hasGoogleMapsEmbed,
      hasGoogleMapsLink,
      hasPhoneNumber: phone.has,
      phoneNumber: phone.number,
      hasEmailAddress,
      emailAddress,
      hasAddress: hasAddress($, text),
      hasContactForm,
      hasYouTube: !!youtubeUrl,
      hasTikTok: !!tiktokUrl,
    };
  } catch {
    return {
      hasFacebookLink: false, facebookUrl: null,
      hasInstagramLink: false, instagramUrl: null,
      hasLinkedInLink: false, linkedInUrl: null,
      hasTwitterLink: false, twitterUrl: null,
      hasTelegramLink: false, telegramUrl: null,
      hasWhatsApp: false, whatsAppNumber: null,
      hasGoogleMapsEmbed: false, hasGoogleMapsLink: false,
      hasPhoneNumber: false, phoneNumber: null,
      hasEmailAddress: false, emailAddress: null,
      hasAddress: false, hasContactForm: false,
      hasYouTube: false, hasTikTok: false,
    };
  }
}
