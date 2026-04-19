import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  Produit: ["Comment ça marche", "Tarifs", "Secteurs", "Rapport d'audit"],
  Secteurs: ["Restaurants", "Cliniques", "Hôtels", "Salons de beauté"],
  "À propos": ["RendezApp", "Contact", "Blog"],
};

export function FooterSection() {
  return (
    <footer className="bg-noir border-t border-noir-eleve">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <Image
                src="/icon.svg"
                alt=""
                width={56}
                height={56}
                className="h-25 w-auto object-contain"
              />
              <span className="font-serif text-[22px] font-medium text-ivoire">
                VitrinAI
              </span>
            </Link>
            <p className="text-[14px] text-argent leading-[1.60]">
              Le bilan de santé digitale de votre entreprise — en 30 secondes,
              gratuitement.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="text-[13px] font-medium text-ivoire tracking-[0.5px] uppercase mb-4">
                {section}
              </p>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-[15px] text-argent hover:text-ivoire transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-noir-eleve pt-8">
          <p className="text-[13px] text-[#5e5d59]">
            © 2026 VitrinAI · Cotonou, Bénin
          </p>
        </div>
      </div>
    </footer>
  );
}
