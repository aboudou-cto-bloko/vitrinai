# VitrinAI

Diagnostic complet de présence digitale pour les entreprises d'Afrique de l'Ouest — score sur 100, rapport détaillé, simulation 4G AOF, export PDF. Gratuit, sans inscription, résultat en 30 secondes.

## Fonctionnement

L'utilisateur colle une URL. L'outil analyse en parallèle :

- **Santé technique** — SSL, Core Web Vitals (LCP, FCP, TBT, CLS, TTFB), compatibilité mobile, poids de page, CDN, requêtes HTTP
- **Référencement Google** — title, meta description, H1, sitemap, robots.txt, Open Graph, données structurées
- **Présence en ligne** — Facebook, Instagram, WhatsApp, Google Maps, LinkedIn, Twitter/X, Telegram, YouTube, TikTok
- **Expérience visiteur** — téléphone cliquable, formulaire de contact, adresse, accessibilité
- **Simulation 4G AOF** — estimation du temps de chargement réel avec latence 100 ms / 5 Mbps, propre au contexte réseau ouest-africain

Le rapport est persisté via Convex, partageable par lien, exportable en PDF structuré (5 pages).

## Stack

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router) |
| Backend / BDD | Convex |
| UI | Tailwind CSS v4, Radix UI, Phosphor Icons |
| Animations | Motion (Framer Motion) |
| Graphiques | Recharts |
| Scraping | Cheerio |
| Performance | Google PageSpeed Insights API v5 |
| PDF | jsPDF |
| Déploiement | Vercel |

## Architecture

```
src/
├── app/
│   ├── api/audit/          # POST /api/audit — lance l'audit async
│   │   └── status/[id]/    # GET — polling du statut
│   └── (public)/rapport/   # Page de rapport [id]
├── components/
│   ├── landing/            # HeroSection, FeaturesSection, AuditWidget…
│   └── rapport/            # WebVitalsSection, AofSection
└── lib/
    ├── audit/              # index.ts, score.ts, seo.ts, presence.ts, aof.ts, pagespeed.ts, types.ts
    ├── scraper/            # dns-check.ts (SSL, CDN, headers HTTP)
    └── rapport/            # pdf-generator.ts

convex/
├── audits.ts               # Mutations et queries Convex
└── schema.ts               # Schéma de la base
```

## Démarrage local

### Prérequis

- Node.js 22+
- pnpm 10+
- Un projet Convex (gratuit sur [convex.dev](https://convex.dev))
- Une clé API Google PageSpeed Insights (gratuite sur [Google Cloud Console](https://console.cloud.google.com))

### Installation

```bash
git clone https://github.com/aboudou-cto-bloko/vitrinai.git
cd vitrinai
pnpm install
```

### Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_CONVEX_URL=https://xxxx.convex.cloud
CONVEX_DEPLOY_KEY=prod:xxxx
PAGESPEED_API_KEY=AIzaSy...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Développement

Dans deux terminaux séparés :

```bash
# Terminal 1 — backend Convex
pnpm convex:dev

# Terminal 2 — frontend Next.js
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Build de production

```bash
pnpm build
pnpm start
```

## Algorithme de scoring

| Axe | Max | Critères principaux |
|-----|-----|---------------------|
| Technique | 30 pts | SSL, Lighthouse, LCP, mobile, TTFB, poids page |
| SEO | 30 pts | Title, meta description, H1, sitemap, robots.txt, OG, schema |
| Présence | 25 pts | Facebook, Google Maps, WhatsApp, Instagram, LinkedIn |
| Expérience | 15 pts | Téléphone, contact, adresse, accessibilité, CLS |

Grade : A ≥ 85 · B ≥ 70 · C ≥ 55 · D ≥ 40 · F < 40

## Détection de présence sociale

Le moteur lit 4 sources par ordre de fiabilité :

1. **JSON-LD `sameAs`** — injecté automatiquement par Yoast, RankMath, Wix, Squarespace
2. **`og:see_also`** — méta tag Facebook pour les profils sociaux
3. **`rel="me"`** — liens d'identité déclarés par WordPress, Ghost
4. **Liens `<a href>`** — regex couvrant variantes courtes (`fb.com`, `instagr.am`, `x.com`, `t.me`, `wa.me`)

Faux positifs filtrés : `facebook.com/sharer`, `/plugins`, `twitter.com/intent`, etc.

## Simulation réseau AOF

Google PageSpeed mesure depuis des serveurs européens. VitrinAI recalcule localement avec les paramètres 4G ouest-africains :

- Latence RTT : **100 ms**
- Bande passante : **5 Mbps (625 Ko/s)**

Formule : `TTFB_latence + temps_transfert + overhead_connexion`

## Contribution

Voir [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licence

Propriétaire — tous droits réservés.
