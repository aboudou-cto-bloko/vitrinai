import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vitrinai.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "VitrinAI — Diagnostic de présence digitale pour l'Afrique de l'Ouest",
    template: "%s | VitrinAI",
  },
  description:
    "Auditez votre site web gratuitement en 30 secondes : score sur 100, SEO, Core Web Vitals, présence sur Facebook/Google Maps, simulation 4G en zone UEMOA. Sans inscription.",

  keywords: [
    "audit site web Afrique",
    "diagnostic digital UEMOA",
    "SEO Côte d'Ivoire",
    "visibilité Google Sénégal",
    "présence en ligne Bénin",
    "performance mobile Afrique de l'Ouest",
    "Core Web Vitals",
    "score SEO gratuit",
    "analyse site web gratuite",
    "Google Maps entreprise Afrique",
  ],

  authors: [{ name: "VitrinAI" }],
  creator: "VitrinAI",
  publisher: "VitrinAI",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "VitrinAI — Diagnostic de présence digitale pour l'Afrique de l'Ouest",
    description:
      "Score sur 100, SEO, Core Web Vitals, présence sociale, simulation 4G AOF — gratuit, sans inscription, résultat en 30 secondes.",
    url: BASE_URL,
    siteName: "VitrinAI",
    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "VitrinAI — Diagnostic digital pour l'Afrique de l'Ouest",
    description:
      "Auditez votre site gratuitement en 30 secondes : SEO, performance, présence sociale, simulation 4G AOF.",
    creator: "@vitrinai",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "VitrinAI",
      url: BASE_URL,
      description:
        "Outil de diagnostic de présence digitale pour les entreprises d'Afrique de l'Ouest. Score sur 100, audit SEO, Core Web Vitals, simulation réseau 4G AOF.",
      areaServed: [
        "Côte d'Ivoire", "Sénégal", "Bénin", "Togo",
        "Burkina Faso", "Mali", "Niger", "Ghana",
      ],
      serviceType: "Audit de présence digitale",
      inLanguage: "fr",
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "VitrinAI",
      description: "Diagnostic de présence digitale pour l'Afrique de l'Ouest",
      publisher: { "@id": `${BASE_URL}/#organization` },
      inLanguage: "fr",
    },
    {
      "@type": "WebApplication",
      "@id": `${BASE_URL}/#app`,
      name: "VitrinAI",
      url: BASE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript",
      inLanguage: "fr",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "XOF",
        description: "Audit complet gratuit — sans inscription",
      },
      featureList: [
        "Score global sur 100",
        "Audit SEO automatisé (title, H1, sitemap, robots, Open Graph)",
        "Core Web Vitals (LCP, FCP, TBT, CLS, TTFB)",
        "Détection présence sociale (Facebook, Instagram, WhatsApp, Google Maps)",
        "Simulation chargement 4G Afrique de l'Ouest",
        "Top 5 recommandations priorisées",
        "Export PDF structuré",
        "Rapport partageable par lien",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1c1c1b",
              color: "#f0ede4",
              border: "1px solid #2e2e2c",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
