import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

// ── Utilisateur courant (authentifié via Better Auth) ────────────────────────

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return ctx.db
      .query("users")
      .withIndex("by_better_auth_user_id", (q) =>
        q.eq("better_auth_user_id", identity.subject)
      )
      .unique();
  },
});

export const getUserByBetterAuthId = internalQuery({
  args: { betterAuthUserId: v.string() },
  handler: async (ctx, { betterAuthUserId }) => {
    return ctx.db
      .query("users")
      .withIndex("by_better_auth_user_id", (q) =>
        q.eq("better_auth_user_id", betterAuthUserId)
      )
      .unique();
  },
});

// ── Lecture solde ─────────────────────────────────────────────────────────────

export const getBalance = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user?.creditsBalance ?? 0;
  },
});

export const getHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("creditTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

// ── Fonctions internes (appelées depuis actions/webhooks) ─────────────────────

export const creditUser = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    type: v.string(),
    description: v.string(),
    monerooPaymentId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, amount, type, description, monerooPaymentId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error(`Utilisateur introuvable : ${userId}`);

    const balanceAfter = user.creditsBalance + amount;
    await ctx.db.patch(userId, { creditsBalance: balanceAfter });

    await ctx.db.insert("creditTransactions", {
      userId,
      type,
      amount,
      balanceAfter,
      description,
      monerooPaymentId,
      createdAt: Date.now(),
    });

    return balanceAfter;
  },
});

export const debitCredit = internalMutation({
  args: {
    userId: v.id("users"),
    auditId: v.id("audits"),
    description: v.string(),
  },
  handler: async (ctx, { userId, auditId, description }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error(`Utilisateur introuvable : ${userId}`);
    if (user.role === "admin") return user.creditsBalance;
    if (user.creditsBalance < 1) throw new Error("Solde insuffisant");

    const balanceAfter = user.creditsBalance - 1;
    await ctx.db.patch(userId, { creditsBalance: balanceAfter });

    await ctx.db.insert("creditTransactions", {
      userId,
      type: "debit",
      amount: -1,
      balanceAfter,
      description,
      auditId,
      createdAt: Date.now(),
    });

    return balanceAfter;
  },
});

export const checkBalance = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user?.creditsBalance ?? 0;
  },
});

// ── Débit depuis une mutation authentifiée ────────────────────────────────────

export const debitMeForAudit = mutation({
  args: { auditId: v.id("audits") },
  handler: async (ctx, { auditId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    const user = await ctx.db
      .query("users")
      .withIndex("by_better_auth_user_id", (q) =>
        q.eq("better_auth_user_id", identity.subject)
      )
      .unique();
    if (!user) throw new Error("Utilisateur introuvable");
    if (user.role === "admin") return user.creditsBalance;
    if (user.creditsBalance < 1) throw new Error("Solde insuffisant");

    const balanceAfter = user.creditsBalance - 1;
    await ctx.db.patch(user._id, { creditsBalance: balanceAfter });

    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      type: "debit",
      amount: -1,
      balanceAfter,
      description: "Audit de site web",
      auditId,
      createdAt: Date.now(),
    });

    return balanceAfter;
  },
});

// ── Admin : liste des utilisateurs avec solde ──────────────────────────────────

export const listUsers = query({
  args: {},
  handler: async (ctx, _args) => {
    return ctx.db.query("users").order("desc").take(100);
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx, _args) => {
    const users = await ctx.db.query("users").take(500);
    const paiements = await ctx.db.query("paiements").take(500);
    const audits = await ctx.db.query("audits").take(500);

    const revenus = paiements
      .filter((p) => p.statut === "succès")
      .reduce((sum, p) => sum + p.montant, 0);

    return {
      totalUsers: users.length,
      totalAudits: audits.length,
      totalRevenus: revenus,
      paiementsEnAttente: paiements.filter((p) => p.statut === "en_attente").length,
    };
  },
});
