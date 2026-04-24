import type { PageSpeedResult } from "./pagespeed";
import type { SiteCheckResult } from "@/lib/scraper/dns-check";
import type { AofResult, AofDirective } from "./types";

// Constantes réseau AOF (Afrique de l'Ouest Francophone)
const AOF_3G_RTT_MS = 300;      // Latence RTT mobile 3G typique
const AOF_3G_BW_KBps = 125;     // 1 Mbps / 8 = 125 Ko/s (3G courant en AOF)

export function analyzeAof(
  ps: PageSpeedResult,
  site: SiteCheckResult,
  html: string | null,
): AofResult {
  const totalKb = ps.totalByteWeightKb;
  const ttfb = ps.ttfb ?? site.loadTimeMs ?? 800;

  // Estimation du temps de chargement sur 3G AOF
  // = TTFB pénalisé par la latence + transfert des données + overhead TCP/TLS
  let estimatedLoad3G_ms: number | null = null;
  if (totalKb !== null) {
    const transferMs = (totalKb / AOF_3G_BW_KBps) * 1000;
    const ttfbWithLatency = ttfb + AOF_3G_RTT_MS;
    const connectionOverheadMs = AOF_3G_RTT_MS * 3;
    estimatedLoad3G_ms = Math.round(ttfbWithLatency + transferMs + connectionOverheadMs);
  }

  // Détection Service Worker
  const hasServiceWorker = !!(html && (
    html.includes("serviceWorker.register") ||
    html.includes("navigator.serviceWorker") ||
    html.includes("workbox")
  ));

  // Score AOF (0–100)
  let score = 100;

  if (estimatedLoad3G_ms !== null) {
    if (estimatedLoad3G_ms > 15000) score -= 40;
    else if (estimatedLoad3G_ms > 8000) score -= 25;
    else if (estimatedLoad3G_ms > 4000) score -= 10;
  }

  if (totalKb !== null) {
    if (totalKb > 3000) score -= 20;
    else if (totalKb > 1500) score -= 10;
    else if (totalKb > 800) score -= 5;
  }

  if (!site.cdnProvider) score -= 15;
  if (!hasServiceWorker) score -= 10;

  if (ps.unoptimizedImages > 3) score -= 10;
  else if (ps.unoptimizedImages > 0) score -= 5;

  const aofScore = Math.max(0, Math.min(100, score));

  const directives = buildDirectives({
    estimatedLoad3G_ms,
    totalKb,
    cdnProvider: site.cdnProvider,
    hasServiceWorker,
    unoptimizedImages: ps.unoptimizedImages,
    requestCount: ps.requestCount,
    ttfb: ps.ttfb,
  });

  return {
    estimatedLoad3G_ms,
    totalByteWeightKb: totalKb,
    requestCount: ps.requestCount,
    unoptimizedImages: ps.unoptimizedImages,
    hasCDN: !!site.cdnProvider,
    cdnProvider: site.cdnProvider,
    hasServiceWorker,
    aofScore,
    directives,
  };
}

