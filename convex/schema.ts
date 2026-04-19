import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    nom: v.optional(v.string()),
    plan: v.string(), // "gratuit" | "pro" | "agences"
    planExpireAt: v.optional(v.number()),
    auditsAujourdhui: v.number(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

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
        grade: v.string(), // "A" | "B" | "C" | "D" | "F"
      })
    ),
    details: v.optional(v.any()),
    recommandations: v.optional(v.array(v.string())),
    createdAt: v.number(),
  }).index("by_url", ["url"]),

  niches: defineTable({
    nom: v.string(),
    secteur: v.string(),
    ville: v.string(),
    pays: v.string(),
    rayon: v.number(),
    statut: v.string(), // "en_attente" | "en_cours" | "terminé" | "en_pause"
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
    statutOnboarding: v.string(), // "nouveau" | "contacté" | "répondu" | "rendez-vous" | "converti" | "refusé"
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
    type: v.string(), // "whatsapp" | "email" | "les_deux"
    statut: v.string(), // "planifiée" | "en_cours" | "terminée" | "suspendue"
    nombreCible: v.number(),
    nombreEnvoyes: v.number(),
    nombreErreurs: v.number(),
    dateExecution: v.number(),
    dateFinReelle: v.optional(v.number()),
    logs: v.optional(v.array(v.string())),
  }).index("by_niche", ["nicheId"]),

  paiements: defineTable({
    userId: v.id("users"),
    monerooPaymentId: v.string(),
    plan: v.string(),
    montant: v.number(),
    devise: v.string(), // "XOF"
    statut: v.string(), // "en_attente" | "succès" | "échec"
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
