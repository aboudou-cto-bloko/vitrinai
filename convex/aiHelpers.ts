import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ────────────────────────────────────────────────────────────────────

export const getUserBySubject = internalQuery({
  args: { subject: v.string() },
  handler: async (ctx, { subject }) => {
    return ctx.db
      .query("users")
      .withIndex("by_better_auth_user_id", (q) => q.eq("better_auth_user_id", subject))
      .unique();
  },
});

export const getAuditById = internalQuery({
  args: { auditId: v.id("audits") },
  handler: async (ctx, { auditId }) => ctx.db.get(auditId),
});

export const getSuiviByUrl = internalQuery({
  args: { url: v.string(), userId: v.id("users") },
  handler: async (ctx, { url, userId }) => {
    return ctx.db
      .query("suivis")
      .withIndex("by_url", (q) => q.eq("url", url))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────────

export const deductAndSave = internalMutation({
  args: {
    userId: v.id("users"),
    auditId: v.id("audits"),
    cost: v.number(),
    description: v.string(),
    patch: v.any(),
  },
  handler: async (ctx, { userId, auditId, cost, description, patch }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.role !== "admin") {
      const balanceAfter = user.creditsBalance - cost;
      await ctx.db.patch(userId, { creditsBalance: balanceAfter });
      await ctx.db.insert("creditTransactions", {
        userId,
        type: "debit",
        amount: -cost,
        balanceAfter,
        description,
        auditId,
        createdAt: Date.now(),
      });
    }
    await ctx.db.patch(auditId, patch);
  },
});

export const saveAuditPatch = internalMutation({
  args: { auditId: v.id("audits"), patch: v.any() },
  handler: async (ctx, { auditId, patch }) => {
    await ctx.db.patch(auditId, patch);
  },
});

export const createSuivi = internalMutation({
  args: {
    auditId: v.id("audits"),
    userId: v.id("users"),
    url: v.string(),
    score: v.number(),
    grade: v.string(),
    cost: v.number(),
  },
  handler: async (ctx, { auditId, userId, url, score, grade, cost }) => {
    const existing = await ctx.db
      .query("suivis")
      .withIndex("by_url", (q) => q.eq("url", url))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        actif: true,
        prochainAudit: Date.now() + 30 * 24 * 3600 * 1000,
      });
      return existing._id;
    }

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.role !== "admin") {
      const balanceAfter = user.creditsBalance - cost;
      await ctx.db.patch(userId, { creditsBalance: balanceAfter });
      await ctx.db.insert("creditTransactions", {
        userId,
        type: "debit",
        amount: -cost,
        balanceAfter,
        description: `Suivi mensuel activé — ${url}`,
        auditId,
        createdAt: Date.now(),
      });
    }

    return ctx.db.insert("suivis", {
      auditId,
      userId,
      url,
      actif: true,
      dernierScore: score,
      dernierGrade: grade,
      createdAt: Date.now(),
      prochainAudit: Date.now() + 30 * 24 * 3600 * 1000,
    });
  },
});
