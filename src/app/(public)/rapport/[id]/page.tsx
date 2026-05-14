import { notFound } from "next/navigation";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { RapportPoller } from "./RapportPoller";
import { RapportContent } from "./RapportContent";
import { RapportUpsell } from "./RapportUpsell";
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
  if (result.state !== "done") {
    return {
      title: "Rapport d'audit",
      robots: { index: false, follow: false },
    };
  }
  const { data } = result;
  const hostname = new URL(data.url).hostname;
  const grade = data.scores.grade;
  const global = data.scores.global;

  const gradeLabel: Record<string, string> = {
    A: "Excellent", B: "Bon", C: "Moyen", D: "Faible", F: "Critique",
  };

  return {
    title: `Rapport de présence digitale — ${hostname}`,
    description: `${hostname} obtient un score de ${global}/100 (Grade ${grade} — ${gradeLabel[grade] ?? grade}). SEO, performance, présence sociale, simulation 4G AOF analysés par VitrinAI.`,
    alternates: {
      canonical: `/rapport/${id}`,
    },
    openGraph: {
      title: `Rapport VitrinAI — ${hostname}`,
      description: `Score ${global}/100 · Grade ${grade} · ${gradeLabel[grade] ?? grade}. SEO, Core Web Vitals, présence sociale, simulation 4G AOF.`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `Rapport VitrinAI — ${hostname} · ${global}/100`,
      description: `Grade ${grade} — ${gradeLabel[grade] ?? grade}. Analyse complète : SEO, performance, présence sociale, simulation réseau 4G Afrique de l'Ouest.`,
    },
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
    <>
      <RapportContent
        url={url}
        scores={scores}
        details={details}
        recommandations={recommandations}
        hostname={hostname}
      />
      <RapportUpsell analyzedUrl={url} />
    </>
  );
}
