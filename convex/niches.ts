import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("niches").order("desc").take(100);
  },
});

export const getById = query({
  args: { id: v.id("niches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    nom: v.string(),
    secteur: v.string(),
    ville: v.string(),
    pays: v.string(),
    rayon: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("niches", {
      ...args,
      statut: "en_attente",
      totalLeads: 0,
      leadsSansSite: 0,
      leadsContactes: 0,
      leadsConvertis: 0,
      createdAt: Date.now(),
    });
  },
});

export const updateStatut = mutation({
  args: { id: v.id("niches"), statut: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { statut: args.statut });
  },
});

export const incrementStats = mutation({
  args: {
    id: v.id("niches"),
    totalLeads: v.optional(v.number()),
    leadsSansSite: v.optional(v.number()),
    leadsContactes: v.optional(v.number()),
    leadsConvertis: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const niche = await ctx.db.get(args.id);
    if (!niche) return;
    await ctx.db.patch(args.id, {
      totalLeads: niche.totalLeads + (args.totalLeads ?? 0),
      leadsSansSite: niche.leadsSansSite + (args.leadsSansSite ?? 0),
      leadsContactes: niche.leadsContactes + (args.leadsContactes ?? 0),
      leadsConvertis: niche.leadsConvertis + (args.leadsConvertis ?? 0),
    });
  },
});
