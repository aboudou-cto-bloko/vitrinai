"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const processSuivisMensuels = internalAction({
  args: {},
  handler: async (ctx) => {
    const suivis = await ctx.runQuery(internal.crons.getSuivisDus);
    if (suivis.length === 0) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    for (const suivi of suivis) {
      try {
        const res = await fetch(`${appUrl}/api/audit/concurrent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: suivi.url }),
        });

        if (!res.ok) continue;

        const data = await res.json() as {
          scores?: { global: number; grade: string };
        };
        if (!data.scores) continue;

        const newScore = data.scores.global;
        const newGrade = data.scores.grade;
        const prevScore = suivi.dernierScore;

        const newAuditId = await ctx.runMutation(internal.crons.createSuiviAudit, {
          userId: suivi.userId,
          url: suivi.url,
          scores: data.scores,
        });

        await ctx.runMutation(internal.crons.updateSuiviApresAudit, {
          suiviId: suivi._id,
          newAuditId,
          score: newScore,
          grade: newGrade,
        });

        const diff = prevScore !== undefined ? newScore - prevScore : null;
        const diffText = diff !== null
          ? diff > 0 ? ` (+${diff} pts)` : diff < 0 ? ` (${diff} pts)` : " (stable)"
          : "";

        const corps = prevScore !== undefined
          ? `Score actuel : ${newScore}/100 — Grade ${newGrade}${diffText}. Consultez votre nouveau rapport.`
          : `Votre site obtient ${newScore}/100 — Grade ${newGrade}. Consultez votre rapport.`;

        await ctx.runMutation(internal.notifications.createNotification, {
          userId: suivi.userId,
          type: "suivi_mensuel",
          titre: `Rapport mensuel — ${new URL(suivi.url).hostname}`,
          corps,
          lien: `/rapport/${newAuditId}`,
          auditId: newAuditId,
        });

      } catch {
        // Continuer avec le suivant en cas d'erreur
      }
    }
  },
});
