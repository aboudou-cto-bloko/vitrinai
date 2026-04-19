import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    url: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("audits", {
      url: args.url,
      userId: args.userId,
      statut: "en_cours",
      createdAt: Date.now(),
    });
  },
});

export const updateResult = mutation({
  args: {
    id: v.id("audits"),
    statut: v.string(),
    scores: v.optional(
      v.object({
        technique: v.number(),
        seo: v.number(),
        presence: v.number(),
        ux: v.number(),
        global: v.number(),
        grade: v.string(),
      })
    ),
    details: v.optional(v.any()),
    recommandations: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, ...patch }) => {
    await ctx.db.patch(id, patch);
  },
});

export const getById = query({
  args: { id: v.id("audits") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
