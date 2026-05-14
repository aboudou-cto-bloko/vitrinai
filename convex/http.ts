import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { handleMonerooWebhook } from "./payments/webhooks";

const http = httpRouter();

// ── Better Auth routes ────────────────────────────────────────────────────────
authComponent.registerRoutes(http, createAuth);

// ── Webhook Moneroo ───────────────────────────────────────────────────────────
http.route({
  path: "/webhooks/moneroo",
  method: "POST",
  handler: handleMonerooWebhook,
});

export default http;
