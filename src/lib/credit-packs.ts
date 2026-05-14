export const CREDIT_PACKS = {
  starter: {
    id: "starter",
    label: "Starter",
    credits: 5,
    price: 1500,
    description: "Idéal pour tester VitrinAI",
    highlight: false,
  },
  essentiel: {
    id: "essentiel",
    label: "Essentiel",
    credits: 15,
    price: 3900,
    description: "Pour les PME en croissance",
    highlight: false,
  },
  pro: {
    id: "pro",
    label: "Pro",
    credits: 50,
    price: 9900,
    description: "Freelances & petites agences",
    highlight: true,
  },
  agences: {
    id: "agences",
    label: "Agences",
    credits: 200,
    price: 29900,
    description: "Usage intensif, meilleur tarif",
    highlight: false,
  },
} as const;

export type PackId = keyof typeof CREDIT_PACKS;
export type CreditPack = (typeof CREDIT_PACKS)[PackId];
