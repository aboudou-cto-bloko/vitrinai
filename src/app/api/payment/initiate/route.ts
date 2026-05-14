import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { moneroo, CREDIT_PACKS, type PackId } from "@/lib/moneroo";
import { isAuthenticated, fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { packId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const packId = body.packId as PackId | undefined;
  if (!packId || !(packId in CREDIT_PACKS)) {
    return NextResponse.json({ error: "Pack invalide" }, { status: 400 });
  }

  const pack = CREDIT_PACKS[packId];

  // Récupérer l'utilisateur connecté via Better Auth → Convex
  const user = await fetchAuthQuery(api.credits.getMe);
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const payment = await moneroo.payments.initialize({
    amount: pack.price,
    currency: "XOF",
    description: `VitrinAI — Pack ${pack.label} (${pack.credits} crédits)`,
    return_url: `${appUrl}/credits/confirmation?pack=${packId}`,
    customer: {
      email: user.email,
      first_name: user.name ?? user.email.split("@")[0] ?? "Client",
      last_name: "",
    },
    metadata: {
      userId: String(user._id),
      packId,
      credits: String(pack.credits),
    },
  });

  // Enregistrer le paiement en attente
  await fetchAuthMutation(api.payments.createPending, {
    monerooPaymentId: payment.data.id,
    packId,
    credits: pack.credits,
    montant: pack.price,
  });

  return NextResponse.json({ checkoutUrl: payment.data.checkout_url });
}
