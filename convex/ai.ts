"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const ACTION_PLAN_COST = 5;
const BADGE_COST = 2;
const CONCURRENT_COST = 15;
const SUIVI_COST = 3;

async function groqJSON<T>(prompt: string, apiKey: string): Promise<T> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return JSON.parse(data.choices[0].message.content) as T;
}

async function groqText(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content.trim();
}

// ════════════════════════════════════════════════════════════════════════════
// 1. PLAN D'ACTION IA — 5 crédits
// ════════════════════════════════════════════════════════════════════════════

interface ActionStep {
  numero: number;
  titre: string;
  description: string;
  effort: string;
  impact: string;
  axe: string;
}

export const generateActionPlan = action({
  args: { auditId: v.id("audits") },
  returns: v.array(v.object({
    numero: v.number(),
    titre: v.string(),
    description: v.string(),
    effort: v.string(),
    impact: v.string(),
    axe: v.string(),
  })),
  handler: async (ctx, { auditId }): Promise<ActionStep[]> => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY non configurée");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    const user = await ctx.runQuery(internal.aiHelpers.getUserBySubject, { subject: identity.subject });
    if (!user) throw new Error("Utilisateur introuvable");
    if (user.creditsBalance < ACTION_PLAN_COST) throw new Error("Solde insuffisant");

    const audit = await ctx.runQuery(internal.aiHelpers.getAuditById, { auditId });
    if (!audit || audit.statut !== "terminé") throw new Error("Audit introuvable ou non terminé");
    if (audit.actionPlan) return audit.actionPlan as ActionStep[];

    const checks: string[] = [];
    if (audit.details && typeof audit.details === "object") {
      const details = audit.details as Record<string, { checks?: Array<{ label: string; status: string; impact: string }> }>;
      for (const axe of ["technique", "seo", "presence", "ux"]) {
        const axeData = details[axe];
        if (axeData?.checks) {
          for (const c of axeData.checks) {
            if (c.status === "fail") checks.push(`[${axe}] ${c.label} (impact: ${c.impact})`);
          }
        }
      }
    }

    const scores = audit.scores as { technique: number; seo: number; presence: number; ux: number; global: number; grade: string } | undefined;

    const prompt = `Tu es un consultant en marketing digital spécialisé dans les PME d'Afrique de l'Ouest.

Voici les résultats d'un audit de présence digitale pour le site : ${audit.url}

SCORES :
- Global : ${scores?.global}/100 (Grade ${scores?.grade})
- Technique & Sécurité : ${scores?.technique}/30
- SEO : ${scores?.seo}/30
- Présence en ligne : ${scores?.presence}/25
- Expérience visiteur : ${scores?.ux}/15

PROBLÈMES DÉTECTÉS :
${checks.slice(0, 15).join("\n") || "Aucun problème critique détecté."}

Génère un plan d'action concret en 5 étapes prioritaires pour améliorer la présence digitale.
Adapte tes conseils au contexte africain (mobile-first, réseau 4G, WhatsApp Business, Google Maps local).

Réponds UNIQUEMENT en JSON :
{
  "steps": [
    {
      "numero": 1,
      "titre": "Titre court et précis (max 8 mots)",
      "description": "2-3 phrases concrètes, accessibles, actionnables immédiatement",
      "effort": "rapide",
      "impact": "fort",
      "axe": "technique"
    }
  ]
}
Les valeurs possibles : effort = rapide|moyen|complexe · impact = fort|moyen|faible · axe = technique|seo|presence|ux`;

    const result = await groqJSON<{ steps: ActionStep[] }>(prompt, apiKey);
    const steps = result.steps.slice(0, 5);

    await ctx.runMutation(internal.aiHelpers.deductAndSave, {
      userId: user._id,
      auditId,
      cost: ACTION_PLAN_COST,
      description: "Plan d'action IA généré",
      patch: { actionPlan: steps },
    });

    return steps;
  },
});

// ════════════════════════════════════════════════════════════════════════════
// 2. BADGE — 2 crédits
// ════════════════════════════════════════════════════════════════════════════

