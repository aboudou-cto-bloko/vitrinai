import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { runAudit } from "@/lib/audit";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const raw = body.url?.trim();
  if (!raw) {
    return NextResponse.json({ error: "URL manquante" }, { status: 400 });
  }

  // Basic URL sanity check
  let url: string;
  try {
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    new URL(normalized);
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
