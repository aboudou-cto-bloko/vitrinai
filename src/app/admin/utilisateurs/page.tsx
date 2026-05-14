"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export default function UtilisateursPage() {
  const users = useQuery(api.credits.listUsers);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-semibold text-charbon mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Utilisateurs
        </h2>
        <p className="text-[13px] text-pierre">{users?.length ?? "—"} comptes enregistrés</p>
      </div>

      <div className="bg-white rounded-2xl border border-bordure overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-parchemin border-b border-bordure">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-pierre">Email</th>
              <th className="text-left px-5 py-3 font-medium text-pierre">Nom</th>
              <th className="text-left px-5 py-3 font-medium text-pierre">Rôle</th>
              <th className="text-right px-5 py-3 font-medium text-pierre">Crédits</th>
              <th className="text-left px-5 py-3 font-medium text-pierre">Inscrit le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bordure">
            {!users && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-pierre">
                  Chargement…
                </td>
              </tr>
            )}
            {users?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-pierre">
                  Aucun utilisateur
                </td>
              </tr>
            )}
            {(users as Array<{ _id: string; email: string; name?: string; role: string; creditsBalance: number; createdAt: number }> | undefined)?.map((u) => (
              <tr key={u._id} className="hover:bg-parchemin/50 transition-colors">
                <td className="px-5 py-3 text-charbon font-medium">{u.email}</td>
                <td className="px-5 py-3 text-olive">{u.name ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    u.role === "admin"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-[#e8f5ee] text-savane border border-savane/20"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-semibold text-charbon">
                  {u.creditsBalance}
                </td>
                <td className="px-5 py-3 text-pierre">
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
