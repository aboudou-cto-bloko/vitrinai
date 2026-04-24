import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VitrinAI — Diagnostic de présence digitale",
    short_name: "VitrinAI",
    description:
      "Diagnostic complet de votre présence digitale en 30 secondes. SEO, performance, réseaux sociaux, simulation 4G AOF.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f3ec",
    theme_color: "#1c1c1b",
    lang: "fr",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    categories: ["business", "productivity", "utilities"],
  };
}
