import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { SectorsSection } from "@/components/landing/SectorsSection";
import { PremiumFeaturesSection } from "@/components/landing/PremiumFeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FooterSection } from "@/components/landing/FooterSection";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "VitrinAI est-il vraiment gratuit ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, l'audit complet est 100 % gratuit et sans inscription. Vous obtenez un rapport détaillé avec un score sur 100, des recommandations et une simulation de performance 4G en 30 secondes.",
      },
    },
    {
      "@type": "Question",
      name: "Quels critères sont analysés par VitrinAI ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "VitrinAI analyse plus de 30 critères répartis en 4 axes : santé technique (SSL, Core Web Vitals, compatibilité mobile), référencement Google (SEO on-page, sitemap, données structurées), présence en ligne (Facebook, Google Maps, WhatsApp, Instagram) et expérience visiteur (contact, accessibilité, stabilité visuelle).",
      },
    },
    {
      "@type": "Question",
      name: "Qu'est-ce que la simulation 4G AOF ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Google mesure les performances depuis des serveurs en Europe. VitrinAI simule le chargement réel de votre site avec les paramètres réseau des opérateurs mobiles en Afrique de l'Ouest (latence 100 ms, 5 Mbps), pour donner une estimation fidèle de ce que vivent vos clients à Abidjan, Dakar ou Lomé.",
      },
    },
    {
      "@type": "Question",
      name: "Pour quels types d'entreprises VitrinAI est-il utile ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "VitrinAI est conçu pour les entreprises d'Afrique de l'Ouest qui ont un site web et veulent savoir s'il est visible sur Google, chargé rapidement sur mobile et bien représenté sur les réseaux sociaux. Restaurants, cliniques, hôtels, salons, boutiques, cabinets — tous les secteurs d'activité en zone UEMOA.",
      },
    },
    {
      "@type": "Question",
      name: "Comment améliorer mon score VitrinAI ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Chaque rapport VitrinAI inclut les 5 priorités concrètes à traiter en premier, classées par impact. Des actions comme ajouter un certificat SSL, renseigner une meta description, lier une page Facebook ou rendre votre numéro de téléphone cliquable peuvent faire gagner plusieurs points rapidement.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="flex flex-col min-h-screen bg-parchemin">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <SectorsSection />
          <PremiumFeaturesSection />
          <PricingSection />
        </main>
        <FooterSection />
      </div>
    </>
  );
}
