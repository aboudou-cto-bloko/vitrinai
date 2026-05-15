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

// ── Personnalisation du thème (coûte des crédits pour les presets premium) ───

const PRESET_CREDIT_COSTS: Record<string, number> = {
  standard: 0,
  corporate: 3,
  modern: 3,
  brand: 5,
};

export const applyTheme = mutation({
  args: {
    auditId: v.id("audits"),
    preset: v.string(),
    companyName: v.optional(v.string()),
    accentHex: v.optional(v.string()),
    headerBg: v.optional(v.string()),
    fontChoice: v.optional(v.string()),
  },
  handler: async (ctx, { auditId, preset, companyName, accentHex, headerBg, fontChoice }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    const audit = await ctx.db.get(auditId);
    if (!audit) throw new Error("Audit introuvable");

    const user = await ctx.db
      .query("users")
      .withIndex("by_better_auth_user_id", (q) =>
        q.eq("better_auth_user_id", identity.subject)
      )
      .unique();
    if (!user) throw new Error("Utilisateur introuvable");
    if (audit.userId !== user._id) throw new Error("Non autorisé");

    const cost = PRESET_CREDIT_COSTS[preset] ?? 0;

    // Facturer uniquement si on change vers un preset différent (ou si aucun thème)
    const currentPreset = audit.theme?.preset ?? "standard";
    if (cost > 0 && currentPreset !== preset) {
      if (user.creditsBalance < cost) throw new Error("Solde insuffisant");
      const balanceAfter = user.creditsBalance - cost;
      await ctx.db.patch(user._id, { creditsBalance: balanceAfter });
      await ctx.db.insert("creditTransactions", {
        userId: user._id,
        type: "debit",
        amount: -cost,
        balanceAfter,
        description: `Thème rapport "${preset}" appliqué`,
        auditId,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(auditId, {
      theme: { preset, companyName, accentHex, headerBg, fontChoice },
    });

    return { success: true };
  },
});

// ── Admin : statistiques globales des analyses ────────────────────────────────

export const getAuditStats = query({
  args: {},
  handler: async (ctx) => {
    const audits = await ctx.db.query("audits").order("desc").take(2000);

    const now = Date.now();
    const msDay = 86_400_000;
    const startOfToday = now - (now % msDay);
    const startOfWeek = startOfToday - 6 * msDay;
    const startOfMonth = startOfToday - 29 * msDay;

    let thisWeek = 0;
    let thisMonth = 0;
    let termines = 0;
    let erreurs = 0;
    let enCours = 0;

    const byGrade: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    const scoresSums = { technique: 0, seo: 0, presence: 0, ux: 0, global: 0 };
    let scoredCount = 0;

    // Volume par jour (30 derniers jours) : clé = "YYYY-MM-DD"
    const volumeByDay: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(startOfMonth + i * msDay);
      volumeByDay[d.toISOString().slice(0, 10)] = 0;
    }

    // Fréquence par hostname
    const domainCount: Record<string, number> = {};

    for (const audit of audits) {
      if (audit.createdAt >= startOfWeek) thisWeek++;
      if (audit.createdAt >= startOfMonth) thisMonth++;

      if (audit.statut === "terminé") termines++;
      else if (audit.statut === "erreur") erreurs++;
      else enCours++;

      if (audit.scores) {
        const g = audit.scores.grade;
        if (g in byGrade) byGrade[g]++;
        scoresSums.technique += audit.scores.technique;
        scoresSums.seo += audit.scores.seo;
        scoresSums.presence += audit.scores.presence;
        scoresSums.ux += audit.scores.ux;
        scoresSums.global += audit.scores.global;
        scoredCount++;
      }

      if (audit.createdAt >= startOfMonth) {
        const key = new Date(audit.createdAt).toISOString().slice(0, 10);
        if (key in volumeByDay) volumeByDay[key]++;
      }

      try {
        const hostname = new URL(audit.url.startsWith("http") ? audit.url : `https://${audit.url}`).hostname.replace(/^www\./, "");
        domainCount[hostname] = (domainCount[hostname] ?? 0) + 1;
      } catch {
        // URL malformée ignorée
      }
    }

    const scoresMoyens = scoredCount > 0
      ? {
          technique: Math.round(scoresSums.technique / scoredCount),
          seo: Math.round(scoresSums.seo / scoredCount),
          presence: Math.round(scoresSums.presence / scoredCount),
          ux: Math.round(scoresSums.ux / scoredCount),
          global: Math.round(scoresSums.global / scoredCount),
        }
      : null;

    const topDomaines = Object.entries(domainCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([hostname, count]) => ({ hostname, count }));

    const volumeJours = Object.entries(volumeByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const recents = audits.slice(0, 15).map((a) => ({
      _id: a._id,
      url: a.url,
      statut: a.statut,
      grade: a.scores?.grade ?? null,
      global: a.scores?.global ?? null,
      createdAt: a.createdAt,
    }));

    return {
      total: audits.length,
      thisWeek,
      thisMonth,
      termines,
      erreurs,
      enCours,
      tauxReussite: audits.length > 0 ? Math.round((termines / audits.length) * 100) : 0,
      byGrade,
      scoresMoyens,
      topDomaines,
      volumeJours,
      recents,
    };
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
