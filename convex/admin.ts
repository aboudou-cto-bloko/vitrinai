import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";

// ── Helper ────────────────────────────────────────────────────────────────────

async function requireAdmin(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Non authentifié");
  const user = await ctx.db
    .query("users")
    .withIndex("by_better_auth_user_id", (q) =>
      q.eq("better_auth_user_id", identity.subject)
    )
    .unique();
  if (!user || user.role !== "admin") throw new Error("Accès refusé");
  return user;
}

// ── Admin : attribuer des crédits à un utilisateur ────────────────────────────

export const grantCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { userId, amount, note }) => {
    await requireAdmin(ctx);

    const target = await ctx.db.get(userId);
    if (!target) throw new Error("Utilisateur introuvable");

    const balanceAfter = target.creditsBalance + amount;
    await ctx.db.patch(userId, { creditsBalance: balanceAfter });

    await ctx.db.insert("creditTransactions", {
      userId,
      type: "bonus",
      amount,
      balanceAfter,
      description: note ?? `Attribution admin — ${amount} crédits`,
      createdAt: Date.now(),
    });

    return balanceAfter;
  },
});

// ── Admin : codes promo ───────────────────────────────────────────────────────

export const listPromoCodes = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("promoCodes").order("desc").take(200);
  },
});

export const createPromoCode = mutation({
  args: {
    code: v.string(),
    credits: v.number(),
    usesMax: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, { code, credits, usesMax, expiresAt }) => {
    const admin = await requireAdmin(ctx);

    const normalized = code.trim().toUpperCase();
    if (normalized.length < 3) throw new Error("Code trop court");

    const existing = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .unique();
    if (existing) throw new Error("Ce code existe déjà");

    return ctx.db.insert("promoCodes", {
      code: normalized,
      credits,
      usesMax,
      usesCount: 0,
      expiresAt,
      active: true,
      createdBy: admin._id,
      createdAt: Date.now(),
    });
  },
});

export const togglePromoCode = mutation({
  args: { codeId: v.id("promoCodes") },
  handler: async (ctx, { codeId }) => {
    await requireAdmin(ctx);
    const promo = await ctx.db.get(codeId);
    if (!promo) throw new Error("Code introuvable");
    await ctx.db.patch(codeId, { active: !promo.active });
  },
});

// ── User : utiliser un code promo ─────────────────────────────────────────────

export const redeemPromoCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    const user = await ctx.db
      .query("users")
      .withIndex("by_better_auth_user_id", (q) =>
        q.eq("better_auth_user_id", identity.subject)
      )
      .unique();
    if (!user) throw new Error("Utilisateur introuvable");

    const promo = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
      .unique();

    if (!promo) throw new Error("Code invalide");
    if (!promo.active) throw new Error("Ce code n'est plus actif");
    if (promo.expiresAt != null && promo.expiresAt < Date.now()) throw new Error("Ce code a expiré");
    if (promo.usesMax != null && promo.usesCount >= promo.usesMax)
      throw new Error("Ce code a atteint sa limite d'utilisation");

    const alreadyUsed = await ctx.db
      .query("promoRedemptions")
      .withIndex("by_user_code", (q) =>
        q.eq("userId", user._id).eq("codeId", promo._id)
      )
      .unique();
    if (alreadyUsed) throw new Error("Vous avez déjà utilisé ce code");

    const balanceAfter = user.creditsBalance + promo.credits;
    await ctx.db.patch(user._id, { creditsBalance: balanceAfter });

    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      type: "bonus",
      amount: promo.credits,
      balanceAfter,
      description: `Code promo ${promo.code} — ${promo.credits} crédits`,
      createdAt: Date.now(),
    });

    await ctx.db.patch(promo._id, { usesCount: promo.usesCount + 1 });

    await ctx.db.insert("promoRedemptions", {
      codeId: promo._id,
      userId: user._id,
      createdAt: Date.now(),
    });

    return { credits: promo.credits, balanceAfter };
  },
});
