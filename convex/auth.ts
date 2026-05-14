import {
  createClient,
  type AuthFunctions,
  type GenericCtx,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { betterAuth } from "better-auth/minimal";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

// Pointeurs vers les mutations internes exportées ci-dessous
const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, betterAuthUser) => {
        const userId = await ctx.db.insert("users", {
          better_auth_user_id: betterAuthUser._id,
          email: betterAuthUser.email,
          name: betterAuthUser.name ?? undefined,
          role: betterAuthUser.email === process.env.ADMIN_EMAIL ? "admin" : "user",
          creditsBalance: 2,
          createdAt: Date.now(),
        });

        await ctx.db.insert("creditTransactions", {
          userId,
          type: "bonus",
          amount: 2,
          balanceAfter: 2,
          description: "Crédits de bienvenue à l'inscription",
          createdAt: Date.now(),
        });
      },

      onUpdate: async (ctx, newDoc) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_better_auth_user_id", (q) =>
            q.eq("better_auth_user_id", newDoc._id)
          )
          .unique();
        if (!user) return;
        await ctx.db.patch(user._id, {
          name: newDoc.name ?? undefined,
          email: newDoc.email,
        });
      },
    },
  },
});

// Requis par @convex-dev/better-auth : expose les mutations internes du composant
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: { enabled: true },
    plugins: [convex({ authConfig })],
  });
