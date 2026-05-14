import { httpAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

// ── Vérification HMAC-SHA256 via Web Crypto (pas besoin de node:crypto) ────────

async function verifyMonerooSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const expected = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return expected === signature;
  } catch {
    return false;
  }
}

// ── Internal mutations ────────────────────────────────────────────────────────

export const updatePaiementStatut = internalMutation({
  args: {
    monerooPaymentId: v.string(),
    statut: v.string(),
  },
  handler: async (ctx, { monerooPaymentId, statut }) => {
    const paiement = await ctx.db
      .query("paiements")
      .withIndex("by_monerooPaymentId", (q) => q.eq("monerooPaymentId", monerooPaymentId))
      .unique();
    if (!paiement) return null;
    await ctx.db.patch(paiement._id, { statut });
    return paiement;
  },
});

// ── Handler webhook HTTP ──────────────────────────────────────────────────────

export const handleMonerooWebhook = httpAction(async (ctx, req) => {
  const webhookSecret = process.env.MONEROO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] MONEROO_WEBHOOK_SECRET manquant");
    return new Response("Configuration error", { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("x-moneroo-signature") ?? "";

  const isValid = await verifyMonerooSignature(body, signature, webhookSecret);
  if (!isValid) {
    console.warn("[webhook] Signature Moneroo invalide");
    return new Response("Invalid signature", { status: 401 });
  }

  let event: { type: string; data: { id: string } };
  try {
    event = JSON.parse(body) as { type: string; data: { id: string } };
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  if (event.type !== "payment.success") {
    return new Response("OK", { status: 200 });
  }

  const paymentId = event.data.id;

  const paiement = await ctx.runMutation(internal.payments.webhooks.updatePaiementStatut, {
    monerooPaymentId: paymentId,
    statut: "succès",
  });

  if (!paiement) {
    console.warn("[webhook] Paiement introuvable:", paymentId);
    return new Response("Payment not found", { status: 404 });
  }

  await ctx.runMutation(internal.credits.creditUser, {
    userId: paiement.userId as Id<"users">,
    amount: paiement.credits,
    type: "achat",
    description: `Pack ${paiement.packId} — ${paiement.credits} crédits`,
    monerooPaymentId: paymentId,
  });

  console.log(`[webhook] ${paiement.credits} crédits ajoutés à ${paiement.userId}`);
  return new Response("OK", { status: 200 });
});
