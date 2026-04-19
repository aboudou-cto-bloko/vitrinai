import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("campagnes").order("desc").take(50);
  },
});

export const listByNiche = query({
  args: { nicheId: v.id("niches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campagnes")
      .withIndex("by_niche", (q) => q.eq("nicheId", args.nicheId))
      .order("desc")
      .take(20);
  },
});

export const create = mutation({
  args: {
    nicheId: v.id("niches"),
    type: v.string(),
    dateExecution: v.number(),
    nombreCible: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("campagnes", {
      ...args,
      statut: "planifiée",
      nombreEnvoyes: 0,
      nombreErreurs: 0,
    });
  },
});

export const updateProgress = mutation({
  args: {
    id: v.id("campagnes"),
    nombreEnvoyes: v.number(),
    nombreErreurs: v.number(),
    statut: v.optional(v.string()),
    log: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const campagne = await ctx.db.get(args.id);
    if (!campagne) return;
    const logs = campagne.logs ?? [];
    if (args.log) logs.push(`[${new Date().toISOString()}] ${args.log}`);
    await ctx.db.patch(args.id, {
      nombreEnvoyes: args.nombreEnvoyes,
      nombreErreurs: args.nombreErreurs,
      ...(args.statut && { statut: args.statut }),
      logs,
    });
  },
});

export const updateStatut = mutation({
  args: { id: v.id("campagnes"), statut: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { statut: args.statut });
  },
});
