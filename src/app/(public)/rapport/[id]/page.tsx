import { notFound } from "next/navigation";
import { RapportPoller } from "./RapportPoller";
import { RapportContent } from "./RapportContent";
import type { Metadata } from "next";
import type { AuditDetails, AuditScores, Recommandation } from "@/lib/audit/types";

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
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/audit/status/${id}`, { cache: "no-store" });
    if (!res.ok) return { state: "error" };
    const data = await res.json();
    if (data.statut === "en_cours") return { state: "pending" };
    if (data.statut !== "terminé") return { state: "error" };
    return { state: "done", data: data as AuditData };
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
