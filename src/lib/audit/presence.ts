import * as cheerio from "cheerio";

export interface PresenceResult {
  hasFacebookLink: boolean;
  facebookUrl: string | null;
  hasInstagramLink: boolean;
  instagramUrl: string | null;
  hasLinkedInLink: boolean;
  linkedInUrl: string | null;
  hasWhatsApp: boolean;
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

export async function analyzePresence(url: string): Promise<PresenceResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "VitrinAI-Audit/1.0" },
    });
    clearTimeout(timeout);
    const html = await res.text();
    const $ = cheerio.load(html);
    const text = $.text().toLowerCase();
    const fullHtml = html.toLowerCase();

    const findLink = (pattern: string): string | null => {
      let found: string | null = null;
      $(`a[href*="${pattern}"]`).each((_, el) => {
        if (!found) found = $(el).attr("href") || null;
      });
      return found;
    };

    // Social links
    const facebookUrl = findLink("facebook.com/");
    const instagramUrl = findLink("instagram.com/");
    const linkedInUrl = findLink("linkedin.com/");
    const youtubeUrl = findLink("youtube.com/");
    const tiktokUrl = findLink("tiktok.com/");

    // WhatsApp (link or number mention)
    const hasWhatsApp =
      !!findLink("wa.me/") ||
      !!findLink("api.whatsapp.com/") ||
      fullHtml.includes("whatsapp");

    // Google Maps
    const hasGoogleMapsEmbed = fullHtml.includes("maps.googleapis.com") ||
      fullHtml.includes("maps/embed");
    const hasGoogleMapsLink = !!findLink("maps.google.com") ||
      !!findLink("goo.gl/maps") ||
      !!findLink("maps.app.goo.gl");

    // Phone
    const phoneMatch = html.match(/(?:tel:|[\+]?)[\d\s\-\(\)]{8,15}/);
    const hasPhoneNumber = !!$("a[href^='tel:']").length || !!phoneMatch;
    const phoneNumber = $("a[href^='tel:']").first().attr("href")?.replace("tel:", "") ||
      phoneMatch?.[0]?.trim() || null;

    // Email
    const emailMatch = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    const hasEmailAddress = !!$("a[href^='mailto:']").length || !!emailMatch;
    const emailAddress = $("a[href^='mailto:']").first().attr("href")?.replace("mailto:", "") ||
      emailMatch?.[0] || null;

    // Address
    const addressKeywords = ["rue ", "avenue ", "boulevard ", "bp ", "immeuble", "quartier", "cotonou", "lomé", "abidjan", "dakar", "accra"];
    const hasAddress = addressKeywords.some((kw) => text.includes(kw));

    // Contact form
    const hasContactForm = !!$("form").length &&
      (!!$('input[type="email"]').length || !!$('textarea').length);

    return {
      hasFacebookLink: !!facebookUrl,
      facebookUrl,
      hasInstagramLink: !!instagramUrl,
      instagramUrl,
      hasLinkedInLink: !!linkedInUrl,
      linkedInUrl,
      hasWhatsApp,
      hasGoogleMapsEmbed,
      hasGoogleMapsLink,
      hasPhoneNumber,
      phoneNumber,
      hasEmailAddress,
      emailAddress,
      hasAddress,
      hasContactForm,
      hasYouTube: !!youtubeUrl,
      hasTikTok: !!tiktokUrl,
    };
  } catch {
    return {
      hasFacebookLink: false, facebookUrl: null,
      hasInstagramLink: false, instagramUrl: null,
      hasLinkedInLink: false, linkedInUrl: null,
      hasWhatsApp: false,
      hasGoogleMapsEmbed: false, hasGoogleMapsLink: false,
      hasPhoneNumber: false, phoneNumber: null,
      hasEmailAddress: false, emailAddress: null,
      hasAddress: false, hasContactForm: false,
      hasYouTube: false, hasTikTok: false,
    };
  }
}
