import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const listByNiche = query({
  args: { nicheId: v.id("niches"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leads")
      .withIndex("by_niche", (q) => q.eq("nicheId", args.nicheId))
      .paginate(args.paginationOpts);
  },
});

export const listAll = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leads")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const listByStatut = query({
  args: { statutOnboarding: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leads")
      .withIndex("by_statut", (q) =>
        q.eq("statutOnboarding", args.statutOnboarding)
      )
      .take(200);
  },
});

export const create = mutation({
  args: {
    nicheId: v.id("niches"),
    nom: v.string(),
    telephone: v.string(),
    adresse: v.optional(v.string()),
    siteWeb: v.optional(v.string()),
    aSiteWeb: v.boolean(),
    noteGoogle: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_telephone", (q) => q.eq("telephone", args.telephone))
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("leads", {
      ...args,
      statutOnboarding: "nouveau",
      emailEnvoye: false,
      whatsappEnvoye: false,
      createdAt: Date.now(),
    });
  },
});

export const updateStatut = mutation({
  args: { id: v.id("leads"), statutOnboarding: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { statutOnboarding: args.statutOnboarding });
  },
});

export const addNote = mutation({
  args: { id: v.id("leads"), notes: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { notes: args.notes });
  },
});

export const markContacted = mutation({
  args: {
    id: v.id("leads"),
    whatsapp: v.optional(v.boolean()),
    email: v.optional(v.boolean()),
    messageEnvoye: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      statutOnboarding: "contacté",
      dateContact: Date.now(),
    };
    if (args.whatsapp) patch.whatsappEnvoye = true;
    if (args.email) patch.emailEnvoye = true;
    if (args.messageEnvoye) patch.messageEnvoye = args.messageEnvoye;
    await ctx.db.patch(args.id, patch);
  },
});
