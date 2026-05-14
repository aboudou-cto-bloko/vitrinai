"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn.email({ email, password });
      if (error) {
        toast.error(error.message ?? "Email ou mot de passe incorrect");
        return;
      }
      router.push("/credits");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-parchemin flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-[28px] font-medium text-noir mb-1">Connexion</h1>
          <p className="text-[14px] text-olive">Accédez à vos crédits VitrinAI</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-bordure p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[13px] font-medium text-charbon" htmlFor="email">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-bordure text-[14px] text-charbon bg-white focus:outline-none focus:ring-2 focus:ring-savane/30 focus:border-savane transition-colors"
              placeholder="vous@exemple.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-charbon" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-bordure text-[14px] text-charbon bg-white focus:outline-none focus:ring-2 focus:ring-savane/30 focus:border-savane transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-savane text-white text-[14px] font-medium hover:bg-savane/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-[13px] text-olive mt-4">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-savane font-medium hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
