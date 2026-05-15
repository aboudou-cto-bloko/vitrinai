import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ────────────────────────────────────────────────────────────────────

export const getMine = query({
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
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const user = await ctx.db
      .query("users")
      .withIndex("by_better_auth_user_id", (q) =>
        q.eq("better_auth_user_id", identity.subject)
      )
      .unique();
    if (!user) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_lu", (q) =>
        q.eq("userId", user._id).eq("lu", false)
      )
      .collect();
    return unread.length;
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────────

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");
    await ctx.db.patch(notificationId, { lu: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");
    const user = await ctx.db
      .query("users")
      .withIndex("by_better_auth_user_id", (q) =>
        q.eq("better_auth_user_id", identity.subject)
      )
      .unique();
    if (!user) return;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_lu", (q) =>
        q.eq("userId", user._id).eq("lu", false)
      )
      .collect();
    await Promise.all(unread.map((n) => ctx.db.patch(n._id, { lu: true })));
  },
});

// ── Internal (utilisé par les crons et actions) ────────────────────────────────

export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    titre: v.string(),
    corps: v.string(),
    lien: v.optional(v.string()),
    auditId: v.optional(v.id("audits")),
  },
  handler: async (ctx, { userId, type, titre, corps, lien, auditId }) => {
    return ctx.db.insert("notifications", {
      userId,
      type,
      titre,
      corps,
      lu: false,
      lien,
      auditId,
      createdAt: Date.now(),
    });
  },
});
