import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChartBar,
  Users,
  Megaphone,
  MagnifyingGlass,
  Gear,
  MapTrifold,
} from "@phosphor-icons/react/dist/ssr";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble", Icon: ChartBar },
  { href: "/admin/utilisateurs", label: "Utilisateurs", Icon: Users },
  { href: "/admin/crm/niches", label: "Niches", Icon: MapTrifold },
  { href: "/admin/crm/leads", label: "Leads", Icon: Users },
  { href: "/admin/crm/kanban", label: "Kanban", Icon: MagnifyingGlass },
  { href: "/admin/campagnes", label: "Campagnes", Icon: Megaphone },
  { href: "/admin/settings", label: "Paramètres", Icon: Gear },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await fetchAuthQuery(api.credits.getMe);

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-parchemin">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-noir flex flex-col border-r border-bordure-sombre">
        <div className="h-16 flex items-center px-5 border-b border-bordure-sombre">
          <Link href="/">
            <Image src="/logo.svg" alt="VitrinAI" width={100} height={28} />
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-argent hover:text-ivoire hover:bg-noir-eleve transition-colors"
            >
              <Icon size={17} weight="duotone" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-bordure-sombre">
          <p className="text-[11px] text-pierre">{user.email}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-bordure flex items-center px-8">
          <h1 className="text-[14px] font-medium text-charbon">Dashboard</h1>
        </header>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
