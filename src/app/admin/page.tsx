"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  Users,
  Megaphone,
  MapTrifold,
  TrendUp,
  CurrencyCircleDollar,
  ArrowRight,
} from "@phosphor-icons/react";

export default function AdminPage() {
  const stats = useQuery(api.credits.getUserStats);

  const STATS = [
    { label: "Utilisateurs", value: stats?.totalUsers ?? "—", sub: "comptes créés", Icon: Users, href: "/admin/utilisateurs" },
    { label: "Audits lancés", value: stats?.totalAudits ?? "—", sub: "depuis le lancement", Icon: MapTrifold, href: "/admin/crm/leads" },
    { label: "Revenus XOF", value: stats ? stats.totalRevenus.toLocaleString("fr-FR") : "—", sub: "paiements réussis", Icon: CurrencyCircleDollar, href: "/admin/utilisateurs" },
    { label: "En attente", value: stats?.paiementsEnAttente ?? "—", sub: "paiements non confirmés", Icon: TrendUp, href: "/admin/utilisateurs" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-[22px] font-semibold text-charbon mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Vue d&apos;ensemble
        </h2>
        <p className="text-[14px] text-pierre">Bienvenue dans votre espace admin VitrinAI.</p>
      </div>

      {/* Stats live */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(({ label, value, sub, Icon, href }) => (
          <Link
            key={href + label}
            href={href}
            className="bg-white rounded-2xl border border-bordure p-6 flex flex-col gap-4 hover:border-savane/40 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-parchemin flex items-center justify-center">
                <Icon size={20} weight="duotone" className="text-savane" />
              </div>
              <ArrowRight size={16} className="text-argent group-hover:text-savane transition-colors" />
            </div>
            <div>
              <div className="text-[28px] font-bold text-charbon leading-none">{String(value)}</div>
              <div className="text-[13px] text-pierre mt-1">{label}</div>
              <div className="text-[11px] text-argent">{sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-bordure p-6">
        <h3 className="text-[15px] font-semibold text-charbon mb-4">Actions rapides</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/crm/niches"
            className="inline-flex items-center gap-2 bg-savane text-ivoire text-[13px] font-medium px-4 py-2.5 rounded-xl hover:bg-savane-hover transition-colors"
          >
            <MapTrifold size={15} weight="duotone" />
            Créer une niche
          </Link>
          <Link
            href="/admin/campagnes"
            className="inline-flex items-center gap-2 bg-parchemin text-charbon text-[13px] font-medium px-4 py-2.5 rounded-xl hover:bg-sable transition-colors border border-bordure"
          >
            <Megaphone size={15} weight="duotone" />
            Lancer une campagne
          </Link>
        </div>
      </div>

      {/* Empty state placeholder */}
      <div className="bg-white rounded-2xl border border-bordure p-10 text-center">
        <MapTrifold size={40} weight="duotone" className="text-argent mx-auto mb-4" />
        <p className="text-[15px] font-medium text-charbon mb-1">Commencez par créer une niche</p>
        <p className="text-[13px] text-pierre max-w-md mx-auto">
          Une niche définit un secteur + ville à prospecter. L&apos;agent scrape Google Maps, détecte les entreprises sans site,
          et prépare vos messages de prospection.
        </p>
      </div>
    </div>
  );
}
