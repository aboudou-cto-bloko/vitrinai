import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let audit;
  try {
    audit = await convex.query(api.audits.getById, {
      id: id as Id<"audits">,
    });
  } catch {
    return NextResponse.json({ error: "Audit introuvable" }, { status: 404 });
  }

  if (!audit) {
    return NextResponse.json({ error: "Audit introuvable" }, { status: 404 });
  }

  if (audit.statut === "en_cours") {
    return NextResponse.json({ statut: "en_cours" });
  }

  if (audit.statut === "erreur") {
    return NextResponse.json({ statut: "erreur" }, { status: 200 });
  }

  // Parse recommandations back from JSON strings
  const recommandations = (audit.recommandations ?? []).map((r: string) => {
    try { return JSON.parse(r); } catch { return null; }
  }).filter(Boolean);

  return NextResponse.json({
    statut: "terminé",
    url: audit.url,
    scores: audit.scores,
    details: audit.details,
    recommandations,
    createdAt: audit.createdAt,
  });
}
