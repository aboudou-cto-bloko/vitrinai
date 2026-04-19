import {
  ForkKnife,
  FirstAid,
  Buildings,
  Scissors,
  Student,
  ShoppingBag,
  Scales,
  Car,
  Pill,
  Coffee,
} from "@phosphor-icons/react/dist/ssr";

const sectors = [
  { Icon: ForkKnife, label: "Restaurants" },
  { Icon: FirstAid, label: "Cliniques" },
  { Icon: Buildings, label: "Hôtels" },
  { Icon: Scissors, label: "Salons" },
  { Icon: Student, label: "Écoles" },
  { Icon: ShoppingBag, label: "Boutiques" },
  { Icon: Scales, label: "Cabinets" },
  { Icon: Car, label: "Garages" },
  { Icon: Pill, label: "Pharmacies" },
  { Icon: Coffee, label: "Maquis" },
];

export function SectorsSection() {
  return (
    <section id="secteurs" className="bg-parchemin py-20">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <h2 className="font-serif text-[36px] font-medium text-noir mb-4">
          Fait pour les entreprises de votre secteur
        </h2>
        <p className="text-[17px] text-olive mb-10 max-w-[480px] mx-auto leading-[1.60]">
          Restaurants, cliniques, hôtels, salons — VitrinAI comprend les spécificités de chaque métier en zone UEMOA.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {sectors.map(({ Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-white border border-bordure-forte rounded-full px-5 py-2.5 text-[15px] font-medium text-charbon hover:border-savane hover:text-savane transition-colors cursor-default"
            >
              <Icon weight="duotone" className="w-4 h-4" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <p className="text-[15px] text-olive">
          Et tous les secteurs d&apos;activité en zone UEMOA
        </p>
      </div>
    </section>
  );
}
