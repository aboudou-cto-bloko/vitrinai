import { NextRequest, NextResponse, after } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { runAudit } from "@/lib/audit";
import { isAuthenticated, fetchAuthQuery, fetchAuthMutation } from "@/lib/auth-server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const raw = body.url?.trim();
  if (!raw) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

  const url = parseAndValidateUrl(raw);
  if (!url) return NextResponse.json({ error: "URL invalide" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";

  const authenticated = await isAuthenticated();

  // ── Utilisateur connecté : vérifier et déduire un crédit ──────────────────
  if (authenticated) {
    const user = await fetchAuthQuery(api.credits.getMe);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    if (user.creditsBalance < 1) {
      return NextResponse.json(
        { error: "Solde insuffisant. Achetez des crédits pour continuer." },
        { status: 402 }
      );
    }

    const auditId = await convex.mutation(api.audits.create, {
      url,
      userId: user._id as any,
    });

    // Déduire le crédit avant de lancer l'audit
    await fetchAuthMutation(api.credits.debitMeForAudit, {
      auditId: auditId as any,
    });

    const remainingCredits = user.creditsBalance - 1;

    after(async () => {
      try {
        const result = await runAudit(url);
        await convex.mutation(api.audits.updateResult, {
          id: auditId,
          statut: "terminé",
          scores: result.scores,
          details: result.details,
          recommandations: result.recommandations.map((r) => JSON.stringify(r)),
        });
      } catch (err) {
        await convex.mutation(api.audits.updateResult, { id: auditId, statut: "erreur" });
        console.error("[audit] error for", url, err);
      }
    });

    return NextResponse.json({
      auditId,
      ...(remainingCredits <= 2 && { lowBalance: remainingCredits }),
    });
  }

  // ── Anonyme : URL déjà en cache → résultat gratuit mais verrouillé ──────────
  const cached = await convex.query(api.audits.getLatestByUrl, { url });
  if (cached) {
    return NextResponse.json({ auditId: cached._id, gated: true });
  }

  // ── Anonyme : 1 audit gratuit par IP via Convex ───────────────────────────
  const alreadyUsed = await convex.query(api.audits.hasAnonymousAudit, { ip });
  if (alreadyUsed) {
    return NextResponse.json(
      { error: "Audit gratuit déjà utilisé. Créez un compte pour continuer — 2 crédits offerts.", requiresSignup: true },
      { status: 429 }
    );
  }

  const auditId = await convex.mutation(api.audits.create, { url });

  // Enregistrer l'utilisation anonyme
  await convex.mutation(api.audits.recordAnonymousAudit, { ip, auditId });

  after(async () => {
    try {
      const result = await runAudit(url);
      await convex.mutation(api.audits.updateResult, {
        id: auditId,
        statut: "terminé",
        scores: result.scores,
        details: result.details,
        recommandations: result.recommandations.map((r) => JSON.stringify(r)),
      });
    } catch (err) {
      await convex.mutation(api.audits.updateResult, { id: auditId, statut: "erreur" });
      console.error("[audit] error for", url, err);
    }
  });

  return NextResponse.json({ auditId });
}
