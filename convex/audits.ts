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

// ── Historique des audits de l'utilisateur connecté ──────────────────────────

export const getMyAudits = query({
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
      .query("audits")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

// ── Audit anonyme (1 gratuit par IP) ─────────────────────────────────────────

export const hasAnonymousAudit = query({
  args: { ip: v.string() },
  handler: async (ctx, { ip }) => {
    const entry = await ctx.db
      .query("anonymousAudits")
      .withIndex("by_ip", (q) => q.eq("ip", ip))
      .first();
    return entry !== null;
  },
});

export const recordAnonymousAudit = mutation({
  args: { ip: v.string(), auditId: v.id("audits") },
  handler: async (ctx, { ip, auditId }) => {
    await ctx.db.insert("anonymousAudits", {
      ip,
      auditId,
      createdAt: Date.now(),
    });
  },
});

// ── Dernier audit terminé pour une URL donnée (cache) ────────────────────────

export const getLatestByUrl = query({
  args: { url: v.string() },
  handler: async (ctx, { url }) => {
    return ctx.db
      .query("audits")
      .withIndex("by_url", (q) => q.eq("url", url))
      .filter((q) => q.eq(q.field("statut"), "terminé"))
      .order("desc")
      .first();
  },
});
