import { cronJobs } from "convex/server";
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ── Queries / mutations pour le cron ──────────────────────────────────────────

export const getSuivisDus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return ctx.db
      .query("suivis")
      .withIndex("by_prochainAudit", (q) => q.lte("prochainAudit", now))
      .filter((q) => q.eq(q.field("actif"), true))
      .take(20);
  },
});

export const updateSuiviApresAudit = internalMutation({
  args: {
    suiviId: v.id("suivis"),
    newAuditId: v.id("audits"),
    score: v.number(),
    grade: v.string(),
  },
  handler: async (ctx, { suiviId, newAuditId, score, grade }) => {
    await ctx.db.patch(suiviId, {
      auditId: newAuditId,
      dernierScore: score,
      dernierGrade: grade,
      prochainAudit: Date.now() + 30 * 24 * 3600 * 1000,
    });
  },
});

export const createSuiviAudit = internalMutation({
  args: {
    userId: v.id("users"),
    url: v.string(),
    scores: v.any(),
  },
  handler: async (ctx, { userId, url, scores }) => {
    return ctx.db.insert("audits", {
      userId,
      url,
      statut: "terminé",
      scores,
      createdAt: Date.now(),
    });
  },
});

// ── Cron — chaque nuit à 3h UTC ───────────────────────────────────────────────

const crons = cronJobs();

crons.daily(
  "suivi-mensuel-check",
  { hourUTC: 3, minuteUTC: 0 },
  internal.suiviAction.processSuivisMensuels,
);

export default crons;
