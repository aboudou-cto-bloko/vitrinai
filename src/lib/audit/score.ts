import type { SiteCheckResult } from "@/lib/scraper/dns-check";
import type { PageSpeedResult } from "./pagespeed";
import type { SeoResult } from "./seo";
import type { PresenceResult } from "./presence";
import type { AuditDetails, AuditScores, Check, Grade, Recommandation } from "./types";

function pass(id: string, label: string, value: string, impact: Check["impact"] = "medium"): Check {
  return { id, label, status: "pass", value, impact };
}
function fail(id: string, label: string, value: string, detail: string, impact: Check["impact"] = "medium"): Check {
  return { id, label, status: "fail", value, detail, impact };
}
function warn(id: string, label: string, value: string, detail: string, impact: Check["impact"] = "medium"): Check {
  return { id, label, status: "warn", value, detail, impact };
}

export function computeScores(
  site: SiteCheckResult,
  ps: PageSpeedResult,
  seo: SeoResult,
  presence: PresenceResult,
): { details: AuditDetails; scores: AuditScores; recommandations: Recommandation[] } {

  // ── TECHNIQUE (max 30) ───────────────────────────────────────────────────
  const techChecks: Check[] = [];
  let tech = 0;

  // Existence (5 pts)
  if (site.exists) {
    tech += 5; techChecks.push(pass("exists", "Site accessible", `HTTP ${site.statusCode}`, "high"));
  } else {
    techChecks.push(fail("exists", "Site inaccessible", site.error ?? "Erreur", "Le site ne répond pas ou n'existe pas.", "high"));
  }

  // SSL (4 pts)
  if (site.hasSSL) {
    tech += 4; techChecks.push(pass("ssl", "Certificat SSL actif", "HTTPS ✓", "high"));
  } else {
    techChecks.push(fail("ssl", "Pas de SSL", "HTTP uniquement", "Google pénalise les sites sans HTTPS.", "high"));
  }

  // Redirect HTTP → HTTPS (2 pts)
  if (site.redirectsToHttps) {
    tech += 2; techChecks.push(pass("redirect", "Redirection HTTP → HTTPS", "Actif", "medium"));
  } else {
    techChecks.push(warn("redirect", "Pas de redirection HTTPS", "Manquant", "Les visiteurs HTTP ne sont pas redirigés.", "medium"));
  }

  // Performance Lighthouse (8 pts) — skip si estimation (quota API)
  const perfScore = ps.performance;
  if (!ps.isEstimate) {
    const perfPts = perfScore >= 90 ? 8 : perfScore >= 70 ? 6 : perfScore >= 50 ? 4 : perfScore >= 30 ? 2 : 1;
    tech += perfPts;
    if (perfScore >= 70) {
      techChecks.push(pass("perf", "Performance Lighthouse", `${perfScore}/100`, "high"));
    } else if (perfScore >= 40) {
      techChecks.push(warn("perf", "Performance à améliorer", `${perfScore}/100`, "Un score < 70 ralentit votre référencement.", "high"));
    } else {
      techChecks.push(fail("perf", "Site trop lent", `${perfScore}/100`, "Google déprioritise les sites lents.", "high"));
    }
  } else {
    // Données indisponibles : crédit neutre (4/8)
    tech += 4;
    techChecks.push(warn("perf", "Performance non mesurée", "—", "Quota API temporairement dépassé. Score estimé.", "high"));
  }

  // LCP (3 pts) — seulement si données réelles
  const lcp = (!ps.isEstimate && ps.lcp) ? Math.round(ps.lcp / 1000 * 10) / 10 : null;
  if (lcp !== null) {
    if (lcp <= 2.5) {
      tech += 3; techChecks.push(pass("lcp", "Affichage principal rapide (LCP)", `${lcp}s`, "medium"));
    } else if (lcp <= 4) {
      tech += 1; techChecks.push(warn("lcp", "Affichage principal lent (LCP)", `${lcp}s`, "Objectif : moins de 2.5s.", "medium"));
    } else {
      techChecks.push(fail("lcp", "Affichage principal très lent (LCP)", `${lcp}s`, "Objectif : moins de 2.5s. Impact fort sur l'expérience.", "medium"));
    }
  } else if (ps.isEstimate) {
    tech += 1; // crédit minimal
  }

  // Mobile (4 pts)
  if (ps.isMobileFriendly) {
    tech += 4; techChecks.push(pass("mobile", "Compatible mobile", "Oui", "high"));
  } else if (ps.isEstimate) {
    tech += 2; // incertain
    techChecks.push(warn("mobile", "Compatibilité mobile non vérifiée", "—", "Données insuffisantes pour confirmer.", "high"));
  } else {
    techChecks.push(fail("mobile", "Non adapté au mobile", "Non", "60%+ du trafic vient du mobile.", "high"));
  }

  // Favicon (2 pts)
  if (seo.hasFavicon) {
    tech += 2; techChecks.push(pass("favicon", "Favicon présent", "Oui", "low"));
  } else {
    techChecks.push(warn("favicon", "Favicon manquant", "Non", "Impacte la reconnaissance de marque.", "low"));
  }

  // Best practices (2 pts)
  const bp = ps.bestPractices;
  if (!ps.isEstimate) {
    if (bp >= 80) { tech += 2; techChecks.push(pass("bp", "Bonnes pratiques web", `${bp}/100`, "low")); }
    else { techChecks.push(warn("bp", "Bonnes pratiques insuffisantes", `${bp}/100`, "HTTPS, console errors, libraries à jour.", "low")); }
  } else {
    tech += 1;
  }

  // TTFB (2 pts)
  if (ps.ttfb !== null && !ps.isEstimate) {
    if (ps.ttfb <= 200) {
      tech += 2; techChecks.push(pass("ttfb", "Temps de réponse serveur (TTFB)", `${ps.ttfb} ms`, "medium"));
    } else if (ps.ttfb <= 600) {
      tech += 1; techChecks.push(warn("ttfb", "Réponse serveur perfectible (TTFB)", `${ps.ttfb} ms`, "Objectif : < 200 ms. Impacte le temps avant premier affichage.", "medium"));
    } else {
      techChecks.push(fail("ttfb", "Serveur trop lent (TTFB)", `${ps.ttfb} ms`, "Au-delà de 600 ms, chaque requête dégrade l'expérience sur réseau lent.", "medium"));
    }
  }

  // Poids de la page (3 pts)
  if (ps.totalByteWeightKb !== null && !ps.isEstimate) {
    const kb = ps.totalByteWeightKb;
    if (kb <= 500) {
      tech += 3; techChecks.push(pass("pageweight", "Poids de page léger", `${kb} Ko`, "medium"));
    } else if (kb <= 1500) {
      tech += 1; techChecks.push(warn("pageweight", "Page lourde", `${kb} Ko`, "Objectif : < 500 Ko. Chaque Mo coûte ~150 XOF à l'utilisateur.", "medium"));
    } else {
      techChecks.push(fail("pageweight", "Page très lourde", `${(kb / 1024).toFixed(1)} Mo`, "Au-delà de 1,5 Mo, les utilisateurs sur forfait mobile quittent la page.", "medium"));
    }
  }

  // Requêtes HTTP (1 pt)
  if (ps.requestCount !== null && !ps.isEstimate) {
    if (ps.requestCount <= 50) {
      tech += 1; techChecks.push(pass("requests", "Nombre de requêtes raisonnable", `${ps.requestCount} requêtes`, "low"));
    } else if (ps.requestCount <= 80) {
      techChecks.push(warn("requests", "Beaucoup de requêtes HTTP", `${ps.requestCount} requêtes`, "Objectif : < 50. Chaque requête ajoute de la latence sur réseau mobile.", "low"));
    } else {
      techChecks.push(fail("requests", "Trop de requêtes HTTP", `${ps.requestCount} requêtes`, "Regroupez CSS/JS, réduisez les dépendances tierces.", "low"));
    }
  }

  // ── SEO (max 30) ─────────────────────────────────────────────────────────
  const seoChecks: Check[] = [];
  let seoScore = 0;

  // Title (6 pts)
  if (seo.title) {
    if (seo.titleLength >= 30 && seo.titleLength <= 60) {
      seoScore += 6; seoChecks.push(pass("title", "Balise title optimale", `${seo.titleLength} caractères`, "high"));
    } else if (seo.titleLength > 0) {
      seoScore += 3; seoChecks.push(warn("title", "Balise title hors norme", `${seo.titleLength} car.`, "Idéal : 30–60 caractères.", "high"));
    }
  } else {
    seoChecks.push(fail("title", "Balise title manquante", "Absente", "Critique pour le référencement Google.", "high"));
  }

  // Meta description (5 pts)
  if (seo.metaDescription) {
    if (seo.metaDescriptionLength >= 50 && seo.metaDescriptionLength <= 160) {
      seoScore += 5; seoChecks.push(pass("desc", "Meta description optimale", `${seo.metaDescriptionLength} car.`, "high"));
    } else {
      seoScore += 2; seoChecks.push(warn("desc", "Meta description hors norme", `${seo.metaDescriptionLength} car.`, "Idéal : 50–160 caractères.", "high"));
    }
  } else {
    seoChecks.push(fail("desc", "Meta description manquante", "Absente", "Détermine l'aperçu dans Google.", "high"));
  }

  // H1 (4 pts)
  if (seo.h1Count === 1) {
    seoScore += 4; seoChecks.push(pass("h1", "Un seul H1 présent", `"${seo.h1Text?.slice(0, 40)}"`, "high"));
  } else if (seo.h1Count > 1) {
    seoScore += 2; seoChecks.push(warn("h1", `Plusieurs H1 (${seo.h1Count})`, `${seo.h1Count} H1`, "Un seul H1 recommandé par page.", "high"));
  } else {
    seoChecks.push(fail("h1", "Pas de H1", "Absent", "Le H1 est le titre principal de la page.", "high"));
  }

  // Sitemap (3 pts)
  if (seo.hasSitemap) {
    seoScore += 3; seoChecks.push(pass("sitemap", "Sitemap.xml présent", "Accessible", "medium"));
  } else {
    seoChecks.push(warn("sitemap", "Sitemap.xml manquant", "Absent", "Aide Google à indexer vos pages.", "medium"));
  }

  // Robots.txt (3 pts)
  if (seo.hasRobots) {
    seoScore += 3; seoChecks.push(pass("robots", "Robots.txt présent", "Accessible", "medium"));
  } else {
    seoChecks.push(warn("robots", "Robots.txt manquant", "Absent", "Contrôle l'indexation par les moteurs.", "medium"));
  }

  // OG tags (3 pts)
  const ogScore = (seo.hasOgTitle ? 1 : 0) + (seo.hasOgDescription ? 1 : 0) + (seo.hasOgImage ? 1 : 0);
  seoScore += ogScore;
  if (ogScore === 3) {
    seoChecks.push(pass("og", "Open Graph complet", "Titre, desc, image", "medium"));
  } else {
    seoChecks.push(warn("og", `Open Graph incomplet`, `${ogScore}/3`, "Impacte l'aperçu sur Facebook/WhatsApp.", "medium"));
  }

  // Images alt (3 pts)
  if (seo.imagesTotal > 0) {
    const ratio = Math.round((seo.imagesWithAlt / seo.imagesTotal) * 100);
    if (ratio >= 80) {
      seoScore += 3; seoChecks.push(pass("imgalt", "Textes alternatifs images", `${ratio}%`, "medium"));
    } else if (ratio >= 50) {
      seoScore += 1; seoChecks.push(warn("imgalt", "Textes alternatifs insuffisants", `${ratio}%`, "Objectif : 80%+ des images.", "medium"));
    } else {
      seoChecks.push(fail("imgalt", "Images sans texte alternatif", `${ratio}%`, "Impact accessibilité + SEO images.", "medium"));
    }
  }

  // Structured data (3 pts)
  if (seo.hasStructuredData) {
    seoScore += 3; seoChecks.push(pass("schema", "Données structurées (Schema.org)", "Présentes", "medium"));
  } else {
    seoChecks.push(warn("schema", "Données structurées absentes", "Non", "Enrichit les résultats Google.", "low"));
  }

  // ── PRÉSENCE (max 25) ────────────────────────────────────────────────────
  const presChecks: Check[] = [];
  let pres = 0;

  if (presence.hasFacebookLink) {
    pres += 7; presChecks.push(pass("fb", "Page Facebook liée", presence.facebookUrl ?? "Oui", "high"));
  } else {
    presChecks.push(fail("fb", "Pas de lien Facebook", "Absent", "Facebook reste le réseau n°1 en Afrique de l'Ouest.", "high"));
  }

  if (presence.hasInstagramLink) {
    pres += 5; presChecks.push(pass("ig", "Compte Instagram lié", presence.instagramUrl ?? "Oui", "medium"));
  } else {
    presChecks.push(warn("ig", "Pas de lien Instagram", "Absent", "Idéal pour les restaurants, salons, hôtels.", "medium"));
  }

  if (presence.hasGoogleMapsEmbed || presence.hasGoogleMapsLink) {
    pres += 8; presChecks.push(pass("gmaps", "Présence Google Maps", "Détectée", "high"));
  } else {
    presChecks.push(fail("gmaps", "Google Maps non intégré", "Absent", "Votre adresse est introuvable sur Google Maps.", "high"));
  }

  if (presence.hasWhatsApp) {
    pres += 3; presChecks.push(pass("wa", "WhatsApp Business", "Détecté", "medium"));
  } else {
    presChecks.push(warn("wa", "WhatsApp non lié", "Absent", "Canal de contact privilégié en zone UEMOA.", "medium"));
  }

  if (presence.hasLinkedInLink) {
    pres += 2; presChecks.push(pass("li", "LinkedIn présent", presence.linkedInUrl ?? "Oui", "low"));
  }

  // ── UX (max 15) ──────────────────────────────────────────────────────────
  const uxChecks: Check[] = [];
  let ux = 0;

  const a11y = ps.accessibility;
  const a11yPts = a11y >= 90 ? 4 : a11y >= 70 ? 3 : a11y >= 50 ? 1 : 0;
  ux += a11yPts;
  if (a11y >= 70) {
    uxChecks.push(pass("a11y", "Accessibilité", `${a11y}/100`, "medium"));
  } else {
    uxChecks.push(warn("a11y", "Accessibilité à améliorer", `${a11y}/100`, "Contrastes, labels, structure ARIA.", "medium"));
  }

  if (presence.hasPhoneNumber) {
    ux += 4; uxChecks.push(pass("phone", "Numéro de téléphone cliquable", presence.phoneNumber ?? "Oui", "high"));
  } else {
    uxChecks.push(fail("phone", "Pas de numéro de téléphone", "Absent", "Vos clients ne peuvent pas vous appeler directement.", "high"));
  }

  if (presence.hasAddress) {
    ux += 3; uxChecks.push(pass("address", "Adresse physique présente", "Oui", "medium"));
  } else {
    uxChecks.push(warn("address", "Adresse introuvable", "Absent", "Les clients ne savent pas où vous trouver.", "medium"));
  }

  if (presence.hasContactForm || presence.hasEmailAddress) {
    ux += 4; uxChecks.push(pass("contact", "Formulaire / email de contact", "Présent", "high"));
  } else {
    uxChecks.push(fail("contact", "Aucun moyen de contact", "Absent", "Vos visiteurs ne peuvent pas vous écrire.", "high"));
  }

  // CLS — stabilité visuelle (2 pts)
  if (ps.cls !== null && !ps.isEstimate) {
    if (ps.cls <= 0.1) {
      ux += 2; uxChecks.push(pass("cls", "Stabilité visuelle (CLS)", ps.cls.toFixed(3), "medium"));
    } else if (ps.cls <= 0.25) {
      ux += 1; uxChecks.push(warn("cls", "Mise en page instable (CLS)", ps.cls.toFixed(3), "Des éléments bougent au chargement. Objectif : < 0.1.", "medium"));
    } else {
      uxChecks.push(fail("cls", "Mise en page très instable (CLS)", ps.cls.toFixed(3), "Les blocs se déplacent pendant le chargement — très perturbant sur mobile.", "medium"));
    }
  }

  // ── SCORES GLOBAUX ───────────────────────────────────────────────────────
  const global = tech + seoScore + pres + ux;
  const grade: Grade =
    global >= 85 ? "A" : global >= 70 ? "B" : global >= 55 ? "C" : global >= 40 ? "D" : "F";

  // ── RECOMMANDATIONS (top issues) ─────────────────────────────────────────
  const allFails: Recommandation[] = [
    ...techChecks.filter((c) => c.status === "fail" || c.status === "warn").map((c) => ({
      titre: c.label,
      description: c.detail ?? `Valeur détectée : ${c.value}`,
      impact: c.impact,
      axe: "technique" as const,
    })),
    ...seoChecks.filter((c) => c.status === "fail" || c.status === "warn").map((c) => ({
      titre: c.label,
      description: c.detail ?? `Valeur : ${c.value}`,
      impact: c.impact,
      axe: "seo" as const,
    })),
    ...presChecks.filter((c) => c.status === "fail" || c.status === "warn").map((c) => ({
      titre: c.label,
      description: c.detail ?? `Valeur : ${c.value}`,
      impact: c.impact,
      axe: "presence" as const,
    })),
    ...uxChecks.filter((c) => c.status === "fail" || c.status === "warn").map((c) => ({
      titre: c.label,
      description: c.detail ?? `Valeur : ${c.value}`,
      impact: c.impact,
      axe: "ux" as const,
    })),
  ];

  const impactOrder = { high: 0, medium: 1, low: 2 };
  const recommandations = allFails
    .sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])
    .slice(0, 5);

  return {
    details: {
      technique: { score: tech, maxScore: 30, checks: techChecks },
      seo: { score: seoScore, maxScore: 30, checks: seoChecks },
      presence: { score: pres, maxScore: 25, checks: presChecks },
      ux: { score: ux, maxScore: 15, checks: uxChecks },
    },
    scores: { technique: tech, seo: seoScore, presence: pres, ux, global, grade },
    recommandations,
  };
}
