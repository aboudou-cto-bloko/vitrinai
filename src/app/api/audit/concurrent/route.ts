import { NextRequest, NextResponse } from "next/server";
import { runAudit } from "@/lib/audit";

const BLOCKED_HOSTS = [
  /^localhost$/,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
  /^0\./,
];

function parseAndValidateUrl(raw: string): string | null {
  try {
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    if (BLOCKED_HOSTS.some((re) => re.test(parsed.hostname.toLowerCase()))) return null;
    return normalized;
  } catch {
    return null;
  }
}

// Route interne appelée par la Convex action pour auditer un concurrent
export async function POST(req: NextRequest) {
  // Vérifier que l'appel vient de notre propre serveur
  const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const isInternal = !origin || origin.startsWith(appUrl) || appUrl.startsWith("http://localhost");
  if (!isInternal) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const url = parseAndValidateUrl(body.url?.trim() ?? "");
  if (!url) return NextResponse.json({ error: "URL invalide" }, { status: 400 });

  try {
    const result = await runAudit(url);
    return NextResponse.json({
      url,
      scores: result.scores,
      recommandations: result.recommandations.slice(0, 5),
    });
  } catch {
    return NextResponse.json({ error: "Audit échoué" }, { status: 500 });
  }
}
