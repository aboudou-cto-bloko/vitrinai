import { notFound } from "next/navigation";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { RapportPoller } from "./RapportPoller";
import { RapportContent } from "./RapportContent";
import type { Metadata } from "next";
import type { AuditDetails, AuditScores, Recommandation } from "@/lib/audit/types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface AuditData {
  url: string;
  scores: AuditScores;
  details: AuditDetails;
  recommandations: Recommandation[];
  createdAt: number;
}

type FetchResult =
  | { state: "done"; data: AuditData }
  | { state: "pending" }
  | { state: "error" };

async function fetchAudit(id: string): Promise<FetchResult> {
  try {
    const audit = await convex.query(api.audits.getById, {
      id: id as Id<"audits">,
    });
    if (!audit) return { state: "error" };
    if (audit.statut === "en_cours") return { state: "pending" };
    if (audit.statut !== "terminé" || !audit.scores) return { state: "error" };

    const recommandations: Recommandation[] = (audit.recommandations ?? [])
      .map((r: string) => { try { return JSON.parse(r); } catch { return null; } })
      .filter(Boolean);

    return {
      state: "done",
      data: {
        url: audit.url,
        scores: audit.scores as AuditScores,
        details: audit.details as AuditDetails,
        recommandations,
        createdAt: audit.createdAt,
      },
    };
  } catch {
    return { state: "error" };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchAudit(id);
  if (result.state !== "done") return { title: "Rapport — VitrinAI" };
  const { data } = result;
  return {
    title: `Rapport d'audit — ${new URL(data.url).hostname} | VitrinAI`,
    description: `Score global ${data.scores.global}/100 · Grade ${data.scores.grade}`,
  };
}

export default async function RapportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchAudit(id);
  if (result.state === "error") notFound();
  if (result.state === "pending") return <RapportPoller id={id} />;

  const { url, scores, details, recommandations } = result.data;
  const hostname = new URL(url).hostname;

  return (
    <RapportContent
      url={url}
      scores={scores}
      details={details}
      recommandations={recommandations}
      hostname={hostname}
    />
  );
}
