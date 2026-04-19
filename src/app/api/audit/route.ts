import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { runAudit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  // Rate limit — 3 audits / IP / 24h (free plan)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite atteinte : 3 audits gratuits par jour. Revenez demain." },
      { status: 429, headers: { "Retry-After": "86400", "X-RateLimit-Remaining": "0" } }
    );
  }

  const raw = body.url?.trim();
  if (!raw) {
    return NextResponse.json({ error: "URL manquante" }, { status: 400 });
  }

  // URL validation + SSRF protection
  let url: string;
  try {
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(normalized);

    // Block non-HTTP schemes
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    // Block private / loopback / link-local ranges (SSRF)
    const host = parsed.hostname.toLowerCase();
    const BLOCKED = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,       // link-local (AWS metadata)
      /^::1$/,             // IPv6 loopback
      /^fc00:/,            // IPv6 private
      /^fe80:/,            // IPv6 link-local
      /^0\./,
    ];
    if (BLOCKED.some((re) => re.test(host))) {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    url = normalized;
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  // Create pending record
  const auditId = await convex.mutation(api.audits.create, { url });

  // Run audit in background — respond immediately with auditId
  runAudit(url)
    .then(async (result) => {
      await convex.mutation(api.audits.updateResult, {
        id: auditId,
        statut: "terminé",
        scores: result.scores,
        details: result.details,
        recommandations: result.recommandations.map((r) => JSON.stringify(r)),
      });
    })
    .catch(async (err) => {
      await convex.mutation(api.audits.updateResult, {
        id: auditId,
        statut: "erreur",
      });
      console.error("[audit] error for", url, err);
    });

  return NextResponse.json({ auditId });
}