export const unlockBadge = action({
  args: { auditId: v.id("audits") },
  handler: async (ctx, { auditId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    const user = await ctx.runQuery(internal.aiHelpers.getUserBySubject, { subject: identity.subject });
    if (!user) throw new Error("Utilisateur introuvable");

    const audit = await ctx.runQuery(internal.aiHelpers.getAuditById, { auditId });
    if (!audit || audit.userId !== user._id) throw new Error("Non autorisé");
    if (audit.badgeUnlocked) return true;

    if (user.creditsBalance < BADGE_COST) throw new Error("Solde insuffisant");

    await ctx.runMutation(internal.aiHelpers.deductAndSave, {
      userId: user._id,
      auditId,
      cost: BADGE_COST,
      description: "Badge digital déverrouillé",
      patch: { badgeUnlocked: true },
    });

    return true;
  },
});

// ════════════════════════════════════════════════════════════════════════════
// 3. SUIVI MENSUEL — 3 crédits
// ════════════════════════════════════════════════════════════════════════════

export const activerSuivi = action({
  args: { auditId: v.id("audits") },
  handler: async (ctx, { auditId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    const user = await ctx.runQuery(internal.aiHelpers.getUserBySubject, { subject: identity.subject });
    if (!user) throw new Error("Utilisateur introuvable");
    if (user.creditsBalance < SUIVI_COST) throw new Error("Solde insuffisant");

    const audit = await ctx.runQuery(internal.aiHelpers.getAuditById, { auditId });
    if (!audit || audit.userId !== user._id) throw new Error("Non autorisé");
    if (audit.statut !== "terminé" || !audit.scores) throw new Error("Audit non terminé");

    const scores = audit.scores as { global: number; grade: string };

    await ctx.runMutation(internal.aiHelpers.createSuivi, {
      auditId,
      userId: user._id,
      url: audit.url,
      score: scores.global,
      grade: scores.grade,
      cost: SUIVI_COST,
    });

    return true;
  },
});

// ════════════════════════════════════════════════════════════════════════════
// 4. ANALYSE CONCURRENTIELLE — 15 crédits
// ════════════════════════════════════════════════════════════════════════════

export const lancerAnalyseConcurrentielle = action({
  args: {
    auditId: v.id("audits"),
    concurrentUrls: v.array(v.string()),
  },
  handler: async (ctx, { auditId, concurrentUrls }) => {
    if (concurrentUrls.length < 1 || concurrentUrls.length > 2) {
      throw new Error("1 à 2 concurrents requis");
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY non configurée");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    const user = await ctx.runQuery(internal.aiHelpers.getUserBySubject, { subject: identity.subject });
    if (!user) throw new Error("Utilisateur introuvable");
    if (user.creditsBalance < CONCURRENT_COST) throw new Error("Solde insuffisant");

    const audit = await ctx.runQuery(internal.aiHelpers.getAuditById, { auditId });
    if (!audit || audit.userId !== user._id) throw new Error("Non autorisé");
    if (audit.statut !== "terminé" || !audit.scores) throw new Error("Audit non terminé");

    await ctx.runMutation(internal.aiHelpers.saveAuditPatch, {
      auditId,
      patch: { concurrentAnalysis: { urls: concurrentUrls, status: "pending" } },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const concurrentResults: Array<{
      url: string;
      scores: Record<string, number | string>;
      grade: string;
      global: number;
    }> = [];

    for (const url of concurrentUrls) {
      try {
        const res = await fetch(`${appUrl}/api/audit/concurrent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!res.ok) continue;
        const data = await res.json() as {
          scores?: { global: number; grade: string; technique: number; seo: number; presence: number; ux: number };
        };
        if (data.scores) {
          concurrentResults.push({
            url,
            scores: data.scores as Record<string, number | string>,
            grade: data.scores.grade,
            global: data.scores.global,
          });
        }
      } catch {
        // concurrent non joignable, on continue
      }
    }

    const mainScores = audit.scores as { global: number; grade: string; technique: number; seo: number; presence: number; ux: number };
    const lignes = [
      `Votre site (${audit.url}) : ${mainScores.global}/100 · Technique ${mainScores.technique}/30 · SEO ${mainScores.seo}/30 · Présence ${mainScores.presence}/25 · UX ${mainScores.ux}/15`,
      ...concurrentResults.map((c) => {
        const s = c.scores as Record<string, number>;
        return `Concurrent (${c.url}) : ${c.global}/100 · Technique ${s.technique}/30 · SEO ${s.seo}/30 · Présence ${s.presence}/25 · UX ${s.ux}/15`;
      }),
    ].join("\n");

    const synthesePrompt = `Tu es un consultant en marketing digital pour les PME d'Afrique de l'Ouest.

Comparaison de présence digitale :
${lignes}

En 4-5 phrases percutantes et professionnelles (sans liste, sans titre) :
- Dis si ce site est en avance ou en retard sur ses concurrents
- Identifie les 2-3 axes où l'écart est le plus fort
- Donne 1 recommandation stratégique concrète

Réponds en français, ton consultant expert, phrases directes.`;

    let synthese = "";
    try {
      synthese = await groqText(synthesePrompt, apiKey);
    } catch {
      synthese = "Synthèse indisponible — les scores sont visibles dans le tableau.";
    }

    await ctx.runMutation(internal.aiHelpers.deductAndSave, {
      userId: user._id,
      auditId,
      cost: CONCURRENT_COST,
      description: `Analyse concurrentielle — ${concurrentUrls.join(", ")}`,
      patch: {
        concurrentAnalysis: {
          urls: concurrentUrls,
          status: "done",
          results: concurrentResults,
          synthese,
        },
      },
    });

    return { results: concurrentResults, synthese };
  },
});