function buildDirectives(params: {
  estimatedLoad3G_ms: number | null;
  totalKb: number | null;
  cdnProvider: string | null;
  hasServiceWorker: boolean;
  unoptimizedImages: number;
  requestCount: number | null;
  ttfb: number | null;
}): AofDirective[] {
  const { estimatedLoad3G_ms, totalKb, cdnProvider, hasServiceWorker, unoptimizedImages, requestCount, ttfb } = params;
  const d: AofDirective[] = [];

  // Temps de chargement 3G
  if (estimatedLoad3G_ms !== null && estimatedLoad3G_ms > 10000) {
    d.push({
      type: "critique",
      titre: `${Math.round(estimatedLoad3G_ms / 1000)}s de chargement estimés sur 3G AOF`,
      corps: `Sur un réseau mobile à Dakar, Abidjan ou Lomé, votre site met environ ${Math.round(estimatedLoad3G_ms / 1000)} secondes à s'afficher. Au-delà de 3s, 53% des visiteurs abandonnent la page — et ils ne reviennent pas.`,
      action: "Réduire le poids de la page sous 1 Mo, activer Gzip/Brotli, et rapprocher les ressources via un CDN africain (Cloudflare, Bunny CDN).",
    });
  } else if (estimatedLoad3G_ms !== null && estimatedLoad3G_ms > 5000) {
    d.push({
      type: "warning",
      titre: `~${Math.round(estimatedLoad3G_ms / 1000)}s estimés sur 3G AOF`,
      corps: `Avec 300 ms de latence réseau et une bande passante limitée en Afrique de l'Ouest, votre site reste lent sur mobile. L'expérience utilisateur est dégradée pour la majorité de vos visiteurs.`,
      action: "Optimisez les images, différez les scripts non critiques, activez le cache navigateur.",
    });
  }

  // Absence de CDN
  if (!cdnProvider && (totalKb === null || totalKb > 200)) {
    d.push({
      type: "warning",
      titre: "Pas de CDN — vos ressources viennent d'Europe ou des USA",
      corps: "Votre hébergement ne passe pas par un CDN. Chaque image, fichier CSS et script doit voyager depuis un datacenter européen ou américain jusqu'à votre utilisateur en AOF — ajoutant 150 à 400 ms de latence par ressource.",
      action: "Activez Cloudflare (plan gratuit disponible) ou migrez vers un hébergeur avec présence africaine. Un nœud CDN au Nigeria ou en Afrique du Sud change radicalement la performance perçue.",
    });
  }

  // Images non optimisées
  if (unoptimizedImages > 0) {
    d.push({
      type: unoptimizedImages > 3 ? "critique" : "warning",
      titre: `${unoptimizedImages} image${unoptimizedImages > 1 ? "s" : ""} non optimisée${unoptimizedImages > 1 ? "s" : ""}`,
      corps: `${unoptimizedImages} image${unoptimizedImages > 1 ? "s ne sont" : " n'est"} pas compressée${unoptimizedImages > 1 ? "s" : ""} ou pas au format WebP. Les images représentent souvent 60 à 80 % du poids d'une page. Sur connexion mobile limitée, c'est la principale cause d'abandon.`,
      action: `Convertissez en WebP (réduction de 25–50 % vs JPEG), utilisez loading="lazy" sur les images hors écran, et activez la compression sur votre serveur.`,
    });
  }

  // Absence de Service Worker
  if (!hasServiceWorker) {
    d.push({
      type: "info",
      titre: "Pas de mode hors-ligne (Service Worker absent)",
      corps: "Les coupures réseau sont fréquentes en Afrique de l'Ouest — pannes opérateur, zones de couverture faible, switch 3G/4G. Sans Service Worker, votre site devient totalement inaccessible lors d'une interruption. Vos concurrents avec une PWA gardent leurs utilisateurs même sans connexion.",
      action: "Implémentez un Service Worker pour mettre en cache les ressources statiques. La bibliothèque Workbox (Google) simplifie cette mise en œuvre en quelques dizaines de lignes.",
    });
  }

  // Trop de requêtes HTTP
  if (requestCount !== null && requestCount > 80) {
    d.push({
      type: "warning",
      titre: `${requestCount} requêtes HTTP — chaque requête coûte 300 ms en AOF`,
      corps: `Chaque requête nécessite un aller-retour réseau. Sur 3G AOF avec ~300 ms de RTT, ${requestCount} requêtes peuvent ajouter jusqu'à ${Math.round(requestCount * 0.3)}s de latence cumulée, avant même de télécharger quoi que ce soit.`,
      action: "Regroupez les fichiers CSS/JS (bundling), utilisez des sprites SVG, réduisez les dépendances tierces (fonts Google, analytics, widgets).",
    });
  }

  // TTFB lent
  if (ttfb !== null && ttfb > 600) {
    d.push({
      type: ttfb > 1500 ? "critique" : "warning",
      titre: `Serveur lent : ${ttfb} ms avant la première réponse (TTFB)`,
      corps: `Votre serveur met ${ttfb} ms avant d'envoyer le premier octet de la page. L'objectif est < 200 ms. Sur un réseau AOF, cette lenteur serveur s'additionne à la latence réseau déjà élevée — l'utilisateur attend le double.`,
      action: "Utilisez un VPS SSD, activez un cache serveur (Redis, Varnish), ou passez à un hébergement edge (Vercel, Cloudflare Workers) qui sert depuis des nœuds proches de l'Afrique.",
    });
  }

  return d;
}
