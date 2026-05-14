import { Moneroo } from "moneroo";

export const moneroo = new Moneroo({
  secretKey: process.env.MONEROO_SECRET_KEY!,
  webhookSecret: process.env.MONEROO_WEBHOOK_SECRET,
});

export { CREDIT_PACKS, type PackId, type CreditPack } from "./credit-packs";
