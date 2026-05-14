import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Better Auth tables (gérées par @convex-dev/better-auth) ──────────────────
  authUsers: defineTable({
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  authSessions: defineTable({
    userId: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  authAccounts: defineTable({
    userId: v.string(),
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    password: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  authVerifications: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_identifier", ["identifier"]),

  // ── App users (liés à authUsers via better_auth_user_id) ────────────────────
  users: defineTable({
    better_auth_user_id: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.string(), // "user" | "admin"
    creditsBalance: v.number(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_better_auth_user_id", ["better_auth_user_id"]),

  // ── Audits ───────────────────────────────────────────────────────────────────
  audits: defineTable({
    userId: v.optional(v.id("users")),
    url: v.string(),
    statut: v.string(), // "en_cours" | "terminé" | "erreur"
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
    theme: v.optional(v.object({
      preset: v.string(),
      companyName: v.optional(v.string()),
      accentHex: v.optional(v.string()),
    })),
    createdAt: v.number(),
  })
    .index("by_url", ["url"])
    .index("by_userId", ["userId"]),

  // ── Suivi des audits anonymes (1 gratuit par IP) ────────────────────────────
  anonymousAudits: defineTable({
    ip: v.string(),
    auditId: v.id("audits"),
    createdAt: v.number(),
  }).index("by_ip", ["ip"]),

  // ── Transactions de crédits (journal) ────────────────────────────────────────
  creditTransactions: defineTable({
    userId: v.id("users"),
    type: v.string(), // "achat" | "debit" | "bonus"
    amount: v.number(), // positif = crédit, négatif = débit
    balanceAfter: v.number(),
    description: v.string(),
    monerooPaymentId: v.optional(v.string()),
    auditId: v.optional(v.id("audits")),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // ── Paiements Moneroo ────────────────────────────────────────────────────────
  paiements: defineTable({
    userId: v.id("users"),
    monerooPaymentId: v.string(),
    packId: v.string(), // "starter" | "essentiel" | "pro" | "agences"
    credits: v.number(),
    montant: v.number(),
    devise: v.string(), // "XOF"
    statut: v.string(), // "en_attente" | "succès" | "échec"
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_monerooPaymentId", ["monerooPaymentId"]),

  // ── CRM (inchangé) ────────────────────────────────────────────────────────────
  niches: defineTable({
    nom: v.string(),
    secteur: v.string(),
    ville: v.string(),
    pays: v.string(),
    rayon: v.number(),
    statut: v.string(),
    totalLeads: v.number(),
    leadsSansSite: v.number(),
    leadsContactes: v.number(),
    leadsConvertis: v.number(),
    createdAt: v.number(),
  }),

  leads: defineTable({
    nicheId: v.id("niches"),
    nom: v.string(),
    telephone: v.string(),
    adresse: v.optional(v.string()),
    siteWeb: v.optional(v.string()),
    aSiteWeb: v.boolean(),
    noteGoogle: v.optional(v.number()),
    scoreAudit: v.optional(v.number()),
    statutOnboarding: v.string(),
    emailEnvoye: v.boolean(),
    whatsappEnvoye: v.boolean(),
    dateContact: v.optional(v.number()),
    notes: v.optional(v.string()),
    messageEnvoye: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_niche", ["nicheId"])
    .index("by_statut", ["statutOnboarding"])
    .index("by_telephone", ["telephone"]),

  campagnes: defineTable({
    nicheId: v.id("niches"),
    type: v.string(),
    statut: v.string(),
    nombreCible: v.number(),
    nombreEnvoyes: v.number(),
    nombreErreurs: v.number(),
    dateExecution: v.number(),
    dateFinReelle: v.optional(v.number()),
    logs: v.optional(v.array(v.string())),
  }).index("by_niche", ["nicheId"]),
});
