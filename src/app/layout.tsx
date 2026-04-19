import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://vitrinai.com"
  ),
  title: "VitrinAI — Bilan de santé digitale de votre entreprise",
  description:
    "Obtenez un diagnostic complet de votre présence digitale en 30 secondes — gratuitement. Aucune inscription requise.",
  openGraph: {
    title: "VitrinAI — Bilan de santé digitale de votre entreprise",
    description:
      "Obtenez un diagnostic complet de votre présence digitale en 30 secondes — gratuitement.",
    images: [{ url: "/icon.png", width: 1320, height: 1080 }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VitrinAI",
    description: "Le bilan de santé digitale de votre entreprise en 30 secondes.",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
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
