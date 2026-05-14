"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-parchemin border-b border-bordure">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="VitrinAI"
            width={420}
            height={120}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#comment-ca-marche"
            className="text-[17px] text-olive hover:text-noir transition-colors"
          >
            Comment ça marche
          </Link>
          <Link
            href="#tarifs"
            className="text-[17px] text-olive hover:text-noir transition-colors"
          >
            Tarifs
          </Link>
          <Link
            href="#secteurs"
            className="text-[17px] text-olive hover:text-noir transition-colors"
          >
            Secteurs
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href="/analyses"
                className="hidden sm:block text-[14px] text-olive hover:text-noir transition-colors"
              >
                Mes analyses
              </Link>
              <Link
                href="/credits"
                className="hidden sm:block text-[14px] text-olive hover:text-noir transition-colors"
              >
                Crédits
              </Link>
              <Button size="sm" asChild>
                <Link href="#analyser">Analyser</Link>
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="hidden sm:block text-[14px] text-olive hover:text-noir transition-colors"
              >
                Se connecter
              </Link>
              <Button size="sm" asChild>
                <Link href="#analyser">Analyser mon site</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
