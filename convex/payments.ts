import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Mutation authentifiée : crée le paiement en attente lié à l'utilisateur connecté
export const createPending = mutation({
  args: {
    monerooPaymentId: v.string(),
    packId: v.string(),
    credits: v.number(),
    montant: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    const user = await ctx.db
      .query("users")
      .withIndex("by_better_auth_user_id", (q) =>
        q.eq("better_auth_user_id", identity.subject)
      )
      .unique();
    if (!user) throw new Error("Utilisateur introuvable");

    return ctx.db.insert("paiements", {
      userId: user._id,
      monerooPaymentId: args.monerooPaymentId,
      packId: args.packId,
      credits: args.credits,
      montant: args.montant,
      devise: "XOF",
      statut: "en_attente",
      createdAt: Date.now(),
    });
  },
});

// Requête : historique des paiements de l'utilisateur connecté
export const getMyPaiements = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_better_auth_user_id", (q) =>
        q.eq("better_auth_user_id", identity.subject)
      )
      .unique();
    if (!user) return [];

    return ctx.db
      .query("paiements")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
  },
});
